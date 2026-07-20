import { useState } from 'react';
import type { TabType } from './shared/types';
import Header from './widgets/header/ui/Header';
import BottomNav from './widgets/bottom-nav/ui/BottomNav';
import HomePage from './pages/home/ui/HomePage';
import AiTutorPage from './pages/ai-tutor/ui/AiTutorPage';
import NotesPage from './pages/notes/ui/NotesPage';
import ProfilePage from './pages/profile/ui/ProfilePage';
import AdminPage from './pages/admin/ui/AdminPage';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');

  return (
    <div className="w-full max-w-md mx-auto h-dvh flex flex-col bg-slate-50 shadow-2xl overflow-hidden font-sans">
      {activeTab === 'admin' ? (
        <>
          <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('profile')}
              className="text-slate-500 hover:text-slate-800 transition-colors"
            >
              ← 뒤로
            </button>
          </div>
          <AdminPage />
        </>
      ) : (
        <>
          <Header />
          <main className="flex-1 flex flex-col overflow-hidden min-h-0">
            {activeTab === 'home' && <HomePage onStartTutor={() => setActiveTab('ai-tutor')} />}
            {activeTab === 'ai-tutor' && <AiTutorPage />}
            {activeTab === 'notes' && <NotesPage />}
            {activeTab === 'profile' && <ProfilePage onNavigate={setActiveTab} />}
          </main>
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </>
      )}
    </div>
  );
}
