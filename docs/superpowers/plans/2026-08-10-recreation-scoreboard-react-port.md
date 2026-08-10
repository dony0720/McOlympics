# 레크레이션 점수판 React+Tailwind Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reimplement the fully-specified "레크레이션 점수판" (recreation scoreboard) prototype — currently living as a proprietary `dc-runtime` template at `design-reference/레크레이션 점수판.dc.html` — as a standalone React 19 + TypeScript + Tailwind CSS v4 single-page app, byte-for-byte faithful to the approved design and behavior.

**Architecture:** One `useScoreboard()` hook owns all app state (mirroring the original `Component extends DCLogic` class) and exposes a single `ScoreboardView` object of pre-computed display data + action callbacks — this keeps the port a near-mechanical, low-risk translation of already-proven logic. `App.tsx` is a thin router that switches on `view.screen` to render one of 14 **page** components, each a straight JSX+Tailwind transcription of the corresponding block in the reference `.dc.html`. Pure calculation logic (totals, ranking, code generation, match pairing) is factored into standalone functions in `src/lib/scoring.ts`, unit-tested with Vitest — this is the only part of the port with real logic risk; pages are declarative rendering of hook output.

**Folder structure (maintainability-first):**

```
src/
  types/
    state.ts        — domain/state types (Screen, Team, Game, ScoreboardState, ...)
    view.ts          — view-model types returned by the hook (ScoreboardView, row/item types, PageProps)
    index.ts          — barrel: `export * from './state'; export * from './view';`
  lib/
    scoring.ts         — pure, framework-free business logic (unit-tested)
    scoring.test.ts
  data/
    initialState.ts    — seed data (teams/games/scores) for a fresh session
  hooks/
    useScoreboard.ts   — the one stateful hook; everything else is presentational
  components/
    ui/                — generic, feature-agnostic primitives reused across pages
      PageShell.tsx
      TeamAvatar.tsx
      BackButton.tsx
      Buttons.tsx
      ScoreStepper.tsx
      SegmentedControl.tsx
      Toast.tsx
  pages/               — one file per `Screen` value in the state machine; route-level components
    LoginPage.tsx
    StaffPinPage.tsx
    TeamPage.tsx
    ResultsPage.tsx
    StatusPage.tsx
    SchedulePage.tsx
    manager/           — grouped: the 담당자 game→match→detail drill-down
      ManagerGamesPage.tsx
      ManagerMatchesPage.tsx
      ManagerMatchPage.tsx
    admin/              — grouped: admin dashboard + its 4 tabs
      AdminPage.tsx
      ScoresTab.tsx
      TeamsTab.tsx
      GamesTab.tsx
      SettingsTab.tsx
    shop/               — grouped: item shop + its 3 sub-flows
      ShopPage.tsx
      RoulettePage.tsx
      SwapPage.tsx
      StandingsPage.tsx
  App.tsx               — routes `view.screen` → a page component; mounts <Toast>
  App.test.tsx
  main.tsx
  index.css
```

Rule of thumb used throughout: **`components/ui/`** = no knowledge of scoreboard domain, reusable anywhere; **`pages/`** = one per `Screen` value, only presentational (all logic comes from `view`); **`types/`** = split so "what shape is the state" (`state.ts`) and "what does a page receive" (`view.ts`) are separate, independently readable files instead of one growing blob.

**Tech Stack:** Vite 8, React 19, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), Vitest (unit tests), Playwright (manual/QA screenshots — already used to verify the reference design, dev-only).

## Global Constraints

- Visual fidelity: every pixel value (padding, radius, font-size, spacing) in the reference must be preserved exactly — use Tailwind arbitrary values (e.g. `px-[18px]`, `rounded-[14px]`) rather than rounding to the default spacing scale.
- Color fidelity: brand/system colors (not per-team dynamic colors) must be defined once as Tailwind `@theme` tokens (Task 3) and referenced by name everywhere — never repeat a raw hex for a token that has one.
- Per-team colors (`Team.color`) are runtime-dynamic (user-assigned from a rotating palette) and can never be expressed as a static Tailwind class — always apply via inline `style={{ backgroundColor: ... }}`. This is the one intentional exception to "no raw hex in JSX."
- No `localStorage`/backend: state lives only in React state for the life of the page load, exactly matching the reference implementation (confirmed: the reference has no persistence layer).
- Business logic (scoring, ranking, matchups, PIN/code auth) must match the reference file at `design-reference/레크레이션 점수판.dc.html` (script block, lines 699–1245) exactly — this is the source of truth for every numeric/string literal (PINs `1234`/`9999`, item costs `20/10/50/100`P, roulette pool `[10,-10,20,-20,30,-30]`, etc.).
- Korean copy (labels, button text, error messages) must be copied verbatim from the reference file — do not paraphrase or retranslate.
- All 14 screens: `login`, `staffPin`, `team`, `managerGames`, `managerMatches`, `managerMatch`, `admin` (4 tabs: scores/teams/games/settings), `results`, `shop`, `roulette`, `swap`, `standings`, `status`, `schedule`, plus the global `toast` overlay.
- Folder placement: a component only belongs in `components/ui/` if it has zero references to scoreboard-specific state shapes; anything that takes a `view: ScoreboardView` (or a slice of it) belongs under `pages/`.

---

## Reference material

- `design-reference/레크레이션 점수판.dc.html` — the approved design, template markup (lines 1–698) + full state/logic (lines 699–1245, `class Component extends DCLogic`). This file is a complete, already-verified-working prototype (confirmed via Playwright screenshot: login screen renders pixel-correct, PIN `9999` → admin dashboard → score entry all work). **Treat every literal in it as authoritative.**
- `design-reference/support.js` — the `dc-runtime` that powers the prototype preview. Not ported (React replaces it entirely) — kept only for reference/diffing if a behavior is ambiguous.

---

### Task 1: Pure scoring/matchup logic + unit tests

**Files:**
- Create: `src/lib/scoring.ts`
- Test: `src/lib/scoring.test.ts`

**Interfaces:**
- Produces: `initial(name: string): string`, `getScore(scores: ScoreTable, tid: string, gid: string): number`, `teamTotal(...): number`, `clampScore(raw: string | number): number`, `ranked(...): RankedTeam[]`, `genCode(existingCodes: string[]): string`, `MATCHUPS: (number | null)[][]`, `buildMatches(gameIndex: number, gameId: string): { a: number; b: number; key: string }[]`, `ROULETTE_POOL: number[]`, `PALETTE: string[]`.
- Consumes: nothing (leaf module, no React, no dependency on `src/types/`).

This task defines its own minimal structural types (`ScoreTable`, `MinimalTeam`, `MinimalGame`) so it's fully self-contained; Task 2's `src/types/state.ts` re-uses these shapes for the app-wide `Team`/`Game`/`ScoreTable` types.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/scoring.test.ts`:

```ts
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
```

- [ ] **Step 2: Install Vitest and verify the tests fail**

```bash
npm install -D vitest
```

Add to `package.json` `"scripts"`: `"test": "vitest run"`.

Run: `npm test`
Expected: FAIL — `Cannot find module './scoring'`

- [ ] **Step 3: Implement `src/lib/scoring.ts`**

```ts
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
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `npm test`
Expected: all `scoring.test.ts` tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scoring.ts src/lib/scoring.test.ts package.json package-lock.json
git commit -m "feat: add pure scoring/matchup logic with unit tests"
```

---

### Task 2: Domain types + view types + initial state constants

**Files:**
- Create: `src/types/state.ts`
- Create: `src/types/view.ts`
- Create: `src/types/index.ts`
- Create: `src/data/initialState.ts`

**Interfaces:**
- Consumes: `PALETTE`, `MATCHUPS` from `src/lib/scoring.ts` (Task 1).
- Produces: all types below (re-used by every later task via `import type { ... } from '../types'` or `'../../types'`, resolved through the barrel), `createInitialState(): ScoreboardState`.

Splitting into two files keeps each independently scannable: `state.ts` answers "what does the app remember between renders," `view.ts` answers "what does a page component actually receive as props." A page only ever imports from `view.ts` (via the barrel); only `useScoreboard` (Task 5) and `initialState.ts` touch `state.ts`.

- [ ] **Step 1: Write `src/types/state.ts`**

```ts
export type Screen =
  | 'login' | 'staffPin' | 'team'
  | 'managerGames' | 'managerMatches' | 'managerMatch'
  | 'admin' | 'results'
  | 'shop' | 'roulette' | 'swap' | 'standings'
  | 'status' | 'schedule';

export type AdminTab = 'scores' | 'teams' | 'games' | 'settings';
export type MatchState = 'pending' | 'live' | 'done';
export type RoulettePhase = 'idle' | 'reset' | 'spinning' | 'done';

export interface Team {
  id: string;
  name: string;
  code: string;
  color: string;
}

export interface Game {
  id: string;
  name: string;
  place: string;
}

export type ScoreTable = Record<string, Record<string, number>>;

export interface RouletteState {
  phase: RoulettePhase;
  landing: number;
  result: number | null;
}

export interface ScoreboardState {
  screen: Screen;
  codeInput: string;
  pinInput: string;
  loginError: string;
  myTeamId: string | null;
  managerGameId: string | null;
  managerMatchKey: string | null;
  adminTab: AdminTab;
  adminGameId: string | null;
  toast: string | null;
  matchStatus: Record<string, MatchState>;
  itemPoints: Record<string, number>;
  itemBonus: Record<string, number>;
  roulette: RouletteState;
  shopFrom: Screen;
  scheduleFrom: Screen;
  statusFrom: Screen;
  teams: Team[];
  games: Game[];
  scores: ScoreTable;
}
```

- [ ] **Step 2: Write `src/types/view.ts`**

```ts
import type { ChangeEvent, KeyboardEvent, CSSProperties } from 'react';
import type { AdminTab, MatchState, Screen } from './state';

export interface TeamBreakdownRow { name: string; label: string; }

export interface ScoreRow {
  id: string;
  name: string;
  color: string;
  initial: string;
  score: number;
  dec: () => void;
  inc: () => void;
  onInput: (e: ChangeEvent<HTMLInputElement>) => void;
}

export interface ManagerGameCard { name: string; sub: string; pick: () => void; }

export interface ManagerMatchCard {
  aName: string; bName: string;
  aColor: string; bColor: string;
  aInitial: string; bInitial: string;
  badge: string; badgeColor: MatchState;
  pick: () => void;
}

export interface StatusOption {
  value: MatchState;
  label: string;
  active: boolean;
  select: () => void;
}

