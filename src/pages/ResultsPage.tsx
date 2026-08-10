import { BackButton } from '../components/ui/BackButton';
import { TeamAvatar } from '../components/ui/TeamAvatar';
import type { PageProps } from '../types';

export function ResultsPage({ view }: PageProps) {
  const { podium } = view;
  return (
    <div className="flex flex-1 animate-screen-in flex-col bg-ink">
      <div className="flex items-center justify-between px-5 py-4">
        <BackButton onClick={view.backToAdmin} stroke="#8b95a1" />
        <div className="text-[15px] font-semibold text-muted">최종 결과</div>
        <div className="w-10" />
      </div>

      <div className="px-5 pb-[26px] pt-3 text-center">
        <div className="text-[26px] font-extrabold tracking-[-0.4px] text-white">🏆 우승 팀은?</div>
        {view.hasWinner && (
          <div className="mt-2 text-[15px] text-muted">
            축하합니다, <b className="text-gold">{view.winnerName}</b>!
          </div>
        )}
      </div>

      <div className="flex items-end justify-center gap-[10px] px-5">
        {podium.second && (
          <div className="flex max-w-[110px] flex-1 flex-col items-center">
            <TeamAvatar color={podium.second.color} initial={podium.second.initial} size={48} />
            <div className="mb-[2px] mt-2 text-center text-[14px] font-bold text-white">{podium.second.name}</div>
            <div className="mb-2 text-[13px] font-bold text-silver">{podium.second.total}점</div>
            <div className="flex h-[96px] w-full items-center justify-center rounded-t-[14px]" style={{ background: 'linear-gradient(180deg,#4e5968,#333d4b)' }}>
              <span className="text-[30px] font-extrabold text-silver">2</span>
            </div>
          </div>
        )}
        {podium.first && (
          <div className="flex max-w-[120px] flex-1 flex-col items-center">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="mb-1">
              <path d="M3 7l4 4 5-7 5 7 4-4-2 12H5L3 7z" fill="#ffd158" />
            </svg>
            <TeamAvatar color={podium.first.color} initial={podium.first.initial} size={54} ring />
            <div className="mb-[2px] mt-2 text-center text-[15px] font-extrabold text-white">{podium.first.name}</div>
            <div className="mb-2 text-[14px] font-extrabold text-gold">{podium.first.total}점</div>
            <div className="flex h-[140px] w-full animate-pop items-center justify-center rounded-t-[14px]" style={{ background: 'linear-gradient(180deg,#ffd158,#ffb331)' }}>
              <span className="text-[38px] font-extrabold text-white">1</span>
            </div>
          </div>
        )}
        {podium.third && (
          <div className="flex max-w-[110px] flex-1 flex-col items-center">
            <TeamAvatar color={podium.third.color} initial={podium.third.initial} size={44} />
            <div className="mb-[2px] mt-2 text-center text-[14px] font-bold text-white">{podium.third.name}</div>
            <div className="mb-2 text-[13px] font-bold text-bronze">{podium.third.total}점</div>
            <div className="flex h-[72px] w-full items-center justify-center rounded-t-[14px]" style={{ background: 'linear-gradient(180deg,#a4703c,#7a5228)' }}>
              <span className="text-[26px] font-extrabold text-bronze-light">3</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-[18px] flex-1 rounded-t-[24px] bg-panel-dark px-5 py-[22px]">
        <div className="mb-2 text-[14px] font-bold text-muted">전체 순위</div>
        <div className="flex flex-col">
          {view.rankedList.map((r) => (
            <div key={r.id} className="flex items-center gap-[14px] border-b border-panel-divider py-[15px]">
              <span className="w-6 text-center text-[17px] font-extrabold" style={{ color: r.rankColor, fontVariantNumeric: 'tabular-nums' }}>
                {r.rank}
              </span>
              <TeamAvatar color={r.color} initial={r.initial} size={30} />
              <span className="flex-1 text-[16px] font-semibold text-line">{r.name}</span>
              <span className="text-[17px] font-extrabold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{r.total}점</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
