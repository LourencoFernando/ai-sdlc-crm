import { CalendarDate, lastMonths, monthKey, previousMonth } from './dates';
import { isLate } from './deal-rules';
import { followUpStatus } from './follow-ups';
import { OPEN_STAGES, Stage, STAGE_KEYS, isOpen } from './stages';

export interface DashboardDeal {
  id: number;
  name: string;
  stage: Stage;
  value: number;
  probability: number;
  closeDate: CalendarDate;
}

export interface DashboardActivity {
  id: number;
  kind: string;
  description: string;
  occurredOn: CalendarDate;
  followUpOn: CalendarDate | null;
  done: boolean;
  createdAt: Date;
  contact: { id: number; name: string } | null;
  deal: { id: number; name: string } | null;
}

const FUNNEL_STAGES: Stage[] = ['new', 'qualified', 'proposal', 'negotiation', 'won'];

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const expected = (d: DashboardDeal) => (d.value * d.probability) / 100;
const round2 = (x: number) => Math.round(x * 100) / 100;

/** Newest first by date, then by time created (A3, B7). */
export function newestFirst<T extends { occurredOn: string; createdAt: Date; id: number }>(a: T, b: T): number {
  if (a.occurredOn !== b.occurredOn) return a.occurredOn < b.occurredOn ? 1 : -1;
  const t = b.createdAt.getTime() - a.createdAt.getTime();
  return t !== 0 ? t : b.id - a.id;
}

/**
 * Every dashboard figure (B1–B7), worked out from the rows it's given.
 * `activities` are the ones with a follow-up; `recent` the candidates for recent activity.
 */
export function buildDashboard(input: {
  deals: DashboardDeal[];
  activities: DashboardActivity[];
  recent: DashboardActivity[];
  today: CalendarDate;
}) {
  const { deals, today } = input;
  const thisMonth = monthKey(today);
  const lastMonth = previousMonth(thisMonth);
  const open = deals.filter((d) => isOpen(d.stage));
  const won = deals.filter((d) => d.stage === 'won');
  const lost = deals.filter((d) => d.stage === 'lost');

  const wonIn = (month: string) => won.filter((d) => monthKey(d.closeDate) === month);

  const followUps = input.activities
    .map((a) => ({ ...a, status: followUpStatus(a, today) }))
    .filter((a) => a.status === 'overdue' || a.status === 'due_soon');
  const byDate = (a: DashboardActivity, b: DashboardActivity) =>
    a.followUpOn! < b.followUpOn! ? -1 : a.followUpOn! > b.followUpOn! ? 1 : a.id - b.id;
  const overdue = followUps.filter((a) => a.status === 'overdue').sort(byDate);
  const dueSoon = followUps.filter((a) => a.status === 'due_soon').sort(byDate);

  const headline = {
    wonThisMonth: { value: sum(wonIn(thisMonth).map((d) => d.value)), count: wonIn(thisMonth).length },
    wonLastMonth: { value: sum(wonIn(lastMonth).map((d) => d.value)), count: wonIn(lastMonth).length },
    openPipeline: { value: sum(open.map((d) => d.value)), count: open.length },
    expectedRevenue: Math.round(sum(open.map(expected))),
    overdueFollowUps: overdue.length,
    lateDeals: open.filter((d) => isLate(d, today)).length,
  };

  const months = lastMonths(today, 12).map((month) => ({
    month,
    revenueWon: sum(wonIn(month).map((d) => d.value)),
    won: wonIn(month).length,
    lost: lost.filter((d) => monthKey(d.closeDate) === month).length,
  }));
  const yearTotals = { revenueWon: sum(months.map((m) => m.revenueWon)), won: sum(months.map((m) => m.won)) };

  // A deal at a stage has passed every stage before it, so each step counts it and the ones beyond.
  const stageIndex = (s: Stage) => STAGE_KEYS.indexOf(s);
  const funnel = FUNNEL_STAGES.map((stage) => {
    const reached = deals.filter((d) => d.stage !== 'lost' && stageIndex(d.stage) >= stageIndex(stage));
    return { stage, value: sum(reached.map((d) => d.value)), count: reached.length, keptShare: null as number | null };
  });
  funnel.forEach((step, i) => {
    if (i > 0 && funnel[i - 1].value > 0) step.keptShare = Math.round((step.value / funnel[i - 1].value) * 100);
  });

  const openValue = headline.openPipeline.value;
  const pipelineByStage = OPEN_STAGES.map((stage) => {
    const at = open.filter((d) => d.stage === stage);
    const value = sum(at.map((d) => d.value));
    return {
      stage,
      value,
      count: at.length,
      expectedRevenue: Math.round(sum(at.map(expected))),
      share: openValue > 0 ? round2((value / openValue) * 100) : 0,
    };
  });

  const strip = ({ status: _s, ...a }: DashboardActivity & { status?: unknown }) => a;
  const recent = [...input.recent].sort(newestFirst).slice(0, 10);

  return {
    today,
    headline,
    months,
    yearTotals,
    funnel,
    pipelineByStage,
    followUps: { overdue: overdue.map(strip), dueSoon: dueSoon.map(strip) },
    recent,
  };
}

export type Dashboard = ReturnType<typeof buildDashboard>;
