import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { Plus } from 'lucide-react';
import { api, keys } from '../../api/endpoints';
import { Empty, Fact, RecordHeader, RecordState } from '../../components/RecordPage';
import { Button } from '../../components/Button';
import { LatePill, StagePill, StatusPill } from '../../components/Pills';
import { Money } from '../../components/Money';
import { DateText } from '../../components/DateText';
import { EmptyState } from '../../components/EmptyState';
import { PanelSkeleton } from '../../components/Skeleton';
import { useForms } from '../../app/forms';
import { isLate, todayLocal } from '../../lib/dates';
import { Timeline } from '../activities/Timeline';

export function ContactPage() {
  const id = Number(useParams().id);
  const { data: contact, error } = useQuery({ queryKey: keys.contact(id), queryFn: () => api.contact(id) });
  const timeline = useQuery({
    queryKey: keys.contactTimeline(id),
    queryFn: () => api.contactTimeline(id),
    enabled: !!contact,
  });
  const forms = useForms();
  const today = todayLocal();
  if (!contact) return <RecordState error={error} what="contact" />;
  const name = `${contact.firstName} ${contact.lastName}`;

  return (
    <div className="page stack">
      <div>
        <RecordHeader
          back={{ to: '/contacts', label: 'Contacts' }}
          title={name}
          pills={<StatusPill status={contact.status} />}
          onEdit={() => forms.openContact(contact)}
          onDelete={() => forms.confirmDelete({ kind: 'contact', record: contact })}
        >
          <div className="facts">
            <Fact label="Organization">
              {contact.organization ? (
                <Link to={`/organizations/${contact.organization.id}`}>{contact.organization.name}</Link>
              ) : (
                <span className="muted">No organization</span>
              )}
            </Fact>
            <Fact label="Job title">{contact.jobTitle ?? <Empty />}</Fact>
            <Fact label="Email">
              {contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : <Empty />}
            </Fact>
            <Fact label="Phone">{contact.phone ? <span className="num">{contact.phone}</span> : <Empty />}</Fact>
          </div>
        </RecordHeader>
      </div>
      <div className="record-columns">
        <section className="panel" aria-labelledby="contact-deals">
          <div className="panel-head">
            <h2 className="panel-title" id="contact-deals">
              Deals
            </h2>
            {contact.organizationId !== null && (
              <Button
                size="sm"
                onClick={() =>
                  forms.openDeal(undefined, { organizationId: contact.organizationId!, contactId: contact.id })
                }
              >
                <Plus aria-hidden="true" /> New deal
              </Button>
            )}
          </div>
          {contact.deals.length === 0 ? (
            <EmptyState title="Not the main contact on any deal" />
          ) : (
            <div className="link-list">
              {contact.deals.map((d) => (
                <div key={d.id} className="link-row">
                  <div className="grow">
                    <Link to={`/deals/${d.id}`} className="truncate" style={{ display: 'block' }}>
                      {d.name}
                    </Link>
                    <span className="muted small">
                      <Money value={d.value} /> · closes <DateText date={d.closeDate} late={isLate(d, today)} />
                    </span>
                  </div>
                  <span className="cell-pills">
                    {isLate(d, today) && <LatePill />}
                    <StagePill stage={d.stage} />
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="panel" aria-labelledby="contact-timeline">
          <div className="panel-head">
            <h2 className="panel-title" id="contact-timeline">
              Timeline
            </h2>
            <Button
              size="sm"
              variant="primary"
              onClick={() => forms.openActivity({ target: { contact: { id, name } } })}
            >
              <Plus aria-hidden="true" /> Log activity
            </Button>
          </div>
          {timeline.data ? (
            <Timeline activities={timeline.data} today={today} on="contact" />
          ) : (
            <PanelSkeleton rows={4} />
          )}
        </section>
      </div>
    </div>
  );
}
