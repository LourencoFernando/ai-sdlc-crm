import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router';
import { ConfirmDelete } from '../components/ConfirmDelete';
import { api, keys } from '../api/endpoints';
import type {
  Activity,
  Contact,
  ContactDeletePreview,
  Deal,
  DealDeletePreview,
  Organization,
  OrganizationDeletePreview,
} from '../api/types';
import { plural } from '../lib/format';
import { refreshAll } from '../app/query-client';
import { useToast } from '../app/toasts';

export type DeleteRequest =
  | { kind: 'organization'; record: Pick<Organization, 'id' | 'name'> }
  | { kind: 'contact'; record: Pick<Contact, 'id' | 'firstName' | 'lastName'> }
  | { kind: 'deal'; record: Pick<Deal, 'id' | 'name'> }
  | { kind: 'activity'; record: Pick<Activity, 'id' | 'description'> };

type Kind = DeleteRequest['kind'];

type Preview =
  | { kind: 'organization'; data: OrganizationDeletePreview }
  | { kind: 'contact'; data: ContactDeletePreview }
  | { kind: 'deal'; data: DealDeletePreview }
  | { kind: 'activity'; data: null };

const LIST_PATH = { organization: '/organizations', contact: '/contacts', deal: '/deals' } as const;

const DELETE: Record<Kind, (id: number) => Promise<void>> = {
  organization: api.deleteOrganization,
  contact: api.deleteContact,
  deal: api.deleteDeal,
  activity: api.deleteActivity,
};

const OWN_KEY = { organization: keys.organization, contact: keys.contact, deal: keys.deal } as const;

async function fetchPreview(kind: Kind, id: number): Promise<Preview> {
  if (kind === 'organization') return { kind, data: await api.organizationDeletePreview(id) };
  if (kind === 'contact') return { kind, data: await api.contactDeletePreview(id) };
  if (kind === 'deal') return { kind, data: await api.dealDeletePreview(id) };
  return { kind, data: null };
}

function displayName(request: DeleteRequest): string {
  if (request.kind === 'contact') return `${request.record.firstName} ${request.record.lastName}`;
  if (request.kind === 'activity') return 'this activity';
  return request.record.name;
}

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
    queryFn: () => fetchPreview(kind, id),
    staleTime: 0,
    gcTime: 0,
  });

  const name = displayName(request);
  const p = preview.data;
  const organizationBlocked = p?.kind === 'organization' && p.data.blocked;
  const blocked = preview.isError || organizationBlocked;

  async function confirm() {
    await DELETE[kind](id);
    onClose();
    // The deleted record's own page goes away, and its query is never asked for again.
    const own = kind === 'activity' ? null : OWN_KEY[kind](id);
    if (kind !== 'activity' && location.pathname === `${LIST_PATH[kind]}/${id}`) navigate(LIST_PATH[kind]);
    await refreshAll(client, own ?? undefined);
    if (own) window.setTimeout(() => client.removeQueries({ queryKey: own }), 0);
    toast(`${kind[0].toUpperCase()}${kind.slice(1)} deleted`);
  }

  return (
    <ConfirmDelete
      open
      onClose={onClose}
      title={organizationBlocked ? `${name} can't be deleted` : `Delete ${name}?`}
      effects={
        preview.isError ? (
          <p className="form-error">Couldn't check what this delete would affect. Close this and try again.</p>
        ) : p ? (
          <Effects request={request} preview={p} name={name} onClose={onClose} />
        ) : null
      }
      blocked={blocked}
      onConfirm={confirm}
    />
  );
}

function Effects({
  request,
  preview,
  name,
  onClose,
}: {
  request: DeleteRequest;
  preview: Preview;
  name: string;
  onClose: () => void;
}) {
  switch (preview.kind) {
    case 'organization':
      return <OrganizationEffects preview={preview.data} name={name} onClose={onClose} />;
    case 'contact':
      return <ContactEffects preview={preview.data} />;
    case 'deal':
      return <DealEffects preview={preview.data} />;
    case 'activity':
      return (
        <p>“{request.kind === 'activity' ? request.record.description : ''}” will be removed from every timeline.</p>
      );
  }
}

function OrganizationEffects({
  preview,
  name,
  onClose,
}: {
  preview: OrganizationDeletePreview;
  name: string;
  onClose: () => void;
}) {
  if (!preview.blocked) {
    return (
      <p>
        {preview.contactsToUnlink === 0
          ? `${name} has no contacts or deals, so nothing else changes.`
          : `Its ${plural(preview.contactsToUnlink, 'contact')} will be kept without an organization.`}
      </p>
    );
  }
  return (
    <>
      <p>
        {name} can't be deleted because it has {plural(preview.deals.length, 'deal')}. Move them to another organization
        or delete them first:
      </p>
      <ul>
        {preview.deals.map((d) => (
          <li key={d.id}>
            <Link to={`/deals/${d.id}`} onClick={onClose}>
              {d.name}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function ContactEffects({ preview }: { preview: ContactDeletePreview }) {
  const { activitiesToDelete, activitiesToKeep, dealsToUnlink } = preview;
  return (
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
}

function DealEffects({ preview }: { preview: DealDeletePreview }) {
  const { activitiesToDelete, activitiesToKeep } = preview;
  return (
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
}
