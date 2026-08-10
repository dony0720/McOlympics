import type { ChangeEvent, KeyboardEvent, CSSProperties } from 'react';
import type { AdminTab, MatchState, Screen } from './state';

export interface TeamBreakdownRow { name: string; label: string; }

export interface ScoreRow {
  id: string;
  name: string;
  color: string;
  initial: string;
  score: number;
  dec: () => void;
  inc: () => void;
  onInput: (e: ChangeEvent<HTMLInputElement>) => void;
}

export interface ManagerGameCard { name: string; sub: string; pick: () => void; }

export interface ManagerMatchCard {
  aName: string; bName: string;
  aColor: string; bColor: string;
  aInitial: string; bInitial: string;
  badge: string; badgeColor: MatchState;
  pick: () => void;
}

export interface StatusOption {
  value: MatchState;
  label: string;
  active: boolean;
  select: () => void;
}

export interface MatchDetail {
  gameName: string;
  place: string;
  isIndoor: boolean;
  aName: string;
  bName: string;
  statusLabel: string;
  statusColor: MatchState;
  statusOptions: StatusOption[];
  rows: ScoreRow[];
}

export interface AdminTabDef { id: AdminTab; name: string; active: boolean; select: () => void; }
export interface GameChip { id: string; name: string; active: boolean; select: () => void; }
export interface AdminTeamRow {
  id: string; name: string; color: string; code: string;
  onName: (e: ChangeEvent<HTMLInputElement>) => void;
  remove: () => void;
}
export interface AdminGameRow {
  id: string; name: string; num: number;
  onName: (e: ChangeEvent<HTMLInputElement>) => void;
  remove: () => void;
}

export interface RankedRow {
  id: string; name: string; color: string; initial: string; total: number; rank: number;
  rankColor: string;
}

export interface PodiumEntry { color: string; initial: string; name: string; total: number; }

export interface ShopItem {
  id: string; emoji: string; name: string; desc: string;
  accent: string; bg: string; action: () => void;
  affordable: boolean; costLabel: string; cardOpacity: number;
}

export interface RouletteCell { label: string; positive: boolean; }

export interface SwapTarget {
  id: string; name: string; color: string; initial: string; total: number; pick: () => void;
}

export interface ScheduleTeamRow {
  time: string; name: string; place: string; isIndoor: boolean;
  oppName: string; oppColor: string; oppInitial: string; hasOpponent: boolean;
}

export interface SchedulePair { a: string; b: string; }
export interface MasterScheduleRow {
  time: string; name: string; place: string; isIndoor: boolean;
  pairs: SchedulePair[]; pending: boolean;
}

export interface StatusMatch {
  key: string; aName: string; bName: string; aColor: string; bColor: string;
  aInitial: string; bInitial: string;
  badge: string; badgeColor: MatchState;
  options: StatusOption[];
}
export interface StatusGame {
  time: string; name: string; place: string; isIndoor: boolean;
  matches: StatusMatch[]; pending: boolean;
}
export interface StatusSummaryItem { label: string; n: number; color: MatchState; }

export interface ScoreboardView {
  screen: Screen;
  toast: string | null;
  loginError: string;
  codeInput: string;
  pinInput: string;
  demoCode: string;
  onCodeInput: (e: ChangeEvent<HTMLInputElement>) => void;
  onPinInput: (e: ChangeEvent<HTMLInputElement>) => void;
  onCodeKey: (e: KeyboardEvent<HTMLInputElement>) => void;
  onPinKey: (e: KeyboardEvent<HTMLInputElement>) => void;
  submitTeamCode: () => void;
  submitPin: () => void;
  goStaff: () => void;
  toLogin: () => void;
  logout: () => void;

  myTeamName: string; myTeamColor: string; myTeamInitial: string; myTeamTotal: number;
  myItemPoints: number;
  teamBreakdown: TeamBreakdownRow[];

  noGames: boolean;
  managerGameCards: ManagerGameCard[];
  managerGameName: string;
  managerMatchCards: ManagerMatchCard[];
  managerMatchNoMatches: boolean;
  mDetail: MatchDetail | null;
  backToManagerGames: () => void;
  backToManagerMatches: () => void;

  adminTabs: AdminTabDef[];
  adminIsScores: boolean; adminIsTeams: boolean; adminIsGames: boolean; adminIsSettings: boolean;
  adminGameChips: GameChip[];
  adminScoreRows: ScoreRow[];
  adminTeamRows: AdminTeamRow[];
  adminGameRows: AdminGameRow[];
  addTeam: () => void; addGame: () => void;
  resetScores: () => void; resetAll: () => void;
  toResults: () => void; backToAdmin: () => void;

  rankedList: RankedRow[];
  hasWinner: boolean; winnerName: string;
  podium: { first: PodiumEntry | null; second: PodiumEntry | null; third: PodiumEntry | null };

  openShop: () => void; backFromShop: () => void; backToShop: () => void;
  backFromStandings: () => void; backFromSwap: () => void;
  shopItems: ShopItem[]; shopTeamName: string;
  openRoulette: () => void; spinRoulette: () => void;
  rouletteCells: RouletteCell[]; reelStripStyle: CSSProperties;
  rouletteSpinning: boolean; rouletteIdle: boolean; rouletteDone: boolean;
  rResultLabel: string; rResultPositive: boolean;
  canSpinAgain: boolean;
  swapTargets: SwapTarget[];

  openSchedule: () => void; backFromSchedule: () => void;
  scheduleIsTeam: boolean; scheduleIsMaster: boolean; scheduleTeamName: string;
  teamScheduleRows: ScheduleTeamRow[]; masterScheduleRows: MasterScheduleRow[];

  openStatus: () => void; backFromStatus: () => void;
  statusGames: StatusGame[]; statusSummary: StatusSummaryItem[];
}

export interface PageProps { view: ScoreboardView; }
