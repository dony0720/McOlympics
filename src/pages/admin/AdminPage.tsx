import { DarkButton } from '../../components/ui/Buttons';
import { ScoresTab } from './ScoresTab';
import { TeamsTab } from './TeamsTab';
import { GamesTab } from './GamesTab';
import { SettingsTab } from './SettingsTab';
import type { PageProps } from '../../types';

export function AdminPage({ view }: PageProps) {
  return (
    <div className="flex flex-1 animate-screen-in flex-col">
      <div className="flex items-center justify-between px-5 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-ink px-[11px] py-[5px] text-[13px] font-bold text-white">관리자</div>
          <div className="text-[18px] font-bold text-ink">대시보드</div>
        </div>
        <div className="flex items-center gap-[14px]">
          <button onClick={view.openStatus} className="cursor-pointer border-none bg-transparent text-[14px] font-bold text-ink">현황</button>
          <button onClick={view.openSchedule} className="cursor-pointer border-none bg-transparent text-[14px] font-bold text-brand">순서</button>
          <button onClick={view.logout} className="cursor-pointer border-none bg-transparent text-[14px] font-semibold text-muted">나가기</button>
        </div>
      </div>

      <div className="flex gap-1 px-4 pb-1">
        {view.adminTabs.map((t) => (
          <button
            key={t.id}
            onClick={t.select}
            className={`flex-1 rounded-[11px] border-none py-[11px] text-[15px] font-bold ${
              t.active ? 'bg-ink text-white' : 'bg-line text-muted'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto border-t border-line bg-surface">
        {view.adminIsScores && <ScoresTab view={view} />}
        {view.adminIsTeams && <TeamsTab view={view} />}
        {view.adminIsGames && <GamesTab view={view} />}
        {view.adminIsSettings && <SettingsTab view={view} />}
      </div>

      <div className="border-t border-line bg-white px-5 pb-6 pt-3">
        <DarkButton onClick={view.toResults}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M7 4h10v4a5 5 0 01-10 0V4z" stroke="#ffd158" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M17 5h2.5a2 2 0 01-2.5 3M7 5H4.5a2 2 0 002.5 3M10 13h4v3h-4z" stroke="#ffd158" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M8 20h8" stroke="#ffd158" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          결과 발표하기
        </DarkButton>
      </div>
    </div>
  );
}
