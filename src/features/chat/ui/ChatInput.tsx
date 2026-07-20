import { useRef } from 'react';

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
};

export default function ChatInput({ value, onChange, onSubmit, onFileSelect, disabled }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="p-3 bg-white border-t border-slate-100 shrink-0 space-y-2">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileSelect} />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="w-full border border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl py-2.5 px-3 flex items-center justify-between group hover:border-indigo-400 hover:bg-indigo-50 transition-all active:scale-[0.99] disabled:opacity-50"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white rounded-lg border border-indigo-100 shadow-sm text-indigo-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <circle cx="12" cy="13" r="3" strokeWidth="2" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-slate-700">문제 + 연습장 풀이 한 장으로 찍기</p>
            <p className="text-[10px] text-slate-400">함께 올려야 더 정확한 힌트를 받을 수 있어요</p>
          </div>
        </div>
        <span className="shrink-0 text-xs font-bold text-indigo-600 bg-white px-2.5 py-1 rounded-lg border border-indigo-100 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
          촬영
        </span>
      </button>

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="선생님께 질문하세요..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="bg-indigo-600 disabled:bg-indigo-300 hover:bg-indigo-700 text-white font-bold rounded-xl px-4 py-2.5 transition-colors shadow-sm active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
}
