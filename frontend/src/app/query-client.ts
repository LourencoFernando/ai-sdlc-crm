import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError, isUnreachable } from '../api/client';
import { setUnreachable } from './connection';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (isUnreachable(error)) setUnreachable(true);
      },
      onSuccess: () => setUnreachable(false),
    }),
    mutationCache: new MutationCache(),
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 5_000,
        retry: (count, error) => !(error instanceof ApiError) && !isUnreachable(error) && count < 2,
      },
      mutations: { retry: false },
    },
  });
}

/** After a change, everything that might show it is reloaded (the dashboard, lists, record pages). */
export function refreshAll(client: QueryClient): Promise<void> {
  return client.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'meta' });
}
