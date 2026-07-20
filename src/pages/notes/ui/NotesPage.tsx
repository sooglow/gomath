import { useState } from 'react';
import { MOCK_NOTES } from '../../../shared/constants/data';
import NoteCard from '../../../entities/note/ui/NoteCard';
import NotesFilter, { type Filter } from '../../../features/notes-filter/ui/NotesFilter';

export default function NotesPage() {
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = MOCK_NOTES.filter((n) => {
    if (filter === 'unsolved') return !n.solved;
    if (filter === 'solved') return n.solved;
    return true;
  });

  return (
    <div className="flex flex-col flex-1 min-h-0">
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

      <NotesFilter value={filter} onChange={setFilter} />

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20">
        {filtered.map((note) => <NoteCard key={note.id} note={note} />)}
      </div>
    </div>
  );
}