export interface MatchDetail {
  gameName: string;
  place: string;
  isIndoor: boolean;
  aName: string;
  bName: string;
  statusLabel: string;
  statusColor: MatchState;
  statusOptions: StatusOption[];
  rows: ScoreRow[];
}

export interface AdminTabDef { id: AdminTab; name: string; active: boolean; select: () => void; }
export interface GameChip { id: string; name: string; active: boolean; select: () => void; }
export interface AdminTeamRow {
  id: string; name: string; color: string; code: string;
  onName: (e: ChangeEvent<HTMLInputElement>) => void;
  remove: () => void;
}
export interface AdminGameRow {
  id: string; name: string; num: number;
  onName: (e: ChangeEvent<HTMLInputElement>) => void;
  remove: () => void;
}

export interface RankedRow {
  id: string; name: string; color: string; initial: string; total: number; rank: number;
  rankColor: string;
}

export interface PodiumEntry { color: string; initial: string; name: string; total: number; }

export interface ShopItem {
  id: string; emoji: string; name: string; desc: string;
  accent: string; bg: string; action: () => void;
  affordable: boolean; costLabel: string; cardOpacity: number;
}

export interface RouletteCell { label: string; positive: boolean; }

export interface SwapTarget {
  id: string; name: string; color: string; initial: string; total: number; pick: () => void;
}

export interface ScheduleTeamRow {
  time: string; name: string; place: string; isIndoor: boolean;
  oppName: string; oppColor: string; oppInitial: string; hasOpponent: boolean;
}

export interface SchedulePair { a: string; b: string; }
export interface MasterScheduleRow {
  time: string; name: string; place: string; isIndoor: boolean;
  pairs: SchedulePair[]; pending: boolean;
}

export interface StatusMatch {
  key: string; aName: string; bName: string; aColor: string; bColor: string;
  aInitial: string; bInitial: string;
  badge: string; badgeColor: MatchState;
  options: StatusOption[];
}
export interface StatusGame {
  time: string; name: string; place: string; isIndoor: boolean;
  matches: StatusMatch[]; pending: boolean;
}
export interface StatusSummaryItem { label: string; n: number; color: MatchState; }

export interface ScoreboardView {
  screen: Screen;
  toast: string | null;
  loginError: string;
  codeInput: string;
  pinInput: string;
  demoCode: string;
  onCodeInput: (e: ChangeEvent<HTMLInputElement>) => void;
  onPinInput: (e: ChangeEvent<HTMLInputElement>) => void;
  onCodeKey: (e: KeyboardEvent<HTMLInputElement>) => void;
  onPinKey: (e: KeyboardEvent<HTMLInputElement>) => void;
  submitTeamCode: () => void;
  submitPin: () => void;
  goStaff: () => void;
  toLogin: () => void;
  logout: () => void;

  myTeamName: string; myTeamColor: string; myTeamInitial: string; myTeamTotal: number;
  myItemPoints: number;
  teamBreakdown: TeamBreakdownRow[];

  noGames: boolean;
  managerGameCards: ManagerGameCard[];
  managerGameName: string;
  managerMatchCards: ManagerMatchCard[];
  managerMatchNoMatches: boolean;
  mDetail: MatchDetail | null;
  backToManagerGames: () => void;
  backToManagerMatches: () => void;

  adminTabs: AdminTabDef[];
  adminIsScores: boolean; adminIsTeams: boolean; adminIsGames: boolean; adminIsSettings: boolean;
  adminGameChips: GameChip[];
  adminScoreRows: ScoreRow[];
  adminTeamRows: AdminTeamRow[];
  adminGameRows: AdminGameRow[];
  addTeam: () => void; addGame: () => void;
  resetScores: () => void; resetAll: () => void;
  toResults: () => void; backToAdmin: () => void;

  rankedList: RankedRow[];
  hasWinner: boolean; winnerName: string;
  podium: { first: PodiumEntry | null; second: PodiumEntry | null; third: PodiumEntry | null };

  openShop: () => void; backFromShop: () => void; backToShop: () => void;
  backFromStandings: () => void; backFromSwap: () => void;
  shopItems: ShopItem[]; shopTeamName: string;
  openRoulette: () => void; spinRoulette: () => void;
  rouletteCells: RouletteCell[]; reelStripStyle: CSSProperties;
  rouletteSpinning: boolean; rouletteIdle: boolean; rouletteDone: boolean;
  rResultLabel: string; rResultPositive: boolean;
  canSpinAgain: boolean;
  swapTargets: SwapTarget[];

  openSchedule: () => void; backFromSchedule: () => void;
  scheduleIsTeam: boolean; scheduleIsMaster: boolean; scheduleTeamName: string;
  teamScheduleRows: ScheduleTeamRow[]; masterScheduleRows: MasterScheduleRow[];

  openStatus: () => void; backFromStatus: () => void;
  statusGames: StatusGame[]; statusSummary: StatusSummaryItem[];
}

export interface PageProps { view: ScoreboardView; }
```

- [ ] **Step 3: Write `src/types/index.ts`**

```ts
export * from './state';
export * from './view';
```

- [ ] **Step 4: Write `src/data/initialState.ts`**

```ts
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
```

- [ ] **Step 5: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors referencing `types/` or `data/initialState.ts`.

- [ ] **Step 6: Commit**

```bash
git add src/types src/data/initialState.ts
git commit -m "feat: add scoreboard state/view types and initial state"
```

---

### Task 3: Tailwind theme tokens + conversion guide

**Files:**
- Modify: `src/index.css`
- Create: `design-reference/CONVERSION_GUIDE.md`

**Interfaces:**
- Produces: Tailwind utility classes `bg-brand`, `text-brand`, `bg-brand-dark` (active state), `bg-brand-soft`, `bg-brand-soft-dark`, `text-ink`, `text-ink-soft`, `bg-ink`, `bg-ink-soft`, `text-muted`, `text-muted-2`, `text-muted-3`, `text-muted-4`, `bg-line`, `bg-line-dark`, `bg-surface`, `text-danger`, `bg-danger-soft`, `text-warn`, `text-warn-dark`, `bg-warn-soft`, `text-info`, `bg-info-soft`, `text-gold`, `bg-gold`, `bg-gold-dark`, `text-violet`, `bg-violet-soft`, `bg-app` — plus animations `animate-screen-in`, `animate-pop`, `animate-toast-up`.

Every color literal used by later tasks is defined here **by name**; page tasks reference the token names below, not raw hex.

- [ ] **Step 1: Replace `src/index.css`**

```css
@import "tailwindcss";

@theme {
  --color-brand: #03b26c;
  --color-brand-dark: #02a05f;
  --color-brand-soft: #e6f7ef;
  --color-brand-soft-dark: #c3ecd8;

  --color-ink: #191f28;
  --color-ink-soft: #333d4b;

  --color-muted: #8b95a1;
  --color-muted-2: #6b7684;
  --color-muted-3: #4e5968;
  --color-muted-4: #b0b8c1;

  --color-line: #f2f4f6;
  --color-line-dark: #e5e8eb;
  --color-surface: #f9fafb;

  --color-danger: #f04452;
  --color-danger-soft: #ffeaec;

  --color-warn: #fe9800;
  --color-warn-dark: #e07800;
  --color-warn-soft: #fff4e6;

  --color-info: #3182f6;
  --color-info-soft: #e8f3ff;

  --color-gold: #ffd158;
  --color-gold-dark: #f5c400;

  --color-violet: #8b5cf6;
  --color-violet-soft: #f3edff;

  --color-silver: #c4ccd6;
  --color-bronze: #e0965a;
  --color-bronze-light: #f5d9bf;

  --color-app: #dfe3e8;
  --color-panel-dark: #20262f;
  --color-panel-divider: #2b323c;

  --color-roulette-lilac: #d9c9ff;
  --color-roulette-muted: #8a7bb0;
  --color-roulette-reel: #120a24;

  --animate-screen-in: screenIn 0.25s ease;
  --animate-pop: pop 0.4s ease;
  --animate-toast-up: toastUp 0.25s ease;
}

