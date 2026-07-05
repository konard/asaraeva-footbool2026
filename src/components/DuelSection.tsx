import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Share2, Copy, Send, CheckCircle, HelpCircle, Trophy, Sparkles, Smile, Terminal, Trash2 } from 'lucide-react';
import { MOCK_FRIENDS, getCountryFlagUrl } from '../data/initialData';

export const DuelSection: React.FC = () => {
  const { 
    matches, 
    duels, 
    createDuel, 
    joinGroupGame,
    simulateGroupParticipants,
    user, 
    addNotification, 
    addReferral, 
    resolveDuelManually,
    setActiveTab,
    dispatchLogs,
    clearDispatchLogs,
    preselectedDuelType,
    setPreselectedDuelType
  } = useApp();

  const [isGroupMode, setIsGroupMode] = useState(false);
  const [joinNames, setJoinNames] = useState<Record<string, string>>({});
  const [joinSelections, setJoinSelections] = useState<Record<string, string>>({});
  const [joinBets, setJoinBets] = useState<Record<string, number>>({});

  const [selectedMatch, setSelectedMatch] = useState(matches[0]?.id || '');
  const [predictionType, setPredictionType] = useState<'match_outcome' | 'custom_event'>(preselectedDuelType);
  const [predictionDetail, setPredictionDetail] = useState('Победа Испании (2:1)');
  const [captainSelection, setCaptainSelection] = useState('teamA');

  useEffect(() => {
    setPredictionType(preselectedDuelType);
    if (preselectedDuelType === 'custom_event') {
      setPredictionDetail('Месси забьет со штрафного');
      setCaptainSelection('yes');
    } else {
      setPredictionDetail('Победа Испании (2:1)');
      setCaptainSelection('teamA');
    }
  }, [preselectedDuelType]);
  const [targetFriend, setTargetFriend] = useState(MOCK_FRIENDS[0].name);
  const [duelBet, setDuelBet] = useState(100);
  
  const [selectedDuelForShare, setSelectedDuelForShare] = useState<string | null>(null);
  const [customFriendName, setCustomFriendName] = useState('');
  const [friendHandle, setFriendHandle] = useState('');
  const [notificationChannel, setNotificationChannel] = useState<'telegram' | 'vk' | 'yandex' | 'none'>('telegram');
  const [isCustomPrediction, setIsCustomPrediction] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Group mode advanced options
  const [groupUsernamesText, setGroupUsernamesText] = useState('@ivan_predict\n@sport_boss\n@dima_vova\n@elena_goals');
  const [inviteMethod, setInviteMethod] = useState<'telegram' | 'vk' | 'pool'>('telegram');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteProgress, setInviteProgress] = useState(0);
  const [inviteLogs, setInviteLogs] = useState<string[]>([]);

  // For simulation landing
  const [showLandingSim, setShowLandingSim] = useState(false);
  const [simFriendName, setSimFriendName] = useState('Алексей Торпедо');

  const preloadedPredictions = {
    match_outcome: [
      { text: 'Победа Испании (2:1)', value: 'teamA', label: 'Победа команды А' },
      { text: 'Ничья (1:1)', value: 'draw', label: 'Ничья' },
      { text: 'Победа Германии (1:2)', value: 'teamB', label: 'Победа команды Б' }
    ],
    custom_event: [
      { text: 'Вратарь забьет гол в ворота соперника', value: 'yes', label: 'Да, забьет' },
      { text: 'Будет забит гол с центра поля', value: 'yes', label: 'Да, будет' },
      { text: 'Лунин отразит пенальти на 90 минуте', value: 'yes', label: 'Да, отразит' }
    ]
  };

  const handleHandleChange = (val: string) => {
    setFriendHandle(val);
    const trimmed = val.trim().toLowerCase();
    if (!trimmed) return;

    if (trimmed.includes('@yandex.ru') || trimmed.includes('@ya.ru') || (trimmed.includes('@') && trimmed.includes('.'))) {
      setNotificationChannel('yandex');
    } else if (trimmed.includes('vk.com') || trimmed.includes('vk/') || trimmed.startsWith('vk:')) {
      setNotificationChannel('vk');
    } else if (trimmed.startsWith('@') || trimmed.includes('t.me/') || trimmed.length > 2) {
      setNotificationChannel('telegram');
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const friend = customFriendName.trim() ? customFriendName : targetFriend;
    const success = createDuel(
      selectedMatch,
      predictionType,
      predictionDetail,
      captainSelection,
      friend,
      duelBet,
      friendHandle.trim() || undefined,
      notificationChannel,
      isGroupMode
    );

    if (success) {
      setCustomFriendName('');
      setFriendHandle('');
      setIsCustomPrediction(false);
      if (isGroupMode) {
        addNotification(
          'Групповой вызов создан!',
          `Вы успешно создали приглашение в групповую игру! Ссылка-инвайт готова к отправке до 1000 участников.`,
          'duel'
        );
      } else {
        let detailText = `Вы вызвали ${friend} на дуэль пророков! Карточка дуэли готова к отправке в соцсети.`;
        if (notificationChannel === 'telegram') {
          detailText = `Вы вызвали ${friend} на дуэль пророков! Ссылка-вызов и приглашение отправлены на аккаунт ${friendHandle.trim() || '@friend'} в Telegram!`;
        } else if (notificationChannel === 'vk') {
          detailText = `Вы вызвали ${friend} на дуэль пророков! Ссылка-вызов отправлена во ВКонтакте для ${friendHandle.trim() || 'пользователя'}!`;
        } else if (notificationChannel === 'yandex') {
          detailText = `Вы вызвали ${friend} на дуэль пророков! Официальное письмо-приглашение успешно выслано на Email ${friendHandle.trim() || 'ya.ru'}!`;
        }
        addNotification(
          'Дуэль создана! ⚔️',
          detailText,
          'duel'
        );
      }
    }
  };

  const handleShare = (duelId: string) => {
    const duel = duels.find(d => d.id === duelId);
    if (!duel) return;

    setSelectedDuelForShare(duelId);
    
    // Copy share link
    const shareText = `⚔️ БИТВА ПРОРОКОВ в Интеграм FC! ⚔️\n\nЯ, капитан ${duel.creatorName}, вызываю тебя на дуэль по матчу ${duel.matchTitle}!\nМоя ставка: ${duel.betAmount} Integra на прогноз: "${duel.predictionDetail}".\n\nПрими вызов и заслужи почетный знак "Дивергент", либо останься "Афоней"!\n\n👉 Ссылка на тотализатор: ${window.location.origin}?invite=${user.referralCode}\n\nПостроено без кода на конструкторе Интеграм! Создай свою игру за 5 минут.`;
    
    navigator.clipboard.writeText(shareText).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const simulateReferralLanding = () => {
    addReferral(simFriendName);
    setShowLandingSim(false);
  };

  const handleStartGroupInvitation = () => {
    const lines = groupUsernamesText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) {
      addNotification('Внимание', 'Пожалуйста, введите никнеймы участников.', 'system');
      return;
    }

    if (user.gramsBalance < duelBet) {
      addNotification('Ошибка баланса', 'Недостаточно Integra для вашей ставки.', 'system');
      return;
    }

    setIsInviting(true);
    setInviteProgress(0);
    setInviteLogs([]);

    let currentProgress = 0;
    const totalLinesCount = lines.length;
    
    const apiPrefix = inviteMethod === 'telegram' ? '✈️ [Telegram API]' : inviteMethod === 'vk' ? '💙 [VK API]' : '⚡ [Express Pool API]';

    const interval = setInterval(() => {
      currentProgress += 10;
      if (currentProgress > 100) currentProgress = 100;
      setInviteProgress(currentProgress);

      const logIndex = Math.floor((currentProgress / 100) * totalLinesCount);
      const activeLine = lines[Math.min(logIndex, totalLinesCount - 1)] || '@user';

      const messages = [
        `${apiPrefix} Инициализация безопасного API-соединения... OK.`,
        `${apiPrefix} Авторизация токена сессии конструктора Integram... OK.`,
        `${apiPrefix} Генерация уникальной ссылки на дуэль по матчу...`,
        `${apiPrefix} Отправка персонального инвайта для ${activeLine}...`,
        `${apiPrefix} Сформирован вебхук для ${activeLine}: "Эй! Прими вызов от ${user.name}!"`,
        `${apiPrefix} Синхронизация статуса доставки... Доставлено!`,
        `${apiPrefix} Пул обработал пачку из ${Math.min(totalLinesCount, 250)} участников.`,
        `${apiPrefix} Подключение участников к сокет-комнате голосования...`,
        `${apiPrefix} Сохранение реферальных связей в СУБД... Готово!`,
        `${apiPrefix} Команда успешно собрана! Все ${totalLinesCount} участников получили приглашения.`
      ];

      const currentLog = messages[Math.min(Math.floor(currentProgress / 10) - 1, messages.length - 1)];
      setInviteLogs(prev => [...prev, currentLog]);

      if (currentProgress >= 100) {
        clearInterval(interval);
        
        const success = createDuel(
          selectedMatch,
          predictionType,
          predictionDetail,
          captainSelection,
          'Группа пророков',
          duelBet,
          undefined,
          'none',
          true
        );

        if (success) {
          addNotification(
            'Группа собрана! 🎉',
            `Успешно отправлено ${totalLinesCount} приглашений! Собрана команда из лучших пророков!`,
            'duel'
          );
          setIsInviting(false);
        } else {
          setIsInviting(false);
        }
      }
    }, 250);
  };

  return (
    <div className="space-y-8 text-slate-800">
      {/* Visual Header Banner - Styled like News Feed for visual consistency */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-10 font-black text-9xl select-none pointer-events-none">FC</div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-yellow-300" /> Битва пророков
            </div>
            <h1 className="text-2xl md:text-3xl font-black font-display tracking-tight leading-tight text-white">
              Вызови друга на дуэль пророков!
            </h1>
            <p className="text-sm text-emerald-50/90 font-medium">
              Создайте событие-вызов, соберите команду из друзей, поставьте внутренние «Integra» и проверьте, чей футбольный интеллект выше. Победитель срывает куш и получает значки «Пророк» или «Дивергент»!
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Creator Form and List of Duels */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* DUEL CREATOR */}
        <div className="xl:col-span-1">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm sticky top-28 space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-150">
              <span className="p-2.5 bg-slate-50 border border-slate-200 text-sky-600 rounded-xl text-xl">⚔️</span>
              <h3 className="text-xl md:text-2xl font-black text-slate-800 font-display">Создать Вызов</h3>
            </div>

            {/* Mode Toggle */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setIsGroupMode(false)}
                className={`py-2 px-3 rounded-xl font-bold text-xs text-center transition cursor-pointer ${
                  !isGroupMode
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ⚔️ Дуэль 1 на 1
              </button>
              <button
                type="button"
                onClick={() => setIsGroupMode(true)}
                className={`py-2 px-3 rounded-xl font-bold text-xs text-center transition cursor-pointer ${
                  isGroupMode
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🏃‍♂️ Групповая игра
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Match Select */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">1. Выберите матч</label>
                <select
                  value={selectedMatch}
                  onChange={(e) => {
                    setSelectedMatch(e.target.value);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-md font-bold text-slate-800 focus:border-sky-500 outline-none cursor-pointer"
                >
                  {matches.map(m => (
                    <option key={m.id} value={m.id} className="bg-white text-slate-800">{m.teamAFlag} {m.teamA} - {m.teamBFlag} {m.teamB}</option>
                  ))}
                </select>
              </div>

              {/* Prediction Type Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">2. Тип прогноза</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPredictionType('match_outcome');
                      setPredictionDetail(preloadedPredictions.match_outcome[0].text);
                      setCaptainSelection(preloadedPredictions.match_outcome[0].value);
                      setIsCustomPrediction(false);
                    }}
                    className={`p-3 rounded-xl font-bold text-sm text-center border transition cursor-pointer ${
                      predictionType === 'match_outcome'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-600 shadow-md scale-[1.02] ring-2 ring-emerald-100/50'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Исход матча
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPredictionType('custom_event');
                      setPredictionDetail(preloadedPredictions.custom_event[0].text);
                      setCaptainSelection(preloadedPredictions.custom_event[0].value);
                      setIsCustomPrediction(false);
                    }}
                    className={`p-3 rounded-xl font-bold text-sm text-center border transition cursor-pointer ${
                      predictionType === 'custom_event'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-600 shadow-md scale-[1.02] ring-2 ring-emerald-100/50'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Событие
                  </button>
                </div>
              </div>

              {/* Prediction Detail input with quick template buttons */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-500 uppercase">
                  3. Ваш прогноз (Впишите свой вариант или выберите шаблон)
                </label>
                
                {/* Text input for custom forecast */}
                <input
                  type="text"
                  value={predictionDetail}
                  onChange={(e) => setPredictionDetail(e.target.value)}
                  placeholder={predictionType === 'match_outcome' ? "Например: Победа Испании 3:0 или ничья" : "Например: Месси забьет со штрафного"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800 focus:border-sky-500 outline-none placeholder-slate-400"
                />

                {/* Grid of quick preset templates */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Быстрые шаблоны:</span>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-150">
                    {preloadedPredictions[predictionType].map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setPredictionDetail(opt.text);
                          setCaptainSelection(opt.value);
                        }}
                        className={`text-[10px] font-semibold py-1 px-2.5 rounded-lg border transition cursor-pointer ${
                          predictionDetail === opt.text
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-600 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Choice helper */}
                <div className="space-y-1 pt-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">На какой выбор вы ставите?</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCaptainSelection(predictionType === 'match_outcome' ? 'teamA' : 'yes')}
                      className={`p-2 rounded-xl font-extrabold text-xs text-center border transition cursor-pointer ${
                        captainSelection === 'teamA' || captainSelection === 'yes'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-600 shadow-md scale-[1.02] ring-2 ring-emerald-100/50'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {predictionType === 'match_outcome' ? 'Победа Испании (А) / Да' : 'Да / Команда А'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCaptainSelection(predictionType === 'match_outcome' ? 'teamB' : 'no')}
                      className={`p-2 rounded-xl font-extrabold text-xs text-center border transition cursor-pointer ${
                        captainSelection === 'teamB' || captainSelection === 'no'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-600 shadow-md scale-[1.02] ring-2 ring-emerald-100/50'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {predictionType === 'match_outcome' ? 'Победа Германии (Б) / Нет' : 'Нет / Команда Б'}
                    </button>
                  </div>
                </div>
              </div>

              {isGroupMode ? (
                <div className="p-4 bg-sky-50 border border-sky-100 rounded-2xl space-y-4">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1 bg-sky-100 rounded text-sky-600">🙌</span>
                    <h4 className="font-extrabold text-sky-900 text-sm">
                      Настройка Группового Голосования
                    </h4>
                  </div>
                  <p className="text-[11px] text-sky-700 leading-relaxed">
                    Вы создаете открытый вызов. Все приглашенные участники (до 1000 человек) смогут видеть вашу ставку и делать свои прогнозы на любой исход этого матча.
                  </p>

                  {/* Nicknames text area */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-[11px] font-bold text-slate-550 uppercase">
                        Укажите никнеймы участников (построчно)
                      </label>
                      <span className="text-[10px] font-bold text-sky-700">
                        Лимит: 1000 чел.
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      value={groupUsernamesText}
                      onChange={(e) => setGroupUsernamesText(e.target.value)}
                      placeholder="@ivan_predict&#10;@sport_boss&#10;@dima_vova&#10;@elena_goals"
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-mono font-bold text-slate-800 focus:border-sky-500 outline-none placeholder-slate-400"
                    />
                  </div>

                  {/* Quick Preset Generators */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setGroupUsernamesText('@alex_sport\n@marat_goal\n@elena_predict\n@dima_vova\n@olga_win\n@sergey_boss\n@artem_euro\n@nikita_fan\n@anna_cup\n@misha_pro')}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold py-1.5 px-2 rounded-lg border border-slate-200 transition"
                    >
                      🙌 10 болельщиков
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        let bulkText = '@alex_sport\n@marat_goal\n@elena_predict\n@dima_vova\n@olga_win\n@sergey_boss\n@artem_euro\n@nikita_fan';
                        for(let i=9; i<=1000; i++) {
                          bulkText += `\n@proph_${i}`;
                        }
                        setGroupUsernamesText(bulkText);
                        setInviteMethod('pool');
                      }}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-white text-[10px] font-extrabold py-1.5 px-2 rounded-lg border border-emerald-600 transition"
                    >
                      ⚡ 1000 участников (Макс)
                    </button>
                  </div>

                  {/* API Method selector */}
                  <div className="space-y-2 pt-1">
                    <label className="block text-[11px] font-bold text-slate-550 uppercase">
                      Метод отправки API
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'telegram', label: '✈️ Telegram API', desc: 'Персонально' },
                        { id: 'vk', label: '💙 VK API', desc: 'Персонально' },
                        { id: 'pool', label: '⚡ Пул-отправка', desc: 'Сразу пачкой' }
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setInviteMethod(m.id as any)}
                          className={`p-2 rounded-xl border transition text-center flex flex-col items-center justify-center cursor-pointer ${
                            inviteMethod === m.id
                              ? 'bg-sky-100 border-sky-400 text-sky-800 font-extrabold shadow-xs'
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-[10px] font-bold leading-tight">{m.label}</span>
                          <span className="text-[8px] font-semibold text-slate-400 mt-0.5">{m.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Real-time Simulated API Console */}
                  {isInviting && (
                    <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-2 text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                          ● ИДЕТ ИНТЕГРАЦИЯ API...
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">
                          {inviteProgress}%
                        </span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-200" 
                          style={{ width: `${inviteProgress}%` }}
                        />
                      </div>

                      {/* Log lines */}
                      <div className="h-24 overflow-y-auto font-mono text-[9px] text-slate-300 space-y-1.5 custom-scrollbar">
                        {inviteLogs.map((log, index) => (
                          <div key={index} className="border-l-2 border-emerald-500 pl-1.5 py-0.5 bg-slate-950/40 rounded-r">
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Select friend */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">4. Кому бросаем вызов?</label>
                      <select
                        value={targetFriend}
                        onChange={(e) => setTargetFriend(e.target.value)}
                        disabled={!!customFriendName}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-md font-bold text-slate-800 focus:border-sky-500 outline-none cursor-pointer disabled:opacity-45"
                      >
                        {MOCK_FRIENDS.map((f, i) => (
                          <option key={i} value={f.name} className="bg-white text-slate-850">{f.avatar} {f.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* New Friend Invite Form Card */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] bg-slate-200 text-slate-700 font-extrabold px-2 py-0.5 rounded uppercase tracking-wide">
                          Пригласить нового друга
                        </span>
                        
                        {/* Real Social Share URL Trigger */}
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`https://t.me/share/url?url=${encodeURIComponent(window.location.origin + '?invite=' + user.referralCode)}&text=${encodeURIComponent(`⚔️ Вызываю тебя на футбольный тотализатор в Интеграм FC! Ставлю ${duelBet} Integra на прогноз "${predictionDetail}". Сможешь угадать точнее?`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-sky-500 hover:bg-sky-600 text-white p-1 rounded-lg text-[9px] font-black flex items-center gap-1 transition"
                          >
                            ✈️ TG
                          </a>
                          <a
                            href={`https://vk.com/share.php?url=${encodeURIComponent(window.location.origin + '?invite=' + user.referralCode)}&title=${encodeURIComponent(`Бросаю футбольный вызов в Интеграм FC! Моя ставка: ${duelBet} Integra.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded-lg text-[9px] font-black flex items-center gap-1 transition"
                          >
                            💙 VK
                          </a>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Имя друга</label>
                        <input
                          type="text"
                          value={customFriendName}
                          onChange={(e) => setCustomFriendName(e.target.value)}
                          placeholder="Имя нового друга..."
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-md font-semibold text-slate-800 focus:border-sky-500 outline-none placeholder-slate-400"
                        />
                      </div>

                      {/* Notification Channel Setup inside the card */}
                      <div className="space-y-3 pt-1">
                        <div className="flex justify-between items-center">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase">Канал уведомления</label>
                          <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                            {notificationChannel === 'telegram' ? 'Telegram ✈️' : notificationChannel === 'vk' ? 'ВКонтакте 🔵' : notificationChannel === 'yandex' ? 'Яндекс Почта 🔴' : 'Без уведомления 🔕'}
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-1.5">
                          {(['telegram', 'vk', 'yandex', 'none'] as const).map((channel) => {
                            const label = { telegram: '✈️ TG', vk: '🔵 VK', yandex: '🔴 YX', none: '🔕 Нет' }[channel];
                            return (
                              <button
                                key={channel}
                                type="button"
                                onClick={() => setNotificationChannel(channel)}
                                className={`py-2 px-1 rounded-xl font-bold text-[10px] text-center border transition cursor-pointer ${
                                  notificationChannel === channel
                                    ? 'bg-sky-50 border-sky-400 text-sky-700 font-extrabold shadow-xs'
                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>

                        {notificationChannel !== 'none' && (
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Адрес получателя: ник, ссылка на профиль или email</label>
                            <input
                              type="text"
                              value={friendHandle}
                              onChange={(e) => handleHandleChange(e.target.value)}
                              placeholder={
                                notificationChannel === 'telegram'
                                  ? 'Например: @alex_predict, ссылка или email'
                                  : notificationChannel === 'vk'
                                  ? 'Например: vk.com/alex_sport'
                                  : 'Например: alex@yandex.ru'
                              }
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:border-sky-500 outline-none placeholder-slate-400"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Integra bet */}
              <div>
                <label className="block text-xs font-bold text-slate-550 uppercase mb-2">5. Сумма ставки (в Integra)</label>
                <div className="flex flex-row gap-2 items-center justify-between">
                  {/* Presets - neat, on the left */}
                  <div className="flex gap-1.5 shrink-0">
                    {[50, 100, 250].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDuelBet(Math.min(preset, user.gramsBalance))}
                        className={`py-2 px-3 rounded-xl font-black text-sm text-center border transition cursor-pointer ${
                          duelBet === preset
                            ? 'bg-gradient-to-r from-rose-600 to-amber-500 text-white border-rose-500 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  {/* Custom input - larger font size on one line */}
                  <div className="relative flex-1 min-w-[120px]">
                    <input
                      type="number"
                      min={10}
                      max={user.gramsBalance}
                      value={duelBet}
                      onChange={(e) => {
                        let val = Number(e.target.value);
                        if (val > user.gramsBalance) {
                          val = user.gramsBalance;
                        }
                        setDuelBet(val);
                      }}
                      placeholder="Ставка..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-3.5 pr-14 text-xl sm:text-2xl font-black text-slate-850 font-mono focus:border-sky-500 outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 font-sans">
                      Integra
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2 px-1">
                  <span className="text-[11px] text-slate-500 font-medium">Доступный баланс: <span className="font-bold text-slate-700">{user.gramsBalance} Integra</span></span>
                  {duelBet > user.gramsBalance && (
                    <span className="text-[10px] font-bold text-rose-600 animate-pulse">Недостаточно Integra!</span>
                  )}
                </div>
              </div>

              {/* Adaptive Action button */}
              {isGroupMode ? (
                <button
                  type="button"
                  onClick={handleStartGroupInvitation}
                  disabled={isInviting || user.gramsBalance < duelBet}
                  className="w-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:opacity-95 text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg shadow-emerald-500/15 transition text-md sm:text-lg flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 text-center uppercase tracking-wider disabled:opacity-45"
                >
                  🙌 Собрать команду для голосования
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={user.gramsBalance < duelBet}
                  className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg shadow-rose-500/10 transition text-md sm:text-lg flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 text-center uppercase tracking-wider disabled:opacity-45"
                >
                  ⚔️ Вызвать друга на дуэль
                </button>
              )}
            </form>
          </div>
        </div>

        {/* ACTIVE DUELS & PERSONALIZED CARD GENERATOR */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <h3 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-2 font-display">
              <span>🎟</span> Ваши Битвы и Дуэли
            </h3>
            <button
              onClick={() => setShowLandingSim(!showLandingSim)}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-black py-2 px-3.5 rounded-xl transition cursor-pointer shadow-xs"
            >
              Симулятор Друга 👤
            </button>
          </div>

          {/* Simulated Referral Landing Section - kept sky-blue */}
          <AnimatePresence>
            {showLandingSim && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#0b1c3c] border-2 border-sky-500/30 rounded-3xl p-6 space-y-4 overflow-hidden"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🙌</span>
                  <div>
                    <h4 className="font-extrabold text-white text-lg font-display">Как ваш друг видит приглашение?</h4>
                    <p className="text-xs text-slate-300">Симуляция перехода по вашей реферальной ссылке-карточке</p>
                  </div>
                </div>

                <div className="bg-[#0e214d] rounded-2xl p-4 border border-sky-500/10 space-y-3">
                  <div className="flex items-center gap-2 text-md font-bold text-white">
                    <span className="text-xl">👉</span>
                    <span>Реферальный инвайт-код: <strong className="text-sky-300 font-mono">{user.referralCode}</strong></span>
                  </div>
                  <p className="text-slate-300 text-sm">
                    Новый пользователь видит крутой баннер: <strong className="text-white">«{user.name} зовет тебя в битву пророков! Прими вызов, угадай исход и выиграй ценные Integra!»</strong>
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    <input
                      type="text"
                      value={simFriendName}
                      onChange={(e) => setSimFriendName(e.target.value)}
                      placeholder="Имя друга для симуляции"
                      className="bg-[#122c66] border border-sky-500/30 rounded-xl px-3 py-2 text-sm font-semibold text-white outline-none placeholder-slate-400"
                    />
                    <button
                      onClick={simulateReferralLanding}
                      className="bg-sky-500 hover:bg-sky-600 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs cursor-pointer transition shadow-sm shrink-0"
                    >
                      Имитировать регистрацию друга
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">При регистрации друга вы оба получите по +150 Integra на баланс!</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {duels.length === 0 ? (
            <p className="text-slate-400 text-lg py-12 text-center">У вас пока нет созданных дуэлей. Бросьте вызов другу слева!</p>
          ) : (
            <div className="space-y-6">
              {duels.map(duel => {
                const isPending = duel.status === 'pending';
                
                // Get style & badge details depending on status
                const statusMeta = {
                  pending: { label: 'Ожидает ответа', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                  accepted: { label: 'Дуэль активна', color: 'bg-sky-50 text-sky-700 border-sky-200 font-bold' },
                  captain_won: { label: 'Вы выиграли! 🔮', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' },
                  friend_won: { label: 'Друг победил 🎯', color: 'bg-rose-50 text-rose-700 border-rose-200' },
                  all_lost: { label: 'Афоня! 🚬', color: 'bg-slate-100 text-slate-600 border-slate-200' },
                }[duel.status] || { label: 'Завершена', color: 'bg-slate-100 text-slate-600 border-slate-200' };

                const match = matches.find(m => m.id === duel.matchId || `${m.teamA} - ${m.teamB}` === duel.matchTitle);

                if (duel.isGroupGame) {
                  const participants = duel.participants || [];
                  const userJoinName = joinNames[duel.id] || '';
                  const userJoinSelection = joinSelections[duel.id] || (duel.predictionType === 'match_outcome' ? 'teamA' : 'yes');
                  const userJoinBet = joinBets[duel.id] || 100;

                  return (
                    <motion.div 
                      key={duel.id}
                      layoutId={`duel_card_${duel.id}`}
                      className="bg-white rounded-3xl border-2 border-sky-500/30 p-5 md:p-6 shadow-md relative overflow-hidden text-slate-850"
                    >
                      {/* Glassmorphic ticket-style background pattern */}
                      <div className="absolute right-0 top-0 h-full w-24 bg-sky-50/10 border-l border-dashed border-sky-200 flex items-center justify-center select-none pointer-events-none">
                        <div className="rotate-90 font-black text-sky-600/5 tracking-widest text-lg font-mono">
                          GROUP GAME
                        </div>
                      </div>

                      <div className="pr-12 sm:pr-20 space-y-4">
                        {/* Top Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="bg-sky-50 border border-sky-200 text-sky-700 font-extrabold text-xs px-2.5 py-1 rounded-xl flex items-center gap-1">
                            <span>🙌</span> Групповая игра (до 1000 участников)
                          </span>
                          <span className="text-xs font-black text-sky-600 bg-sky-50 border border-sky-200 py-1 px-3 rounded-full">
                            🔥 {participants.length} в игре
                          </span>
                        </div>

                        {/* Match & Captain Bet Details */}
                        <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-2">
                          <div className="flex items-center gap-2 font-black text-slate-850 text-sm">
                            {match ? (
                              <div className="flex items-center gap-2">
                                <img src={getCountryFlagUrl(match.teamA)} alt={match.teamA} className="w-5 h-3.5 object-cover rounded border border-slate-100" referrerPolicy="no-referrer" />
                                <span>{match.teamA}</span>
                                <span className="text-slate-400 font-normal">vs</span>
                                <img src={getCountryFlagUrl(match.teamB)} alt={match.teamB} className="w-5 h-3.5 object-cover rounded border border-slate-100" referrerPolicy="no-referrer" />
                                <span>{match.teamB}</span>
                              </div>
                            ) : (
                              <span>⚽️ {duel.matchTitle}</span>
                            )}
                          </div>
                          
                          <div className="border-t border-slate-200/60 pt-2 flex items-start gap-2.5">
                            <span className="text-3xl shrink-0">👑</span>
                            <div>
                              <p className="text-[10px] text-sky-600 font-bold uppercase tracking-wider">Капитан (Создатель)</p>
                              <p className="font-extrabold text-slate-800 text-sm">{duel.creatorName}</p>
                              <p className="text-xs text-slate-600 font-semibold bg-sky-50/80 border border-sky-100 py-1 px-2.5 rounded-lg mt-1 inline-block">
                                Ставка капитана: <strong className="text-sky-800">{duel.predictionDetail}</strong> • <strong className="text-amber-600 font-mono">{duel.betAmount} Integra</strong>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* List of Joined Participants */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-550 uppercase flex items-center justify-between">
                            <span>Участники ({participants.length})</span>
                            {participants.length > 0 && (
                              <span className="text-[10px] text-slate-400 font-normal">Показаны последние</span>
                            )}
                          </h4>
                          
                          {participants.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-3 bg-slate-50/50 rounded-xl text-center border border-dashed border-slate-200">
                              Пока никто не присоединился. Будьте первым или симулируйте толпу кнопками ниже!
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {/* Group Avatar stack */}
                              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                                <div className="flex -space-x-2 overflow-hidden">
                                  {participants.slice(0, 10).map((p, idx) => (
                                    <span key={idx} className="inline-block h-8 w-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-sm shadow-xs" title={p.name}>
                                      {p.avatar}
                                    </span>
                                  ))}
                                  {participants.length > 10 && (
                                    <span className="flex items-center justify-center h-8 w-8 rounded-full bg-sky-100 border-2 border-white text-[10px] font-black text-sky-700 shadow-xs">
                                      +{participants.length - 10}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-500 font-medium">Активное сообщество в игре!</span>
                              </div>

                              {/* Latest 3 records */}
                              <div className="divide-y divide-slate-100 max-h-32 overflow-y-auto pr-1">
                                {participants.slice(-3).reverse().map((p, idx) => (
                                  <div key={idx} className="flex items-center justify-between py-1.5 text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className="text-md">{p.avatar}</span>
                                      <span className="font-bold text-slate-700 truncate max-w-[120px]">{p.name}</span>
                                      <span className="text-slate-400 text-[10px]">{p.timestamp}</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] mr-1">
                                        {p.selection === 'teamA' || p.selection === 'yes' ? 'За Капитана' : 'Против'}
                                      </span>
                                      <span className="font-mono font-bold text-amber-600">{p.betAmount} г</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Join Game Form */}
                        <div className="bg-sky-50/50 border border-sky-100 rounded-2xl p-4 space-y-3">
                          <h4 className="text-xs font-black text-sky-800 uppercase flex items-center gap-1">
                            <span>👉</span> Сделать свою ставку в игре!
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                            <input
                              type="text"
                              value={userJoinName}
                              onChange={(e) => {
                                const newNames = { ...joinNames, [duel.id]: e.target.value };
                                setJoinNames(newNames);
                              }}
                              placeholder="Имя друга..."
                              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-sky-400"
                            />
                            
                            <select
                              value={userJoinSelection}
                              onChange={(e) => {
                                const newSelections = { ...joinSelections, [duel.id]: e.target.value };
                                setJoinSelections(newSelections);
                              }}
                              className="bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-sky-400 cursor-pointer"
                            >
                              {duel.predictionType === 'match_outcome' ? (
                                <>
                                  <option value="teamA">Команда А (Испания)</option>
                                  <option value="draw">Ничья</option>
                                  <option value="teamB">Команда Б (Германия)</option>
                                </>
                              ) : (
                                <>
                                  <option value="yes">Да (Событие произойдет)</option>
                                  <option value="no">Нет (Событие не произойдет)</option>
                                </>
                              )}
                            </select>

                            <div className="flex gap-1.5">
                              <input
                                type="number"
                                min={10}
                                max={500}
                                value={userJoinBet}
                                onChange={(e) => {
                                  const newBets = { ...joinBets, [duel.id]: Number(e.target.value) };
                                  setJoinBets(newBets);
                                }}
                                className="w-20 bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold font-mono text-slate-800 outline-none focus:border-sky-400"
                                placeholder="Сумма"
                              />
                              
                              <button
                                type="button"
                                onClick={() => {
                                  const finalName = userJoinName.trim() || 'Гость ' + Math.floor(Math.random() * 900 + 100);
                                  const success = joinGroupGame(duel.id, finalName, userJoinSelection, userJoinBet);
                                  if (success) {
                                    // Reset input name
                                    setJoinNames(prev => ({ ...prev, [duel.id]: '' }));
                                  }
                                }}
                                className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs py-2 px-3 rounded-xl transition cursor-pointer shadow-xs"
                              >
                                Поставить! 🚀
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Simulation controls for 1000 participants limit! */}
                        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">⚡ Симулятор приглашений (до 1000 чел.)</p>
                            <p className="text-[9px] text-slate-400 leading-none mt-0.5">Автогенерация приглашенных участников системы</p>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => simulateGroupParticipants(duel.id, 50)}
                              disabled={participants.length >= 1000}
                              className="bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold text-[10px] py-1.5 px-2.5 rounded-lg transition cursor-pointer disabled:opacity-40"
                            >
                              +50 человек
                            </button>
                            <button
                              type="button"
                              onClick={() => simulateGroupParticipants(duel.id, 250)}
                              disabled={participants.length >= 1000}
                              className="bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold text-[10px] py-1.5 px-2.5 rounded-lg transition cursor-pointer disabled:opacity-40"
                            >
                              +250 человек
                            </button>
                            <button
                              type="button"
                              onClick={() => simulateGroupParticipants(duel.id, 1000 - participants.length)}
                              disabled={participants.length >= 1000}
                              className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-black text-[10px] py-1.5 px-2.5 rounded-lg transition cursor-pointer disabled:opacity-40"
                            >
                              Заполнить до 1000! 📈
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div 
                    key={duel.id}
                    layoutId={`duel_card_${duel.id}`}
                    className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 shadow-sm relative overflow-hidden text-slate-850"
                  >
                    {/* Glassmorphic ticket-style background pattern */}
                    <div className="absolute right-0 top-0 h-full w-24 bg-slate-50/50 border-l border-dashed border-slate-250 flex items-center justify-center select-none">
                      <div className="rotate-90 font-black text-sky-600/5 tracking-widest text-lg font-mono">
                        TO_BET FC
                      </div>
                    </div>

                    <div className="pr-12 sm:pr-20 space-y-4">
                      {/* Top Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {match ? (
                          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-xs px-2.5 py-1 rounded-xl">
                            <img src={getCountryFlagUrl(match.teamA)} alt={match.teamA} className="w-5 h-3.5 object-cover rounded border border-slate-100" referrerPolicy="no-referrer" />
                            <span>{match.teamA}</span>
                            <span className="text-slate-400 font-normal">vs</span>
                            <img src={getCountryFlagUrl(match.teamB)} alt={match.teamB} className="w-5 h-3.5 object-cover rounded border border-slate-100" referrerPolicy="no-referrer" />
                            <span>{match.teamB}</span>
                          </div>
                        ) : (
                          <span className="bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-xs px-2.5 py-1 rounded-xl">
                            ⚽️ {duel.matchTitle}
                          </span>
                        )}
                        <span className={`text-xs font-extrabold py-1 px-3 rounded-full border ${statusMeta.color}`}>
                          {statusMeta.label}
                        </span>
                      </div>

                      {/* Duel contestants & forecasts */}
                      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 py-2">
                        {/* Captain (Me) */}
                        <div className="flex items-center gap-3 w-full lg:w-[46%] bg-slate-50 p-3 rounded-2xl border border-slate-150">
                          {duel.creatorAvatar.startsWith('data:') || duel.creatorAvatar.startsWith('http') || duel.creatorAvatar.startsWith('blob:') ? (
                            <img 
                              src={duel.creatorAvatar} 
                              alt={duel.creatorName} 
                              className="w-12 h-12 rounded-full border border-slate-200 object-cover shadow-sm shrink-0" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-4xl shrink-0">{duel.creatorAvatar}</span>
                          )}
                          <div>
                            <p className="text-xs text-sky-600 font-bold uppercase">Капитан (Вы)</p>
                            <p className="font-extrabold text-slate-800 text-md truncate max-w-[140px]">{duel.creatorName}</p>
                            <p className="text-xs text-slate-500 font-medium">Прогноз: {duel.predictionDetail}</p>
                          </div>
                        </div>

                        {/* VS sword icon */}
                        <div className="text-rose-500 text-2xl shrink-0">⚔️</div>

                        {/* Friend */}
                        <div className="flex items-center gap-3 w-full lg:w-[46%] bg-slate-50 p-3 rounded-2xl border border-slate-150">
                          <span className="text-4xl">🤖</span>
                          <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">Соперник</p>
                            <p className="font-extrabold text-slate-800 text-md truncate max-w-[140px]">{duel.targetFriendName}</p>
                            <p className="text-xs text-slate-500 font-medium">
                              {isPending ? 'Ожидает выбора...' : `Выбор: ${duel.friendSelection === 'yes' ? 'Да' : duel.friendSelection === 'teamB' ? 'Победа Б' : 'Противоположный'}`}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Integra bet info and resolve simulation if accepted */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-150">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 text-xs font-bold uppercase">Общий банк:</span>
                          <span className="font-mono text-lg font-black text-amber-600">
                            {duel.betAmount * 2} <span className="text-sm font-bold text-sky-600">Integra</span>
                          </span>
                        </div>

                        {/* Share Card Trigger */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleShare(duel.id)}
                            className="bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs sm:text-sm py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                          >
                            <Share2 className="w-4 h-4" /> Поделиться
                          </button>
                        </div>
                      </div>

                      {/* Display share success */}
                      {selectedDuelForShare === duel.id && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-800 text-xs space-y-2">
                          <p className="font-bold flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-emerald-600" /> Ссылка-карточка дуэли скопирована в буфер!
                          </p>
                          <p className="text-slate-600">Отправьте ее другу в Telegram, VK или Stories. Шаблон содержит реферальную ссылку и красивую карточку результата!</p>
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-500 font-mono text-[10px] break-all leading-tight">
                            {`⚔️ БИТВА ПРОРОКОВ! ⚔️\nЯ, капитан ${duel.creatorName}, вызываю тебя на дуэль...`}
                          </div>
                        </div>
                      )}

                      {/* Special Afonya or Oracle result banner */}
                      {duel.status === 'all_lost' && (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
                          <span className="text-4xl">🚬</span>
                          <div>
                            <p className="font-extrabold text-slate-700 text-sm font-display">Вы все получили значок «Афоня»!</p>
                            <p className="text-xs text-slate-500">«Даже Афоня иногда ошибается, но не перестаёт играть». Ловите мемную карточку для шеринга в соцсети!</p>
                          </div>
                        </div>
                      )}

                      {duel.isCollectiveOracle && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
                          <span className="text-4xl">🧠</span>
                          <div>
                            <p className="font-extrabold text-amber-800 text-sm font-display">Получен значок «Футбольный Оракул»!</p>
                            <p className="text-xs text-amber-600">Вы оба угадали этот сложнейший исход. У вас потрясающая аналитика! Вы настоящие легенды прогнозирования.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Notification Gateway & Live Feed */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-150">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
                  <Terminal className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-md font-display flex items-center gap-2">
                    Live-лента уведомлений <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  </h4>
                  <p className="text-[11px] text-slate-500">Активность участников системы в реальном времени</p>
                </div>
              </div>
            </div>

            <div className="max-h-[240px] overflow-y-auto divide-y divide-slate-100 font-mono text-xs pr-1 scrollbar-thin scrollbar-thumb-slate-250">
                {[
                  {
                    id: 'sys_1',
                    category: 'Участник',
                    icon: '🙌',
                    text: 'Алексей Смирнов (@alex_predict) создал дуэль с Дмитрием Мельниковым (@dimas_chelsea) на матч Испания - Германия (Ставка: 150 Integra).',
                    time: '06:31:12',
                    type: 'user'
                  },
                  {
                    id: 'sys_2',
                    category: 'Система',
                    icon: '💎',
                    text: 'Участник Мария Семенова (@mary_goals) получила почетное достижение «Создатель» за настройку кастомного голосования.',
                    time: '06:28:44',
                    type: 'system'
                  },
                  {
                    id: 'sys_3',
                    category: 'Участник',
                    icon: '🏆',
                    text: 'Ольга Кузнецова (@helga_oraculum) выиграла дуэль у Евгения Романова (@evgen_spurs)! +300 Integra зачислено на баланс.',
                    time: '06:22:15',
                    type: 'user'
                  },
                  {
                    id: 'sys_4',
                    category: 'Система',
                    icon: '🔌',
                    text: 'Участник Михаил Тарасов (@mike_fan) вошел через Telegram WebApp и присоединился к групповому вызову.',
                    time: '06:19:02',
                    type: 'system'
                  },
                  {
                    id: 'sys_5',
                    category: 'Участник',
                    icon: '⚽',
                    text: 'Дмитрий Мельников (@dimas_chelsea) сделал ставку Поб. Германия на матч Испания - Германия (50 Integra).',
                    time: '06:11:58',
                    type: 'user'
                  },
                  {
                    id: 'sys_6',
                    category: 'Система',
                    icon: '✉️',
                    text: 'Рассылка уведомления: Напоминание о начале матча Аргентина - Франция успешно доставлено 142 участникам системы.',
                    time: '06:05:30',
                    type: 'system'
                  }
                ].map((log) => {
                  const tagColors = log.type === 'user' ? 'text-indigo-600 bg-indigo-50 border-indigo-200' : 'text-slate-600 bg-slate-50 border-slate-200';
                  return (
                    <div key={log.id} className="py-2.5 px-1 space-y-1 transition hover:bg-slate-50/50">
                      <div className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <span>{log.icon}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black border ${tagColors}`}>{log.category.toUpperCase()}</span>
                        </div>
                        <span className="text-slate-400">{log.time}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed break-all">{log.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};
