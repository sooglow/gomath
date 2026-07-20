import { useState, useRef, useEffect } from 'react';
import type { MessageType } from '../../types';
import { BOOKS, PROBLEMS, MOCK_HINTS } from '../../constants/data';
import { formatTime } from '../../utils/format';
// import { getHintFromImage, getHintFromText } from '../../lib/gemini'; // API 연결 시 활성화

const QUICK_QUESTIONS = ['근의 공식이 뭐야?', '판별식 개념 설명해줘', '다시 처음부터 설명해줘'];

export default function AiTutorTab() {
  const [book, setBook] = useState('개념원리 중3-1');
  const [problemNum, setProblemNum] = useState('32페이지 5번');
  const [messages, setMessages] = useState<MessageType[]>([
    {
      id: '1',
      sender: 'ai',
      text: '반가워! 오늘 어떤 문제를 같이 풀어볼까? 🙌\n\n위에서 교재와 문제 번호를 선택하고, 연습장에 푼 부분과 문제를 함께 사진으로 찍어서 보내줘!',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mockIdxRef = useRef(0);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const addMockResponse = (delay = 1200) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'ai',
          text: MOCK_HINTS[mockIdxRef.current % MOCK_HINTS.length],
          hasAudio: true,
          timestamp: new Date(),
        },
      ]);
      mockIdxRef.current++;
    }, delay);
  };

  const handleSendMessage = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: 'user', text: inputText.trim(), timestamp: new Date() },
    ]);
    setInputText('');
    addMockResponse();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: 'user', text: '📷 풀이 사진을 보냈어요', imageUrl, timestamp: new Date() },
    ]);
    e.target.value = '';
    addMockResponse(1500);
  };

  const handleQuickQuestion = (q: string) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: 'user', text: q, timestamp: new Date() },
    ]);
    addMockResponse();
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* 교재 선택 툴바 */}
      <div className="bg-white border-b border-slate-100 p-3 shrink-0 grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">교재</label>
          <select
            value={book}
            onChange={(e) => { setBook(e.target.value); setProblemNum(PROBLEMS[e.target.value][0]); }}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-700 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
          >
            {BOOKS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">문항</label>
          <select
            value={problemNum}
            onChange={(e) => setProblemNum(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-700 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
          >
            {(PROBLEMS[book] ?? []).map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* 현재 문제 배너 */}
      <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span className="text-xs text-indigo-700 font-medium">{book} · {problemNum}</span>
        </div>
        <span className="text-[10px] text-indigo-400">이차방정식</span>
      </div>

      {/* 채팅 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-slate-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-black shrink-0 shadow-sm mt-0.5">
                쌤
              </div>
            )}
            <div className={`max-w-[78%] flex flex-col gap-1 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`rounded-2xl px-3.5 py-3 shadow-sm text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-sm'
                  : 'bg-white text-slate-800 rounded-tl-sm border border-slate-100'
              }`}>
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="풀이 사진" className="w-full max-h-48 object-cover rounded-xl mb-2" />
                )}
                <p className="whitespace-pre-line">{msg.text}</p>
                {msg.sender === 'ai' && msg.hasAudio && (
                  <button className="mt-2.5 flex items-center gap-1.5 text-[11px] bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold px-2.5 py-1.5 rounded-xl transition-colors active:scale-95">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    선생님 목소리로 듣기
                  </button>
                )}
              </div>
              <span className="text-[10px] text-slate-400 px-1">{formatTime(msg.timestamp)}</span>
            </div>
          </div>
        ))}

        {/* 타이핑 인디케이터 */}
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
              className="shrink-0 text-xs bg-indigo-50 text-indigo-600 font-medium px-3 py-1.5 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* 입력 영역 */}
      <div className="p-3 bg-white border-t border-slate-100 shrink-0 space-y-2">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isTyping}
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

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="선생님께 질문하세요..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={isTyping || !inputText.trim()}
            className="bg-indigo-600 disabled:bg-indigo-300 hover:bg-indigo-700 text-white font-bold rounded-xl px-4 py-2.5 transition-colors shadow-sm active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