@keyframes screenIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pop {
  0% { transform: scale(.9); opacity: 0; }
  60% { transform: scale(1.03); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes toastUp {
  from { opacity: 0; transform: translate(-50%, 12px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

@layer base {
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar {
    display: none;
  }
}
```

- [ ] **Step 2: Write `design-reference/CONVERSION_GUIDE.md`**

```markdown
# dc.html → React/Tailwind conversion guide

Reference source: `레크레이션 점수판.dc.html` in this folder (verbatim, verified-working prototype).

## Rules

1. **Pixel fidelity.** Every `padding`, `border-radius`, `font-size`, `letter-spacing`, `gap` value in the
   reference must survive unchanged. Use Tailwind arbitrary values: `padding:17px 18px` → `px-[18px] py-[17px]`,
   `border-radius:14px` → `rounded-[14px]`, `font-size:17px` → `text-[17px]`.
2. **Brand/system colors** use the `@theme` tokens from `src/index.css` (Task 3): `#03b26c` → `bg-brand`/`text-brand`,
   `#191f28` → `text-ink`, `#8b95a1` → `text-muted`, `#f2f4f6` → `bg-line`/`border-line`, etc. Never inline these hexes.
3. **Per-team colors** (`team.color`, dynamically assigned) are the one exception — always
   `style={{ backgroundColor: team.color }}`, never a Tailwind class.
4. **`style-active="..."` in the reference** = the CSS `:active` pseudo-class → Tailwind `active:` variant
   (e.g. `style-active="background:#02a05f;"` on a `bg-brand` button → add `active:bg-brand-dark`).
5. **`style-focus="..."`** = `:focus` → Tailwind `focus:` variant.
6. **Font weights:** 500 → `font-medium`, 600 → `font-semibold`, 700 → `font-bold`, 800 → `font-extrabold`.
7. **`sc-if value="{{ x }}"`** → `{x && (...)}` in JSX.
8. **`sc-for list="{{ xs }}" as="x"`** → `{xs.map((x) => (...))}` with a stable `key` (use the row's `id`/`key`
   field from the view model; the reference's `hint-placeholder-count` is a design-tool loading hint — drop it).
9. **`{{ expr }}`** → `{expr}`.
10. Inline `<svg>` icons are copied verbatim (same `path d=`, `viewBox`, `stroke-width`) — only the wrapping
    element becomes JSX.
11. Reusable pieces (team avatar circle, back-chevron button, primary/secondary CTA button, -/value/+ stepper,
    3-way status segmented control) live in `src/components/ui/` (Task 4) — import those instead of re-inlining
    the markup on every page.
12. **Folder placement:** a new component goes in `src/components/ui/` only if it has zero knowledge of
    scoreboard state; anything that reads a `view: ScoreboardView` (or a slice of it) goes in `src/pages/`,
    grouped into a subfolder (`manager/`, `admin/`, `shop/`) if it's part of a multi-step flow.
```

- [ ] **Step 3: Verify Tailwind builds with the new theme**

Run: `npm run build`
Expected: build succeeds (pages don't exist to use the tokens yet, but the CSS itself must compile without errors).

- [ ] **Step 4: Commit**

```bash
git add src/index.css design-reference/CONVERSION_GUIDE.md
git commit -m "feat: add Tailwind design tokens and dc.html conversion guide"
```

---

### Task 4: Shared UI primitives

**Files:**
- Create: `src/components/ui/PageShell.tsx`
- Create: `src/components/ui/TeamAvatar.tsx`
- Create: `src/components/ui/BackButton.tsx`
- Create: `src/components/ui/Buttons.tsx`
- Create: `src/components/ui/ScoreStepper.tsx`
- Create: `src/components/ui/SegmentedControl.tsx`
- Create: `src/components/ui/Toast.tsx`

**Interfaces:**
- Consumes: `StatusOption` from `src/types/view.ts` (Task 2, via the `../../types` barrel); theme tokens from Task 3.
- Produces: `<PageShell>`, `<TeamAvatar>`, `<BackButton>`, `<PrimaryButton>`, `<SecondaryButton>`, `<DarkButton>`, `<ScoreStepper>`, `<SegmentedControl>`, `<Toast>` — consumed by every page task (6–11).

`PageShell` is the only component here named after "page" but it lives in `ui/` on purpose: it's a layout primitive (the animated flex column wrapper every page uses), not a route. Keeping it out of `src/pages/` avoids confusing "a page" (route-level, in `pages/`) with "the page frame" (reusable, in `ui/`).

- [ ] **Step 1: `src/components/ui/PageShell.tsx`**

```tsx
import type { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

export function PageShell({ children, className = '' }: PageShellProps) {
  return <div className={`flex flex-1 flex-col animate-screen-in ${className}`}>{children}</div>;
}
```

- [ ] **Step 2: `src/components/ui/TeamAvatar.tsx`**

```tsx
interface TeamAvatarProps {
  color: string;
  initial: string;
  size?: number;
  ring?: boolean;
}

export function TeamAvatar({ color, initial, size = 34, ring = false }: TeamAvatarProps) {
  const radius = Math.round(size * 0.32);
  const fontSize = Math.round(size * 0.42);
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: color,
        boxShadow: ring ? '0 0 0 3px rgba(255,209,88,.4)' : undefined,
      }}
    >
      <span className="font-extrabold text-white" style={{ fontSize }}>{initial}</span>
    </div>
  );
}
```

- [ ] **Step 3: `src/components/ui/BackButton.tsx`**

```tsx
interface BackButtonProps {
  onClick: () => void;
  stroke?: string;
}

export function BackButton({ onClick, stroke = '#191f28' }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center border-none bg-transparent p-0"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M15 5l-7 7 7 7" stroke={stroke} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
```

- [ ] **Step 4: `src/components/ui/Buttons.tsx`**

```tsx
import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function PrimaryButton({ className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`w-full cursor-pointer rounded-[14px] border-none bg-brand py-[17px] text-[17px] font-semibold text-white active:bg-brand-dark ${className}`}
    />
  );
}

export function DarkButton({ className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] border-none bg-ink py-[17px] text-[17px] font-semibold text-white active:bg-ink-soft ${className}`}
    />
  );
}

export function SoftButton({ className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`w-full cursor-pointer rounded-[14px] border-none bg-brand-soft py-[15px] text-[16px] font-bold text-brand active:bg-brand-soft-dark ${className}`}
    />
  );
}

export function PlainButton({ className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`cursor-pointer border-none bg-transparent text-muted-3 ${className}`}
    />
  );
}
```

- [ ] **Step 5: `src/components/ui/ScoreStepper.tsx`**

```tsx
import type { ChangeEvent } from 'react';

interface ScoreStepperProps {
  value: number;
  onDec: () => void;
  onInc: () => void;
  onInput: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function ScoreStepper({ value, onDec, onInc, onInput }: ScoreStepperProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onDec}
        className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] border-none bg-line p-0 text-[22px] font-semibold text-muted-3 active:bg-line-dark"
      >
        −
      </button>
      <input
        value={value}
        onChange={onInput}
        inputMode="numeric"
        className="h-[38px] w-[58px] rounded-[10px] border-none bg-surface text-center text-[17px] font-bold text-ink shadow-[inset_0_0_0_1.5px_#e5e8eb] outline-none focus:shadow-[inset_0_0_0_1.6px_#03b26c]"
      />
      <button
        onClick={onInc}
        className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] border-none bg-brand-soft p-0 text-[22px] font-semibold text-brand active:bg-brand-soft-dark"
      >
        +
      </button>
    </div>
  );
}
```

- [ ] **Step 6: `src/components/ui/SegmentedControl.tsx`**

```tsx
import type { StatusOption } from '../../types';

const ACTIVE_CLASS: Record<StatusOption['value'], string> = {
  pending: 'bg-line-dark text-muted-3',
  live: 'bg-warn-soft text-warn-dark',
  done: 'bg-brand-soft text-brand',
};

export function SegmentedControl({ options }: { options: StatusOption[] }) {
  return (
    <div className="flex gap-[5px] rounded-[11px] bg-line p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={o.select}
          className={`flex-1 rounded-[9px] border-none py-[9px] text-[13px] font-bold ${
            o.active ? ACTIVE_CLASS[o.value] : 'bg-transparent text-muted-4'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: `src/components/ui/Toast.tsx`**

```tsx
export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-[34px] left-1/2 z-50 max-w-[340px] -translate-x-1/2 animate-toast-up rounded-[14px] bg-[rgba(25,31,40,.94)] px-5 py-[14px] text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,.24)]">
      {message}
    </div>
  );
}
```

- [ ] **Step 8: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add src/components/ui
git commit -m "feat: add shared scoreboard UI primitives"
```

---

### Task 5: `useScoreboard` state hook

**Files:**
- Create: `src/hooks/useScoreboard.ts`

**Interfaces:**
- Consumes: `createInitialState` (Task 2), `initial`, `getScore`, `teamTotal`, `clampScore`, `ranked`, `genCode`, `MATCHUPS`, `buildMatches`, `ROULETTE_POOL`, `PALETTE` (Task 1), every type from `src/types` (Task 2, both `state.ts` and `view.ts` via the barrel).
- Produces: `useScoreboard(): { view: ScoreboardView }` — the single hook every page task (6–11) and `App.tsx` (Task 12) consumes.

This is a 1:1 behavioral port of the reference `class Component extends DCLogic` (lines 699–1245 of the reference file) — every method name, state shape, and numeric/string literal below is copied from that source; do not invent new behavior. This is the only file in `src/hooks/` — if the app ever needs a second hook, split by concern (e.g. `useToast.ts`) rather than growing this one further.

- [ ] **Step 1: Write `src/hooks/useScoreboard.ts`**

```ts
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
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors. (Pages don't exist yet, so nothing consumes `useScoreboard` — this only checks the hook file itself type-checks.)

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useScoreboard.ts
git commit -m "feat: port scoreboard state machine to a React hook"
```

---

### Task 6: Auth pages (Login, Staff PIN)

**Files:**
- Create: `src/pages/LoginPage.tsx`
- Create: `src/pages/StaffPinPage.tsx`

**Interfaces:**
- Consumes: `PageProps` (`{ view: ScoreboardView }`) from `../types` (Task 2); `PageShell`, `PrimaryButton` from `../components/ui/*` (Task 4).
- Produces: `<LoginPage view={...} />`, `<StaffPinPage view={...} />` — wired in Task 12.
- Reference markup: `design-reference/레크레이션 점수판.dc.html`, sections `<!-- ============ LOGIN ============ -->` and `<!-- ============ STAFF PIN ============ -->`.

- [ ] **Step 1: `src/pages/LoginPage.tsx`**

```tsx
import { PageShell } from '../components/ui/PageShell';
import { PrimaryButton } from '../components/ui/Buttons';
import type { PageProps } from '../types';

export function LoginPage({ view }: PageProps) {
  return (
    <PageShell className="px-6 pb-7 pt-16">
      <div className="mb-[22px] flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-brand">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M7 14l3-3 3 2 4-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 20h16" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </div>
      <div className="text-[26px] font-bold leading-[1.32] tracking-[-0.4px] text-ink">
        레크레이션<br />점수판
      </div>
      <div className="mt-[10px] text-[16px] leading-[1.5] text-muted">팀 코드를 입력하고 입장하세요</div>

      <div className="mt-9">
        <div className="mb-2 text-[14px] font-semibold text-muted-2">팀 코드</div>
        <input
          value={view.codeInput}
          onChange={view.onCodeInput}
          onKeyDown={view.onCodeKey}
          placeholder="예: K7QX"
          maxLength={6}
          className="w-full rounded-[14px] border-none bg-line px-[18px] py-[17px] text-[22px] font-bold uppercase tracking-[6px] text-ink outline-none focus:bg-white focus:shadow-[inset_0_0_0_1.6px_#03b26c]"
        />
        {view.loginError && (
          <div className="mt-[9px] text-[14px] font-medium text-danger">{view.loginError}</div>
        )}
      </div>

      <PrimaryButton onClick={view.submitTeamCode} className="mt-5">입장하기</PrimaryButton>

      <div className="mt-auto pt-7">
        <button
          onClick={view.goStaff}
          className="w-full cursor-pointer border-none bg-transparent py-[15px] text-[15px] font-semibold text-muted-3"
        >
          담당자 · 관리자 로그인 →
        </button>
        <div className="mt-[14px] rounded-[14px] border border-line bg-surface px-4 py-[14px]">
          <div className="text-[12px] font-bold tracking-[0.3px] text-muted">데모 안내</div>
          <div className="mt-[6px] text-[13px] leading-[1.7] text-muted-2">
            팀 코드 <b className="text-ink">{view.demoCode}</b> · 담당자 PIN <b className="text-ink">1234</b> · 관리자 PIN{' '}
            <b className="text-ink">9999</b>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 2: `src/pages/StaffPinPage.tsx`**

```tsx
import { PageShell } from '../components/ui/PageShell';
import { BackButton } from '../components/ui/BackButton';
import { PrimaryButton } from '../components/ui/Buttons';
import type { PageProps } from '../types';

export function StaffPinPage({ view }: PageProps) {
  return (
    <PageShell className="px-6 pb-7 pt-[14px]">
      <BackButton onClick={view.toLogin} />
      <div className="mt-[34px] text-[24px] font-bold tracking-[-0.3px] text-ink">담당자 · 관리자 로그인</div>
      <div className="mt-[10px] text-[16px] text-muted">PIN 4자리를 입력하세요</div>

      <div className="mt-[34px]">
        <input
          value={view.pinInput}
          onChange={view.onPinInput}
          onKeyDown={view.onPinKey}
          type="password"
          inputMode="numeric"
          maxLength={4}
          placeholder="••••"
          className="w-full rounded-[14px] border-none bg-line px-[18px] py-[17px] text-center text-[24px] font-bold tracking-[10px] text-ink outline-none focus:bg-white focus:shadow-[inset_0_0_0_1.6px_#03b26c]"
        />
        {view.loginError && (
          <div className="mt-[9px] text-center text-[14px] font-medium text-danger">{view.loginError}</div>
        )}
      </div>

      <PrimaryButton onClick={view.submitPin} className="mt-5">로그인</PrimaryButton>
      <div className="mt-4 text-center text-[13px] text-muted-4">담당자 1234 · 관리자 9999</div>
    </PageShell>
  );
}
```

- [ ] **Step 3: Manual QA**

```bash
npm run dev
```

Open the dev server URL. Verify:
- Login screen matches the earlier-verified reference screenshot (logo, title, input, demo card).
- Typing a wrong code and clicking "입장하기" shows "없는 코드예요. 다시 확인해 주세요."
- Typing the demo code (`K7QX`) and pressing Enter transitions `view.screen` to `'team'` (confirm via a temporary `console.log(view.screen)` in `App.tsx`, removed once Task 7 lands and the team page actually renders).
- Clicking "담당자 · 관리자 로그인 →" shows the PIN screen; back-chevron returns to login.
- Wrong PIN shows "PIN이 올바르지 않아요."; PIN `9999` triggers the transition to `'admin'` (verified the same way).

- [ ] **Step 4: Commit**

```bash
git add src/pages/LoginPage.tsx src/pages/StaffPinPage.tsx
git commit -m "feat: add login and staff PIN pages"
```

---

### Task 7: Team + Manager pages

**Files:**
- Create: `src/pages/TeamPage.tsx`
- Create: `src/pages/manager/ManagerGamesPage.tsx`
- Create: `src/pages/manager/ManagerMatchesPage.tsx`
- Create: `src/pages/manager/ManagerMatchPage.tsx`

**Interfaces:**
- Consumes: `PageProps`, `TeamAvatar`, `BackButton`, `ScoreStepper`, `SegmentedControl`, `PrimaryButton` from Tasks 2/4.
- Produces: 4 page components, wired in Task 12.
- Reference markup: sections `<!-- ============ TEAM VIEW ============ -->`, `<!-- ============ MANAGER: PICK GAME ============ -->`, `<!-- ============ MANAGER: PICK MATCH ============ -->`, `<!-- ============ MANAGER: MATCH DETAIL ============ -->`.
- Note the import depth: `TeamPage.tsx` sits directly in `src/pages/` (imports `../components/...`, `../types`); the three `manager/*` files sit one level deeper (imports `../../components/...`, `../../types`).

- [ ] **Step 1: `src/pages/TeamPage.tsx`**

```tsx
import { PageShell } from '../components/ui/PageShell';
import { TeamAvatar } from '../components/ui/TeamAvatar';
import type { PageProps } from '../types';

export function TeamPage({ view }: PageProps) {
  return (
    <PageShell>
      <div className="flex items-center justify-between px-5 py-4">
        <div className="text-[15px] font-semibold text-muted">우리 팀 점수</div>
        <button onClick={view.logout} className="cursor-pointer border-none bg-transparent text-[14px] font-semibold text-muted">
          나가기
        </button>
      </div>

      <div className="flex flex-col items-center px-5 pb-6 pt-2">
        <div className="mb-4 animate-pop">
          <TeamAvatar color={view.myTeamColor} initial={view.myTeamInitial} size={64} />
        </div>
        <div className="text-[19px] font-bold text-ink">{view.myTeamName}</div>
        <div className="mt-[26px] text-[15px] font-medium text-muted">지금까지 모은 점수</div>
        <div className="mt-1 flex animate-pop items-baseline gap-[6px]">
          <span className="text-[64px] font-extrabold leading-none tracking-[-2px] text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {view.myTeamTotal}
          </span>
          <span className="text-[24px] font-bold text-brand">점</span>
        </div>
        <div className="mt-[22px] flex gap-2">
          <button
            onClick={view.openShop}
            className="flex items-center gap-[6px] whitespace-nowrap rounded-[22px] border-none bg-ink px-[15px] py-[11px] text-[15px] font-bold text-white active:bg-ink-soft"
          >
            🎁 상점{' '}
            <span className="rounded-[20px] bg-gold px-[7px] py-[2px] text-[12px] font-extrabold text-ink">
              {view.myItemPoints}P
            </span>
          </button>
          <button
            onClick={view.openSchedule}
            className="flex items-center gap-[6px] whitespace-nowrap rounded-[22px] border-none bg-brand-soft px-[15px] py-[11px] text-[15px] font-bold text-brand active:bg-brand-soft-dark"
          >
            🏅 진행 순서
          </button>
        </div>
      </div>

      <div className="flex-1 border-t border-line bg-surface px-5 py-[22px]">
        <div className="mb-3 text-[14px] font-bold text-muted-2">게임별 점수</div>
        <div className="flex flex-col gap-[2px]">
          {view.teamBreakdown.map((g) => (
            <div key={g.name} className="flex items-center justify-between border-b border-line px-1 py-4">
              <span className="text-[16px] font-medium text-ink-soft">{g.name}</span>
              <span className="text-[17px] font-bold text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>{g.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-[22px] text-center text-[13px] text-muted-4">점수는 담당자가 입력하는 대로 반영돼요</div>
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 2: `src/pages/manager/ManagerGamesPage.tsx`**

```tsx
import { PageShell } from '../../components/ui/PageShell';
import type { PageProps } from '../../types';

export function ManagerGamesPage({ view }: PageProps) {
  return (
    <PageShell>
      <div className="flex items-center justify-between px-5 py-4">
        <div className="rounded-lg bg-brand-soft px-[11px] py-[5px] text-[13px] font-bold text-brand">담당자</div>
        <button onClick={view.logout} className="cursor-pointer border-none bg-transparent text-[14px] font-semibold text-muted">
          나가기
        </button>
      </div>
      <div className="px-5 pb-1 pt-2">
        <div className="text-[24px] font-bold leading-tight tracking-[-0.3px] text-ink">담당 게임을<br />선택하세요</div>
        <div className="mt-[14px] flex gap-2">
          <button
            onClick={view.openStatus}
            className="flex items-center gap-[7px] rounded-[20px] border-none bg-ink px-4 py-[10px] text-[14px] font-bold text-white active:bg-ink-soft"
          >
            📋 경기 현황판
          </button>
          <button
            onClick={view.openSchedule}
            className="flex items-center gap-[7px] rounded-[20px] border-none bg-brand-soft px-4 py-[10px] text-[14px] font-bold text-brand active:bg-brand-soft-dark"
          >
            🏅 진행 순서
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-3 px-5 py-[22px]">
        {view.managerGameCards.map((g) => (
          <button
            key={g.name}
            onClick={g.pick}
            className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface p-5 text-left active:bg-line"
          >
            <div>
              <div className="text-[17px] font-bold text-ink">{g.name}</div>
              <div className="mt-1 text-[13px] text-muted">{g.sub}</div>
            </div>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M9 5l7 7-7 7" stroke="#b0b8c1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
        {view.noGames && (
          <div className="py-10 text-center text-[15px] text-muted-4">
            아직 등록된 게임이 없어요.<br />관리자가 게임을 추가해 주세요.
          </div>
        )}
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 3: `src/pages/manager/ManagerMatchesPage.tsx`**

```tsx
import { PageShell } from '../../components/ui/PageShell';
import { BackButton } from '../../components/ui/BackButton';
import { TeamAvatar } from '../../components/ui/TeamAvatar';
import type { PageProps } from '../../types';

const BADGE_COLOR: Record<string, string> = { pending: '#8b95a1', live: '#e07800', done: '#03b26c' };
const BADGE_DOT: Record<string, string> = { pending: '#c4ccd6', live: '#fe9800', done: '#03b26c' };

export function ManagerMatchesPage({ view }: PageProps) {
  return (
    <PageShell>
      <div className="flex items-center gap-[6px] px-4 py-3">
        <BackButton onClick={view.backToManagerGames} />
        <div className="text-[18px] font-bold text-ink">{view.managerGameName}</div>
      </div>
      <div className="px-5 pb-3 pt-[6px] text-[14px] text-muted">진행할 대진을 선택하세요.</div>
      <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-1">
        {view.managerMatchCards.map((m, i) => (
          <button
            key={i}
            onClick={m.pick}
            className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-[18px] text-left active:bg-line"
          >
            <TeamAvatar color={m.aColor} initial={m.aInitial} size={32} />
            <span className="text-[16px] font-bold text-ink">{m.aName}</span>
            <span className="text-[13px] font-bold text-muted-4">vs</span>
            <TeamAvatar color={m.bColor} initial={m.bInitial} size={32} />
            <span className="text-[16px] font-bold text-ink">{m.bName}</span>
            <span className="ml-auto flex items-center gap-[5px]">
              <span className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: BADGE_DOT[m.badgeColor] }} />
              <span className="text-[13px] font-bold" style={{ color: BADGE_COLOR[m.badgeColor] }}>{m.badge}</span>
            </span>
          </button>
        ))}
        {view.managerMatchNoMatches && (
          <div className="py-10 text-center text-[15px] text-muted-4">
            이 게임은 순위 발표 후<br />대진이 확정돼요.
          </div>
        )}
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 4: `src/pages/manager/ManagerMatchPage.tsx`**

```tsx
import { PageShell } from '../../components/ui/PageShell';
import { BackButton } from '../../components/ui/BackButton';
import { TeamAvatar } from '../../components/ui/TeamAvatar';
import { ScoreStepper } from '../../components/ui/ScoreStepper';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { PrimaryButton } from '../../components/ui/Buttons';
import type { PageProps } from '../../types';

export function ManagerMatchPage({ view }: PageProps) {
  const d = view.mDetail;
  if (!d) return null;
  return (
    <PageShell>
      <div className="flex items-center gap-[6px] px-4 py-3">
        <BackButton onClick={view.backToManagerMatches} />
        <div className="text-[18px] font-bold text-ink">{d.gameName}</div>
        <span
          className={`ml-auto rounded-lg px-[9px] py-1 text-[12px] font-bold ${
            d.isIndoor ? 'bg-brand-soft text-brand' : 'bg-warn-soft text-warn-dark'
          }`}
        >
          {d.place}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto border-t border-line bg-surface px-4 pb-5 pt-[18px]">
        <div className="flex items-center justify-center gap-3 py-[6px] pb-5">
          <span className="text-[20px] font-extrabold text-ink">{d.aName}</span>
          <span className="text-[15px] font-bold text-muted-4">vs</span>
          <span className="text-[20px] font-extrabold text-ink">{d.bName}</span>
        </div>

        <div className="mb-3 rounded-2xl border border-line bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[14px] font-bold text-muted-2">경기 상태</span>
            <span className="text-[13px] font-bold text-ink">{d.statusLabel}</span>
          </div>
          <SegmentedControl options={d.statusOptions} />
        </div>

        <div className="rounded-2xl border border-line bg-white p-4">
          <div className="mb-3 text-[14px] font-bold text-muted-2">점수 입력</div>
          <div className="flex flex-col gap-[10px]">
            {d.rows.map((row) => (
              <div key={row.id} className="flex items-center gap-3">
                <TeamAvatar color={row.color} initial={row.initial} size={34} />
                <div className="flex-1 truncate text-[16px] font-semibold text-ink">{row.name}</div>
                <ScoreStepper value={row.score} onDec={row.dec} onInc={row.inc} onInput={row.onInput} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-line bg-white px-5 pb-6 pt-3">
        <PrimaryButton onClick={view.backToManagerMatches}>저장하고 대진 목록으로</PrimaryButton>
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 5: Manual QA**

```bash
npm run dev
```

- PIN `1234` → manager games list renders 6 game cards with correct names/places.
- Clicking a game card → match list shows correct team pairs and status badges (`g1` should show 3 "완료" matches).
- Clicking a match → detail page shows both teams, segmented status control (tap each of the 3 options and confirm the active one highlights), and score steppers (+/− change the number, matches reference logic of clamping at 0).
- "저장하고 대진 목록으로" returns to the match list.

- [ ] **Step 6: Commit**

```bash
git add src/pages/TeamPage.tsx src/pages/manager
git commit -m "feat: add team and manager flow pages"
```

---

### Task 8: Admin page (4 tabs)

**Files:**
- Create: `src/pages/admin/AdminPage.tsx`
- Create: `src/pages/admin/ScoresTab.tsx`
- Create: `src/pages/admin/TeamsTab.tsx`
- Create: `src/pages/admin/GamesTab.tsx`
- Create: `src/pages/admin/SettingsTab.tsx`

**Interfaces:**
- Consumes: `PageProps`, `ScoreboardView`, `TeamAvatar`, `ScoreStepper`, `DarkButton`, `SoftButton` from Tasks 2/4.
- Produces: `<AdminPage view={...} />`, wired in Task 12.
- Reference markup: section `<!-- ============ ADMIN ============ -->` (tabs + 4 tab bodies + bottom CTA).
- All five files live in `src/pages/admin/` — tabs import `../../components/...` and `../../types` (two levels up from `pages/admin/`); `AdminPage.tsx` imports the four tabs from the same folder (`./ScoresTab`, etc.).

- [ ] **Step 1: `src/pages/admin/ScoresTab.tsx`**

```tsx
import { TeamAvatar } from '../../components/ui/TeamAvatar';
import { ScoreStepper } from '../../components/ui/ScoreStepper';
import type { ScoreboardView } from '../../types';

export function ScoresTab({ view }: { view: ScoreboardView }) {
  return (
    <div className="p-4">
      <div className="flex gap-2 overflow-x-auto pb-[14px]">
        {view.adminGameChips.map((c) => (
          <button
            key={c.id}
            onClick={c.select}
            className={`flex-shrink-0 whitespace-nowrap rounded-[20px] border-none px-4 py-[9px] text-[14px] font-bold ${
              c.active ? 'bg-info text-white' : 'bg-line text-muted-2'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
      {view.noGames && (
        <div className="py-10 text-center text-[15px] text-muted-4">게임 탭에서 게임을 먼저 추가하세요.</div>
      )}
      <div className="flex flex-col gap-[10px]">
        {view.adminScoreRows.map((row) => (
          <div key={row.id} className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-[14px]">
            <TeamAvatar color={row.color} initial={row.initial} size={34} />
            <div className="flex-1 truncate text-[16px] font-semibold text-ink">{row.name}</div>
            <ScoreStepper value={row.score} onDec={row.dec} onInc={row.inc} onInput={row.onInput} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `src/pages/admin/TeamsTab.tsx`**

```tsx
import { SoftButton } from '../../components/ui/Buttons';
import type { ScoreboardView } from '../../types';

export function TeamsTab({ view }: { view: ScoreboardView }) {
  return (
    <div className="p-4">
      <div className="mb-3 text-[13px] leading-[1.6] text-muted">
        팀을 추가하면 <b className="text-muted-3">입장 코드</b>가 자동 발급돼요. 각 팀에게 코드를 알려주세요.
      </div>
      <div className="flex flex-col gap-[10px]">
        {view.adminTeamRows.map((row) => (
          <div key={row.id} className="flex items-center gap-3 rounded-2xl border border-line bg-white px-[14px] py-3">
            <div className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
            <input
              value={row.name}
              onChange={row.onName}
              className="min-w-0 flex-1 border-none bg-transparent py-[6px] text-[16px] font-semibold text-ink outline-none"
            />
            <span className="rounded-lg bg-brand-soft px-[9px] py-[5px] font-mono text-[14px] font-bold tracking-[1px] text-brand">
              {row.code}
            </span>
            <button onClick={row.remove} className="flex h-8 w-8 items-center justify-center border-none bg-transparent p-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="#b0b8c1" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <SoftButton onClick={view.addTeam} className="mt-3">+ 팀 추가</SoftButton>
    </div>
  );
}
```

- [ ] **Step 3: `src/pages/admin/GamesTab.tsx`**

```tsx
import { SoftButton } from '../../components/ui/Buttons';
import type { ScoreboardView } from '../../types';

export function GamesTab({ view }: { view: ScoreboardView }) {
  return (
    <div className="p-4">
      <div className="flex flex-col gap-[10px]">
        {view.adminGameRows.map((row) => (
          <div key={row.id} className="flex items-center gap-[10px] rounded-2xl border border-line bg-white px-[14px] py-3">
            <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[9px] bg-line text-[14px] font-bold text-muted-2">
              {row.num}
            </div>
            <input
              value={row.name}
              onChange={row.onName}
              className="min-w-0 flex-1 border-none bg-transparent py-[6px] text-[16px] font-semibold text-ink outline-none"
            />
            <button onClick={row.remove} className="flex h-8 w-8 items-center justify-center border-none bg-transparent p-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="#b0b8c1" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <SoftButton onClick={view.addGame} className="mt-3">+ 게임 추가</SoftButton>
    </div>
  );
}
```

- [ ] **Step 4: `src/pages/admin/SettingsTab.tsx`**

```tsx
import type { ScoreboardView } from '../../types';

export function SettingsTab({ view }: { view: ScoreboardView }) {
  return (
    <div className="p-4">
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <button
          onClick={view.resetScores}
          className="w-full border-none border-b border-line bg-transparent p-0 px-4 py-[18px] text-left active:bg-surface"
        >
          <div className="text-[16px] font-semibold text-ink">점수 초기화</div>
          <div className="mt-[3px] text-[13px] text-muted">모든 점수를 0으로 되돌려요. 팀·게임은 유지돼요.</div>
        </button>
        <button
          onClick={view.resetAll}
          className="w-full border-none bg-transparent p-0 px-4 py-[18px] text-left active:bg-surface"
        >
          <div className="text-[16px] font-semibold text-danger">대회 리셋</div>
          <div className="mt-[3px] text-[13px] text-muted">팀·게임·점수를 모두 삭제하고 처음부터 시작해요.</div>
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: `src/pages/admin/AdminPage.tsx`**

```tsx
import { DarkButton } from '../../components/ui/Buttons';
import { ScoresTab } from './ScoresTab';
import { TeamsTab } from './TeamsTab';
import { GamesTab } from './GamesTab';
import { SettingsTab } from './SettingsTab';
import type { PageProps } from '../../types';

export function AdminPage({ view }: PageProps) {
  return (
    <div className="flex flex-1 animate-screen-in flex-col">
      <div className="flex items-center justify-between px-5 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-ink px-[11px] py-[5px] text-[13px] font-bold text-white">관리자</div>
          <div className="text-[18px] font-bold text-ink">대시보드</div>
        </div>
        <div className="flex items-center gap-[14px]">
          <button onClick={view.openStatus} className="cursor-pointer border-none bg-transparent text-[14px] font-bold text-ink">현황</button>
          <button onClick={view.openSchedule} className="cursor-pointer border-none bg-transparent text-[14px] font-bold text-brand">순서</button>
          <button onClick={view.logout} className="cursor-pointer border-none bg-transparent text-[14px] font-semibold text-muted">나가기</button>
        </div>
      </div>

      <div className="flex gap-1 px-4 pb-1">
        {view.adminTabs.map((t) => (
          <button
            key={t.id}
            onClick={t.select}
            className={`flex-1 rounded-[11px] border-none py-[11px] text-[15px] font-bold ${
              t.active ? 'bg-ink text-white' : 'bg-line text-muted'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto border-t border-line bg-surface">
        {view.adminIsScores && <ScoresTab view={view} />}
        {view.adminIsTeams && <TeamsTab view={view} />}
        {view.adminIsGames && <GamesTab view={view} />}
        {view.adminIsSettings && <SettingsTab view={view} />}
      </div>

      <div className="border-t border-line bg-white px-5 pb-6 pt-3">
        <DarkButton onClick={view.toResults}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M7 4h10v4a5 5 0 01-10 0V4z" stroke="#ffd158" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M17 5h2.5a2 2 0 01-2.5 3M7 5H4.5a2 2 0 002.5 3M10 13h4v3h-4z" stroke="#ffd158" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M8 20h8" stroke="#ffd158" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          결과 발표하기
        </DarkButton>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Manual QA**

```bash
npm run dev
```

- PIN `9999` → admin dashboard, "점수" tab active by default, game chips scroll horizontally, score steppers work.
- "팀" tab: renaming a team updates its avatar label live; "+ 팀 추가" appends a new team with a freshly generated 4-char code; the ✕ button removes a team.
- "게임" tab: same for games; deleting a game also removes its column from the "점수" tab.
- "설정" tab: "점수 초기화" and "대회 리셋" show `window.confirm` dialogs (Playwright: use `page.on('dialog', d => d.accept())`).
- "결과 발표하기" navigates to Results (verified fully in Task 9).

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin
git commit -m "feat: add admin dashboard with scores/teams/games/settings tabs"
```

---

### Task 9: Results page

**Files:**
- Create: `src/pages/ResultsPage.tsx`

**Interfaces:**
- Consumes: `PageProps`, `BackButton`, `TeamAvatar` from Tasks 2/4.
- Produces: `<ResultsPage view={...} />`, wired in Task 12.
- Reference markup: section `<!-- ============ RESULTS ============ -->`.

- [ ] **Step 1: `src/pages/ResultsPage.tsx`**

```tsx
import { BackButton } from '../components/ui/BackButton';
import { TeamAvatar } from '../components/ui/TeamAvatar';
import type { PageProps } from '../types';

export function ResultsPage({ view }: PageProps) {
  const { podium } = view;
  return (
    <div className="flex flex-1 animate-screen-in flex-col bg-ink">
      <div className="flex items-center justify-between px-5 py-4">
        <BackButton onClick={view.backToAdmin} stroke="#8b95a1" />
        <div className="text-[15px] font-semibold text-muted">최종 결과</div>
        <div className="w-10" />
      </div>

      <div className="px-5 pb-[26px] pt-3 text-center">
        <div className="text-[26px] font-extrabold tracking-[-0.4px] text-white">🏆 우승 팀은?</div>
        {view.hasWinner && (
          <div className="mt-2 text-[15px] text-muted">
            축하합니다, <b className="text-gold">{view.winnerName}</b>!
          </div>
        )}
      </div>

      <div className="flex items-end justify-center gap-[10px] px-5">
        {podium.second && (
          <div className="flex max-w-[110px] flex-1 flex-col items-center">
            <TeamAvatar color={podium.second.color} initial={podium.second.initial} size={48} />
            <div className="mb-[2px] mt-2 text-center text-[14px] font-bold text-white">{podium.second.name}</div>
            <div className="mb-2 text-[13px] font-bold text-silver">{podium.second.total}점</div>
            <div className="flex h-[96px] w-full items-center justify-center rounded-t-[14px]" style={{ background: 'linear-gradient(180deg,#4e5968,#333d4b)' }}>
              <span className="text-[30px] font-extrabold text-silver">2</span>
            </div>
          </div>
        )}
        {podium.first && (
          <div className="flex max-w-[120px] flex-1 flex-col items-center">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="mb-1">
              <path d="M3 7l4 4 5-7 5 7 4-4-2 12H5L3 7z" fill="#ffd158" />
            </svg>
            <TeamAvatar color={podium.first.color} initial={podium.first.initial} size={54} ring />
            <div className="mb-[2px] mt-2 text-center text-[15px] font-extrabold text-white">{podium.first.name}</div>
            <div className="mb-2 text-[14px] font-extrabold text-gold">{podium.first.total}점</div>
            <div className="flex h-[140px] w-full animate-pop items-center justify-center rounded-t-[14px]" style={{ background: 'linear-gradient(180deg,#ffd158,#ffb331)' }}>
              <span className="text-[38px] font-extrabold text-white">1</span>
            </div>
          </div>
        )}
        {podium.third && (
          <div className="flex max-w-[110px] flex-1 flex-col items-center">
            <TeamAvatar color={podium.third.color} initial={podium.third.initial} size={44} />
            <div className="mb-[2px] mt-2 text-center text-[14px] font-bold text-white">{podium.third.name}</div>
            <div className="mb-2 text-[13px] font-bold text-bronze">{podium.third.total}점</div>
            <div className="flex h-[72px] w-full items-center justify-center rounded-t-[14px]" style={{ background: 'linear-gradient(180deg,#a4703c,#7a5228)' }}>
              <span className="text-[26px] font-extrabold text-bronze-light">3</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-[18px] flex-1 rounded-t-[24px] bg-panel-dark px-5 py-[22px]">
        <div className="mb-2 text-[14px] font-bold text-muted">전체 순위</div>
        <div className="flex flex-col">
          {view.rankedList.map((r) => (
            <div key={r.id} className="flex items-center gap-[14px] border-b border-panel-divider py-[15px]">
              <span className="w-6 text-center text-[17px] font-extrabold" style={{ color: r.rankColor, fontVariantNumeric: 'tabular-nums' }}>
                {r.rank}
              </span>
              <TeamAvatar color={r.color} initial={r.initial} size={30} />
              <span className="flex-1 text-[16px] font-semibold text-line">{r.name}</span>
              <span className="text-[17px] font-extrabold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{r.total}점</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Manual QA**

```bash
npm run dev
```

- From admin, click "결과 발표하기". Verify podium shows top 3 teams in correct 2nd/1st/3rd left-to-right order, gold ring on 1st place avatar, correct point totals, full ranked list below with correct tie-handling (two teams tied for 1st both show rank "1").
- Back-chevron returns to admin dashboard.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ResultsPage.tsx
git commit -m "feat: add results page with podium and full ranking"
```

---

### Task 10: Item shop flow (Shop, Roulette, Swap, Standings)

**Files:**
- Create: `src/pages/shop/ShopPage.tsx`
- Create: `src/pages/shop/RoulettePage.tsx`
- Create: `src/pages/shop/SwapPage.tsx`
- Create: `src/pages/shop/StandingsPage.tsx`

**Interfaces:**
- Consumes: `PageProps`, `BackButton`, `TeamAvatar` from Tasks 2/4.
- Produces: 4 page components, wired in Task 12.
- Reference markup: sections `<!-- ============ ITEM SHOP ============ -->`, `<!-- ============ ROULETTE ============ -->`, `<!-- ============ SWAP ============ -->`, `<!-- ============ STANDINGS (peek) ============ -->`.
- All four files live in `src/pages/shop/`, so imports are `../../components/...` and `../../types` (two levels up from `pages/shop/`).

- [ ] **Step 1: `src/pages/shop/ShopPage.tsx`**

```tsx
import { PageShell } from '../../components/ui/PageShell';
import { BackButton } from '../../components/ui/BackButton';
import type { PageProps } from '../../types';

export function ShopPage({ view }: PageProps) {
  return (
    <PageShell>
      <div className="flex items-center gap-[6px] px-4 py-3">
        <BackButton onClick={view.backFromShop} />
        <div className="whitespace-nowrap text-[18px] font-bold text-ink">🎁 아이템 상점</div>
      </div>

      <div className="mx-5 mb-[6px] mt-1 flex items-center justify-between rounded-[18px] px-5 py-[18px]" style={{ background: 'linear-gradient(135deg,#191f28,#333d4b)' }}>
        <div>
          <div className="text-[13px] font-semibold text-muted-4">{view.shopTeamName} 보유 포인트</div>
          <div className="mt-[2px] flex items-baseline gap-1">
            <span className="text-[34px] font-extrabold text-gold" style={{ fontVariantNumeric: 'tabular-nums' }}>{view.myItemPoints}</span>
            <span className="text-[18px] font-bold text-gold">P</span>
          </div>
        </div>
        <div className="text-[40px]">🪙</div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 pb-6 pt-3">
        {view.shopItems.map((it) => (
          <button
            key={it.id}
            onClick={it.action}
            style={{ opacity: it.cardOpacity }}
            className="flex w-full items-center gap-[14px] rounded-[18px] border border-line bg-white p-[18px] text-left active:bg-surface"
          >
            <div className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-2xl text-[26px]" style={{ backgroundColor: it.bg }}>
              {it.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[17px] font-bold text-ink">{it.name}</div>
              <div className="mt-[3px] text-[13px] leading-[1.4] text-muted">{it.desc}</div>
            </div>
            <span className="flex-shrink-0 rounded-xl px-3 py-2 text-[15px] font-extrabold" style={{ color: it.accent, backgroundColor: it.bg }}>
              {it.costLabel}
            </span>
          </button>
        ))}
        <div className="mt-[6px] text-center text-[13px] leading-[1.6] text-muted-4">아이템으로 얻은 점수는 우리 팀 총점에 바로 반영돼요</div>
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 2: `src/pages/shop/RoulettePage.tsx`**

```tsx
import { BackButton } from '../../components/ui/BackButton';
import type { PageProps } from '../../types';

export function RoulettePage({ view }: PageProps) {
  return (
    <div className="flex flex-1 animate-screen-in flex-col" style={{ background: 'linear-gradient(180deg,#1b1030,#2a1a4a)' }}>
      <div className="flex items-center gap-[6px] px-4 py-3">
        <BackButton onClick={view.backToShop} stroke="#d9c9ff" />
        <div className="whitespace-nowrap text-[18px] font-bold text-white">🎰 행운의 룰렛</div>
        <span className="ml-auto rounded-[20px] bg-gold px-[11px] py-[5px] text-[13px] font-extrabold text-ink">
          {view.myItemPoints}P
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-5">
        <div className="mb-5 text-center text-[15px] font-semibold text-roulette-lilac">
          한 번에 10P · 나오는 만큼 점수가 오르내려요
        </div>

        <div className="relative h-[104px] w-full max-w-[340px]">
          <div
            className="absolute -top-[9px] left-1/2 z-[3] -translate-x-1/2"
            style={{ width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: '12px solid #ffd158' }}
          />
          <div className="absolute inset-0 overflow-hidden rounded-[18px] bg-roulette-reel shadow-[inset_0_0_0_2px_rgba(255,255,255,.08)]">
            <div style={view.reelStripStyle}>
              {view.rouletteCells.map((c, i) => (
                <div key={i} className="flex h-[104px] w-[84px] flex-shrink-0 items-center justify-center border-r border-white/5">
                  <div
                    className={`flex h-[78px] w-16 items-center justify-center rounded-[14px] ${
                      c.positive ? 'bg-brand-soft text-brand' : 'bg-danger-soft text-danger'
                    }`}
                  >
                    <span className="text-[22px] font-extrabold">{c.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div
            className="pointer-events-none absolute left-1/2 top-0 z-[2] h-[104px] w-20 -translate-x-1/2 rounded-[14px]"
            style={{ boxShadow: '0 0 0 3px #ffd158, 0 0 22px rgba(255,209,88,.5)' }}
          />
        </div>

        {view.rouletteDone && (
          <div className="mt-[26px] animate-pop text-center">
            <div className="text-[14px] font-semibold text-roulette-lilac">결과</div>
            <div className={`text-[44px] font-extrabold tracking-[-1px] ${view.rResultPositive ? 'text-brand' : 'text-danger'}`}>
              {view.rResultLabel}
            </div>
          </div>
        )}
        {view.rouletteIdle && (
          <div className="mt-[26px] flex h-[70px] items-center text-[15px] font-semibold text-roulette-muted">
            버튼을 눌러 돌려보세요
          </div>
        )}
        {view.rouletteSpinning && (
          <div className="mt-[26px] flex h-[70px] items-center text-[16px] font-bold text-gold">두구두구…</div>
        )}
      </div>

      <div className="flex flex-col gap-[10px] px-5 pb-7 pt-3">
        {view.rouletteDone && (
          <>
            <button
              onClick={view.spinRoulette}
              style={{ opacity: view.canSpinAgain ? 1 : 0.5 }}
              className="w-full rounded-[14px] border-none bg-gold py-[17px] text-[17px] font-extrabold text-ink active:bg-gold-dark"
            >
              한 번 더 돌리기 (10P)
            </button>
            <button onClick={view.backToShop} className="w-full rounded-[14px] border-none bg-white/10 py-[15px] text-[15px] font-bold text-white">
              상점으로 돌아가기
            </button>
          </>
        )}
        {view.rouletteIdle && (
          <button
            onClick={view.spinRoulette}
            className="w-full rounded-[14px] border-none bg-gold py-[18px] text-[18px] font-extrabold text-ink active:bg-gold-dark"
          >
            돌리기 🎰 (10P)
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: `src/pages/shop/SwapPage.tsx`**

```tsx
import { PageShell } from '../../components/ui/PageShell';
import { BackButton } from '../../components/ui/BackButton';
import { TeamAvatar } from '../../components/ui/TeamAvatar';
import type { PageProps } from '../../types';

export function SwapPage({ view }: PageProps) {
  return (
    <PageShell>
      <div className="flex items-center gap-[6px] px-4 py-3">
        <BackButton onClick={view.backFromSwap} />
        <div className="text-[18px] font-bold text-ink">🔄 점수 바꾸기</div>
      </div>
      <div className="px-5 pb-4 pt-[6px] text-[14px] leading-[1.6] text-muted">
        총점을 바꿀 팀을 고르세요. <b className="text-danger">100P</b>가 소모되고, 두 팀의 총점이 통째로 교환돼요.
      </div>
      <div className="flex flex-1 flex-col gap-[10px] overflow-y-auto border-t border-line bg-surface px-4 pb-6 pt-4">
        {view.swapTargets.map((t) => (
          <button
            key={t.id}
            onClick={t.pick}
            className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white p-4 text-left active:bg-line"
          >
            <TeamAvatar color={t.color} initial={t.initial} size={36} />
            <span className="flex-1 text-[16px] font-bold text-ink">{t.name}</span>
            <span className="text-[16px] font-extrabold text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>{t.total}점</span>
          </button>
        ))}
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 4: `src/pages/shop/StandingsPage.tsx`**

```tsx
import { PageShell } from '../../components/ui/PageShell';
import { BackButton } from '../../components/ui/BackButton';
import { TeamAvatar } from '../../components/ui/TeamAvatar';
import type { PageProps } from '../../types';

export function StandingsPage({ view }: PageProps) {
  return (
    <PageShell>
      <div className="flex items-center gap-[6px] px-4 py-3">
        <BackButton onClick={view.backFromStandings} />
        <div className="text-[18px] font-bold text-ink">👀 전체 현황</div>
      </div>
      <div className="px-5 pb-[14px] pt-[6px] text-[14px] text-muted">지금 이 순간의 전체 순위예요.</div>
      <div className="flex-1 overflow-y-auto border-t border-line bg-surface px-4 pb-6 pt-[14px]">
        <div className="flex flex-col gap-2">
          {view.rankedList.map((r) => (
            <div key={r.id} className="flex items-center gap-[14px] rounded-2xl border border-line bg-white px-4 py-[15px]">
              <span className="w-[22px] text-center text-[17px] font-extrabold" style={{ color: r.rankColor, fontVariantNumeric: 'tabular-nums' }}>
                {r.rank}
              </span>
              <TeamAvatar color={r.color} initial={r.initial} size={32} />
              <span className="flex-1 text-[16px] font-bold text-ink">{r.name}</span>
              <span className="text-[17px] font-extrabold text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>{r.total}점</span>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 5: Manual QA**

```bash
npm run dev
```

- From team page, open 🎁 상점. Verify point balance card, all 4 items with correct costs (20P/10P/50P/100P) and opacity dimming when unaffordable.
- "점수 +10" (20P): balance drops by 20, team total breakdown gains a "🎁 아이템 보너스" row, toast shows.
- "행운의 룰렛" (10P): navigates to roulette; click "돌리기" — reel animates ~3.3s then shows a result matching one of `[10,-10,20,-20,30,-30]`; "한 번 더 돌리기" re-spins; "상점으로 돌아가기" returns.
- "전체 현황 보기" (50P): shows standings ranked list; back returns to shop.
- "점수 바꾸기" (100P, needs ≥100P — may need to spin/buy up first in manual testing, or temporarily seed higher itemPoints for QA only, then revert): pick a team, confirm dialog, verify totals swap.

- [ ] **Step 6: Commit**

```bash
git add src/pages/shop
git commit -m "feat: add item shop, roulette, swap, and standings pages"
```

---

### Task 11: Status board + Schedule pages

**Files:**
- Create: `src/pages/StatusPage.tsx`
- Create: `src/pages/SchedulePage.tsx`

**Interfaces:**
- Consumes: `PageProps`, `BackButton`, `TeamAvatar`, `SegmentedControl` from Tasks 2/4.
- Produces: 2 page components, wired in Task 12.
- Reference markup: sections `<!-- ============ STATUS BOARD ============ -->`, `<!-- ============ SCHEDULE ============ -->`.
- Both files sit directly in `src/pages/` (not a subfolder — each is a standalone destination reachable from multiple flows, not a linear multi-step flow like `manager/` or `shop/`), so imports are `../components/...` and `../types`.

- [ ] **Step 1: `src/pages/StatusPage.tsx`**

```tsx
import { PageShell } from '../components/ui/PageShell';
import { BackButton } from '../components/ui/BackButton';
import { TeamAvatar } from '../components/ui/TeamAvatar';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import type { PageProps } from '../types';

const SUMMARY_COLOR: Record<string, string> = { pending: '#8b95a1', live: '#e07800', done: '#03b26c' };
const BADGE_COLOR: Record<string, string> = { pending: '#8b95a1', live: '#e07800', done: '#03b26c' };
const BADGE_DOT: Record<string, string> = { pending: '#c4ccd6', live: '#fe9800', done: '#03b26c' };

export function StatusPage({ view }: PageProps) {
  return (
    <PageShell>
      <div className="flex items-center gap-[6px] px-4 py-3">
        <BackButton onClick={view.backFromStatus} />
        <div className="text-[18px] font-bold text-ink">📋 경기 현황판</div>
      </div>
      <div className="flex gap-2 px-5 pb-3">
        {view.statusSummary.map((c) => (
          <div key={c.label} className="flex-1 rounded-[14px] border border-line bg-surface p-3 text-center">
            <div className="text-[22px] font-extrabold" style={{ color: SUMMARY_COLOR[c.color], fontVariantNumeric: 'tabular-nums' }}>{c.n}</div>
            <div className="mt-[2px] text-[12px] font-semibold text-muted">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto border-t border-line bg-surface p-4">
        <div className="flex flex-col gap-3">
          {view.statusGames.map((g) => (
            <div key={g.time} className="rounded-2xl border border-line bg-white p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[13px] font-extrabold text-brand">{g.time}</span>
                <span className={`rounded-lg px-[9px] py-1 text-[12px] font-bold ${g.isIndoor ? 'bg-brand-soft text-brand' : 'bg-warn-soft text-warn-dark'}`}>
                  {g.place}
                </span>
              </div>
              <div className="mb-[14px] text-[17px] font-bold text-ink">{g.name}</div>

              {g.pending && <div className="py-[6px] text-[14px] font-semibold text-muted">순위 발표 후 대진 확정</div>}

              <div className="flex flex-col gap-4">
                {g.matches.map((m) => (
                  <div key={m.key}>
                    <div className="mb-[9px] flex items-center gap-2">
                      <TeamAvatar color={m.aColor} initial={m.aInitial} size={24} />
                      <span className="text-[15px] font-bold text-ink">{m.aName}</span>
                      <span className="text-[13px] font-bold text-muted-4">vs</span>
                      <TeamAvatar color={m.bColor} initial={m.bInitial} size={24} />
                      <span className="text-[15px] font-bold text-ink">{m.bName}</span>
                      <span className="ml-auto flex items-center gap-[5px]">
                        <span className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: BADGE_DOT[m.badgeColor] }} />
                        <span className="text-[13px] font-bold" style={{ color: BADGE_COLOR[m.badgeColor] }}>{m.badge}</span>
                      </span>
                    </div>
                    <SegmentedControl options={m.options} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-[18px] text-center text-[13px] leading-[1.6] text-muted-4">
          담당자가 상태를 바꾸면<br />모두에게 같은 현황이 보여요
        </div>
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 2: `src/pages/SchedulePage.tsx`**

```tsx
import { PageShell } from '../components/ui/PageShell';
import { BackButton } from '../components/ui/BackButton';
import { TeamAvatar } from '../components/ui/TeamAvatar';
import type { PageProps } from '../types';

export function SchedulePage({ view }: PageProps) {
  return (
    <PageShell>
      <div className="flex items-center gap-[6px] px-4 py-3">
        <BackButton onClick={view.backFromSchedule} />
        <div className="text-[18px] font-bold text-ink">🏅 게임 진행 순서</div>
      </div>

      <div className="flex-1 overflow-y-auto border-t border-line bg-surface px-4 pb-6 pt-[18px]">
        {view.scheduleIsTeam && (
          <>
            <div className="mb-[14px] text-[14px] text-muted">
              <b className="text-brand">{view.scheduleTeamName}</b> 대진표예요. 매 타임 시작 전 장소로 이동하세요.
            </div>
            <div className="flex flex-col gap-[10px]">
              {view.teamScheduleRows.map((r) => (
                <div key={r.time} className="rounded-2xl border border-line bg-white p-4">
                  <div className="mb-[10px] flex items-center justify-between">
                    <span className="text-[13px] font-extrabold text-brand">{r.time}</span>
                    <span className={`rounded-lg px-[9px] py-1 text-[12px] font-bold ${r.isIndoor ? 'bg-brand-soft text-brand' : 'bg-warn-soft text-warn-dark'}`}>
                      {r.place}
                    </span>
                  </div>
                  <div className="mb-3 text-[17px] font-bold text-ink">{r.name}</div>
                  <div className="flex items-center gap-[10px] border-t border-line pt-3">
                    <span className="text-[13px] font-semibold text-muted">상대</span>
                    <TeamAvatar color={r.oppColor} initial={r.oppInitial} size={26} />
                    <span className={`text-[16px] font-bold ${r.hasOpponent ? 'text-ink' : 'text-muted'}`}>{r.oppName}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {view.scheduleIsMaster && (
          <>
            <div className="mb-[14px] text-[14px] text-muted">전체 대진표예요. 타임 순서대로 진행하세요.</div>
            <div className="flex flex-col gap-[10px]">
              {view.masterScheduleRows.map((r) => (
                <div key={r.time} className="rounded-2xl border border-line bg-white p-4">
                  <div className="mb-[10px] flex items-center justify-between">
                    <span className="text-[13px] font-extrabold text-brand">{r.time}</span>
                    <span className={`rounded-lg px-[9px] py-1 text-[12px] font-bold ${r.isIndoor ? 'bg-brand-soft text-brand' : 'bg-warn-soft text-warn-dark'}`}>
                      {r.place}
                    </span>
                  </div>
                  <div className="mb-3 text-[17px] font-bold text-ink">{r.name}</div>
                  <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                    {r.pairs.map((p, i) => (
                      <span key={i} className="rounded-[9px] bg-line px-[11px] py-[6px] text-[14px] font-bold text-muted-3">
                        {p.a} <span className="text-muted-4">vs</span> {p.b}
                      </span>
                    ))}
                    {r.pending && <span className="text-[14px] font-semibold text-muted">순위 발표 후 결정</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-4 rounded-2xl border border-line bg-white p-4">
          <div className="mb-[10px] text-[13px] font-extrabold text-muted-2">안내사항</div>
          <div className="flex flex-col gap-[9px]">
            <div className="text-[13px] leading-[1.6] text-muted-2">
              · 실내(강당) 종목은 <b className="text-muted-3">타임 1~4</b>, 야외(운동장) 종목은 <b className="text-muted-3">타임 5~6</b>입니다.
            </div>
            <div className="text-[13px] leading-[1.6] text-muted-2">
              · 각 게임 <b className="text-brand">승리 10점 · 패배 5점</b>, 6개 게임 누적으로 최종 순위가 결정돼요.
            </div>
            <div className="text-[13px] leading-[1.6] text-muted-2">
              · 타임 6(줄다리기) 상대는 타임 1~5 누적 순위 발표 후 진행자가 현장에서 정합니다.
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 3: Manual QA**

```bash
npm run dev
```

- As a logged-in team, open 🏅 진행 순서: verify 6 rows, each with correct opponent per the reference `MATCHUPS` table (team 1's row 1 opponent should be team 6).
- As manager/admin (no `myTeamId`), open 진행 순서: verify it shows the master schedule (all pairs per time slot) instead.
- Manager → 📋 경기 현황판: verify summary counts (3 완료, 1 진행, rest 진행전 initially) and that tapping a segmented option updates a match's status live.

- [ ] **Step 4: Commit**

```bash
git add src/pages/StatusPage.tsx src/pages/SchedulePage.tsx
git commit -m "feat: add status board and schedule pages"
```

---

### Task 12: App integration + full QA pass

**Files:**
- Modify: `src/App.tsx`
- `index.html` (already updated with Pretendard font link + title during initial setup)
- Create: `src/App.test.tsx` (smoke test)

**Interfaces:**
- Consumes: `useScoreboard` (Task 5), all 14 page components (Tasks 6–11), `Toast` (Task 4).
- Produces: the complete running app.

- [ ] **Step 1: Write `src/App.tsx`**

```tsx
import { useScoreboard } from './hooks/useScoreboard';
import { Toast } from './components/ui/Toast';
import { LoginPage } from './pages/LoginPage';
import { StaffPinPage } from './pages/StaffPinPage';
import { TeamPage } from './pages/TeamPage';
import { ManagerGamesPage } from './pages/manager/ManagerGamesPage';
import { ManagerMatchesPage } from './pages/manager/ManagerMatchesPage';
import { ManagerMatchPage } from './pages/manager/ManagerMatchPage';
import { AdminPage } from './pages/admin/AdminPage';
import { ResultsPage } from './pages/ResultsPage';
import { ShopPage } from './pages/shop/ShopPage';
import { RoulettePage } from './pages/shop/RoulettePage';
import { SwapPage } from './pages/shop/SwapPage';
import { StandingsPage } from './pages/shop/StandingsPage';
import { StatusPage } from './pages/StatusPage';
import { SchedulePage } from './pages/SchedulePage';
import type { ScoreboardView } from './types';

function renderPage(view: ScoreboardView) {
  switch (view.screen) {
    case 'login': return <LoginPage view={view} />;
    case 'staffPin': return <StaffPinPage view={view} />;
    case 'team': return <TeamPage view={view} />;
    case 'managerGames': return <ManagerGamesPage view={view} />;
    case 'managerMatches': return <ManagerMatchesPage view={view} />;
    case 'managerMatch': return <ManagerMatchPage view={view} />;
    case 'admin': return <AdminPage view={view} />;
    case 'results': return <ResultsPage view={view} />;
    case 'shop': return <ShopPage view={view} />;
    case 'roulette': return <RoulettePage view={view} />;
    case 'swap': return <SwapPage view={view} />;
    case 'standings': return <StandingsPage view={view} />;
    case 'status': return <StatusPage view={view} />;
    case 'schedule': return <SchedulePage view={view} />;
    default: return null;
  }
}

export default function App() {
  const { view } = useScoreboard();
  return (
    <div className="flex min-h-screen items-stretch justify-center bg-app">
      <div className="relative flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden bg-white">
        {renderPage(view)}
        <Toast message={view.toast} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write a smoke test**

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @vitejs/plugin-react
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', globals: true },
});
```

Create `src/App.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the login page by default', () => {
    render(<App />);
    expect(screen.getByText('입장하기')).toBeInTheDocument();
  });

  it('logs a team in with a valid code and shows the team page', () => {
    render(<App />);
    const input = screen.getByPlaceholderText('예: K7QX');
    fireEvent.change(input, { target: { value: 'K7QX' } });
    fireEvent.click(screen.getByText('입장하기'));
    expect(screen.getByText('우리 팀 점수')).toBeInTheDocument();
  });

  it('shows an error for an invalid team code', () => {
    render(<App />);
    const input = screen.getByPlaceholderText('예: K7QX');
    fireEvent.change(input, { target: { value: 'ZZZZ' } });
    fireEvent.click(screen.getByText('입장하기'));
    expect(screen.getByText('없는 코드예요. 다시 확인해 주세요.')).toBeInTheDocument();
  });

  it('logs into the admin dashboard with PIN 9999', () => {
    render(<App />);
    fireEvent.click(screen.getByText('담당자 · 관리자 로그인 →'));
    const pinInput = screen.getByPlaceholderText('••••');
    fireEvent.change(pinInput, { target: { value: '9999' } });
    fireEvent.click(screen.getByText('로그인'));
    expect(screen.getByText('대시보드')).toBeInTheDocument();
  });
});
```

Run: `npx vitest run src/App.test.tsx`
Expected: all 4 tests PASS.

- [ ] **Step 3: Full visual QA against the reference design**

```bash
npm run dev -- --port 5174
```

Using Playwright (already installed at `/private/tmp/.../scratchpad/node_modules` from earlier verification — reinstall locally if needed with `npm install -D playwright && npx playwright install chromium`), script a walkthrough screenshotting each of the 14 pages and visually diff against the earlier-verified reference screenshots (`login.png`, `admin.png`) plus fresh manual comparison against `design-reference/레크레이션 점수판.dc.html` opened via `python3 -m http.server` in that folder. Confirm for each page: identical copy, identical color usage, identical spacing (no obviously-off paddings), and that every interactive element (buttons, inputs, steppers, segmented controls) produces the same state transition as the reference.

- [ ] **Step 4: Run full test suite + typecheck + build**

```bash
npm test
npx tsc --noEmit
npm run build
```

Expected: all pass, `npm run build` produces `dist/` with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/App.test.tsx vitest.config.ts package.json package-lock.json
git commit -m "feat: wire up full scoreboard app and add integration smoke tests"
```

---

## Self-review notes

- **Spec coverage:** all 14 pages (login, staffPin, team, managerGames, managerMatches, managerMatch, admin×4 tabs, results, shop, roulette, swap, standings, status, schedule) + toast are covered across Tasks 6–11; every state field, action method, and derived view field from the reference's `renderVals()` has a corresponding `ScoreboardView` field (Task 2) and hook implementation (Task 5).
- **Business rules verified present:** PIN `1234`/`9999` (Task 5 `submitPin`), item costs 20/10/50/100P (Task 5 `shopDefs`), roulette pool `[10,-10,20,-20,30,-30]` (Task 1), 6×6 matchup table incl. the `t+1 < opp` de-dup rule (Task 1 `buildMatches`, unit-tested against the reference's seeded `matchStatus` keys), competition-style tied ranking (Task 1 `ranked`, unit-tested).
- **No placeholders:** every task step contains complete, compilable code; per-page tasks cite the exact reference section header to diff against instead of leaving TODOs.
- **Folder structure check:** `components/ui/` contains only components with zero `ScoreboardView` knowledge (verified: `PageShell`, `TeamAvatar`, `BackButton`, `Buttons`, `ScoreStepper`, `SegmentedControl`, `Toast` all take primitive/generic props, never `view`); `pages/` contains exactly one file per `Screen` union member (14 pages) plus 4 admin tab sub-components and the loose `admin/`, `manager/`, `shop/` groupings match how the reference itself groups related screens (a linear drill-down or a hub-and-spoke shop flow); `types/` is split so a reader asking "what does state look like" never has to scroll past 200 lines of view-model plumbing to find it, and vice versa.
