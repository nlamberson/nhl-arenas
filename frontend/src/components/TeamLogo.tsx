import { memo, useEffect, useState } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { APP_COLOR_SCHEME } from '@/constants/theme';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import {
  getCachedTeamLogoSvg,
  loadTeamLogoSvg,
} from '@/lib/teamLogoCache';
import type { TeamLogoVariant } from '@/lib/teamLogo';

interface TeamLogoProps {
  abbreviation: string;
  size?: number;
  /** Override CDN variant; defaults from app color scheme. */
  variant?: TeamLogoVariant;
  className?: string;
}

function logoVariantForScheme(scheme: string | null | undefined): TeamLogoVariant {
  return scheme === 'light' ? 'dark' : 'light';
}

function AbbreviationFallback({
  abbreviation,
  size,
  className,
}: {
  abbreviation: string;
  size: number;
  className?: string;
}) {
  return (
    <View
      style={{ width: size, height: size }}
      className={cn('items-center justify-center rounded-full bg-muted', className)}
      accessibilityLabel={`${abbreviation} logo`}
    >
      <Text className="font-bold" style={{ fontSize: size * 0.28 }}>
        {abbreviation}
      </Text>
    </View>
  );
}

export const TeamLogo = memo(function TeamLogo({
  abbreviation,
  size = 48,
  variant,
  className,
}: TeamLogoProps) {
  const resolvedVariant = variant ?? logoVariantForScheme(APP_COLOR_SCHEME);
  const [svgXml, setSvgXml] = useState<string | null>(() =>
    getCachedTeamLogoSvg(abbreviation, resolvedVariant),
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cached = getCachedTeamLogoSvg(abbreviation, resolvedVariant);
    if (cached) {
      setSvgXml(cached);
      setFailed(false);
      return;
    }

    setSvgXml(null);
    setFailed(false);

    loadTeamLogoSvg(abbreviation, resolvedVariant).then((xml) => {
      if (cancelled) {
        return;
      }
      if (xml) {
        setSvgXml(xml);
      } else {
        setFailed(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [abbreviation, resolvedVariant]);

  if (failed || !svgXml) {
    return (
      <AbbreviationFallback
        abbreviation={abbreviation}
        size={size}
        className={className}
      />
    );
  }

  return (
    <View
      style={{ width: size, height: size }}
      className={cn('items-center justify-center', className)}
      accessibilityLabel={`${abbreviation} logo`}
    >
      <SvgXml xml={svgXml} width={size} height={size} />
    </View>
  );
});
