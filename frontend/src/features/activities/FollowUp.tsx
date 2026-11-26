import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/endpoints';
import type { Activity } from '../../api/types';
import { followUpStatus } from '../../lib/dates';
import { followUpLabel, formatDate, relativeDay } from '../../lib/format';
import { refreshAll } from '../../app/query-client';
import { useToast } from '../../app/toasts';

/** The follow-up's date as a pill: "Due today", "Due Nov 24", "3 days overdue", "Done · Nov 17" (A3, A5). */
export function followUpPillText(activity: Pick<Activity, 'followUpOn' | 'done'>, today: string): string | null {
  const status = followUpStatus(activity, today);
  if (!status || !activity.followUpOn) return null;
  const date = activity.followUpOn;
  if (status === 'overdue') return followUpLabel(date, today);
  if (status === 'done') return `Done · ${formatDate(date, today)}`;
  const when = relativeDay(date, today);
  if (status === 'due_soon') return when ? `Due ${when.toLowerCase()}` : `Due ${formatDate(date, today)}`;
  return `Follow up ${formatDate(date, today)}`;
}

export function FollowUpPill({ activity, today }: { activity: Activity; today: string }) {
  const status = followUpStatus(activity, today);
  const text = followUpPillText(activity, today);
  if (!status || !text) return null;
  const cls = { overdue: 'pill-overdue', due_soon: 'pill-soon', later: 'pill-later', done: 'pill-done' }[status];
  return <span className={`pill ${cls}`}>{text}</span>;
}

/** Marks a follow-up done, or not done again (A6). */
export function FollowUpCheckbox({ activity, id }: { activity: Activity; id?: string }) {
  const client = useQueryClient();
  const toast = useToast();
  const [pending, setPending] = useState<boolean | null>(null);
  const checked = pending ?? activity.done;

  async function toggle(done: boolean) {
    setPending(done);
    try {
      await api.updateActivity(activity.id, { done });
      await refreshAll(client);
      toast(done ? 'Follow-up marked done' : 'Follow-up marked not done');
    } catch {
      toast("Couldn't update the follow-up. Try again.", 'error');
    } finally {
      setPending(null);
    }
  }

  return (
    <input
      id={id}
      type="checkbox"
      className="checkbox"
      checked={checked}
      onChange={(e) => toggle(e.target.checked)}
      aria-label={`${checked ? 'Mark not done' : 'Mark done'}: ${activity.description}`}
    />
  );
}
