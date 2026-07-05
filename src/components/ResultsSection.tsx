import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Award, Share2, TrendingUp, Trophy, CheckCircle, XCircle, Copy, Check, Star, Zap, UserCheck, Play, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ResultsSection: React.FC = () => {
  const { 
    matches, 
    user, 
    userBets, 
    customEvents, 
    duels, 
    badges, 
    getMatchDynamicOdds, 
    setActiveTab, 
    addNotification 
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'my' | 'big_wins'>('all');
  const [sharingDuelId, setSharingDuelId] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  // Filter finished matches
  const finishedMatches = matches.filter(m => m.status === 'finished');

  // Find all user bets on finished matches
  const finishedBets = Object.entries(userBets).filter(([matchId]) => {
    const match = matches.find(m => m.id === matchId);
    return match?.status === 'finished';
  });

  // Find custom events resolved on finished matches
  const finishedEvents = customEvents.filter(e => {
    const m = matches.find(match => match.id === e.matchId);
    return m?.status === 'finished';
  });

  // Find duels associated with finished matches
  const finishedDuels = duels.filter(d => {
    const m = matches.find(match => match.id === d.matchId);
    return m?.status === 'finished';
  });

  // Count active stats
  const totalUserWinnings = finishedBets.reduce((acc, [matchId, betVal]) => {
    const bet = betVal as { outcome: 'teamA' | 'draw' | 'teamB'; amount: number };
    const match = matches.find(m => m.id === matchId);
    if (!match) return acc;
    const outcome = match.scoreA! > match.scoreB! ? 'teamA' : match.scoreA! < match.scoreB! ? 'teamB' : 'draw';
    if (bet.outcome === outcome) {
      const dynamicOdds = getMatchDynamicOdds(match);
      let odds = 1.0;
      if (outcome === 'teamA') odds = dynamicOdds.oddsA;
      else if (outcome === 'draw') odds = dynamicOdds.oddsDraw;
      else if (outcome === 'teamB') odds = dynamicOdds.oddsB;
      return acc + Math.round(bet.amount * odds);
    }
    return acc;
  }, 0);

  const eventWinnings = finishedEvents.reduce((acc, e) => {
    if (e.isUserVoted) {
      const isYes = e.status === 'resolved_yes';
      const userSelected = e.userVoteSelection;
      const expectedSelection = isYes ? 'yes' : 'no';
      if (userSelected === expectedSelection) {
        return acc + Math.round(50 * (isYes ? e.oddsYes : e.oddsNo));
      }
    }
    return acc;
  }, 0);

  const duelWinnings = finishedDuels.reduce((acc, d) => {
    if (d.creatorId === 'u_me') {
      if (d.status === 'captain_won') {
        return acc + d.betAmount;
      }
    } else {
      if (d.status === 'friend_won') {
        return acc + d.betAmount;
      }
    }
    return acc;
  }, 0);

  const grandTotalWinnings = totalUserWinnings + eventWinnings + duelWinnings;

  // Unlocked badges related to predictions
  const unlockedBadges = badges.filter(b => b.isUnlocked);

  // Generate simulated local winners for finished matches
  const getSimulatedWinners = (matchId: string, scoreA: number, scoreB: number) => {
    const matchOutcome = scoreA > scoreB ? 'teamA' : scoreA < scoreB ? 'teamB' : 'draw';
    const mockWinners = [
      { name: 'Алексей Смирнов', username: 'alex_predict', avatar: '🦁', winAmount: 220, type: 'Дуэль' },
      { name: 'Дмитрий Мельников', username: 'dimas_chelsea', avatar: '⚽️', winAmount: 180, type: 'Ординар' },
      { name: 'Ольга Кузнецова', username: 'helga_oraculum', avatar: '🔮', winAmount: 340, type: 'Событие' },
      { name: 'Мария Семенова', username: 'mary_goals', avatar: '👑', winAmount: 410, type: 'Групповая' },
      { name: 'Игорь Канонир', username: 'gunner_igor', avatar: '🎯', winAmount: 150, type: 'Дуэль' }
    ];

    // Shuffle slightly based on matchId
    const seed = matchId.charCodeAt(0) || 1;
    const shuffled = [...mockWinners].sort((a, b) => ((a.winAmount * seed) % 10) - ((b.winAmount * seed) % 10));

    // Add user if they won
    const userBet = userBets[matchId];
    if (userBet && userBet.outcome === matchOutcome) {
      const matchObj = matches.find(m => m.id === matchId);
      if (matchObj) {
        const dynamicOdds = getMatchDynamicOdds(matchObj);
        let odds = 1.0;
        if (matchOutcome === 'teamA') odds = dynamicOdds.oddsA;
        else if (matchOutcome === 'draw') odds = dynamicOdds.oddsDraw;
        else if (matchOutcome === 'teamB') odds = dynamicOdds.oddsB;
        
        shuffled.unshift({
          name: `${user.name} (Вы)`,
          username: user.username,
          avatar: user.avatar,
          winAmount: Math.round(userBet.amount * odds),
          type: 'Ординар'
        });
      }
    }

    return shuffled.slice(0, 4);
  };

  const handleShare = (matchTitle: string, winnings: number, type: string) => {
    const textToCopy = `⚔️ Я ВЫИГРАЛ ${winnings} GRAM в Интеграм FC! ⚔️\n\nПрогноз по матчу "${matchTitle}" (${type}) зашел на ура! Мы пишем прогнозы, собираем команды за 20 минут без единой строчки кода на Интеграм.\n\nЗацени мой профиль и присоединяйся: ${window.location.origin}?invite=${user.referralCode}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
    }
    setCopiedText(true);
    addNotification(
      'Победа скопирована! 🏆',
      'Текст красивой карточки победы скопирован в буфер обмена. Поделись им с друзьями в Telegram или VK!',
      'system'
    );
    setTimeout(() => setCopiedText(false), 3000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Upper stats summary dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white rounded-3xl p-6 shadow-xl border border-emerald-500/20 relative overflow-hidden">
          <div className="absolute right-4 top-4 opacity-15">
            <Trophy className="w-24 h-24" />
          </div>
          <p className="text-xs text-emerald-200 font-extrabold uppercase tracking-wider">Всего выиграно в тотализаторе</p>
          <p className="text-4xl font-black font-mono mt-2 flex items-baseline gap-1.5">
            {grandTotalWinnings} <span className="text-lg font-bold text-emerald-200">Integra</span>
          </p>
          <div className="mt-4 flex gap-2 text-[11px] bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-500/20">
            <span className="text-amber-400 font-bold">💎 {totalUserWinnings}</span> ординары • 
            <span className="text-sky-300 font-bold">🔥 {eventWinnings}</span> события • 
            <span className="text-yellow-300 font-bold">⚔️ {duelWinnings}</span> дуэли
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-500 font-black uppercase tracking-wider">Угаданные исходы</p>
              <h3 className="text-3xl font-black text-slate-800 font-mono mt-1">
                {user.wins} / {user.wins + user.losses}
              </h3>
            </div>
            <span className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-500">
              <TrendingUp className="w-6 h-6" />
            </span>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-3">
            Ваш коэффициент точности прогнозов:{' '}
            <span className="font-extrabold text-indigo-600">
              {user.wins + user.losses > 0 
                ? Math.round((user.wins / (user.wins + user.losses)) * 100) 
                : 0}%
            </span>. Продолжайте делать прогнозы для улучшения ранга в лиге!
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-500 font-black uppercase tracking-wider">Знаки отличия победителя</p>
              <h3 className="text-3xl font-black text-amber-600 font-mono mt-1">
                {unlockedBadges.length} / {badges.length}
              </h3>
            </div>
            <span className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-amber-500">
              <Award className="w-6 h-6" />
            </span>
          </div>
          <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-none">
            {unlockedBadges.map(b => (
              <span 
                key={b.id} 
                className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 shadow-3xs cursor-pointer text-md"
                title={`${b.title}: ${b.description}`}
              >
                {b.iconName}
              </span>
            ))}
            {unlockedBadges.length === 0 && (
              <span className="text-xs text-slate-400 font-semibold italic">Пока нет разблокированных наград</span>
            )}
          </div>
        </div>
      </div>

      {/* Main filter headers */}
      <div className="pb-2 border-b-4 border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-2 font-display uppercase">
            <span>🏆</span> Результаты и расчет ставок
          </h2>
          <p className="text-[11px] font-bold text-emerald-600 mt-0.5 uppercase tracking-wider">
            Распределенный расчет коэффициентов, выплаты токенов Integra и победные купоны
          </p>
        </div>

        <div className="flex gap-1.5 self-start md:self-center">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase transition cursor-pointer ${
              activeFilter === 'all' 
                ? 'bg-slate-800 text-white shadow-md' 
                : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-600'
            }`}
          >
            Все матчи ({finishedMatches.length})
          </button>
          <button
            onClick={() => setActiveFilter('my')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase transition cursor-pointer ${
              activeFilter === 'my' 
                ? 'bg-slate-800 text-white shadow-md' 
                : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-600'
            }`}
          >
            Мои ставки
          </button>
          <button
            onClick={() => setActiveFilter('big_wins')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase transition cursor-pointer ${
              activeFilter === 'big_wins' 
                ? 'bg-slate-800 text-white shadow-md' 
                : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-600'
            }`}
          >
            Зал славы 👑
          </button>
        </div>
      </div>

      {/* Conditional rendering for empty state */}
      {finishedMatches.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center max-w-2xl mx-auto space-y-5 shadow-sm">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-3xl mx-auto border border-rose-100">
            🏟
          </div>
          <h3 className="text-xl font-black text-slate-800">Матчи еще не завершились!</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            В данный момент в тотализаторе нет завершенных матчей. Но вы можете стать судьей самостоятельно прямо сейчас! Перейдите в <strong className="text-slate-800">Панель управления</strong> (кнопка внизу экрана) и закройте любой активный матч с любым счетом в один клик. Система моментально рассчитает коэффициенты!
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => setActiveTab('matches')}
              className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold px-6 py-3 rounded-2xl text-xs sm:text-sm transition cursor-pointer uppercase tracking-wider"
            >
              🎯 Сделать новую ставку
            </button>
            <button
              onClick={() => {
                const element = document.getElementById('admin');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
                setActiveTab('admin');
              }}
              className="bg-rose-500 hover:bg-rose-600 text-white font-extrabold px-6 py-3 rounded-2xl text-xs sm:text-sm transition cursor-pointer uppercase tracking-wider"
            >
              ⚙️ Симулировать матч в админке
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* List of matches */}
          {finishedMatches
            .filter(m => {
              if (activeFilter === 'my') {
                // filter matches where user had a bet, custom event vote, or duel
                const hasBet = !!userBets[m.id];
                const hasEvent = customEvents.some(e => e.matchId === m.id && e.isUserVoted);
                const hasDuel = duels.some(d => d.matchId === m.id);
                return hasBet || hasEvent || hasDuel;
              }
              return true;
            })
            .map(match => {
              const scoreA = match.scoreA ?? 0;
              const scoreB = match.scoreB ?? 0;
              const finalOutcome = scoreA > scoreB ? 'teamA' : scoreA < scoreB ? 'teamB' : 'draw';
              const dynamicOdds = getMatchDynamicOdds(match);
              
              // Standard bet details
              const userBet = userBets[match.id];
              const isUserBetWon = userBet && userBet.outcome === finalOutcome;
              
              let betOddsValue = 1.0;
              if (userBet) {
                if (userBet.outcome === 'teamA') betOddsValue = dynamicOdds.oddsA;
                else if (userBet.outcome === 'draw') betOddsValue = dynamicOdds.oddsDraw;
                else if (userBet.outcome === 'teamB') betOddsValue = dynamicOdds.oddsB;
              }
              const calculatedStandardWin = userBet ? Math.round(userBet.amount * betOddsValue) : 0;

              // Related custom events
              const matchEvents = customEvents.filter(e => e.matchId === match.id);
              
              // Related duels
              const matchDuels = duels.filter(d => d.matchId === match.id);

              return (
                <div 
                  key={match.id}
                  className="bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition overflow-hidden"
                >
                  
                  {/* Match header details (teams, flags, score) */}
                  <div className="bg-slate-50 border-b border-slate-100 p-5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-slate-200 text-slate-700 font-extrabold py-1 px-2.5 rounded-lg font-mono">
                        {match.date} • {match.time}
                      </span>
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-extrabold py-1 px-2.5 rounded-lg uppercase tracking-wider">
                        Матч Рассчитан ✓
                      </span>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="flex items-center gap-2 font-display font-black text-md sm:text-lg text-slate-800">
                        <span>{match.teamAFlag}</span>
                        <span>{match.teamA}</span>
                      </div>
                      <div className="bg-slate-900 text-yellow-400 font-mono font-black text-xl px-4 py-1.5 rounded-2xl shadow-inner tracking-wider flex items-center justify-center gap-2">
                        <span>{scoreA}</span>
                        <span className="text-slate-500 text-sm">:</span>
                        <span>{scoreB}</span>
                      </div>
                      <div className="flex items-center gap-2 font-display font-black text-md sm:text-lg text-slate-800">
                        <span>{match.teamB}</span>
                        <span>{match.teamBFlag}</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 font-bold">
                      Общий банк: <strong className="text-emerald-600 font-black">{dynamicOdds.totalPool} Integra</strong>
                    </div>
                  </div>

                  {/* Coefficients grid calculated dynamically from total pool */}
                  <div className="px-6 py-4 bg-slate-50/40 border-b border-slate-100 grid grid-cols-3 gap-2 text-center">
                    <div className={`p-2.5 rounded-2xl border ${finalOutcome === 'teamA' ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-white border-slate-200 text-slate-600'}`}>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Победа {match.teamA}</p>
                      <p className="text-sm font-black font-mono mt-0.5">{dynamicOdds.oddsA.toFixed(2)}x</p>
                      <p className="text-[9px] text-slate-400 font-bold font-mono">Пул: {dynamicOdds.poolA} Integra</p>
                    </div>
                    <div className={`p-2.5 rounded-2xl border ${finalOutcome === 'draw' ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-white border-slate-200 text-slate-600'}`}>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Ничья</p>
                      <p className="text-sm font-black font-mono mt-0.5">{dynamicOdds.oddsDraw.toFixed(2)}x</p>
                      <p className="text-[9px] text-slate-400 font-bold font-mono">Пул: {dynamicOdds.poolDraw} Integra</p>
                    </div>
                    <div className={`p-2.5 rounded-2xl border ${finalOutcome === 'teamB' ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-white border-slate-200 text-slate-600'}`}>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Победа {match.teamB}</p>
                      <p className="text-sm font-black font-mono mt-0.5">{dynamicOdds.oddsB.toFixed(2)}x</p>
                      <p className="text-[9px] text-slate-400 font-bold font-mono">Пул: {dynamicOdds.poolB} Integra</p>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">

                    {/* 1. User Standard Bet Result */}
                    {userBet && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <span>⚽</span> Ваша ставка на исход
                        </h4>
                        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isUserBetWon 
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' 
                            : 'bg-rose-50/50 border-rose-200 text-rose-950'
                        }`}>
                          <div className="flex items-start gap-3">
                            <span className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                              isUserBetWon ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                            }`}>
                              {isUserBetWon ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                            </span>
                            <div>
                              <p className="font-extrabold text-sm sm:text-base">
                                Прогноз на {
                                  userBet.outcome === 'teamA' ? match.teamA : userBet.outcome === 'teamB' ? match.teamB : 'Ничью'
                                }
                              </p>
                              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                                Сумма: <strong className="font-bold">{userBet.amount} Integra</strong> • 
                                Коэффициент: <strong className="font-bold font-mono">{betOddsValue.toFixed(2)}x</strong>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-start sm:self-center">
                            {isUserBetWon ? (
                              <>
                                <div className="text-right">
                                  <p className="text-[10px] text-emerald-600 font-extrabold uppercase">Выигрыш начислен</p>
                                  <p className="text-lg font-black font-mono text-emerald-700">+{calculatedStandardWin} Integra</p>
                                </div>
                                <button
                                  onClick={() => handleShare(
                                    `${match.teamA} - ${match.teamB}`, 
                                    calculatedStandardWin, 
                                    'Ординар'
                                  )}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold p-2.5 rounded-xl transition cursor-pointer"
                                  title="Поделиться победой в соцсетях!"
                                >
                                  <Share2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <div className="text-right">
                                <p className="text-[10px] text-rose-500 font-extrabold uppercase">Проигрыш</p>
                                <p className="text-sm font-bold text-rose-600 font-mono">-{userBet.amount} Integra</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. Custom Events (Прогнозы по событиям) */}
                    {matchEvents.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <span>🔥</span> Результаты по событиям болельщиков
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {matchEvents.map(event => {
                            const isResolvedYes = event.status === 'resolved_yes';
                            const eventOutcomeText = isResolvedYes ? 'Да' : 'Нет';
                            const userVoted = event.isUserVoted;
                            const userVotedCorrectly = userVoted && event.userVoteSelection === (isResolvedYes ? 'yes' : 'no');
                            const eventOdds = isResolvedYes ? event.oddsYes : event.oddsNo;
                            const winAmount = Math.round(50 * eventOdds);

                            return (
                              <div 
                                key={event.id}
                                className={`p-4 rounded-2xl border transition ${
                                  userVoted 
                                    ? userVotedCorrectly 
                                      ? 'bg-emerald-50/50 border-emerald-200' 
                                      : 'bg-rose-50/40 border-rose-200'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <div>
                                    <span className="bg-slate-200 text-slate-700 font-extrabold text-[9px] px-2 py-0.5 rounded-md uppercase">
                                      Событие
                                    </span>
                                    <h5 className="font-extrabold text-slate-800 text-sm mt-1.5 leading-snug">{event.title}</h5>
                                    <p className="text-xs text-slate-500 mt-1">{event.description}</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Исход матча</p>
                                    <span className={`inline-block px-3 py-1 rounded-xl text-xs font-black mt-1 ${
                                      isResolvedYes ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                                    }`}>
                                      {eventOutcomeText}
                                    </span>
                                  </div>
                                </div>

                                {/* User specific resolution for this event */}
                                {userVoted && (
                                  <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center text-xs">
                                    <div>
                                      <p className="text-slate-500 font-semibold">Ваш выбор: <strong>{event.userVoteSelection === 'yes' ? 'Да' : 'Нет'}</strong></p>
                                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Размер: 50 Integra • {eventOdds.toFixed(2)}x</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {userVotedCorrectly ? (
                                        <>
                                          <div className="text-right">
                                            <p className="text-[9px] text-emerald-600 font-black uppercase">Угадано! 🎉</p>
                                            <p className="text-sm font-black font-mono text-emerald-700">+{winAmount} Integra</p>
                                          </div>
                                          <button
                                            onClick={() => handleShare(event.title, winAmount, 'Событие')}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-lg transition cursor-pointer"
                                            title="Поделиться победой!"
                                          >
                                            <Share2 className="w-3.5 h-3.5" />
                                          </button>
                                        </>
                                      ) : (
                                        <div className="text-right">
                                          <p className="text-[9px] text-rose-500 font-bold uppercase">Не угадано</p>
                                          <p className="text-xs font-bold font-mono text-rose-600">-50 Integra</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 3. Duels for this match */}
                    {matchDuels.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <span>⚔️</span> Вызовы и дуэли по матчу
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {matchDuels.map(duel => {
                            const isMeCreator = duel.creatorId === 'u_me';
                            const isWon = (isMeCreator && duel.status === 'captain_won') || (!isMeCreator && duel.status === 'friend_won');
                            const isDrawOrLost = duel.status === 'all_lost';
                            const isOracleBoth = duel.status === 'captain_won' && duel.isCollectiveOracle;

                            let resultColorClass = 'bg-slate-50 border-slate-200';
                            if (isWon) resultColorClass = 'bg-emerald-50/60 border-emerald-200';
                            else if (isDrawOrLost) resultColorClass = 'bg-rose-50/30 border-rose-200';

                            return (
                              <div 
                                key={duel.id}
                                className={`p-4 rounded-2xl border flex flex-col justify-between gap-4 ${resultColorClass}`}
                              >
                                <div>
                                  <div className="flex justify-between items-center">
                                    <span className="bg-slate-100 text-slate-600 font-extrabold text-[9px] px-2 py-0.5 rounded-md uppercase">
                                      {duel.isGroupGame ? 'Групповая игра 👥' : 'Дуэль друзей ⚔️'}
                                    </span>
                                    <span className={`text-[10px] font-black uppercase ${
                                      isWon ? 'text-emerald-600' : isDrawOrLost ? 'text-rose-500' : 'text-amber-600'
                                    }`}>
                                      {duel.status === 'captain_won' && 'Победа Капитана'}
                                      {duel.status === 'friend_won' && 'Победа Друга'}
                                      {duel.status === 'all_lost' && 'Все ошиблись'}
                                    </span>
                                  </div>

                                  <div className="mt-3 flex items-center gap-2">
                                    <span className="text-xl">{duel.creatorAvatar}</span>
                                    <div>
                                      <p className="font-extrabold text-xs text-slate-800">
                                        {duel.creatorName} ⚔️ {duel.targetFriendName}
                                      </p>
                                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                        Прогноз: "{duel.predictionDetail}"
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                                  <div className="text-xs">
                                    <p className="text-slate-500 font-semibold">Ваша ставка:</p>
                                    <strong className="text-slate-700 font-bold">{duel.betAmount} Integra</strong>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {isWon ? (
                                      <>
                                        <div className="text-right">
                                          <p className="text-[9px] text-emerald-600 font-black uppercase">Выиграно! 🎉</p>
                                          <p className="text-sm font-black font-mono text-emerald-700">+{duel.betAmount} Integra</p>
                                        </div>
                                        <button
                                          onClick={() => handleShare(duel.predictionDetail, duel.betAmount, 'Дуэль')}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-lg transition cursor-pointer"
                                          title="Поделиться победой в дуэли!"
                                        >
                                          <Share2 className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    ) : (
                                      <div className="text-right">
                                        <p className="text-[9px] text-rose-500 font-bold uppercase">Проигрыш</p>
                                        <p className="text-xs font-bold font-mono text-rose-600">-{duel.betAmount} Integra</p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Integrated Badge display if won this duel */}
                                {isWon && !isMeCreator && (
                                  <div className="mt-2 bg-amber-50 border border-amber-200/60 p-2.5 rounded-xl flex items-center gap-2.5 animate-pulse">
                                    <span className="text-2xl">🎯</span>
                                    <div>
                                      <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Получен Знак Отличия!</p>
                                      <p className="text-xs font-extrabold text-slate-800">Дивергент (Badge Unlocked)</p>
                                      <p className="text-[9px] text-slate-500 leading-tight">За победу над создателем дуэли!</p>
                                    </div>
                                  </div>
                                )}
                                {isWon && isMeCreator && (
                                  <div className="mt-2 bg-amber-50 border border-amber-200/60 p-2.5 rounded-xl flex items-center gap-2.5 animate-pulse">
                                    <span className="text-2xl">🔮</span>
                                    <div>
                                      <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Получен Знак Отличия!</p>
                                      <p className="text-xs font-extrabold text-slate-800">Пророк (Badge Unlocked)</p>
                                      <p className="text-[9px] text-slate-500 leading-tight">За абсолютно точный прогноз дуэли!</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 4. List of Top Winners (Список победителей) */}
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span>👑</span> Победители этого матча в системе
                        </span>
                        <span className="text-[10px] text-slate-400 lowercase font-mono">
                          автоматическая выплата
                        </span>
                      </h4>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {getSimulatedWinners(match.id, scoreA, scoreB).map((winner, idx) => (
                          <div 
                            key={idx}
                            className={`p-3 rounded-2xl border flex items-center gap-2.5 transition ${
                              winner.name.includes('(Вы)') 
                                ? 'bg-amber-50/50 border-amber-200 shadow-3xs' 
                                : 'bg-slate-50/80 border-slate-100'
                            }`}
                          >
                            <span className="text-xl shrink-0">{winner.avatar}</span>
                            <div className="overflow-hidden">
                              <p className="text-xs font-black text-slate-800 truncate leading-snug">{winner.name}</p>
                              <p className="text-[9px] text-emerald-600 font-extrabold font-mono mt-0.5">
                                +{winner.winAmount} Integra
                              </p>
                              <p className="text-[8px] text-slate-400 font-medium tracking-tight uppercase">
                                {winner.type}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Hall of Fame Big Wins Mock Section for fun */}
      {activeFilter === 'big_wins' && (
        <div className="bg-[#111827] text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">👑</span>
            <div>
              <h3 className="text-xl sm:text-2xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 uppercase leading-none">
                Зал Славы и Топ Выплат
              </h3>
              <p className="text-xs text-slate-400 mt-1">Самые крупные выигрыши по коэффициентам в системе</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
              <span className="absolute top-2 right-2 text-yellow-500/20 text-5xl font-black font-mono">#1</span>
              <div className="flex items-center gap-3">
                <span className="text-3xl">🦁</span>
                <div>
                  <p className="text-sm font-black text-slate-200">dimas_chelsea</p>
                  <p className="text-xs text-slate-400">Испания - Германия</p>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-baseline">
                <span className="text-xs text-slate-400 font-semibold">Событие (15.0x)</span>
                <strong className="text-xl font-mono text-yellow-400 font-black">+1,500 Integra</strong>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
              <span className="absolute top-2 right-2 text-yellow-500/20 text-5xl font-black font-mono">#2</span>
              <div className="flex items-center gap-3">
                <span className="text-3xl">🦅</span>
                <div>
                  <p className="text-sm font-black text-slate-200">helga_oraculum</p>
                  <p className="text-xs text-slate-400">Групповая Битва</p>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-baseline">
                <span className="text-xs text-slate-400 font-semibold">Ординар (8.5x)</span>
                <strong className="text-xl font-mono text-yellow-400 font-black">+850 Integra</strong>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
              <span className="absolute top-2 right-2 text-yellow-500/20 text-5xl font-black font-mono">#3</span>
              <div className="flex items-center gap-3">
                <span className="text-3xl">🦊</span>
                <div>
                  <p className="text-sm font-black text-slate-200">alex_predict</p>
                  <p className="text-xs text-slate-400">Дуэль Друзей</p>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-baseline">
                <span className="text-xs text-slate-400 font-semibold">Ставка (4.2x)</span>
                <strong className="text-xl font-mono text-yellow-400 font-black">+630 Integra</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications trigger for copied text */}
      <AnimatePresence>
        {copiedText && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 bg-slate-900 text-white font-extrabold px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800 z-50 text-xs tracking-wider uppercase"
          >
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span>Победная ссылка скопирована! 🏆</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
