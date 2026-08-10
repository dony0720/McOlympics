import { useCallback, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { createInitialState } from '../data/initialState';
import {
  MATCHUPS, ROULETTE_POOL, PALETTE,
  buildMatches, clampScore, genCode, getScore, initial, ranked, teamTotal,
} from '../lib/scoring';
import type {
  AdminTab, MatchState, Screen, ScoreboardState, ScoreboardView,
} from '../types';

const STATUS_LABEL: Record<MatchState, string> = { pending: '진행전', live: '진행', done: '완료' };
const STATUS_ORDER: MatchState[] = ['pending', 'live', 'done'];

function isIndoor(place: string): boolean {
  return (place || '').indexOf('실내') === 0;
}

export function useScoreboard(): { view: ScoreboardView } {
  const [state, setState] = useState<ScoreboardState>(createInitialState);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setState((s) => ({ ...s, toast: msg }));
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setState((s) => ({ ...s, toast: null })), 1700);
  }, []);

  // ---------- nav / auth ----------
  const toLogin = useCallback(() => {
    setState((s) => ({ ...s, screen: 'login', loginError: '', pinInput: '', myTeamId: null }));
  }, []);
  const goStaff = useCallback(() => {
    setState((s) => ({ ...s, screen: 'staffPin', loginError: '', pinInput: '' }));
  }, []);
  const logout = toLogin;

  const onCodeInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setState((s) => ({ ...s, codeInput: e.target.value.toUpperCase(), loginError: '' }));
  }, []);
  const onPinInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setState((s) => ({ ...s, pinInput: e.target.value.replace(/[^0-9]/g, ''), loginError: '' }));
  }, []);

  const submitTeamCode = useCallback(() => {
    setState((s) => {
      const code = (s.codeInput || '').trim().toUpperCase();
      if (!code) return { ...s, loginError: '팀 코드를 입력해 주세요.' };
      const team = s.teams.find((t) => t.code.toUpperCase() === code);
      if (!team) return { ...s, loginError: '없는 코드예요. 다시 확인해 주세요.' };
      return { ...s, screen: 'team', myTeamId: team.id, loginError: '', codeInput: '' };
    });
  }, []);

  const submitPin = useCallback(() => {
    setState((s) => {
      if (s.pinInput === '1234') return { ...s, screen: 'managerGames', loginError: '', pinInput: '' };
      if (s.pinInput === '9999') return { ...s, screen: 'admin', adminTab: 'scores', loginError: '', pinInput: '' };
      return { ...s, loginError: 'PIN이 올바르지 않아요.' };
    });
  }, []);

  const onCodeKey = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submitTeamCode();
  }, [submitTeamCode]);
  const onPinKey = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submitPin();
  }, [submitPin]);

  const backToManagerGames = useCallback(() => setState((s) => ({ ...s, screen: 'managerGames' })), []);
  const backToManagerMatches = useCallback(() => setState((s) => ({ ...s, screen: 'managerMatches' })), []);
  const openSchedule = useCallback(() => setState((s) => ({ ...s, screen: 'schedule', scheduleFrom: s.screen })), []);
  const backFromSchedule = useCallback(() => setState((s) => ({ ...s, screen: s.scheduleFrom || 'login' })), []);
  const openStatus = useCallback(() => setState((s) => ({ ...s, screen: 'status', statusFrom: s.screen })), []);
  const backFromStatus = useCallback(() => setState((s) => ({ ...s, screen: s.statusFrom || 'managerGames' })), []);

  const setMatchStatus = useCallback((key: string, val: MatchState) => {
    setState((s) => ({ ...s, matchStatus: { ...s.matchStatus, [key]: val } }));
  }, []);

  // ---------- item shop ----------
  const openShop = useCallback(() => {
    setState((s) => ({ ...s, screen: 'shop', shopFrom: s.screen, roulette: { phase: 'idle', landing: 0, result: null } }));
  }, []);
  const backToShop = useCallback(() => {
    setState((s) => ({ ...s, screen: 'shop', roulette: { phase: 'idle', landing: 0, result: null } }));
  }, []);
  const backFromShop = useCallback(() => setState((s) => ({ ...s, screen: s.shopFrom || 'team' })), []);

  const getIP = useCallback((s: ScoreboardState, tid: string) => {
    const v = s.itemPoints[tid];
    return v === undefined ? 100 : v;
  }, []);
  const getIB = useCallback((s: ScoreboardState, tid: string) => s.itemBonus[tid] || 0, []);

  const buyPlus10 = useCallback(() => {
    setState((s) => {
      const tid = s.myTeamId;
      if (!tid) return s;
      if (getIP(s, tid) < 20) { showToast('포인트가 부족해요 (20P 필요)'); return s; }
      showToast('🎉 +10점을 얻었어요!');
      return {
        ...s,
        itemPoints: { ...s.itemPoints, [tid]: getIP(s, tid) - 20 },
        itemBonus: { ...s.itemBonus, [tid]: getIB(s, tid) + 10 },
      };
    });
  }, [getIP, getIB, showToast]);

  const buyStandings = useCallback(() => {
    setState((s) => {
      const tid = s.myTeamId;
      if (!tid) return s;
      if (getIP(s, tid) < 50) { showToast('포인트가 부족해요 (50P 필요)'); return s; }
      return { ...s, itemPoints: { ...s.itemPoints, [tid]: getIP(s, tid) - 50 }, screen: 'standings' };
    });
  }, [getIP, showToast]);
  const backFromStandings = useCallback(() => setState((s) => ({ ...s, screen: 'shop' })), []);

  const openSwap = useCallback(() => {
    setState((s) => {
      const tid = s.myTeamId;
      if (!tid) return s;
      if (getIP(s, tid) < 100) { showToast('포인트가 부족해요 (100P 필요)'); return s; }
      return { ...s, screen: 'swap' };
    });
  }, [getIP, showToast]);

  const confirmSwap = useCallback((otherId: string) => {
    setState((s) => {
      const my = s.myTeamId;
      if (!my || otherId === my) return s;
      const other = s.teams.find((t) => t.id === otherId);
      // eslint-disable-next-line no-alert
      if (!window.confirm(`${other ? other.name : '상대 팀'}와 총점을 바꿀까요? 100P가 소모돼요.`)) return s;
      const myT = teamTotal(s.scores, s.games, s.itemBonus, my);
      const otT = teamTotal(s.scores, s.games, s.itemBonus, otherId);
      showToast(`🔄 ${other ? other.name : '상대 팀'}와 점수를 바꿨어요!`);
      return {
        ...s,
        itemPoints: { ...s.itemPoints, [my]: getIP(s, my) - 100 },
        itemBonus: {
          ...s.itemBonus,
          [my]: getIB(s, my) + (otT - myT),
          [otherId]: getIB(s, otherId) + (myT - otT),
        },
        screen: 'shop',
      };
    });
  }, [getIP, getIB, showToast]);
  const backFromSwap = useCallback(() => setState((s) => ({ ...s, screen: 'shop' })), []);

  const openRoulette = useCallback(() => {
    setState((s) => {
      const tid = s.myTeamId;
      if (!tid) return s;
      if (getIP(s, tid) < 10) { showToast('포인트가 부족해요 (10P 필요)'); return s; }
      return { ...s, screen: 'roulette', roulette: { phase: 'idle', landing: 0, result: null } };
    });
  }, [getIP, showToast]);

  const spinRoulette = useCallback(() => {
    let tid: string | null = null;
    let landing = 0;
    let result = 0;
    let blocked = false;
    setState((s) => {
      tid = s.myTeamId;
      if (!tid) { blocked = true; return s; }
      if (s.roulette.phase === 'spinning') { blocked = true; return s; }
      if (getIP(s, tid) < 10) { showToast('포인트가 부족해요 (10P 필요)'); blocked = true; return s; }
      landing = 42 + Math.floor(Math.random() * ROULETTE_POOL.length);
      result = ROULETTE_POOL[landing % ROULETTE_POOL.length];
      return {
        ...s,
        itemPoints: { ...s.itemPoints, [tid]: getIP(s, tid) - 10 },
        roulette: { phase: 'reset', landing, result },
      };
    });
    if (blocked || !tid) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setState((s) => ({ ...s, roulette: { ...s.roulette, phase: 'spinning' } }));
    }));
    if (spinTimer.current) clearTimeout(spinTimer.current);
    spinTimer.current = setTimeout(() => {
      setState((s) => {
        const t = s.myTeamId!;
        return {
          ...s,
          itemBonus: { ...s.itemBonus, [t]: getIB(s, t) + result },
          roulette: { ...s.roulette, phase: 'done' },
        };
      });
      showToast((result > 0 ? '🎉 +' : '😵 ') + result + '점!');
    }, 3300);
  }, [getIP, getIB, showToast]);

  const backToAdmin = useCallback(() => setState((s) => ({ ...s, screen: 'admin' })), []);
  const toResults = useCallback(() => {
    setState((s) => {
      if (s.teams.length === 0) { showToast('팀을 먼저 추가해 주세요.'); return s; }
      return { ...s, screen: 'results' };
    });
  }, [showToast]);

  // ---------- admin mutations ----------
  const addTeam = useCallback(() => {
    setState((s) => {
      const idx = s.teams.length;
      const id = 't' + Date.now();
      const code = genCode(s.teams.map((t) => t.code));
      showToast('팀이 추가됐어요 · 코드 ' + code);
      return {
        ...s,
        teams: [...s.teams, { id, name: '새 팀 ' + (idx + 1), code, color: PALETTE[idx % PALETTE.length] }],
      };
    });
  }, [showToast]);

  const renameTeam = useCallback((id: string, name: string) => {
    setState((s) => ({ ...s, teams: s.teams.map((t) => (t.id === id ? { ...t, name } : t)) }));
  }, []);

  const deleteTeam = useCallback((id: string) => {
    setState((s) => {
      const scores = { ...s.scores }; delete scores[id];
      const itemPoints = { ...s.itemPoints }; delete itemPoints[id];
      const itemBonus = { ...s.itemBonus }; delete itemBonus[id];
      return {
        ...s,
        teams: s.teams.filter((t) => t.id !== id),
        scores, itemPoints, itemBonus,
        myTeamId: s.myTeamId === id ? null : s.myTeamId,
      };
    });
  }, []);

  const addGame = useCallback(() => {
    setState((s) => {
      const idx = s.games.length;
      const id = 'g' + Date.now();
      showToast('게임이 추가됐어요');
      return { ...s, games: [...s.games, { id, name: '새 게임 ' + (idx + 1), place: '' }] };
    });
  }, [showToast]);

  const renameGame = useCallback((id: string, name: string) => {
    setState((s) => ({ ...s, games: s.games.map((g) => (g.id === id ? { ...g, name } : g)) }));
  }, []);

  const deleteGame = useCallback((id: string) => {
    setState((s) => {
      const scores: typeof s.scores = {};
      Object.keys(s.scores).forEach((tid) => {
        const o = { ...s.scores[tid] };
        delete o[id];
        scores[tid] = o;
      });
      const games = s.games.filter((g) => g.id !== id);
      const adminGameId = s.adminGameId === id ? (games[0] ? games[0].id : null) : s.adminGameId;
      return { ...s, games, scores, adminGameId };
    });
  }, []);

  const setScore = useCallback((tid: string, gid: string, val: string | number) => {
    const v = clampScore(val);
    setState((s) => ({ ...s, scores: { ...s.scores, [tid]: { ...(s.scores[tid] || {}), [gid]: v } } }));
  }, []);

  const resetScores = useCallback(() => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('모든 점수와 아이템 포인트를 초기화할까요?')) return;
    setState((s) => ({ ...s, scores: {}, itemBonus: {}, itemPoints: {} }));
    showToast('점수를 초기화했어요');
  }, [showToast]);

  const resetAll = useCallback(() => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('팀·게임·점수를 모두 삭제할까요? 되돌릴 수 없어요.')) return;
    setState((s) => ({
      ...s, teams: [], games: [], scores: {}, adminGameId: null, itemBonus: {}, itemPoints: {}, matchStatus: {},
    }));
    showToast('대회를 리셋했어요');
  }, [showToast]);

  const selectAdminTab = useCallback((tab: AdminTab) => setState((s) => ({ ...s, adminTab: tab })), []);

  // ---------- derived view ----------
  const view = useMemo<ScoreboardView>(() => {
    const s = state;
    const screen: Screen = s.screen;
    const activeGameId = s.adminGameId || (s.games[0] && s.games[0].id) || null;

    const scoreRowFor = (gid: string) => (t: (typeof s.teams)[number]) => ({
      id: t.id, name: t.name, color: t.color, initial: initial(t.name),
      score: getScore(s.scores, t.id, gid),
      dec: () => setScore(t.id, gid, getScore(s.scores, t.id, gid) - 1),
      inc: () => setScore(t.id, gid, getScore(s.scores, t.id, gid) + 1),
      onInput: (e: ChangeEvent<HTMLInputElement>) => setScore(t.id, gid, e.target.value),
    });

    const managerGameId = s.managerGameId || (s.games[0] && s.games[0].id) || null;
    const managerGame = s.games.find((g) => g.id === managerGameId);
    const myTeam = s.teams.find((t) => t.id === s.myTeamId);

    const teamBreakdown = s.games.map((g) => ({ name: g.name, label: getScore(s.scores, s.myTeamId || '', g.id) + '점' }));
    if (myTeam && getIB(s, myTeam.id) !== 0) {
      const b = getIB(s, myTeam.id);
      teamBreakdown.push({ name: '🎁 아이템 보너스', label: (b > 0 ? '+' : '') + b + '점' });
    }

    const adminTabs = (['scores', 'teams', 'games', 'settings'] as AdminTab[]).map((id) => ({
      id,
      name: { scores: '점수', teams: '팀', games: '게임', settings: '설정' }[id],
      active: id === s.adminTab,
      select: () => selectAdminTab(id),
    }));

    const adminGameChips = s.games.map((g) => ({
      id: g.id, name: g.name, active: g.id === activeGameId,
      select: () => setState((prev) => ({ ...prev, adminGameId: g.id })),
    }));

    const rankColors: Record<number, string> = { 1: '#ffd158', 2: '#c4ccd6', 3: '#e0965a' };
    const rankedTeams = ranked(s.teams, s.scores, s.games, s.itemBonus);
    const rankedList = rankedTeams.map((r) => ({ ...r, rankColor: rankColors[r.rank] || '#6b7684' }));

    // ---- schedule ----
    const teamName = (num: number) => s.teams[num - 1]?.name || `${num}팀`;
    const teamColor = (num: number) => s.teams[num - 1]?.color || '#8b95a1';
    const myIdx = s.myTeamId ? s.teams.findIndex((t) => t.id === s.myTeamId) : -1;
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
        pick: () => setState((prev) => ({ ...prev, screen: 'managerMatch', managerMatchKey: m.key })),
      };
    });
    const managerMatchNoMatches = mGameIdx >= 0 && managerMatchList.length === 0;

    let mDetail: ScoreboardView['mDetail'] = null;
    if (s.managerMatchKey) {
      const [gid, pair] = s.managerMatchKey.split(':');
      const [aNum, bNum] = pair.split('-').map(Number);
      const gm = s.games.find((g) => g.id === gid);
      const cur = s.matchStatus[s.managerMatchKey] || 'pending';
      const mkRow = (num: number) => {
        const t = s.teams[num - 1];
        if (!t) return null;
        return {
          id: t.id, name: t.name, color: t.color, initial: initial(t.name),
          score: getScore(s.scores, t.id, gid),
          dec: () => setScore(t.id, gid, getScore(s.scores, t.id, gid) - 1),
          inc: () => setScore(t.id, gid, getScore(s.scores, t.id, gid) + 1),
          onInput: (e: ChangeEvent<HTMLInputElement>) => setScore(t.id, gid, e.target.value),
        };
      };
      const key = s.managerMatchKey;
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
    const myIP = myTeam ? getIP(s, myTeam.id) : 0;
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

    const rl = s.roulette;
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
      .filter((t) => t.id !== s.myTeamId)
      .map((t) => ({
        id: t.id, name: t.name, color: t.color, initial: initial(t.name),
        total: teamTotal(s.scores, s.games, s.itemBonus, t.id),
        pick: () => confirmSwap(t.id),
      }));

    return {
      screen,
      toast: s.toast,
      loginError: s.loginError,
      codeInput: s.codeInput,
      pinInput: s.pinInput,
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
        pick: () => setState((prev) => ({ ...prev, screen: 'managerMatches', managerGameId: g.id })),
      })),
      managerGameName: managerGame?.name || '',
      managerMatchCards, managerMatchNoMatches, mDetail,
      backToManagerGames, backToManagerMatches,

      adminTabs,
      adminIsScores: s.adminTab === 'scores', adminIsTeams: s.adminTab === 'teams',
      adminIsGames: s.adminTab === 'games', adminIsSettings: s.adminTab === 'settings',
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
    state, getIB, getIP, setScore, selectAdminTab, setMatchStatus, onCodeInput, onPinInput, onCodeKey, onPinKey,
    submitTeamCode, submitPin, goStaff, toLogin, logout, backToManagerGames, backToManagerMatches,
    addTeam, addGame, renameTeam, deleteTeam, renameGame, deleteGame, resetScores, resetAll, toResults, backToAdmin,
    openShop, backFromShop, backToShop, backFromStandings, backFromSwap, buyPlus10, buyStandings, openSwap,
    confirmSwap, openRoulette, spinRoulette, openSchedule, backFromSchedule, openStatus, backFromStatus,
  ]);

  return { view };
}
