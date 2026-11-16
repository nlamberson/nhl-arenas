import { router } from "expo-router";

import { VisitCard } from "@/components/visits/VisitCard";
import { prefetchVisit } from "@/lib/prefetchVisit";
import type { VisitResponse } from "@/lib/types";
import { formatVisitDateShort } from "@/lib/formatDate";
import { formatVisitMatchup } from "@/lib/visitLabels";

interface VisitRowProps {
  visit: VisitResponse;
}

export function VisitRow({ visit }: VisitRowProps) {
  const matchup = formatVisitMatchup(visit);

  return (
    <VisitCard
      className="mb-3 shadow-sm"
      visit={visit}
      onPress={() => {
        prefetchVisit(visit.id);
        router.push(`/visits/${visit.id}`);
      }}
      accessibilityLabel={`${matchup} at ${visit.arena.name}, ${formatVisitDateShort(visit.visit_date)}`}
    />
  );
}
