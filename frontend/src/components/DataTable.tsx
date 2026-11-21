import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { Button } from './Button';
import { formatNumber } from '../lib/format';

export const PAGE_SIZES = [25, 50, 100];

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    align?: 'right';
    width?: string;
    /** Row actions: not a link target, faint until the row is hovered. */
    actions?: boolean;
  }
}

/** Case-insensitive search across the given fields (T1). */
export function matchesSearch(fields: (string | null | undefined)[], query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => (f ?? '').toLowerCase().includes(q));
}

/** Page buttons: all of them when few, otherwise the first, the last and those around the current one. */
export function pageList(pageCount: number, current: number): (number | 'gap')[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i);
  const pages = new Set([0, pageCount - 1, current - 1, current, current + 1].filter((p) => p >= 0 && p < pageCount));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('gap');
    out.push(p);
  });
  return out;
}

/**
 * A table inside a panel: search (T1), sorting by heading with three states (T2), paging with
 * "Showing 1–25 of 80" (T3), rows that open their record (T4), and empty states (T6).
 */
export function DataTable<T extends { id: number }>({
  data,
  columns,
  search,
  searchFields,
  noun,
  onRowClick,
  emptyAction,
  onClearSearch,
  label,
  minWidth,
}: {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  search: string;
  searchFields: (row: T) => (string | null | undefined)[];
  /** Plural, lowercase: "contacts". */
  noun: string;
  onRowClick: (row: T) => void;
  emptyAction: ReactNode;
  onClearSearch: () => void;
  label: string;
  /** Below this the panel scrolls sideways rather than crushing the columns (G6). */
  minWidth?: number;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: PAGE_SIZES[0] });

  const rows = useMemo(() => data.filter((row) => matchesSearch(searchFields(row), search)), [data, search, searchFields]);

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [search]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    sortDescFirst: false,
    enableSortingRemoval: true,
    autoResetPageIndex: false,
    getRowId: (row) => String(row.id),
  });

  // Keep the page in range when rows go away (after a delete, say).
  const pageCount = Math.max(1, table.getPageCount());
  useEffect(() => {
    if (pagination.pageIndex > pageCount - 1) setPagination((p) => ({ ...p, pageIndex: pageCount - 1 }));
  }, [pageCount, pagination.pageIndex]);

  if (data.length === 0) {
    return (
      <div className="panel">
        <EmptyState title={`No ${noun} yet`}>{emptyAction}</EmptyState>
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="panel">
        <EmptyState title={`No ${noun} match your search`}>
          <div className="page-actions">
            <Button onClick={onClearSearch}>Clear search</Button>
            {emptyAction}
          </div>
        </EmptyState>
      </div>
    );
  }

  const first = pagination.pageIndex * pagination.pageSize + 1;
  const last = Math.min(rows.length, first + pagination.pageSize - 1);

  return (
    <div className="panel table-panel">
      <div className="table-scroll">
        <table className="table" aria-label={label} style={{ minWidth }}>
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const meta = header.column.columnDef.meta;
                  const sorted = header.column.getIsSorted();
                  const canSort = header.column.getCanSort();
                  const title = flexRender(header.column.columnDef.header, header.getContext());
                  return (
                    <th
                      key={header.id}
                      style={{ width: meta?.width }}
                      className={`${meta?.align === 'right' ? 'right' : ''} ${sorted ? 'sorted' : ''}`}
                      aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                    >
                      {canSort ? (
                        <button type="button" className="th-sort" onClick={header.column.getToggleSortingHandler()}>
                          {title}
                          {sorted === 'asc' && <ArrowUp aria-label="sorted up" />}
                          {sorted === 'desc' && <ArrowDown aria-label="sorted down" />}
                        </button>
                      ) : (
                        title
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} onClick={() => onRowClick(row.original)}>
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta;
                  return (
                    <td
                      key={cell.id}
                      className={`${meta?.align === 'right' ? 'right num' : ''} ${meta?.actions ? 'actions' : ''}`}
                      onClick={meta?.actions ? (e) => e.stopPropagation() : undefined}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-foot">
        <span className="muted">
          Showing {formatNumber(first)}–{formatNumber(last)} of {formatNumber(rows.length)}
        </span>
        <div className="pager">
          <label className="muted pager-size">
            Rows per page
            <select
              className="select"
              value={pagination.pageSize}
              onChange={(e) => setPagination({ pageIndex: 0, pageSize: Number(e.target.value) })}
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="icon-btn"
            aria-label="Previous page"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          {pageList(pageCount, pagination.pageIndex).map((p, i) =>
            p === 'gap' ? (
              <span key={`gap-${i}`} className="muted">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className="page-btn"
                aria-label={`Page ${p + 1}`}
                aria-current={p === pagination.pageIndex ? 'page' : undefined}
                onClick={() => table.setPageIndex(p)}
              >
                {p + 1}
              </button>
            ),
          )}
          <button
            type="button"
            className="icon-btn"
            aria-label="Next page"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
