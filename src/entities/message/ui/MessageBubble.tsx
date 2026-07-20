import type { MessageType } from '../../../shared/types';
import { formatTime } from '../../../shared/utils/format';

type Props = {
  message: MessageType;
};

export default function MessageBubble({ message: msg }: Props) {
  const isUser = msg.sender === 'user';

  return (
    <div className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-black shrink-0 shadow-sm mt-0.5">
          쌤
        </div>
      )}
      <div className={`max-w-[78%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-3.5 py-3 shadow-sm text-sm leading-relaxed ${
          isUser
            ? 'bg-indigo-600 text-white rounded-tr-sm'
            : 'bg-white text-slate-800 rounded-tl-sm border border-slate-100'
        }`}>
          {msg.imageUrl && (
            <img src={msg.imageUrl} alt="풀이 사진" className="w-full max-h-48 object-cover rounded-xl mb-2" />
          )}
          <p className="whitespace-pre-line">{msg.text}</p>
          {!isUser && msg.hasAudio && (
            <button className="mt-2.5 flex items-center gap-1.5 text-[11px] bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold px-2.5 py-1.5 rounded-xl transition-colors active:scale-95">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              선생님 목소리로 듣기
            </button>
          )}
        </div>
        <span className="text-[10px] text-slate-400 px-1">{formatTime(msg.timestamp)}</span>
      </div>
    </div>
  );
}
