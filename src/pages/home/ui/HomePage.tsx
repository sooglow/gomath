import { MOCK_NOTES, TAG_COLORS } from '../../../shared/constants/data';

type Props = { onStartTutor: () => void };

export default function HomePage({ onStartTutor }: Props) {
  const streak = 7;
  const stats = [
    { label: '오늘 질문', value: '3', unit: '개', color: 'text-indigo-600' },
    { label: '이번 주 풀이', value: '18', unit: '문제', color: 'text-emerald-600' },
    { label: '연속 학습', value: `${streak}`, unit: '일', color: 'text-amber-600' },
  ];

  return (
    <div className="p-4 space-y-5 pb-20">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
        <p className="text-indigo-200 text-xs font-medium mb-1">안녕하세요 👋</p>
        <h2 className="text-xl font-bold mb-0.5">김민준 학생!</h2>
        <p className="text-indigo-200 text-sm">오늘도 오답을 정복해 봐요.</p>
        <div className="mt-4 flex items-center gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full ${i < streak ? 'bg-white' : 'bg-indigo-400/50'}`} />
          ))}
          <span className="text-xs text-indigo-200 ml-1 whitespace-nowrap">{streak}일 연속 🔥</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 text-center">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{s.unit}</p>
            <p className="text-[11px] text-slate-600 font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

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

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-700">최근 오답 문제</h3>
          <span className="text-xs text-indigo-600 font-medium">전체보기</span>
        </div>
        <div className="space-y-2.5">
          {MOCK_NOTES.slice(0, 3).map((note) => (
            <div key={note.id} className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${note.solved ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                {note.solved
                  ? <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                  : <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700 truncate">{note.book} · {note.page} {note.problem}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">"{note.hint}"</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${TAG_COLORS[note.tag] ?? 'bg-slate-100 text-slate-500'}`}>
                {note.tag}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">🎯</span>
          <h3 className="text-sm font-bold text-amber-800">오늘의 목표</h3>
        </div>
        <div className="space-y-2">
          {[
            { label: '이차방정식 5문제 풀기', done: true },
            { label: '오답노트 정리하기', done: true },
            { label: '심화 문제 1문제 도전', done: false },
          ].map((goal) => (
            <div key={goal.label} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${goal.done ? 'bg-amber-500 border-amber-500' : 'border-amber-300'}`}>
                {goal.done && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
              </div>
              <span className={`text-xs ${goal.done ? 'line-through text-amber-400' : 'text-amber-800'}`}>{goal.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
