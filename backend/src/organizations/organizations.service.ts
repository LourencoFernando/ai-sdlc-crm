import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiError } from '../common/api-error';
import { OPEN_STAGES } from '../domain/stages';
import { organizationDeleteEffect } from '../domain/delete-effects';
import { CreateOrganizationDto, UpdateOrganizationDto } from './organization.dto';
import { contactSummarySelect, dealListInclude, toContactSummary, toDealView } from '../common/views';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const rows = await this.prisma.organization.findMany({
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      include: {
        _count: { select: { contacts: true } },
        deals: { where: { stage: { in: OPEN_STAGES } }, select: { value: true } },
      },
    });
    return rows.map(({ _count, deals, ...org }) => ({
      ...org,
      contactCount: _count.contacts,
      openDealCount: deals.length,
      openPipeline: deals.reduce((a, d) => a + d.value, 0),
    }));
  }

  async get(id: number) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        contacts: { orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }], select: contactSummarySelect },
        deals: { orderBy: [{ closeDate: 'asc' }, { id: 'asc' }], include: dealListInclude },
      },
    });
    if (!org) throw ApiError.notFound('Organization');
    return { ...org, contacts: org.contacts.map(toContactSummary), deals: org.deals.map(toDealView) };
  }

  create(dto: CreateOrganizationDto) {
    return this.prisma.organization.create({ data: dto });
  }

  async update(id: number, dto: UpdateOrganizationDto) {
    await this.mustExist(id);
    return this.prisma.organization.update({ where: { id }, data: dto });
  }

  async deletePreview(id: number) {
    await this.mustExist(id);
    const effect = await this.effect(this.prisma, id);
    return { blocked: effect.blocked, deals: effect.blockingDeals, contactsToUnlink: effect.contactsToUnlink.length };
  }

  async delete(id: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      if (!(await tx.organization.findUnique({ where: { id } }))) throw ApiError.notFound('Organization');
      const effect = await this.effect(tx, id);
      if (effect.blocked) {
        throw ApiError.conflict('This organization has deals. Move or delete them first.', {
          deals: effect.blockingDeals,
        });
      }
      await tx.contact.updateMany({ where: { id: { in: effect.contactsToUnlink } }, data: { organizationId: null } });
      await tx.organization.delete({ where: { id } });
    });
  }

  private async effect(db: Pick<PrismaService, 'deal' | 'contact'>, id: number) {
    const [deals, contacts] = await Promise.all([
      db.deal.findMany({ where: { organizationId: id }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      db.contact.findMany({ where: { organizationId: id }, select: { id: true } }),
    ]);
    return organizationDeleteEffect({ deals, contactIds: contacts.map((c) => c.id) });
  }

  private async mustExist(id: number): Promise<void> {
    if (!(await this.prisma.organization.findUnique({ where: { id }, select: { id: true } }))) {
      throw ApiError.notFound('Organization');
    }
  }
}
