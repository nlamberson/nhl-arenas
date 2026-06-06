import type { VisitGameResponse, VisitResponse } from '@/lib/types';

const PLACEHOLDER_SCORE = '–';

export function getVisitScoreboardDisplay(visit: VisitResponse): {
  awayScore: string;
  homeScore: string;
  hasScores: boolean;
} {
  const game: VisitGameResponse | null | undefined = visit.game;

  if (
    game?.matched &&
    game.away_score !== null &&
    game.away_score !== undefined &&
    game.home_score !== null &&
    game.home_score !== undefined
  ) {
    return {
      awayScore: String(game.away_score),
      homeScore: String(game.home_score),
      hasScores: true,
    };
  }

  return {
    awayScore: PLACEHOLDER_SCORE,
    homeScore: PLACEHOLDER_SCORE,
    hasScores: false,
  };
}
