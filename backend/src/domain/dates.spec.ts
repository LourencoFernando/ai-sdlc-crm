import { addDays, isCalendarDate, lastMonths, monthKey, previousMonth, localToday } from './dates';

describe('calendar dates', () => {
  it('accepts only real YYYY-MM-DD dates', () => {
    expect(isCalendarDate('2026-11-20')).toBe(true);
    expect(isCalendarDate('2024-02-29')).toBe(true);
    expect(isCalendarDate('2026-02-29')).toBe(false);
    expect(isCalendarDate('2026-13-01')).toBe(false);
    expect(isCalendarDate('2026-11-20T00:00:00Z')).toBe(false);
    expect(isCalendarDate('20-11-2026')).toBe(false);
    expect(isCalendarDate(undefined)).toBe(false);
  });

  it('adds days across month and year ends', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-11-20', 7)).toBe('2026-11-27');
  });

  it('gives month keys and the previous month', () => {
    expect(monthKey('2026-11-20')).toBe('2026-11');
    expect(previousMonth('2026-01')).toBe('2025-12');
    expect(previousMonth('2026-11')).toBe('2026-10');
  });

  it('lists the last 12 months ending with the current one', () => {
    const months = lastMonths('2026-01-01', 12);
    expect(months).toHaveLength(12);
    expect(months[0]).toBe('2025-02');
    expect(months[11]).toBe('2026-01');
  });

  it('reads today from the local clock, not UTC', () => {
    // 23:30 local on Nov 20 is still Nov 20, whatever UTC says.
    expect(localToday(new Date(2026, 10, 20, 23, 30))).toBe('2026-11-20');
    expect(localToday(new Date(2026, 10, 21, 0, 5))).toBe('2026-11-21');
  });
});
