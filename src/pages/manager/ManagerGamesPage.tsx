import { PageShell } from '../../components/ui/PageShell';
import type { PageProps } from '../../types';

export function ManagerGamesPage({ view }: PageProps) {
  return (
    <PageShell>
      <div className="flex items-center justify-between px-5 py-4">
        <div className="rounded-lg bg-brand-soft px-[11px] py-[5px] text-[13px] font-bold text-brand">담당자</div>
        <button onClick={view.logout} className="cursor-pointer border-none bg-transparent text-[14px] font-semibold text-muted">
          나가기
        </button>
      </div>
      <div className="px-5 pb-1 pt-2">
        <div className="text-[24px] font-bold leading-tight tracking-[-0.3px] text-ink">담당 게임을<br />선택하세요</div>
        <div className="mt-[14px] flex gap-2">
          <button
            onClick={view.openStatus}
            className="flex items-center gap-[7px] rounded-[20px] border-none bg-ink px-4 py-[10px] text-[14px] font-bold text-white active:bg-ink-soft"
          >
            📋 경기 현황판
          </button>
          <button
            onClick={view.openSchedule}
            className="flex items-center gap-[7px] rounded-[20px] border-none bg-brand-soft px-4 py-[10px] text-[14px] font-bold text-brand active:bg-brand-soft-dark"
          >
            🏅 진행 순서
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-3 px-5 py-[22px]">
        {view.managerGameCards.map((g) => (
          <button
            key={g.name}
            onClick={g.pick}
            className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface p-5 text-left active:bg-line"
          >
            <div>
              <div className="text-[17px] font-bold text-ink">{g.name}</div>
              <div className="mt-1 text-[13px] text-muted">{g.sub}</div>
            </div>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M9 5l7 7-7 7" stroke="#b0b8c1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
        {view.noGames && (
          <div className="py-10 text-center text-[15px] text-muted-4">
            아직 등록된 게임이 없어요.<br />관리자가 게임을 추가해 주세요.
          </div>
        )}
      </div>
    </PageShell>
  );
}
