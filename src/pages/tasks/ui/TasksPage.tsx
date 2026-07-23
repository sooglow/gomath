import { useState, useEffect } from 'react';
import type { Assignment } from '../../../shared/types';
import { fetchAssignments, toggleAssignmentDone } from '../../../shared/api/supabase';

const TOPIC_COLORS: Record<string, string> = {
  '이차방정식': 'bg-indigo-50 text-indigo-600',
  '인수분해':   'bg-violet-50 text-violet-600',
  '연립방정식': 'bg-sky-50 text-sky-600',
};

type Props = { onStartTutor: () => void; userId: string };

export default function TasksPage({ onStartTutor, userId }: Props) {
  const [tasks, setTasks] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  });
  const todayISO = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchAssignments(userId)
      .then(setTasks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const doneCount = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  async function handleToggle(id: string, currentDone: boolean) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed: !currentDone } : t));
    try {
      await toggleAssignmentDone(id, userId, !currentDone);
    } catch {
      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed: currentDone } : t));
    }
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
    </div>
  );

  if (total === 0) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 p-8">
      <span className="text-4xl">📋</span>
      <p className="text-sm font-medium">등록된 과제가 없어요</p>
      <p className="text-xs text-center">선생님이 과제를 등록하면 여기 나타나요</p>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">

      {/* 진행률 헤더 */}
      <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg">
        <p className="text-violet-200 text-xs font-medium mb-1">{todayStr}</p>
        <h2 className="text-lg font-extrabold mb-3">오늘의 과제</h2>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold">{doneCount}/{total} 완료</span>
          <span className="text-sm font-bold">{progress}%</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className="bg-white rounded-full h-2 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {doneCount === total && (
          <p className="mt-3 text-xs font-bold text-violet-200">🎉 오늘 과제 모두 완료!</p>
        )}
      </div>

      {/* 과제 목록 */}
      <div className="space-y-2.5">
        {tasks.map((task, i) => {
          const p = task.problems;
          const topic = p?.topic ?? '';
          const isToday = task.due_date === todayISO;
          const isOverdue = task.due_date && task.due_date < todayISO && !task.completed;

          return (
            <div
              key={task.id}
              className={`bg-white rounded-2xl border p-4 shadow-sm transition-all ${
                task.completed ? 'border-emerald-100 opacity-60' : isOverdue ? 'border-rose-200' : 'border-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggle(task.id, task.completed)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    task.completed
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-slate-300 hover:border-emerald-400'
                  }`}
                >
                  {task.completed && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                      {i + 1}. {p ? `${p.page}p ${p.number}번` : '문항 정보 없음'}
                    </span>
                    {topic && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TOPIC_COLORS[topic] ?? 'bg-slate-100 text-slate-500'}`}>
                        {topic}
                      </span>
                    )}
                    {isToday && !task.completed && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">오늘 마감</span>
                    )}
                    {isOverdue && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-500">기한 초과</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{p?.books?.name ?? ''}</p>
                  {task.note && (
                    <p className="text-[11px] text-slate-500 mt-1 bg-slate-50 rounded-lg px-2 py-1">💬 {task.note}</p>
                  )}
                </div>
              </div>

              {!task.completed && (
                <button
                  onClick={onStartTutor}
                  className="mt-3 w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  AI 튜터에게 질문하기
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
