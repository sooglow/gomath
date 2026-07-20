import React from 'react';
import type { TabType } from '../../types';

const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  {
    id: 'home',
    label: '홈',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    id: 'ai-tutor',
    label: 'AI 튜터',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  },
  {
    id: 'notes',
    label: '오답노트',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  },
  {
    id: 'profile',
    label: '내 정보',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  },
];

type Props = {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
};

export default function BottomNav({ activeTab, onTabChange }: Props) {
  return (
    <nav
      className="bg-white border-t border-slate-100 flex items-center justify-around px-2 shrink-0 z-20 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex flex-col items-center gap-1 py-3 px-4 transition-all ${active ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            {tab.id === 'ai-tutor' && (
              <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-indigo-500 border-2 border-white" />
            )}
            {tab.icon}
            <span className={`text-[10px] font-bold ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
              {tab.label}
            </span>
            {active && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
