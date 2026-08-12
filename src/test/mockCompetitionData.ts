import { useCallback, useState } from 'react';
import { createSeedSharedState } from '../data/initialState';
import { PALETTE, genCode, teamTotal } from '../lib/scoring';
import type { Game, MatchState, ScoreTable, SharedState, Team } from '../types';
import type { UseCompetitionDataResult } from '../hooks/useCompetitionData';

const DEFAULT_ITEM_POINTS = 100;

/**
 * 실제 Firestore 없이 컴포넌트 테스트를 동기적으로 실행하기 위한 useCompetitionData 대체 구현.
 * 쓰기 동작의 결과(상태 변화)는 실제 훅과 동일하게 유지하되, 네트워크/비동기 지연은 없앤다.
 */
export function useCompetitionData(): UseCompetitionDataResult {
  const [data, setData] = useState<SharedState>(createSeedSharedState);

  const setScore = useCallback((teamId: string, gameId: string, value: number) => {
    setData((d) => ({ ...d, scores: { ...d.scores, [teamId]: { ...(d.scores[teamId] || {}), [gameId]: value } } }));
  }, []);

  const setMatchStatus = useCallback((key: string, value: MatchState) => {
    setData((d) => ({ ...d, matchStatus: { ...d.matchStatus, [key]: value } }));
  }, []);

  const addTeam = useCallback(async (): Promise<string | null> => {
    let code: string | null = null;
    setData((d) => {
      const idx = d.teams.length;
      const id = 't' + Date.now();
      code = genCode(d.teams.map((t) => t.code));
      const newTeam: Team = { id, name: `새 팀 ${idx + 1}`, code, color: PALETTE[idx % PALETTE.length] };
      return { ...d, teams: [...d.teams, newTeam], itemPoints: { ...d.itemPoints, [id]: DEFAULT_ITEM_POINTS } };
    });
    return code;
  }, []);

  const renameTeam = useCallback((id: string, name: string) => {
    setData((d) => ({ ...d, teams: d.teams.map((t) => (t.id === id ? { ...t, name } : t)) }));
  }, []);

  const deleteTeam = useCallback((id: string) => {
    setData((d) => {
      const scores = { ...d.scores }; delete scores[id];
      const itemPoints = { ...d.itemPoints }; delete itemPoints[id];
      const itemBonus = { ...d.itemBonus }; delete itemBonus[id];
      return { ...d, teams: d.teams.filter((t) => t.id !== id), scores, itemPoints, itemBonus };
    });
  }, []);

  const addGame = useCallback(() => {
    setData((d) => {
      const idx = d.games.length;
      const id = 'g' + Date.now();
      const newGame: Game = { id, name: `새 게임 ${idx + 1}`, place: '' };
      return { ...d, games: [...d.games, newGame] };
    });
  }, []);

  const renameGame = useCallback((id: string, name: string) => {
    setData((d) => ({ ...d, games: d.games.map((g) => (g.id === id ? { ...g, name } : g)) }));
  }, []);

  const deleteGame = useCallback((id: string) => {
    setData((d) => {
      const games = d.games.filter((g) => g.id !== id);
      const scores: ScoreTable = {};
      Object.keys(d.scores).forEach((tid) => {
        const o = { ...d.scores[tid] };
        delete o[id];
        scores[tid] = o;
      });
      return { ...d, games, scores };
    });
  }, []);

  const resetScores = useCallback(() => {
    setData((d) => {
      const itemPoints: Record<string, number> = {};
      d.teams.forEach((t) => { itemPoints[t.id] = DEFAULT_ITEM_POINTS; });
      return { ...d, scores: {}, itemBonus: {}, itemPoints };
    });
  }, []);

  const resetAll = useCallback(() => {
    setData({ teams: [], games: [], scores: {}, matchStatus: {}, itemPoints: {}, itemBonus: {} });
  }, []);

  const applyItemBenefit = useCallback(async (teamId: string, pointCost: number, bonusDelta = 0) => {
    setData((d) => ({
      ...d,
      itemPoints: { ...d.itemPoints, [teamId]: (d.itemPoints[teamId] ?? DEFAULT_ITEM_POINTS) - pointCost },
      itemBonus: bonusDelta === 0 ? d.itemBonus : { ...d.itemBonus, [teamId]: (d.itemBonus[teamId] || 0) + bonusDelta },
    }));
  }, []);

  const confirmSwap = useCallback(async (myTeamId: string, otherTeamId: string): Promise<'ok' | 'insufficient'> => {
    let outcome: 'ok' | 'insufficient' = 'ok';
    setData((d) => {
      const myIP = d.itemPoints[myTeamId] ?? DEFAULT_ITEM_POINTS;
      if (myIP < 100) { outcome = 'insufficient'; return d; }
      const myTotal = teamTotal(d.scores, d.games, d.itemBonus, myTeamId);
      const otherTotal = teamTotal(d.scores, d.games, d.itemBonus, otherTeamId);
      return {
        ...d,
        itemPoints: { ...d.itemPoints, [myTeamId]: myIP - 100 },
        itemBonus: {
          ...d.itemBonus,
          [myTeamId]: (d.itemBonus[myTeamId] || 0) + (otherTotal - myTotal),
          [otherTeamId]: (d.itemBonus[otherTeamId] || 0) + (myTotal - otherTotal),
        },
      };
    });
    return outcome;
  }, []);

  return {
    data, loading: false, error: null,
    setScore, setMatchStatus,
    addTeam, renameTeam, deleteTeam,
    addGame, renameGame, deleteGame,
    resetScores, resetAll,
    applyItemBenefit, confirmSwap,
  };
}
