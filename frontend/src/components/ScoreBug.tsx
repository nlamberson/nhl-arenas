import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { MatchupScoreboard } from '@/components/MatchupScoreboard';
import type { VisitResponse } from '@/lib/types';
import { getVisitScoreboardDisplay } from '@/lib/visitScores';

interface ScoreBugProps {
  visit: VisitResponse;
}

export function ScoreBug({ visit }: ScoreBugProps) {
  const { awayScore, homeScore, hasScores } = getVisitScoreboardDisplay(visit);

  return (
    <View className="overflow-hidden rounded-xl border border-border bg-card">
      <MatchupScoreboard
        awayTeam={visit.away_team}
        homeTeam={visit.home_team}
        awayScore={awayScore}
        homeScore={homeScore}
        height={112}
      />
      {!hasScores ? (
        <Text variant="muted" className="py-2 text-center text-[10px]">
          Score not available for this game yet
        </Text>
      ) : null}
    </View>
  );
}
