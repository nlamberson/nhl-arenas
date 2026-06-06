import { useMemo, useState } from 'react';
import { View } from 'react-native';
import Svg, { Line, Polygon } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { TeamLogo } from '@/components/TeamLogo';
import { getTeamColors } from '@/lib/teamColors';
import type { TeamResponse } from '@/lib/types';

/** Share of scoreboard height used for the team logo. */
const LOGO_HEIGHT_RATIO = 0.54;

/** Diagonal color split: x-position as a fraction of width at top vs bottom. */
const SPLIT_TOP_RATIO = 0.5;
const SPLIT_BOTTOM_RATIO = 0.46;
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

function teamLabel(team: TeamResponse): string {
  const nickname = team.name.split(' ').pop();
  return nickname && nickname.length <= 14 ? nickname : team.abbreviation;
}

export function MatchupScoreboard({
  awayTeam,
  homeTeam,
  awayScore = '–',
  homeScore = '–',
  height = 100,
  logoSize,
}: MatchupScoreboardProps) {
  const [width, setWidth] = useState(0);
  const awayColors = getTeamColors(awayTeam.abbreviation);
  const homeColors = getTeamColors(homeTeam.abbreviation);
  const splitTopX = width * SPLIT_TOP_RATIO;
  const splitBottomX = width * SPLIT_BOTTOM_RATIO;

  const resolvedLogoSize = useMemo(
    () => logoSize ?? Math.round(height * LOGO_HEIGHT_RATIO),
    [height, logoSize],
  );

  return (
    <View
      className="overflow-hidden"
      style={{ height }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 ? (
        <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }}>
          <Polygon
            points={`0,0 ${splitTopX},0 ${splitBottomX},${height} 0,${height}`}
            fill={awayColors.primary}
          />
          <Polygon
            points={`${splitTopX},0 ${width},0 ${width},${height} ${splitBottomX},${height}`}
            fill={homeColors.primary}
          />
          <Line
            x1={splitTopX}
            y1={0}
            x2={splitBottomX}
            y2={height}
            stroke="#FFFFFF"
            strokeWidth={DIVIDER_STROKE_WIDTH}
            strokeOpacity={0.5}
          />
        </Svg>
      ) : null}

      <View className="absolute inset-0 flex-row px-2">
        <View className="flex-1 flex-row items-center justify-between pr-1">
          <View
            className="justify-center"
            style={{ minHeight: resolvedLogoSize, maxWidth: '48%' }}
          >
            <TeamLogo
              abbreviation={awayTeam.abbreviation}
              size={resolvedLogoSize}
              variant="light"
            />
            <Text
              className="mt-0.5 text-[10px] font-medium leading-tight"
              style={{ color: awayColors.onPrimary }}
              numberOfLines={1}
            >
              {teamLabel(awayTeam)}
            </Text>
          </View>
          <View className="min-w-14 items-end justify-center pr-4">
            <Text
              className="text-4xl font-bold leading-none"
              style={{ color: awayColors.onPrimary }}
            >
              {awayScore}
            </Text>
          </View>
        </View>

        <View className="flex-1 flex-row items-center justify-between pl-1">
          <View className="min-w-14 items-start justify-center pl-4">
            <Text
              className="text-4xl font-bold leading-none"
              style={{ color: homeColors.onPrimary }}
            >
              {homeScore}
            </Text>
          </View>
          <View
            className="items-end justify-center"
            style={{ minHeight: resolvedLogoSize, maxWidth: '48%' }}
          >
            <TeamLogo
              abbreviation={homeTeam.abbreviation}
              size={resolvedLogoSize}
              variant="light"
            />
            <Text
              className="mt-0.5 text-[10px] font-medium leading-tight"
              style={{ color: homeColors.onPrimary }}
              numberOfLines={1}
            >
              {teamLabel(homeTeam)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
