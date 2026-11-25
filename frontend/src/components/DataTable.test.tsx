import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, matchesSearch, pageList } from './DataTable';
import { renderApp } from '../test/render';

interface Row {
  id: number;
  name: string;
  value: number;
}
const rows: Row[] = Array.from({ length: 80 }, (_, i) => ({
  id: i + 1,
  name: `Company ${String(i + 1).padStart(2, '0')}`,
  value: (i * 37) % 100,
}));
rows[4].name = 'Acme Rockets';
const columns: ColumnDef<Row, unknown>[] = [
  { id: 'name', header: 'Name', accessorFn: (r) => r.name.toLowerCase(), cell: ({ row }) => row.original.name },
  { id: 'value', header: 'Value', accessorKey: 'value', meta: { align: 'right' } },
];

function Harness({ data = rows }: { data?: Row[] }) {
  const [search, setSearch] = useState('');
  return (
    <>
      <input aria-label="search" value={search} onChange={(e) => setSearch(e.target.value)} />
      <DataTable
        label="Things"
        data={data}
        columns={columns}
        search={search}
        searchFields={(r) => [r.name]}
        noun="things"
        onRowClick={vi.fn()}
        onClearSearch={() => setSearch('')}
        emptyAction={<button type="button">New thing</button>}
      />
    </>
  );
}

const bodyNames = () =>
  within(screen.getAllByRole('rowgroup')[1])
    .getAllByRole('row')
    .map((r) => r.firstChild?.textContent);

describe('DataTable (T1–T3, T6)', () => {
  it('searches ignoring case', async () => {
    renderApp(<Harness />);
    await userEvent.type(screen.getByLabelText('search'), 'aCmE');
    expect(bodyNames()).toEqual(['Acme Rockets']);
    expect(screen.getByText('Showing 1–1 of 1')).toBeInTheDocument();
  });

  it('sorts up, then down, then back to the default order', async () => {
    renderApp(<Harness />);
    const header = screen.getByRole('button', { name: 'Value' });
    await userEvent.click(header);
    expect(screen.getByRole('columnheader', { name: /Value/ })).toHaveAttribute('aria-sort', 'ascending');
    const values = () =>
      within(screen.getAllByRole('rowgroup')[1])
        .getAllByRole('row')
        .map((r) => Number(r.lastChild?.textContent));
    expect(values()).toEqual([...values()].sort((a, b) => a - b));
    await userEvent.click(header);
    expect(screen.getByRole('columnheader', { name: /Value/ })).toHaveAttribute('aria-sort', 'descending');
    expect(values()).toEqual([...values()].sort((a, b) => b - a));
    await userEvent.click(header);
    expect(screen.getByRole('columnheader', { name: /Value/ })).not.toHaveAttribute('aria-sort');
    expect(bodyNames()[0]).toBe('Company 01');
  });

  it('pages 25 at a time and shows "Showing 1–25 of 80"', async () => {
    renderApp(<Harness />);
    expect(screen.getByText('Showing 1–25 of 80')).toBeInTheDocument();
    expect(bodyNames()).toHaveLength(25);
    await userEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(screen.getByText('Showing 26–50 of 80')).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText('Rows per page'), '100');
    expect(screen.getByText('Showing 1–80 of 80')).toBeInTheDocument();
  });

  it('says when a search matches nothing, and clears it', async () => {
    renderApp(<Harness />);
    await userEvent.type(screen.getByLabelText('search'), 'zzz');
    expect(screen.getByText('No things match your search')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByText('Showing 1–25 of 80')).toBeInTheDocument();
  });

  it('says when there are no rows at all, and offers to add one', () => {
    renderApp(<Harness data={[]} />);
    expect(screen.getByText('No things yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New thing' })).toBeInTheDocument();
  });

  it('matches across fields and lists pages compactly', () => {
    expect(matchesSearch(['Dana', null, 'Fleet Co'], 'fleet')).toBe(true);
    expect(matchesSearch(['Dana'], '  ')).toBe(true);
    expect(pageList(4, 0)).toEqual([0, 1, 2, 3]);
    expect(pageList(20, 10)).toEqual([0, 'gap', 9, 10, 11, 'gap', 19]);
  });
});
