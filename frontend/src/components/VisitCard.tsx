import { Pressable, View, type PressableProps } from 'react-native';

import { Text } from '@/components/ui/text';
import { MatchupScoreboard } from '@/components/MatchupScoreboard';
import { formatVisitDateShort } from '@/lib/formatDate';
import type { VisitResponse } from '@/lib/types';
import { getVisitScoreboardDisplay } from '@/lib/visitScores';
import { cn } from '@/lib/utils';

interface VisitCardProps extends Pick<PressableProps, 'onPress' | 'accessibilityLabel'> {
  visit: VisitResponse;
  className?: string;
}

export function VisitCard({
  visit,
  onPress,
  accessibilityLabel,
  className,
}: VisitCardProps) {
  const matchup = `${visit.home_team.abbreviation} vs ${visit.away_team.abbreviation}`;
  const { awayScore, homeScore } = getVisitScoreboardDisplay(visit);

  return (
    <Pressable
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card active:opacity-95',
        className,
      )}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel ??
        `${matchup} at ${visit.arena.name}, ${formatVisitDateShort(visit.visit_date)}`
      }
    >
      <View className="flex-row items-center justify-between px-4 pb-2 pt-3">
        <Text className="text-base font-semibold">
          {formatVisitDateShort(visit.visit_date)}
        </Text>
        <View className="max-w-[58%] flex-row items-center gap-1.5">
          <Text className="text-right text-sm font-medium" numberOfLines={1}>
            {visit.arena.name}
          </Text>
          <View className="h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
            <Text className="text-xs font-bold text-white">✓</Text>
          </View>
        </View>
      </View>

      <MatchupScoreboard
        awayTeam={visit.away_team}
        homeTeam={visit.home_team}
        awayScore={awayScore}
        homeScore={homeScore}
      />

      <View className="px-4 py-3">
        <Text className="text-sm font-medium text-primary">View Details ›</Text>
      </View>
    </Pressable>
  );
}
