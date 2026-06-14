import { useMemo, useState } from 'react';
import { View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { MatchupScoreboardHalf } from '@/components/MatchupScoreboardHalf';
import { getTeamColors } from '@/lib/teamColors';
import type { TeamResponse } from '@/lib/types';

/** Share of scoreboard height used for the team logo. */
const LOGO_HEIGHT_RATIO = 0.54;

/** Horizontal offset from center at top/bottom; symmetric so the split passes through center. */
const SPLIT_SKEW_RATIO = 0.02;
/** Space between each score and the center divider (room for double-digit scores). */
const SCORE_CENTER_GAP = 28;
const DIVIDER_STROKE_WIDTH = 4;

interface MatchupScoreboardProps {
  awayTeam: TeamResponse;
  homeTeam: TeamResponse;
  awayScore?: string;
  homeScore?: string;
  height?: number;
  /** Override auto-sized logo; defaults to ~54% of height. */
  logoSize?: number;
}

function getSplitCoordinates(cardWidth: number, height: number) {
  const halfWidth = cardWidth / 2;
  const skew = cardWidth * SPLIT_SKEW_RATIO;
  const splitTopX = halfWidth + skew;
  const splitBottomX = halfWidth - skew;

  return {
    halfWidth,
    splitTopX,
    splitBottomX,
  };
}

export function MatchupScoreboard({
  awayTeam,
  homeTeam,
  awayScore = '–',
  homeScore = '–',
  height = 100,
  logoSize,
}: MatchupScoreboardProps) {
  const [cardWidth, setCardWidth] = useState(0);
  const awayColors = getTeamColors(awayTeam.abbreviation);
  const homeColors = getTeamColors(homeTeam.abbreviation);

  const resolvedLogoSize = useMemo(
    () => logoSize ?? Math.round(height * LOGO_HEIGHT_RATIO),
    [height, logoSize],
  );

  const split =
    cardWidth > 0 ? getSplitCoordinates(cardWidth, height) : null;

  return (
    <View
      className="overflow-hidden"
      style={cardWidth > 0 ? { height, width: cardWidth } : { height }}
      onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}
    >
      {split ? (
        <View className="flex-row" style={{ width: cardWidth, height }}>
          <MatchupScoreboardHalf
            team={awayTeam}
            side="away"
            colors={awayColors}
            logoSize={resolvedLogoSize}
            cardWidth={cardWidth}
            halfWidth={split.halfWidth}
            height={height}
            splitTopX={split.splitTopX}
            splitBottomX={split.splitBottomX}
          />
          <MatchupScoreboardHalf
            team={homeTeam}
            side="home"
            colors={homeColors}
            logoSize={resolvedLogoSize}
            cardWidth={cardWidth}
            halfWidth={split.halfWidth}
            height={height}
            splitTopX={split.splitTopX}
            splitBottomX={split.splitBottomX}
          />
        </View>
      ) : null}

      {split ? (
        <Svg
          width={cardWidth}
          height={height}
          style={{ position: 'absolute', left: 0, top: 0 }}
          pointerEvents="none"
        >
          <Line
            x1={split.splitTopX}
            y1={0}
            x2={split.splitBottomX}
            y2={height}
            stroke="#FFFFFF"
            strokeWidth={DIVIDER_STROKE_WIDTH}
            strokeOpacity={0.5}
          />
        </Svg>
      ) : null}

      {split ? (
        <>
          <View
            pointerEvents="none"
            className="absolute justify-center"
            style={{
              left: 0,
              width: split.halfWidth - SCORE_CENTER_GAP,
              top: 0,
              bottom: 0,
              alignItems: 'flex-end',
            }}
          >
            <Text
              className="text-4xl font-bold leading-none"
              style={{ color: awayColors.onPrimary }}
            >
              {awayScore}
            </Text>
          </View>

          <View
            pointerEvents="none"
            className="absolute justify-center"
            style={{
              left: split.halfWidth + SCORE_CENTER_GAP,
              right: 0,
              top: 0,
              bottom: 0,
              alignItems: 'flex-start',
            }}
          >
            <Text
              className="text-4xl font-bold leading-none"
              style={{ color: homeColors.onPrimary }}
            >
              {homeScore}
            </Text>
          </View>
        </>
      ) : null}
    </View>
  );
}
