import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, UnreachableError } from '../api/client';
import { todayLocal } from '../lib/dates';
import { renderApp } from '../test/render';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { Combobox } from './Combobox';
import { ConfirmDelete } from './ConfirmDelete';
import { DataTable } from './DataTable';
import { DateText } from './DateText';
import { Dialog, useRequestClose } from './Dialog';
import { Field } from './Field';
import { Money } from './Money';
import { PageHead } from './PageHead';
import { LatePill, StagePill, StatusPill } from './Pills';
import { RowActions } from './RowActions';
import { SearchBox } from './SearchBox';
import { PanelSkeleton } from './Skeleton';

describe('small display components', () => {
  it('shows initials, money, dates, pills and the page head', () => {
    const thisYear = todayLocal().slice(0, 4);
    render(
      <>
        <Avatar name="Dana Reyes" large />
        <Money value={12500} />
        <Money value={1_250_000} short />
        <DateText date={`${thisYear}-11-20`} dropYear />
        <DateText date="2020-03-04" late />
        <StagePill stage="negotiation" />
        <StatusPill status="customer" />
        <LatePill />
        <PageHead title="Deals" sub="60 deals" actions={<Button size="sm">New deal</Button>} />
        <PageHead title="Pipeline" />
      </>,
    );
    expect(screen.getByTitle('Dana Reyes')).toHaveTextContent('DR');
    expect(screen.getByText('USD 12,500')).toBeInTheDocument();
    expect(screen.getByText('USD 1.3M')).toBeInTheDocument();
    expect(screen.getByText('Nov 20')).toHaveAttribute('dateTime', `${thisYear}-11-20`);
    expect(screen.getByText('Mar 4, 2020')).toHaveClass('alert-text');
    expect(screen.getByText('Negotiation')).toBeInTheDocument();
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('Late')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Deals' })).toBeInTheDocument();
    expect(screen.getByText('60 deals')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New deal' })).toHaveClass('btn-sm');
  });

  it('shows a loading panel', () => {
    render(<PanelSkeleton rows={3} />);
    expect(screen.getByLabelText('Loading')).toHaveAttribute('aria-busy', 'true');
  });

  it('reports what is typed in the search box', async () => {
    const onChange = vi.fn();
    render(<SearchBox value="" onChange={onChange} placeholder="Search deals" label="Search deals" />);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search deals' }), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('edits and deletes from the row actions, with a tooltip naming the action', async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    renderApp(<RowActions name="Acme" onEdit={onEdit} onDelete={onDelete} />);
    await userEvent.hover(screen.getByRole('button', { name: 'Edit Acme' }));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Edit Acme');
    await userEvent.click(screen.getByRole('button', { name: 'Edit Acme' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete Acme' }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });
});

describe('Field', () => {
  it('links the label, hint and error to its control', () => {
    render(
      <>
        <Field label="Name" hint="As it appears on invoices">
          <input />
        </Field>
        <Field label="Email" optional error="Not a valid email address">
          <input />
        </Field>
        <Field label="Phone">{(props) => <input {...props} />}</Field>
      </>,
    );
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByText('As it appears on invoices')).toBeInTheDocument();
    const email = screen.getByLabelText(/Email/);
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAccessibleDescription('Not a valid email address');
    expect(screen.getByLabelText('Phone')).not.toHaveAttribute('aria-invalid');
  });
});

describe('Dialog', () => {
  function CancelButton() {
    const requestClose = useRequestClose();
    return <button onClick={requestClose}>Cancel</button>;
  }

  function Harness({ dirty }: { dirty: boolean }) {
    const [open, setOpen] = useState(true);
    return open ? (
      <Dialog open onClose={() => setOpen(false)} title="New deal" dirty={dirty} size="wide">
        <CancelButton />
      </Dialog>
    ) : (
      <p>Closed</p>
    );
  }

  it('closes straight away when nothing changed', async () => {
    render(<Harness dirty={false} />);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('asks before discarding changes, and can keep editing', async () => {
    render(<Harness dirty />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('alertdialog', { name: 'Discard your changes?' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(screen.getByRole('dialog', { name: 'New deal' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('warns before leaving the page with changes', () => {
    const { unmount } = render(<Harness dirty />);
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    unmount();
    const after = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(after);
    expect(after.defaultPrevented).toBe(false);
  });
});

describe('ConfirmDelete (T5, X1)', () => {
  function renderConfirm(props: Partial<Parameters<typeof ConfirmDelete>[0]> = {}) {
    const onClose = vi.fn();
    const onConfirm = vi.fn(async () => {});
    render(
      <ConfirmDelete
        open
        onClose={onClose}
        title="Delete Acme?"
        effects={<p>Its 4 contacts will be kept without an organization.</p>}
        onConfirm={onConfirm}
        {...props}
      />,
    );
    return { onClose, onConfirm };
  }

  it('waits for the preview before offering Delete', () => {
    renderConfirm({ effects: null });
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });

  it('deletes, or cancels', async () => {
    const { onClose, onConfirm } = renderConfirm();
    expect(screen.getByText('Its 4 contacts will be kept without an organization.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('only offers Close when the delete is blocked', async () => {
    const { onClose } = renderConfirm({ blocked: true });
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('Close', { selector: 'button' }));
    expect(onClose).toHaveBeenCalled();
  });

  it.each([
    [new UnreachableError(), "Couldn't delete. Can't reach Accountable. Check that it's running."],
    [new ApiError(409, 'Acme has deals'), 'Acme has deals'],
    [new Error('boom'), "Couldn't delete. Try again."],
  ])('says why a delete failed (%s)', async (error, message) => {
    renderConfirm({ onConfirm: vi.fn(async () => Promise.reject(error)) });
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
  });
});

describe('Combobox', () => {
  const options = [
    { value: 1, label: 'Acme' },
    { value: 2, label: 'Brightwater Logistics' },
    { value: 3, label: 'Cobalt Health' },
  ];

  function Harness({ initial = null, noneLabel }: { initial?: number | null; noneLabel?: string }) {
    const [value, setValue] = useState<number | null>(initial);
    return (
      <>
        <label htmlFor="org">Organization</label>
        <Combobox
          id="org"
          options={options}
          value={value}
          onChange={setValue}
          placeholder="Choose an organization"
          noneLabel={noneLabel}
        />
        <p>Value: {String(value)}</p>
        <button>After</button>
      </>
    );
  }

  const input = () => screen.getByRole('combobox', { name: 'Organization' });

  it('filters as you type and chooses with Enter', async () => {
    render(<Harness />);
    await userEvent.click(input());
    expect(screen.getAllByRole('option')).toHaveLength(3);
    await userEvent.type(input(), 'cob');
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Cobalt Health']);
    await userEvent.keyboard('{Enter}');
    expect(screen.getByText('Value: 3')).toBeInTheDocument();
    expect(input()).toHaveValue('Cobalt Health');
  });

  it('says when nothing matches', async () => {
    render(<Harness />);
    await userEvent.type(input(), 'zzz');
    expect(screen.getByText('No matches')).toBeInTheDocument();
  });

  it('moves with the arrows and chooses with the mouse', async () => {
    render(<Harness initial={2} />);
    input().focus();
    await userEvent.keyboard('{Escape}');
    expect(input()).toHaveAttribute('aria-expanded', 'false');
    await userEvent.keyboard('{ArrowDown}');
    expect(input()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('option', { name: 'Brightwater Logistics' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}{ArrowDown}{Enter}');
    expect(screen.getByText('Value: 3')).toBeInTheDocument();

    await userEvent.click(input());
    await userEvent.hover(screen.getByRole('option', { name: 'Acme' }));
    await userEvent.click(screen.getByRole('option', { name: 'Acme' }));
    expect(screen.getByText('Value: 1')).toBeInTheDocument();
  });

  it('closes on Tab', async () => {
    render(<Harness />);
    await userEvent.click(input());
    await userEvent.tab();
    expect(input()).toHaveAttribute('aria-expanded', 'false');
  });

  it('offers "none" and a Clear button', async () => {
    render(<Harness initial={1} noneLabel="No organization" />);
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByText('Value: null')).toBeInTheDocument();

    await userEvent.click(input());
    await userEvent.click(screen.getByRole('option', { name: 'Acme' }));
    expect(screen.getByText('Value: 1')).toBeInTheDocument();
    await userEvent.click(input());
    await userEvent.click(screen.getByRole('option', { name: 'No organization' }));
    expect(screen.getByText('Value: null')).toBeInTheDocument();
  });

  it('closes when clicking outside, and closes the list only on Escape inside a dialog', async () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} title="New contact">
        <Harness />
      </Dialog>,
    );
    await userEvent.click(input());
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });
    await waitFor(() => expect(input()).toHaveAttribute('aria-expanded', 'false'));
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(input());
    await userEvent.click(screen.getByText('Value: null'));
    await waitFor(() => expect(input()).toHaveAttribute('aria-expanded', 'false'));
  });
});

describe('DataTable row actions and long lists', () => {
  interface Row {
    id: number;
    name: string;
  }
  const rows: Row[] = Array.from({ length: 300 }, (_, i) => ({ id: i + 1, name: `Company ${i + 1}` }));

  afterEach(() => vi.restoreAllMocks());

  it("doesn't open the row when its actions are used, and moves between pages", async () => {
    const onRowClick = vi.fn();
    const onAction = vi.fn();
    const columns: ColumnDef<Row, unknown>[] = [
      { id: 'name', header: 'Name', accessorKey: 'name' },
      {
        id: 'actions',
        header: '',
        meta: { actions: true },
        cell: ({ row }) => <button onClick={onAction}>Edit {row.original.name}</button>,
      },
    ];
    renderApp(
      <DataTable
        label="Companies"
        data={rows}
        columns={columns}
        search=""
        searchFields={(r) => [r.name]}
        noun="companies"
        onRowClick={onRowClick}
        onClearSearch={() => {}}
        emptyAction={null}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Edit Company 1' }));
    expect(onAction).toHaveBeenCalledOnce();
    expect(onRowClick).not.toHaveBeenCalled();
    await userEvent.click(screen.getByText('Company 2'));
    expect(onRowClick).toHaveBeenCalledWith(rows[1]);

    expect(screen.getAllByText('…')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByText('Showing 26–50 of 300')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(screen.getByText('Showing 1–25 of 300')).toBeInTheDocument();
    const footer = screen.getByText('Showing 1–25 of 300').parentElement!;
    expect(within(footer).getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
  });
});
