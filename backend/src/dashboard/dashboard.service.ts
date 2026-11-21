import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { activityInclude, timelineOrder, toActivityView } from '../common/views';
import { buildDashboard, DashboardDeal } from '../domain/dashboard';
import { CalendarDate } from '../domain/dates';

/** Loads the rows and hands them to the domain, which works out every figure (B1–B8). */
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async get(today: CalendarDate) {
    const [deals, followUps, recent] = await Promise.all([
      this.prisma.deal.findMany({
        select: { id: true, name: true, stage: true, value: true, probability: true, closeDate: true },
      }),
      this.prisma.activity.findMany({
        where: { followUpOn: { not: null }, done: false },
        include: activityInclude,
      }),
      this.prisma.activity.findMany({ orderBy: [...timelineOrder], take: 10, include: activityInclude }),
    ]);
    return buildDashboard({
      deals: deals as DashboardDeal[],
      activities: followUps.map(toActivityView),
      recent: recent.map(toActivityView),
      today,
    });
  }
}
