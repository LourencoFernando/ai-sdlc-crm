import { describe, expect, it } from 'vitest';
import { followUpLabel, formatDate, formatMoney, formatMoneyShort, formatPercent, initials, relativeDay } from './format';

describe('formatting', () => {
  it('shows money in whole US dollars with the currency', () => {
    expect(formatMoney(12500)).toBe('USD 12,500');
    expect(formatMoney(0)).toBe('USD 0');
    expect(formatMoney(348175.4)).toBe('USD 348,175');
  });

  it('shows the short form for charts and columns', () => {
    expect(formatMoneyShort(1_200_000)).toBe('USD 1.2M');
    expect(formatMoneyShort(85_000)).toBe('USD 85K');
    expect(formatMoneyShort(186_000)).toBe('USD 186K');
    expect(formatMoneyShort(900)).toBe('USD 900');
  });

  it('shows dates as Nov 20, 2026, dropping the year when it is this year', () => {
    expect(formatDate('2026-11-20')).toBe('Nov 20, 2026');
    expect(formatDate('2026-11-20', '2026-01-03')).toBe('Nov 20');
    expect(formatDate('2027-01-15', '2026-11-20')).toBe('Jan 15, 2027');
  });

  it('says Today, Tomorrow and 3 days overdue', () => {
    expect(relativeDay('2026-11-20', '2026-11-20')).toBe('Today');
    expect(relativeDay('2026-11-21', '2026-11-20')).toBe('Tomorrow');
    expect(relativeDay('2026-11-25', '2026-11-20')).toBeNull();
    expect(followUpLabel('2026-11-17', '2026-11-20')).toBe('3 days overdue');
    expect(followUpLabel('2026-11-19', '2026-11-20')).toBe('1 day overdue');
    expect(followUpLabel('2026-11-17', '2026-11-20', true)).toBe('Nov 17');
    expect(followUpLabel('2026-12-01', '2026-11-30')).toBe('Tomorrow');
  });

  it('shows percentages', () => {
    expect(formatPercent(75)).toBe('75%');
  });

  it('makes initials', () => {
    expect(initials('Dana Reyes')).toBe('DR');
    expect(initials('Cher')).toBe('C');
  });
});
