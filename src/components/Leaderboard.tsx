import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'motion/react';
import { Award, Trophy, Users, Star, ArrowUpRight, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';

export const Leaderboard: React.FC = () => {
  const { leaderboard, user, setActiveTab } = useApp();
  const [boardType, setBoardType] = useState<'global' | 'creators'>('global');

  // Sort global by score, creator sorted differently (simulate sorting where isCreator goes first)
  const sortedGlobal = [...leaderboard].sort((a, b) => b.score - a.score);
  const sortedCreators = [...leaderboard]
    .filter(x => x.isCreator || x.rank % 3 === 0) // mock creators list
    .map((x, idx) => ({ ...x, creatorRank: idx + 1, originalEvents: 5 - idx, referrals: 12 - idx * 2 }))
    .sort((a, b) => b.originalEvents - a.originalEvents);

  return (
    <div className="space-y-8">
      {/* Visual Header Banner - Styled like News Feed for visual consistency */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-10 font-black text-9xl select-none pointer-events-none">FC</div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black tracking-wider uppercase">
              <Trophy className="w-3.5 h-3.5 animate-pulse text-yellow-300" /> Гран-при для творцов
            </div>
            <h1 className="text-2xl md:text-3xl font-black font-display tracking-tight leading-tight text-white">
              Вы можете сами создать соревнования, собирать команды, зарабатывать Integra, рейтинг и побеждать.
            </h1>
            <p className="text-sm text-emerald-50/90 font-medium">
              Каждый месяц топ-10 болельщиков, предложивших самые оригинальные события или собравших самую активную команду друзей, получают почетный статус Легенды и супер-бонус +1000 Integra на игровой баланс!
            </p>
          </div>
          <button 
            onClick={() => setActiveTab('integram')}
            className="self-start md:self-center bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black px-6 py-3.5 rounded-2xl flex items-center gap-2 transition cursor-pointer shrink-0 shadow-lg shadow-yellow-500/20"
          >
            Создать свою игру
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-8 shadow-sm text-slate-800">
        
        {/* Toggle Boards */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 flex gap-2">
            <button
              onClick={() => setBoardType('global')}
              className={`py-3 px-6 rounded-xl font-extrabold text-md md:text-lg transition cursor-pointer flex items-center gap-2 ${
                boardType === 'global'
                  ? 'bg-gradient-to-r from-rose-600 to-amber-500 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-200'
              }`}
            >
              👑 Глобальный Топ
            </button>
            <button
              onClick={() => setBoardType('creators')}
              className={`py-3 px-6 rounded-xl font-extrabold text-md md:text-lg transition cursor-pointer flex items-center gap-2 ${
                boardType === 'creators'
                  ? 'bg-gradient-to-r from-rose-600 to-amber-500 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-200'
              }`}
            >
              🎨 Топ Творцов
            </button>
          </div>
        </div>

        {boardType === 'global' ? (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-xl md:text-2xl font-black text-slate-800 font-display">Глобальная таблица лидеров</h3>
              <p className="text-slate-555 text-sm mt-0.5 font-medium">Учитывает баланс «Integra» и количество заработанных почетных знаков.</p>
            </div>
 
            {/* Leaderboard Table / Cards */}
            <div className="space-y-3.5">
              {/* Highlight user current standing if not in top list - kept blue to signify creator connection */}
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-md font-black bg-sky-500 text-white rounded-xl px-3 py-1.5 flex items-center justify-center font-sans">
                    Ваш
                  </span>
                  <div>
                    <p className="font-extrabold text-slate-850 text-lg">{user.name} <span className="text-xs text-sky-800 bg-sky-100/60 py-0.5 px-2 rounded-full font-black font-sans border border-sky-200 ml-1.5">ВЫ</span></p>
                    <p className="text-slate-600 text-xs">Никнейм: @{user.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Баланс</p>
                    <p className="text-lg font-black text-amber-600 font-mono">{user.gramsBalance} Integra</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Значки</p>
                    <p className="text-lg font-black text-slate-700 font-mono">{user.badges.length}</p>
                  </div>
                </div>
              </div>

              {/* List */}
              {sortedGlobal.map((entry, idx) => {
                const isMe = entry.id === 'u_me';
                const rankStyles = [
                  'bg-yellow-400 text-slate-950 ring-4 ring-yellow-400/20',
                  'bg-slate-300 text-slate-900 ring-4 ring-slate-300/20',
                  'bg-amber-600 text-white ring-4 ring-amber-600/20',
                ];

                return (
                  <div 
                    key={entry.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between transition ${
                      isMe ? 'border-sky-300 bg-sky-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {idx < 3 ? (
                        <span className={`w-10 h-10 rounded-full font-black text-lg flex items-center justify-center font-mono ${rankStyles[idx]}`}>
                          {idx + 1}
                        </span>
                      ) : (
                        <span className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 text-slate-550 font-bold text-md flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                      )}

                      {isMe && (user.avatar.startsWith('data:') || user.avatar.startsWith('http') || user.avatar.startsWith('blob:')) ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-10 h-10 rounded-full border border-slate-200 object-cover shadow-sm shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-3xl select-none">{isMe ? user.avatar : entry.avatar}</span>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-slate-800 text-md md:text-lg">{entry.name}</p>
                          {entry.isCreator && (
                            <span 
                              className="bg-sky-50 border border-sky-200 text-sky-700 text-[10px] font-extrabold py-0.5 px-2 rounded-full uppercase tracking-wider"
                              title="Создатель популярных событий"
                            >
                              Творец
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 text-xs font-medium">@{entry.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 md:gap-10">
                      <div className="text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Значки</p>
                        <p className="text-md md:text-lg font-bold text-slate-700 font-mono">{entry.badgesCount} 🏆</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Баланс</p>
                        <p className="text-lg md:text-xl font-black text-amber-650 font-mono">{entry.score} Integra</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-xl md:text-2xl font-black text-slate-800 font-display">Рейтинг Творцов (Активность в конструкторе)</h3>
              <p className="text-slate-500 text-sm mt-0.5 font-medium">Лидеры по созданию оригинальных событий и привлечению рефералов.</p>
            </div>

            {/* Creators List */}
            <div className="space-y-3.5">
              {sortedCreators.map((entry, idx) => {
                const isMe = entry.id === 'u_me';
                return (
                  <div 
                    key={entry.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-amber-600 font-black text-md flex items-center justify-center font-mono">
                        #{idx + 1}
                      </span>
                      {isMe && (user.avatar.startsWith('data:') || user.avatar.startsWith('http') || user.avatar.startsWith('blob:')) ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-10 h-10 rounded-full border border-slate-200 object-cover shadow-sm shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-3xl select-none">{isMe ? user.avatar : entry.avatar}</span>
                      )}
                      <div>
                        <p className="font-extrabold text-slate-800 text-md md:text-lg">{entry.name}</p>
                        <p className="text-slate-500 text-xs">@{entry.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-10">
                      <div className="text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Создано событий</p>
                        <p className="text-md font-bold text-amber-650 font-mono">{entry.originalEvents} 🛠️</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Приглашено друзей</p>
                        <p className="text-md font-bold text-sky-650 font-mono">{entry.referrals} 🙌</p>
                      </div>
                      <div className="text-right bg-emerald-50 py-1.5 px-3.5 rounded-xl border border-emerald-200">
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Шанс на Бонус</p>
                        <p className="text-sm font-black text-emerald-800 font-sans">99%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
