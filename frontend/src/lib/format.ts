import { CalendarDate, daysBetween } from './dates';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  currencyDisplay: 'code',
  maximumFractionDigits: 0,
});
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

/** `USD 12,500`: whole dollars, always with the currency (G7). */
export function formatMoney(value: number): string {
  return money.format(Math.round(value)).replace(/\s/g, ' ');
}

/** The short form on charts and pipeline columns: `USD 1.2M`, `USD 85K`. */
export function formatMoneyShort(value: number): string {
  return `USD ${compact.format(Math.round(value))}`;
}

/** The number alone, for figures that show the currency separately. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(value));
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `Nov 20, 2026`. With `today`, the year is left out when it's this year (`Nov 20`). */
export function formatDate(date: CalendarDate, today?: CalendarDate): string {
  const [y, m, d] = date.split('-').map(Number);
  const short = `${MONTHS[m - 1]} ${d}`;
  return today && today.slice(0, 4) === date.slice(0, 4) ? short : `${short}, ${y}`;
}

export function formatMonth(month: string): string {
  return MONTHS[Number(month.slice(5, 7)) - 1];
}

export function formatLongDate(date: CalendarDate): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

/** "Today", "Tomorrow", "Yesterday", or null when a plain date reads better. */
export function relativeDay(date: CalendarDate, today: CalendarDate): string | null {
  const days = daysBetween(today, date);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  return null;
}

/** How a follow-up date reads: "Today", "Tomorrow", "3 days overdue", or the date. */
export function followUpLabel(date: CalendarDate, today: CalendarDate, done = false): string {
  const days = daysBetween(today, date);
  if (!done && days < 0) return `${-days} ${-days === 1 ? 'day' : 'days'} overdue`;
  return relativeDay(date, today) ?? formatDate(date, today);
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${formatNumber(n)} ${n === 1 ? one : many}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}
