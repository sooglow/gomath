import { useState } from 'react';
import type { TabType, UserProfile } from '../../../shared/types';
import { updateMyProfile, updateMyPassword } from '../../../shared/api/supabase';

type Props = {
  onNavigate: (tab: TabType) => void;
  profile: UserProfile | null;
  onSignOut: () => void;
  onProfileUpdated?: (updated: Partial<UserProfile>) => void;
};

export default function ProfilePage({ onNavigate, profile, onSignOut, onProfileUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name ?? '');
  const [school, setSchool] = useState(profile?.school ?? '');
  const [grade, setGrade] = useState(profile?.grade ?? '');
  const [className, setClassName] = useState(profile?.class_name ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (newPassword && newPassword !== confirmPassword) {
      setSaveError('비밀번호가 일치하지 않아.');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setSaveError('비밀번호는 6자 이상이어야 해.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      await updateMyProfile({ name: name.trim(), school: school.trim(), grade: grade.trim(), class_name: className.trim() });
      if (newPassword) await updateMyPassword(newPassword);
      setSaved(true);
      setEditing(false);
      onProfileUpdated?.({ name: name.trim(), school: school.trim(), grade: grade.trim(), class_name: className.trim() });
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaveError('저장에 실패했어요. 다시 시도해봐.');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setName(profile?.name ?? '');
    setSchool(profile?.school ?? '');
    setGrade(profile?.grade ?? '');
    setClassName(profile?.class_name ?? '');
    setNewPassword('');
    setConfirmPassword('');
    setSaveError('');
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex-1 overflow-y-auto pb-20">
        {/* 수정 헤더 */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 px-4 pt-6 pb-10">
          <button onClick={handleCancel} className="text-indigo-200 text-sm mb-4 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            뒤로
          </button>
          <h2 className="text-white text-lg font-extrabold">내 정보 수정</h2>
          <p className="text-indigo-200 text-xs mt-1">정보를 수정하고 저장해줘</p>
        </div>

        {/* 폼 카드 — 헤더 위로 올라오는 효과 */}
        <div className="mx-4 -mt-6 bg-white rounded-2xl shadow-lg border border-slate-100 p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">이름</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력해줘"
              className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all placeholder-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">학교</label>
            <input
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="예: 미사고"
              className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all placeholder-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">학년</label>
              <input
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="예: 중3"
                className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all placeholder-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">반</label>
              <input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="예: 중3B반"
                className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all placeholder-slate-300"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 mb-3">비밀번호 변경 (선택)</p>
            <div className="space-y-3">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호 (6자 이상)"
                className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all placeholder-slate-300"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="새 비밀번호 확인"
                className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all placeholder-slate-300"
              />
            </div>
          </div>

          {saveError && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{saveError}</p>
          )}
        </div>

        {/* 저장 버튼 */}
        <div className="px-4 mt-4">
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="w-full py-4 text-sm font-extrabold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-20">

      {/* 프로필 헤더 배경 */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 px-4 pt-6 pb-12">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-2xl font-black shadow-lg">
            {profile?.role === 'teacher' ? '선' : '학'}
          </div>
          <div>
            <h2 className="text-white text-lg font-extrabold">
              {profile?.name ?? (profile?.role === 'teacher' ? '선생님' : '학생')}
            </h2>
            <p className="text-indigo-200 text-xs mt-0.5">
              {profile?.role === 'teacher' ? '교사 계정' : '학생 계정'}
              {profile?.class_name && ` · ${profile.class_name}`}
            </p>
          </div>
        </div>
      </div>

      {/* 내 정보 카드 */}
      <div className="mx-4 -mt-6 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-50">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">내 정보</h3>
          <button
            onClick={() => {
              setName(profile?.name ?? '');
              setSchool(profile?.school ?? '');
              setGrade(profile?.grade ?? '');
              setClassName(profile?.class_name ?? '');
              setNewPassword('');
              setConfirmPassword('');
              setSaveError('');
              setEditing(true);
            }}
            className="text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors"
          >
            수정
          </button>
        </div>
        {[
          { label: '이름', value: profile?.name },
          { label: '학교', value: profile?.school },
          { label: '학년', value: profile?.grade },
          { label: '반', value: profile?.class_name },
        ].map((row, i, arr) => (
          <div key={row.label} className={`flex items-center justify-between px-5 py-3.5 ${i < arr.length - 1 ? 'border-b border-slate-50' : ''}`}>
            <span className="text-xs text-slate-400 font-medium">{row.label}</span>
            <span className="text-sm font-semibold text-slate-700">{row.value || '—'}</span>
          </div>
        ))}
        {saved && (
          <div className="px-5 py-3 bg-emerald-50 text-center text-xs font-bold text-emerald-600">
            ✅ 저장됐어!
          </div>
        )}
      </div>

      {/* 버튼 영역 */}
      <div className="px-4 mt-4 space-y-3">
        {profile?.role === 'teacher' && (
          <button
            onClick={() => onNavigate('admin')}
            className="w-full py-3.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            관리자 콘텐츠 관리
          </button>
        )}
        <button
          onClick={onSignOut}
          className="w-full py-3.5 text-sm font-bold text-rose-500 bg-rose-50 rounded-2xl hover:bg-rose-100 transition-colors"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
