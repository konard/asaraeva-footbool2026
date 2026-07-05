import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { PlusCircle, Award, Volume2, ShieldAlert, Check, HelpCircle, Heart, Share2, Flame } from 'lucide-react';
import { getCountryFlagUrl } from '../data/initialData';

export const MatchesList: React.FC = () => {
  const { 
    matches, 
    placeBet, 
    customEvents, 
    addCustomEvent, 
    voteCustomEvent, 
    user,
    setActiveTab,
    addNotification,
    userBets,
    duels,
    addSystemLog,
    createVotingTeam,
    getMatchDynamicOdds,
    setPreselectedDuelType
  } = useApp();

  const [selectedMatchForEvent, setSelectedMatchForEvent] = useState(matches[0]?.id || '');
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [betAmount, setBetAmount] = useState<number>(50);
  const [showEventForm, setShowEventForm] = useState(false);
  const [activeTeamInputMatchId, setActiveTeamInputMatchId] = useState<string | null>(null);
  const [teamNameInput, setTeamNameInput] = useState<string>('');
  const [pendingBets, setPendingBets] = useState<Record<string, 'teamA' | 'draw' | 'teamB'>>({});

  // Category state for the smart constructor
  const [eventCategory, setEventCategory] = useState<'penalties' | 'offsides' | 'shots' | 'custom'>('custom');
  const [categoryTeam, setCategoryTeam] = useState<'teamA' | 'teamB' | 'both'>('both');
  const [categoryCondition, setCategoryCondition] = useState<'greater' | 'less'>('greater');
  const [categoryValue, setCategoryValue] = useState<number>(1.5);

  const getGeneratedTexts = (
    category: 'penalties' | 'offsides' | 'shots' | 'custom',
    team: 'teamA' | 'teamB' | 'both',
    condition: 'greater' | 'less',
    value: number,
    matchId: string
  ) => {
    if (category === 'custom') {
      return { title: '', description: '' };
    }

    const matchObj = matches.find(m => m.id === matchId) || matches[0];
    if (!matchObj) return { title: '', description: '' };

    const teamLabel = team === 'teamA' ? matchObj.teamA : team === 'teamB' ? matchObj.teamB : 'обе команды суммарно';
    const conditionLabel = condition === 'greater' ? 'больше' : 'меньше';

    let categoryVerb = '';
    let categoryUnit = '';

    if (category === 'penalties') {
      categoryUnit = 'пенальти';
      categoryVerb = 'назначено';
    } else if (category === 'offsides') {
      categoryUnit = 'раз';
      categoryVerb = 'попадут в офсайд';
    } else if (category === 'shots') {
      categoryUnit = 'ударов';
      categoryVerb = 'нанесут по воротам';
    }

    let titleStr = '';
    let descStr = '';

    if (category === 'penalties') {
      const formattedTeam = team === 'both' ? 'в матче' : `у команды ${teamLabel}`;
      titleStr = `Пенальти: ${formattedTeam} ${conditionLabel} ${value}`;
      descStr = `В основное время ${formattedTeam} будет ${categoryVerb} ${conditionLabel} чем ${value} ${categoryUnit}.`;
    } else if (category === 'offsides') {
      const formattedTeam = team === 'both' ? 'суммарно' : `у ${teamLabel}`;
      titleStr = `Офсайды: ${formattedTeam} ${conditionLabel} ${value}`;
      descStr = `Игроки ${team === 'both' ? 'обеих команд суммарно' : teamLabel} ${categoryVerb} ${conditionLabel} чем ${value} ${categoryUnit} за матч.`;
    } else if (category === 'shots') {
      const formattedTeam = team === 'both' ? 'суммарно' : `у ${teamLabel}`;
      titleStr = `Удары по воротам: ${formattedTeam} ${conditionLabel} ${value}`;
      descStr = `Игроки ${team === 'both' ? 'обеих команд суммарно' : teamLabel} ${categoryVerb} ${conditionLabel} чем ${value} ${categoryUnit} за матч.`;
    }

    return { title: titleStr, description: descStr };
  };

  const handleCategoryChange = (newCat: 'penalties' | 'offsides' | 'shots' | 'custom') => {
    setEventCategory(newCat);
    if (newCat !== 'custom') {
      const defaultValue = newCat === 'penalties' ? 0.5 : newCat === 'offsides' ? 3.5 : 8.5;
      setCategoryValue(defaultValue);
      const texts = getGeneratedTexts(newCat, categoryTeam, categoryCondition, defaultValue, selectedMatchForEvent);
      setCustomTitle(texts.title);
      setCustomDescription(texts.description);
    } else {
      setCustomTitle('');
      setCustomDescription('');
    }
  };

  const handleMatchChange = (newMatchId: string) => {
    setSelectedMatchForEvent(newMatchId);
    if (eventCategory !== 'custom') {
      const texts = getGeneratedTexts(eventCategory, categoryTeam, categoryCondition, categoryValue, newMatchId);
      setCustomTitle(texts.title);
      setCustomDescription(texts.description);
    }
  };

  const handleTeamChange = (newTeam: 'teamA' | 'teamB' | 'both') => {
    setCategoryTeam(newTeam);
    if (eventCategory !== 'custom') {
      const texts = getGeneratedTexts(eventCategory, newTeam, categoryCondition, categoryValue, selectedMatchForEvent);
      setCustomTitle(texts.title);
      setCustomDescription(texts.description);
    }
  };

  const handleConditionChange = (newCond: 'greater' | 'less') => {
    setCategoryCondition(newCond);
    if (eventCategory !== 'custom') {
      const texts = getGeneratedTexts(eventCategory, categoryTeam, newCond, categoryValue, selectedMatchForEvent);
      setCustomTitle(texts.title);
      setCustomDescription(texts.description);
    }
  };

  const handleValueChange = (newVal: number) => {
    const formattedVal = Math.max(0, Number(newVal.toFixed(1)));
    setCategoryValue(formattedVal);
    if (eventCategory !== 'custom') {
      const texts = getGeneratedTexts(eventCategory, categoryTeam, categoryCondition, formattedVal, selectedMatchForEvent);
      setCustomTitle(texts.title);
      setCustomDescription(texts.description);
    }
  };

  // Filter matches to showcase active/upcoming
  const activeAndUpcoming = matches.filter(m => m.status !== 'finished');
  const pastMatches = matches.filter(m => m.status === 'finished');

  const handlePlaceBet = (matchId: string, outcome: 'teamA' | 'draw' | 'teamB', teamName: string) => {
    const success = placeBet(matchId, outcome, betAmount);
    if (success) {
      // Small feedback
    }
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle || !customDescription) return;
    addCustomEvent(
      selectedMatchForEvent, 
      customTitle, 
      customDescription,
      eventCategory,
      categoryTeam,
      categoryCondition,
      categoryValue
    );
    setCustomTitle('');
    setCustomDescription('');
    setEventCategory('custom');
    setCategoryValue(1.5);
    setShowEventForm(false);
  };

  const handleVoteCustom = (eventId: string, selection: 'yes' | 'no') => {
    voteCustomEvent(eventId, selection, betAmount);
  };

  return (
    <div className="space-y-8">
      {/* Main Grid: Matches on left, custom events/predictions on right */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* MATCHES LIST SECTION (2 Columns on desktop) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-2 border-b-4 border-slate-200 gap-4">
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-3 font-display">
              <span>⚽</span> Актуальные матчи
            </h2>
            <div className="flex flex-row items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap">
              <span className="text-sm sm:text-base font-black text-slate-850 whitespace-nowrap">Сумма ставки:</span>
              
              {/* Quick Preset Buttons */}
              <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 shadow-inner">
                {[50, 100, 200, 500].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                      betAmount === amount
                        ? 'bg-amber-500 text-white shadow-sm scale-102'
                        : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    {amount}
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 shadow-sm focus-within:ring-2 focus-within:ring-amber-500">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Своя:</span>
                <input
                  type="number"
                  min={1}
                  max={user.gramsBalance}
                  value={betAmount || ''}
                  onChange={(e) => {
                    const rawVal = e.target.value;
                    if (rawVal === '') {
                      setBetAmount(0);
                      return;
                    }
                    let val = parseInt(rawVal, 10);
                    if (isNaN(val)) val = 1;
                    if (val < 1) val = 1;
                    if (val > user.gramsBalance) {
                      val = user.gramsBalance;
                    }
                    setBetAmount(val);
                  }}
                  onBlur={() => {
                    if (!betAmount || betAmount < 1) {
                      setBetAmount(50);
                    }
                  }}
                  className="w-14 text-center font-black text-slate-800 bg-transparent text-xs sm:text-sm outline-none border-0 p-0"
                  placeholder="Сумма"
                />
                <span className="text-[10px] font-black text-amber-600 font-mono">Integra</span>
              </div>
            </div>
          </div>

          {activeAndUpcoming.length === 0 ? (
            <p className="text-slate-500 text-lg py-12 text-center font-medium">Все матчи завершены. Вы можете запустить новые симуляции в Админ-панели!</p>
          ) : (
            <div className="space-y-6">
              {activeAndUpcoming.map(match => {
                const dynamicOdds = getMatchDynamicOdds(match);
                const isTeamASelected = userBets[match.id]?.outcome === 'teamA';
                const isDrawSelected = userBets[match.id]?.outcome === 'draw';
                const isTeamBSelected = userBets[match.id]?.outcome === 'teamB';
                const currentBet = userBets[match.id];
                const canSelect = user.gramsBalance + (currentBet ? currentBet.amount : 0) >= betAmount;

                return (
                  <motion.div 
                    key={match.id}
                    whileHover={{ y: -2 }}
                    className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 shadow-sm relative overflow-hidden"
                  >
                    {match.status === 'live' && (
                      <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 animate-pulse shadow-md">
                        <span className="w-2.5 h-2.5 bg-white rounded-full"></span> МАТЧ ИДЕТ LIVE
                      </div>
                    )}

                    {/* Teams Row */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4">
                      {/* Team A */}
                      <div className="flex flex-col items-center text-center md:flex-row md:text-left gap-4 md:w-2/5">
                        <div className="relative shrink-0">
                          <img 
                            src={getCountryFlagUrl(match.teamA)} 
                            alt={match.teamA} 
                            className="w-14 h-10 object-cover rounded-lg border border-slate-200 shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute -bottom-1 -right-1 text-base bg-white rounded-full p-0.5 shadow-sm leading-none border border-slate-100">{match.teamAFlag}</span>
                        </div>
                        <div>
                          <h3 className="text-xl md:text-2xl font-black text-slate-800 font-display">{match.teamA}</h3>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Тотализатор коэф: <span className="text-amber-600 font-extrabold">{dynamicOdds.oddsA}</span></p>
                        </div>
                      </div>

                      {/* VS / Score */}
                      <div className="flex flex-col items-center justify-center shrink-0 py-2">
                        {match.status === 'live' ? (
                          <div className="bg-slate-100 text-amber-600 rounded-2xl py-2 px-5 font-mono text-3xl font-black flex items-center gap-2 border border-slate-200 shadow-inner">
                            <span>{match.scoreA}</span>
                            <span className="text-rose-500 animate-pulse">:</span>
                            <span>{match.scoreB}</span>
                          </div>
                        ) : (
                          <div className="bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl py-2 px-4 font-bold text-md text-center shadow-inner">
                            <p className="font-mono text-lg font-black text-amber-600">{match.date}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{match.time}</p>
                          </div>
                        )}
                        <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wider mt-1.5">vs</span>
                      </div>

                      {/* Team B */}
                      <div className="flex flex-col items-center text-center md:flex-row-reverse md:text-right gap-4 md:w-2/5">
                        <div className="relative shrink-0">
                          <img 
                            src={getCountryFlagUrl(match.teamB)} 
                            alt={match.teamB} 
                            className="w-14 h-10 object-cover rounded-lg border border-slate-200 shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute -bottom-1 -right-1 text-base bg-white rounded-full p-0.5 shadow-sm leading-none border border-slate-100">{match.teamBFlag}</span>
                        </div>
                        <div>
                          <h3 className="text-xl md:text-2xl font-black text-slate-800 font-display">{match.teamB}</h3>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Тотализатор коэф: <span className="text-amber-600 font-extrabold">{dynamicOdds.oddsB}</span></p>
                        </div>
                      </div>
                    </div>

                    {/* Bet Buttons - Big and friendly for 45+ */}
                    <div className="space-y-4">
                      <div className="mt-2 pt-4 border-t border-slate-150 grid grid-cols-3 gap-3">
                        {(() => {
                          const isPendingA = pendingBets[match.id] === 'teamA';
                          return (
                            <button
                              onClick={() => setPendingBets(prev => ({ ...prev, [match.id]: prev[match.id] === 'teamA' ? undefined : 'teamA' }))}
                              className={`transition-all duration-200 text-center flex flex-col items-center justify-center cursor-pointer shadow-sm hover:shadow active:scale-[0.97] outline-none p-3 rounded-2xl border-2 ${
                                isTeamASelected
                                  ? "bg-emerald-600 border-emerald-700 text-white font-extrabold ring-4 ring-emerald-100 scale-[1.02]"
                                  : isPendingA
                                    ? "bg-amber-500 border-amber-600 text-white font-extrabold shadow ring-4 ring-amber-100 scale-[1.02] animate-pulse"
                                    : "bg-amber-50/60 hover:bg-amber-100/95 active:bg-amber-200 border-amber-300 hover:border-amber-400 text-slate-800 font-extrabold"
                              }`}
                            >
                              <span className={`text-[10px] sm:text-xs uppercase tracking-wider font-extrabold truncate max-w-full block ${isTeamASelected ? 'text-emerald-100' : isPendingA ? 'text-amber-100' : 'text-slate-500'}`}>
                                {isTeamASelected ? '✓ Зафиксировано' : isPendingA ? '⏳ Выбрано' : `Поб. ${match.teamA}`}
                              </span>
                              <span className={`text-lg md:text-xl font-black mt-0.5 ${isTeamASelected || isPendingA ? 'text-white' : 'text-amber-600'}`}>{dynamicOdds.oddsA}</span>
                            </button>
                          );
                        })()}

                        {(() => {
                          const isPendingDraw = pendingBets[match.id] === 'draw';
                          return (
                            <button
                              onClick={() => setPendingBets(prev => ({ ...prev, [match.id]: prev[match.id] === 'draw' ? undefined : 'draw' }))}
                              className={`transition-all duration-200 text-center flex flex-col items-center justify-center cursor-pointer shadow-sm hover:shadow active:scale-[0.97] outline-none p-3 rounded-2xl border-2 ${
                                isDrawSelected
                                  ? "bg-emerald-600 border-emerald-700 text-white font-extrabold ring-4 ring-emerald-100 scale-[1.02]"
                                  : isPendingDraw
                                    ? "bg-amber-500 border-amber-600 text-white font-extrabold shadow ring-4 ring-amber-100 scale-[1.02] animate-pulse"
                                    : "bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border-slate-300 hover:border-slate-400 text-slate-800 font-extrabold"
                              }`}
                            >
                              <span className={`text-[10px] sm:text-xs uppercase tracking-wider font-extrabold truncate max-w-full block ${isDrawSelected ? 'text-emerald-100' : isPendingDraw ? 'text-amber-100' : 'text-slate-500'}`}>
                                {isDrawSelected ? '✓ Зафиксировано' : isPendingDraw ? '⏳ Выбрано' : 'Ничья'}
                              </span>
                              <span className={`text-lg md:text-xl font-black mt-0.5 ${isDrawSelected || isPendingDraw ? 'text-white' : 'text-rose-600'}`}>{dynamicOdds.oddsDraw}</span>
                            </button>
                          );
                        })()}

                        {(() => {
                          const isPendingB = pendingBets[match.id] === 'teamB';
                          return (
                            <button
                              onClick={() => setPendingBets(prev => ({ ...prev, [match.id]: prev[match.id] === 'teamB' ? undefined : 'teamB' }))}
                              className={`transition-all duration-200 text-center flex flex-col items-center justify-center cursor-pointer shadow-sm hover:shadow active:scale-[0.97] outline-none p-3 rounded-2xl border-2 ${
                                isTeamBSelected
                                  ? "bg-emerald-600 border-emerald-700 text-white font-extrabold ring-4 ring-emerald-100 scale-[1.02]"
                                  : isPendingB
                                    ? "bg-amber-500 border-amber-600 text-white font-extrabold shadow ring-4 ring-amber-100 scale-[1.02] animate-pulse"
                                    : "bg-amber-50/60 hover:bg-amber-100/95 active:bg-amber-200 border-amber-300 hover:border-amber-400 text-slate-800 font-extrabold"
                              }`}
                            >
                              <span className={`text-[10px] sm:text-xs uppercase tracking-wider font-extrabold truncate max-w-full block ${isTeamBSelected ? 'text-emerald-100' : isPendingB ? 'text-amber-100' : 'text-slate-500'}`}>
                                {isTeamBSelected ? '✓ Зафиксировано' : isPendingB ? '⏳ Выбрано' : `Поб. ${match.teamB}`}
                              </span>
                              <span className={`text-lg md:text-xl font-black mt-0.5 ${isTeamBSelected || isPendingB ? 'text-white' : 'text-amber-600'}`}>{dynamicOdds.oddsB}</span>
                            </button>
                          );
                        })()}
                      </div>

                      {/* Manual Bet Confirmation Panel */}
                      {(() => {
                        const pendingOutcome = pendingBets[match.id];
                        if (!pendingOutcome) return null;
                        const outcomeText = pendingOutcome === 'teamA' ? match.teamA : pendingOutcome === 'draw' ? 'Ничью' : match.teamB;
                        
                        return (
                          <div className="bg-gradient-to-r from-amber-50 to-amber-100/60 border-2 border-amber-300 p-4 rounded-2xl mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fadeIn shadow-inner">
                            <div className="flex flex-col text-left">
                              <span className="text-[11px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-1">
                                <span>⚡</span> Выбор не подтвержден!
                              </span>
                              <span className="text-xs font-black text-slate-700 mt-1">
                                Вы наметили ставку на <span className="text-amber-700 font-black">[{outcomeText}]</span>
                              </span>
                              <span className="text-[10px] text-slate-500 font-bold mt-0.5">
                                Укажите сумму ставки сверху (выбрано: {betAmount} Integra). Нажмите кнопку справа для фиксации.
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                const success = placeBet(match.id, pendingOutcome, betAmount);
                                if (success) {
                                  setPendingBets(prev => {
                                    const copy = { ...prev };
                                    delete copy[match.id];
                                    return copy;
                                  });
                                }
                              }}
                              className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-black px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition text-xs uppercase tracking-wider cursor-pointer whitespace-nowrap"
                            >
                              💰 Сделать ставку {betAmount} Integra
                            </button>
                          </div>
                        );
                      })()}

                      {/* Active Confirmed Bet Info with Cancel Button */}
                      {currentBet && (
                        <div className="bg-emerald-50/80 border border-emerald-200/80 p-4 rounded-2xl mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex flex-col text-left">
                            <span className="text-[11px] font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1">
                              <span>✓</span> Ставка зафиксирована в системе
                            </span>
                            <span className="text-xs font-black text-slate-700 mt-1">
                              Поставлено <span className="text-emerald-700 font-black">{currentBet.amount} Integra</span> на исход: <span className="text-emerald-700 font-black">[{currentBet.outcome === 'teamA' ? match.teamA : currentBet.outcome === 'draw' ? 'Ничья' : match.teamB}]</span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold mt-0.5">
                              Она автоматически опубликована в логах и видна на вашем дашборде.
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              // Cancel/refund bet by placing same bet again
                              placeBet(match.id, currentBet.outcome, currentBet.amount);
                            }}
                            className="bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-black px-4 py-2 rounded-xl transition text-xs cursor-pointer whitespace-nowrap shadow-xs"
                          >
                            Отменить ставку ✕
                          </button>
                        </div>
                      )}

                      {/* Тотализатор / Калькулятор Коэффициентов */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-3 space-y-2.5 text-slate-700">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                            <span>📊</span> Калькулятор Тотализатора (Pari-Mutuel)
                          </span>
                          <span className="text-xs font-black text-amber-600 font-mono bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                            Общий пул: {dynamicOdds.totalPool} Integra
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-white border border-slate-150 p-2 rounded-xl">
                            <span className="text-[10px] text-slate-400 block font-bold truncate">Пул {match.teamA}</span>
                            <span className="text-xs font-extrabold text-slate-700 block font-mono">{dynamicOdds.poolA} Integra</span>
                            <span className="text-[10px] font-black text-emerald-600 font-mono">
                              ({Math.round((dynamicOdds.poolA / dynamicOdds.totalPool) * 100)}%)
                            </span>
                          </div>
                          
                          <div className="bg-white border border-slate-150 p-2 rounded-xl">
                            <span className="text-[10px] text-slate-400 block font-bold truncate">Пул Ничьи</span>
                            <span className="text-xs font-extrabold text-slate-700 block font-mono">{dynamicOdds.poolDraw} Integra</span>
                            <span className="text-[10px] font-black text-emerald-600 font-mono">
                              ({Math.round((dynamicOdds.poolDraw / dynamicOdds.totalPool) * 100)}%)
                            </span>
                          </div>
                          
                          <div className="bg-white border border-slate-150 p-2 rounded-xl">
                            <span className="text-[10px] text-slate-400 block font-bold truncate">Пул {match.teamB}</span>
                            <span className="text-xs font-extrabold text-slate-700 block font-mono">{dynamicOdds.poolB} Integra</span>
                            <span className="text-[10px] font-black text-emerald-600 font-mono">
                              ({Math.round((dynamicOdds.poolB / dynamicOdds.totalPool) * 100)}%)
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-[11px] text-slate-500 leading-relaxed font-medium">
                          ℹ️ Чем меньше людей ставит на команду, тем <span className="text-amber-600 font-bold">выше её коэффициент</span>. Если фаворит проиграет, аутсайдеры заберут <span className="text-emerald-600 font-bold">весь банк пропорционально своим ставкам</span>!
                        </div>

                        {currentBet && (
                          <div className="bg-emerald-50/60 border border-emerald-200/80 p-3 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-850">
                            <span className="flex items-center gap-1">
                              <span>🔮</span> Мой прогноз выигрыша:
                            </span>
                            <span className="font-extrabold text-sm text-emerald-600 font-mono">
                              {Math.round(currentBet.amount * (currentBet.outcome === 'teamA' ? dynamicOdds.oddsA : currentBet.outcome === 'draw' ? dynamicOdds.oddsDraw : dynamicOdds.oddsB))} Integra
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Ключевые Лидеры Матча */}
                      <div className="bg-slate-50/60 border border-slate-150 rounded-2xl p-4 mt-3 space-y-2">
                        <div className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-200">
                          <span>🌟</span> Ключевые лидеры матча
                        </div>
                        <p className="text-xs text-slate-700 font-bold leading-relaxed">
                          {match.players && match.players.length > 0 
                            ? match.players.join(', ') 
                            : 'Звезды составов уточняются...'}
                        </p>
                      </div>

                      {/* Naming field when Team Creation is active */}
                      {activeTeamInputMatchId === match.id && (
                        <div className="space-y-2 text-left bg-emerald-50/80 border border-emerald-200 p-3 rounded-2xl mt-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-emerald-850 uppercase tracking-wider flex items-center gap-1">
                              <span>🙌</span> Назовите вашу команду болельщиков/коллег:
                            </span>
                          </div>
                          <input
                            type="text"
                            value={teamNameInput}
                            onChange={e => setTeamNameInput(e.target.value)}
                            placeholder="Например, Коллеги из Integram"
                            className="w-full text-xs p-2.5 bg-white border border-emerald-300 rounded-xl outline-none font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-emerald-450"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (!teamNameInput.trim()) {
                                  addNotification('Ошибка', 'Пожалуйста, введите название команды.', 'system');
                                  return;
                                }
                                createVotingTeam(match.id, teamNameInput, currentBet?.outcome || 'teamA', currentBet?.amount || 100);
                                setActiveTeamInputMatchId(null);
                              }}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black py-2 rounded-xl transition cursor-pointer text-center"
                            >
                              Создать команду 🙌
                            </button>
                            <button
                              onClick={() => setActiveTeamInputMatchId(null)}
                              className="bg-white hover:bg-slate-100 text-slate-600 text-[11px] font-black py-2 px-3 rounded-xl border border-slate-200 transition cursor-pointer text-center"
                            >
                              Отмена
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Dual Action Buttons on the exact same line, identical visual layout */}
                    <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button 
                        onClick={() => setActiveTab('duels')}
                        className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-extrabold px-5 py-3 rounded-2xl shadow-md hover:shadow-lg transition text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 text-center uppercase tracking-wider"
                      >
                        ⚔️ Вызвать друга на дуэль
                      </button>

                      <button 
                        onClick={() => {
                          setActiveTeamInputMatchId(match.id);
                          setTeamNameInput('Коллеги @' + (user.username || 'user') + ' 🚀');
                        }}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold px-5 py-3 rounded-2xl shadow-md hover:shadow-lg transition text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 text-center uppercase tracking-wider"
                      >
                        🙌 Собрать команду для голосования
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}


        </div>

        {/* CUSTOM EVENTS & VOTING SECTION (1 Column on desktop) */}
        <div className="space-y-6">
          <div className="pb-2 border-b-4 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-2 font-display">
                <span>🔥</span> События болельщиков
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                  ⭐ Тип прогноза: событие, делайте ставки!
                </span>
                <span className="inline-flex items-center gap-1 bg-sky-50 border border-sky-200 text-sky-700 text-[10px] font-black px-2 py-0.5 rounded-md relative group cursor-pointer" title="Нажмите, чтобы запустить конструктор Integram">
                  🎨 Методология Творца Integram
                  {/* Interactive Tooltip on hover */}
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-slate-900 text-white text-[11px] font-medium rounded-xl p-3 shadow-xl opacity-0 group-hover:opacity-100 transition pointer-events-none z-50 leading-relaxed text-center">
                    Хотите превратить свои списки матчей или таблицу игроков в полноценную CRM и игру? Нажмите сюда, чтобы создать приложение по нашей уникальной low-code методологии!
                  </span>
                </span>
                <button 
                  onClick={() => setActiveTab('integram')}
                  className="text-[10px] text-sky-600 hover:text-sky-800 font-extrabold underline cursor-pointer"
                >
                  Создать свою игру 🚀
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                setPreselectedDuelType('custom_event');
                setActiveTab('duels');
              }}
              className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:opacity-95 text-white text-xs font-black p-3 rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-lg shadow-rose-500/20 border border-rose-400"
            >
              <PlusCircle className="w-4 h-4" /> Добавить событие
            </button>
          </div>

          {/* Form to add custom event */}
          <AnimatePresence>
            {showEventForm && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreateEvent}
                className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 overflow-hidden shadow-sm text-slate-850"
              >
                <h3 className="font-black text-slate-800 text-lg font-display">Предложите свое событие</h3>
                
                {/* 1. Select Match */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Выберите матч</label>
                  <select
                    value={selectedMatchForEvent}
                    onChange={(e) => handleMatchChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-md font-semibold text-slate-800 cursor-pointer focus:border-sky-500 outline-none"
                  >
                    {matches.map(m => (
                      <option key={m.id} value={m.id} className="bg-white">{m.teamAFlag} {m.teamA} - {m.teamBFlag} {m.teamB}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Category Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Категория события</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => handleCategoryChange('custom')}
                      className={`py-2 px-1.5 rounded-xl font-bold text-xs text-center transition cursor-pointer ${
                        eventCategory === 'custom'
                          ? 'bg-white text-slate-800 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      ✏️ Свой текст
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCategoryChange('penalties')}
                      className={`py-2 px-1.5 rounded-xl font-bold text-xs text-center transition cursor-pointer ${
                        eventCategory === 'penalties'
                          ? 'bg-white text-slate-850 shadow-xs border border-amber-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      🟨 Пенальти
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCategoryChange('offsides')}
                      className={`py-2 px-1.5 rounded-xl font-bold text-xs text-center transition cursor-pointer ${
                        eventCategory === 'offsides'
                          ? 'bg-white text-slate-850 shadow-xs border border-sky-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      🚩 Офсайды
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCategoryChange('shots')}
                      className={`py-2 px-1.5 rounded-xl font-bold text-xs text-center transition cursor-pointer ${
                        eventCategory === 'shots'
                          ? 'bg-white text-slate-850 shadow-xs border border-emerald-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      🎯 Удары в створ
                    </button>
                  </div>
                </div>

                {/* Conditional Sub-selectors for Sports Categories */}
                {eventCategory !== 'custom' && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl space-y-3"
                  >
                    {/* Team Selector */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Команда</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleTeamChange('both')}
                          className={`py-1.5 px-1.5 rounded-lg font-bold text-[10px] text-center border transition cursor-pointer ${
                            categoryTeam === 'both'
                              ? 'bg-white border-slate-300 text-slate-800 font-extrabold shadow-2xs'
                              : 'bg-slate-100/50 border-transparent text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          ⚽ Обе команды
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTeamChange('teamA')}
                          className={`py-1.5 px-1.5 rounded-lg font-bold text-[10px] text-center border truncate transition cursor-pointer ${
                            categoryTeam === 'teamA'
                              ? 'bg-white border-slate-300 text-slate-800 font-extrabold shadow-2xs'
                              : 'bg-slate-100/50 border-transparent text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {matches.find(m => m.id === selectedMatchForEvent)?.teamAFlag || '⚽️'} {matches.find(m => m.id === selectedMatchForEvent)?.teamA || 'Команда А'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTeamChange('teamB')}
                          className={`py-1.5 px-1.5 rounded-lg font-bold text-[10px] text-center border truncate transition cursor-pointer ${
                            categoryTeam === 'teamB'
                              ? 'bg-white border-slate-300 text-slate-800 font-extrabold shadow-2xs'
                              : 'bg-slate-100/50 border-transparent text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {matches.find(m => m.id === selectedMatchForEvent)?.teamBFlag || '⚽️'} {matches.find(m => m.id === selectedMatchForEvent)?.teamB || 'Команда Б'}
                        </button>
                      </div>
                    </div>

                    {/* Condition & Number Value Selector */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Условие</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleConditionChange('greater')}
                            className={`py-1.5 px-2 rounded-lg font-bold text-[10px] text-center border transition cursor-pointer ${
                              categoryCondition === 'greater'
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-extrabold'
                                : 'bg-slate-100/50 border-transparent text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            📈 Больше (ТБ)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConditionChange('less')}
                            className={`py-1.5 px-2 rounded-lg font-bold text-[10px] text-center border transition cursor-pointer ${
                              categoryCondition === 'less'
                                ? 'bg-rose-50 border-rose-300 text-rose-800 font-extrabold'
                                : 'bg-slate-100/50 border-transparent text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            📉 Меньше (ТМ)
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Значение тотала</label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleValueChange(categoryValue - (eventCategory === 'shots' ? 1.0 : 0.5))}
                            disabled={categoryValue <= 0.5}
                            className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-black h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer transition disabled:opacity-40"
                          >
                            -
                          </button>
                          
                          <input
                            type="number"
                            step={eventCategory === 'shots' ? 1.0 : 0.5}
                            min={0.5}
                            max={50}
                            value={categoryValue}
                            onChange={(e) => handleValueChange(Number(e.target.value))}
                            className="flex-1 bg-white border border-slate-200 rounded-lg h-8 px-2 font-mono font-bold text-center text-xs focus:border-sky-500 outline-none"
                          />

                          <button
                            type="button"
                            onClick={() => handleValueChange(categoryValue + (eventCategory === 'shots' ? 1.0 : 0.5))}
                            className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-black h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer transition"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 3. Title input (Auto-generated/Custom) */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Событие</label>
                    {eventCategory !== 'custom' && (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-150">
                        ⚡ Автогенерация активна
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder={
                      eventCategory === 'custom'
                        ? "Например: Вратарь забьет гол в основное время"
                        : "Событие автогенерируется по шаблону..."
                    }
                    readOnly={eventCategory !== 'custom'}
                    required
                    className={`w-full border rounded-xl p-2.5 text-md font-semibold text-slate-800 focus:border-sky-500 outline-none ${
                      eventCategory !== 'custom'
                        ? 'bg-slate-100/60 border-slate-200 text-slate-500 cursor-not-allowed select-none'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                {/* 4. Description input (Auto-generated/Custom) */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Подробное описание прогноза</label>
                  <textarea
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder={
                      eventCategory === 'custom'
                        ? "Опишите подробные обстоятельства этого прогноза..."
                        : "Описание автогенерируется..."
                    }
                    readOnly={eventCategory !== 'custom'}
                    rows={2}
                    required
                    className={`w-full border rounded-xl p-2.5 text-md font-medium text-slate-850 focus:border-sky-500 outline-none ${
                      eventCategory !== 'custom'
                        ? 'bg-slate-100/60 border-slate-200 text-slate-500 cursor-not-allowed select-none'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                {/* Integram hint box - kept sky-blue */}
                <div className="bg-sky-50 border border-sky-200 p-3.5 rounded-2xl text-xs text-sky-800 font-bold flex gap-2 items-center">
                  <span>💡</span>
                  <span>За создание события вы получите бонус +50 Integra! Это пример гибкости архитектора Интеграм.</span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEventForm(false)}
                    className="flex-1 bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold py-2 px-4 rounded-xl text-md cursor-pointer border border-slate-200"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-sky-500 text-white hover:bg-sky-600 font-bold py-2 px-4 rounded-xl text-md cursor-pointer"
                  >
                    Создать событие
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* List of Custom Events */}
          <div className="space-y-4">
            {customEvents.map(event => (
              <div 
                key={event.id}
                className={`bg-white rounded-2xl border p-5 shadow-sm transition ${
                  event.isUserVoted ? 'border-sky-300 bg-sky-50/50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-slate-100 border border-slate-200 text-slate-650 font-bold text-xs px-2.5 py-1 rounded-lg">
                    Матч: {event.matchTitle}
                  </span>
                  <span className="text-xs text-slate-400 font-medium font-mono">
                    Автор: {event.creatorName}
                  </span>
                </div>

                <h4 className="text-lg font-black text-slate-800 mt-1 leading-snug font-display">{event.title}</h4>
                <p className="text-slate-600 text-sm mt-1 leading-relaxed">{event.description}</p>

                {/* Progress stats */}
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-bold">Голоса:</span>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200 shadow-inner">
                    <div 
                      className="bg-emerald-550 h-full" 
                      style={{ width: `${(event.votesYes / (event.votesYes + event.votesNo + 1)) * 100}%` }}
                    ></div>
                    <div 
                      className="bg-rose-550 h-full" 
                      style={{ width: `${(event.votesNo / (event.votesYes + event.votesNo + 1)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-slate-500 font-mono font-bold">Да: {event.votesYes} / Нет: {event.votesNo}</span>
                </div>

                {/* Voting or resolved action */}
                {event.status === 'active' ? (
                  <div className="mt-4 pt-3 border-t border-slate-150">
                    {event.isUserVoted ? (
                      <div className="bg-emerald-50 border border-emerald-250 rounded-xl p-2.5 flex items-center justify-between text-emerald-800 text-sm font-bold">
                        <span>✓ Ваш прогноз принят: {event.userVoteSelection === 'yes' ? 'Да' : 'Нет'}</span>
                        <span className="text-xs text-emerald-600 font-mono">Ждем матч...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                        <span className="text-xs font-bold text-slate-500 uppercase">Прогноз ({betAmount} Integra):</span>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleVoteCustom(event.id, 'yes')}
                            disabled={user.gramsBalance < betAmount}
                            className="flex-1 sm:flex-none bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-black px-4 py-2 rounded-xl text-sm border border-emerald-200 cursor-pointer transition disabled:opacity-40 shadow-sm"
                          >
                            Да (x{event.oddsYes})
                          </button>
                          <button
                            onClick={() => handleVoteCustom(event.id, 'no')}
                            disabled={user.gramsBalance < betAmount}
                            className="flex-1 sm:flex-none bg-rose-50 hover:bg-rose-100 text-rose-800 font-black px-4 py-2 rounded-xl text-sm border border-rose-200 cursor-pointer transition disabled:opacity-40 shadow-sm"
                          >
                            Нет (x{event.oddsNo})
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 pt-3 border-t border-slate-150 flex justify-between items-center text-sm font-black">
                    <span className="text-slate-500">Результат события:</span>
                    <span className={`px-3 py-1 rounded-lg ${
                      event.status === 'resolved_yes' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}>
                      {event.status === 'resolved_yes' ? 'Да (Сбылось)' : 'Нет (Не сбылось)'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Special Integram tooltips promo - styled as a beautiful grassy-green soft card as requested */}
          <div className="bg-emerald-50 border border-emerald-250 rounded-3xl p-5 space-y-2.5 shadow-sm">
            <h4 className="font-extrabold text-emerald-800 text-md flex items-center gap-1.5 font-display">
              <span>🌟</span> Тултип Создателя
            </h4>
            <p className="text-sm text-emerald-950 leading-snug">
              Хотите настроить подобные голосования для вашего сообщества или спортивного бара? Интеграм позволяет делать это полностью за 20 минут визуально и абсолютно без кода!
            </p>
            <button 
              onClick={() => setActiveTab('integram')}
              className="text-xs text-emerald-600 font-black hover:text-emerald-700 hover:underline cursor-pointer transition text-left"
            >
              Посмотреть пример генерации вашего приложения →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
