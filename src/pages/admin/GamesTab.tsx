import { SoftButton } from '../../components/ui/Buttons';
import type { ScoreboardView } from '../../types';

export function GamesTab({ view }: { view: ScoreboardView }) {
  return (
    <div className="p-4">
      <div className="flex flex-col gap-[10px]">
        {view.adminGameRows.map((row) => (
          <div key={row.id} className="flex items-center gap-[10px] rounded-2xl border border-line bg-white px-[14px] py-3">
            <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[9px] bg-line text-[14px] font-bold text-muted-2">
              {row.num}
            </div>
            <input
              value={row.name}
              onChange={row.onName}
              className="min-w-0 flex-1 border-none bg-transparent py-[6px] text-[16px] font-semibold text-ink outline-none"
            />
            <button onClick={row.remove} className="flex h-8 w-8 items-center justify-center border-none bg-transparent p-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="#b0b8c1" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <SoftButton onClick={view.addGame} className="mt-3">+ 게임 추가</SoftButton>
    </div>
  );
}
