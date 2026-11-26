import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Timeline } from './Timeline';
import { ActivityForm } from './ActivityForm';
import { followUpPillText } from './FollowUp';
import { FormsProvider } from '../../app/forms';
import { mockFetch, renderApp } from '../../test/render';
import { contacts, meta } from '../../test/fixtures';
import { activity, daysFromToday, deal, today } from '../../test/records';
import type { Activity } from '../../api/types';
import { setUnreachable } from '../../app/connection';

afterEach(() => {
  vi.unstubAllGlobals();
  setUnreachable(false);
});

describe('the follow-up pill text', () => {
  it.each([
    [{ followUpOn: null, done: false }, null],
    [{ followUpOn: daysFromToday(-3), done: false }, '3 days overdue'],
    [{ followUpOn: daysFromToday(-1), done: false }, '1 day overdue'],
    [{ followUpOn: today, done: false }, 'Due today'],
    [{ followUpOn: daysFromToday(1), done: false }, 'Due tomorrow'],
  ])('reads %j as %s', (followUp, text) => {
    expect(followUpPillText(followUp, today)).toBe(text);
  });

  it('gives the date when a follow-up is due later this week, later on, or done', () => {
    const today = '2026-11-25';
    expect(followUpPillText({ followUpOn: '2026-11-29', done: false }, today)).toBe('Due Nov 29');
    expect(followUpPillText({ followUpOn: '2026-12-20', done: false }, today)).toBe('Follow up Dec 20');
    expect(followUpPillText({ followUpOn: '2026-11-17', done: true }, today)).toBe('Done · Nov 17');
  });
});

