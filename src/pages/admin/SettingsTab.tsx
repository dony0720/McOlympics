import type { ScoreboardView } from '../../types';

export function SettingsTab({ view }: { view: ScoreboardView }) {
  return (
    <div className="p-4">
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <button
          onClick={view.resetScores}
          className="w-full border-none border-b border-line bg-transparent p-0 px-4 py-[18px] text-left active:bg-surface"
        >
          <div className="text-[16px] font-semibold text-ink">점수 초기화</div>
          <div className="mt-[3px] text-[13px] text-muted">모든 점수를 0으로 되돌려요. 팀·게임은 유지돼요.</div>
        </button>
        <button
          onClick={view.resetAll}
          className="w-full border-none bg-transparent p-0 px-4 py-[18px] text-left active:bg-surface"
        >
          <div className="text-[16px] font-semibold text-danger">대회 리셋</div>
          <div className="mt-[3px] text-[13px] text-muted">팀·게임·점수를 모두 삭제하고 처음부터 시작해요.</div>
        </button>
      </div>
    </div>
  );
}
