/**
 * Calendar dates are YYYY-MM-DD strings, read and compared without time zones.
 * These mirror the backend's rules so the screen can update straight away.
 */
export type CalendarDate = string;

export function todayLocal(now: Date = new Date()): CalendarDate {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

function toUtc(date: CalendarDate): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  return new Date(toUtc(date) + days * 86_400_000).toISOString().slice(0, 10);
}

/** Whole days from `a` to `b`, positive when `b` is later. */
export function daysBetween(a: CalendarDate, b: CalendarDate): number {
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
}

export type FollowUpStatus = 'overdue' | 'due_soon' | 'later' | 'done';

/** Due soon from today to 7 days ahead, overdue from the day after its date, until done (A5). */
export function followUpStatus(
  a: { followUpOn: CalendarDate | null; done: boolean },
  today: CalendarDate,
): FollowUpStatus | null {
  if (!a.followUpOn) return null;
  if (a.done) return 'done';
  if (a.followUpOn < today) return 'overdue';
  if (a.followUpOn <= addDays(today, 7)) return 'due_soon';
  return 'later';
}

const OPEN = ['new', 'qualified', 'proposal', 'negotiation'];

/** Open and past its close date (D4). */
export function isLate(deal: { stage: string; closeDate: CalendarDate }, today: CalendarDate): boolean {
  return OPEN.includes(deal.stage) && deal.closeDate < today;
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}
