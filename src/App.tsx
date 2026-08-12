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
  const { view, loading, error } = useScoreboard();
  return (
    <div className="flex min-h-screen items-stretch justify-center bg-app">
      <div className="relative flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden bg-white">
        {loading ? (
          <div className="flex flex-1 items-center justify-center text-[15px] text-muted">불러오는 중...</div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center px-8 text-center text-[15px] text-danger">{error}</div>
        ) : (
          renderPage(view)
        )}
        <Toast message={view.toast} />
      </div>
    </div>
  );
}
