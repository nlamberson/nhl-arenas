import { View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { TeamLogo } from '@/components/TeamLogo';
import type { TeamColorScheme } from '@/lib/teamColors';
import type { TeamResponse } from '@/lib/types';

interface MatchupScoreboardHalfProps {
  team: TeamResponse;
  side: 'away' | 'home';
  colors: TeamColorScheme;
  logoSize: number;
  cardWidth: number;
  halfWidth: number;
  height: number;
  splitTopX: number;
  splitBottomX: number;
}

function teamLabel(team: TeamResponse): string {
  const nickname = team.name.split(' ').pop();
  return nickname && nickname.length <= 14 ? nickname : team.abbreviation;
}

export function MatchupScoreboardHalf({
  team,
  side,
  colors,
  logoSize,
  cardWidth,
  halfWidth,
  height,
  splitTopX,
  splitBottomX,
}: MatchupScoreboardHalfProps) {
  const isAway = side === 'away';

  const polygonPoints = isAway
    ? `0,0 ${splitTopX},0 ${splitBottomX},${height} 0,${height}`
    : `${splitTopX},0 ${cardWidth},0 ${cardWidth},${height} ${splitBottomX},${height}`;

  return (
    <View
      style={{ width: halfWidth, height }}
      className={`flex-row items-center px-2 ${isAway ? 'justify-start' : 'justify-end'}`}
    >
      <Svg
        width={cardWidth}
        height={height}
        style={{ position: 'absolute', left: isAway ? 0 : -halfWidth, top: 0 }}
        pointerEvents="none"
      >
        <Polygon points={polygonPoints} fill={colors.primary} />
      </Svg>

      <View
        className={`justify-center ${isAway ? 'items-start' : 'items-end'}`}
        style={{ minHeight: logoSize, maxWidth: '70%' }}
      >
        <TeamLogo
          abbreviation={team.abbreviation}
          size={logoSize}
          variant="light"
        />
        <Text
          className="mt-0.5 text-[10px] font-medium leading-tight"
          style={{ color: colors.onPrimary }}
          numberOfLines={1}
        >
          {teamLabel(team)}
        </Text>
      </View>
    </View>
  );
}
