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
