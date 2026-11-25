import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { Plus } from 'lucide-react';
import { api, keys } from '../../api/endpoints';
import { Empty, Fact, RecordHeader, RecordState } from '../../components/RecordPage';
import { Button } from '../../components/Button';
import { Avatar } from '../../components/Avatar';
import { LatePill, StagePill, StatusPill } from '../../components/Pills';
import { Money } from '../../components/Money';
import { DateText } from '../../components/DateText';
import { EmptyState } from '../../components/EmptyState';
import { useForms } from '../../app/forms';
import { isLate, todayLocal } from '../../lib/dates';
import { isOpenStage } from '../../lib/stages';
import { websiteHref, websiteLabel } from '../../lib/website';

export function OrganizationPage() {
  const id = Number(useParams().id);
  const { data: org, error } = useQuery({ queryKey: keys.organization(id), queryFn: () => api.organization(id) });
  const forms = useForms();
  const today = todayLocal();
  if (!org) return <RecordState error={error} what="organization" />;

  const open = org.deals.filter((d) => isOpenStage(d.stage));
  return (
    <div className="page stack">
      <div>
        <RecordHeader
          back={{ to: '/organizations', label: 'Organizations' }}
          title={org.name}
          onEdit={() => forms.openOrganization(org)}
          onDelete={() => forms.confirmDelete({ kind: 'organization', record: org })}
        >
          <div className="facts">
            <Fact label="Industry">{org.industry ?? <Empty />}</Fact>
            <Fact label="Website">
              {org.website && websiteHref(org.website) ? (
                <a href={websiteHref(org.website)!} target="_blank" rel="noreferrer">
                  {websiteLabel(org.website)}
                </a>
              ) : org.website ? (
                websiteLabel(org.website)
              ) : (
                <Empty />
              )}
            </Fact>
            <Fact label="Contacts">{org.contacts.length}</Fact>
            <Fact label="Open pipeline">
              <Money value={open.reduce((a, d) => a + d.value, 0)} />{' '}
              <span className="muted small">in {open.length} open deals</span>
            </Fact>
          </div>
          {org.notes && <p className="notes">{org.notes}</p>}
        </RecordHeader>
      </div>
      <div className="record-columns">
        <section className="panel" aria-labelledby="org-contacts">
          <div className="panel-head">
            <h2 className="panel-title" id="org-contacts">
              Contacts
            </h2>
            <Button size="sm" onClick={() => forms.openContact(undefined, { organizationId: org.id })}>
              <Plus aria-hidden="true" /> New contact
            </Button>
          </div>
          {org.contacts.length === 0 ? (
            <EmptyState title="No contacts yet" />
          ) : (
            <div className="link-list">
              {org.contacts.map((c) => (
                <div key={c.id} className="link-row">
                  <Avatar name={c.name} large />
                  <div className="grow">
                    <Link to={`/contacts/${c.id}`} className="truncate" style={{ display: 'block' }}>
                      {c.name}
                    </Link>
                    <span className="muted small truncate" style={{ display: 'block' }}>
                      {c.jobTitle ?? c.email ?? '—'}
                    </span>
                  </div>
                  <StatusPill status={c.status} />
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="panel" aria-labelledby="org-deals">
          <div className="panel-head">
            <h2 className="panel-title" id="org-deals">
              Deals
            </h2>
            <Button size="sm" onClick={() => forms.openDeal(undefined, { organizationId: org.id })}>
              <Plus aria-hidden="true" /> New deal
            </Button>
          </div>
          {org.deals.length === 0 ? (
            <EmptyState title="No deals yet" />
          ) : (
            <div className="link-list">
              {org.deals.map((d) => (
                <div key={d.id} className="link-row">
                  <div className="grow">
                    <Link to={`/deals/${d.id}`} className="truncate" style={{ display: 'block' }}>
                      {d.name}
                    </Link>
                    <span className="muted small">
                      {d.contact?.name ?? 'No main contact'} · closes{' '}
                      <DateText date={d.closeDate} late={isLate(d, today)} />
                    </span>
                  </div>
                  <span className="cell-pills">
                    {isLate(d, today) && <LatePill />}
                    <StagePill stage={d.stage} />
                  </span>
                  <span className="num" style={{ minWidth: 96, textAlign: 'right' }}>
                    <Money value={d.value} />
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
