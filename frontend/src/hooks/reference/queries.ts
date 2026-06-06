import { useQueries } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getArenas, getTeams } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/queryKeys';
import { logoVariantForAppScheme, prefetchTeamLogos } from '@/lib/teamLogoCache';
import type { ArenaResponse, TeamResponse } from '@/lib/types';

export interface UseReferenceDataResult {
  teams: TeamResponse[];
  arenas: ArenaResponse[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useReferenceData(): UseReferenceDataResult {
  const [teamsQuery, arenasQuery] = useQueries({
    queries: [
      {
        queryKey: queryKeys.reference.teams(),
        queryFn: getTeams,
      },
      {
        queryKey: queryKeys.reference.arenas(),
        queryFn: getArenas,
      },
    ],
  });

  const {
    data: teams = [],
    isLoading: teamsLoading,
    error: teamsError,
    refetch: refetchTeams,
  } = teamsQuery;
  const {
    data: arenas = [],
    isLoading: arenasLoading,
    error: arenasError,
    refetch: refetchArenas,
  } = arenasQuery;

  const [logosPrefetching, setLogosPrefetching] = useState(false);

  useEffect(() => {
    if (teams.length === 0) {
      setLogosPrefetching(false);
      return;
    }

    let cancelled = false;
    setLogosPrefetching(true);

    void prefetchTeamLogos(
      teams.map((team) => team.abbreviation),
      logoVariantForAppScheme(),
    ).finally(() => {
      if (!cancelled) {
        setLogosPrefetching(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [teams]);

  const loading = teamsLoading || arenasLoading || logosPrefetching;

  const error = useMemo(() => {
    const err = teamsError ?? arenasError;
    return err ? getErrorMessage(err, 'Failed to load teams and arenas') : null;
  }, [teamsError, arenasError]);

  const refetch = useCallback(async () => {
    await Promise.all([refetchTeams(), refetchArenas()]);
  }, [refetchTeams, refetchArenas]);

  return { teams, arenas, loading, error, refetch };
}
