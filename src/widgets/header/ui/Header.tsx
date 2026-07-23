type Props = {
  userName?: string | null;
  onSignOut?: () => void;
};

export default function Header({ userName, onSignOut }: Props) {
  return (
    <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shrink-0 z-10">
      <h1 className="text-base font-black text-slate-800 flex items-center gap-2">
        <span className="text-indigo-600">📐</span>
        GoMath AI
      </h1>
      <div className="flex items-center gap-2">
        {userName && (
          <span className="text-[11px] text-slate-500 font-medium">{userName}님.</span>
        )}
        {onSignOut && (
          <button
            onClick={onSignOut}
            className="text-[11px] font-bold text-slate-500 hover:text-rose-500 bg-slate-100 hover:bg-rose-50 px-3 py-1.5 rounded-full transition-colors"
          >
            로그아웃
          </button>
        )}
      </div>
    </header>
  );
}
