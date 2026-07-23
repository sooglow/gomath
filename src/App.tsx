import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { TabType, UserProfile } from './shared/types';
import { supabase, fetchMyProfile, signOut } from './shared/api/supabase';
import { useIdleTimeout } from './shared/hooks/useIdleTimeout';
import Header from './widgets/header/ui/Header';
import BottomNav from './widgets/bottom-nav/ui/BottomNav';
import HomePage from './pages/home/ui/HomePage';
import AiTutorPage from './pages/ai-tutor/ui/AiTutorPage';
import TasksPage from './pages/tasks/ui/TasksPage';
import ProfilePage from './pages/profile/ui/ProfilePage';
import AdminPage from './pages/admin/ui/AdminPage';
import LoginPage from './pages/auth/ui/LoginPage';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [idleWarning, setIdleWarning] = useState(false);

  useIdleTimeout(
    !!session,
    signOut,
    () => setIdleWarning(true),
    () => setIdleWarning(false),
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile();
      else setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfile();
      else { setProfile(null); setAuthLoading(false); }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProfile() {
    try {
      const p = await fetchMyProfile();
      setProfile(p);
    } finally {
      setAuthLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="w-full max-w-md mx-auto h-dvh flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="w-full max-w-md mx-auto h-dvh flex flex-col bg-slate-50 shadow-2xl overflow-hidden font-sans">
        <LoginPage />
      </div>
    );
  }

  if (profile && profile.status !== 'approved') {
    const isRejected = profile.status === 'rejected';
    return (
      <div className="w-full max-w-md mx-auto h-dvh flex flex-col items-center justify-center bg-slate-50 shadow-2xl px-6 font-sans">
        <div className="text-5xl mb-4">{isRejected ? '❌' : '⏳'}</div>
        <h2 className="text-lg font-black text-slate-800 mb-2">
          {isRejected ? '가입이 거절됐어요' : '가입 승인 대기 중입니다'}
        </h2>
        <p className="text-sm text-slate-500 text-center leading-relaxed">
          {isRejected
            ? '선생님께 문의해주세요.'
            : '선생님이 가입 신청을 검토 중이에요.\n승인되면 바로 이용할 수 있어요!'}
        </p>
        <button onClick={signOut} className="mt-8 text-sm text-slate-400 hover:text-slate-600">
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto h-dvh flex flex-col bg-slate-50 shadow-2xl overflow-hidden font-sans">
      {idleWarning && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg whitespace-nowrap">
          ⏰ 1분 후 자동 로그아웃됩니다
        </div>
      )}
      {activeTab === 'admin' ? (
        <>
          <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shrink-0">
            <button onClick={() => setActiveTab('profile')} className="text-slate-500 hover:text-slate-800 transition-colors">
              ← 뒤로
            </button>
          </div>
          <AdminPage />
        </>
      ) : (
        <>
          <Header userName={profile?.name ?? session.user.user_metadata?.name} onSignOut={signOut} />
          <main className="flex-1 flex flex-col overflow-hidden min-h-0">
            {activeTab === 'home'     && <HomePage onStartTutor={() => setActiveTab('ai-tutor')} onGoToTasks={() => setActiveTab('tasks')} userName={profile?.name ?? session.user.user_metadata?.name} userRole={profile?.role} userId={session.user.id} />}
            {activeTab === 'ai-tutor' && <AiTutorPage userId={session.user.id} />}
            {activeTab === 'tasks'    && <TasksPage onStartTutor={() => setActiveTab('ai-tutor')} userId={session.user.id} />}
            {activeTab === 'profile'  && <ProfilePage onNavigate={setActiveTab} profile={profile} onSignOut={signOut} onProfileUpdated={(updated) => setProfile((prev) => prev ? { ...prev, ...updated } : prev)} />}
          </main>
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </>
      )}
    </div>
  );
}
