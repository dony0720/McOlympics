export type Screen =
  | 'login' | 'staffPin' | 'team'
  | 'managerGames' | 'managerMatches' | 'managerMatch'
  | 'admin' | 'results'
  | 'shop' | 'roulette' | 'swap' | 'standings'
  | 'status' | 'schedule';

export type AdminTab = 'scores' | 'teams' | 'games' | 'settings';
export type MatchState = 'pending' | 'live' | 'done';
export type RoulettePhase = 'idle' | 'reset' | 'spinning' | 'done';

export interface Team {
  id: string;
  name: string;
  code: string;
  color: string;
}

export interface Game {
  id: string;
  name: string;
  place: string;
}

export type ScoreTable = Record<string, Record<string, number>>;

export interface RouletteState {
  phase: RoulettePhase;
  landing: number;
  result: number | null;
}

export interface ScoreboardState {
  screen: Screen;
  codeInput: string;
  pinInput: string;
  loginError: string;
  myTeamId: string | null;
  managerGameId: string | null;
  managerMatchKey: string | null;
  adminTab: AdminTab;
  adminGameId: string | null;
  toast: string | null;
  matchStatus: Record<string, MatchState>;
  itemPoints: Record<string, number>;
  itemBonus: Record<string, number>;
  roulette: RouletteState;
  shopFrom: Screen;
  scheduleFrom: Screen;
  statusFrom: Screen;
  teams: Team[];
  games: Game[];
  scores: ScoreTable;
}
