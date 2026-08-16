import { PageShell } from '../components/ui/PageShell';
import { PrimaryButton } from '../components/ui/Buttons';
import type { PageProps } from '../types';

export function LoginPage({ view }: PageProps) {
  return (
    <PageShell className="px-6 pb-7 pt-16">
      <div className="mb-[22px] flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-brand">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M7 14l3-3 3 2 4-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 20h16" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </div>
      <div className="text-[26px] font-bold leading-[1.32] tracking-[-0.4px] text-ink">
        레크레이션<br />점수판
      </div>
      <div className="mt-[10px] text-[16px] leading-[1.5] text-muted">팀 코드를 입력하고 입장하세요</div>

      <div className="mt-9">
        <div className="mb-2 text-[14px] font-semibold text-muted-2">팀 코드</div>
        <input
          value={view.codeInput}
          onChange={view.onCodeInput}
          onKeyDown={view.onCodeKey}
          placeholder="예: ABCD"
          maxLength={6}
          className="w-full rounded-[14px] border-none bg-line px-[18px] py-[17px] text-[22px] font-bold uppercase tracking-[6px] text-ink outline-none focus:bg-white focus:shadow-[inset_0_0_0_1.6px_#03b26c]"
        />
        {view.loginError && (
          <div className="mt-[9px] text-[14px] font-medium text-danger">{view.loginError}</div>
        )}
      </div>

      <PrimaryButton onClick={view.submitTeamCode} className="mt-5">입장하기</PrimaryButton>

      <div className="mt-auto pt-7">
        <button
          onClick={view.goStaff}
          className="w-full cursor-pointer border-none bg-transparent py-[15px] text-[15px] font-semibold text-muted-3"
        >
          담당자 · 관리자 로그인 →
        </button>
      </div>
    </PageShell>
  );
}
