import { describe, expect, it } from 'vitest';
import { addDays, followUpStatus, isLate, todayLocal } from './dates';

describe('dates', () => {
  const today = '2026-11-20';

  it('is due soon from today to 7 days ahead', () => {
    expect(followUpStatus({ followUpOn: today, done: false }, today)).toBe('due_soon');
    expect(followUpStatus({ followUpOn: '2026-11-27', done: false }, today)).toBe('due_soon');
    expect(followUpStatus({ followUpOn: '2026-11-28', done: false }, today)).toBe('later');
  });

  it('is overdue from the day after the date, until done', () => {
    expect(followUpStatus({ followUpOn: '2026-11-19', done: false }, today)).toBe('overdue');
    expect(followUpStatus({ followUpOn: '2026-11-19', done: true }, today)).toBe('done');
    expect(followUpStatus({ followUpOn: null, done: false }, today)).toBeNull();
  });

  it('handles month and year ends', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2027-03-01', -1)).toBe('2027-02-28');
    expect(followUpStatus({ followUpOn: '2027-01-03', done: false }, '2026-12-27')).toBe('due_soon');
    expect(followUpStatus({ followUpOn: '2026-11-30', done: false }, '2026-12-01')).toBe('overdue');
  });

  it('is late only for open deals past their close date', () => {
    expect(isLate({ stage: 'proposal', closeDate: '2026-11-19' }, today)).toBe(true);
    expect(isLate({ stage: 'proposal', closeDate: today }, today)).toBe(false);
    expect(isLate({ stage: 'won', closeDate: '2026-01-01' }, today)).toBe(false);
    expect(isLate({ stage: 'lost', closeDate: '2026-01-01' }, today)).toBe(false);
  });

  it('reads today from the local clock', () => {
    expect(todayLocal(new Date(2026, 10, 20, 23, 59))).toBe('2026-11-20');
  });
});
