import { router } from "expo-router";

import { Box } from "@/components/ui/gluestack/box";
import {
  Button,
  ButtonText,
} from "@/components/ui/gluestack/button";
import { Text } from "@/components/ui/gluestack/text";
import { PageLoadingIndicator } from "@/components/feedback/PageLoadingIndicator";
import { prefetchVisit } from "@/lib/prefetchVisit";
import { VisitCard } from "@/components/visits/VisitCard";
import type { VisitResponse } from "@/lib/types";
import { formatVisitMatchup } from "@/lib/visitLabels";

interface LatestVisitCardProps {
  visit: VisitResponse | null;
  loading?: boolean;
}

export function LatestVisitCard({
  visit,
  loading = false,
}: LatestVisitCardProps) {
  if (loading) {
    return (
      <Box className="mt-6 gap-3">
        <Text size="lg" className="font-semibold">Latest visit</Text>
        <PageLoadingIndicator
          message="Loading latest visit…"
          className="items-center justify-center rounded-xl border border-border bg-card py-10"
        />
      </Box>
    );
  }

  if (!visit) {
    return (
      <Box className="mt-6 gap-3">
        <Text size="lg" className="font-semibold">Latest visit</Text>
        <Box className="rounded-xl border border-dashed border-border bg-card px-4 py-8">
          <Text size="sm" className="text-center text-typography-500">
            No visits yet. Log your first arena visit to see it here.
          </Text>
        </Box>
      </Box>
    );
  }

  const matchup = formatVisitMatchup(visit);

  return (
    <Box className="mt-6 gap-3">
      <Text size="lg" className="font-semibold">
        Latest visit
      </Text>

      <VisitCard
        visit={visit}
        onPress={() => {
          prefetchVisit(visit.id);
          router.push(`/visits/${visit.id}`);
        }}
        accessibilityLabel={`Latest visit at ${visit.arena.name}, ${matchup}`}
      />

      <Button
        variant="link"
        action="primary"
        size="md"
        className="self-center"
        onPress={() => router.push("/visits")}
      >
        <ButtonText>View all history</ButtonText>
      </Button>
    </Box>
  );
}
