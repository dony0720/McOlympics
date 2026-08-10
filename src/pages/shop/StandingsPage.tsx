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
