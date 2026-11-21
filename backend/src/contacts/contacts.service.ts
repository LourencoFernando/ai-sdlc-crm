import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiError } from '../common/api-error';
import { contactDeleteEffect } from '../domain/delete-effects';
import { dealListInclude, toDealView } from '../common/views';
import { CONTACT_STATUSES, ContactStatus, CreateContactDto, UpdateContactDto } from './contact.dto';

const orgSelect = { organization: { select: { id: true, name: true } } } as const;
type Db = Pick<PrismaService, 'contact' | 'deal' | 'organization'>;

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(status?: string) {
    if (status !== undefined && status !== '' && !CONTACT_STATUSES.includes(status as ContactStatus)) {
      throw ApiError.invalid({ status: 'Choose lead, qualified or customer' });
    }
    return this.prisma.contact.findMany({
      where: status ? { status } : undefined,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }, { id: 'asc' }],
      include: orgSelect,
    });
  }

  async get(id: number) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      include: {
        ...orgSelect,
        deals: { orderBy: [{ closeDate: 'asc' }, { id: 'asc' }], include: dealListInclude },
      },
    });
    if (!contact) throw ApiError.notFound('Contact');
    return { ...contact, deals: contact.deals.map(toDealView) };
  }

  async create(dto: CreateContactDto) {
    await this.checkEmail(this.prisma, dto.email);
    await this.checkOrganization(this.prisma, dto.organizationId);
    return this.prisma.contact.create({ data: { ...dto, status: dto.status ?? 'lead' }, include: orgSelect });
  }

  async update(id: number, dto: UpdateContactDto) {
    const { confirmUnlink, ...data } = dto;
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.contact.findUnique({ where: { id } });
      if (!current) throw ApiError.notFound('Contact');
      await this.checkEmail(tx, data.email, id);
      if (data.organizationId !== undefined && data.organizationId !== current.organizationId) {
        await this.checkOrganization(tx, data.organizationId);
        const deals = await this.dealsLosingContact(tx, id, data.organizationId);
        if (deals.length > 0 && !confirmUnlink) {
          throw ApiError.conflict(
            `Moving ${current.firstName} ${current.lastName} to another organization removes them from ${plural(deals.length, 'deal')}.`,
            { deals },
          );
        }
        await tx.deal.updateMany({ where: { id: { in: deals.map((d) => d.id) } }, data: { contactId: null } });
      }
      return tx.contact.update({ where: { id }, data, include: orgSelect });
    });
  }

  async organizationChangePreview(id: number, organizationId: number | null) {
    await this.mustExist(id);
    return { deals: await this.dealsLosingContact(this.prisma, id, organizationId) };
  }

  async deletePreview(id: number) {
    await this.mustExist(id);
    const effect = await this.effect(this.prisma, id);
    return {
      activitiesToDelete: effect.activitiesToDelete.length,
      activitiesToKeep: effect.activitiesToKeep.length,
      dealsToUnlink: effect.dealsToUnlink.length,
    };
  }

  async delete(id: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      if (!(await tx.contact.findUnique({ where: { id }, select: { id: true } }))) throw ApiError.notFound('Contact');
      const effect = await this.effect(tx, id);
      await tx.activity.deleteMany({ where: { id: { in: effect.activitiesToDelete } } });
      await tx.activity.updateMany({ where: { id: { in: effect.activitiesToKeep } }, data: { contactId: null } });
      await tx.deal.updateMany({ where: { id: { in: effect.dealsToUnlink } }, data: { contactId: null } });
      await tx.contact.delete({ where: { id } });
    });
  }

  /** The deals that would lose this contact as main contact if it moved to `organizationId`. */
  private dealsLosingContact(db: Db, id: number, organizationId: number | null) {
    return db.deal.findMany({
      where: { contactId: id, ...(organizationId === null ? {} : { organizationId: { not: organizationId } }) },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  private async effect(db: Pick<PrismaService, 'activity' | 'deal'>, id: number) {
    const [activities, deals] = await Promise.all([
      db.activity.findMany({ where: { contactId: id }, select: { id: true, dealId: true } }),
      db.deal.findMany({ where: { contactId: id }, select: { id: true } }),
    ]);
    return contactDeleteEffect({ activities, dealIdsAsMainContact: deals.map((d) => d.id) });
  }

  /** Emails are unique ignoring case; they're saved in lowercase. */
  private async checkEmail(db: Db, email: string | null | undefined, exceptId?: number): Promise<void> {
    if (!email) return;
    const owner = await db.contact.findFirst({
      where: { email, ...(exceptId ? { id: { not: exceptId } } : {}) },
      select: { firstName: true, lastName: true },
    });
    if (owner) {
      const message = `Already used by ${owner.firstName} ${owner.lastName}`;
      throw ApiError.conflict(message, { fields: { email: message } });
    }
  }

  private async checkOrganization(db: Db, organizationId: number | null | undefined): Promise<void> {
    if (organizationId === null || organizationId === undefined) return;
    if (!(await db.organization.findUnique({ where: { id: organizationId }, select: { id: true } }))) {
      throw ApiError.invalid({ organizationId: 'Choose an organization from the list' });
    }
  }

  private async mustExist(id: number): Promise<void> {
    if (!(await this.prisma.contact.findUnique({ where: { id }, select: { id: true } }))) {
      throw ApiError.notFound('Contact');
    }
  }
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}
