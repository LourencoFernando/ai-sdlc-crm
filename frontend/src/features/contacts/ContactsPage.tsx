import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import { Plus } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { api, keys } from '../../api/endpoints';
import type { Contact } from '../../api/types';
import { DataTable } from '../../components/DataTable';
import { PageHead } from '../../components/PageHead';
import { SearchBox } from '../../components/SearchBox';
import { Button } from '../../components/Button';
import { PanelSkeleton } from '../../components/Skeleton';
import { RowActions } from '../../components/RowActions';
import { StatusPill } from '../../components/Pills';
import { Avatar } from '../../components/Avatar';
import { useForms } from '../../app/forms';
import { plural } from '../../lib/format';
import { CONTACT_STATUSES, type ContactStatus } from '../../lib/stages';

const searchFields = (c: Contact) => [`${c.firstName} ${c.lastName}`, c.email, c.organization?.name, c.jobTitle];
const empty = <span className="empty-value">—</span>;
const FILTERS: { key: ContactStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'lead', label: 'Leads' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'customer', label: 'Customers' },
];

export function ContactsPage() {
  const { data } = useQuery({ queryKey: keys.contacts, queryFn: api.contacts });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ContactStatus | 'all'>('all');
  const navigate = useNavigate();
  const forms = useForms();

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: data?.length ?? 0 };
    for (const s of CONTACT_STATUSES) c[s] = data?.filter((x) => x.status === s).length ?? 0;
    return c;
  }, [data]);
  const rows = useMemo(() => (status === 'all' ? data : data?.filter((c) => c.status === status)), [data, status]);

  const columns = useMemo<ColumnDef<Contact, unknown>[]>(
    () => [
      {
        id: 'name',
        meta: { width: '19%' },
        header: 'Name',
        accessorFn: (c) => `${c.lastName} ${c.firstName}`.toLowerCase(),
        cell: ({ row }) => {
          const name = `${row.original.firstName} ${row.original.lastName}`;
          return (
            <span className="name-cell">
              <Avatar name={name} large />
              <Link to={`/contacts/${row.original.id}`} onClick={(e) => e.stopPropagation()}>
                {name}
              </Link>
            </span>
          );
        },
      },
      {
        id: 'organization',
        meta: { width: '17%' },
        header: 'Organization',
        accessorFn: (c) => c.organization?.name.toLowerCase(),
        sortUndefined: 'last',
        cell: ({ row }) =>
          row.original.organization ? (
            <Link to={`/organizations/${row.original.organization.id}`} onClick={(e) => e.stopPropagation()}>
              {row.original.organization.name}
            </Link>
          ) : (
            <span className="empty-value">No organization</span>
          ),
      },
      { id: 'jobTitle',
        meta: { width: '17%' }, header: 'Job title', accessorFn: (c) => c.jobTitle?.toLowerCase(), sortUndefined: 'last', cell: ({ row }) => row.original.jobTitle ?? empty },
      { id: 'email',
        meta: { width: '18%' }, header: 'Email', accessorFn: (c) => c.email ?? undefined, sortUndefined: 'last', cell: ({ row }) => row.original.email ?? empty },
      { id: 'phone',
        meta: { width: '12%' }, header: 'Phone', accessorFn: (c) => c.phone ?? undefined, sortUndefined: 'last', cell: ({ row }) => <span className="num">{row.original.phone ?? empty}</span> },
      {
        id: 'status',
        meta: { width: '10%' },
        header: 'Status',
        accessorFn: (c) => CONTACT_STATUSES.indexOf(c.status),
        cell: ({ row }) => <StatusPill status={row.original.status} />,
      },
      {
        id: 'actions',
        header: () => <span className="visually-hidden">Actions</span>,
        enableSorting: false,
        meta: { width: '7%', actions: true },
        cell: ({ row }) => (
          <RowActions
            name={`${row.original.firstName} ${row.original.lastName}`}
            onEdit={() => forms.openContact(row.original)}
            onDelete={() => forms.confirmDelete({ kind: 'contact', record: row.original })}
          />
        ),
      },
    ],
    [forms],
  );

  const newButton = (
    <Button variant="primary" onClick={() => forms.openContact(undefined, status === 'all' ? undefined : { status })}>
      <Plus aria-hidden="true" /> New contact
    </Button>
  );

  return (
    <div className="page">
      <PageHead
        title="Contacts"
        sub={data ? `${plural(data.length, 'contact')} · ${plural(counts.customer, 'customer')}` : ' '}
        actions={newButton}
      />
      <div className="toolbar">
        <SearchBox value={search} onChange={setSearch} placeholder="Search contacts" label="Search contacts" />
        <div className="toggles" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" className="toggle" aria-pressed={status === f.key} onClick={() => setStatus(f.key)}>
              {f.label} <span className="count num">{counts[f.key]}</span>
            </button>
          ))}
        </div>
      </div>
      {rows ? (
        <DataTable
          label="Contacts"
          data={rows}
          columns={columns}
          search={search}
          searchFields={searchFields}
          minWidth={960}
          noun={status === 'all' ? 'contacts' : FILTERS.find((f) => f.key === status)!.label.toLowerCase()}
          onRowClick={(c) => navigate(`/contacts/${c.id}`)}
          onClearSearch={() => setSearch('')}
          emptyAction={newButton}
        />
      ) : (
        <PanelSkeleton rows={8} />
      )}
    </div>
  );
}
