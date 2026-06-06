import type { VisitResponse } from '@/lib/types';

export interface VisitStats {
  teamsSeen: number;
  arenasVisited: number;
  totalVisits: number;
}

/** Derive profile stats from loaded visits (teams/arenas) and API total count. */
export function computeVisitStats(
  visits: VisitResponse[],
  totalFromApi: number,
): VisitStats {
  const teamIds = new Set<string>();
  const arenaIds = new Set<string>();

  for (const visit of visits) {
    teamIds.add(visit.home_team.id);
    teamIds.add(visit.away_team.id);
    arenaIds.add(visit.arena.id);
  }

  return {
    teamsSeen: teamIds.size,
    arenasVisited: arenaIds.size,
    totalVisits: totalFromApi > 0 ? totalFromApi : visits.length,
  };
}
