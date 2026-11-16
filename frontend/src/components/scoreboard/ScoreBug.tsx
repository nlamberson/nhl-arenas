import { Card } from "@/components/ui/gluestack/card";
import { Text } from "@/components/ui/gluestack/text";
import { MatchupScoreboard } from "@/components/scoreboard/MatchupScoreboard";
import type { VisitResponse } from "@/lib/types";
import { getVisitScoreboardDisplay } from "@/lib/visitScores";

interface ScoreBugProps {
  visit: VisitResponse;
}

export function ScoreBug({ visit }: ScoreBugProps) {
  const { awayScore, homeScore, hasScores } = getVisitScoreboardDisplay(visit);

  return (
    <Card size="md" variant="outline" className="p-0">
      <MatchupScoreboard
        awayTeam={visit.away_team}
        homeTeam={visit.home_team}
        awayScore={awayScore}
        homeScore={homeScore}
        height={112}
      />
      {!hasScores ? (
        <Text size="xs" className="py-2 text-center text-typography-500">
          Score not available for this game yet
        </Text>
      ) : null}
    </Card>
  );
}
