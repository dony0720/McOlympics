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
