import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Tooltip } from 'radix-ui';
import { ToastProvider } from '../app/toasts';
import { createQueryClient } from '../app/query-client';

export function Providers({ children, client }: { children: ReactNode; client: QueryClient }) {
  return (
    <QueryClientProvider client={client}>
      <Tooltip.Provider>
        <ToastProvider>{children}</ToastProvider>
      </Tooltip.Provider>
    </QueryClientProvider>
  );
}

/** Renders inside the app's providers and a memory router at `path`. */
export function renderApp(ui: ReactElement, { path = '/', client = createQueryClient() } = {}) {
  const router = createMemoryRouter([{ path: '*', element: ui }], { initialEntries: [path] });
  const result = render(
    <Providers client={client}>
      <RouterProvider router={router} />
    </Providers>,
  );
  return { ...result, client, router };
}

/** A fetch stand-in answering JSON by "METHOD /path" (the /api prefix left off). */
export function mockFetch(routes: Record<string, (body: unknown) => { status?: number; body?: unknown } | 'network'>) {
  const calls: { method: string; path: string; body: unknown }[] = [];
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input).replace(/^\/api/, '');
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, path: url, body });
    const key = Object.keys(routes).find((k) => {
      const [m, p] = k.split(' ');
      return m === method && (p === url || p === url.split('?')[0]);
    });
    if (!key) throw new Error(`No mock for ${method} ${url}`);
    const answer = routes[key](body);
    if (answer === 'network') throw new TypeError('Failed to fetch');
    const status = answer.status ?? 200;
    return new Response(status === 204 ? null : JSON.stringify(answer.body ?? {}), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fn);
  return { fn, calls };
}
