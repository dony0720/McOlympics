import { useCallback, useEffect, useRef, useState } from 'react';
import {
  doc, increment, onSnapshot, runTransaction, updateDoc,
} from 'firebase/firestore';
import { authReady, db } from '../lib/firebase';
import { createSeedSharedState } from '../data/initialState';
import { PALETTE, genCode, teamTotal } from '../lib/scoring';
import type { Game, MatchState, ScoreTable, SharedState, Team } from '../types';

const COMPETITION_REF = doc(db, 'competitions', 'main');
const DEFAULT_ITEM_POINTS = 100;

export interface UseCompetitionDataResult {
  data: SharedState | null;
  loading: boolean;
  error: string | null;
  setScore: (teamId: string, gameId: string, value: number) => void;
  setMatchStatus: (key: string, value: MatchState) => void;
  addTeam: () => Promise<string | null>;
  renameTeam: (id: string, name: string) => void;
  deleteTeam: (id: string) => void;
  addGame: () => void;
  renameGame: (id: string, name: string) => void;
  deleteGame: (id: string) => void;
  resetScores: () => void;
  resetAll: () => void;
  applyItemBenefit: (teamId: string, pointCost: number, bonusDelta?: number) => Promise<void>;
  confirmSwap: (myTeamId: string, otherTeamId: string) => Promise<'ok' | 'insufficient'>;
}

/**
 * `competitions/main` Firestore 문서를 모든 기기가 실시간으로 구독/수정하는 훅.
 * 화면 전환 같은 로컬 UI 상태는 여기서 다루지 않는다 (src/types/state.ts의 LocalUiState 참고).
 */
