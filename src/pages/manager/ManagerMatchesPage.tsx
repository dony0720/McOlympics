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
