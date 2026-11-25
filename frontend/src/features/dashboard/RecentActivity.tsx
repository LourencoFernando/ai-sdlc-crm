import { Link } from 'react-router';
import type { Dashboard } from '../../api/types';
import { EmptyState } from '../../components/EmptyState';
import { formatDate, relativeDay } from '../../lib/format';
import { KindBadge } from '../activities/Timeline';

/** The 10 newest activities and stage changes, each linking to its record (B7). */
export function RecentActivity({ data }: { data: Dashboard }) {
  return (
    <section className="panel" aria-labelledby="recent-title">
      <div className="panel-head">
        <h2 className="panel-title" id="recent-title">
          Recent activity
        </h2>
      </div>
      {data.recent.length === 0 ? (
        <EmptyState title="Nothing logged yet" />
      ) : (
        <ol className="recent-list">
          {data.recent.map((a) => {
            const link = a.deal
              ? { to: `/deals/${a.deal.id}`, name: a.deal.name }
              : a.contact && { to: `/contacts/${a.contact.id}`, name: a.contact.name };
            return (
              <li key={a.id} className="recent-entry">
                <KindBadge kind={a.kind} />
                <div className="recent-body">
                  <p className="truncate">{a.description}</p>
                  {link && (
                    <Link to={link.to} className="small">
                      {link.name}
                    </Link>
                  )}
                </div>
                <time className="muted small nowrap" dateTime={a.occurredOn}>
                  {relativeDay(a.occurredOn, data.today) ?? formatDate(a.occurredOn, data.today)}
                </time>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
