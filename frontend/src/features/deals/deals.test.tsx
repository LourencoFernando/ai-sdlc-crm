import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DealsPage } from './DealsPage';
import { DealPage } from './DealPage';
import { mockFetch } from '../../test/render';
import { renderPage } from '../../test/pages';
import { contacts, meta, organizations } from '../../test/fixtures';
import { activity, daysFromToday, deal } from '../../test/records';
import type { Deal } from '../../api/types';
import { setUnreachable } from '../../app/connection';

afterEach(() => {
  vi.unstubAllGlobals();
  setUnreachable(false);
});

const deals: Deal[] = [
  deal({ id: 7, name: 'Warehouse robots', stage: 'won', value: 80000, probability: 100, position: 0 }),
  deal({ id: 5, name: 'Fleet telematics', closeDate: daysFromToday(-4), position: 1 }),
  deal({ id: 6, name: 'Spare parts', stage: 'new', value: 5000, probability: 10, contact: null, contactId: null }),
];

function firstColumn(table: HTMLElement) {
  return within(table)
    .getAllByRole('row')
    .slice(1)
    .map((r) => within(r).getAllByRole('link')[0].textContent);
}

async function sortBy(table: HTMLElement, heading: string) {
  await userEvent.click(within(table).getByRole('button', { name: new RegExp(`^${heading}`) }));
  return firstColumn(table);
}