export function useCompetitionData(): UseCompetitionDataResult {
  const [data, setData] = useState<SharedState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dataRef = useRef<SharedState | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    authReady
      .then(() => runTransaction(db, async (tx) => {
        const snap = await tx.get(COMPETITION_REF);
        if (!snap.exists()) tx.set(COMPETITION_REF, createSeedSharedState());
      }))
      .catch((err) => {
        console.error('Firestore 초기 시드 실패', err);
      })
      .finally(() => {
        if (cancelled) return;
        unsubscribe = onSnapshot(
          COMPETITION_REF,
          (snap) => {
            const next = (snap.data() as SharedState | undefined) ?? null;
            dataRef.current = next;
            setData(next);
            setLoading(false);
          },
          (err) => {
            console.error('Firestore 구독 실패', err);
            setError('실시간 데이터를 불러오지 못했어요. 네트워크를 확인해 주세요.');
            setLoading(false);
          },
        );
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const setScore = useCallback((teamId: string, gameId: string, value: number) => {
    updateDoc(COMPETITION_REF, { [`scores.${teamId}.${gameId}`]: value }).catch((err) => {
      console.error('점수 저장 실패', err);
    });
  }, []);

  const setMatchStatus = useCallback((key: string, value: MatchState) => {
    updateDoc(COMPETITION_REF, { [`matchStatus.${key}`]: value }).catch((err) => {
      console.error('경기 상태 저장 실패', err);
    });
  }, []);

  const addTeam = useCallback(async (): Promise<string | null> => {
    try {
      return await runTransaction(db, async (tx) => {
        const snap = await tx.get(COMPETITION_REF);
        const cur = (snap.data() as SharedState | undefined) ?? createSeedSharedState();
        const idx = cur.teams.length;
        const id = 't' + Date.now();
        const code = genCode(cur.teams.map((t) => t.code));
        const newTeam: Team = { id, name: `새 팀 ${idx + 1}`, code, color: PALETTE[idx % PALETTE.length] };
        tx.update(COMPETITION_REF, {
          teams: [...cur.teams, newTeam],
          [`itemPoints.${id}`]: DEFAULT_ITEM_POINTS,
        });
        return code;
      });
    } catch (err) {
      console.error('팀 추가 실패', err);
      return null;
    }
  }, []);

  const renameTeam = useCallback((id: string, name: string) => {
    const cur = dataRef.current;
    if (!cur) return;
    const teams = cur.teams.map((t) => (t.id === id ? { ...t, name } : t));
    updateDoc(COMPETITION_REF, { teams }).catch((err) => console.error('팀 이름 변경 실패', err));
  }, []);

  const deleteTeam = useCallback((id: string) => {
    runTransaction(db, async (tx) => {
      const snap = await tx.get(COMPETITION_REF);
      if (!snap.exists()) return;
      const cur = snap.data() as SharedState;
      const teams = cur.teams.filter((t) => t.id !== id);
      const scores = { ...cur.scores }; delete scores[id];
      const itemPoints = { ...cur.itemPoints }; delete itemPoints[id];
      const itemBonus = { ...cur.itemBonus }; delete itemBonus[id];
      tx.update(COMPETITION_REF, { teams, scores, itemPoints, itemBonus });
    }).catch((err) => console.error('팀 삭제 실패', err));
  }, []);

  const addGame = useCallback(() => {
    runTransaction(db, async (tx) => {
      const snap = await tx.get(COMPETITION_REF);
      const cur = (snap.data() as SharedState | undefined) ?? createSeedSharedState();
      const idx = cur.games.length;
      const id = 'g' + Date.now();
      const newGame: Game = { id, name: `새 게임 ${idx + 1}`, place: '' };
      tx.update(COMPETITION_REF, { games: [...cur.games, newGame] });
    }).catch((err) => console.error('게임 추가 실패', err));
  }, []);

  const renameGame = useCallback((id: string, name: string) => {
    const cur = dataRef.current;
    if (!cur) return;
    const games = cur.games.map((g) => (g.id === id ? { ...g, name } : g));
    updateDoc(COMPETITION_REF, { games }).catch((err) => console.error('게임 이름 변경 실패', err));
  }, []);

  const deleteGame = useCallback((id: string) => {
    runTransaction(db, async (tx) => {
      const snap = await tx.get(COMPETITION_REF);
      if (!snap.exists()) return;
      const cur = snap.data() as SharedState;
      const games = cur.games.filter((g) => g.id !== id);
      const scores: ScoreTable = {};
      Object.keys(cur.scores).forEach((tid) => {
        const o = { ...cur.scores[tid] };
        delete o[id];
        scores[tid] = o;
      });
      tx.update(COMPETITION_REF, { games, scores });
    }).catch((err) => console.error('게임 삭제 실패', err));
  }, []);

  const resetScores = useCallback(() => {
    const cur = dataRef.current;
    const itemPoints: Record<string, number> = {};
    (cur?.teams ?? []).forEach((t) => { itemPoints[t.id] = DEFAULT_ITEM_POINTS; });
    updateDoc(COMPETITION_REF, { scores: {}, itemBonus: {}, itemPoints })
      .catch((err) => console.error('점수 초기화 실패', err));
  }, []);

  const resetAll = useCallback(() => {
    updateDoc(COMPETITION_REF, {
      teams: [], games: [], scores: {}, itemBonus: {}, itemPoints: {}, matchStatus: {},
    }).catch((err) => console.error('대회 리셋 실패', err));
  }, []);

  const applyItemBenefit = useCallback(async (teamId: string, pointCost: number, bonusDelta = 0) => {
    const updates: Record<string, unknown> = { [`itemPoints.${teamId}`]: increment(-pointCost) };
    if (bonusDelta !== 0) updates[`itemBonus.${teamId}`] = increment(bonusDelta);
    await updateDoc(COMPETITION_REF, updates);
  }, []);

  const confirmSwap = useCallback(async (myTeamId: string, otherTeamId: string): Promise<'ok' | 'insufficient'> => {
    return runTransaction(db, async (tx) => {
      const snap = await tx.get(COMPETITION_REF);
      if (!snap.exists()) return 'insufficient';
      const cur = snap.data() as SharedState;
      const myIP = cur.itemPoints[myTeamId] ?? DEFAULT_ITEM_POINTS;
      if (myIP < 100) return 'insufficient';
      const myTotalScore = teamTotal(cur.scores, cur.games, cur.itemBonus, myTeamId);
      const otherTotalScore = teamTotal(cur.scores, cur.games, cur.itemBonus, otherTeamId);
      tx.update(COMPETITION_REF, {
        [`itemPoints.${myTeamId}`]: myIP - 100,
        [`itemBonus.${myTeamId}`]: (cur.itemBonus[myTeamId] || 0) + (otherTotalScore - myTotalScore),
        [`itemBonus.${otherTeamId}`]: (cur.itemBonus[otherTeamId] || 0) + (myTotalScore - otherTotalScore),
      });
      return 'ok';
    });
  }, []);

  return {
    data, loading, error,
    setScore, setMatchStatus,
    addTeam, renameTeam, deleteTeam,
    addGame, renameGame, deleteGame,
    resetScores, resetAll,
    applyItemBenefit, confirmSwap,
  };
}
