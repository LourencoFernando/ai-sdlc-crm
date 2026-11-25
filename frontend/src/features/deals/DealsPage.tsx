import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import { Plus } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { api, keys } from '../../api/endpoints';
import type { Deal } from '../../api/types';
import { DataTable } from '../../components/DataTable';
import { PageHead } from '../../components/PageHead';
import { SearchBox } from '../../components/SearchBox';
import { Button } from '../../components/Button';
import { PanelSkeleton } from '../../components/Skeleton';
import { RowActions } from '../../components/RowActions';
import { LatePill, StagePill } from '../../components/Pills';
import { Money } from '../../components/Money';
import { DateText } from '../../components/DateText';
import { useForms } from '../../app/forms';
import { formatPercent, plural } from '../../lib/format';
import { isLate, todayLocal } from '../../lib/dates';
import { isOpenStage, STAGES } from '../../lib/stages';

const searchFields = (d: Deal) => [d.name, d.organization.name, d.contact?.name];

export function DealsPage() {
  const { data } = useQuery({ queryKey: keys.deals, queryFn: api.deals });
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const forms = useForms();
  const today = todayLocal();

  // Default order: stage, then board position.
  const rows = useMemo(
    () =>
      data && [...data].sort((a, b) => STAGES.indexOf(a.stage) - STAGES.indexOf(b.stage) || a.position - b.position),
    [data],
  );

  const columns = useMemo<ColumnDef<Deal, unknown>[]>(
    () => [
      {
        id: 'name',
        meta: { width: '15%' },
        header: 'Name',
        accessorFn: (d) => d.name.toLowerCase(),
        cell: ({ row }) => (
          <Link className="name-link" to={`/deals/${row.original.id}`} onClick={(e) => e.stopPropagation()}>
            {row.original.name}
          </Link>
        ),
      },
      {
        id: 'organization',
        meta: { width: '12.5%' },
        header: 'Organization',
        accessorFn: (d) => d.organization.name.toLowerCase(),
        cell: ({ row }) => (
          <Link to={`/organizations/${row.original.organization.id}`} onClick={(e) => e.stopPropagation()}>
            {row.original.organization.name}
          </Link>
        ),
      },
      {
        id: 'contact',
        meta: { width: '12%' },
        header: 'Main contact',
        accessorFn: (d) => d.contact?.name.toLowerCase(),
        sortUndefined: 'last',
        cell: ({ row }) =>
          row.original.contact ? (
            <Link to={`/contacts/${row.original.contact.id}`} onClick={(e) => e.stopPropagation()}>
              {row.original.contact.name}
            </Link>
          ) : (
            <span className="empty-value">—</span>
          ),
      },
      {
        id: 'stage',
        meta: { width: '13%' },
        header: 'Stage',
        accessorFn: (d) => STAGES.indexOf(d.stage),
        cell: ({ row }) => (
          <span className="cell-pills">
            <StagePill stage={row.original.stage} />
            {isLate(row.original, today) && <LatePill />}
          </span>
        ),
      },
      {
        id: 'value',
        header: 'Value',
        accessorKey: 'value',
        meta: { width: '10.5%', align: 'right' },
        cell: ({ row }) => <Money value={row.original.value} />,
      },
      {
        id: 'probability',
        header: 'Probability',
        accessorKey: 'probability',
        meta: { width: '8%', align: 'right' },
        cell: ({ row }) => formatPercent(row.original.probability),
      },
      {
        id: 'expected',
        header: 'Expected revenue',
        accessorFn: (d) => (d.value * d.probability) / 100,
        meta: { width: '10%', align: 'right' },
        cell: ({ row }) => <Money value={(row.original.value * row.original.probability) / 100} />,
      },
      {
        id: 'closeDate',
        meta: { width: '11%' },
        header: 'Close date',
        accessorKey: 'closeDate',
        cell: ({ row }) => <DateText date={row.original.closeDate} late={isLate(row.original, today)} />,
      },
      {
        id: 'actions',
        header: () => <span className="visually-hidden">Actions</span>,
        enableSorting: false,
        meta: { width: '8%', actions: true },
        cell: ({ row }) => (
          <RowActions
            name={row.original.name}
            onEdit={() => forms.openDeal(row.original)}
            onDelete={() => forms.confirmDelete({ kind: 'deal', record: row.original })}
          />
        ),
      },
    ],
    [forms, today],
  );

  const newButton = (
    <Button variant="primary" onClick={() => forms.openDeal()}>
      <Plus aria-hidden="true" /> New deal
    </Button>
  );
  const open = data?.filter((d) => isOpenStage(d.stage)) ?? [];
  const late = open.filter((d) => isLate(d, today)).length;

  return (
    <div className="page">
      <PageHead
        title="Deals"
        sub={
          data ? `${plural(data.length, 'deal')} · ${open.length} open${late ? ` · ${late} running late` : ''}` : ' '
        }
        actions={newButton}
      />
      <div className="toolbar">
        <SearchBox value={search} onChange={setSearch} placeholder="Search deals" label="Search deals" />
      </div>
      {rows ? (
        <DataTable
          label="Deals"
          data={rows}
          columns={columns}
          search={search}
          searchFields={searchFields}
          minWidth={960}
          noun="deals"
          onRowClick={(d) => navigate(`/deals/${d.id}`)}
          onClearSearch={() => setSearch('')}
          emptyAction={newButton}
        />
      ) : (
        <PanelSkeleton rows={8} />
      )}
    </div>
  );
}
