import { formatNhlSeasonLabel, nhlSeasonStartYearFromIsoDate } from '@/lib/date';
import type { VisitResponse } from '@/lib/types';

/** Newest first: visit_date desc, then created_at desc. */
export function compareVisitsDesc(a: VisitResponse, b: VisitResponse): number {
  const byDate = b.visit_date.localeCompare(a.visit_date);
  if (byDate !== 0) {
    return byDate;
  }
  return b.created_at.localeCompare(a.created_at);
}

export function getLatestVisit(visits: VisitResponse[]): VisitResponse | null {
  if (visits.length === 0) {
    return null;
  }
  return [...visits].sort(compareVisitsDesc)[0];
}

export interface VisitSeasonSection {
  key: string;
  seasonStartYear: number;
  title: string;
  data: VisitResponse[];
}

/** Group visits into NHL season sections (newest first), preserving visit order within each season. */
export function groupVisitsBySeason(visits: VisitResponse[]): VisitSeasonSection[] {
  const sorted = [...visits].sort(compareVisitsDesc);
  const sections: VisitSeasonSection[] = [];

  for (const visit of sorted) {
    const seasonStartYear = nhlSeasonStartYearFromIsoDate(visit.visit_date);
    const last = sections[sections.length - 1];

    if (last?.seasonStartYear === seasonStartYear) {
      last.data.push(visit);
    } else {
      sections.push({
        key: String(seasonStartYear),
        seasonStartYear,
        title: formatNhlSeasonLabel(seasonStartYear),
        data: [visit],
      });
    }
  }

  return sections;
}
