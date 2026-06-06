import { useInfiniteQuery, useQueries, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { getLatestVisit, getVisit, getVisits, getVisitStats } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/queryKeys';
import type { VisitResponse, VisitStatsResponse } from '@/lib/types';

export const VISITS_PAGE_SIZE = 20;

export interface UsePaginatedVisitsResult {
  visits: VisitResponse[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function usePaginatedVisits(
  pageSize = VISITS_PAGE_SIZE,
): UsePaginatedVisitsResult {
  const query = useInfiniteQuery({
    queryKey: queryKeys.visits.list(pageSize),
    queryFn: ({ pageParam }) => getVisits({ skip: pageParam, limit: pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const total = lastPage.total > 0 ? lastPage.total : lastPage.visits.length;
      const loaded = allPages.reduce((sum, page) => sum + page.visits.length, 0);
      if (loaded >= total) {
        return undefined;
      }
      return loaded;
    },
  });

  const visits = useMemo(
    () => query.data?.pages.flatMap((page) => page.visits) ?? [],
    [query.data],
  );

  const total = query.data?.pages[0]?.total ?? 0;
  const resolvedTotal = total > 0 ? total : visits.length;

  const {
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    isLoading,
    isRefetching,
    error,
  } = query;

  const loadMore = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    visits,
    total: resolvedTotal,
    loading: isLoading,
    loadingMore: isFetchingNextPage,
    refreshing: isRefetching && !isLoading && !isFetchingNextPage,
    error: error ? getErrorMessage(error, 'Failed to load visits') : null,
    hasMore: Boolean(hasNextPage),
    loadMore,
    refresh,
  };
}

export interface UseVisitResult {
  visit: VisitResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useVisit(id: string | undefined): UseVisitResult {
  const { data, isLoading, error, refetch: refetchQuery } = useQuery({
    queryKey: queryKeys.visits.detail(id ?? ''),
    queryFn: () => {
      if (!id) {
        throw new Error('Visit not found');
      }
      return getVisit(id);
    },
    enabled: Boolean(id),
  });

  const refetch = useCallback(async () => {
    await refetchQuery();
  }, [refetchQuery]);

  return {
    visit: data ?? null,
    loading: isLoading,
    error: !id
      ? 'Visit not found'
      : error
        ? getErrorMessage(error, 'Failed to load visit')
        : null,
    refetch,
  };
}

export interface UseHomeVisitsResult {
  stats: VisitStatsResponse | null;
  latestVisit: VisitResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useHomeVisits(): UseHomeVisitsResult {
  const [statsQuery, latestQuery] = useQueries({
    queries: [
      {
        queryKey: queryKeys.visits.stats(),
        queryFn: getVisitStats,
      },
      {
        queryKey: queryKeys.visits.latest(),
        queryFn: getLatestVisit,
      },
    ],
  });

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = statsQuery;
  const {
    data: latestVisit,
    isLoading: latestLoading,
    error: latestError,
    refetch: refetchLatest,
  } = latestQuery;

  const loading = statsLoading || latestLoading;

  const error = useMemo(() => {
    const err = statsError ?? latestError;
    return err ? getErrorMessage(err, 'Failed to load home data') : null;
  }, [statsError, latestError]);

  const refetch = useCallback(async () => {
    await Promise.all([refetchStats(), refetchLatest()]);
  }, [refetchStats, refetchLatest]);

  return {
    stats: stats ?? null,
    latestVisit: latestVisit ?? null,
    loading,
    error,
    refetch,
  };
}
