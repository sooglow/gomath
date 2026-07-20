type Filter = 'all' | 'unsolved' | 'solved';

const LABELS: Record<Filter, string> = {
  all: '전체',
  unsolved: '미완료',
  solved: '완료',
};

type Props = {
  value: Filter;
  onChange: (f: Filter) => void;
};

export default function NotesFilter({ value, onChange }: Props) {
  return (
    <div className="bg-white border-b border-slate-100 px-4 py-2.5 shrink-0 flex gap-2">
      {(Object.keys(LABELS) as Filter[]).map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
            value === f ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          {LABELS[f]}
        </button>
      ))}
    </div>
  );
}

export type { Filter };
