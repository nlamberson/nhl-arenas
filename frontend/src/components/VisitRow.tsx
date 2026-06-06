import { router } from 'expo-router';

import { VisitCard } from '@/components/VisitCard';
import type { VisitResponse } from '@/lib/types';
import { formatVisitDateShort } from '@/lib/formatDate';

interface VisitRowProps {
  visit: VisitResponse;
}

export function VisitRow({ visit }: VisitRowProps) {
  const matchup = `${visit.home_team.abbreviation} vs ${visit.away_team.abbreviation}`;

  return (
    <VisitCard
      className="mb-3 shadow-sm"
      visit={visit}
      onPress={() => router.push(`/visits/${visit.id}`)}
      accessibilityLabel={`${matchup} at ${visit.arena.name}, ${formatVisitDateShort(visit.visit_date)}`}
    />
  );
}
