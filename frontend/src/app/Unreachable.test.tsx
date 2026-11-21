import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useQuery } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api/endpoints';
import { useUnreachable, setUnreachable } from './connection';
import { Unreachable } from './Unreachable';
import { mockFetch, renderApp } from '../test/render';

function Screen() {
  const unreachable = useUnreachable();
  const { data } = useQuery({ queryKey: ['organizations'], queryFn: api.organizations });
  return unreachable ? <Unreachable /> : <p>{data ? `${data.length} organizations` : 'Loading'}</p>;
}

describe("can't reach Accountable (G9)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setUnreachable(false);
  });

  it('shows the message and Retry on a network error, and recovers on Retry', async () => {
    let up = false;
    mockFetch({
      'GET /organizations': () => (up ? { body: [{ id: 1 }] } : 'network'),
      'GET /meta': () => (up ? { body: { stages: [], industries: [] } } : 'network'),
    });
    renderApp(<Screen />);
    expect(await screen.findByText("Can't reach Accountable. Check that it's running.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(screen.getByText("Can't reach Accountable. Check that it's running.")).toBeInTheDocument();

    up = true;
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('1 organizations')).toBeInTheDocument();
  });

  it('treats a proxy error with no JSON as unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('Bad gateway', { status: 502 })));
    renderApp(<Screen />);
    expect(await screen.findByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
