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
