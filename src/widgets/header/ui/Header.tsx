export default function Header() {
  return (
    <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shrink-0 z-10">
      <h1 className="text-base font-black text-slate-800 flex items-center gap-2">
        <span className="text-indigo-600">📐</span>
        GoMath AI
      </h1>
      <span className="flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full font-bold border border-emerald-100">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        온라인
      </span>
    </header>
  );
}
