import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DealForm } from './deals/DealForm';
import { ContactForm } from './contacts/ContactForm';
import { OrganizationForm } from './organizations/OrganizationForm';
import { ActivityForm } from './activities/ActivityForm';
import { mockFetch, renderApp } from '../test/render';
import { contacts, meta, organizations } from '../test/fixtures';
import { useMeta } from '../lib/hooks';
import { setUnreachable } from '../app/connection';
import type { Deal } from '../api/types';

function WithMeta({ children }: { children: React.ReactNode }) {
  const { data } = useMeta();
  return data ? <>{children}</> : null;
}

function Open({ form, onClose }: { form: 'deal' | 'contact' | 'organization'; onClose: () => void }) {
  return (
    <WithMeta>
      {form === 'deal' && <DealForm onClose={onClose} />}
      {form === 'contact' && <ContactForm onClose={onClose} />}
      {form === 'organization' && <OrganizationForm onClose={onClose} />}
    </WithMeta>
  );
}

let calls: ReturnType<typeof mockFetch>['calls'];
let saveAnswer: () => { status?: number; body?: unknown } | 'network';

beforeEach(() => {
  saveAnswer = () => ({ body: { id: 99 } });
  calls = mockFetch({
    'GET /meta': () => ({ body: meta }),
    'GET /organizations': () => ({ body: organizations }),
    'GET /contacts': () => ({ body: contacts }),
    'POST /deals': () => saveAnswer(),
    'POST /contacts': () => saveAnswer(),
    'POST /organizations': () => saveAnswer(),
  }).calls;
});
afterEach(() => {
  vi.unstubAllGlobals();
  setUnreachable(false);
});

async function chooseOrganization(name: string) {
  await userEvent.click(screen.getByRole('combobox', { name: 'Organization' }));
  await userEvent.click(await screen.findByRole('option', { name }));
}

