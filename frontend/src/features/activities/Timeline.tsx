import { DropdownMenu } from 'radix-ui';
import { Link } from 'react-router';
import { ArrowRight, Mail, MoreHorizontal, Pencil, Phone, StickyNote, Trash2 } from 'lucide-react';
import type { Activity } from '../../api/types';
import { formatDate, relativeDay } from '../../lib/format';
import { EmptyState } from '../../components/EmptyState';
import { useForms } from '../../app/forms';
import { FollowUpCheckbox, FollowUpPill } from './FollowUp';

const ICONS = { note: StickyNote, call: Phone, email: Mail, stage_change: ArrowRight };

export function KindBadge({ kind }: { kind: Activity['kind'] }) {
  const Icon = ICONS[kind];
  return (
    <span className={`badge badge-${kind}`} aria-hidden="true">
      <Icon />
    </span>
  );
}

/**
 * Activities and stage changes, newest first (A3). On a contact's timeline the deal is shown as a
 * link, and on a deal's timeline the contact. Stage changes can't be edited or deleted.
 */
export function Timeline({ activities, today, on }: { activities: Activity[]; today: string; on: 'contact' | 'deal' }) {
  const forms = useForms();
  if (activities.length === 0) {
    return <EmptyState title="Nothing logged yet">Log a call, an email or a note to start the timeline.</EmptyState>;
  }
  return (
    <ol className="timeline" aria-label="Timeline">
      {activities.map((a) => {
        const other = on === 'contact' ? a.deal : a.contact;
        const otherPath = on === 'contact' ? '/deals' : '/contacts';
        return (
          <li key={a.id} className="timeline-entry">
            <KindBadge kind={a.kind} />
            <div className="timeline-body">
              <p className="timeline-text">{a.description}</p>
              <p className="timeline-meta">
                <time dateTime={a.occurredOn}>{relativeDay(a.occurredOn, today) ?? formatDate(a.occurredOn, today)}</time>
                {other && (
                  <>
                    <span aria-hidden="true">·</span>
                    <Link to={`${otherPath}/${other.id}`}>{other.name}</Link>
                  </>
                )}
              </p>
              {a.followUpOn && (
                <div className="timeline-follow">
                  <label className="checkbox-row small">
                    <FollowUpCheckbox activity={a} />
                    Follow-up
                  </label>
                  <FollowUpPill activity={a} today={today} />
                </div>
              )}
            </div>
            {a.kind !== 'stage_change' && (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button type="button" className="icon-btn" aria-label={`Actions for ${a.description}`}>
                    <MoreHorizontal aria-hidden="true" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content className="menu" align="end" sideOffset={4}>
                    <DropdownMenu.Item className="menu-item" onSelect={() => forms.openActivity({ record: a })}>
                      <Pencil aria-hidden="true" /> Edit
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="menu-item danger"
                      onSelect={() => forms.confirmDelete({ kind: 'activity', record: a })}
                    >
                      <Trash2 aria-hidden="true" /> Delete
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            )}
          </li>
        );
      })}
    </ol>
  );
}