describe('a timeline', () => {
  function show(activities: Activity[], on: 'contact' | 'deal' = 'contact', routes = {}) {
    const fetched = mockFetch({ 'GET /meta': () => ({ body: meta }), ...routes });
    renderApp(
      <FormsProvider>
        <Timeline activities={activities} today={today} on={on} />
      </FormsProvider>,
    );
    return fetched;
  }

  it('says when nothing has been logged', () => {
    show([]);
    expect(screen.getByText('Nothing logged yet')).toBeInTheDocument();
  });

  it('shows each entry with its date and the other record as a link', () => {
    show([
      activity({ id: 1, occurredOn: today }),
      activity({ id: 2, kind: 'email', description: 'Sent the quote', occurredOn: daysFromToday(-1), deal: null }),
      activity({ id: 3, kind: 'note', description: 'Old note', occurredOn: '2025-02-03' }),
    ]);
    const entries = within(screen.getByRole('list', { name: 'Timeline' })).getAllByRole('listitem');
    expect(within(entries[0]).getByText('Today')).toBeInTheDocument();
    expect(within(entries[0]).getByRole('link', { name: 'Fleet telematics' })).toHaveAttribute('href', '/deals/5');
    expect(within(entries[1]).getByText('Yesterday')).toBeInTheDocument();
    expect(within(entries[1]).queryByRole('link')).not.toBeInTheDocument();
    expect(within(entries[2]).getByText('Feb 3, 2025')).toBeInTheDocument();
  });

  it('links the contact on a deal timeline, and gives stage changes no actions', () => {
    show(
      [
        activity({ id: 1 }),
        activity({
          id: 2,
          kind: 'stage_change',
          description: 'Moved from Proposal to Negotiation',
          contact: null,
          contactId: null,
        }),
      ],
      'deal',
    );
    expect(screen.getByRole('link', { name: 'Dana Reyes' })).toHaveAttribute('href', '/contacts/10');
    expect(screen.getByRole('button', { name: 'Actions for Called about the pilot' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Actions for Moved/ })).not.toBeInTheDocument();
  });

  it('shows a follow-up with its label, and marks it done', async () => {
    const { calls } = show([activity({ followUpOn: daysFromToday(-2) })], 'contact', {
      'PATCH /activities/1': () => ({ body: activity({ done: true }) }),
    });
    expect(screen.getByText('2 days overdue')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Mark done: Called about the pilot' }));
    expect(await screen.findByText('Follow-up marked done')).toBeInTheDocument();
    expect(calls.find((c) => c.method === 'PATCH')!.body).toEqual({ done: true });
  });

  it('marks a done follow-up not done again', async () => {
    show([activity({ followUpOn: daysFromToday(-2), done: true })], 'contact', {
      'PATCH /activities/1': () => ({ body: activity() }),
    });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Mark not done: Called about the pilot' }));
    expect(await screen.findByText('Follow-up marked not done')).toBeInTheDocument();
  });

  it('says so when marking a follow-up fails, and leaves it as it was', async () => {
    show([activity({ followUpOn: daysFromToday(2) })], 'contact', {
      'PATCH /activities/1': () => ({ status: 500, body: { detail: 'Broken' } }),
    });
    const box = screen.getByRole('checkbox', { name: 'Mark done: Called about the pilot' });
    await userEvent.click(box);
    expect(await screen.findByText("Couldn't update the follow-up. Try again.")).toBeInTheDocument();
    await waitFor(() => expect(box).not.toBeChecked());
  });

  it('edits an entry from its menu', async () => {
    const { calls } = show([activity({ kind: 'note', followUpOn: daysFromToday(3) })], 'contact', {
      'PATCH /activities/1': () => ({ body: activity() }),
    });
    await userEvent.click(screen.getByRole('button', { name: 'Actions for Called about the pilot' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit activity' });
    expect(within(dialog).getByLabelText('Description')).toHaveValue('Called about the pilot');
    expect(within(dialog).getByRole('radio', { name: 'Note' })).toBeChecked();
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Email' }));
    await userEvent.click(within(dialog).getByLabelText('Follow-up done'));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    const body = calls.find((c) => c.method === 'PATCH')!.body;
    expect(body).toMatchObject({ kind: 'email', done: true, followUpOn: daysFromToday(3) });
    expect(body).not.toHaveProperty('contactId');
    expect(await screen.findByText('Activity saved')).toBeInTheDocument();
  });

  it('deletes an entry after asking', async () => {
    const { calls } = show([activity()], 'contact', { 'DELETE /activities/1': () => ({ status: 204 }) });
    await userEvent.click(screen.getByRole('button', { name: 'Actions for Called about the pilot' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete this activity?' });
    expect(
      await within(dialog).findByText('“Called about the pilot” will be removed from every timeline.'),
    ).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Activity deleted')).toBeInTheDocument();
    expect(calls.some((c) => c.method === 'DELETE' && c.path === '/activities/1')).toBe(true);
  });
});

describe('the activity form', () => {
  function open(
    props: Parameters<typeof ActivityForm>[0],
    post: () => { status?: number; body?: unknown } | 'network',
  ) {
    const fetched = mockFetch({
      'GET /contacts': () => ({ body: contacts }),
      'GET /deals': () => ({ body: [deal()] }),
      'POST /activities': post,
    });
    renderApp(<ActivityForm {...props} />);
    return fetched;
  }

  it('logs an activity on a contact', async () => {
    const onClose = vi.fn<() => void>();
    const { calls } = open({ target: { contact: { id: 10, name: 'Dana Reyes' } }, onClose }, () => ({ body: {} }));
    const dialog = await screen.findByRole('dialog', { name: 'Log activity' });
    expect(within(dialog).queryByLabelText(/Also show on/)).not.toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Call' }));
    await userEvent.type(within(dialog).getByLabelText('Description'), 'Checked in');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Log activity' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(calls.find((c) => c.method === 'POST')!.body).toEqual({
      kind: 'call',
      description: 'Checked in',
      occurredOn: today,
      followUpOn: null,
      done: false,
      contactId: 10,
    });
    expect(calls.some((c) => c.path === '/contacts' || c.path === '/deals')).toBe(false);
  });

  it('logs an activity on a deal with a follow-up, leaving out its main contact when unticked', async () => {
    const onClose = vi.fn<() => void>();
    const target = { deal: { id: 5, name: 'Fleet telematics', contact: { id: 10, name: 'Dana Reyes' } } };
    const { calls } = open({ target, onClose }, () => ({ body: {} }));
    const dialog = await screen.findByRole('dialog', { name: 'Log activity' });
    await userEvent.click(within(dialog).getByLabelText("Also show on Dana Reyes's timeline"));
    await userEvent.type(within(dialog).getByLabelText('Description'), 'Send the contract');
    await userEvent.type(within(dialog).getByLabelText(/Follow-up date/), daysFromToday(2));
    await userEvent.click(within(dialog).getByLabelText('Follow-up done'));
    await userEvent.clear(within(dialog).getByLabelText(/Follow-up date/));
    expect(within(dialog).queryByLabelText('Follow-up done')).not.toBeInTheDocument();
    await userEvent.type(within(dialog).getByLabelText(/Follow-up date/), daysFromToday(2));
    expect(within(dialog).getByLabelText('Follow-up done')).not.toBeChecked();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Log activity' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(calls.find((c) => c.method === 'POST')!.body).toMatchObject({
      dealId: 5,
      relateToMainContact: false,
      followUpOn: daysFromToday(2),
      done: false,
    });
  });

  it('asks for a description and a date', async () => {
    const { calls } = open({ target: { contact: { id: 10, name: 'Dana Reyes' } }, onClose: vi.fn() }, () => ({
      body: {},
    }));
    const dialog = await screen.findByRole('dialog', { name: 'Log activity' });
    await userEvent.clear(within(dialog).getByLabelText('Date it happened'));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Log activity' }));
    expect(await within(dialog).findByText('Enter a description')).toBeInTheDocument();
    expect(within(dialog).getByText('Enter the date it happened')).toBeInTheDocument();
    expect(calls.some((c) => c.method === 'POST')).toBe(false);
  });

  it('asks for a contact or a deal when opened without one', async () => {
    const { calls } = open({ onClose: vi.fn() }, () => ({ body: {} }));
    const dialog = await screen.findByRole('dialog', { name: 'Log activity' });
    await userEvent.type(within(dialog).getByLabelText('Description'), 'Note');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Log activity' }));
    expect(await within(dialog).findByText('Choose a contact or a deal')).toBeInTheDocument();
    expect(calls.some((c) => c.method === 'POST')).toBe(false);
  });

  it('relates a chosen contact only, without asking about a main contact', async () => {
    const onClose = vi.fn<() => void>();
    const { calls } = open({ onClose }, () => ({ body: {} }));
    const dialog = await screen.findByRole('dialog', { name: 'Log activity' });
    await userEvent.click(within(dialog).getByRole('combobox', { name: /Contact/ }));
    await userEvent.click(await screen.findByRole('option', { name: 'Uma Iyer' }));
    await userEvent.click(within(dialog).getByRole('combobox', { name: /Deal/ }));
    await userEvent.click(await screen.findByRole('option', { name: /Fleet telematics/ }));
    expect(within(dialog).queryByLabelText(/Also show on/)).not.toBeInTheDocument();
    await userEvent.type(within(dialog).getByLabelText('Description'), 'Met at the fair');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Log activity' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(calls.find((c) => c.method === 'POST')!.body).toMatchObject({
      contactId: 11,
      dealId: 5,
      relateToMainContact: false,
    });
  });

  it('shows a refusal under its field', async () => {
    open({ target: { contact: { id: 10, name: 'Dana Reyes' } }, onClose: vi.fn() }, () => ({
      status: 422,
      body: { detail: 'Invalid', fields: { description: 'Too long' } },
    }));
    const dialog = await screen.findByRole('dialog', { name: 'Log activity' });
    await userEvent.type(within(dialog).getByLabelText('Description'), 'Long text');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Log activity' }));
    expect(await within(dialog).findByText('Too long')).toBeInTheDocument();
  });
});
