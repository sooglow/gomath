import { useState } from "react";
import { signIn, signUp } from "../../../shared/api/supabase";

export default function LoginPage() {
    const [mode, setMode] = useState<"login" | "signup">("login");

    // 로그인
    const [loginName, setLoginName] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    // 가입
    const [name, setName] = useState("");
    const [school, setSchool] = useState("");
    const [grade, setGrade] = useState("");
    const [className, setClassName] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            if (mode === "login") {
                await signIn(loginName, loginPassword);
            } else {
                await signUp(name, school, grade, className, 0, password);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "오류가 발생했어요");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="mb-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black mx-auto mb-3 shadow-lg">
                    G
                </div>
                <h1 className="text-xl font-black text-slate-800">GoMath AI</h1>
                <p className="text-sm text-slate-400 mt-1">수학 AI 튜터</p>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-3">
                {mode === "login" ? (
                    <>
                        <input
                            type="text"
                            value={loginName}
                            onChange={(e) => setLoginName(e.target.value)}
                            placeholder="이름"
                            required
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                        />
                        <input
                            type="password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="비밀번호"
                            required
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                        />
                    </>
                ) : (
                    <>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="이름"
                            required
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="text"
                                value={school}
                                onChange={(e) => setSchool(e.target.value)}
                                placeholder="학교 (예: 미사고)"
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                            />
                            <input
                                type="text"
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                                placeholder="학년 (예: 중3)"
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                            />
                        </div>
                        <input
                            type="text"
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                            placeholder="반 (예: 중3B반)"
                            required
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="비밀번호 (6자 이상)"
                            required
                            minLength={6}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                        />
                    </>
                )}

                {error && <p className="text-xs text-red-500 text-center">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl py-3 text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                    {loading ? "처리중..." : mode === "login" ? "로그인" : "회원가입"}
                </button>
            </form>

            <button
                onClick={() => {
                    setMode(mode === "login" ? "signup" : "login");
                    setError("");
                }}
                className="mt-4 text-sm text-slate-400"
            >
                {mode === "login" ? "계정이 없어? " : "이미 계정이 있어? "}
                <span className="text-indigo-600 font-bold">
                    {mode === "login" ? "회원가입" : "로그인"}
                </span>
            </button>
        </div>
    );
}
