import { useState, useEffect } from 'react';
import type { Assignment } from '../../../shared/types';
import { fetchAssignments } from '../../../shared/api/supabase';

type Props = {
  onStartTutor: () => void;
  onGoToTasks: () => void;
  userName?: string | null;
  userRole?: string | null;
  userId?: string | null;
};

export default function HomePage({ onStartTutor, onGoToTasks, userName, userRole, userId }: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const todayISO = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    fetchAssignments(userId)
      .then(setAssignments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const total = assignments.length;
  const doneCount = assignments.filter((a) => a.completed).length;
  const pendingCount = total - doneCount;
  const dueTodayCount = assignments.filter((a) => a.due_date === todayISO && !a.completed).length;
  const overdueCount = assignments.filter((a) => a.due_date && a.due_date < todayISO && !a.completed).length;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const upcoming = assignments
    .filter((a) => !a.completed)
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    })
    .slice(0, 3);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">

      {/* 인사 헤더 */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
        <p className="text-indigo-200 text-xs font-medium mb-1">안녕하세요 👋</p>
        <h2 className="text-xl font-bold mb-1">
          {userName
            ? userRole === 'teacher' ? `${userName} 관리자님` : `${userName} 학생`
            : '학생'}!
        </h2>
        <p className="text-indigo-200 text-sm mb-4">
          {pendingCount > 0 ? `아직 ${pendingCount}개 과제가 남아 있어요.` : total > 0 ? '🎉 모든 과제를 완료했어요!' : '오늘도 열심히 해봐요!'}
        </p>
        {total > 0 && (
          <>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-indigo-200">{doneCount}/{total} 완료</span>
              <span className="text-xs font-bold">{progress}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        )}
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 text-center">
          <p className="text-2xl font-extrabold text-rose-500">{pendingCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">개</p>
          <p className="text-[11px] text-slate-600 font-medium mt-1">미완료 과제</p>
        </div>
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 text-center">
          <p className="text-2xl font-extrabold text-amber-500">{dueTodayCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">개</p>
          <p className="text-[11px] text-slate-600 font-medium mt-1">오늘 마감</p>
        </div>
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 text-center">
          <p className="text-2xl font-extrabold text-emerald-500">{doneCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">개</p>
          <p className="text-[11px] text-slate-600 font-medium mt-1">완료</p>
        </div>
      </div>

      {/* AI 튜터 버튼 */}
      <button
        onClick={onStartTutor}
        className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-2xl p-4 flex items-center justify-between shadow-md transition-all"
      >
        <div className="text-left">
          <p className="font-bold text-base">AI 튜터에게 질문하기</p>
          <p className="text-indigo-200 text-xs mt-0.5">문제 사진을 찍어 즉시 힌트 받기</p>
        </div>
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {/* 미완료 과제 목록 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-700">남은 과제</h3>
          <button onClick={onGoToTasks} className="text-xs text-indigo-600 font-medium">전체보기</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 rounded-full border-3 border-indigo-400 border-t-transparent animate-spin" />
          </div>
        ) : upcoming.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-sm font-bold text-slate-600">남은 과제가 없어요</p>
            <p className="text-xs text-slate-400 mt-1">선생님이 과제를 등록하면 여기 나타나요</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcoming.map((a) => {
              const p = a.problems;
              const isToday = a.due_date === todayISO;
              const isOverdue = a.due_date && a.due_date < todayISO;
              return (
                <div
                  key={a.id}
                  className={`bg-white rounded-2xl border p-4 shadow-sm ${isOverdue ? 'border-rose-200' : 'border-slate-100'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isOverdue ? 'bg-rose-50' : 'bg-indigo-50'}`}>
                      <svg className={`w-4 h-4 ${isOverdue ? 'text-rose-400' : 'text-indigo-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-700">
                          {p ? `${p.page}p ${p.number}번` : '문항 정보 없음'}
                        </span>
                        {p?.topic && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-500">{p.topic}</span>
                        )}
                        {isToday && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">오늘 마감</span>
                        )}
                        {isOverdue && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-500">기한 초과</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {p?.books?.name ?? ''}
                        {a.due_date && ` · 마감 ${a.due_date}`}
                      </p>
                    </div>
                  </div>
                  {a.note && (
                    <p className="text-[11px] text-slate-500 mt-2 bg-slate-50 rounded-lg px-2 py-1">💬 {a.note}</p>
                  )}
                  <button
                    onClick={onStartTutor}
                    className="mt-3 w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
                  >
                    AI 튜터에게 질문하기
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 기한 초과 경고 */}
      {overdueCount > 0 && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-xl shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-bold text-rose-700">기한 초과 과제 {overdueCount}개</p>
            <p className="text-xs text-rose-400 mt-0.5">빨리 해결하고 선생님께 알려드려요</p>
          </div>
          <button onClick={onGoToTasks} className="ml-auto text-xs font-bold text-rose-500 shrink-0">보기</button>
        </div>
      )}
    </div>
  );
}
