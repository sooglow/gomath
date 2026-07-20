import { useState } from 'react';
import { MOCK_NOTES, TAG_COLORS } from '../../constants/data';

type Filter = 'all' | 'unsolved' | 'solved';

export default function NotesTab() {
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = MOCK_NOTES.filter((n) => {
    if (filter === 'unsolved') return !n.solved;
    if (filter === 'solved') return n.solved;
    return true;
  });

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* 요약 */}
      <div className="bg-white border-b border-slate-100 p-4 shrink-0">
        <h2 className="text-sm font-bold text-slate-700 mb-3">내 오답노트</h2>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-50 rounded-xl p-2.5">
            <p className="text-lg font-extrabold text-slate-700">{MOCK_NOTES.length}</p>
            <p className="text-[10px] text-slate-400">전체</p>
          </div>
          <div className="bg-rose-50 rounded-xl p-2.5">
            <p className="text-lg font-extrabold text-rose-500">{MOCK_NOTES.filter((n) => !n.solved).length}</p>
            <p className="text-[10px] text-rose-400">미완료</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-2.5">
            <p className="text-lg font-extrabold text-emerald-500">{MOCK_NOTES.filter((n) => n.solved).length}</p>
            <p className="text-[10px] text-emerald-400">완료</p>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white border-b border-slate-100 px-4 py-2.5 shrink-0 flex gap-2">
        {(['all', 'unsolved', 'solved'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
              filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {f === 'all' ? '전체' : f === 'unsolved' ? '미완료' : '완료'}
          </button>
        ))}
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20">
        {filtered.map((note) => (
          <div key={note.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-xs font-bold text-slate-700">{note.book}</p>
                <p className="text-xs text-slate-400 mt-0.5">{note.page} {note.problem} · {note.date}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TAG_COLORS[note.tag] ?? 'bg-slate-100 text-slate-500'}`}>
                  {note.tag}
                </span>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${note.solved ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                  {note.solved
                    ? <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                    : <svg className="w-3 h-3 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  }
                </div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl px-3 py-2.5 flex items-start gap-2">
              <span className="text-indigo-500 text-sm mt-0.5">💡</span>
              <p className="text-xs text-slate-600 leading-relaxed">"{note.hint}"</p>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="flex-1 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 py-2 rounded-xl transition-colors">
                다시 풀기
              </button>
              <button className="flex-1 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 py-2 rounded-xl transition-colors">
                AI에게 질문
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
