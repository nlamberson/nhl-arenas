import type { PressableProps } from "react-native";
import { ChevronRight } from "lucide-react-native";

import {
  Button,
  ButtonIcon,
  ButtonText,
} from "@/components/ui/gluestack/button";
import { Card } from "@/components/ui/gluestack/card";
import { Box } from "@/components/ui/gluestack/box";
import { Text } from "@/components/ui/gluestack/text";
import { MatchupScoreboard } from "@/components/scoreboard/MatchupScoreboard";
import { formatVisitDateShort } from "@/lib/formatDate";
import { cn } from "@/lib/utils";
import type { VisitResponse } from "@/lib/types";
import { formatVisitMatchup } from "@/lib/visitLabels";
import { getVisitScoreboardDisplay } from "@/lib/visitScores";

interface VisitCardProps extends Pick<
  PressableProps,
  "onPress" | "accessibilityLabel"
> {
  visit: VisitResponse;
  className?: string;
}

export function VisitCard({
  visit,
  onPress,
  accessibilityLabel,
  className,
}: VisitCardProps) {
  const matchup = formatVisitMatchup(visit);
  const { awayScore, homeScore } = getVisitScoreboardDisplay(visit);

  return (
    <Card
      size="md"
      variant="outline"
      className={cn("p-0", className)}
    >
      <Box className="flex-row items-center justify-between px-4 pb-2 pt-3">
        <Text className="text-base font-semibold">
          {formatVisitDateShort(visit.visit_date)}
        </Text>
        <Text
          className="max-w-[58%] text-right text-sm font-medium"
          numberOfLines={1}
        >
          {visit.arena.name}
        </Text>
      </Box>

      <MatchupScoreboard
        awayTeam={visit.away_team}
        homeTeam={visit.home_team}
        awayScore={awayScore}
        homeScore={homeScore}
      />

      <Button
        variant="link"
        size="sm"
        className="self-start"
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={
          accessibilityLabel ??
          `${matchup} at ${visit.arena.name}, ${formatVisitDateShort(visit.visit_date)}`
        }
        style={{ paddingHorizontal: 8, paddingVertical: 4 }}
      >
        <ButtonText>View Details</ButtonText>
        <ButtonIcon as={ChevronRight} size="sm" />
      </Button>
    </Card>
  );
}
