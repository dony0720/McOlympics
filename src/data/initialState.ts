import { PALETTE } from '../lib/scoring';
import type { LocalUiState, SharedState } from '../types';

/**
 * Firestore `competitions/main` 문서가 아직 없을 때 한 번만 채워 넣는 시드 데이터.
 * (원본 dc.html 데모 데이터와 동일)
 */
export function createSeedSharedState(): SharedState {
  return {
    teams: [
      { id: 't1', name: '1팀', code: 'K7QX', color: PALETTE[0] },
      { id: 't2', name: '2팀', code: 'M2WD', color: PALETTE[1] },
      { id: 't3', name: '3팀', code: 'P9HL', color: PALETTE[2] },
      { id: 't4', name: '4팀', code: 'T4RB', color: PALETTE[3] },
      { id: 't5', name: '5팀', code: 'V6NC', color: PALETTE[4] },
      { id: 't6', name: '6팀', code: 'W8JZ', color: PALETTE[5] },
    ],
    games: [
      { id: 'g1', name: '몸으로 말해요', place: '실내 (강당)' },
      { id: 'g2', name: '가위바위보', place: '실내 (강당)' },
      { id: 'g3', name: '잡아라 고깔 쥐돌이', place: '실내 (강당)' },
      { id: 'g4', name: '훅! 가는 종이컵', place: '실내 (강당)' },
      { id: 'g5', name: '물폭탄 대작전', place: '야외 (운동장)' },
      { id: 'g6', name: '할리갈리', place: '실내 (강당)' },
    ],
    scores: {
      t1: { g1: 10, g2: 5, g3: 10, g4: 5, g5: 10, g6: 0 },
      t2: { g1: 10, g2: 5, g3: 5, g4: 10, g5: 5, g6: 0 },
      t3: { g1: 10, g2: 10, g3: 10, g4: 10, g5: 10, g6: 0 },
      t4: { g1: 5, g2: 10, g3: 5, g4: 5, g5: 10, g6: 0 },
      t5: { g1: 5, g2: 10, g3: 5, g4: 5, g5: 5, g6: 0 },
      t6: { g1: 5, g2: 5, g3: 10, g4: 10, g5: 5, g6: 0 },
    },
    matchStatus: { 'g1:1-6': 'done', 'g1:2-5': 'done', 'g1:3-4': 'done', 'g2:1-5': 'live' },
    // 화면에는 "필드 없으면 100P"로 보여주지만(useScoreboard의 getIP), Firestore increment()는
    // 없는 필드를 0에서부터 깎기 때문에 반드시 모든 팀에 명시적으로 100을 심어둬야 한다.
    itemPoints: { t1: 100, t2: 100, t3: 100, t4: 100, t5: 100, t6: 100 },
    itemBonus: {},
  };
}

/** 이 기기의 로컬 UI 상태 기본값. 새로고침해도 유지될 필요가 없다. */
export function createInitialLocalUiState(): LocalUiState {
  return {
    screen: 'login',
    codeInput: '', pinInput: '', loginError: '',
    myTeamId: null,
    managerGameId: null,
    managerMatchKey: null,
    adminTab: 'scores',
    adminGameId: null,
    toast: null,
    roulette: { phase: 'idle', landing: 0, result: null },
    shopFrom: 'team',
    scheduleFrom: 'login',
    statusFrom: 'managerGames',
  };
}
