# 로드맵 (커밋 단위 계획)

이 문서는 `docs/superpowers/plans/2026-08-10-recreation-scoreboard-react-port.md`의 12개 Task와, 그 이후 진행하는 `Firebase 실시간 DB 연동` 계획(Task 13~17)을 **커밋 단위**로 쪼갠 실행 로드맵이다. 각 항목은 정확히 하나의 커밋에 대응한다.

- 상태 표시: `⬜ 대기` → `🟨 진행중` → `✅ 완료`
- 작업 순서: 이 문서의 위에서 아래 순서를 따른다 (뒤 커밋은 앞 커밋에 의존).
- 각 커밋이 완료되면 이 로드맵의 상태를 즉시 갱신한 뒤 다음 커밋으로 넘어간다 (`CLAUDE.md` 작업 프로세스 참고).

## 진행 상황

| #   | 상태      | 커밋 메시지                                            | 핵심 파일                                                                                                                                     |
| --- | --------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | ✅ 완료   | `chore: 저장소 초기화` `2893d98`                       | (전체 초기 스캐폴드), `CLAUDE.md`, `docs/**`                                                                                                  |
| 1   | ✅ 완료   | `feat: 순수 채점/대진 로직 및 단위 테스트 추가` `90a9991` | `src/lib/scoring.ts`, `src/lib/scoring.test.ts`, `package.json`                                                                               |
| 2   | ✅ 완료   | `feat: 점수판 상태/뷰 타입 및 초기 상태 추가` `823aa1b`  | `src/types/state.ts`, `src/types/view.ts`, `src/types/index.ts`, `src/data/initialState.ts`                                                   |
| 3   | ✅ 완료   | `feat: Tailwind 디자인 토큰 및 변환 가이드 추가` `5739fe1` | `src/index.css`, `design-reference/CONVERSION_GUIDE.md`                                                                                       |
| 4   | ✅ 완료   | `feat: 공용 UI 프리미티브 컴포넌트 추가` `9f18625`        | `src/components/ui/PageShell.tsx`, `TeamAvatar.tsx`, `BackButton.tsx`, `Buttons.tsx`, `ScoreStepper.tsx`, `SegmentedControl.tsx`, `Toast.tsx` |
| 5   | ✅ 완료   | `feat: 점수판 상태 머신을 React 훅으로 포팅` `a8647a5`   | `src/hooks/useScoreboard.ts`                                                                                                                  |
| 6   | ✅ 완료   | `feat: 로그인 및 담당자 PIN 페이지 추가` `2e59e9d`       | `src/pages/LoginPage.tsx`, `src/pages/StaffPinPage.tsx`                                                                                       |
| 7   | ✅ 완료   | `feat: 팀 및 담당자 플로우 페이지 추가` `e4dc7c2`        | `src/pages/TeamPage.tsx`, `src/pages/manager/ManagerGamesPage.tsx`, `ManagerMatchesPage.tsx`, `ManagerMatchPage.tsx`                          |
| 8   | ✅ 완료   | `feat: 관리자 대시보드 및 점수/팀/게임/설정 탭 추가` `3fd96fe` | `src/pages/admin/AdminPage.tsx`, `ScoresTab.tsx`, `TeamsTab.tsx`, `GamesTab.tsx`, `SettingsTab.tsx`                                           |
| 9   | ✅ 완료   | `feat: 포디움 및 전체 순위 결과 페이지 추가` `0dec5fd`   | `src/pages/ResultsPage.tsx`                                                                                                                   |
| 10  | ✅ 완료   | `feat: 아이템 상점, 룰렛, 스왑, 순위 페이지 추가` `01924ce` | `src/pages/shop/ShopPage.tsx`, `RoulettePage.tsx`, `SwapPage.tsx`, `StandingsPage.tsx`                                                        |
| 11  | ✅ 완료   | `feat: 현황판 및 일정 페이지 추가` `9cd2446`             | `src/pages/StatusPage.tsx`, `src/pages/SchedulePage.tsx`                                                                                      |
| 12  | ✅ 완료   | `feat: 전체 점수판 앱 통합 및 스모크 테스트 추가` `91a0f69` | `src/App.tsx`, `src/App.test.tsx`, `vitest.config.ts`, `src/test/setup.ts`                                                                    |
| 12.1 | ✅ 완료  | `fix: 점수 바꾸기 화면에서 상대 팀 총점 노출 제거` `c2c1d71` | `src/pages/shop/SwapPage.tsx`, `src/types/view.ts`, `src/hooks/useScoreboard.ts`                                                              |
| 13  | ✅ 완료   | `feat: Firebase SDK 연동` `661d2be`                     | `src/lib/firebase.ts`, `src/vite-env.d.ts`, `.env.example`, `.gitignore`, `package.json`                                                      |
| 14  | ✅ 완료   | `refactor: 점수판 상태를 로컬 UI/공유 상태로 분리` `e9137d2` | `src/types/state.ts`                                                                                                                       |
| 15  | ✅ 완료   | `feat: Firestore 대회 데이터 훅 및 보안 규칙 추가` `fee0477` | `src/hooks/useCompetitionData.ts`, `src/data/initialState.ts`, `firestore.rules`, `firebase.json`, `firestore.indexes.json`               |
| 16  | ✅ 완료   | `refactor: useScoreboard를 Firestore 실시간 연동으로 재작성` `9c5d305` | `src/hooks/useScoreboard.ts`, `src/App.tsx`                                                                                       |
| 17  | ✅ 완료   | `test: Firestore 데이터 훅 목 추가 및 테스트 오프라인화` `d337a6e` | `src/test/mockCompetitionData.ts`, `src/App.test.tsx`, `src/test/setup.ts`                                                          |
| 18  | ✅ 완료   | `chore: Netlify 배포 설정 추가` `bf90872`                | `netlify.toml`                                                                                                                                |
| 19  | ✅ 완료   | `fix: 시드 데이터에 팀별 아이템 포인트 100 명시` `fe0d05b` | `src/data/initialState.ts`                                                                                                                   |
| 20  | ✅ 완료   | `feat: 시드 게임 목록을 실제 진행 게임 이름으로 확정` `3e1d539` | `src/data/initialState.ts`                                                                                                              |
| 21  | ✅ 완료   | `feat: 점수 +/- 버튼 입력 단위를 10점으로 변경` `7916304` | `src/hooks/useScoreboard.ts`                                                                                                                 |
| 22  | ✅ 완료   | `feat: 동시 진행 라운드 방식에 맞게 대진표 재구성` `8dafc74` | `src/lib/scoring.ts`, `src/lib/scoring.test.ts`, `src/hooks/useScoreboard.ts`, `src/types/view.ts`, `src/pages/SchedulePage.tsx`, `src/pages/StatusPage.tsx`, `src/pages/manager/ManagerMatchesPage.tsx`, `src/data/initialState.ts`, `src/manager.test.tsx` |

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

