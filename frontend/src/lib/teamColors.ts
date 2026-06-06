/** Primary brand colors for NHL teams (for scoreboard backgrounds). */
export interface TeamColorScheme {
  primary: string;
  /** Text/logo on primary background */
  onPrimary: string;
}

const DEFAULT_SCHEME: TeamColorScheme = {
  primary: '#1e293b',
  onPrimary: '#ffffff',
};

/** Keyed by team abbreviation. */
export const NHL_TEAM_COLORS: Record<string, TeamColorScheme> = {
  ANA: { primary: '#F47A38', onPrimary: '#ffffff' },
  BOS: { primary: '#FFB81C', onPrimary: '#111111' },
  BUF: { primary: '#003087', onPrimary: '#ffffff' },
  CAR: { primary: '#CC0000', onPrimary: '#ffffff' },
  CBJ: { primary: '#002654', onPrimary: '#ffffff' },
  CGY: { primary: '#C8102E', onPrimary: '#ffffff' },
  CHI: { primary: '#CF0A2C', onPrimary: '#ffffff' },
  COL: { primary: '#6F263D', onPrimary: '#ffffff' },
  DAL: { primary: '#006847', onPrimary: '#ffffff' },
  DET: { primary: '#CE1126', onPrimary: '#ffffff' },
  EDM: { primary: '#FF4C00', onPrimary: '#ffffff' },
  FLA: { primary: '#C8102E', onPrimary: '#ffffff' },
  LAK: { primary: '#111111', onPrimary: '#ffffff' },
  MIN: { primary: '#154734', onPrimary: '#ffffff' },
  MTL: { primary: '#AF1E2D', onPrimary: '#ffffff' },
  NJD: { primary: '#CE1126', onPrimary: '#ffffff' },
  NSH: { primary: '#FFB81C', onPrimary: '#111111' },
  NYI: { primary: '#00539B', onPrimary: '#ffffff' },
  NYR: { primary: '#0038A8', onPrimary: '#ffffff' },
  OTT: { primary: '#C52032', onPrimary: '#ffffff' },
  PHI: { primary: '#F74902', onPrimary: '#ffffff' },
  PIT: { primary: '#111111', onPrimary: '#ffffff' },
  SEA: { primary: '#001628', onPrimary: '#99D9EA' },
  SJS: { primary: '#006D75', onPrimary: '#ffffff' },
  STL: { primary: '#002F87', onPrimary: '#ffffff' },
  TBL: { primary: '#002868', onPrimary: '#ffffff' },
  TOR: { primary: '#00205B', onPrimary: '#ffffff' },
  UTA: { primary: '#6CACE4', onPrimary: '#111111' },
  VAN: { primary: '#00205B', onPrimary: '#ffffff' },
  VGK: { primary: '#B4975A', onPrimary: '#111111' },
  WPG: { primary: '#041E42', onPrimary: '#ffffff' },
  WSH: { primary: '#C8102E', onPrimary: '#ffffff' },
  // Legacy / inactive — fallback if still in DB
  ARI: { primary: '#8C2633', onPrimary: '#ffffff' },
};

export function getTeamColors(abbreviation: string): TeamColorScheme {
  return NHL_TEAM_COLORS[abbreviation.trim().toUpperCase()] ?? DEFAULT_SCHEME;
}
