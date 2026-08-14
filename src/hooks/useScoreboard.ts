import {
  useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent,
} from 'react';
import { createInitialLocalUiState } from '../data/initialState';
import { useCompetitionData } from './useCompetitionData';
import {
  MATCHUPS, ROULETTE_POOL,
  buildMatches, clampScore, getScore, initial, ranked, teamTotal,
} from '../lib/scoring';
import type {
  AdminTab, LocalUiState, MatchState, Screen, SharedState, ScoreboardView,
} from '../types';

const STATUS_LABEL: Record<MatchState, string> = { pending: '진행전', live: '진행', done: '완료' };
const STATUS_ORDER: MatchState[] = ['pending', 'live', 'done'];
const TEAM_ID_STORAGE_KEY = 'mcolympics.myTeamId';
const DEFAULT_ITEM_POINTS = 100;
const SCORE_STEP = 10;
const EMPTY_SHARED: SharedState = {
  teams: [], games: [], scores: {}, matchStatus: {}, itemPoints: {}, itemBonus: {},
};

function isIndoor(place: string): boolean {
  return (place || '').indexOf('실내') === 0;
}

function readSavedTeamId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TEAM_ID_STORAGE_KEY);
}

export function useScoreboard(): { view: ScoreboardView; loading: boolean; error: string | null } {
  const [ui, setUi] = useState<LocalUiState>(() => {
    const base = createInitialLocalUiState();
    const savedTeamId = readSavedTeamId();
    return savedTeamId ? { ...base, myTeamId: savedTeamId, screen: 'team' } : base;
  });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: shared, loading, error,
    setScore: setScoreRemote, setMatchStatus,
    addTeam: addTeamRemote, renameTeam, deleteTeam: deleteTeamRemote,
    addGame: addGameRemote, renameGame, deleteGame: deleteGameRemote,
    resetScores: resetScoresRemote, resetAll: resetAllRemote,
    applyItemBenefit, confirmSwap: confirmSwapRemote,
  } = useCompetitionData();

  const s = shared ?? EMPTY_SHARED;

  // 저장된 팀 코드로 로그인했지만, 그 사이 관리자가 팀을 삭제했다면 로그아웃 처리
  useEffect(() => {
    if (!shared || !ui.myTeamId) return;
    if (!shared.teams.some((t) => t.id === ui.myTeamId)) {
      window.localStorage.removeItem(TEAM_ID_STORAGE_KEY);
      setUi((prev) => ({ ...prev, myTeamId: null, screen: 'login' }));
    }
  }, [shared, ui.myTeamId]);

  const showToast = useCallback((msg: string) => {
    setUi((prev) => ({ ...prev, toast: msg }));
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setUi((prev) => ({ ...prev, toast: null })), 1700);
  }, []);

  // ---------- nav / auth ----------
  const toLogin = useCallback(() => {
    window.localStorage.removeItem(TEAM_ID_STORAGE_KEY);
    setUi((prev) => ({ ...prev, screen: 'login', loginError: '', pinInput: '', myTeamId: null }));
  }, []);
  const goStaff = useCallback(() => {
    setUi((prev) => ({ ...prev, screen: 'staffPin', loginError: '', pinInput: '' }));
  }, []);
  const logout = toLogin;

  const onCodeInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setUi((prev) => ({ ...prev, codeInput: e.target.value.toUpperCase(), loginError: '' }));
  }, []);
  const onPinInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setUi((prev) => ({ ...prev, pinInput: e.target.value.replace(/[^0-9]/g, ''), loginError: '' }));
  }, []);

  const submitTeamCode = useCallback(() => {
    setUi((prev) => {
      const code = (prev.codeInput || '').trim().toUpperCase();
      if (!code) return { ...prev, loginError: '팀 코드를 입력해 주세요.' };
      if (!shared) return { ...prev, loginError: '잠시 후 다시 시도해 주세요.' };
      const team = shared.teams.find((t) => t.code.toUpperCase() === code);
      if (!team) return { ...prev, loginError: '없는 코드예요. 다시 확인해 주세요.' };
      window.localStorage.setItem(TEAM_ID_STORAGE_KEY, team.id);
      return { ...prev, screen: 'team', myTeamId: team.id, loginError: '', codeInput: '' };
    });
  }, [shared]);

  const submitPin = useCallback(() => {
    setUi((prev) => {
      if (prev.pinInput === '1234') return { ...prev, screen: 'managerGames', loginError: '', pinInput: '' };
      if (prev.pinInput === '9999') return { ...prev, screen: 'admin', adminTab: 'scores', loginError: '', pinInput: '' };
      return { ...prev, loginError: 'PIN이 올바르지 않아요.' };
    });
  }, []);

  const onCodeKey = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submitTeamCode();
  }, [submitTeamCode]);
  const onPinKey = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submitPin();
  }, [submitPin]);

  const backToManagerGames = useCallback(() => setUi((prev) => ({ ...prev, screen: 'managerGames' })), []);
  const backToManagerMatches = useCallback(() => setUi((prev) => ({ ...prev, screen: 'managerMatches' })), []);
  const openSchedule = useCallback(() => setUi((prev) => ({ ...prev, screen: 'schedule', scheduleFrom: prev.screen })), []);
  const backFromSchedule = useCallback(() => setUi((prev) => ({ ...prev, screen: prev.scheduleFrom || 'login' })), []);
  const openStatus = useCallback(() => setUi((prev) => ({ ...prev, screen: 'status', statusFrom: prev.screen })), []);
  const backFromStatus = useCallback(() => setUi((prev) => ({ ...prev, screen: prev.statusFrom || 'managerGames' })), []);

  // ---------- item shop ----------
  const openShop = useCallback(() => {
    setUi((prev) => ({ ...prev, screen: 'shop', shopFrom: prev.screen, roulette: { phase: 'idle', landing: 0, result: null } }));
  }, []);
  const backToShop = useCallback(() => {
    setUi((prev) => ({ ...prev, screen: 'shop', roulette: { phase: 'idle', landing: 0, result: null } }));
  }, []);
  const backFromShop = useCallback(() => setUi((prev) => ({ ...prev, screen: prev.shopFrom || 'team' })), []);

  const getIP = useCallback((tid: string) => {
    const v = s.itemPoints[tid];
    return v === undefined ? DEFAULT_ITEM_POINTS : v;
  }, [s]);
  const getIB = useCallback((tid: string) => s.itemBonus[tid] || 0, [s]);

  const buyPlus10 = useCallback(() => {
    const tid = ui.myTeamId;
    if (!tid) return;
    if (getIP(tid) < 20) { showToast('포인트가 부족해요 (20P 필요)'); return; }
    showToast('🎉 +10점을 얻었어요!');
    applyItemBenefit(tid, 20, 10);
  }, [ui.myTeamId, getIP, showToast, applyItemBenefit]);

  const buyStandings = useCallback(() => {
    const tid = ui.myTeamId;
    if (!tid) return;
    if (getIP(tid) < 50) { showToast('포인트가 부족해요 (50P 필요)'); return; }
    applyItemBenefit(tid, 50, 0);
    setUi((prev) => ({ ...prev, screen: 'standings' }));
  }, [ui.myTeamId, getIP, showToast, applyItemBenefit]);
  const backFromStandings = useCallback(() => setUi((prev) => ({ ...prev, screen: 'shop' })), []);

  const openSwap = useCallback(() => {
    const tid = ui.myTeamId;
    if (!tid) return;
    if (getIP(tid) < 100) { showToast('포인트가 부족해요 (100P 필요)'); return; }
    setUi((prev) => ({ ...prev, screen: 'swap' }));
  }, [ui.myTeamId, getIP, showToast]);

  const confirmSwap = useCallback((otherId: string) => {
    const my = ui.myTeamId;
    if (!my || otherId === my) return;
    const other = s.teams.find((t) => t.id === otherId);
    // eslint-disable-next-line no-alert
    if (!window.confirm(`${other ? other.name : '상대 팀'}와 총점을 바꿀까요? 100P가 소모돼요.`)) return;
    confirmSwapRemote(my, otherId).then((result) => {
      if (result === 'insufficient') { showToast('포인트가 부족해요 (100P 필요)'); return; }
      showToast(`🔄 ${other ? other.name : '상대 팀'}와 점수를 바꿨어요!`);
      setUi((prev) => ({ ...prev, screen: 'shop' }));
    });
  }, [ui.myTeamId, s.teams, confirmSwapRemote, showToast]);
  const backFromSwap = useCallback(() => setUi((prev) => ({ ...prev, screen: 'shop' })), []);

  const openRoulette = useCallback(() => {
    const tid = ui.myTeamId;
    if (!tid) return;
    if (getIP(tid) < 10) { showToast('포인트가 부족해요 (10P 필요)'); return; }
    setUi((prev) => ({ ...prev, screen: 'roulette', roulette: { phase: 'idle', landing: 0, result: null } }));
  }, [ui.myTeamId, getIP, showToast]);

  const spinRoulette = useCallback(() => {
    const tid = ui.myTeamId;
    if (!tid) return;
    if (ui.roulette.phase === 'spinning') return;
    if (getIP(tid) < 10) { showToast('포인트가 부족해요 (10P 필요)'); return; }
    const landing = 42 + Math.floor(Math.random() * ROULETTE_POOL.length);
    const result = ROULETTE_POOL[landing % ROULETTE_POOL.length];
    applyItemBenefit(tid, 10, 0);
    setUi((prev) => ({ ...prev, roulette: { phase: 'reset', landing, result } }));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setUi((prev) => ({ ...prev, roulette: { ...prev.roulette, phase: 'spinning' } }));
    }));
    if (spinTimer.current) clearTimeout(spinTimer.current);
    spinTimer.current = setTimeout(() => {
      applyItemBenefit(tid, 0, result);
      setUi((prev) => ({ ...prev, roulette: { ...prev.roulette, phase: 'done' } }));
      showToast((result > 0 ? '🎉 +' : '😵 ') + result + '점!');
    }, 3300);
  }, [ui.myTeamId, ui.roulette.phase, getIP, applyItemBenefit, showToast]);

  const backToAdmin = useCallback(() => setUi((prev) => ({ ...prev, screen: 'admin' })), []);
  const toResults = useCallback(() => {
    if (s.teams.length === 0) { showToast('팀을 먼저 추가해 주세요.'); return; }
    setUi((prev) => ({ ...prev, screen: 'results' }));
  }, [s.teams.length, showToast]);

  // ---------- admin mutations ----------
  const addTeam = useCallback(() => {
    addTeamRemote().then((code) => {
      if (code) showToast('팀이 추가됐어요 · 코드 ' + code);
    });
  }, [addTeamRemote, showToast]);

  const deleteTeam = useCallback((id: string) => {
    deleteTeamRemote(id);
    setUi((prev) => (prev.myTeamId === id ? { ...prev, myTeamId: null } : prev));
  }, [deleteTeamRemote]);

  const addGame = useCallback(() => {
    addGameRemote();
    showToast('게임이 추가됐어요');
  }, [addGameRemote, showToast]);

  const deleteGame = useCallback((id: string) => {
    deleteGameRemote(id);
    setUi((prev) => (prev.adminGameId === id ? { ...prev, adminGameId: null } : prev));
  }, [deleteGameRemote]);

  const setScore = useCallback((tid: string, gid: string, val: string | number) => {
    setScoreRemote(tid, gid, clampScore(val));
  }, [setScoreRemote]);

  const resetScores = useCallback(() => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('모든 점수와 아이템 포인트를 초기화할까요?')) return;
    resetScoresRemote();
    showToast('점수를 초기화했어요');
  }, [resetScoresRemote, showToast]);

  const resetAll = useCallback(() => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('팀·게임·점수를 모두 삭제할까요? 되돌릴 수 없어요.')) return;
    resetAllRemote();
    setUi((prev) => ({ ...prev, adminGameId: null }));
    showToast('대회를 리셋했어요');
  }, [resetAllRemote, showToast]);

  const selectAdminTab = useCallback((tab: AdminTab) => setUi((prev) => ({ ...prev, adminTab: tab })), []);

  // ---------- derived view ----------
  const view = useMemo<ScoreboardView>(() => {
    const screen: Screen = ui.screen;
    const activeGameId = ui.adminGameId || (s.games[0] && s.games[0].id) || null;

    const scoreRowFor = (gid: string) => (t: (typeof s.teams)[number]) => ({
      id: t.id, name: t.name, color: t.color, initial: initial(t.name),
      score: getScore(s.scores, t.id, gid),
      dec: () => setScore(t.id, gid, getScore(s.scores, t.id, gid) - SCORE_STEP),
      inc: () => setScore(t.id, gid, getScore(s.scores, t.id, gid) + SCORE_STEP),
      onInput: (e: ChangeEvent<HTMLInputElement>) => setScore(t.id, gid, e.target.value),
    });

    const managerGameId = ui.managerGameId || (s.games[0] && s.games[0].id) || null;
    const managerGame = s.games.find((g) => g.id === managerGameId);
    const myTeam = s.teams.find((t) => t.id === ui.myTeamId);

    const teamBreakdown = s.games.map((g) => ({ name: g.name, label: getScore(s.scores, ui.myTeamId || '', g.id) + '점' }));
    if (myTeam && getIB(myTeam.id) !== 0) {
      const b = getIB(myTeam.id);
      teamBreakdown.push({ name: '🎁 아이템 보너스', label: (b > 0 ? '+' : '') + b + '점' });
    }

    const adminTabs = (['scores', 'teams', 'games', 'settings'] as AdminTab[]).map((id) => ({
      id,
      name: { scores: '점수', teams: '팀', games: '게임', settings: '설정' }[id],
      active: id === ui.adminTab,
      select: () => selectAdminTab(id),
    }));

    const adminGameChips = s.games.map((g) => ({
      id: g.id, name: g.name, active: g.id === activeGameId,
      select: () => setUi((prev) => ({ ...prev, adminGameId: g.id })),
    }));

    const rankColors: Record<number, string> = { 1: '#ffd158', 2: '#c4ccd6', 3: '#e0965a' };
    const rankedTeams = ranked(s.teams, s.scores, s.games, s.itemBonus);
    const rankedList = rankedTeams.map((r) => ({ ...r, rankColor: rankColors[r.rank] || '#6b7684' }));

    // ---- schedule ----
    const teamName = (num: number) => s.teams[num - 1]?.name || `${num}팀`;
    const teamColor = (num: number) => s.teams[num - 1]?.color || '#8b95a1';
    const myIdx = ui.myTeamId ? s.teams.findIndex((t) => t.id === ui.myTeamId) : -1;
    const scheduleIsTeam = myIdx >= 0 && myIdx < MATCHUPS.length;

    const teamScheduleRows = scheduleIsTeam
      ? s.games.map((g, i) => {
          const opp = MATCHUPS[myIdx][i];
          return {
            time: `타임 ${i + 1}`, name: g.name, place: g.place || '', isIndoor: isIndoor(g.place),
            oppName: opp ? teamName(opp) : '순위 발표 후 결정',
            oppColor: opp ? teamColor(opp) : '#8b95a1',
            oppInitial: opp ? initial(teamName(opp)) : '?',
            hasOpponent: Boolean(opp),
          };
        })
      : [];

    const masterScheduleRows = s.games.map((g, i) => {
      const pairs: { a: string; b: string }[] = [];
      if (i < 5) {
        for (let t = 0; t < MATCHUPS.length; t++) {
          const opp = MATCHUPS[t][i];
          if (opp && t + 1 < opp) pairs.push({ a: teamName(t + 1), b: teamName(opp) });
        }
      }
      return {
        time: `타임 ${i + 1}`, name: g.name, place: g.place || '', isIndoor: isIndoor(g.place),
        pairs, pending: pairs.length === 0,
      };
    });

    // ---- status board ----
    const summary: Record<MatchState, number> = { pending: 0, live: 0, done: 0 };
    const statusGames = s.games.map((g, gi) => {
      const matches: ScoreboardView['statusGames'][number]['matches'] = [];
      if (gi < MATCHUPS.length - 1) {
        buildMatches(gi, g.id).forEach(({ a, b, key }) => {
          const cur = s.matchStatus[key] || 'pending';
          summary[cur]++;
          matches.push({
            key, aName: teamName(a), bName: teamName(b),
            aColor: teamColor(a), bColor: teamColor(b),
            aInitial: initial(teamName(a)), bInitial: initial(teamName(b)),
            badge: STATUS_LABEL[cur], badgeColor: cur,
            options: STATUS_ORDER.map((o) => ({
              value: o, label: STATUS_LABEL[o], active: cur === o,
              select: () => setMatchStatus(key, o),
            })),
          });
        });
      }
      return {
        time: `타임 ${gi + 1}`, name: g.name, place: g.place || '', isIndoor: isIndoor(g.place),
        matches, pending: matches.length === 0,
      };
    });
    const statusSummary: ScoreboardView['statusSummary'] = [
      { label: '진행전', n: summary.pending, color: 'pending' },
      { label: '진행', n: summary.live, color: 'live' },
      { label: '완료', n: summary.done, color: 'done' },
    ];

    // ---- manager flow ----
    const mGameIdx = s.games.findIndex((g) => g.id === managerGameId);
    const managerMatchList = buildMatches(mGameIdx, s.games[mGameIdx]?.id || '');
    const managerMatchCards = managerMatchList.map((m) => {
      const cur = s.matchStatus[m.key] || 'pending';
      return {
        aName: teamName(m.a), bName: teamName(m.b),
        aColor: teamColor(m.a), bColor: teamColor(m.b),
        aInitial: initial(teamName(m.a)), bInitial: initial(teamName(m.b)),
        badge: STATUS_LABEL[cur], badgeColor: cur,
        pick: () => setUi((prev) => ({ ...prev, screen: 'managerMatch', managerMatchKey: m.key })),
      };
    });
    const managerMatchNoMatches = mGameIdx >= 0 && managerMatchList.length === 0;

    let mDetail: ScoreboardView['mDetail'] = null;
    if (ui.managerMatchKey) {
      const [gid, pair] = ui.managerMatchKey.split(':');
      const [aNum, bNum] = pair.split('-').map(Number);
      const gm = s.games.find((g) => g.id === gid);
      const cur = s.matchStatus[ui.managerMatchKey] || 'pending';
      const mkRow = (num: number) => {
        const t = s.teams[num - 1];
        if (!t) return null;
        return {
          id: t.id, name: t.name, color: t.color, initial: initial(t.name),
          score: getScore(s.scores, t.id, gid),
          dec: () => setScore(t.id, gid, getScore(s.scores, t.id, gid) - SCORE_STEP),
          inc: () => setScore(t.id, gid, getScore(s.scores, t.id, gid) + SCORE_STEP),
          onInput: (e: ChangeEvent<HTMLInputElement>) => setScore(t.id, gid, e.target.value),
        };
      };
      const key = ui.managerMatchKey;
      mDetail = {
        gameName: gm?.name || '', place: gm?.place || '', isIndoor: isIndoor(gm?.place || ''),
        aName: teamName(aNum), bName: teamName(bNum),
        statusLabel: STATUS_LABEL[cur], statusColor: cur,
        statusOptions: STATUS_ORDER.map((o) => ({
          value: o, label: STATUS_LABEL[o], active: cur === o,
          select: () => setMatchStatus(key, o),
        })),
        rows: [mkRow(aNum), mkRow(bNum)].filter((r): r is NonNullable<typeof r> => r !== null),
      };
    }

    // ---- item shop ----
    const myIP = myTeam ? getIP(myTeam.id) : 0;
    const shopDefs = [
      { id: 'plus', emoji: '➕', name: '점수 +10', desc: '우리 팀 점수를 즉시 10점 올려요', cost: 20, accent: '#03b26c', bg: '#e6f7ef', action: buyPlus10 },
      { id: 'roul', emoji: '🎰', name: '행운의 룰렛', desc: '±10~30점, 돌려서 운에 맡겨요', cost: 10, accent: '#8b5cf6', bg: '#f3edff', action: openRoulette },
      { id: 'peek', emoji: '👀', name: '전체 현황 보기', desc: '전 팀 순위를 한 번 열어봐요', cost: 50, accent: '#3182f6', bg: '#e8f3ff', action: buyStandings },
      { id: 'swap', emoji: '🔄', name: '점수 바꾸기', desc: '다른 팀과 총점을 통째로 교환해요', cost: 100, accent: '#f04452', bg: '#ffeaec', action: openSwap },
    ];
    const shopItems = shopDefs.map((it) => ({
      ...it,
      affordable: myIP >= it.cost,
      costLabel: it.cost + 'P',
      cardOpacity: myIP >= it.cost ? 1 : 0.5,
    }));

    const rl = ui.roulette;
    const cellW = 84;
    const reelLen = Math.max(14, rl.landing + 6);
    const rouletteCells = Array.from({ length: reelLen }, (_, i) => {
      const v = ROULETTE_POOL[i % ROULETTE_POOL.length];
      return { label: (v > 0 ? '+' : '') + v, positive: v > 0 };
    });
    const spinning = rl.phase === 'spinning';
    const targetTx = -(rl.landing * cellW + cellW / 2);
    const reelTx = rl.phase === 'spinning' || rl.phase === 'done' ? targetTx : -(cellW / 2);
    const reelStripStyle = {
      position: 'absolute' as const, left: '50%', top: 0, display: 'flex', willChange: 'transform',
      transform: `translateX(${reelTx}px)`,
      transition: spinning ? 'transform 3.1s cubic-bezier(.15,.72,.16,1)' : 'none',
    };
    const rResult = rl.phase === 'done' ? rl.result : null;

    const swapTargets = s.teams
      .filter((t) => t.id !== ui.myTeamId)
      .map((t) => ({
        id: t.id, name: t.name, color: t.color, initial: initial(t.name),
        pick: () => confirmSwap(t.id),
      }));

    return {
      screen,
      toast: ui.toast,
      loginError: ui.loginError,
      codeInput: ui.codeInput,
      pinInput: ui.pinInput,
      demoCode: s.teams[0]?.code || 'K7QX',
      onCodeInput, onPinInput, onCodeKey, onPinKey,
      submitTeamCode, submitPin, goStaff, toLogin, logout,

      myTeamName: myTeam?.name || '', myTeamColor: myTeam?.color || '#3182f6',
      myTeamInitial: myTeam ? initial(myTeam.name) : '?',
      myTeamTotal: myTeam ? teamTotal(s.scores, s.games, s.itemBonus, myTeam.id) : 0,
      myItemPoints: myIP,
      teamBreakdown,

      noGames: s.games.length === 0,
      managerGameCards: s.games.map((g) => ({
        name: g.name, sub: `${g.place || ''} · 탭하여 대진 선택`,
        pick: () => setUi((prev) => ({ ...prev, screen: 'managerMatches', managerGameId: g.id })),
      })),
      managerGameName: managerGame?.name || '',
      managerMatchCards, managerMatchNoMatches, mDetail,
      backToManagerGames, backToManagerMatches,

      adminTabs,
      adminIsScores: ui.adminTab === 'scores', adminIsTeams: ui.adminTab === 'teams',
      adminIsGames: ui.adminTab === 'games', adminIsSettings: ui.adminTab === 'settings',
      adminGameChips,
      adminScoreRows: s.teams.map(scoreRowFor(activeGameId || '')),
      adminTeamRows: s.teams.map((t) => ({
        id: t.id, name: t.name, color: t.color, code: t.code,
        onName: (e: ChangeEvent<HTMLInputElement>) => renameTeam(t.id, e.target.value),
        remove: () => deleteTeam(t.id),
      })),
      adminGameRows: s.games.map((g, i) => ({
        id: g.id, name: g.name, num: i + 1,
        onName: (e: ChangeEvent<HTMLInputElement>) => renameGame(g.id, e.target.value),
        remove: () => deleteGame(g.id),
      })),
      addTeam, addGame, resetScores, resetAll, toResults, backToAdmin,

      rankedList,
      hasWinner: rankedTeams.length > 0 && rankedTeams[0].total > 0,
      winnerName: rankedTeams[0]?.name || '',
      podium: { first: rankedTeams[0] || null, second: rankedTeams[1] || null, third: rankedTeams[2] || null },

      openShop, backFromShop, backToShop, backFromStandings, backFromSwap,
      shopItems, shopTeamName: myTeam?.name || '',
      openRoulette, spinRoulette,
      rouletteCells, reelStripStyle,
      rouletteSpinning: spinning, rouletteIdle: rl.phase === 'idle' || rl.phase === 'reset',
      rouletteDone: rl.phase === 'done',
      rResultLabel: rResult != null ? (rResult > 0 ? `+${rResult}` : `${rResult}`) + '점' : '',
      rResultPositive: (rResult ?? 0) > 0,
      canSpinAgain: myIP >= 10,
      swapTargets,

      openSchedule, backFromSchedule,
      scheduleIsTeam, scheduleIsMaster: screen === 'schedule' && !scheduleIsTeam,
      scheduleTeamName: scheduleIsTeam ? s.teams[myIdx].name : '',
      teamScheduleRows, masterScheduleRows,

      openStatus, backFromStatus,
      statusGames, statusSummary,
    };
  }, [
    ui, s, getIB, getIP, setScore, selectAdminTab, setMatchStatus, onCodeInput, onPinInput, onCodeKey, onPinKey,
    submitTeamCode, submitPin, goStaff, toLogin, logout, backToManagerGames, backToManagerMatches,
    addTeam, addGame, renameTeam, deleteTeam, renameGame, deleteGame, resetScores, resetAll, toResults, backToAdmin,
    openShop, backFromShop, backToShop, backFromStandings, backFromSwap, buyPlus10, buyStandings, openSwap,
    confirmSwap, openRoulette, spinRoulette, openSchedule, backFromSchedule, openStatus, backFromStatus,
  ]);

  return { view, loading, error };
}
