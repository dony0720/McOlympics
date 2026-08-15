import { describe, it, expect } from 'vitest';
import {
  initial, getScore, teamTotal, clampScore, ranked, genCode,
  GAME_SCHEDULE, GAME_PHASES, buildMatches, findTeamMatch, isGroupGame, phaseOf,
  ROULETTE_POOL, PALETTE,
} from './scoring';

describe('initial', () => {
  it('returns the first character of a trimmed name', () => {
    expect(initial('1팀')).toBe('1');
    expect(initial('  Blue Team ')).toBe('B');
  });
  it('falls back to ? for empty input', () => {
    expect(initial('')).toBe('?');
    expect(initial('   ')).toBe('?');
  });
});

describe('clampScore', () => {
  it('parses digits and strips non-numeric characters', () => {
    expect(clampScore('12abc')).toBe(12);
    expect(clampScore('  7 ')).toBe(7);
  });
  it('clamps negative values to 0', () => {
    expect(clampScore(-5)).toBe(0);
    expect(clampScore('-5')).toBe(0);
  });
  it('clamps values above 99999 to 99999', () => {
    expect(clampScore(999999)).toBe(99999);
  });
  it('treats empty/garbage input as 0', () => {
    expect(clampScore('')).toBe(0);
    expect(clampScore('abc')).toBe(0);
  });
});

describe('getScore / teamTotal', () => {
  const scores = { t1: { g1: 10, g2: 5 }, t2: { g1: 3 } };
  const games = [{ id: 'g1', name: 'A', place: '' }, { id: 'g2', name: 'B', place: '' }];

  it('getScore defaults to 0 when missing', () => {
    expect(getScore(scores, 't1', 'g1')).toBe(10);
    expect(getScore(scores, 't2', 'g2')).toBe(0);
    expect(getScore(scores, 't3', 'g1')).toBe(0);
  });

  it('teamTotal sums all games plus item bonus', () => {
    expect(teamTotal(scores, games, {}, 't1')).toBe(15);
    expect(teamTotal(scores, games, { t1: 7 }, 't1')).toBe(22);
    expect(teamTotal(scores, games, { t1: -3 }, 't1')).toBe(12);
  });
});

describe('ranked', () => {
  it('sorts by total descending and shares rank on ties (competition ranking)', () => {
    const teams = [
      { id: 't1', name: 'A', color: '#111' },
      { id: 't2', name: 'B', color: '#222' },
      { id: 't3', name: 'C', color: '#333' },
      { id: 't4', name: 'D', color: '#444' },
    ];
    const games = [{ id: 'g1', name: 'G', place: '' }];
    const scores = { t1: { g1: 10 }, t2: { g1: 10 }, t3: { g1: 5 }, t4: { g1: 0 } };
    const result = ranked(teams, scores, games, {});
    expect(result.map(r => r.id)).toEqual(['t1', 't2', 't3', 't4']);
    expect(result.map(r => r.rank)).toEqual([1, 1, 3, 4]);
    expect(result.map(r => r.total)).toEqual([10, 10, 5, 0]);
  });
});

describe('genCode', () => {
  it('generates a 4-character code from the allowed alphabet', () => {
    const code = genCode([]);
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/);
  });
  it('never returns a code already in the existing set', () => {
    for (let i = 0; i < 50; i++) {
      const existing = ['AAAA', 'BBBB', 'CCCC'];
      expect(existing).not.toContain(genCode(existing));
    }
  });
});

describe('buildMatches', () => {
  it('returns no matches for game 1, which the whole field plays together', () => {
    expect(buildMatches(0, 'g1')).toEqual([]);
    expect(isGroupGame(0)).toBe(true);
  });
  it('builds keys as "<gameId>:<lower>-<higher>"', () => {
    expect(buildMatches(1, 'g2')).toContainEqual({ a: 1, b: 5, round: 1, key: 'g2:1-5' });
  });
  it('returns no matches for a game with no schedule entry', () => {
    expect(buildMatches(GAME_SCHEDULE.length, 'g99')).toEqual([]);
    expect(buildMatches(-1, 'g0')).toEqual([]);
  });
});

describe('findTeamMatch', () => {
  it('reports the opponent and round from either side of a pair', () => {
    expect(findTeamMatch(1, 1)).toEqual({ a: 1, b: 5, round: 1, opp: 5 });
    expect(findTeamMatch(1, 5)).toEqual({ a: 1, b: 5, round: 1, opp: 1 });
  });
  it('returns null when the team has no match in that game', () => {
    expect(findTeamMatch(0, 1)).toBeNull();
  });
});

describe('GAME_SCHEDULE', () => {
  const scheduledGames = GAME_SCHEDULE.map((matches, i) => ({ i, matches })).filter((g) => g.matches.length);

  it('lets every team play every scheduled game exactly once', () => {
    for (const { matches } of scheduledGames) {
      const played = matches.flatMap((m) => [m.a, m.b]).sort();
      expect(played).toEqual([1, 2, 3, 4, 5, 6]);
    }
  });

  it('keeps each round free of team collisions so parallel booths can run', () => {
    for (const phase of GAME_PHASES) {
      for (const round of [1, 2, 3]) {
        const playing = phase.flatMap((gi) =>
          GAME_SCHEDULE[gi].filter((m) => m.round === round).flatMap((m) => [m.a, m.b]),
        );
        expect(new Set(playing).size).toBe(playing.length);
      }
    }
  });

  it('pairs 13 of the 15 possible team combinations', () => {
    const all = scheduledGames.flatMap((g) => g.matches.map((m) => `${m.a}-${m.b}`));
    expect(new Set(all).size).toBe(13);
    expect(all.length - new Set(all).size).toBe(2);
  });

  it('opens the indoor booths only after the group game', () => {
    expect(GAME_PHASES).toEqual([[0], [1, 2, 3], [4, 5]]);
    expect(phaseOf(0)).toBe(1);
    expect(phaseOf(3)).toBe(2);
    expect(phaseOf(5)).toBe(3);
    expect(phaseOf(99)).toBeNull();
  });
});

describe('constants', () => {
  it('exposes the roulette pool and palette', () => {
    expect(ROULETTE_POOL).toEqual([10, -10, 20, -20, 30, -30]);
    expect(PALETTE).toHaveLength(8);
  });
});
