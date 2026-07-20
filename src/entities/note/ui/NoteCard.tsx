import type { NoteType } from '../../../shared/types';
import { TAG_COLORS } from '../../../shared/constants/data';

type Props = {
  note: NoteType;
};

export default function NoteCard({ note }: Props) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
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
  );
}
