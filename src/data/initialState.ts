import { PALETTE } from '../lib/scoring';
import type { ScoreboardState } from '../types';

export function createInitialState(): ScoreboardState {
  return {
    screen: 'login',
    codeInput: '', pinInput: '', loginError: '',
    myTeamId: null,
    managerGameId: null,
    managerMatchKey: null,
    adminTab: 'scores',
    adminGameId: null,
    toast: null,
    matchStatus: { 'g1:1-6': 'done', 'g1:2-5': 'done', 'g1:3-4': 'done', 'g2:1-5': 'live' },
    itemPoints: {},
    itemBonus: {},
    roulette: { phase: 'idle', landing: 0, result: null },
    shopFrom: 'team',
    scheduleFrom: 'login',
    statusFrom: 'managerGames',
    teams: [
      { id: 't1', name: '1팀', code: 'K7QX', color: PALETTE[0] },
      { id: 't2', name: '2팀', code: 'M2WD', color: PALETTE[1] },
      { id: 't3', name: '3팀', code: 'P9HL', color: PALETTE[2] },
      { id: 't4', name: '4팀', code: 'T4RB', color: PALETTE[3] },
      { id: 't5', name: '5팀', code: 'V6NC', color: PALETTE[4] },
      { id: 't6', name: '6팀', code: 'W8JZ', color: PALETTE[5] },
    ],
    games: [
      { id: 'g1', name: '지식 올림픽 퀴즈', place: '실내 (강당)' },
      { id: 'g2', name: '컵쌓기 계주', place: '실내 (강당)' },
      { id: 'g3', name: '신문지 서바이벌', place: '실내 (강당)' },
      { id: 'g4', name: '훌라후프 계주', place: '실내 (강당)' },
      { id: 'g5', name: '장애물 계주', place: '야외 (운동장)' },
      { id: 'g6', name: '줄다리기 (순위 매치)', place: '야외 (운동장)' },
    ],
    scores: {
      t1: { g1: 10, g2: 5, g3: 10, g4: 5, g5: 10, g6: 0 },
      t2: { g1: 10, g2: 5, g3: 5, g4: 10, g5: 5, g6: 0 },
      t3: { g1: 10, g2: 10, g3: 10, g4: 10, g5: 10, g6: 0 },
      t4: { g1: 5, g2: 10, g3: 5, g4: 5, g5: 10, g6: 0 },
      t5: { g1: 5, g2: 10, g3: 5, g4: 5, g5: 5, g6: 0 },
      t6: { g1: 5, g2: 5, g3: 10, g4: 10, g5: 5, g6: 0 },
    },
  };
}
