import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { ApiError } from '../common/api-error';
import { resolveToday } from '../common/today';
import { dealListInclude, toDealView } from '../common/views';
import { applyDealChange, newDealState, StageChangeEntry } from '../domain/deal-rules';
import { dealDeleteEffect } from '../domain/delete-effects';
import { insertAtTop, planMove } from '../domain/positions';
import { Stage } from '../domain/stages';
import { CreateDealDto, MoveDealDto, UpdateDealDto } from './deal.dto';

type Tx = Prisma.TransactionClient;
const columnOrder = [{ position: 'asc' }, { id: 'asc' }] as const;

@Injectable()
export class DealsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const deals = await this.prisma.deal.findMany({ orderBy: [...columnOrder], include: dealListInclude });
    return deals.map(toDealView);
  }

  async get(id: number) {
    const deal = await this.prisma.deal.findUnique({ where: { id }, include: dealListInclude });
    if (!deal) throw ApiError.notFound('Deal');
    return toDealView(deal);
  }

  /** A new deal takes its stage's probability (D2) and goes to the top of its column (P6). */
  async create(dto: CreateDealDto) {
    const today = resolveToday(dto.today);
    const { today: _t, ...data } = dto;
    const id = await this.prisma.$transaction(async (tx) => {
      await this.checkLinks(tx, data.organizationId, data.contactId ?? null);
      const state = newDealState(data, today);
      const deal = await tx.deal.create({ data: { ...data, ...state, contactId: data.contactId ?? null, position: 0 } });
      await this.writeOrder(tx, deal.stage as Stage, (ids) => insertAtTop(ids, deal.id));
      return deal.id;
    });
    return this.get(id);
  }

  /** A save that changes the stage applies D2, D3 and D7, and puts the deal at the top of its new column. */
  async update(id: number, dto: UpdateDealDto) {
    const today = resolveToday(dto.today);
    const { today: _t, ...data } = dto;
    await this.prisma.$transaction(async (tx) => {
      const current = await tx.deal.findUnique({ where: { id } });
      if (!current) throw ApiError.notFound('Deal');
      const organizationId = data.organizationId ?? current.organizationId;
      const contactId = data.contactId !== undefined ? data.contactId : current.contactId;
      await this.checkLinks(tx, organizationId, contactId);

      const { next, stageChange } = applyDealChange(
        { stage: current.stage as Stage, probability: current.probability, closeDate: current.closeDate },
        { stage: data.stage, probability: data.probability, closeDate: data.closeDate },
        today,
      );
      await tx.deal.update({ where: { id }, data: { ...data, ...next, organizationId, contactId } });
      if (stageChange) {
        await this.recordStageChange(tx, id, stageChange);
        await this.writeOrder(tx, next.stage, (ids) => insertAtTop(ids, id));
        await this.writeOrder(tx, current.stage as Stage, (ids) => ids);
      }
    });
    return this.get(id);
  }

  /**
   * Moves a deal to `index` in a column, in one transaction: renumbers both columns from 0
   * and applies the stage rules only if the stage changed (P4, P13).
   */
  async move(id: number, dto: MoveDealDto) {
    const today = resolveToday(dto.today);
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.deal.findUnique({ where: { id } });
      if (!current) throw ApiError.notFound('Deal');
      const fromStage = current.stage as Stage;
      const sameColumn = fromStage === dto.stage;
      const fromRows = await this.column(tx, fromStage);
      const toRows = sameColumn ? fromRows : await this.column(tx, dto.stage);
      const plan = planMove(
        { from: fromRows.map((r) => r.id), to: toRows.map((r) => r.id), sameColumn },
        id,
        dto.index,
      );

      if (plan.changed) {
        if (!sameColumn) {
          const { next, stageChange } = applyDealChange(
            { stage: fromStage, probability: current.probability, closeDate: current.closeDate },
            { stage: dto.stage },
            today,
          );
          await tx.deal.update({ where: { id }, data: next });
          await this.recordStageChange(tx, id, stageChange!);
        }
        await this.renumber(tx, [...fromRows, ...(sameColumn ? [] : toRows)], plan.from);
        if (!sameColumn) await this.renumber(tx, [...fromRows, ...toRows], plan.to);
      }

      const deal = await tx.deal.findUniqueOrThrow({ where: { id }, include: dealListInclude });
      const columns: Partial<Record<Stage, number[]>> = { [fromStage]: plan.from, [dto.stage]: plan.to };
      return { deal: toDealView(deal), columns };
    });
  }

  async deletePreview(id: number) {
    await this.mustExist(id);
    const effect = await this.effect(this.prisma, id);
    return { activitiesToDelete: effect.activitiesToDelete.length, activitiesToKeep: effect.activitiesToKeep.length };
  }

  async delete(id: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      if (!(await tx.deal.findUnique({ where: { id }, select: { id: true } }))) throw ApiError.notFound('Deal');
      const effect = await this.effect(tx, id);
      await tx.activity.deleteMany({ where: { id: { in: effect.activitiesToDelete } } });
      await tx.activity.updateMany({ where: { id: { in: effect.activitiesToKeep } }, data: { dealId: null } });
      await tx.deal.delete({ where: { id } });
    });
  }

  private column(tx: Tx, stage: Stage) {
    return tx.deal.findMany({ where: { stage }, orderBy: [...columnOrder], select: { id: true, position: true } });
  }

  /** Gives each id its index as position, writing only the rows that change. */
  private async renumber(tx: Tx, rows: { id: number; position: number }[], order: number[]): Promise<void> {
    const current = new Map(rows.map((r) => [r.id, r.position]));
    for (const [position, id] of order.entries()) {
      if (current.get(id) !== position) await tx.deal.update({ where: { id }, data: { position } });
    }
  }

  private async writeOrder(tx: Tx, stage: Stage, reorder: (ids: number[]) => number[]): Promise<void> {
    const rows = await this.column(tx, stage);
    await this.renumber(tx, rows, reorder(rows.map((r) => r.id)));
  }

  private recordStageChange(tx: Tx, dealId: number, entry: StageChangeEntry) {
    return tx.activity.create({
      data: {
        kind: 'stage_change',
        dealId,
        description: entry.description,
        occurredOn: entry.occurredOn,
        fromStage: entry.fromStage,
        toStage: entry.toStage,
      },
    });
  }

  /** The organization must exist, and the main contact must belong to it (D1). */
  private async checkLinks(tx: Tx, organizationId: number, contactId: number | null): Promise<void> {
    const org = await tx.organization.findUnique({ where: { id: organizationId }, select: { id: true, name: true } });
    if (!org) throw ApiError.invalid({ organizationId: 'Choose an organization from the list' });
    if (contactId === null) return;
    const contact = await tx.contact.findUnique({ where: { id: contactId }, select: { organizationId: true } });
    if (!contact || contact.organizationId !== organizationId) {
      throw ApiError.invalid({ contactId: `Choose a contact from ${org.name}` });
    }
  }

  private async effect(db: Pick<PrismaService, 'activity'>, id: number) {
    const activities = await db.activity.findMany({ where: { dealId: id }, select: { id: true, contactId: true } });
    return dealDeleteEffect({ activities });
  }

  private async mustExist(id: number): Promise<void> {
    if (!(await this.prisma.deal.findUnique({ where: { id }, select: { id: true } }))) throw ApiError.notFound('Deal');
  }
}
