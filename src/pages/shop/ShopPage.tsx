import { PageShell } from '../../components/ui/PageShell';
import { BackButton } from '../../components/ui/BackButton';
import type { PageProps } from '../../types';

export function ShopPage({ view }: PageProps) {
  return (
    <PageShell>
      <div className="flex items-center gap-[6px] px-4 py-3">
        <BackButton onClick={view.backFromShop} />
        <div className="whitespace-nowrap text-[18px] font-bold text-ink">🎁 아이템 상점</div>
      </div>

      <div className="mx-5 mb-[6px] mt-1 flex items-center justify-between rounded-[18px] px-5 py-[18px]" style={{ background: 'linear-gradient(135deg,#191f28,#333d4b)' }}>
        <div>
          <div className="text-[13px] font-semibold text-muted-4">{view.shopTeamName} 보유 포인트</div>
          <div className="mt-[2px] flex items-baseline gap-1">
            <span className="text-[34px] font-extrabold text-gold" style={{ fontVariantNumeric: 'tabular-nums' }}>{view.myItemPoints}</span>
            <span className="text-[18px] font-bold text-gold">P</span>
          </div>
        </div>
        <div className="text-[40px]">🪙</div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 pb-6 pt-3">
        {view.shopItems.map((it) => (
          <button
            key={it.id}
            onClick={it.action}
            style={{ opacity: it.cardOpacity }}
            className="flex w-full items-center gap-[14px] rounded-[18px] border border-line bg-white p-[18px] text-left active:bg-surface"
          >
            <div className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-2xl text-[26px]" style={{ backgroundColor: it.bg }}>
              {it.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[17px] font-bold text-ink">{it.name}</div>
              <div className="mt-[3px] text-[13px] leading-[1.4] text-muted">{it.desc}</div>
            </div>
            <span className="flex-shrink-0 rounded-xl px-3 py-2 text-[15px] font-extrabold" style={{ color: it.accent, backgroundColor: it.bg }}>
              {it.costLabel}
            </span>
          </button>
        ))}
        <div className="mt-[6px] text-center text-[13px] leading-[1.6] text-muted-4">아이템으로 얻은 점수는 우리 팀 총점에 바로 반영돼요</div>
      </div>
    </PageShell>
  );
}
