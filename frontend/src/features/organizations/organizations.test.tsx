import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OrganizationsPage } from './OrganizationsPage';
import { OrganizationPage } from './OrganizationPage';
import { mockFetch } from '../../test/render';
import { renderPage } from '../../test/pages';
import { contacts, meta, organizations } from '../../test/fixtures';
import { daysFromToday, deal } from '../../test/records';
import type { OrganizationDetail, OrganizationRow } from '../../api/types';
import { setUnreachable } from '../../app/connection';

afterEach(() => {
  vi.unstubAllGlobals();
  setUnreachable(false);
});

const rows: OrganizationRow[] = [
  { ...organizations[0], website: 'https://acme.example', openDealCount: 2, openPipeline: 90000 },
  { ...organizations[1], industry: null },
];

function detail(overrides: Partial<OrganizationDetail> = {}): OrganizationDetail {
  return {
    ...organizations[0],
    website: 'https://acme.example',
    notes: 'Renewal every spring',
    contacts: [
      {
        id: 10,
        name: 'Dana Reyes',
        firstName: 'Dana',
        lastName: 'Reyes',
        email: 'dana@acme.example',
        phone: null,
        jobTitle: 'Head of operations',
        status: 'lead',
        organizationId: 1,
      },
      {
        id: 12,
        name: 'Sam Ortiz',
        firstName: 'Sam',
        lastName: 'Ortiz',
        email: null,
        phone: null,
        jobTitle: null,
        status: 'customer',
        organizationId: 1,
      },
    ],
    deals: [
      deal({ id: 5, name: 'Fleet telematics', value: 45000, closeDate: daysFromToday(-3) }),
      deal({ id: 6, name: 'Spare parts', value: 5000, contact: null, contactId: null, stage: 'won' }),
    ],
    ...overrides,
  };
}

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

