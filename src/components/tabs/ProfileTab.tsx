import { useState } from 'react';

const WEEK_DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const STUDIED_DAYS = [true, true, false, true, true, true, false];

export default function ProfileTab() {
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(true);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
      {/* 프로필 카드 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xl font-black shadow">
          민
        </div>
        <div>
          <h2 className="text-base font-extrabold text-slate-800">김민준</h2>
          <p className="text-xs text-slate-400 mt-0.5">중학교 3학년 · 이차방정식 집중 중</p>
          <span className="text-xs text-amber-500 font-bold mt-1.5 block">🔥 7일 연속 출석</span>
        </div>
      </div>

      {/* 이번 주 출석 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h3 className="text-xs font-bold text-slate-600 mb-3">이번 주 학습 현황</h3>
        <div className="grid grid-cols-7 gap-1.5">
          {WEEK_DAYS.map((day, i) => (
            <div key={day} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${STUDIED_DAYS[i] ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {STUDIED_DAYS[i] ? '✓' : day}
              </div>
              <span className="text-[9px] text-slate-400">{day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 누적 통계 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h3 className="text-xs font-bold text-slate-600 mb-3">누적 통계</h3>
        <div className="space-y-3">
          {[
            { label: '총 질문 수', value: '47개', icon: '💬', color: 'text-indigo-600' },
            { label: '해결한 오답', value: '38문제', icon: '✅', color: 'text-emerald-600' },
            { label: '총 학습 시간', value: '12시간 30분', icon: '⏰', color: 'text-amber-600' },
            { label: '획득한 뱃지', value: '5개', icon: '🏅', color: 'text-rose-500' },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2.5">
                <span className="text-base">{stat.icon}</span>
                <span className="text-sm text-slate-600">{stat.label}</span>
              </div>
              <span className={`text-sm font-extrabold ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 설정 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h3 className="text-xs font-bold text-slate-600 mb-3">설정</h3>
        <div className="space-y-1">
          {[
            { label: '선생님 목소리 힌트', desc: 'ElevenLabs AI 음성', value: voiceEnabled, toggle: () => setVoiceEnabled((v) => !v) },
            { label: '학습 알림', desc: '매일 오후 7시', value: notifEnabled, toggle: () => setNotifEnabled((v) => !v) },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm text-slate-700 font-medium">{item.label}</p>
                <p className="text-[11px] text-slate-400">{item.desc}</p>
              </div>
              <button
                onClick={item.toggle}
                className={`relative w-11 h-6 rounded-full transition-colors ${item.value ? 'bg-indigo-500' : 'bg-slate-200'}`}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                  style={{ left: item.value ? '22px' : '2px' }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button className="w-full py-3 text-sm font-bold text-rose-500 bg-rose-50 rounded-2xl hover:bg-rose-100 transition-colors">
        로그아웃
      </button>
    </div>
  );
}
