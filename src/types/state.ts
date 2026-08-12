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

/**
 * 이 기기(브라우저 탭)에만 해당하는 상태. 다른 팀/담당자/관리자 기기와
 * 공유되면 안 된다 (예: 내가 상점 화면으로 이동해도 다른 팀 화면은 그대로여야 함).
 * React useState로만 관리되며 Firestore에 저장되지 않는다.
 */
export interface LocalUiState {
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
  roulette: RouletteState;
  shopFrom: Screen;
  scheduleFrom: Screen;
  statusFrom: Screen;
}

/**
 * 모든 기기가 실시간으로 공유하는 대회 데이터. Firestore의
 * `competitions/main` 문서 하나에 그대로 저장된다 (src/hooks/useCompetitionData.ts).
 */
export interface SharedState {
  teams: Team[];
  games: Game[];
  scores: ScoreTable;
  matchStatus: Record<string, MatchState>;
  itemPoints: Record<string, number>;
  itemBonus: Record<string, number>;
}
