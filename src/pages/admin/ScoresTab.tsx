import { TeamAvatar } from '../../components/ui/TeamAvatar';
import { ScoreStepper } from '../../components/ui/ScoreStepper';
import type { ScoreboardView } from '../../types';

export function ScoresTab({ view }: { view: ScoreboardView }) {
  return (
    <div className="p-4">
      <div className="flex gap-2 overflow-x-auto pb-[14px]">
        {view.adminGameChips.map((c) => (
          <button
            key={c.id}
            onClick={c.select}
            className={`flex-shrink-0 whitespace-nowrap rounded-[20px] border-none px-4 py-[9px] text-[14px] font-bold ${
              c.active ? 'bg-info text-white' : 'bg-line text-muted-2'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
      {view.noGames && (
        <div className="py-10 text-center text-[15px] text-muted-4">게임 탭에서 게임을 먼저 추가하세요.</div>
      )}
      <div className="flex flex-col gap-[10px]">
        {view.adminScoreRows.map((row) => (
          <div key={row.id} className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-[14px]">
            <TeamAvatar color={row.color} initial={row.initial} size={34} />
            <div className="flex-1 truncate text-[16px] font-semibold text-ink">{row.name}</div>
            <ScoreStepper value={row.score} onDec={row.dec} onInc={row.inc} onInput={row.onInput} />
          </div>
        ))}
      </div>
    </div>
  );
}