describe('the deals table', () => {
  function open() {
    const fetched = mockFetch({
      'GET /meta': () => ({ body: meta }),
      'GET /deals': () => ({ body: deals }),
      'GET /organizations': () => ({ body: organizations }),
      'GET /contacts': () => ({ body: contacts }),
      'GET /deals/5/delete-preview': () => ({ body: { activitiesToDelete: 4, activitiesToKeep: 2 } }),
      'GET /deals/6/delete-preview': () => ({ body: { activitiesToDelete: 0, activitiesToKeep: 0 } }),
    });
    renderPage(<DealsPage />, { pattern: '/deals', path: '/deals' });
    return fetched;
  }

  it('lists deals in stage order with expected revenue, and counts the late ones', async () => {
    open();
    const table = await screen.findByRole('table', { name: 'Deals' });
    expect(screen.getByText('3 deals · 2 open · 1 running late')).toBeInTheDocument();
    const names = within(table)
      .getAllByRole('row')
      .slice(1)
      .map((r) => within(r).getAllByRole('link')[0].textContent);
    expect(names).toEqual(['Spare parts', 'Fleet telematics', 'Warehouse robots']);
    const fleet = within(table).getByRole('row', { name: /Fleet telematics/ });
    expect(within(fleet).getByText('Late')).toBeInTheDocument();
    expect(within(fleet).getByText('USD 22,500')).toBeInTheDocument();
    expect(within(fleet).getByRole('link', { name: 'Dana Reyes' })).toHaveAttribute('href', '/contacts/10');
    expect(within(within(table).getByRole('row', { name: /Spare parts/ })).getByText('—')).toBeInTheDocument();
  });

  it('finds deals by organization or contact', async () => {
    open();
    await screen.findByRole('table', { name: 'Deals' });
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search deals' }), 'dana');
    expect(screen.queryByRole('link', { name: 'Spare parts' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Fleet telematics' })).toBeInTheDocument();
  });

  it('opens a deal when its row is clicked, and the new deal form', async () => {
    open();
    await userEvent.click(await screen.findByRole('button', { name: 'New deal' }));
    expect(await screen.findByRole('dialog', { name: 'New deal' })).toBeInTheDocument();
  });

  it('sorts by each column', async () => {
    open();
    const table = await screen.findByRole('table', { name: 'Deals' });
    expect(await sortBy(table, 'Name')).toEqual(['Fleet telematics', 'Spare parts', 'Warehouse robots']);
    expect((await sortBy(table, 'Organization')).length).toBe(3);
    expect((await sortBy(table, 'Main contact')).at(-1)).toBe('Spare parts');
    expect(await sortBy(table, 'Stage')).toEqual(['Spare parts', 'Fleet telematics', 'Warehouse robots']);
    expect((await sortBy(table, 'Value'))[0]).toBe('Spare parts');
    expect((await sortBy(table, 'Probability'))[0]).toBe('Spare parts');
    expect((await sortBy(table, 'Expected revenue'))[0]).toBe('Spare parts');
    expect((await sortBy(table, 'Close date'))[0]).toBe('Fleet telematics');
  });

  it('clears a search that matches nothing', async () => {
    open();
    await screen.findByRole('table', { name: 'Deals' });
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search deals' }), 'zzz');
    await userEvent.click(await screen.findByRole('button', { name: /Clear search/ }));
    expect(screen.getByRole('link', { name: 'Spare parts' })).toBeInTheDocument();
  });

  it('says what deleting a deal removes', async () => {
    open();
    await userEvent.click(await screen.findByRole('button', { name: 'Delete Fleet telematics' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete Fleet telematics?' });
    expect(await within(dialog).findByText('Its 4 activities and stage changes will be deleted.')).toBeInTheDocument();
    expect(
      within(dialog).getByText("2 activities also on a contact will stay on that contact's timeline."),
    ).toBeInTheDocument();
  });

  it('says when a deal has nothing to delete with it', async () => {
    open();
    await userEvent.click(await screen.findByRole('button', { name: 'Delete Spare parts' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete Spare parts?' });
    expect(await within(dialog).findByText('It has no activities or stage changes to delete.')).toBeInTheDocument();
  });

  it('edits a deal from its row', async () => {
    open();
    await userEvent.click(await screen.findByRole('button', { name: 'Edit Spare parts' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit deal' });
    expect(within(dialog).getByLabelText('Name')).toHaveValue('Spare parts');
    expect(within(dialog).getByLabelText('Value (USD)')).toHaveValue('5000');
  });

  it('opens a deal from its row', async () => {
    open();
    await userEvent.click(await screen.findByText('USD 500'));
    expect(screen.getByRole('status', { name: 'Current path' })).toHaveTextContent('/deals/6');
  });
});

describe('a deal page', () => {
  function open(record: Deal | null = deal({ closeDate: daysFromToday(-4) }), timeline = [activity({ deal: null })]) {
    const fetched = mockFetch({
      'GET /meta': () => ({ body: meta }),
      'GET /deals/5': () => (record ? { body: record } : { status: 404, body: { detail: 'Not found' } }),
      'GET /deals/5/timeline': () => ({ body: timeline }),
      'GET /contacts': () => ({ body: [{ ...contacts[0], jobTitle: 'Head of operations' }, contacts[1]] }),
      'GET /organizations': () => ({ body: organizations }),
      'PATCH /deals/5': (body) => ({ body: { ...record, ...(body as object) } }),
    });
    renderPage(<DealPage />, { pattern: '/deals/:id', path: '/deals/5' });
    return fetched;
  }

  it('shows the details, main contact and timeline, with a late close date', async () => {
    open();
    expect(await screen.findByRole('heading', { level: 1, name: 'Fleet telematics' })).toBeInTheDocument();
    const details = screen.getByRole('region', { name: 'Details' });
    expect(within(details).getByText('Proposal')).toBeInTheDocument();
    expect(within(details).getByText('Late')).toBeInTheDocument();
    expect(within(details).getByText('Expected close')).toBeInTheDocument();
    expect(within(details).getByText('USD 22,500')).toBeInTheDocument();
    expect(within(details).getByRole('link', { name: 'Acme' })).toHaveAttribute('href', '/organizations/1');
    const person = screen.getByRole('region', { name: 'Main contact' });
    expect(await within(person).findByText('Head of operations at Acme')).toBeInTheDocument();
    expect(within(person).getByRole('link', { name: 'dana@acme.example' })).toBeInTheDocument();
    expect(within(person).getByText('Proposal stage · 50% probability of close')).toBeInTheDocument();
    const timeline = screen.getByRole('region', { name: 'Timeline' });
    expect(await within(timeline).findByText('Called about the pilot')).toBeInTheDocument();
    expect(within(timeline).getByRole('link', { name: 'Dana Reyes' })).toHaveAttribute('href', '/contacts/10');
  });

  it('says when it has no main contact, and offers to choose one', async () => {
    open(deal({ stage: 'won', probability: 100, contact: null, contactId: null }), []);
    const person = await screen.findByRole('region', { name: 'Main contact' });
    expect(screen.getByText('Closed on')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Details' })).getByText('No main contact')).toBeInTheDocument();
    await userEvent.click(within(person).getByRole('button', { name: 'Choose a contact' }));
    expect(await screen.findByRole('dialog', { name: 'Edit deal' })).toBeInTheDocument();
  });

  it('logs an activity on the deal, also on its main contact', async () => {
    open();
    await userEvent.click(await screen.findByRole('button', { name: 'Log activity' }));
    const dialog = await screen.findByRole('dialog', { name: 'Log activity' });
    expect(within(dialog).getByText('On the deal Fleet telematics')).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Also show on Dana Reyes's timeline")).toBeChecked();
  });

  it('saves a stage change from the edit form', async () => {
    const { calls } = open();
    await userEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit deal' });
    await userEvent.selectOptions(within(dialog).getByLabelText('Stage'), 'negotiation');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    expect(calls.find((c) => c.method === 'PATCH')!.body).toMatchObject({ stage: 'negotiation', probability: 75 });
    expect(await screen.findByText('Deal saved')).toBeInTheDocument();
  });

  it('deletes the deal and goes back to the deals list', async () => {
    const fetched = mockFetch({
      'GET /meta': () => ({ body: meta }),
      'GET /deals/5': () => ({ body: deal() }),
      'GET /deals/5/timeline': () => ({ body: [] }),
      'GET /contacts': () => ({ body: contacts }),
      'GET /deals/5/delete-preview': () => ({ body: { activitiesToDelete: 1, activitiesToKeep: 0 } }),
      'DELETE /deals/5': () => ({ status: 204 }),
    });
    renderPage(<DealPage />, { pattern: '/deals/:id', path: '/deals/5' });
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete Fleet telematics?' });
    expect(await within(dialog).findByText('Its 1 activity and stage changes will be deleted.')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(screen.getByRole('status', { name: 'Current path' })).toHaveTextContent(/^\/deals$/));
    expect(await screen.findByText('Deal deleted')).toBeInTheDocument();
    expect(fetched.calls.some((c) => c.method === 'DELETE')).toBe(true);
  });

  it("says the deal doesn't exist when it was deleted", async () => {
    open(null);
    expect(await screen.findByText("This deal doesn't exist")).toBeInTheDocument();
  });
});
