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

              {g.group && (
                <div>
                  <div className="mb-[9px] flex items-center gap-2">
                    <span className="text-[15px] font-bold text-ink">전 팀 다 같이 진행</span>
                    <span className="ml-auto flex items-center gap-[5px]">
                      <span className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: BADGE_DOT[g.group.badgeColor] }} />
                      <span className="text-[13px] font-bold" style={{ color: BADGE_COLOR[g.group.badgeColor] }}>{g.group.badge}</span>
                    </span>
                  </div>
                  <SegmentedControl options={g.group.options} />
                </div>
              )}

              <div className="flex flex-col gap-4">
                {g.matches.map((m) => (
                  <div key={m.key}>
                    <div className="mb-[9px] flex items-center gap-2">
                      <span className="text-[12px] font-extrabold text-brand">{m.round}</span>
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
