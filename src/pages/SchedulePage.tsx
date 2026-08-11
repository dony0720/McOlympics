import { PageShell } from '../components/ui/PageShell';
import { BackButton } from '../components/ui/BackButton';
import { TeamAvatar } from '../components/ui/TeamAvatar';
import type { PageProps } from '../types';

export function SchedulePage({ view }: PageProps) {
  return (
    <PageShell>
      <div className="flex items-center gap-[6px] px-4 py-3">
        <BackButton onClick={view.backFromSchedule} />
        <div className="text-[18px] font-bold text-ink">🏅 게임 진행 순서</div>
      </div>

      <div className="flex-1 overflow-y-auto border-t border-line bg-surface px-4 pb-6 pt-[18px]">
        {view.scheduleIsTeam && (
          <>
            <div className="mb-[14px] text-[14px] text-muted">
              <b className="text-brand">{view.scheduleTeamName}</b> 대진표예요. 매 타임 시작 전 장소로 이동하세요.
            </div>
            <div className="flex flex-col gap-[10px]">
              {view.teamScheduleRows.map((r) => (
                <div key={r.time} className="rounded-2xl border border-line bg-white p-4">
                  <div className="mb-[10px] flex items-center justify-between">
                    <span className="text-[13px] font-extrabold text-brand">{r.time}</span>
                    <span className={`rounded-lg px-[9px] py-1 text-[12px] font-bold ${r.isIndoor ? 'bg-brand-soft text-brand' : 'bg-warn-soft text-warn-dark'}`}>
                      {r.place}
                    </span>
                  </div>
                  <div className="mb-3 text-[17px] font-bold text-ink">{r.name}</div>
                  <div className="flex items-center gap-[10px] border-t border-line pt-3">
                    <span className="text-[13px] font-semibold text-muted">상대</span>
                    <TeamAvatar color={r.oppColor} initial={r.oppInitial} size={26} />
                    <span className={`text-[16px] font-bold ${r.hasOpponent ? 'text-ink' : 'text-muted'}`}>{r.oppName}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {view.scheduleIsMaster && (
          <>
            <div className="mb-[14px] text-[14px] text-muted">전체 대진표예요. 타임 순서대로 진행하세요.</div>
            <div className="flex flex-col gap-[10px]">
              {view.masterScheduleRows.map((r) => (
                <div key={r.time} className="rounded-2xl border border-line bg-white p-4">
                  <div className="mb-[10px] flex items-center justify-between">
                    <span className="text-[13px] font-extrabold text-brand">{r.time}</span>
                    <span className={`rounded-lg px-[9px] py-1 text-[12px] font-bold ${r.isIndoor ? 'bg-brand-soft text-brand' : 'bg-warn-soft text-warn-dark'}`}>
                      {r.place}
                    </span>
                  </div>
                  <div className="mb-3 text-[17px] font-bold text-ink">{r.name}</div>
                  <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                    {r.pairs.map((p, i) => (
                      <span key={i} className="rounded-[9px] bg-line px-[11px] py-[6px] text-[14px] font-bold text-muted-3">
                        {p.a} <span className="text-muted-4">vs</span> {p.b}
                      </span>
                    ))}
                    {r.pending && <span className="text-[14px] font-semibold text-muted">순위 발표 후 결정</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-4 rounded-2xl border border-line bg-white p-4">
          <div className="mb-[10px] text-[13px] font-extrabold text-muted-2">안내사항</div>
          <div className="flex flex-col gap-[9px]">
            <div className="text-[13px] leading-[1.6] text-muted-2">
              · 실내(강당) 종목은 <b className="text-muted-3">타임 1~4</b>, 야외(운동장) 종목은 <b className="text-muted-3">타임 5~6</b>입니다.
            </div>
            <div className="text-[13px] leading-[1.6] text-muted-2">
              · 각 게임 <b className="text-brand">승리 10점 · 패배 5점</b>, 6개 게임 누적으로 최종 순위가 결정돼요.
            </div>
            <div className="text-[13px] leading-[1.6] text-muted-2">
              · 타임 6(줄다리기) 상대는 타임 1~5 누적 순위 발표 후 진행자가 현장에서 정합니다.
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
