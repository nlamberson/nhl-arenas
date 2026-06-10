/** NHL assets CDN — used as fallback when EXPO_PUBLIC_API_URL is unset (native dev). */
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
  const apiBase = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (apiBase) {
    // Proxied through our API to avoid browser CORS blocks on assets.nhle.com.
    return `${apiBase}/api/v1/reference/team-logos/${abbr}?variant=${variant}`;
  }
  return `${NHL_LOGO_CDN}/${abbr}_${variant}.svg`;
}
