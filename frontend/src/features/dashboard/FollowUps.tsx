import { useState } from 'react';
import { Link } from 'react-router';
import type { Activity, Dashboard } from '../../api/types';
import { EmptyState } from '../../components/EmptyState';
import { FollowUpCheckbox, FollowUpPill } from '../activities/FollowUp';

type Tab = 'overdue' | 'dueSoon';

/** Overdue (oldest first) and due soon (soonest first), each with its checkbox (B6, A6). */
export function FollowUps({ data }: { data: Dashboard }) {
  const { overdue, dueSoon } = data.followUps;
  const [tab, setTab] = useState<Tab>(overdue.length > 0 ? 'overdue' : 'dueSoon');
  const list = tab === 'overdue' ? overdue : dueSoon;
  return (
    <section className="panel follow-ups" aria-labelledby="follow-ups-title">
      <div className="panel-head">
        <h2 className="panel-title" id="follow-ups-title">
          Follow-ups
        </h2>
      </div>
      <div className="segmented" role="tablist" aria-label="Follow-ups">
        <button type="button" role="tab" className="segment" aria-selected={tab === 'overdue'} onClick={() => setTab('overdue')}>
          Overdue · {overdue.length}
        </button>
        <button type="button" role="tab" className="segment" aria-selected={tab === 'dueSoon'} onClick={() => setTab('dueSoon')}>
          Due soon · {dueSoon.length}
        </button>
      </div>
      <ul className="follow-up-list" role="tabpanel" aria-label={tab === 'overdue' ? 'Overdue' : 'Due soon'}>
        {list.length === 0 && (
          <li className="follow-up-card">
            <EmptyState title={tab === 'overdue' ? 'Nothing overdue' : 'Nothing due in the next 7 days'} />
          </li>
        )}
        {list.map((a) => (
          <FollowUpCard key={a.id} activity={a} today={data.today} />
        ))}
      </ul>
    </section>
  );
}

function FollowUpCard({ activity, today }: { activity: Activity; today: string }) {
  const link = activity.deal ? { to: `/deals/${activity.deal.id}`, name: activity.deal.name } : activity.contact && { to: `/contacts/${activity.contact.id}`, name: activity.contact.name };
  return (
    <li className="follow-up-card">
      <FollowUpCheckbox activity={activity} />
      <div className="follow-up-body">
        <p>{activity.description}</p>
        <p className="follow-up-meta">
          <FollowUpPill activity={activity} today={today} />
          {link && <Link to={link.to}>{link.name}</Link>}
        </p>
      </div>
    </li>
  );
}
