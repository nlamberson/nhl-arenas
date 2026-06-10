import { APP_COLOR_SCHEME } from '@/constants/theme';

import { teamLogoUrl, type TeamLogoVariant } from '@/lib/teamLogo';

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();

function cacheKey(abbreviation: string, variant: TeamLogoVariant): string {
  return `${abbreviation.trim().toUpperCase()}_${variant}`;
}

export function logoVariantForAppScheme(): TeamLogoVariant {
  // App is always dark mode — use light-variant logos on dark backgrounds.
  return APP_COLOR_SCHEME === 'dark' ? 'light' : 'dark';
}

export function getCachedTeamLogoSvg(
  abbreviation: string,
  variant: TeamLogoVariant,
): string | null {
  return cache.get(cacheKey(abbreviation, variant)) ?? null;
}

export async function loadTeamLogoSvg(
  abbreviation: string,
  variant: TeamLogoVariant,
): Promise<string | null> {
  const key = cacheKey(abbreviation, variant);
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const pending = inflight.get(key);
  if (pending) {
    return pending;
  }

  const promise = (async () => {
    try {
      const response = await fetch(teamLogoUrl(abbreviation, variant));
      if (!response.ok) {
        return null;
      }
      const svg = await response.text();
      cache.set(key, svg);
      return svg;
    } catch {
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

/** Warm the in-memory cache for a set of team abbreviations (e.g. all NHL teams). */
export async function prefetchTeamLogos(
  abbreviations: string[],
  variant: TeamLogoVariant = logoVariantForAppScheme(),
): Promise<void> {
  const unique = [
    ...new Set(abbreviations.map((abbr) => abbr.trim().toUpperCase()).filter(Boolean)),
  ];
  await Promise.all(unique.map((abbr) => loadTeamLogoSvg(abbr, variant)));
}
