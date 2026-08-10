import { SoftButton } from '../../components/ui/Buttons';
import type { ScoreboardView } from '../../types';

export function TeamsTab({ view }: { view: ScoreboardView }) {
  return (
    <div className="p-4">
      <div className="mb-3 text-[13px] leading-[1.6] text-muted">
        팀을 추가하면 <b className="text-muted-3">입장 코드</b>가 자동 발급돼요. 각 팀에게 코드를 알려주세요.
      </div>
      <div className="flex flex-col gap-[10px]">
        {view.adminTeamRows.map((row) => (
          <div key={row.id} className="flex items-center gap-3 rounded-2xl border border-line bg-white px-[14px] py-3">
            <div className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
            <input
              value={row.name}
              onChange={row.onName}
              className="min-w-0 flex-1 border-none bg-transparent py-[6px] text-[16px] font-semibold text-ink outline-none"
            />
            <span className="rounded-lg bg-brand-soft px-[9px] py-[5px] font-mono text-[14px] font-bold tracking-[1px] text-brand">
              {row.code}
            </span>
            <button onClick={row.remove} className="flex h-8 w-8 items-center justify-center border-none bg-transparent p-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="#b0b8c1" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <SoftButton onClick={view.addTeam} className="mt-3">+ 팀 추가</SoftButton>
    </div>
  );
}
