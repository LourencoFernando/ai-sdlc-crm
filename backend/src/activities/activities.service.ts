import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiError } from '../common/api-error';
import { resolveToday } from '../common/today';
import { activityInclude, timelineOrder, toActivityView } from '../common/views';
import { CreateActivityDto, UpdateActivityDto } from './activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateActivityDto) {
    const { today, relateToMainContact, ...data } = dto;
    let contactId = data.contactId ?? null;
    const dealId = data.dealId ?? null;

    if (dealId !== null) {
      const deal = await this.prisma.deal.findUnique({ where: { id: dealId }, select: { contactId: true } });
      if (!deal) throw ApiError.invalid({ dealId: 'That deal no longer exists' });
      // No contact given (left out or null) means the deal's main contact, unless that's turned off (A2).
      if (contactId === null && relateToMainContact !== false) contactId = deal.contactId;
    }
    if (contactId !== null && !(await this.prisma.contact.findUnique({ where: { id: contactId }, select: { id: true } }))) {
      throw ApiError.invalid({ contactId: 'That contact no longer exists' });
    }
    if (contactId === null && dealId === null) {
      throw ApiError.invalid({ contactId: 'Relate the activity to a contact or a deal' });
    }

    const followUpOn = data.followUpOn ?? null;
    const activity = await this.prisma.activity.create({
      data: {
        kind: data.kind,
        description: data.description,
        occurredOn: data.occurredOn ?? resolveToday(today),
        followUpOn,
        done: followUpOn ? (data.done ?? false) : false,
        contactId,
        dealId,
      },
      include: activityInclude,
    });
    return toActivityView(activity);
  }

  async update(id: number, dto: UpdateActivityDto) {
    const current = await this.editable(id, 'edited');
    const followUpOn = dto.followUpOn !== undefined ? dto.followUpOn : current.followUpOn;
    if (dto.done === true && !followUpOn) {
      throw ApiError.invalid({ done: 'Only a follow-up can be marked done' });
    }
    const activity = await this.prisma.activity.update({
      where: { id },
      data: { ...dto, followUpOn, done: followUpOn ? (dto.done ?? current.done) : false },
      include: activityInclude,
    });
    return toActivityView(activity);
  }

  async delete(id: number): Promise<void> {
    await this.editable(id, 'deleted');
    await this.prisma.activity.delete({ where: { id } });
  }

  /** Activities and stage changes for a contact, newest first (A3). */
  async contactTimeline(contactId: number) {
    if (!(await this.prisma.contact.findUnique({ where: { id: contactId }, select: { id: true } }))) {
      throw ApiError.notFound('Contact');
    }
    return this.timeline({ contactId });
  }

  async dealTimeline(dealId: number) {
    if (!(await this.prisma.deal.findUnique({ where: { id: dealId }, select: { id: true } }))) {
      throw ApiError.notFound('Deal');
    }
    return this.timeline({ dealId });
  }

  private async timeline(where: { contactId?: number; dealId?: number }) {
    const rows = await this.prisma.activity.findMany({ where, orderBy: [...timelineOrder], include: activityInclude });
    return rows.map(toActivityView);
  }

  /** Stage changes are system entries: they can't be edited or deleted on their own. */
  private async editable(id: number, action: 'edited' | 'deleted') {
    const activity = await this.prisma.activity.findUnique({ where: { id } });
    if (!activity) throw ApiError.notFound('Activity');
    if (activity.kind === 'stage_change') throw ApiError.conflict(`Stage changes can't be ${action}`);
    return activity;
  }
}
