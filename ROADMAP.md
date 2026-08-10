# 로드맵 (커밋 단위 계획)

이 문서는 `docs/superpowers/plans/2026-08-10-recreation-scoreboard-react-port.md`의 12개 Task를 **커밋 단위**로 쪼갠 실행 로드맵이다. 각 항목은 정확히 하나의 커밋에 대응한다.

- 상태 표시: `⬜ 대기` → `🟨 진행중` → `✅ 완료`
- 작업 순서: 이 문서의 위에서 아래 순서를 따른다 (뒤 커밋은 앞 커밋에 의존).
- 각 커밋이 완료되면 이 로드맵의 상태를 즉시 갱신한 뒤 다음 커밋으로 넘어간다 (`CLAUDE.md` 작업 프로세스 참고).

## 진행 상황

| #   | 상태    | 커밋 메시지                                                          | 핵심 파일                                                                                                                                     |
| --- | ------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | ⬜ 대기 | `chore: initialize repo with vite scaffold, plan doc, and CLAUDE.md` | (전체 초기 스캐폴드), `CLAUDE.md`, `ROADMAP.md`, `docs/**`                                                                                    |
| 1   | ⬜ 대기 | `feat: add pure scoring/matchup logic with unit tests`               | `src/lib/scoring.ts`, `src/lib/scoring.test.ts`, `package.json`                                                                               |
| 2   | ⬜ 대기 | `feat: add scoreboard state/view types and initial state`            | `src/types/state.ts`, `src/types/view.ts`, `src/types/index.ts`, `src/data/initialState.ts`                                                   |
| 3   | ⬜ 대기 | `feat: add Tailwind design tokens and dc.html conversion guide`      | `src/index.css`, `design-reference/CONVERSION_GUIDE.md`                                                                                       |
| 4   | ⬜ 대기 | `feat: add shared scoreboard UI primitives`                          | `src/components/ui/PageShell.tsx`, `TeamAvatar.tsx`, `BackButton.tsx`, `Buttons.tsx`, `ScoreStepper.tsx`, `SegmentedControl.tsx`, `Toast.tsx` |
| 5   | ⬜ 대기 | `feat: port scoreboard state machine to a React hook`                | `src/hooks/useScoreboard.ts`                                                                                                                  |
| 6   | ⬜ 대기 | `feat: add login and staff PIN pages`                                | `src/pages/LoginPage.tsx`, `src/pages/StaffPinPage.tsx`                                                                                       |
| 7   | ⬜ 대기 | `feat: add team and manager flow pages`                              | `src/pages/TeamPage.tsx`, `src/pages/manager/ManagerGamesPage.tsx`, `ManagerMatchesPage.tsx`, `ManagerMatchPage.tsx`                          |
| 8   | ⬜ 대기 | `feat: add admin dashboard with scores/teams/games/settings tabs`    | `src/pages/admin/AdminPage.tsx`, `ScoresTab.tsx`, `TeamsTab.tsx`, `GamesTab.tsx`, `SettingsTab.tsx`                                           |
| 9   | ⬜ 대기 | `feat: add results page with podium and full ranking`                | `src/pages/ResultsPage.tsx`                                                                                                                   |
| 10  | ⬜ 대기 | `feat: add item shop, roulette, swap, and standings pages`           | `src/pages/shop/ShopPage.tsx`, `RoulettePage.tsx`, `SwapPage.tsx`, `StandingsPage.tsx`                                                        |
| 11  | ⬜ 대기 | `feat: add status board and schedule pages`                          | `src/pages/StatusPage.tsx`, `src/pages/SchedulePage.tsx`                                                                                      |
| 12  | ⬜ 대기 | `feat: wire up full scoreboard app and add integration smoke tests`  | `src/App.tsx`, `src/App.test.tsx`, `vitest.config.ts`                                                                                         |

## 커밋별 상세

### 0. 저장소 초기화 (baseline)

git 저장소 초기화, 기존 Vite 스캐폴드 + 계획 문서 + `CLAUDE.md`를 첫 커밋으로 고정. 이후 커밋들의 diff를 깨끗하게 유지하기 위한 기준점.

### 1. 순수 채점/대진 로직 (Task 1)

`initial`, `clampScore`, `getScore`/`teamTotal`, `ranked`(공동 순위), `genCode`, `MATCHUPS`/`buildMatches`, `ROULETTE_POOL`, `PALETTE`. Vitest 도입, 단위 테스트 선작성 후 구현.

### 2. 도메인/뷰 타입 + 초기 상태 (Task 2)

`Screen`, `Team`, `Game`, `ScoreboardState`(state.ts) / `ScoreboardView`, 각 페이지 props(view.ts) / `createInitialState()`.

### 3. Tailwind 테마 토큰 (Task 3)

`@theme` 색상·애니메이션 토큰 전체 정의 (`bg-brand`, `text-ink`, `bg-app` 등), dc.html → Tailwind 변환 규칙 문서화.

### 4. 공용 UI 프리미티브 (Task 4)

도메인 지식 없는 재사용 컴포넌트 7종.

### 5. `useScoreboard` 훅 (Task 5)

상태/액션의 유일한 소유자. 원본 `Component extends DCLogic` 로직 이식.

### 6. 인증 페이지 (Task 6)

로그인(팀 코드), 담당자/관리자 PIN 화면.

### 7. 팀 + 담당자 페이지 (Task 7)

팀 홈, 담당자 게임→매치→상세 드릴다운 3단계.

### 8. 관리자 페이지 (Task 8)

대시보드 + 점수/팀/게임/설정 4개 탭.

### 9. 결과 페이지 (Task 9)

포디움 + 전체 순위표.

### 10. 아이템 상점 플로우 (Task 10)

상점, 룰렛, 스왑, 순위 4개 화면.

### 11. 현황판 + 일정 (Task 11)

전광판 스타일 현황판, 경기 일정표.

### 12. App 통합 + QA (Task 12)

`App.tsx`를 라우터로 교체, 스모크 테스트 4종, Playwright 시각 QA, `tsc --noEmit` + `npm run build` 통과 확인.

## 로드맵 갱신 규칙

1. 각 커밋이 실제로 `git commit`될 때마다, 이 문서에서 해당 행의 상태를 `✅ 완료`로 바꾸고 커밋 해시를 `커밋 메시지` 옆에 짧게 덧붙인다 (예: `` `abc1234` ``).
2. 다음 커밋을 시작하기 전 상태를 `🟨 진행중`으로 바꾼다.
3. 계획이 바뀌어 새 커밋이 추가/분할되면 이 표에 행을 추가/수정하고, 원본 계획 문서(`docs/.../plan.md`)와의 대응 관계를 각주로 남긴다.