### 12.1. 점수 바꾸기 화면 총점 비노출 (사용자 요청 수정)

`SwapPage`에서 상대 팀의 현재 총점을 보여주지 않도록 변경 (다른 팀 점수를 미리 알고 스왑을 결정하지 못하게 하는 의도적 UX 변경).

---

## Firebase 실시간 DB 연동 (`docs/superpowers/plans` 외부, 별도 계획서: `firebase 실시간 db 연동` plan)

목표: 브라우저 메모리(`useState`)에만 있던 상태를 Firestore로 옮겨, 팀/담당자/관리자가 서로 다른 기기에서 동시에 같은 점수·대진 상태를 실시간으로 보고 수정할 수 있게 한다. PIN/팀 코드 검증은 지금처럼 클라이언트에서 유지하고, Firebase는 익명 인증 + 데이터 저장소로만 사용한다.

### 13. Firebase SDK 연동 (Task 13)

`firebase` 패키지 설치, `src/lib/firebase.ts`(앱 초기화, Firestore/Auth 인스턴스, 익명 로그인 `authReady`), `.env.example`/`.gitignore`(`VITE_FIREBASE_*` 키), `src/vite-env.d.ts`(env 타입).

### 14. 상태 타입 분리 (Task 14)

`src/types/state.ts`의 `ScoreboardState`를 기기별 `LocalUiState`(화면/입력값/네비게이션/룰렛 애니메이션)와, 모든 기기가 공유하는 `SharedState`(teams/games/scores/matchStatus/itemPoints/itemBonus)로 분리.

### 15. Firestore 데이터 훅 (Task 15)

`src/hooks/useCompetitionData.ts`: `competitions/main` 문서 구독(`onSnapshot`) + 문서가 없으면 시드 데이터로 최초 생성(`runTransaction`) + 쓰기 액션(`setScore`/`setMatchStatus`는 `updateDoc`+dot-path, `addTeam`/`deleteTeam`/`addGame`/`deleteGame`/`confirmSwap`은 `runTransaction`, `applyItemBenefit`은 `increment()`). `src/data/initialState.ts`를 시드용 `createSeedSharedState()` + 로컬 기본값 `createInitialLocalUiState()`로 분리. `firestore.rules`(`request.auth != null`), `firebase.json`, `firestore.indexes.json` 추가.

