import { useState, useRef, useEffect } from 'react';
import type { MessageType, Book, Problem, Explanation } from '../../../shared/types';
import { fetchBooks, fetchProblems, fetchExplanation } from '../../../shared/api/supabase';
import { getHintFromImage, getHintFromText } from '../../../shared/api/gemini';
import MessageBubble from '../../../entities/message/ui/MessageBubble';
import ChatInput from '../../../features/chat/ui/ChatInput';

const QUICK_QUESTIONS = ['어떻게 시작해야 해?', '핵심 개념이 뭐야?', '다시 처음부터 설명해줘'];

const WELCOME: MessageType = {
  id: 'welcome',
  sender: 'ai',
  text: '반가워! 오늘 어떤 문제를 같이 풀어볼까? 🙌\n\n위에서 교재와 문제 번호를 선택하고, 연습장에 푼 부분과 문제를 함께 사진으로 찍어서 보내줘!',
  timestamp: new Date(),
};

export default function AiTutorPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [explanation, setExplanation] = useState<Explanation | null>(null);

  const [messages, setMessages] = useState<MessageType[]>([WELCOME]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // 교재 목록 초기 로드
  useEffect(() => {
    fetchBooks()
      .then((data) => {
        setBooks(data);
        if (data.length > 0) setSelectedBook(data[0]);
      })
      .catch(console.error)
      .finally(() => setLoadingBooks(false));
  }, []);

  // 교재 변경 시 문항 목록 로드
  useEffect(() => {
    if (!selectedBook) return;
    setSelectedProblem(null);
    setExplanation(null);
    fetchProblems(selectedBook.id)
      .then((data) => {
        setProblems(data);
        if (data.length > 0) setSelectedProblem(data[0]);
      })
      .catch(console.error);
  }, [selectedBook]);

  // 문항 변경 시 해설 로드
  useEffect(() => {
    if (!selectedProblem) return;
    setExplanation(null);
    fetchExplanation(selectedProblem.id)
      .then(setExplanation)
      .catch(console.error);
  }, [selectedProblem]);

  const addAiMessage = (text: string) => {
    setIsTyping(false);
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: 'ai', text, hasAudio: true, timestamp: new Date() },
    ]);
  };

  const addErrorMessage = () => {
    setIsTyping(false);
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: 'ai', text: '앗, 잠깐 오류가 생겼어. 다시 한번 물어봐줄래? 😅', timestamp: new Date() },
    ]);
  };

  const getContext = () => ({
    book: selectedBook?.name ?? '',
    problem: selectedProblem ? `${selectedProblem.page}페이지 ${selectedProblem.number}번` : '',
    explanation,
  });

  const handleSendMessage = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;
    const text = inputText.trim();
    setMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'user', text, timestamp: new Date() }]);
    setInputText('');
    setIsTyping(true);
    try {
      const hint = await getHintFromText(text, getContext());
      addAiMessage(hint);
    } catch {
      addErrorMessage();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const imageUrl = URL.createObjectURL(file);
    setMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'user', text: '📷 풀이 사진을 보냈어요', imageUrl, timestamp: new Date() }]);
    e.target.value = '';
    setIsTyping(true);
    try {
      const hint = await getHintFromImage(file, getContext());
      addAiMessage(hint);
    } catch {
      addErrorMessage();
    }
  };

  const handleQuickQuestion = async (q: string) => {
    if (isTyping) return;
    setMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'user', text: q, timestamp: new Date() }]);
    setIsTyping(true);
    try {
      const hint = await getHintFromText(q, getContext());
      addAiMessage(hint);
    } catch {
      addErrorMessage();
    }
  };

  const problemLabel = selectedProblem
    ? `${selectedProblem.page}페이지 ${selectedProblem.number}번`
    : '문항 없음';

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* 교재/문항 선택 툴바 */}
      <div className="bg-white border-b border-slate-100 p-3 shrink-0 grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">교재</label>
          {loadingBooks ? (
            <div className="h-8 bg-slate-100 rounded-xl animate-pulse" />
          ) : (
            <select
              value={selectedBook?.id ?? ''}
              onChange={(e) => {
                const found = books.find((b) => b.id === e.target.value) ?? null;
                setSelectedBook(found);
                setMessages([WELCOME]);
              }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-700 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
            >
              {books.length === 0 && <option value="">교재 없음</option>}
              {books.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">문항</label>
          <select
            value={selectedProblem?.id ?? ''}
            onChange={(e) => {
              const found = problems.find((p) => p.id === e.target.value) ?? null;
              setSelectedProblem(found);
              setMessages([WELCOME]);
            }}
            disabled={problems.length === 0}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-700 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all disabled:opacity-50"
          >
            {problems.length === 0 && <option value="">문항 없음</option>}
            {problems.map((p) => (
              <option key={p.id} value={p.id}>{p.page}p {p.number}번</option>
            ))}
          </select>
        </div>
      </div>

      {/* 현재 문제 배너 */}
      <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span className="text-xs text-indigo-700 font-medium">
            {selectedBook?.name ?? '교재 선택 필요'} · {problemLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {explanation ? (
            <span className="text-[10px] bg-green-100 text-green-600 font-medium px-2 py-0.5 rounded-full">해설 있음</span>
          ) : (
            <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">해설 없음</span>
          )}
          {selectedProblem?.topic && (
            <span className="text-[10px] text-indigo-400">{selectedProblem.topic}</span>
          )}
        </div>
      </div>

      {/* 채팅 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-slate-50">
        {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}

        {isTyping && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-black shrink-0 shadow-sm">
              쌤
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 빠른 질문 칩 */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 bg-white border-t border-slate-100 shrink-0 flex gap-2 overflow-x-auto">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleQuickQuestion(q)}
              disabled={isTyping || !selectedProblem}
              className="shrink-0 text-xs bg-indigo-50 text-indigo-600 font-medium px-3 py-1.5 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors whitespace-nowrap disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <ChatInput
        value={inputText}
        onChange={setInputText}
        onSubmit={handleSendMessage}
        onFileSelect={handleFileSelect}
        disabled={isTyping || !selectedProblem}
      />
    </div>
  );
}
