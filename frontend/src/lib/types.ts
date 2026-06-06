/** Mirrors backend `LoginResponse` (app/schemas/auth.py). */
export interface LoginResponse {
  id_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/** Mirrors backend `GET /api/v1/auth/me` response. */
export interface MeResponse {
  uid: string;
  email: string | null;
  email_verified: boolean;
  display_name: string | null;
  photo_url: string | null;
  created_at: string;
}

/** Mirrors backend reference schemas (app/schemas/reference.py). */
export interface TeamResponse {
  id: string;
  name: string;
  abbreviation: string;
  city: string | null;
  /** Home arena id if the team is assigned to an arena. */
  arena_id: string | null;
}

export interface ArenaResponse {
  id: string;
  name: string;
  city: string | null;
  capacity: number | null;
}

/** Mirrors backend visit schemas (app/schemas/visit.py). */
export interface VisitCreate {
  home_team_id: string;
  away_team_id: string;
  arena_id: string;
  visit_date: string;
  seating_location?: string | null;
}

export interface VisitUpdate {
  seating_location?: string | null;
}

/** Mirrors backend `VisitGameResponse` (app/schemas/game.py). */
export interface VisitGameResponse {
  matched: boolean;
  nhl_game_id?: number | null;
  away_score?: number | null;
  home_score?: number | null;
  game_state?: string | null;
}

export interface VisitResponse {
  id: string;
  home_team: TeamResponse;
  away_team: TeamResponse;
  arena: ArenaResponse;
  visit_date: string;
  seating_location: string | null;
  created_at: string;
  updated_at: string;
  game?: VisitGameResponse | null;
}

export interface VisitStatsResponse {
  total_visits: number;
  teams_seen: number;
  arenas_visited: number;
}

export interface VisitsPage {
  visits: VisitResponse[];
  total: number;
}

export interface GetVisitsParams {
  skip?: number;
  limit?: number;
}
