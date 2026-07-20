import { useState, useEffect } from 'react';
import type { Book, Problem, Explanation } from '../../../shared/types';
import {
  fetchBooks, insertBook, deleteBook,
  fetchProblems, insertProblem, deleteProblem,
  fetchExplanation, upsertExplanation,
} from '../../../shared/api/supabase';

type Step = 'books' | 'problems' | 'explanation';

export default function AdminPage() {
  const [step, setStep] = useState<Step>('books');

  // ── 교재 ──
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [newBookName, setNewBookName] = useState('');
  const [bookLoading, setBookLoading] = useState(false);

  // ── 문항 ──
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [newPage, setNewPage] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [problemLoading, setProblemLoading] = useState(false);

  // ── 해설 ──
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [fullExplanation, setFullExplanation] = useState('');
  const [keyConcepts, setKeyConcepts] = useState('');
  const [hintSteps, setHintSteps] = useState('');
  const [expLoading, setExpLoading] = useState(false);
  const [expSaved, setExpSaved] = useState(false);

  const [error, setError] = useState('');

  // 교재 로드
  useEffect(() => {
    loadBooks();
  }, []);

  // 문항 로드
  useEffect(() => {
    if (!selectedBook) return;
    loadProblems(selectedBook.id);
  }, [selectedBook]);

  // 해설 로드
  useEffect(() => {
    if (!selectedProblem) return;
    setExpSaved(false);
    fetchExplanation(selectedProblem.id)
      .then((data) => {
        setExplanation(data);
        setFullExplanation(data?.full_explanation ?? '');
        setKeyConcepts(data?.key_concepts?.join(', ') ?? '');
        setHintSteps(data?.hint_steps?.join('\n') ?? '');
      })
      .catch(() => setError('해설 로드 실패'));
  }, [selectedProblem]);

  async function loadBooks() {
    setBookLoading(true);
    try {
      const data = await fetchBooks();
      setBooks(data);
    } catch {
      setError('교재 목록 로드 실패');
    } finally {
      setBookLoading(false);
    }
  }

  async function loadProblems(bookId: string) {
    setProblemLoading(true);
    try {
      const data = await fetchProblems(bookId);
      setProblems(data);
      setSelectedProblem(null);
    } catch {
      setError('문항 목록 로드 실패');
    } finally {
      setProblemLoading(false);
    }
  }

  async function handleAddBook() {
    if (!newBookName.trim()) return;
    setError('');
    try {
      const book = await insertBook(newBookName.trim());
      setBooks((prev) => [...prev, book]);
      setNewBookName('');
    } catch {
      setError('교재 추가 실패 (중복 이름 확인)');
    }
  }

  async function handleDeleteBook(id: string) {
    if (!confirm('교재와 모든 문항/해설이 삭제됩니다. 계속할까요?')) return;
    try {
      await deleteBook(id);
      setBooks((prev) => prev.filter((b) => b.id !== id));
      if (selectedBook?.id === id) { setSelectedBook(null); setProblems([]); }
    } catch {
      setError('교재 삭제 실패');
    }
  }

  async function handleAddProblem() {
    if (!selectedBook || !newPage.trim() || !newNumber.trim()) return;
    setError('');
    try {
      const problem = await insertProblem(selectedBook.id, newPage.trim(), newNumber.trim(), newTopic.trim());
      setProblems((prev) => [...prev, problem]);
      setNewPage(''); setNewNumber(''); setNewTopic('');
    } catch {
      setError('문항 추가 실패 (중복 확인)');
    }
  }

  async function handleDeleteProblem(id: string) {
    if (!confirm('문항과 해설이 삭제됩니다. 계속할까요?')) return;
    try {
      await deleteProblem(id);
      setProblems((prev) => prev.filter((p) => p.id !== id));
      if (selectedProblem?.id === id) setSelectedProblem(null);
    } catch {
      setError('문항 삭제 실패');
    }
  }

  async function handleSaveExplanation() {
    if (!selectedProblem || !fullExplanation.trim()) return;
    setError('');
    setExpLoading(true);
    try {
      const concepts = keyConcepts.split(',').map((s) => s.trim()).filter(Boolean);
      const steps = hintSteps.split('\n').map((s) => s.trim()).filter(Boolean);
      const data = await upsertExplanation(selectedProblem.id, fullExplanation.trim(), concepts, steps);
      setExplanation(data);
      setExpSaved(true);
    } catch {
      setError('해설 저장 실패');
    } finally {
      setExpLoading(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-slate-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 shrink-0">
        <h2 className="text-sm font-bold text-slate-800">관리자 · 콘텐츠 관리</h2>
        <p className="text-[11px] text-slate-400 mt-0.5">교재 → 문항 → 해설 순서로 입력하세요</p>
      </div>

      {/* 스텝 탭 */}
      <div className="bg-white border-b border-slate-100 flex shrink-0">
        {(['books', 'problems', 'explanation'] as Step[]).map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(s)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
              step === s ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400'
            }`}
          >
            {i + 1}. {s === 'books' ? '교재' : s === 'problems' ? '문항' : '해설'}
          </button>
        ))}
      </div>

      {error && (
        <div className="mx-4 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ── STEP 1: 교재 ── */}
        {step === 'books' && (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <p className="text-xs font-bold text-slate-600">새 교재 추가</p>
              <div className="flex gap-2">
                <input
                  value={newBookName}
                  onChange={(e) => setNewBookName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddBook()}
                  placeholder="예: 개념원리 중3-1"
                  className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400"
                />
                <button
                  onClick={handleAddBook}
                  disabled={!newBookName.trim()}
                  className="text-xs bg-indigo-500 text-white font-bold px-4 rounded-xl disabled:opacity-40 hover:bg-indigo-600 transition-colors"
                >
                  추가
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <p className="text-xs font-bold text-slate-600 px-4 pt-4 pb-2">
                교재 목록 ({books.length})
              </p>
              {bookLoading && <div className="h-16 flex items-center justify-center text-xs text-slate-400">로딩 중...</div>}
              {!bookLoading && books.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">등록된 교재가 없어요</p>
              )}
              {books.map((book) => (
                <div
                  key={book.id}
                  className={`flex items-center justify-between px-4 py-3 border-t border-slate-100 cursor-pointer transition-colors ${
                    selectedBook?.id === book.id ? 'bg-indigo-50' : 'hover:bg-slate-50'
                  }`}
                  onClick={() => { setSelectedBook(book); setStep('problems'); }}
                >
                  <span className="text-sm text-slate-700">{book.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteBook(book.id); }}
                    className="text-xs text-red-400 hover:text-red-600 px-2 py-1"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>

            {books.length > 0 && (
              <button
                onClick={() => setStep('problems')}
                disabled={!selectedBook}
                className="w-full py-3 bg-indigo-500 text-white text-sm font-bold rounded-2xl disabled:opacity-40 hover:bg-indigo-600 transition-colors"
              >
                {selectedBook ? `"${selectedBook.name}" 문항 관리 →` : '교재를 먼저 선택하세요'}
              </button>
            )}
          </>
        )}

        {/* ── STEP 2: 문항 ── */}
        {step === 'problems' && (
          <>
            {!selectedBook ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-700 text-center">
                먼저 교재 탭에서 교재를 선택해주세요
              </div>
            ) : (
              <>
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-2.5 text-xs text-indigo-700 font-medium">
                  📚 {selectedBook.name}
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                  <p className="text-xs font-bold text-slate-600">새 문항 추가</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">페이지</label>
                      <input
                        value={newPage}
                        onChange={(e) => setNewPage(e.target.value)}
                        placeholder="32"
                        className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">번호</label>
                      <input
                        value={newNumber}
                        onChange={(e) => setNewNumber(e.target.value)}
                        placeholder="5"
                        className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">단원/개념 태그</label>
                    <input
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      placeholder="예: 이차방정식"
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <button
                    onClick={handleAddProblem}
                    disabled={!newPage.trim() || !newNumber.trim()}
                    className="w-full py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl disabled:opacity-40 hover:bg-indigo-600 transition-colors"
                  >
                    문항 추가
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <p className="text-xs font-bold text-slate-600 px-4 pt-4 pb-2">
                    문항 목록 ({problems.length})
                  </p>
                  {problemLoading && <div className="h-16 flex items-center justify-center text-xs text-slate-400">로딩 중...</div>}
                  {!problemLoading && problems.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">등록된 문항이 없어요</p>
                  )}
                  {problems.map((p) => (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between px-4 py-3 border-t border-slate-100 cursor-pointer transition-colors ${
                        selectedProblem?.id === p.id ? 'bg-indigo-50' : 'hover:bg-slate-50'
                      }`}
                      onClick={() => { setSelectedProblem(p); setStep('explanation'); }}
                    >
                      <div>
                        <span className="text-sm text-slate-700">{p.page}p {p.number}번</span>
                        {p.topic && <span className="ml-2 text-[10px] text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full">{p.topic}</span>}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteProblem(p.id); }}
                        className="text-xs text-red-400 hover:text-red-600 px-2 py-1"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── STEP 3: 해설 ── */}
        {step === 'explanation' && (
          <>
            {!selectedProblem ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-700 text-center">
                먼저 문항 탭에서 문항을 선택해주세요
              </div>
            ) : (
              <>
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-2.5 text-xs text-indigo-700 font-medium">
                  📄 {selectedBook?.name} · {selectedProblem.page}p {selectedProblem.number}번
                  {selectedProblem.topic && ` · ${selectedProblem.topic}`}
                </div>

                {explanation && (
                  <div className="bg-green-50 border border-green-200 rounded-2xl px-3 py-2 text-xs text-green-700">
                    ✅ 해설이 등록되어 있어요. 수정 후 저장하면 덮어씌워집니다.
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">
                      전체 풀이 해설 <span className="text-red-400">*</span>
                    </label>
                    <p className="text-[10px] text-slate-400 mb-2">AI가 이 해설을 참고해 힌트를 생성합니다. 상세할수록 좋아요.</p>
                    <textarea
                      value={fullExplanation}
                      onChange={(e) => setFullExplanation(e.target.value)}
                      placeholder="예: 이 문제는 이차방정식 ax²+bx+c=0에서 근의 공식을 이용한다. a=1, b=-5, c=6이므로 판별식 D=b²-4ac=25-24=1>0이 되어 두 개의 실근을 가진다. x=(5±1)/2이므로 x=3 또는 x=2이다."
                      rows={6}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-400 resize-none leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">핵심 개념 키워드</label>
                    <p className="text-[10px] text-slate-400 mb-2">쉼표로 구분해 입력하세요</p>
                    <input
                      value={keyConcepts}
                      onChange={(e) => setKeyConcepts(e.target.value)}
                      placeholder="예: 근의 공식, 판별식, 이차방정식"
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">단계별 힌트 가이드</label>
                    <p className="text-[10px] text-slate-400 mb-2">한 줄에 하나씩 입력하세요 (AI가 순서 참고용으로 사용)</p>
                    <textarea
                      value={hintSteps}
                      onChange={(e) => setHintSteps(e.target.value)}
                      placeholder={"a, b, c 값을 파악해봐\n판별식 D=b²-4ac를 계산해봐\n근의 공식에 대입해봐"}
                      rows={4}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-400 resize-none leading-relaxed"
                    />
                  </div>

                  <button
                    onClick={handleSaveExplanation}
                    disabled={!fullExplanation.trim() || expLoading}
                    className="w-full py-3 bg-indigo-500 text-white text-sm font-bold rounded-2xl disabled:opacity-40 hover:bg-indigo-600 transition-colors"
                  >
                    {expLoading ? '저장 중...' : expSaved ? '✅ 저장 완료!' : '해설 저장'}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
