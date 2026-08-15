import { PageShell } from '../../components/ui/PageShell';
import { BackButton } from '../../components/ui/BackButton';
import { TeamAvatar } from '../../components/ui/TeamAvatar';
import { ScoreStepper } from '../../components/ui/ScoreStepper';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { PrimaryButton } from '../../components/ui/Buttons';
import type { PageProps } from '../../types';

const BADGE_COLOR: Record<string, string> = { pending: '#8b95a1', live: '#e07800', done: '#03b26c' };
const BADGE_DOT: Record<string, string> = { pending: '#c4ccd6', live: '#fe9800', done: '#03b26c' };

export function ManagerMatchesPage({ view }: PageProps) {
  const group = view.managerGroupGame;

  return (
    <PageShell>
      <div className="flex items-center gap-[6px] px-4 py-3">
        <BackButton onClick={view.backToManagerGames} />
        <div className="text-[18px] font-bold text-ink">{view.managerGameName}</div>
      </div>

      {group ? (
        <>
          <div className="px-5 pb-3 pt-[6px] text-[14px] text-muted">
            전 팀이 다 같이 진행하는 게임이에요. 팀별 점수를 입력하세요.
          </div>
          <div className="flex-1 overflow-y-auto border-t border-line bg-surface px-4 pb-5 pt-[18px]">
            <div className="mb-3 rounded-2xl border border-line bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[14px] font-bold text-muted-2">진행 상태</span>
                <span className="text-[13px] font-bold text-ink">{group.statusLabel}</span>
              </div>
              <SegmentedControl options={group.statusOptions} />
            </div>

            <div className="rounded-2xl border border-line bg-white p-4">
              <div className="mb-3 text-[14px] font-bold text-muted-2">점수 입력</div>
              <div className="flex flex-col gap-[10px]">
                {group.rows.map((row) => (
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
            <PrimaryButton onClick={view.backToManagerGames}>저장하고 게임 목록으로</PrimaryButton>
          </div>
        </>
      ) : (
        <>
          <div className="px-5 pb-3 pt-[6px] text-[14px] text-muted">진행할 대진을 선택하세요.</div>
          <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-1">
            {view.managerMatchCards.map((m, i) => (
              <button
                key={i}
                onClick={m.pick}
                className="w-full rounded-2xl border border-line bg-surface p-[18px] text-left active:bg-line"
              >
                <div className="mb-[10px] flex items-center">
                  <span className="text-[12px] font-extrabold text-brand">{m.round}</span>
                  <span className="ml-auto flex items-center gap-[5px]">
                    <span className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: BADGE_DOT[m.badgeColor] }} />
                    <span className="text-[13px] font-bold" style={{ color: BADGE_COLOR[m.badgeColor] }}>{m.badge}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <TeamAvatar color={m.aColor} initial={m.aInitial} size={32} />
                  <span className="text-[16px] font-bold text-ink">{m.aName}</span>
                  <span className="text-[13px] font-bold text-muted-4">vs</span>
                  <TeamAvatar color={m.bColor} initial={m.bInitial} size={32} />
                  <span className="text-[16px] font-bold text-ink">{m.bName}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}
