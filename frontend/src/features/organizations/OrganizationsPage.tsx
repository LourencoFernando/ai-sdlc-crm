import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import { Plus } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { api, keys } from '../../api/endpoints';
import type { OrganizationRow } from '../../api/types';
import { DataTable } from '../../components/DataTable';
import { PageHead } from '../../components/PageHead';
import { SearchBox } from '../../components/SearchBox';
import { Button } from '../../components/Button';
import { PanelSkeleton } from '../../components/Skeleton';
import { RowActions } from '../../components/RowActions';
import { Money } from '../../components/Money';
import { useForms } from '../../app/forms';
import { plural } from '../../lib/format';
import { websiteLabel } from '../../lib/website';

const searchFields = (o: OrganizationRow) => [o.name, o.industry, o.website];
const empty = <span className="empty-value">—</span>;

export function OrganizationsPage() {
  const { data } = useQuery({ queryKey: keys.organizations, queryFn: api.organizations });
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const forms = useForms();

  const columns = useMemo<ColumnDef<OrganizationRow, unknown>[]>(
    () => [
      {
        id: 'name',
        meta: { width: '25%' },
        header: 'Name',
        accessorFn: (o) => o.name.toLowerCase(),
        cell: ({ row }) => (
          <Link className="name-link" to={`/organizations/${row.original.id}`} onClick={(e) => e.stopPropagation()}>
            {row.original.name}
          </Link>
        ),
      },
      { id: 'industry',
        meta: { width: '16%' }, header: 'Industry', accessorFn: (o) => o.industry ?? undefined, cell: ({ row }) => row.original.industry ?? empty, sortUndefined: 'last' },
      {
        id: 'website',
        meta: { width: '18%' },
        header: 'Website',
        accessorFn: (o) => o.website ?? undefined,
        sortUndefined: 'last',
        cell: ({ row }) => (row.original.website ? websiteLabel(row.original.website) : empty),
      },
      { id: 'contacts', header: 'Contacts', accessorKey: 'contactCount', meta: { width: '10%', align: 'right' } },
      { id: 'openDeals', header: 'Open deals', accessorKey: 'openDealCount', meta: { width: '11%', align: 'right' } },
      {
        id: 'openPipeline',
        header: 'Open pipeline',
        accessorKey: 'openPipeline',
        meta: { width: '14%', align: 'right' },
        cell: ({ row }) => <Money value={row.original.openPipeline} />,
      },
      {
        id: 'actions',
        header: () => <span className="visually-hidden">Actions</span>,
        enableSorting: false,
        meta: { width: '6%', actions: true },
        cell: ({ row }) => (
          <RowActions
            name={row.original.name}
            onEdit={() => forms.openOrganization(row.original)}
            onDelete={() => forms.confirmDelete({ kind: 'organization', record: row.original })}
          />
        ),
      },
    ],
    [forms],
  );

  const newButton = (
    <Button variant="primary" onClick={() => forms.openOrganization()}>
      <Plus aria-hidden="true" /> New organization
    </Button>
  );

  return (
    <div className="page">
      <PageHead
        title="Organizations"
        sub={data ? `${plural(data.length, 'organization')} · ${plural(new Set(data.map((o) => o.industry).filter(Boolean)).size, 'industry', 'industries')}` : ' '}
        actions={newButton}
      />
      <div className="toolbar">
        <SearchBox value={search} onChange={setSearch} placeholder="Search organizations" label="Search organizations" />
      </div>
      {data ? (
        <DataTable
          label="Organizations"
          data={data}
          columns={columns}
          search={search}
          searchFields={searchFields}
          minWidth={960}
          noun="organizations"
          onRowClick={(o) => navigate(`/organizations/${o.id}`)}
          onClearSearch={() => setSearch('')}
          emptyAction={newButton}
        />
      ) : (
        <PanelSkeleton rows={8} />
      )}
    </div>
  );
}
