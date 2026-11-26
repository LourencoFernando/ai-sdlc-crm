import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { api } from '../api/endpoints';
import { ApiError } from '../api/client';
import { contacts, meta, organizations } from '../test/fixtures';
import { mockFetch, Providers, renderApp } from '../test/render';
import { setUnreachable } from './connection';
import { FormsProvider, useForms } from './forms';
import { Layout } from './Layout';
import { createQueryClient, refreshAll } from './query-client';
import { readCollapsed, writeCollapsed } from './sidebar-state';
import { ToastProvider, useToast } from './toasts';
import { stageProbability, useToday } from '../lib/hooks';
import { todayLocal } from '../lib/dates';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  setUnreachable(false);
});

function FormButtons() {
  const forms = useForms();
  return (
    <>
      <button onClick={() => forms.openOrganization()}>org</button>
      <button onClick={() => forms.openContact()}>contact</button>
      <button onClick={() => forms.openDeal()}>deal</button>
      <button onClick={() => forms.openActivity({ target: { contact: { id: 10, name: 'Dana Reyes' } } })}>
        activity
      </button>
      <button onClick={() => forms.confirmDelete({ kind: 'deal', record: { id: 7, name: 'Acme renewal' } })}>
        delete
      </button>
    </>
  );
}

describe('forms from anywhere', () => {
  it('opens each record form and the delete dialog', async () => {
    mockFetch({
      'GET /meta': () => ({ body: meta }),
      'GET /organizations': () => ({ body: organizations }),
      'GET /contacts': () => ({ body: contacts }),
      'GET /deals/7/delete-preview': () => ({ body: { activities: 2 } }),
    });
    renderApp(
      <FormsProvider>
        <FormButtons />
      </FormsProvider>,
    );
    const cases: [string, string][] = [
      ['org', 'New organization'],
      ['contact', 'New contact'],
      ['deal', 'New deal'],
      ['activity', 'Log activity'],
      ['delete', 'Delete Acme renewal?'],
    ];
    for (const [button, title] of cases) {
      await userEvent.click(screen.getByRole('button', { name: button }));
      expect(await screen.findByRole('dialog', { name: title })).toBeInTheDocument();
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    }
  });

  it('does nothing outside the provider', async () => {
    renderApp(<FormButtons />);
    for (const name of ['org', 'contact', 'deal', 'activity', 'delete']) {
      await userEvent.click(screen.getByRole('button', { name }));
    }
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('layout', () => {
  it("hides the page and shows the message when the backend can't be reached", async () => {
    mockFetch({ 'GET /meta': () => 'network' });
    const router = createMemoryRouter([{ element: <Layout />, children: [{ path: '/', element: <p>The page</p> }] }]);
    render(
      <Providers client={createQueryClient()}>
        <RouterProvider router={router} />
      </Providers>,
    );
    expect(screen.getByText('The page')).toBeVisible();
    expect(await screen.findByRole('alert')).toHaveTextContent("Can't reach Accountable");
    expect(screen.getByText('The page')).not.toBeVisible();
  });
});

function Toaster() {
  const toast = useToast();
  return (
    <>
      <button onClick={() => toast('Deal saved')}>info</button>
      <button onClick={() => toast("Couldn't save", 'error')}>error</button>
    </>
  );
}

describe('toasts', () => {
  it('shows a message that can be dismissed', async () => {
    render(
      <ToastProvider>
        <Toaster />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'info' }));
    expect(screen.getByText('Deal saved')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Deal saved')).not.toBeInTheDocument();
  });

  it('hides messages after a while, errors later than others', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Toaster />
      </ToastProvider>,
    );
    act(() => screen.getByRole('button', { name: 'info' }).click());
    act(() => screen.getByRole('button', { name: 'error' }).click());
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.queryByText('Deal saved')).not.toBeInTheDocument();
    expect(screen.getByText("Couldn't save")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.queryByText("Couldn't save")).not.toBeInTheDocument();
  });

  it('keeps at most four messages', () => {
    render(
      <ToastProvider>
        <Toaster />
      </ToastProvider>,
    );
    for (let i = 0; i < 6; i++) act(() => screen.getByRole('button', { name: 'info' }).click());
    expect(screen.getAllByTestId('toast')).toHaveLength(4);
  });

  it('does nothing outside the provider', () => {
    render(<Toaster />);
    act(() => screen.getByRole('button', { name: 'info' }).click());
    expect(screen.queryByText('Deal saved')).not.toBeInTheDocument();
  });
});

describe('query client', () => {
  it("doesn't retry a refusal from the backend", async () => {
    const { fn } = mockFetch({ 'GET /organizations': () => ({ status: 422, body: { detail: 'No' } }) });
    const client = createQueryClient();
    await expect(
      client.fetchQuery({ queryKey: ['organizations'], queryFn: api.organizations, retryDelay: 0 }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries other failures twice', async () => {
    const queryFn = vi.fn(async () => {
      throw new Error('flaky');
    });
    const client = createQueryClient();
    await expect(client.fetchQuery({ queryKey: ['flaky'], queryFn, retryDelay: 0 })).rejects.toThrow('flaky');
    expect(queryFn).toHaveBeenCalledTimes(3);
  });

  it('reloads everything after a change except meta, delete previews and the given query', async () => {
    const client = createQueryClient();
    for (const key of [['meta'], ['delete-preview', 1], ['deals'], ['contacts']]) client.setQueryData(key, 1);
    await refreshAll(client, ['contacts']);
    const stale = (key: unknown[]) => client.getQueryState(key)?.isInvalidated;
    expect([stale(['meta']), stale(['delete-preview', 1]), stale(['deals']), stale(['contacts'])]).toEqual([
      false,
      false,
      true,
      false,
    ]);
  });
});

describe('small helpers', () => {
  afterEach(() => localStorage.clear());

  it('remembers the sidebar expanded again', () => {
    writeCollapsed(true);
    writeCollapsed(false);
    expect(readCollapsed()).toBe(false);
  });

  it('gives a stage probability of 0 before meta loads, and today', () => {
    expect(stageProbability(undefined, 'new')).toBe(0);
    expect(stageProbability(meta, 'proposal')).toBe(50);
    expect(renderHook(() => useToday()).result.current).toBe(todayLocal());
  });
});
