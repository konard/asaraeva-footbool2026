import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, RefreshCw, BarChart2, Award, Send, Users, Activity, PlayCircle, ToggleLeft, BadgeHelp, CheckCircle } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { 
    matches, 
    customEvents, 
    duels, 
    badges, 
    simulateMatchOutcome, 
    triggerPreMatchAlert,
    unlockBadgeDirectly, 
    addNotification, 
    resetState 
  } = useApp();

  // Simulating active matches
  const activeMatches = matches.filter(m => m.status !== 'finished');

  const [scoreA, setScoreA] = useState<number>(2);
  const [scoreB, setScoreB] = useState<number>(1);
  const [selectedMatchId, setSelectedMatchId] = useState(activeMatches[0]?.id || '');

  const selectedMatch = matches.find(m => m.id === selectedMatchId) || activeMatches[0] || matches[0];
  const teamAName = selectedMatch ? selectedMatch.teamA : 'Команда А';
  const teamBName = selectedMatch ? selectedMatch.teamB : 'Команда Б';
  
  // Custom push notification fields
  const [pushTitle, setPushTitle] = useState('🔥 Гол на 90 минуте!');
  const [pushMessage, setPushMessage] = useState('Мбаппе забивает решающий гол в ворота Португалии! Идет пересчет коэффициентов.');

  // Simulated match statistics for category auto-resolving
  const [simulatedPenalties, setSimulatedPenalties] = useState<number>(0);
  const [simulatedOffsidesA, setSimulatedOffsidesA] = useState<number>(2);
  const [simulatedOffsidesB, setSimulatedOffsidesB] = useState<number>(1);
  const [simulatedShotsA, setSimulatedShotsA] = useState<number>(11);
  const [simulatedShotsB, setSimulatedShotsB] = useState<number>(8);

  // For event resolution simulation
  const [eventResolution, setEventResolution] = useState<'yes' | 'no'>('yes');

  const getEventSimulatedOutcome = (ev: any) => {
    if (!ev.category || ev.category === 'custom') {
      return eventResolution;
    }
    const val = ev.categoryValue ?? 0;
    const cond = ev.categoryCondition ?? 'greater';
    const team = ev.categoryTeam ?? 'both';
    
    let actual = 0;
    if (ev.category === 'penalties') {
      actual = simulatedPenalties;
    } else if (ev.category === 'offsides') {
      actual = team === 'teamA' ? simulatedOffsidesA : team === 'teamB' ? simulatedOffsidesB : (simulatedOffsidesA + simulatedOffsidesB);
    } else if (ev.category === 'shots') {
      actual = team === 'teamA' ? simulatedShotsA : team === 'teamB' ? simulatedShotsB : (simulatedShotsA + simulatedShotsB);
    }
    
    const met = cond === 'greater' ? (actual > val) : (actual < val);
    return met ? 'yes' : 'no';
  };

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId) return;

    // find if there are custom events associated
    const associatedEvents = customEvents.filter(e => e.matchId === selectedMatchId && e.status === 'active');
    const resolutions: { [eventId: string]: 'yes' | 'no' } = {};
    
    associatedEvents.forEach(ev => {
      resolutions[ev.id] = getEventSimulatedOutcome(ev);
    });

    simulateMatchOutcome(selectedMatchId, scoreA, scoreB, resolutions);
    addNotification(
      'Симуляция матча выполнена!',
      `Сыгран матч с результатом [${scoreA}:${scoreB}]. Ставки и дуэли рассчитаны автоматически!`,
      'system'
    );
  };

  const handleSendPush = (e: React.FormEvent) => {
    e.preventDefault();
    addNotification(pushTitle, pushMessage, 'system');
    
    // Simulate web push toast
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-120.wav');
    audio.volume = 0.1;
    audio.play().catch(() => {}); // ignore audio play error if blocked by browser

    alert(`[PUSH УВЕДОМЛЕНИЕ ИГРОКАМ]\n\nЗаголовок: ${pushTitle}\nСообщение: ${pushMessage}`);
    
    setPushTitle('');
    setPushMessage('');
  };

  // User activity stats (mocked with high precision)
  const stats = [
    { title: 'Всего болельщиков', value: '1,452 чел.', change: '+24% за неделю', icon: '🙌', color: 'text-blue-600 bg-blue-50 border border-blue-200' },
    { title: 'Оборот в Integra', value: '845,200 Integra', change: 'Баланс в пуле', icon: '💎', color: 'text-sky-600 bg-sky-50 border border-sky-200' },
    { title: 'Активных дуэлей', value: '88 битв', change: 'В процессе игры', icon: '⚔️', color: 'text-indigo-600 bg-indigo-50 border border-indigo-200' },
    { title: 'Создано событий', value: '42 штуки', change: 'Творчество игроков', icon: '🎨', color: 'text-emerald-600 bg-emerald-50 border border-emerald-200' },
    { title: 'Дуэльный азарт', value: '85.4%', change: 'Доля активных дуэлей', icon: '🔥', color: 'text-rose-600 bg-rose-50 border border-rose-200' },
    { title: 'Telegram-рассылки', value: '5,420 сообщ.', change: 'Доставляемость 100%', icon: '✈️', color: 'text-sky-650 bg-sky-50 border border-sky-200' }
  ];

  return (
    <div className="space-y-8 text-slate-800">
      {/* Overview stats block */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div>
          <h3 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-2 font-display">
            <span>📊</span> Статистика Активности «Интеграм FC»
          </h3>
          <p className="text-slate-500 text-sm mt-0.5">Детальная статистика активности болельщиков, сыгранных дуэлей и созданных событий в реальном времени.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="border border-slate-200 rounded-2xl p-5 flex items-center gap-4 hover:border-sky-500/20 transition bg-slate-50/50 shadow-sm">
              <span className={`text-3xl p-3.5 rounded-xl ${stat.color} select-none`}>{stat.icon}</span>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.title}</p>
                <p className="text-xl md:text-2xl font-black text-slate-850 font-mono mt-0.5">{stat.value}</p>
                <p className="text-[11px] text-emerald-600 font-bold mt-0.5">{stat.change}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* MATCH SIMULATOR (Drives the betting outcomes) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-150">
            <span className="p-2 bg-slate-100 border border-slate-200 text-indigo-600 rounded-xl text-xl">🎲</span>
            <h3 className="text-xl md:text-2xl font-black text-slate-800 font-display">Симулятор Результатов Матчей</h3>
          </div>

          {activeMatches.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-slate-500 font-medium">Все матчи завершены!</p>
              <button 
                onClick={resetState}
                className="bg-sky-500 hover:bg-sky-600 text-white font-extrabold py-2 px-5 rounded-xl text-sm transition cursor-pointer"
              >
                Сбросить демо и вернуть матчи
              </button>
            </div>
          ) : (
            <form onSubmit={handleSimulate} className="space-y-4">
              <p className="text-sm text-slate-500 leading-relaxed">
                Завершите любой активный матч, указав итоговый счет. Это мгновенно рассчитает все открытые ставки и дуэли друзей, а также проверит условия получения значков.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Выберите матч для расчета</label>
                <select
                  value={selectedMatchId}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-md font-bold text-slate-800 focus:border-sky-500 outline-none cursor-pointer"
                >
                  {activeMatches.map(m => (
                    <option key={m.id} value={m.id} className="bg-white">{m.teamAFlag} {m.teamA} - {m.teamBFlag} {m.teamB}</option>
                  ))}
                </select>
              </div>

              {/* Score inputs - Large buttons */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Голы команды А</label>
                  <input
                    type="number"
                    min={0}
                    max={15}
                    value={scoreA}
                    onChange={(e) => setScoreA(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xl font-black text-slate-800 font-mono text-center focus:border-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Голы команды Б</label>
                  <input
                    type="number"
                    min={0}
                    max={15}
                    value={scoreB}
                    onChange={(e) => setScoreB(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xl font-black text-slate-800 font-mono text-center focus:border-sky-500 outline-none"
                  />
                </div>
              </div>

              {/* Match Detailed Stats Simulation for Sport Categories */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                <label className="block text-xs font-bold text-indigo-700 uppercase">📊 Детальная статистика матча для категорий</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Суммарно пенальти в матче</label>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      value={simulatedPenalties}
                      onChange={(e) => setSimulatedPenalties(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-sm font-bold text-center font-mono focus:border-sky-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Офсайды {teamAName}</label>
                    <input
                      type="number"
                      min={0}
                      max={15}
                      value={simulatedOffsidesA}
                      onChange={(e) => setSimulatedOffsidesA(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-sm font-bold text-center font-mono focus:border-sky-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Офсайды {teamBName}</label>
                    <input
                      type="number"
                      min={0}
                      max={15}
                      value={simulatedOffsidesB}
                      onChange={(e) => setSimulatedOffsidesB(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-sm font-bold text-center font-mono focus:border-sky-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Удары в створ {teamAName}</label>
                    <input
                      type="number"
                      min={0}
                      max={35}
                      value={simulatedShotsA}
                      onChange={(e) => setSimulatedShotsA(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-sm font-bold text-center font-mono focus:border-sky-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Удары в створ {teamBName}</label>
                    <input
                      type="number"
                      min={0}
                      max={35}
                      value={simulatedShotsB}
                      onChange={(e) => setSimulatedShotsB(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-sm font-bold text-center font-mono focus:border-sky-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic associated events preview */}
              {customEvents.filter(e => e.matchId === selectedMatchId && e.status === 'active').length > 0 && (
                <div className="bg-sky-50/50 border border-sky-100 p-3.5 rounded-2xl space-y-2 text-xs">
                  <h4 className="font-bold text-sky-800 uppercase text-[10px]">🎯 Расчет связанных событий ({customEvents.filter(e => e.matchId === selectedMatchId && e.status === 'active').length}):</h4>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {customEvents.filter(e => e.matchId === selectedMatchId && e.status === 'active').map(ev => {
                      const outcome = getEventSimulatedOutcome(ev);
                      return (
                        <div key={ev.id} className="flex justify-between items-center bg-white p-2 rounded-xl border border-sky-100 gap-2">
                          <span className="font-semibold text-slate-700 truncate" title={ev.title}>{ev.title}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${
                            outcome === 'yes' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {outcome === 'yes' ? 'ДА ✓' : 'НЕТ ✗'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Event resolution general fallback */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                <label className="block text-xs font-bold text-sky-700 uppercase mb-2">Как разрешить остальные события (без категории)?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEventResolution('yes')}
                    className={`py-2 px-4 rounded-xl font-bold text-sm text-center border transition cursor-pointer ${
                      eventResolution === 'yes'
                        ? 'bg-emerald-500 border-emerald-600 text-white font-extrabold shadow-sm'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Да (Сбылись)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventResolution('no')}
                    className={`py-2 px-4 rounded-xl font-bold text-sm text-center border transition cursor-pointer ${
                      eventResolution === 'no'
                        ? 'bg-rose-500 border-rose-600 text-white font-extrabold shadow-sm'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Нет (Не сбылись)
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">Применится к текстовым событиям (например, «Вратарь забьет гол»). События по пенальти, офсайдам и ударам рассчитаются автоматически на основе параметров выше!</p>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-black py-4 px-6 rounded-2xl shadow-lg transition text-lg cursor-pointer flex items-center justify-center gap-1.5"
              >
                <PlayCircle className="w-5 h-5" /> Сыграть матч и рассчитать награды
              </button>
            </form>
          )}
        </div>

        {/* PUSH NOTIFICATIONS & REWARDS MANAGEMENT */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-150">
            <span className="p-2 bg-slate-100 border border-slate-200 text-emerald-600 rounded-xl text-xl">🔔</span>
            <h3 className="text-xl md:text-2xl font-black text-slate-800 font-display">Рассылка Push-уведомлений</h3>
          </div>

          <form onSubmit={handleSendPush} className="space-y-4">
            <p className="text-sm text-slate-500 leading-relaxed">
              Вызовите мгновенный пуш-информер на экранах всех игроков тотализатора. Отличный способ напомнить о новых событиях или поздравить с выигрышем!
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Заголовок Push-уведомления</label>
              <input
                type="text"
                value={pushTitle}
                onChange={(e) => setPushTitle(e.target.value)}
                placeholder="Например: Лунин берет пенальти!"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-md font-bold text-slate-800 focus:border-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Текст уведомления</label>
              <textarea
                value={pushMessage}
                onChange={(e) => setPushMessage(e.target.value)}
                placeholder="Что увидят пользователи?"
                rows={2}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-md font-medium text-slate-800 focus:border-sky-500 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-black py-3.5 px-6 rounded-2xl shadow-lg shadow-sky-500/10 transition text-md cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" /> Отправить пуш во все браузеры
            </button>
          </form>

          {/* Simulated Timing alerts block */}
          <div className="pt-4 border-t border-slate-150 space-y-3">
            <h4 className="font-extrabold text-slate-800 text-md flex items-center gap-1.5 font-display">
              <span className="text-lg">🕒</span> Симуляция регламентных уведомлений
            </h4>
            <p className="text-xs text-slate-500 leading-normal">
              По регламенту турнира, вы обязаны оповестить участников за 30 минут до матча и разослать результаты в течение 3 минут после эфира. Проверьте обе рассылки в один клик:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  if (selectedMatch) {
                    triggerPreMatchAlert(selectedMatch.id);
                  } else {
                    addNotification('Ошибка', 'Пожалуйста, выберите матч в левой панели для имитации напоминания.', 'system');
                  }
                }}
                className="py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>🚨</span> За 30 минут до матча
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedMatch) {
                    const associatedEvents = customEvents.filter(e => e.matchId === selectedMatch.id && e.status === 'active');
                    const resolutions: { [eventId: string]: 'yes' | 'no' } = {};
                    associatedEvents.forEach(ev => {
                      resolutions[ev.id] = getEventSimulatedOutcome(ev);
                    });
                    simulateMatchOutcome(selectedMatch.id, scoreA, scoreB, resolutions);
                  } else {
                    addNotification('Ошибка', 'Выберите активный матч слева для расчета.', 'system');
                  }
                }}
                className="py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>📢</span> В течение 3 минут после матча
              </button>
            </div>
          </div>

          {/* Quick Rewards Giver */}
          <div className="pt-4 border-t border-slate-150 space-y-3">
            <h4 className="font-extrabold text-slate-800 text-md flex items-center gap-1.5 font-display">
              <Award className="w-5 h-5 text-amber-500" /> Тестовое управление наградами
            </h4>
            <div className="flex flex-wrap gap-2">
              {badges.map(b => (
                <button
                  key={b.id}
                  onClick={() => unlockBadgeDirectly(b.id)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition ${
                    b.isUnlocked 
                      ? 'bg-emerald-50 border-emerald-250 text-emerald-800 font-extrabold shadow-sm' 
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  {b.isUnlocked ? '✓ ' : '+ '} {b.title}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500">Нажмите на значок выше, чтобы мгновенно начислить его себе для проверки витрины.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
