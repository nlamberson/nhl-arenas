/** NHL assets CDN — unofficial; keyed by team abbreviation. */
const NHL_LOGO_CDN = 'https://assets.nhle.com/logos/nhl/svg';

/**
 * Logo variant on NHL CDN:
 * - `light` = light-colored logo (for dark backgrounds)
 * - `dark` = dark-colored logo (for light backgrounds)
 */
export type TeamLogoVariant = 'light' | 'dark';

export function teamLogoUrl(
  abbreviation: string,
  variant: TeamLogoVariant = 'light',
): string {
  const abbr = abbreviation.trim().toUpperCase();
  return `${NHL_LOGO_CDN}/${abbr}_${variant}.svg`;
}
