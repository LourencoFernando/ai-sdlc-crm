import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router';
import { ConfirmDelete } from '../components/ConfirmDelete';
import { api, keys } from '../api/endpoints';
import type { Activity, Contact, Deal, Organization } from '../api/types';
import { plural } from '../lib/format';
import { refreshAll } from '../app/query-client';
import { useToast } from '../app/toasts';

export type DeleteRequest =
  | { kind: 'organization'; record: Pick<Organization, 'id' | 'name'> }
  | { kind: 'contact'; record: Pick<Contact, 'id' | 'firstName' | 'lastName'> }
  | { kind: 'deal'; record: Pick<Deal, 'id' | 'name'> }
  | { kind: 'activity'; record: Pick<Activity, 'id' | 'description'> };

const LIST_PATH = { organization: '/organizations', contact: '/contacts', deal: '/deals' } as const;

/** Asks first and says exactly what happens to linked records (T5, X1–X5). */
export function DeleteDialog({ request, onClose }: { request: DeleteRequest; onClose: () => void }) {
  const client = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { kind, record } = request;
  const id = record.id;

  const preview = useQuery({
    queryKey: ['delete-preview', kind, id],
    queryFn: async () => {
      if (kind === 'organization') return { kind, data: await api.organizationDeletePreview(id) } as const;
      if (kind === 'contact') return { kind, data: await api.contactDeletePreview(id) } as const;
      if (kind === 'deal') return { kind, data: await api.dealDeletePreview(id) } as const;
      return { kind, data: null } as const;
    },
    staleTime: 0,
    gcTime: 0,
  });

  const name =
    kind === 'contact' ? `${request.record.firstName} ${request.record.lastName}` : kind === 'activity' ? 'this activity' : request.record.name;
  const p = preview.data;
  let effects: React.ReactNode = null;
  let blocked = false;

  if (preview.isError) {
    effects = <p className="form-error">Couldn't check what this delete would affect. Close this and try again.</p>;
    blocked = true;
  } else if (p?.kind === 'organization') {
    if (p.data.blocked) {
      blocked = true;
      effects = (
        <>
          <p>
            {name} can't be deleted because it has {plural(p.data.deals.length, 'deal')}. Move them to another organization or
            delete them first:
          </p>
          <ul>
            {p.data.deals.map((d) => (
              <li key={d.id}>
                <Link to={`/deals/${d.id}`} onClick={onClose}>
                  {d.name}
                </Link>
              </li>
            ))}
          </ul>
        </>
      );
    } else {
      effects = (
        <p>
          {p.data.contactsToUnlink === 0
            ? `${name} has no contacts or deals, so nothing else changes.`
            : `Its ${plural(p.data.contactsToUnlink, 'contact')} will be kept without an organization.`}
        </p>
      );
    }
  } else if (p?.kind === 'contact') {
    const { activitiesToDelete, activitiesToKeep, dealsToUnlink } = p.data;
    effects = (
      <>
        <p>
          {activitiesToDelete === 0
            ? 'They have no activities of their own to delete.'
            : `Their ${plural(activitiesToDelete, 'activity', 'activities')} will be deleted.`}{' '}
          {dealsToUnlink === 0
            ? 'They are not the main contact on any deal.'
            : `${plural(dealsToUnlink, 'deal')} will be kept without a main contact.`}
        </p>
        {activitiesToKeep > 0 && (
          <p className="muted">
            {plural(activitiesToKeep, 'activity', 'activities')} also on a deal will stay on that deal's timeline.
          </p>
        )}
      </>
    );
  } else if (p?.kind === 'deal') {
    const { activitiesToDelete, activitiesToKeep } = p.data;
    effects = (
      <>
        <p>
          {activitiesToDelete === 0
            ? 'It has no activities or stage changes to delete.'
            : `Its ${plural(activitiesToDelete, 'activity', 'activities')} and stage changes will be deleted.`}
        </p>
        {activitiesToKeep > 0 && (
          <p className="muted">
            {plural(activitiesToKeep, 'activity', 'activities')} also on a contact will stay on that contact's timeline.
          </p>
        )}
      </>
    );
  } else if (p?.kind === 'activity') {
    effects = <p>“{request.kind === 'activity' ? request.record.description : ''}” will be removed from every timeline.</p>;
  }

  async function confirm() {
    if (kind === 'organization') await api.deleteOrganization(id);
    if (kind === 'contact') await api.deleteContact(id);
    if (kind === 'deal') await api.deleteDeal(id);
    if (kind === 'activity') await api.deleteActivity(id);
    onClose();
    // The deleted record's own page goes away, and its query is never asked for again.
    const own = kind === 'organization' ? keys.organization(id) : kind === 'contact' ? keys.contact(id) : kind === 'deal' ? keys.deal(id) : null;
    if (kind !== 'activity' && location.pathname === `${LIST_PATH[kind]}/${id}`) navigate(LIST_PATH[kind]);
    await refreshAll(client, own ?? undefined);
    if (own) window.setTimeout(() => client.removeQueries({ queryKey: own }), 0);
    toast(`${kind[0].toUpperCase()}${kind.slice(1)} deleted`);
  }

  return (
    <ConfirmDelete
      open
      onClose={onClose}
      title={blocked && p?.kind === 'organization' ? `${name} can't be deleted` : `Delete ${kind === 'activity' ? 'this activity' : name}?`}
      effects={effects}
      blocked={blocked}
      onConfirm={confirm}
    />
  );
}
