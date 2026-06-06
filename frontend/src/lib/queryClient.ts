import { QueryClient } from '@tanstack/react-query';

/** How long list/detail/home visit data stays fresh before a background refetch. */
export const STALE_TIME_MS = 2 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME_MS,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function clearVisitQueryCache(): void {
  queryClient.clear();
}
