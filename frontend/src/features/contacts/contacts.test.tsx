import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContactsPage } from './ContactsPage';
import { ContactPage } from './ContactPage';
import { mockFetch } from '../../test/render';
import { renderPage } from '../../test/pages';
import { contacts, meta, organizations } from '../../test/fixtures';
import { activity, daysFromToday, deal } from '../../test/records';
import type { Contact, ContactDetail } from '../../api/types';
import { setUnreachable } from '../../app/connection';

afterEach(() => {
  vi.unstubAllGlobals();
  setUnreachable(false);
});

const people: Contact[] = [
  { ...contacts[0], jobTitle: 'Head of operations', phone: '555-0100' },
  contacts[1],
  {
    ...contacts[0],
    id: 12,
    firstName: 'Sam',
    lastName: 'Ortiz',
    email: null,
    status: 'qualified',
    organizationId: null,
    organization: null,
  },
];

function detail(overrides: Partial<ContactDetail> = {}): ContactDetail {
  return {
    ...people[0],
    deals: [deal({ id: 5, closeDate: daysFromToday(-2) }), deal({ id: 6, name: 'Spare parts', stage: 'won' })],
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

describe('the contacts table', () => {
  function open() {
    const fetched = mockFetch({
      'GET /meta': () => ({ body: meta }),
      'GET /contacts': () => ({ body: people }),
      'GET /organizations': () => ({ body: organizations }),
      'GET /contacts/10/delete-preview': () => ({
        body: { activitiesToDelete: 3, activitiesToKeep: 1, dealsToUnlink: 2 },
      }),
    });
    renderPage(<ContactsPage />, { pattern: '/contacts', path: '/contacts' });
    return fetched;
  }

  it('lists the contacts with their organization, or none', async () => {
    open();
    const table = await screen.findByRole('table', { name: 'Contacts' });
    expect(screen.getByText('3 contacts · 1 customer')).toBeInTheDocument();
    const dana = within(table).getByRole('row', { name: /Dana Reyes/ });
    expect(within(dana).getByRole('link', { name: 'Acme' })).toHaveAttribute('href', '/organizations/1');
    expect(within(dana).getByText('555-0100')).toBeInTheDocument();
    expect(within(table).getByText('No organization')).toBeInTheDocument();
  });

  it('filters by status with counts, together with search', async () => {
    open();
    await screen.findByRole('table', { name: 'Contacts' });
    const filters = screen.getByRole('group', { name: 'Filter by status' });
    expect(within(filters).getByRole('button', { name: 'All 3' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(within(filters).getByRole('button', { name: 'Customers 1' }));
    expect(screen.getByRole('link', { name: 'Uma Iyer' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Dana Reyes' })).not.toBeInTheDocument();
    await userEvent.click(within(filters).getByRole('button', { name: 'Leads 1' }));
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search contacts' }), 'uma');
    expect(screen.getByText(/No leads match/)).toBeInTheDocument();
  });

  it('opens a new contact with the chosen status filled in', async () => {
    open();
    await screen.findByRole('table', { name: 'Contacts' });
    await userEvent.click(screen.getByRole('button', { name: 'Qualified 1' }));
    await userEvent.click(screen.getByRole('button', { name: 'New contact' }));
    const dialog = await screen.findByRole('dialog', { name: 'New contact' });
    expect(within(dialog).getByLabelText('Status')).toHaveValue('qualified');
  });

  it('opens a contact when its row is clicked', async () => {
    open();
    await userEvent.click(await screen.findByText('Head of operations'));
    expect(screen.getByRole('status', { name: 'Current path' })).toHaveTextContent('/contacts/10');
  });

  it('says what deleting a contact does to its activities and deals', async () => {
    open();
    await userEvent.click(await screen.findByRole('button', { name: 'Delete Dana Reyes' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete Dana Reyes?' });
    expect(
      await within(dialog).findByText(
        'Their 3 activities will be deleted. 2 deals will be kept without a main contact.',
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("1 activity also on a deal will stay on that deal's timeline."),
    ).toBeInTheDocument();
  });

  it('sorts by each column, with empty values last', async () => {
    open();
    const table = await screen.findByRole('table', { name: 'Contacts' });
    expect(await sortBy(table, 'Name')).toEqual(['Uma Iyer', 'Sam Ortiz', 'Dana Reyes']);
    expect(await sortBy(table, 'Name')).toEqual(['Dana Reyes', 'Sam Ortiz', 'Uma Iyer']);
    await sortBy(table, 'Name');
    expect(await sortBy(table, 'Organization')).toEqual(['Dana Reyes', 'Uma Iyer', 'Sam Ortiz']);
    expect((await sortBy(table, 'Job title'))[0]).toBe('Dana Reyes');
    expect((await sortBy(table, 'Email')).at(-1)).toMatch(/Uma Iyer|Sam Ortiz/);
    expect((await sortBy(table, 'Phone'))[0]).toBe('Dana Reyes');
    expect(await sortBy(table, 'Status')).toEqual(['Dana Reyes', 'Sam Ortiz', 'Uma Iyer']);
  });

  it('clears a search that matches nothing', async () => {
    open();
    await screen.findByRole('table', { name: 'Contacts' });
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search contacts' }), 'zzz');
    await userEvent.click(await screen.findByRole('button', { name: /Clear search/ }));
    expect(screen.getByRole('link', { name: 'Dana Reyes' })).toBeInTheDocument();
  });

  it('opens the edit form from a row', async () => {
    open();
    await userEvent.click(await screen.findByRole('button', { name: 'Edit Dana Reyes' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit contact' });
    expect(within(dialog).getByLabelText('First name')).toHaveValue('Dana');
  });
});

describe('a contact page', () => {
  function open(contact: ContactDetail | null = detail(), timeline = [activity()]) {
    const fetched = mockFetch({
      'GET /meta': () => ({ body: meta }),
      'GET /contacts/10': () => (contact ? { body: contact } : { status: 404, body: { detail: 'Not found' } }),
      'GET /contacts/10/timeline': () => ({ body: timeline }),
      'GET /contacts': () => ({ body: people }),
      'GET /organizations': () => ({ body: organizations }),
      'GET /deals': () => ({ body: [] }),
    });
    renderPage(<ContactPage />, { pattern: '/contacts/:id', path: '/contacts/10' });
    return fetched;
  }

  it('shows the details, deals and timeline', async () => {
    open();
    expect(await screen.findByRole('heading', { level: 1, name: 'Dana Reyes' })).toBeInTheDocument();
    const details = screen.getByRole('region', { name: 'Details' });
    expect(within(details).getByText('Lead')).toBeInTheDocument();
    expect(within(details).getByRole('link', { name: 'Acme' })).toHaveAttribute('href', '/organizations/1');
    expect(within(details).getByRole('link', { name: 'dana@acme.example' })).toHaveAttribute(
      'href',
      'mailto:dana@acme.example',
    );
    expect(within(details).getByText('555-0100')).toBeInTheDocument();
    const deals = screen.getByRole('region', { name: 'Deals' });
    expect(within(deals).getByRole('link', { name: 'Fleet telematics' })).toBeInTheDocument();
    expect(within(deals).getByText('Late')).toBeInTheDocument();
    const timeline = screen.getByRole('region', { name: 'Timeline' });
    expect(await within(timeline).findByText('Called about the pilot')).toBeInTheDocument();
    expect(within(timeline).getByRole('link', { name: 'Fleet telematics' })).toHaveAttribute('href', '/deals/5');
  });

  it('shows missing details as dashes, and no New deal without an organization', async () => {
    open(detail({ organizationId: null, organization: null, email: null, phone: null, jobTitle: null, deals: [] }), []);
    const details = await screen.findByRole('region', { name: 'Details' });
    expect(within(details).getByText('No organization')).toBeInTheDocument();
    expect(within(details).getAllByText('—')).toHaveLength(3);
    expect(screen.getByText('Not the main contact on any deal')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'New deal' })).not.toBeInTheDocument();
    expect(await screen.findByText('Nothing logged yet')).toBeInTheDocument();
  });

  it('opens a new deal with this contact and organization chosen', async () => {
    open();
    await userEvent.click(await screen.findByRole('button', { name: 'New deal' }));
    const dialog = await screen.findByRole('dialog', { name: 'New deal' });
    expect(within(dialog).getByRole('combobox', { name: /Organization/ })).toHaveValue('Acme');
    await waitFor(() => expect(within(dialog).getByLabelText(/Main contact/)).toHaveValue('10'));
  });

  it('logs an activity on this contact', async () => {
    open();
    await userEvent.click(await screen.findByRole('button', { name: 'Log activity' }));
    const dialog = await screen.findByRole('dialog', { name: 'Log activity' });
    expect(within(dialog).getByText('On Dana Reyes')).toBeInTheDocument();
  });

  it('opens the edit form and the delete dialog', async () => {
    open();
    await userEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    expect(await screen.findByRole('dialog', { name: 'Edit contact' })).toBeInTheDocument();
  });

  it("says the contact doesn't exist when it was deleted", async () => {
    open(null);
    expect(await screen.findByText("This contact doesn't exist")).toBeInTheDocument();
  });
});

describe('moving a contact to another organization (C5)', () => {
  const dana = people[0];

  function open(
    preview: { deals: { id: number; name: string }[] },
    patch: (body: unknown) => { status?: number; body?: unknown },
  ) {
    const fetched = mockFetch({
      'GET /meta': () => ({ body: meta }),
      'GET /contacts/10': () => ({ body: detail() }),
      'GET /contacts/10/timeline': () => ({ body: [] }),
      'GET /contacts': () => ({ body: people }),
      'GET /organizations': () => ({ body: organizations }),
      'GET /contacts/10/organization-change-preview': () => ({ body: preview }),
      'PATCH /contacts/10': patch,
    });
    renderPage(<ContactPage />, { pattern: '/contacts/:id', path: '/contacts/10' });
    return fetched;
  }

  async function moveTo(name: string | null) {
    await userEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit contact' });
    if (name) {
      await userEvent.click(within(dialog).getByRole('combobox', { name: /Organization/ }));
      await userEvent.click(await screen.findByRole('option', { name }));
    } else {
      await userEvent.click(within(dialog).getByRole('button', { name: 'Clear' }));
    }
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    return dialog;
  }

  it('asks first, naming the deals that lose their main contact, then saves with confirmUnlink', async () => {
    const { calls } = open({ deals: [{ id: 5, name: 'Fleet telematics' }] }, (body) => ({
      body: { ...dana, ...(body as object) },
    }));
    const dialog = await moveTo('Brightwater Logistics');
    expect(
      await within(dialog).findByText(
        /Dana Reyes is the main contact on this deal at Acme. Moving them to Brightwater Logistics/,
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'Fleet telematics' })).toHaveAttribute('href', '/deals/5');
    expect(calls.some((c) => c.method === 'PATCH')).toBe(false);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save and remove from deal' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    expect(calls.find((c) => c.method === 'PATCH')!.body).toMatchObject({ organizationId: 2, confirmUnlink: true });
  });

  it('goes back to the form, and names several deals when moving out of any organization', async () => {
    open(
      {
        deals: [
          { id: 5, name: 'Fleet telematics' },
          { id: 6, name: 'Spare parts' },
        ],
      },
      () => ({ body: dana }),
    );
    const dialog = await moveTo(null);
    expect(
      await within(dialog).findByText(/on these 2 deals at Acme. Moving them out of it leaves them/),
    ).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Back' }));
    expect(within(dialog).getByLabelText('First name')).toHaveValue('Dana');
  });

  it('saves straight away when no deal loses its contact', async () => {
    const { calls } = open({ deals: [] }, () => ({ body: dana }));
    const dialog = await moveTo('Brightwater Logistics');
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    expect(calls.find((c) => c.method === 'PATCH')!.body).toMatchObject({ organizationId: 2 });
    expect(calls.find((c) => c.method === 'PATCH')!.body).not.toHaveProperty('confirmUnlink');
    expect(await screen.findByText('Contact saved')).toBeInTheDocument();
  });

  it('asks when the backend refuses because deals would lose their contact', async () => {
    let first = true;
    open({ deals: [] }, () => {
      if (!first) return { body: dana };
      first = false;
      return { status: 409, body: { detail: 'Confirm', deals: [{ id: 5, name: 'Fleet telematics' }] } };
    });
    const dialog = await moveTo('Brightwater Logistics');
    expect(await within(dialog).findByRole('button', { name: 'Save and remove from deal' })).toBeInTheDocument();
  });

  it('shows a refusal that has no deals as a form error', async () => {
    open({ deals: [] }, () => ({ status: 422, body: { detail: 'Something is off' } }));
    const dialog = await moveTo('Brightwater Logistics');
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Something is off');
  });
});
