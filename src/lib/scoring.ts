export interface MinimalTeam {
  id: string;
  name: string;
  color: string;
}

export interface MinimalGame {
  id: string;
  name: string;
  place?: string;
}

export type ScoreTable = Record<string, Record<string, number>>;

export const PALETTE = [
  '#4b7bec', '#f04452', '#03b26c', '#fe9800',
  '#a234c7', '#18a5a5', '#faa131', '#e42939',
];

export interface ScheduledMatch {
  a: number;
  b: number;
  round: number;
}

/**
 * 게임별 대진표. 인덱스는 games 배열 순서와 같고, 빈 배열은 "전 팀이 다 같이 진행"을 뜻한다.
 *
 * 실내(게임 2~4)는 부스 3개, 야외(게임 5~6)는 부스 2개를 동시에 열고 라운드마다 팀이 이동한다.
 * 부스를 동시에 돌리면 6팀 15개 조합을 모두 성사시킬 수 없다. 실내 3라운드가 9개 조합을 쓰고 나면
 * 남는 6개가 항상 삼각형 두 개(1-4-6, 2-3-5 꼴)가 되어 야외 두 게임으로 소화되지 않기 때문이다.
 * 그래서 13개가 최대이며, 이 배치에서 1-6과 4-5는 만나지 않고 1-5와 4-6은 두 번 만난다.
 */
export const GAME_SCHEDULE: ScheduledMatch[][] = [
  [],
  [{ a: 1, b: 5, round: 1 }, { a: 2, b: 3, round: 2 }, { a: 4, b: 6, round: 3 }],
  [{ a: 2, b: 6, round: 1 }, { a: 1, b: 4, round: 2 }, { a: 3, b: 5, round: 3 }],
  [{ a: 3, b: 4, round: 1 }, { a: 5, b: 6, round: 2 }, { a: 1, b: 2, round: 3 }],
  [{ a: 1, b: 3, round: 1 }, { a: 2, b: 5, round: 2 }, { a: 4, b: 6, round: 3 }],
  [{ a: 2, b: 4, round: 1 }, { a: 3, b: 6, round: 2 }, { a: 1, b: 5, round: 3 }],
];

/** 동시에 여는 게임 묶음. 앞 묶음을 모두 끝낸 뒤 다음 묶음을 연다. */
export const GAME_PHASES: number[][] = [[0], [1, 2, 3], [4, 5]];

export const SCHEDULED_TEAM_COUNT = 6;

export function phaseOf(gameIndex: number): number | null {
  const i = GAME_PHASES.findIndex((phase) => phase.includes(gameIndex));
  return i < 0 ? null : i + 1;
}

export const ROULETTE_POOL = [10, -10, 20, -20, 30, -30];

export function initial(name: string): string {
  return (name || '?').trim().charAt(0) || '?';
}

export function getScore(scores: ScoreTable, tid: string, gid: string): number {
  const t = scores[tid];
  return (t && t[gid]) || 0;
}

export function teamTotal(
  scores: ScoreTable,
  games: MinimalGame[],
  itemBonus: Record<string, number>,
  tid: string,
): number {
  const base = games.reduce((sum, g) => sum + getScore(scores, tid, g.id), 0);
  return base + (itemBonus[tid] || 0);
}

export function clampScore(raw: string | number): number {
  let v = Math.round(Number(String(raw).replace(/[^0-9-]/g, '')) || 0);
  if (v < 0) v = 0;
  if (v > 99999) v = 99999;
  return v;
}

export interface RankedTeam {
  id: string;
  name: string;
  color: string;
  initial: string;
  total: number;
  rank: number;
}

export function ranked(
  teams: MinimalTeam[],
  scores: ScoreTable,
  games: MinimalGame[],
  itemBonus: Record<string, number>,
): RankedTeam[] {
  const arr = teams.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    initial: initial(t.name),
    total: teamTotal(scores, games, itemBonus, t.id),
  }));
  arr.sort((a, b) => b.total - a.total);
  let rank = 0;
  let prev: number | null = null;
  return arr.map((t, i) => {
    if (t.total !== prev) {
      rank = i + 1;
      prev = t.total;
    }
    return { ...t, rank };
  });
}

export function genCode(existingCodes: string[]): string {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const existing = new Set(existingCodes);
  let code: string;
  do {
    code = Array.from({ length: 4 }, () => abc[Math.floor(Math.random() * abc.length)]).join('');
  } while (existing.has(code));
  return code;
}

export function buildMatches(
  gameIndex: number,
  gameId: string,
): (ScheduledMatch & { key: string })[] {
  const schedule = GAME_SCHEDULE[gameIndex];
  if (gameIndex < 0 || !schedule) return [];
  return schedule.map((m) => ({ ...m, key: `${gameId}:${m.a}-${m.b}` }));
}

/** 대진이 없는 게임(전 팀 동시 진행)의 진행 상태를 담는 키. */
export function groupMatchKey(gameId: string): string {
  return `${gameId}:all`;
}

export function isGroupGame(gameIndex: number): boolean {
  return gameIndex >= 0 && (GAME_SCHEDULE[gameIndex]?.length ?? 0) === 0;
}

export function findTeamMatch(
  gameIndex: number,
  teamNum: number,
): (ScheduledMatch & { opp: number }) | null {
  const match = (GAME_SCHEDULE[gameIndex] || []).find((m) => m.a === teamNum || m.b === teamNum);
  return match ? { ...match, opp: match.a === teamNum ? match.b : match.a } : null;
}
