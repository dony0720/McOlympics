import { BackButton } from '../../components/ui/BackButton';
import type { PageProps } from '../../types';

export function RoulettePage({ view }: PageProps) {
  return (
    <div className="flex flex-1 animate-screen-in flex-col" style={{ background: 'linear-gradient(180deg,#1b1030,#2a1a4a)' }}>
      <div className="flex items-center gap-[6px] px-4 py-3">
        <BackButton onClick={view.backToShop} stroke="#d9c9ff" />
        <div className="whitespace-nowrap text-[18px] font-bold text-white">🎰 행운의 룰렛</div>
        <span className="ml-auto rounded-[20px] bg-gold px-[11px] py-[5px] text-[13px] font-extrabold text-ink">
          {view.myItemPoints}P
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-5">
        <div className="mb-5 text-center text-[15px] font-semibold text-roulette-lilac">
          한 번에 10P · 나오는 만큼 점수가 오르내려요
        </div>

        <div className="relative h-[104px] w-full max-w-[340px]">
          <div
            className="absolute -top-[9px] left-1/2 z-[3] -translate-x-1/2"
            style={{ width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: '12px solid #ffd158' }}
          />
          <div className="absolute inset-0 overflow-hidden rounded-[18px] bg-roulette-reel shadow-[inset_0_0_0_2px_rgba(255,255,255,.08)]">
            <div style={view.reelStripStyle}>
              {view.rouletteCells.map((c, i) => (
                <div key={i} className="flex h-[104px] w-[84px] flex-shrink-0 items-center justify-center border-r border-white/5">
                  <div
                    className={`flex h-[78px] w-16 items-center justify-center rounded-[14px] ${
                      c.positive ? 'bg-brand-soft text-brand' : 'bg-danger-soft text-danger'
                    }`}
                  >
                    <span className="text-[22px] font-extrabold">{c.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div
            className="pointer-events-none absolute left-1/2 top-0 z-[2] h-[104px] w-20 -translate-x-1/2 rounded-[14px]"
            style={{ boxShadow: '0 0 0 3px #ffd158, 0 0 22px rgba(255,209,88,.5)' }}
          />
        </div>

        {view.rouletteDone && (
          <div className="mt-[26px] animate-pop text-center">
            <div className="text-[14px] font-semibold text-roulette-lilac">결과</div>
            <div className={`text-[44px] font-extrabold tracking-[-1px] ${view.rResultPositive ? 'text-brand' : 'text-danger'}`}>
              {view.rResultLabel}
            </div>
          </div>
        )}
        {view.rouletteIdle && (
          <div className="mt-[26px] flex h-[70px] items-center text-[15px] font-semibold text-roulette-muted">
            버튼을 눌러 돌려보세요
          </div>
        )}
        {view.rouletteSpinning && (
          <div className="mt-[26px] flex h-[70px] items-center text-[16px] font-bold text-gold">두구두구…</div>
        )}
      </div>

      <div className="flex flex-col gap-[10px] px-5 pb-7 pt-3">
        {view.rouletteDone && (
          <>
            <button
              onClick={view.spinRoulette}
              style={{ opacity: view.canSpinAgain ? 1 : 0.5 }}
              className="w-full rounded-[14px] border-none bg-gold py-[17px] text-[17px] font-extrabold text-ink active:bg-gold-dark"
            >
              한 번 더 돌리기 (10P)
            </button>
            <button onClick={view.backToShop} className="w-full rounded-[14px] border-none bg-white/10 py-[15px] text-[15px] font-bold text-white">
              상점으로 돌아가기
            </button>
          </>
        )}
        {view.rouletteIdle && (
          <button
            onClick={view.spinRoulette}
            className="w-full rounded-[14px] border-none bg-gold py-[18px] text-[18px] font-extrabold text-ink active:bg-gold-dark"
          >
            돌리기 🎰 (10P)
          </button>
        )}
      </div>
    </div>
  );
}
