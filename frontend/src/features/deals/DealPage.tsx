import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { Plus } from 'lucide-react';
import { api, keys } from '../../api/endpoints';
import { Fact, RecordHeader, RecordState } from '../../components/RecordPage';
import { Button } from '../../components/Button';
import { Avatar } from '../../components/Avatar';
import { LatePill, StagePill } from '../../components/Pills';
import { Money } from '../../components/Money';
import { DateText } from '../../components/DateText';
import { EmptyState } from '../../components/EmptyState';
import { PanelSkeleton } from '../../components/Skeleton';
import { useForms } from '../../app/forms';
import { isLate, todayLocal } from '../../lib/dates';
import { formatPercent } from '../../lib/format';
import { STAGE_LABEL } from '../../lib/stages';
import { Timeline } from '../activities/Timeline';

export function DealPage() {
  const id = Number(useParams().id);
  const { data: deal, error } = useQuery({ queryKey: keys.deal(id), queryFn: () => api.deal(id) });
  const timeline = useQuery({ queryKey: keys.dealTimeline(id), queryFn: () => api.dealTimeline(id), enabled: !!deal });
  const contacts = useQuery({ queryKey: keys.contacts, queryFn: api.contacts, enabled: !!deal?.contactId });
  const forms = useForms();
  const today = todayLocal();
  if (!deal) return <RecordState error={error} what="deal" />;
  const late = isLate(deal, today);
  const contact = contacts.data?.find((c) => c.id === deal.contactId);

  return (
    <div className="page stack">
      <div>
        <RecordHeader
          back={{ to: '/deals', label: 'Deals' }}
          title={deal.name}
          pills={
            <>
              <StagePill stage={deal.stage} />
              {late && <LatePill />}
            </>
          }
          onEdit={() => forms.openDeal(deal)}
          onDelete={() => forms.confirmDelete({ kind: 'deal', record: deal })}
        >
          <div className="facts">
            <Fact label="Organization">
              <Link to={`/organizations/${deal.organization.id}`}>{deal.organization.name}</Link>
            </Fact>
            <Fact label="Main contact">
              {deal.contact ? <Link to={`/contacts/${deal.contact.id}`}>{deal.contact.name}</Link> : <span className="muted">No main contact</span>}
            </Fact>
            <Fact label="Value">
              <Money value={deal.value} />
            </Fact>
            <Fact label="Probability">{formatPercent(deal.probability)}</Fact>
            <Fact label="Expected revenue">
              <Money value={(deal.value * deal.probability) / 100} />
            </Fact>
            <Fact label={deal.stage === 'won' || deal.stage === 'lost' ? 'Closed on' : 'Expected close'}>
              <DateText date={deal.closeDate} late={late} />
            </Fact>
          </div>
        </RecordHeader>
      </div>
      <div className="record-columns">
        <section className="panel" aria-labelledby="deal-people">
          <div className="panel-head">
            <h2 className="panel-title" id="deal-people">
              Main contact
            </h2>
          </div>
          {deal.contact ? (
            <div className="link-list">
              <div className="link-row">
                <Avatar name={deal.contact.name} large />
                <div className="grow">
                  <Link to={`/contacts/${deal.contact.id}`}>{deal.contact.name}</Link>
                  <span className="muted small truncate" style={{ display: 'block' }}>
                    {[contact?.jobTitle, deal.organization.name].filter(Boolean).join(' at ')}
                  </span>
                  {contact?.email && (
                    <a className="small" href={`mailto:${contact.email}`}>
                      {contact.email}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState title="No main contact">
              <Button size="sm" onClick={() => forms.openDeal(deal)}>
                Choose a contact
              </Button>
            </EmptyState>
          )}
          <p className="muted small" style={{ marginTop: 16 }}>
            {STAGE_LABEL[deal.stage]} stage · {formatPercent(deal.probability)} probability of close
          </p>
        </section>
        <section className="panel" aria-labelledby="deal-timeline">
          <div className="panel-head">
            <h2 className="panel-title" id="deal-timeline">
              Timeline
            </h2>
            <Button
              size="sm"
              variant="primary"
              onClick={() => forms.openActivity({ target: { deal: { id: deal.id, name: deal.name, contact: deal.contact } } })}
            >
              <Plus aria-hidden="true" /> Log activity
            </Button>
          </div>
          {timeline.data ? <Timeline activities={timeline.data} today={today} on="deal" /> : <PanelSkeleton rows={4} />}
        </section>
      </div>
    </div>
  );
}
