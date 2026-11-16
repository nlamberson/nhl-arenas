import type { VisitResponse } from "@/lib/types";

function formatVisitMatchup(visit: VisitResponse): string {
  return `${visit.home_team.abbreviation} vs ${visit.away_team.abbreviation}`;
}

export { formatVisitMatchup };
