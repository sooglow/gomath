import { useState, useRef, useEffect } from 'react';
import type { MessageType, Explanation, Assignment } from '../../../shared/types';
import { fetchAssignments, fetchExplanation } from '../../../shared/api/supabase';
import { getHintFromImage, getHintFromText } from '../../../shared/api/gemini';
import MessageBubble from '../../../entities/message/ui/MessageBubble';
import ChatInput from '../../../features/chat/ui/ChatInput';

const WELCOME: MessageType = {
  id: 'welcome',
  sender: 'ai',
  text: '반가워! 과제를 선택한 다음, 연습장에 풀어본 풀이를 사진으로 찍어서 올려줘. 어디서 막혔는지 같이 확인해볼게! 📸',
  timestamp: new Date(),
};

export default function AiTutorPage({ userId }: { userId: string }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [explanation, setExplanation] = useState<Explanation | null>(null);

  const [messages, setMessages] = useState<MessageType[]>([WELCOME]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const hasStarted = messages.length > 1;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    fetchAssignments(userId)
      .then((data) => {
        setAssignments(data);
        if (data.length > 0) setSelectedAssignment(data[0]);
      })
      .catch(console.error)
      .finally(() => setLoadingAssignments(false));
  }, [userId]);

  useEffect(() => {
    const pid = selectedAssignment?.problems?.id;
    if (!pid) return;
    setExplanation(null);
    fetchExplanation(pid).then(setExplanation).catch(console.error);
  }, [selectedAssignment]);

  const getContext = () => {
    const p = selectedAssignment?.problems;
    return {
      book: p?.books?.name ?? '',
      problem: p ? `${p.page}페이지 ${p.number}번` : '',
      problemId: p?.id ?? '',
      userId,
      explanation,
    };
  };

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
      { id: Date.now().toString(), sender: 'ai', text: '앗, 잠깐 오류가 생겼어. 다시 한번 올려줄래? 😅', timestamp: new Date() },
    ]);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isTyping) return;
    const imageUrl = URL.createObjectURL(file);
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: 'user', text: '📷 풀이 사진을 보냈어요', imageUrl, timestamp: new Date() },
    ]);
    e.target.value = '';
    setIsTyping(true);
    try {
      const hint = await getHintFromImage(file, getContext());
      addAiMessage(hint);
    } catch {
      addErrorMessage();
    }
  };

  const handleSendMessage = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;
    const text = inputText.trim();
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: 'user', text, timestamp: new Date() },
    ]);
    setInputText('');
    setIsTyping(true);
    try {
      const hint = await getHintFromText(text, getContext());
      addAiMessage(hint);
    } catch {
      addErrorMessage();
    }
  };

  const p = selectedAssignment?.problems;
  const problemLabel = p ? `${p.page}p ${p.number}번` : '과제 없음';

  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* 과제 선택 툴바 */}
      <div className="bg-white border-b border-slate-100 p-3 shrink-0">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">과제 선택</label>
        {loadingAssignments ? (
          <div className="h-8 bg-slate-100 rounded-xl animate-pulse" />
        ) : assignments.length === 0 ? (
          <div className="text-xs text-slate-400 bg-slate-50 rounded-xl px-3 py-2">등록된 과제가 없어요</div>
        ) : (
          <select
            value={selectedAssignment?.id ?? ''}
            onChange={(e) => {
              const found = assignments.find((a) => a.id === e.target.value) ?? null;
              setSelectedAssignment(found);
              setMessages([WELCOME]);
            }}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-700 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
          >
            {assignments.map((a) => {
              const ap = a.problems;
              const label = ap ? `${ap.page}p ${ap.number}번` : '문항 없음';
              const due = a.due_date ? ` · ${a.due_date} 마감` : '';
              const done = a.completed ? ' ✅' : '';
              return (
                <option key={a.id} value={a.id}>{label}{due}{done}</option>
              );
            })}
          </select>
        )}
      </div>

      {/* 현재 문제 배너 */}
      <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span className="text-xs text-indigo-700 font-medium">
            {p?.books?.name ?? '교재 없음'} · {problemLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {explanation ? (
            <span className="text-[10px] bg-green-100 text-green-600 font-medium px-2 py-0.5 rounded-full">해설 있음</span>
          ) : (
            <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">해설 없음</span>
          )}
          {p?.topic && (
            <span className="text-[10px] text-indigo-400">{p.topic}</span>
          )}
        </div>
      </div>

      {/* hidden file input */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* ── 초기 화면 ── */}
      {!hasStarted ? (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
          <div className="px-4 pt-5 pb-3">
            <div className="flex gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-black shrink-0 shadow-sm">
                쌤
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <p className="text-sm text-slate-700 leading-relaxed">{WELCOME.text}</p>
              </div>
            </div>
          </div>

          <div className="px-4 py-2 flex-1 flex flex-col justify-center gap-3">
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={!selectedAssignment || isTyping}
              className="w-full flex flex-col items-center gap-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-3xl py-8 shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="text-4xl">📸</span>
              <div className="text-center">
                <p className="text-base font-extrabold tracking-tight">풀이 사진 올리기</p>
                <p className="text-xs text-indigo-200 mt-1">연습장에 푼 과정을 찍어서 올려줘</p>
              </div>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[11px] text-slate-400">또는</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <ChatInput
              value={inputText}
              onChange={setInputText}
              onSubmit={handleSendMessage}
              onFileSelect={handleFileSelect}
              disabled={isTyping || !selectedAssignment}
              placeholder="모르는 개념이 있으면 물어봐도 돼"
              hideCamera
            />
          </div>
        </div>
      ) : (
        <>
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

          <div className="bg-white border-t border-slate-100 px-4 pt-2 pb-1 shrink-0">
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={!selectedAssignment || isTyping}
              className="w-full flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 font-bold text-xs rounded-2xl py-2.5 mb-2 border border-indigo-100 hover:bg-indigo-100 transition-colors disabled:opacity-40"
            >
              <span>📸</span>
              <span>다음 풀이 사진 올리기</span>
            </button>
          </div>

          <ChatInput
            value={inputText}
            onChange={setInputText}
            onSubmit={handleSendMessage}
            onFileSelect={handleFileSelect}
            disabled={isTyping || !selectedAssignment}
            placeholder="추가로 궁금한 점을 물어봐"
            hideCamera
          />
        </>
      )}
    </div>
  );
}