describe('deal form', () => {
  it('shows errors under required fields, a negative value and a probability over 100', async () => {
    renderApp(<Open form="deal" onClose={vi.fn()} />);
    await screen.findByRole('dialog', { name: 'New deal' });
    await userEvent.type(screen.getByLabelText('Value (USD)'), '-5');
    await userEvent.clear(screen.getByLabelText('Probability (%)'));
    await userEvent.type(screen.getByLabelText('Probability (%)'), '101');
    await userEvent.click(screen.getByRole('button', { name: 'Add deal' }));
    expect(await screen.findByText('Enter a name')).toBeInTheDocument();
    expect(screen.getByText('Choose an organization')).toBeInTheDocument();
    expect(screen.getByText('Enter a value of 0 or more, in whole dollars')).toBeInTheDocument();
    expect(screen.getByText('Enter a probability from 0 to 100')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
    expect(calls.some((c) => c.method === 'POST')).toBe(false);
  });

  it('offers only the organization’s contacts, and clears the contact when the organization changes', async () => {
    renderApp(<Open form="deal" onClose={vi.fn()} />);
    await screen.findByRole('dialog', { name: 'New deal' });
    const contactSelect = screen.getByLabelText(/Main contact/);
    expect(contactSelect).toBeDisabled();
    await chooseOrganization('Acme');
    await waitFor(() => expect(contactSelect).toBeEnabled());
    expect(screen.queryByRole('option', { name: 'Uma Iyer' })).not.toBeInTheDocument();
    await userEvent.selectOptions(contactSelect, 'Dana Reyes');
    expect(contactSelect).toHaveValue('10');
    await chooseOrganization('Brightwater Logistics');
    expect(contactSelect).toHaveValue('');
  });

  it('sets the probability when the stage changes, and today as close date on Won', async () => {
    renderApp(<Open form="deal" onClose={vi.fn()} />);
    await screen.findByRole('dialog', { name: 'New deal' });
    expect(screen.getByLabelText('Probability (%)')).toHaveValue('10');
    await userEvent.selectOptions(screen.getByLabelText('Stage'), 'negotiation');
    expect(screen.getByLabelText('Probability (%)')).toHaveValue('75');
    await userEvent.selectOptions(screen.getByLabelText('Stage'), 'won');
    expect(screen.getByLabelText('Probability (%)')).toHaveValue('100');
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(screen.getByLabelText('Close date')).toHaveValue(iso);
  });

  it('sends the deal with today', async () => {
    const onClose = vi.fn<() => void>();
    renderApp(<Open form="deal" onClose={onClose} />);
    await screen.findByRole('dialog', { name: 'New deal' });
    await userEvent.type(screen.getByLabelText('Name'), 'Fleet telematics');
    await chooseOrganization('Acme');
    await userEvent.type(screen.getByLabelText('Value (USD)'), '45,000');
    await userEvent.click(screen.getByRole('button', { name: 'Add deal' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const post = calls.find((c) => c.method === 'POST' && c.path === '/deals')!;
    expect(post.body).toMatchObject({ name: 'Fleet telematics', organizationId: 1, contactId: null, stage: 'new', value: 45000, probability: 10 });
    expect((post.body as Deal & { today: string }).today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('contact form', () => {
  it('refuses a malformed email and missing names', async () => {
    renderApp(<Open form="contact" onClose={vi.fn()} />);
    await screen.findByRole('dialog', { name: 'New contact' });
    await userEvent.type(screen.getByLabelText(/Email/), 'dana@');
    await userEvent.click(screen.getByRole('button', { name: 'Add contact' }));
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Enter a first name')).toBeInTheDocument();
    expect(screen.getByText('Enter a last name')).toBeInTheDocument();
  });

  it('shows the backend’s duplicate email message under the field', async () => {
    saveAnswer = () => ({ status: 409, body: { detail: 'Already used by Dana Reyes', fields: { email: 'Already used by Dana Reyes' } } });
    renderApp(<Open form="contact" onClose={vi.fn()} />);
    await screen.findByRole('dialog', { name: 'New contact' });
    await userEvent.type(screen.getByLabelText('First name'), 'Other');
    await userEvent.type(screen.getByLabelText('Last name'), 'Person');
    await userEvent.type(screen.getByLabelText(/Email/), 'dana@acme.example');
    await userEvent.click(screen.getByRole('button', { name: 'Add contact' }));
    expect(await screen.findByText('Already used by Dana Reyes')).toBeInTheDocument();
  });
});

describe('closing a changed form', () => {
  async function typeSomething() {
    renderApp(<Open form="organization" onClose={onClose} />);
    await screen.findByRole('dialog', { name: 'New organization' });
    await userEvent.type(screen.getByLabelText('Name'), 'Half typed');
  }
  let onClose: ReturnType<typeof vi.fn<() => void>>;
  beforeEach(() => {
    onClose = vi.fn<() => void>();
  });

  it('asks before discarding on Cancel, and Keep editing keeps what was typed', async () => {
    await typeSomething();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    const ask = await screen.findByRole('alertdialog', { name: 'Discard your changes?' });
    expect(screen.getByRole('button', { name: 'Keep editing' })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    await waitFor(() => expect(ask).not.toBeInTheDocument());
    expect(screen.getByLabelText('Name')).toHaveValue('Half typed');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('asks on Escape, and Discard closes', async () => {
    await typeSomething();
    await userEvent.keyboard('{Escape}');
    await screen.findByRole('alertdialog', { name: 'Discard your changes?' });
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('asks on a click on the backdrop', async () => {
    await typeSomething();
    const backdrop = document.querySelector('.dialog-backdrop')!;
    fireEvent.pointerDown(backdrop);
    fireEvent.pointerUp(backdrop);
    fireEvent.click(backdrop);
    expect(await screen.findByRole('alertdialog', { name: 'Discard your changes?' })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes straight away when nothing changed', async () => {
    renderApp(<Open form="organization" onClose={onClose} />);
    await screen.findByRole('dialog', { name: 'New organization' });
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});

describe('a failed save (G9)', () => {
  it('keeps what was typed and says the change was not saved', async () => {
    saveAnswer = () => 'network';
    const onClose = vi.fn<() => void>();
    renderApp(<Open form="organization" onClose={onClose} />);
    await screen.findByRole('dialog', { name: 'New organization' });
    await userEvent.type(screen.getByLabelText('Name'), 'Northgate Legal');
    await userEvent.click(screen.getByRole('button', { name: 'Add organization' }));
    expect(await screen.findByRole('alert')).toHaveTextContent("Your changes weren't saved. Can't reach Accountable. Check that it's running.");
    expect(screen.getByLabelText('Name')).toHaveValue('Northgate Legal');
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('logging an activity from the dashboard (A2)', () => {
  const deal = {
    id: 5, name: 'Fleet telematics', organizationId: 1, organization: { id: 1, name: 'Acme' }, contactId: 10,
    contact: { id: 10, name: 'Dana Reyes' }, stage: 'proposal', value: 45000, probability: 50, closeDate: '2026-12-01',
    position: 0, createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z',
  };

  async function logOnDeal(untick: boolean) {
    calls = mockFetch({
      'GET /contacts': () => ({ body: contacts }),
      'GET /deals': () => ({ body: [deal] }),
      'POST /activities': () => ({ body: { id: 1 } }),
    }).calls;
    const onClose = vi.fn<() => void>();
    renderApp(<ActivityForm onClose={onClose} />);
    await screen.findByRole('dialog', { name: 'Log activity' });
    expect(screen.queryByLabelText(/Also show on/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('combobox', { name: /Deal/ }));
    await userEvent.click(await screen.findByRole('option', { name: /Fleet telematics/ }));
    const relate = await screen.findByLabelText("Also show on Dana Reyes's timeline");
    expect(relate).toBeChecked();
    if (untick) await userEvent.click(relate);
    await userEvent.type(screen.getByLabelText('Description'), 'Called about the pilot');
    await userEvent.click(screen.getByRole('button', { name: 'Log activity' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    return calls.find((c) => c.method === 'POST' && c.path === '/activities')!.body;
  }

  it("shows the chosen deal's main contact, ticked", async () => {
    expect(await logOnDeal(false)).toMatchObject({ dealId: 5, contactId: null, relateToMainContact: true });
  });

  it('lets the user untick it', async () => {
    expect(await logOnDeal(true)).toMatchObject({ dealId: 5, contactId: null, relateToMainContact: false });
  });
});
