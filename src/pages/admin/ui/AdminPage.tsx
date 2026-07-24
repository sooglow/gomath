import { useState, useEffect, useRef } from 'react';
import type { Book, Problem, Explanation, UserProfile } from '../../../shared/types';
import {
  fetchBooks, insertBook, deleteBook,
  fetchProblems, insertProblem, deleteProblem,
  fetchExplanation, upsertExplanation,
  fetchAllProfiles, updateUserStatus,
  parsePdf, bulkSaveProblems,
  fetchAllAssignments, insertAssignment, updateAssignment, deleteAssignment, fetchClassNames,
  fetchAssignmentCompletions,
  supabase,
} from '../../../shared/api/supabase';
import type { ParsedProblem, StudentCompletion } from '../../../shared/api/supabase';
import type { Assignment } from '../../../shared/types';

type Step = 'books' | 'problems' | 'explanation' | 'users' | 'pdf' | 'tasks' | 'status';

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

  // ── 유저 ──
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userLoading, setUserLoading] = useState(false);

  // ── 과제 ──
  const [assignments, setAssignments] = useState<Omit<Assignment, 'completed'>[]>([]);
  const [taskBook, setTaskBook] = useState<Book | null>(null);
  const [taskProblems, setTaskProblems] = useState<Problem[]>([]);
  const [taskProblem, setTaskProblem] = useState<Problem | null>(null);
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskNote, setTaskNote] = useState('');
  const [taskClassName, setTaskClassName] = useState('');
  const [classNames, setClassNames] = useState<string[]>([]);
  const [taskLoading, setTaskLoading] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);

  // ── 현황 ──
  const [statusAssignment, setStatusAssignment] = useState<Omit<Assignment, 'completed'> | null>(null);
  const [completions, setCompletions] = useState<StudentCompletion[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const realtimeChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── PDF ──
  const [pdfBook, setPdfBook] = useState<Book | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfResults, setPdfResults] = useState<ParsedProblem[] | null>(null);
  const [pdfChecked, setPdfChecked] = useState<Set<number>>(new Set());
  const [pdfSaving, setPdfSaving] = useState(false);
  const [pdfSaveResult, setPdfSaveResult] = useState<{ saved: number; errors: number } | null>(null);

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

  async function loadUsers() {
    setUserLoading(true);
    try {
      const data = await fetchAllProfiles();
      setUsers(data);
    } catch {
      setError('유저 목록 로드 실패');
    } finally {
      setUserLoading(false);
    }
  }

  async function loadCompletions(assignment: Omit<Assignment, 'completed'>) {
    setStatusLoading(true);
    try {
      const data = await fetchAssignmentCompletions(assignment.id, assignment.class_name ?? null);
      setCompletions(data);
    } catch {
      setError('현황 로드 실패');
    } finally {
      setStatusLoading(false);
    }
  }

  function subscribeCompletions(assignmentId: string) {
    if (realtimeChannel.current) {
      supabase.removeChannel(realtimeChannel.current);
    }
    realtimeChannel.current = supabase
      .channel(`completions_${assignmentId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assignment_completions', filter: `assignment_id=eq.${assignmentId}` },
        () => {
          setStatusAssignment((prev) => { if (prev) loadCompletions(prev); return prev; });
        },
      )
      .subscribe();
  }

  async function handleSelectStatusAssignment(a: Omit<Assignment, 'completed'>) {
    setStatusAssignment(a);
    await loadCompletions(a);
    subscribeCompletions(a.id);
  }

  async function loadAssignments() {
    setAssignmentLoading(true);
    try {
      const [data, names] = await Promise.all([fetchAllAssignments(), fetchClassNames()]);
      setAssignments(data);
      setClassNames(names);
    } catch {
      setError('과제 목록 로드 실패');
    } finally {
      setAssignmentLoading(false);
    }
  }

  async function handleTaskBookChange(book: Book | null) {
    setTaskBook(book);
    setTaskProblem(null);
    setTaskProblems([]);
    if (book) {
      const data = await fetchProblems(book.id);
      setTaskProblems(data);
    }
  }

  function resetTaskForm() {
    setTaskProblem(null);
    setTaskBook(null);
    setTaskProblems([]);
    setTaskDueDate('');
    setTaskNote('');
    setTaskClassName('');
    setEditingAssignmentId(null);
  }

  async function handleEditAssignment(a: Omit<Assignment, 'completed'>) {
    const bookId = a.problems?.book_id;
    const matchedBook = bookId ? books.find((b) => b.id === bookId) ?? null : null;
    setTaskBook(matchedBook);
    if (matchedBook) {
      const probs = await fetchProblems(matchedBook.id);
      setTaskProblems(probs);
      setTaskProblem(probs.find((p) => p.id === a.problems?.id) ?? null);
    }
    setTaskDueDate(a.due_date ?? '');
    setTaskNote(a.note ?? '');
    setTaskClassName(a.class_name ?? '');
    setEditingAssignmentId(a.id);
  }

  async function handleCreateTask() {
    if (!taskProblem) return;
    setTaskLoading(true);
    setError('');
    try {
      if (editingAssignmentId) {
        await updateAssignment(editingAssignmentId, taskProblem.id, taskDueDate || null, taskNote, taskClassName || null);
      } else {
        await insertAssignment(taskProblem.id, taskDueDate || null, taskNote, taskClassName || null);
      }
      resetTaskForm();
      await loadAssignments();
    } catch {
      setError(editingAssignmentId ? '과제 수정 실패' : '과제 등록 실패');
    } finally {
      setTaskLoading(false);
    }
  }

  async function handleDeleteAssignment(id: string) {
    if (!confirm('과제를 삭제할까요?')) return;
    try {
      await deleteAssignment(id);
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setError('과제 삭제 실패');
    }
  }

  async function handleParsePdf() {
    if (!pdfBook || !pdfFile) return;
    if (pdfFile.size > 20 * 1024 * 1024) { setError('PDF 파일이 너무 커요 (최대 20MB)'); return; }
    setError('');
    setPdfLoading(true);
    setPdfResults(null);
    setPdfSaveResult(null);
    try {
      const results = await parsePdf(pdfFile);
      setPdfResults(results);
      setPdfChecked(new Set(results.map((_, i) => i)));
    } catch (e) {
      setError('PDF 분석 실패: ' + (e instanceof Error ? e.message : '알 수 없는 오류'));
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleBulkSave() {
    if (!pdfBook || !pdfResults || pdfChecked.size === 0) return;
    setPdfSaving(true);
    setError('');
    try {
      const selected = pdfResults.filter((_, i) => pdfChecked.has(i));
      const result = await bulkSaveProblems(pdfBook.id, selected);
      setPdfSaveResult(result);
      if (selectedBook?.id === pdfBook.id) loadProblems(pdfBook.id);
    } catch (e) {
      setError('저장 실패: ' + (e instanceof Error ? e.message : ''));
    } finally {
      setPdfSaving(false);
    }
  }

  async function handleUpdateStatus(userId: string, status: 'approved' | 'rejected') {
    try {
      await updateUserStatus(userId, status);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, status } : u));
    } catch {
      setError('상태 변경 실패');
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
        {([
          { key: 'books', label: '교재' },
          { key: 'problems', label: '문항' },
          { key: 'explanation', label: '해설' },
          { key: 'tasks', label: '📋과제' },
          { key: 'status', label: '📊과제현황' },
          { key: 'pdf', label: '📄PDF' },
          { key: 'users', label: '👥승인' },
        ] as { key: Step; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => {
              setStep(key);
              if (key === 'users') loadUsers();
              if (key === 'tasks' || key === 'status') loadAssignments();
            }}
            className={`flex-1 py-2.5 text-[11px] font-semibold transition-colors border-b-2 ${
              step === key ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400'
            }`}
          >
            {label}
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
        {/* ── STEP 4: 과제 관리 ── */}
        {step === 'tasks' && (
          <>
            {/* 과제 등록 */}
            <div className={`bg-white rounded-2xl border p-4 space-y-3 ${editingAssignmentId ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-600">{editingAssignmentId ? '✏️ 과제 수정' : '새 과제 등록'}</p>
                {editingAssignmentId && (
                  <button onClick={resetTaskForm} className="text-[11px] text-slate-400 hover:text-slate-600">취소</button>
                )}
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">교재 선택</label>
                <select
                  value={taskBook?.id ?? ''}
                  onChange={(e) => handleTaskBookChange(books.find((b) => b.id === e.target.value) ?? null)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 bg-white"
                >
                  <option value="">교재를 선택하세요</option>
                  {books.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              {taskProblems.length > 0 && (
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">문항 선택</label>
                  <select
                    value={taskProblem?.id ?? ''}
                    onChange={(e) => setTaskProblem(taskProblems.find((p) => p.id === e.target.value) ?? null)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 bg-white"
                  >
                    <option value="">문항을 선택하세요</option>
                    {taskProblems.map((p) => (
                      <option key={p.id} value={p.id}>{p.page}p {p.number}번{p.topic ? ` · ${p.topic}` : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">반 선택</label>
                <select
                  value={taskClassName}
                  onChange={(e) => setTaskClassName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 bg-white"
                >
                  <option value="">전체반 (모든 학생)</option>
                  {classNames.map((cn) => (
                    <option key={cn} value={cn}>{cn}</option>
                  ))}
                </select>
                {classNames.length === 0 && (
                  <p className="text-[10px] text-slate-400 mt-1">가입한 학생이 없거나 반 정보가 없어요</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">마감일 (선택)</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">학생에게 메시지 (선택)</label>
                <input
                  type="text"
                  value={taskNote}
                  onChange={(e) => setTaskNote(e.target.value)}
                  placeholder="예: 풀이 과정을 꼭 쓰세요!"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400"
                />
              </div>

              <button
                onClick={handleCreateTask}
                disabled={!taskProblem || taskLoading}
                className={`w-full py-2.5 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition-colors ${editingAssignmentId ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-indigo-500 hover:bg-indigo-600'}`}
              >
                {taskLoading ? '처리 중...' : editingAssignmentId ? '수정 저장' : '과제 등록'}
              </button>
            </div>

            {/* 과제 목록 */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <p className="text-xs font-bold text-slate-600 px-4 pt-4 pb-2">
                등록된 과제 ({assignments.length})
              </p>
              {assignmentLoading && <div className="h-16 flex items-center justify-center text-xs text-slate-400">로딩 중...</div>}
              {!assignmentLoading && assignments.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">등록된 과제가 없어요</p>
              )}
              {assignments.map((a) => {
                const p = a.problems;
                return (
                  <div key={a.id} className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-700">
                        {p ? `${p.page}p ${p.number}번` : '문항 없음'}
                        {p?.topic && <span className="ml-1.5 text-[10px] text-indigo-500 font-normal">{p.topic}</span>}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {p?.books?.name ?? ''}
                        {a.due_date && ` · 마감 ${a.due_date}`}
                      </p>
                      <p className="text-[10px] mt-0.5">
                        <span className={`font-bold px-1.5 py-0.5 rounded-full ${a.class_name ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-100 text-slate-400'}`}>
                          {a.class_name ?? '전체반'}
                        </span>
                      </p>
                      {a.note && <p className="text-[10px] text-slate-500 mt-0.5">💬 {a.note}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleEditAssignment(a)}
                        className="text-xs text-indigo-400 hover:text-indigo-600 px-2 py-1"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteAssignment(a.id)}
                        className="text-xs text-red-400 hover:text-red-600 px-2 py-1"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── STEP 5: 과제 완료 현황 ── */}
        {step === 'status' && (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
              <p className="text-xs font-bold text-slate-600 mb-2">과제 선택</p>
              {assignmentLoading && <p className="text-xs text-slate-400 text-center py-4">로딩 중...</p>}
              {!assignmentLoading && assignments.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">등록된 과제가 없어요</p>
              )}
              {assignments.map((a) => {
                const p = a.problems;
                const isSelected = statusAssignment?.id === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => handleSelectStatusAssignment(a)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${
                      isSelected ? 'bg-indigo-50 border-indigo-300' : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-700">
                      {p ? `${p.page}p ${p.number}번` : '문항 없음'}
                      {p?.topic && <span className="ml-1.5 text-[10px] text-indigo-500 font-normal">{p.topic}</span>}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {p?.books?.name ?? ''}
                      {a.due_date && ` · 마감 ${a.due_date}`}
                      {a.class_name ? ` · ${a.class_name}` : ' · 전체반'}
                    </p>
                  </button>
                );
              })}
            </div>

            {statusAssignment && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-600">
                    학생 현황
                    <span className="ml-2 text-indigo-500">
                      {completions.filter((c) => c.completed).length}/{completions.length} 완료
                    </span>
                  </p>
                  <span className="text-[10px] text-emerald-500 font-bold animate-pulse">● 실시간</span>
                </div>

                {statusLoading ? (
                  <div className="py-8 flex justify-center">
                    <div className="w-6 h-6 rounded-full border-4 border-indigo-400 border-t-transparent animate-spin" />
                  </div>
                ) : completions.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">해당 반 학생이 없어요</p>
                ) : (
                  <>
                    {/* 완료율 바 */}
                    <div className="px-4 pb-3">
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-emerald-400 rounded-full h-2 transition-all duration-500"
                          style={{ width: `${Math.round((completions.filter((c) => c.completed).length / completions.length) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {completions.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 px-4 py-3 border-t border-slate-100">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${s.completed ? 'bg-emerald-500' : 'bg-slate-100'}`}>
                          {s.completed
                            ? <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            : <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold ${s.completed ? 'text-slate-700' : 'text-slate-400'}`}>
                            {s.name ?? '이름 없음'}
                          </p>
                          {s.class_name && <p className="text-[10px] text-slate-400">{s.class_name}</p>}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${s.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                          {s.completed ? '완료' : '미완료'}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* ── STEP 5: PDF 일괄 등록 ── */}
        {step === 'pdf' && (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <p className="text-xs font-bold text-slate-600">교재 선택</p>
              <select
                value={pdfBook?.id ?? ''}
                onChange={(e) => { setPdfBook(books.find((b) => b.id === e.target.value) ?? null); setPdfResults(null); setPdfSaveResult(null); }}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 bg-white"
              >
                <option value="">교재를 선택하세요</option>
                {books.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <div>
                <p className="text-xs font-bold text-slate-600 mb-1">교사용 해설집 PDF 업로드</p>
                <p className="text-[10px] text-slate-400 mb-2">최대 15MB · AI가 전체 문제 해설을 자동 추출해요</p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => { setPdfFile(e.target.files?.[0] ?? null); setPdfResults(null); setPdfSaveResult(null); }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                />
              </div>
              <button
                onClick={handleParsePdf}
                disabled={!pdfBook || !pdfFile || pdfLoading}
                className="w-full py-2.5 bg-indigo-500 text-white text-xs font-bold rounded-xl disabled:opacity-40 hover:bg-indigo-600 transition-colors"
              >
                {pdfLoading ? '🤖 AI 분석 중... (잠시 기다려요)' : '분석 시작'}
              </button>
            </div>

            {pdfResults && (
              <>
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3 flex items-center justify-between">
                  <p className="text-xs font-bold text-indigo-700">총 {pdfResults.length}개 문제 추출됨</p>
                  <button
                    onClick={() => setPdfChecked(
                      pdfChecked.size === pdfResults.length
                        ? new Set()
                        : new Set(pdfResults.map((_, i) => i))
                    )}
                    className="text-[11px] text-indigo-600 font-bold"
                  >
                    {pdfChecked.size === pdfResults.length ? '전체 해제' : '전체 선택'}
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  {pdfResults.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => setPdfChecked((prev) => {
                        const next = new Set(prev);
                        next.has(i) ? next.delete(i) : next.add(i);
                        return next;
                      })}
                      className={`flex items-start gap-3 px-4 py-3 border-t border-slate-100 cursor-pointer transition-colors ${pdfChecked.has(i) ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                    >
                      <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${pdfChecked.has(i) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                        {pdfChecked.has(i) && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700">{item.page}p {item.number}번 {item.topic && <span className="text-indigo-500 font-normal">· {item.topic}</span>}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{item.full_explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {pdfSaveResult ? (
                  <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-xs text-green-700 font-medium text-center">
                    ✅ {pdfSaveResult.saved}개 저장 완료
                    {pdfSaveResult.errors > 0 && ` · ${pdfSaveResult.errors}개 실패`}
                  </div>
                ) : (
                  <button
                    onClick={handleBulkSave}
                    disabled={pdfChecked.size === 0 || pdfSaving}
                    className="w-full py-3 bg-emerald-500 text-white text-sm font-bold rounded-2xl disabled:opacity-40 hover:bg-emerald-600 transition-colors"
                  >
                    {pdfSaving ? '저장 중...' : `선택한 ${pdfChecked.size}개 DB에 저장`}
                  </button>
                )}
              </>
            )}
          </>
        )}

        {/* ── STEP 5: 유저 승인 ── */}
        {step === 'users' && (
          <>
            {userLoading && <div className="text-center text-xs text-slate-400 py-8">로딩 중...</div>}
            {!userLoading && users.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">가입 신청자가 없어요</p>
            )}
            {users.map((u) => (
              <div key={u.id} className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{u.name ?? '이름 없음'}</p>
                    <p className="text-xs text-slate-400">{u.school ?? ''} {u.age ? `· ${u.age}세` : ''}</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                    u.status === 'approved' ? 'bg-green-100 text-green-600' :
                    u.status === 'rejected' ? 'bg-red-100 text-red-500' :
                    'bg-amber-100 text-amber-600'
                  }`}>
                    {u.status === 'approved' ? '승인됨' : u.status === 'rejected' ? '거절됨' : '대기 중'}
                  </span>
                </div>
                {u.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(u.id, 'approved')}
                      className="flex-1 py-2 text-xs font-bold bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(u.id, 'rejected')}
                      className="flex-1 py-2 text-xs font-bold bg-red-400 text-white rounded-xl hover:bg-red-500 transition-colors"
                    >
                      거절
                    </button>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
