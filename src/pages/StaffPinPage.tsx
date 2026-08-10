import { PageShell } from '../components/ui/PageShell';
import { BackButton } from '../components/ui/BackButton';
import { PrimaryButton } from '../components/ui/Buttons';
import type { PageProps } from '../types';

export function StaffPinPage({ view }: PageProps) {
  return (
    <PageShell className="px-6 pb-7 pt-[14px]">
      <BackButton onClick={view.toLogin} />
      <div className="mt-[34px] text-[24px] font-bold tracking-[-0.3px] text-ink">담당자 · 관리자 로그인</div>
      <div className="mt-[10px] text-[16px] text-muted">PIN 4자리를 입력하세요</div>

      <div className="mt-[34px]">
        <input
          value={view.pinInput}
          onChange={view.onPinInput}
          onKeyDown={view.onPinKey}
          type="password"
          inputMode="numeric"
          maxLength={4}
          placeholder="••••"
          className="w-full rounded-[14px] border-none bg-line px-[18px] py-[17px] text-center text-[24px] font-bold tracking-[10px] text-ink outline-none focus:bg-white focus:shadow-[inset_0_0_0_1.6px_#03b26c]"
        />
        {view.loginError && (
          <div className="mt-[9px] text-center text-[14px] font-medium text-danger">{view.loginError}</div>
        )}
      </div>

      <PrimaryButton onClick={view.submitPin} className="mt-5">로그인</PrimaryButton>
      <div className="mt-4 text-center text-[13px] text-muted-4">담당자 1234 · 관리자 9999</div>
    </PageShell>
  );
}
