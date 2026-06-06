import { router } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { VisitCard } from '@/components/VisitCard';
import type { VisitResponse } from '@/lib/types';

interface LatestVisitCardProps {
  visit: VisitResponse | null;
  loading?: boolean;
}

export function LatestVisitCard({ visit, loading = false }: LatestVisitCardProps) {
  if (loading) {
    return null;
  }

  if (!visit) {
    return (
      <View className="mt-6 gap-3">
        <Text variant="large">Latest visit</Text>
        <View className="rounded-xl border border-dashed border-border bg-card px-4 py-8">
          <Text variant="muted" className="text-center">
            No visits yet. Log your first arena visit to see it here.
          </Text>
        </View>
      </View>
    );
  }

  const matchup = `${visit.home_team.abbreviation} vs ${visit.away_team.abbreviation}`;

  return (
    <View className="mt-6 gap-3">
      <Text variant="large">Latest visit</Text>

      <VisitCard
        visit={visit}
        onPress={() => router.push(`/visits/${visit.id}`)}
        accessibilityLabel={`Latest visit at ${visit.arena.name}, ${matchup}`}
      />

      <Button variant="link" className="self-center" onPress={() => router.push('/visits')}>
        <Text>View all history</Text>
      </Button>
    </View>
  );
}