describe('the organizations table', () => {
  function open() {
    const fetched = mockFetch({
      'GET /meta': () => ({ body: meta }),
      'GET /organizations': () => ({ body: rows }),
      'GET /contacts': () => ({ body: contacts }),
      'GET /organizations/2/delete-preview': () => ({ body: { blocked: false, deals: [], contactsToUnlink: 1 } }),
      'DELETE /organizations/2': () => ({ status: 204 }),
      'PATCH /organizations/1': (body) => ({ body: { ...rows[0], ...(body as object) } }),
    });
    renderPage(<OrganizationsPage />, { pattern: '/organizations', path: '/organizations' });
    return fetched;
  }

  it('lists the organizations with a count of industries', async () => {
    open();
    const table = await screen.findByRole('table', { name: 'Organizations' });
    expect(screen.getByText('2 organizations · 1 industry')).toBeInTheDocument();
    const acme = within(table).getByRole('row', { name: /Acme/ });
    expect(within(acme).getByText('acme.example')).toBeInTheDocument();
    expect(within(acme).getByText('USD 90,000')).toBeInTheDocument();
    const brightwater = within(table).getByRole('row', { name: /Brightwater/ });
    expect(within(brightwater).getAllByText('—')).toHaveLength(2);
  });

  it('filters by search, and offers to clear a search with no matches', async () => {
    open();
    await screen.findByRole('table', { name: 'Organizations' });
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search organizations' }), 'bright');
    expect(screen.queryByRole('link', { name: 'Acme' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Brightwater Logistics' })).toBeInTheDocument();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search organizations' }), 'zzz');
    await userEvent.click(await screen.findByRole('button', { name: /Clear search/ }));
    expect(screen.getByRole('link', { name: 'Acme' })).toBeInTheDocument();
  });

  it('sorts by each column, with empty values last', async () => {
    open();
    const table = await screen.findByRole('table', { name: 'Organizations' });
    expect(await sortBy(table, 'Name')).toEqual(['Acme', 'Brightwater Logistics']);
    expect(await sortBy(table, 'Name')).toEqual(['Brightwater Logistics', 'Acme']);
    await sortBy(table, 'Name');
    expect(await sortBy(table, 'Industry')).toEqual(['Acme', 'Brightwater Logistics']);
    expect(await sortBy(table, 'Website')).toEqual(['Acme', 'Brightwater Logistics']);
    expect((await sortBy(table, 'Open pipeline')).length).toBe(2);
  });

  it('opens an organization when its row is clicked', async () => {
    open();
    await userEvent.click(await screen.findByText('Software'));
    expect(screen.getByRole('status', { name: 'Current path' })).toHaveTextContent('/organizations/1');
  });

  it('opens the new organization form', async () => {
    open();
    await userEvent.click(await screen.findByRole('button', { name: 'New organization' }));
    expect(await screen.findByRole('dialog', { name: 'New organization' })).toBeInTheDocument();
  });

  it('edits an organization from its row and saves the change', async () => {
    const { calls } = open();
    await userEvent.click(await screen.findByRole('button', { name: 'Edit Acme' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit organization' });
    expect(within(dialog).getByLabelText('Name')).toHaveValue('Acme');
    expect(within(dialog).getByLabelText(/Website/)).toHaveValue('https://acme.example');
    await userEvent.clear(within(dialog).getByLabelText('Name'));
    await userEvent.type(within(dialog).getByLabelText('Name'), 'Acme Corp');
    await userEvent.selectOptions(within(dialog).getByLabelText(/Industry/), 'Retail');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    expect(calls.find((c) => c.method === 'PATCH')!.body).toEqual({
      name: 'Acme Corp',
      website: 'https://acme.example',
      industry: 'Retail',
      notes: null,
    });
    expect(await screen.findByText('Organization saved')).toBeInTheDocument();
  });

  it('deletes an organization from its row after saying what happens to its contacts', async () => {
    const { calls } = open();
    await userEvent.click(await screen.findByRole('button', { name: 'Delete Brightwater Logistics' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete Brightwater Logistics?' });
    expect(await within(dialog).findByText('Its 1 contact will be kept without an organization.')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(calls.some((c) => c.method === 'DELETE' && c.path === '/organizations/2')).toBe(true));
    expect(await screen.findByText('Organization deleted')).toBeInTheDocument();
  });
});

describe('an organization page', () => {
  function open(org: OrganizationDetail | null = detail()) {
    const fetched = mockFetch({
      'GET /meta': () => ({ body: meta }),
      'GET /organizations/1': () =>
        org ? { body: org } : { status: 404, body: { detail: "This organization doesn't exist" } },
      'GET /organizations': () => ({ body: rows }),
      'GET /contacts': () => ({ body: contacts }),
      'GET /organizations/1/delete-preview': () => ({
        body: { blocked: true, deals: [{ id: 5, name: 'Fleet telematics' }], contactsToUnlink: 0 },
      }),
    });
    renderPage(<OrganizationPage />, { pattern: '/organizations/:id', path: '/organizations/1' });
    return fetched;
  }

  it('shows the details, contacts and deals, with late deals marked', async () => {
    open();
    expect(await screen.findByRole('heading', { level: 1, name: 'Acme' })).toBeInTheDocument();
    const details = screen.getByRole('region', { name: 'Details' });
    expect(within(details).getByRole('link', { name: 'acme.example' })).toHaveAttribute('href', 'https://acme.example');
    expect(within(details).getByText('Software')).toBeInTheDocument();
    expect(within(details).getByText('Renewal every spring')).toBeInTheDocument();
    expect(within(details).getByText('in 1 open deals')).toBeInTheDocument();

    const people = screen.getByRole('region', { name: 'Contacts' });
    expect(within(people).getByRole('link', { name: 'Dana Reyes' })).toHaveAttribute('href', '/contacts/10');
    expect(within(people).getByText('Head of operations')).toBeInTheDocument();
    expect(within(people).getByText('—')).toBeInTheDocument();

    const deals = screen.getByRole('region', { name: 'Deals' });
    expect(within(deals).getByRole('link', { name: 'Fleet telematics' })).toHaveAttribute('href', '/deals/5');
    expect(within(deals).getByText('Late')).toBeInTheDocument();
    expect(within(deals).getByText(/No main contact/)).toBeInTheDocument();
  });

  it('shows a website it cannot link as plain text, and an empty one as a dash', async () => {
    open(detail({ website: 'ftp://files.acme.example', industry: null, notes: null }));
    const details = await screen.findByRole('region', { name: 'Details' });
    expect(within(details).getByText('ftp://files.acme.example')).toBeInTheDocument();
    expect(within(details).queryByRole('link')).not.toBeInTheDocument();
  });

  it('says when it has no contacts or deals', async () => {
    open(detail({ website: null, contacts: [], deals: [] }));
    expect(await screen.findByText('No contacts yet')).toBeInTheDocument();
    expect(screen.getByText('No deals yet')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Details' })).getAllByText('—').length).toBeGreaterThan(0);
  });

  it('opens new contact and new deal forms with this organization chosen', async () => {
    open();
    await userEvent.click(await screen.findByRole('button', { name: 'New contact' }));
    const contactForm = await screen.findByRole('dialog', { name: 'New contact' });
    expect(within(contactForm).getByRole('combobox', { name: /Organization/ })).toHaveValue('Acme');
    await userEvent.click(within(contactForm).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(contactForm).not.toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'New deal' }));
    const dealForm = await screen.findByRole('dialog', { name: 'New deal' });
    expect(within(dealForm).getByRole('combobox', { name: /Organization/ })).toHaveValue('Acme');
  });

  it('opens the edit form', async () => {
    open();
    await userEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    expect(await screen.findByRole('dialog', { name: 'Edit organization' })).toBeInTheDocument();
  });

  it("says it can't be deleted while it has deals, linking to them", async () => {
    open();
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog', { name: "Acme can't be deleted" });
    expect(within(dialog).getByText(/because it has 1 deal/)).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'Fleet telematics' })).toHaveAttribute('href', '/deals/5');
    expect(within(dialog).queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('link', { name: 'Fleet telematics' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    expect(screen.getByRole('status', { name: 'Current path' })).toHaveTextContent('/deals/5');
  });

  it("says the organization doesn't exist when it was deleted", async () => {
    open(null);
    expect(await screen.findByText("This organization doesn't exist")).toBeInTheDocument();
  });
});