### 16. `useScoreboard` Firestore 연동 재작성 (Task 16)

로컬 UI `useState(LocalUiState)` + `useCompetitionData()`(공유 `SharedState`)를 합쳐 기존과 동일한 `ScoreboardView`를 파생. `myTeamId`는 `localStorage`에 저장해 새로고침해도 로그인이 유지되도록 함. `App.tsx`에 최초 로딩/에러 화면 추가.

### 17. 테스트 오프라인화 (Task 17)

`src/test/mockCompetitionData.ts`: 실제 Firestore 없이 동일한 쓰기 동작을 메모리에서 재현하는 `useCompetitionData` 대체 구현. `src/App.test.tsx`에서 `vi.mock`으로 교체. `src/test/setup.ts`에 `localStorage` 초기화 추가(로그인 상태가 테스트 간 새는 것 방지).

**실시간 동기화 QA (완료)**: 실제 Firebase 프로젝트(`.env` 값 채움, Firestore Database 생성, 익명 인증 활성화, `firestore.rules` 게시)에 연결한 뒤, Playwright로 완전히 분리된 두 브라우저 컨텍스트(관리자 탭 / 팀 탭)를 열어 확인. 관리자 탭에서 점수를 변경하면 새로고침 없이 3초 내 팀 탭에 자동 반영됨을 확인했다 (QA 스크립트는 검증 후 삭제).

### 18~21. 배포 및 실제 운영 데이터 반영

`netlify.toml`(빌드 명령·SPA 리다이렉트)로 Netlify 자동 배포 구성. 아이템 상점에서 보유 포인트가 음수(-10P)가 되던 버그를 시드에 팀별 100P를 명시해 해결(화면은 필드가 없으면 100P로 보여주지만 Firestore `increment()`는 없는 필드를 0에서 깎기 때문). 게임 이름을 실제 진행 종목으로 확정하고, 점수 +/- 버튼 단위를 10점으로 변경.

### 22. 동시 진행 라운드 대진표 (Task 18)

실제 진행 방식(1부 몸으로 말해요 전체 진행 → 2부 실내 3부스 동시 → 3부 야외 2부스 동시)에 맞춰 대진 구조를 재구성.

- `MATCHUPS` 2차원 배열을 상대 팀과 라운드를 함께 담는 `GAME_SCHEDULE` 하나로 통합하고, 동시에 여는 게임 묶음을 `GAME_PHASES`로 분리.
- 대진 없는 게임(빈 배열)은 "전 팀 다 같이 진행"으로 취급. 담당자가 6팀 점수를 한 화면에서 입력하고 진행 상태는 `<gameId>:all` 키 하나로 관리한다.
- `buildMatches`/`masterScheduleRows`/`statusGames`에 박혀 있던 "마지막 게임은 대진 없음"(`i < 5`, `MATCHUPS.length - 1`) 하드코딩 제거. 원본의 줄다리기 순위 매치 잔재로, 할리갈리 점수 입력이 막혀 있던 원인이었다.
- 일정표·현황판·담당자 화면에 라운드 표기 추가, 안내문을 1~3부 구성과 승리 20점·패배 10점 기준으로 교체.
- 시드의 데모 점수와 무효해진 경기 상태 키를 비움.

**대진표 근거**: 부스를 동시에 돌리면 6팀 15개 조합을 전부 성사시킬 수 없다. 실내 3라운드가 9개 조합을 쓰고 나면 남는 6개가 항상 삼각형 두 개(1-4-6, 2-3-5 꼴)가 되어 야외 두 게임의 완전 매칭으로 쪼개지지 않기 때문이다. 720가지 배치를 전수 탐색해 13개 조합 성사(재대결 2회)가 최대임을 확인했고, 그중 재대결이 가장 멀리 떨어지는 배치를 채택했다. 1-6과 4-5는 만나지 않고, 1-5와 4-6은 두 번 만난다. `src/lib/scoring.test.ts`에서 라운드 내 팀 충돌 없음·게임별 전 팀 1경기·13개 조합 성사를 검증한다.

## 로드맵 갱신 규칙

1. 각 커밋이 실제로 `git commit`될 때마다, 이 문서에서 해당 행의 상태를 `✅ 완료`로 바꾸고 커밋 해시를 `커밋 메시지` 옆에 짧게 덧붙인다 (예: `` `abc1234` ``).
2. 다음 커밋을 시작하기 전 상태를 `🟨 진행중`으로 바꾼다.
3. 계획이 바뀌어 새 커밋이 추가/분할되면 이 표에 행을 추가/수정하고, 원본 계획 문서(`docs/.../plan.md`)와의 대응 관계를 각주로 남긴다.
