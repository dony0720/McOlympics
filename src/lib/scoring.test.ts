import { describe, it, expect } from 'vitest';
import {
  initial, getScore, teamTotal, clampScore, ranked, genCode,
  MATCHUPS, buildMatches, ROULETTE_POOL, PALETTE,
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
  it('matches the reference matchStatus seed keys for time 1 (gi=0)', () => {
    // reference initial state has matchStatus keys 'g1:1-6','g1:2-5','g1:3-4' for time 1
    expect(buildMatches(0, 'g1')).toEqual([
      { a: 1, b: 6, key: 'g1:1-6' },
      { a: 2, b: 5, key: 'g1:2-5' },
      { a: 3, b: 4, key: 'g1:3-4' },
    ]);
  });
  it('matches the reference matchStatus seed key for time 2 (gi=1)', () => {
    // reference initial state has matchStatus key 'g2:1-5' for time 2
    expect(buildMatches(1, 'g2')).toContainEqual({ a: 1, b: 5, key: 'g2:1-5' });
  });
  it('returns no matches for the last (rank-match) time slot', () => {
    expect(buildMatches(MATCHUPS.length - 1, 'g6')).toEqual([]);
  });
});

describe('constants', () => {
  it('exposes the 6x6 matchup table and 6-value roulette pool', () => {
    expect(MATCHUPS).toHaveLength(6);
    expect(MATCHUPS.every(row => row.length === 6)).toBe(true);
    expect(ROULETTE_POOL).toEqual([10, -10, 20, -20, 30, -30]);
    expect(PALETTE).toHaveLength(8);
  });
});
