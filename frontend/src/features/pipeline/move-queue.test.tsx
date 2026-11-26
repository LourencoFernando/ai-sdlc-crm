import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, keys } from '../../api/endpoints';
import type { Deal } from '../../api/types';
import { createQueryClient } from '../../app/query-client';
import { Providers } from '../../test/render';
import { useMoveQueue, type Move } from './move-queue';

function deal(id: number, stage: Deal['stage'], position: number): Deal {
  return {
    id,
    name: `Deal ${id}`,
    organizationId: 1,
    organization: { id: 1, name: 'Acme' },
    contactId: null,
    contact: null,
    stage,
    value: 1000,
    probability: 10,
    closeDate: '2026-12-01',
    position,
    createdAt: '',
    updatedAt: '',
  };
}

interface Pending {
  path: string;
  body: unknown;
  resolve: (status: number, body: unknown) => void;
}

/** A fetch whose answers the test hands out one by one. */
function controlledFetch() {
  const requests: Pending[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(
      (input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((resolve) => {
          requests.push({
            path: String(input),
            body: init?.body ? JSON.parse(String(init.body)) : undefined,
            resolve: (status, body) =>
              resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })),
          });
        }),
    ),
  );
  return requests;
}

function setup(initial: Deal[]) {
  const client = createQueryClient();
  client.setQueryData(keys.deals, initial);
  const wrapper = ({ children }: { children: ReactNode }) => <Providers client={client}>{children}</Providers>;
  // Like the board, something watches the deals, so a reload actually fetches.
  const { result } = renderHook(
    () => {
      useQuery({ queryKey: keys.deals, queryFn: api.deals, staleTime: Infinity });
      return useMoveQueue();
    },
    { wrapper },
  );
  return { client, enqueue: result.current };
}

const move = (id: number, stage: Deal['stage'], index: number): Move => ({
  id,
  name: `Deal ${id}`,
  stage,
  index,
  today: '2026-11-20',
});
const cached = (client: ReturnType<typeof createQueryClient>) => client.getQueryData<Deal[]>(keys.deals)!;

afterEach(() => vi.unstubAllGlobals());

describe('move queue (P5, P13)', () => {
  it('sends moves one at a time, in order', async () => {
    const requests = controlledFetch();
    const { client, enqueue } = setup([deal(1, 'new', 0), deal(2, 'new', 1)]);
    act(() => {
      enqueue(move(1, 'qualified', 0), [deal(1, 'qualified', 0), deal(2, 'new', 0)]);
      enqueue(move(2, 'qualified', 1), [deal(1, 'qualified', 0), deal(2, 'qualified', 1)]);
    });
    await waitFor(() => expect(requests).toHaveLength(1));
    expect(requests[0].path).toBe('/api/deals/1/move');
    // The board shows both moves before any answer.
    expect(cached(client).map((d) => d.stage)).toEqual(['qualified', 'qualified']);

    requests[0].resolve(200, { deal: deal(1, 'qualified', 0), columns: { new: [2], qualified: [1] } });
    await waitFor(() => expect(requests).toHaveLength(2));
    expect(requests[1].path).toBe('/api/deals/2/move');
    // The first answer doesn't undo the second move, which is still on its way.
    expect(cached(client).find((d) => d.id === 2)!.stage).toBe('qualified');
  });

  it("takes the server's order when the last move succeeds", async () => {
    const requests = controlledFetch();
    const { client, enqueue } = setup([deal(1, 'new', 0), deal(2, 'new', 1), deal(3, 'new', 2)]);
    act(() => enqueue(move(3, 'new', 0), [deal(3, 'new', 0), deal(1, 'new', 1), deal(2, 'new', 2)]));
    await waitFor(() => expect(requests).toHaveLength(1));
    requests[0].resolve(200, { deal: deal(3, 'new', 0), columns: { new: [3, 2, 1] } });
    await waitFor(() => expect(cached(client).find((d) => d.id === 1)!.position).toBe(2));
    expect(cached(client).find((d) => d.id === 2)!.position).toBe(1);
  });

  it('reloads the board and shows the message when a move fails', async () => {
    const requests = controlledFetch();
    const { client, enqueue } = setup([deal(1, 'new', 0)]);
    act(() => enqueue(move(1, 'won', 0), [deal(1, 'won', 0)]));
    await waitFor(() => expect(requests).toHaveLength(1));
    requests[0].resolve(422, { detail: 'Choose a stage', fields: { stage: 'Choose a stage' } });
    // The reload asks for the board again.
    await waitFor(() => expect(requests.map((r) => r.path)).toContain('/api/deals'));
    expect(document.body.textContent).toContain("Couldn't move Deal 1. The board has been refreshed.");
    requests.find((r) => r.path === '/api/deals')!.resolve(200, [deal(1, 'new', 0)]);
    await waitFor(() => expect(cached(client)[0].stage).toBe('new'));
  });

  it("doesn't let a late board reload undo a move", async () => {
    const requests = controlledFetch();
    const { client, enqueue } = setup([deal(1, 'new', 0)]);
    // A reload starts, then a move is made before it answers.
    void client.refetchQueries({ queryKey: keys.deals }).catch(() => {});
    await waitFor(() => expect(requests).toHaveLength(1));
    act(() => enqueue(move(1, 'won', 0), [deal(1, 'won', 0)]));
    requests[0].resolve(200, [deal(1, 'new', 0)]);
    await waitFor(() => expect(requests).toHaveLength(2));
    expect(cached(client)[0].stage).toBe('won');
  });
});
