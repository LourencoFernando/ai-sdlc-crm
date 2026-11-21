import { followUpStatus } from './follow-ups';

const today = '2026-11-20';

describe('follow-up status (A5)', () => {
  it('is due soon from today to 7 days ahead', () => {
    expect(followUpStatus({ followUpOn: today, done: false }, today)).toBe('due_soon');
    expect(followUpStatus({ followUpOn: '2026-11-27', done: false }, today)).toBe('due_soon');
    expect(followUpStatus({ followUpOn: '2026-11-28', done: false }, today)).toBe('later');
  });

  it('is overdue from the day after its date', () => {
    expect(followUpStatus({ followUpOn: '2026-11-19', done: false }, today)).toBe('overdue');
  });

  it('handles month and year ends', () => {
    expect(followUpStatus({ followUpOn: '2027-01-02', done: false }, '2026-12-28')).toBe('due_soon');
    expect(followUpStatus({ followUpOn: '2026-11-30', done: false }, '2026-12-01')).toBe('overdue');
  });

  it('is done once marked, and none without a date', () => {
    expect(followUpStatus({ followUpOn: '2026-11-01', done: true }, today)).toBe('done');
    expect(followUpStatus({ followUpOn: null, done: false }, today)).toBeNull();
  });
});
