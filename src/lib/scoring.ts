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

// 미니 올림픽 대진표 (팀 번호 1~6 기준, 타임 1~5 상대팀 번호 / 타임6은 순위 매치)
export const MATCHUPS: (number | null)[][] = [
  [6, 5, 4, 3, 2, null],
  [5, 3, 6, 4, 1, null],
  [4, 2, 5, 1, 6, null],
  [3, 6, 1, 2, 5, null],
  [2, 1, 3, 6, 4, null],
  [1, 4, 2, 5, 3, null],
];

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
): { a: number; b: number; key: string }[] {
  const out: { a: number; b: number; key: string }[] = [];
  if (gameIndex >= 0 && gameIndex < MATCHUPS.length - 1) {
    for (let t = 0; t < MATCHUPS.length; t++) {
      const opp = MATCHUPS[t][gameIndex];
      if (opp && t + 1 < opp) out.push({ a: t + 1, b: opp, key: `${gameId}:${t + 1}-${opp}` });
    }
  }
  return out;
}
