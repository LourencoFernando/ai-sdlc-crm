import { addDays, CalendarDate } from './dates';

export type FollowUpStatus = 'overdue' | 'due_soon' | 'later' | 'done';

export const DUE_SOON_DAYS = 7;

/** Due soon from today to 7 days ahead, overdue from the day after its date, until done (A5). */
export function followUpStatus(
  activity: { followUpOn: CalendarDate | null; done: boolean },
  today: CalendarDate,
): FollowUpStatus | null {
  if (!activity.followUpOn) return null;
  if (activity.done) return 'done';
  if (activity.followUpOn < today) return 'overdue';
  if (activity.followUpOn <= addDays(today, DUE_SOON_DAYS)) return 'due_soon';
  return 'later';
}
