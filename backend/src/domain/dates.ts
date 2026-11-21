/**
 * Calendar dates are YYYY-MM-DD strings with no time zone. Comparing two of them as
 * strings gives their order, so no Date objects are needed outside this file.
 */
export type CalendarDate = string;

const PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isCalendarDate(value: unknown): value is CalendarDate {
  if (typeof value !== 'string') return false;
  const m = PATTERN.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

function toUtc(date: CalendarDate): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUtc(date: Date): CalendarDate {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  const d = toUtc(date);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUtc(d);
}

/** Whole days from `a` to `b` (positive when `b` is later). */
export function daysBetween(a: CalendarDate, b: CalendarDate): number {
  return Math.round((toUtc(b).getTime() - toUtc(a).getTime()) / 86_400_000);
}

export function monthKey(date: CalendarDate): string {
  return date.slice(0, 7);
}

export function previousMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}

/** The `count` month keys ending with the month of `today`, oldest first. */
export function lastMonths(today: CalendarDate, count: number): string[] {
  const months = [monthKey(today)];
  while (months.length < count) months.unshift(previousMonth(months[0]));
  return months;
}

/** Today's date on this computer's clock. */
export function localToday(now: Date = new Date()): CalendarDate {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
