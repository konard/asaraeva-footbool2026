import React, { createContext, useContext, useState, useEffect } from 'react';
import { Match, CustomEvent, Duel, Badge, User, LeaderboardEntry, Notification, DispatchLog, SystemLog, VotingTeam, NewsPost } from '../types';
import { INITIAL_MATCHES, INITIAL_BADGES, INITIAL_LEADERBOARD, MOCK_FRIENDS } from '../data/initialData';

interface AppContextType {
  user: User;
  matches: Match[];
  customEvents: CustomEvent[];
  duels: Duel[];
  badges: Badge[];
  leaderboard: LeaderboardEntry[];
  notifications: Notification[];
  dispatchLogs: DispatchLog[];
  systemLogs: SystemLog[];
  newsPosts: NewsPost[];
  addNewsPost: (title: string, content: string, category: 'news' | 'insight' | 'outrage') => void;
  likeNewsPost: (postId: string) => void;
  dislikeNewsPost: (postId: string) => void;
  shareNewsPost: (postId: string, platform: 'telegram' | 'vk' | 'yandex') => void;
  addSystemLog: (category: string, icon: string, text: string, type: 'user' | 'system') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  preselectedDuelType: 'match_outcome' | 'custom_event';
  setPreselectedDuelType: (type: 'match_outcome' | 'custom_event') => void;
  placeBet: (matchId: string, outcome: 'teamA' | 'draw' | 'teamB', amount: number) => boolean;
  addCustomEvent: (
    matchId: string, 
    title: string, 
    description: string,
    category?: 'penalties' | 'offsides' | 'shots' | 'custom',
    categoryTeam?: 'teamA' | 'teamB' | 'both',
    categoryCondition?: 'greater' | 'less',
    categoryValue?: number
  ) => void;
  voteCustomEvent: (eventId: string, selection: 'yes' | 'no', amount: number) => boolean;
  createDuel: (
    matchId: string,
    predictionType: 'match_outcome' | 'custom_event',
    predictionDetail: string,
    captainSelection: string,
    friendName: string,
    amount: number,
    friendHandle?: string,
    notificationChannel?: 'telegram' | 'vk' | 'yandex' | 'none',
    isGroupGame?: boolean
  ) => boolean;
  joinGroupGame: (duelId: string, participantName: string, selection: string, betAmount: number) => boolean;
  simulateGroupParticipants: (duelId: string, count: number) => void;
  clearDispatchLogs: () => void;
  acceptDuel: (duelId: string) => void;
  resolveDuelManually: (duelId: string, winner: 'captain' | 'friend' | 'all_lost' | 'both_oracle') => void;
  simulateMatchOutcome: (matchId: string, scoreA: number, scoreB: number, customEventResolutions?: { [eventId: string]: 'yes' | 'no' }) => void;
  triggerPreMatchAlert: (matchId: string) => void;
  addReferral: (friendName: string) => void;
  addNotification: (title: string, message: string, type: 'match' | 'duel' | 'badge' | 'system') => void;
  clearNotifications: () => void;
  unlockBadgeDirectly: (badgeId: string) => void;
  updateUserBalance: (amount: number) => void;
  resetState: () => void;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  isBallRolling: boolean;
  triggerBallRoll: () => void;
  userBets: Record<string, { outcome: 'teamA' | 'draw' | 'teamB'; amount: number }>;
  votingTeams: VotingTeam[];
  createVotingTeam: (matchId: string, teamName: string, outcome: 'teamA' | 'draw' | 'teamB', amount: number) => void;
  getMatchDynamicOdds: (match: Match) => {
    oddsA: number;
    oddsDraw: number;
    oddsB: number;
    poolA: number;
    poolDraw: number;
    poolB: number;
    totalPool: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('integram_user');
    if (saved) return JSON.parse(saved);
    return {
      id: 'u_me',
      name: 'Владимир (Болельщик)',
      username: 'vlad_fan90',
      avatar: '⚽️',
      gramsBalance: 500, // starting balance in grams
      wins: 4,
      losses: 2,
      referralCode: 'INT-FC-77',
      referralsCount: 2,
      badges: [],
      authProvider: undefined,
      isTelegramNotificationEnabled: false,
    };
  });

  const [matches, setMatches] = useState<Match[]>(() => {
    const saved = localStorage.getItem('integram_matches');
    return saved ? JSON.parse(saved) : INITIAL_MATCHES;
  });

  const [customEvents, setCustomEvents] = useState<CustomEvent[]>(() => {
    const saved = localStorage.getItem('integram_custom_events');
    if (saved) return JSON.parse(saved);
    // initial sample custom events
    return [
      {
        id: 'ce1',
        matchId: 'm1',
        matchTitle: 'Испания - Германия',
        title: 'Вратарь забьет гол',
        description: 'Мануэль Нойер побежит в чужую штрафную при угловом на последних минутах и забьет головой!',
        oddsYes: 15.0,
        oddsNo: 1.05,
        status: 'active',
        votesYes: 45,
        votesNo: 120,
        creatorName: 'Алексей Смирнов'
      },
      {
        id: 'ce2',
        matchId: 'm2',
        matchTitle: 'Франция - Португалия',
        title: 'Криштиану Роналду забьет со штрафного',
        description: 'Легендарный португалец забьет прямой гол со штрафного удара в девятку.',
        oddsYes: 4.5,
        oddsNo: 1.25,
        status: 'active',
        votesYes: 88,
        votesNo: 42,
        creatorName: 'Игорь Канонир'
      }
    ];
  });

  const [duels, setDuels] = useState<Duel[]>(() => {
    const saved = localStorage.getItem('integram_duels');
    if (saved) return JSON.parse(saved);
    // initial sample duels
    return [
      {
        id: 'd1',
        matchId: 'm1',
        matchTitle: 'Испания - Германия',
        creatorId: 'u_me',
        creatorName: 'Владимир (Болельщик)',
        creatorAvatar: '⚽️',
        targetFriendName: 'Влад Торпедо',
        betAmount: 100,
        predictionType: 'match_outcome',
        predictionDetail: 'Победа Испании (2:1)',
        status: 'accepted',
        captainSelection: 'teamA',
        friendSelection: 'teamB',
      }
    ];
  });

  const [badges, setBadges] = useState<Badge[]>(() => {
    const saved = localStorage.getItem('integram_badges');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Badge[];
        return INITIAL_BADGES.map(initial => {
          const loaded = parsed.find(b => b.id === initial.id);
          return {
            ...initial,
            isUnlocked: loaded ? loaded.isUnlocked : initial.isUnlocked,
            unlockedAt: loaded ? loaded.unlockedAt : initial.unlockedAt
          };
        });
      } catch (e) {
        return INITIAL_BADGES;
      }
    }
    return INITIAL_BADGES;
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    const saved = localStorage.getItem('integram_leaderboard');
    return saved ? JSON.parse(saved) : INITIAL_LEADERBOARD;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('integram_notifications');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'n1',
        title: 'Добро пожаловать в Интеграм FC!',
        message: 'Мы начислили вам стартовые 500 Integra! Делайте прогнозы, создавайте дуэли и выигрывайте значки.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: false,
        type: 'system'
      }
    ];
  });

  const [dispatchLogs, setDispatchLogs] = useState<DispatchLog[]>(() => {
    const saved = localStorage.getItem('integram_dispatch_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(() => {
    const saved = localStorage.getItem('integram_system_logs');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'sys_1',
        category: 'Участник',
        icon: '👥',
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
        text: 'Дмитрий Мельников (@dimas_chelsea) сделал ставку 2-3 гола на матч Испания - Германия (50 Integra).',
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
    ];
  });

  const [activeTab, setActiveTab] = useState<string>('matches');
  const [preselectedDuelType, setPreselectedDuelType] = useState<'match_outcome' | 'custom_event'>('match_outcome');
  const [isBallRolling, setIsBallRolling] = useState(false);
  const [userBets, setUserBets] = useState<Record<string, { outcome: 'teamA' | 'draw' | 'teamB'; amount: number }>>(() => {
    const saved = localStorage.getItem('integram_user_bets');
    if (!saved) return {};
    try {
      const parsed = JSON.parse(saved);
      const migrated: Record<string, { outcome: 'teamA' | 'draw' | 'teamB'; amount: number }> = {};
      Object.keys(parsed).forEach(key => {
        const val = parsed[key];
        if (typeof val === 'string') {
          migrated[key] = { outcome: val as 'teamA' | 'draw' | 'teamB', amount: 50 };
        } else if (val && typeof val === 'object' && 'outcome' in val) {
          migrated[key] = val as { outcome: 'teamA' | 'draw' | 'teamB'; amount: number };
        }
      });
      return migrated;
    } catch (e) {
      return {};
    }
  });

  const [votingTeams, setVotingTeams] = useState<VotingTeam[]>(() => {
    const saved = localStorage.getItem('integram_voting_teams');
    return saved ? JSON.parse(saved) : [];
  });

  const [newsPosts, setNewsPosts] = useState<NewsPost[]>(() => {
    const saved = localStorage.getItem('integram_news_posts');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'np1',
        authorName: 'Алексей Смирнов',
        authorUsername: 'alex_predict',
        authorAvatar: '🦁',
        title: '🔥 Испания против Германии: Анализ тактики',
        content: 'Испания показывает феноменальный прессинг в первом тайме! Ламин Ямаль разрывает левый фланг защиты немцев. Германия отвечает быстрыми контратаками через Мусиалу. Кто возьмет верх во втором тайме? Ставлю на победу Испании 2:1!',
        category: 'insight',
        likes: 42,
        dislikes: 5,
        commentsCount: 12,
        timestamp: '18:15',
        gramsReward: 100,
        repostsCount: 14
      },
      {
        id: 'np2',
        authorName: 'Ольга Кузнецова',
        authorUsername: 'helga_oraculum',
        authorAvatar: '🦊',
        title: '📢 Сенсационный состав на Аргентина — Франция!',
        content: 'Появилась инсайдерская информация: Лионель Месси выйдет на поле с первых минут, несмотря на небольшое растяжение. Тренерский штаб Аргентины идет ва-банк! Франция готовит связку Мбаппе-Дембеле для контратак.',
        category: 'news',
        likes: 89,
        dislikes: 3,
        commentsCount: 24,
        timestamp: '17:40',
        gramsReward: 100,
        repostsCount: 32
      },
      {
        id: 'np3',
        authorName: 'Игорь Канонир',
        authorUsername: 'vlad_torp',
        authorAvatar: '🐺',
        title: '🤬 Что это за судейство в матче?! Полное негодование!',
        content: 'Чистейший подкат в штрафной площади Германии, а судья даже не посмотрел VAR! Это стопроцентный пенальти в ворота немцев! Моему негодованию просто нет предела, судью на мыло!',
        category: 'outrage',
        likes: 124,
        dislikes: 21,
        commentsCount: 56,
        timestamp: '18:32',
        gramsReward: 100,
        repostsCount: 45
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('integram_voting_teams', JSON.stringify(votingTeams));
  }, [votingTeams]);

  useEffect(() => {
    localStorage.setItem('integram_news_posts', JSON.stringify(newsPosts));
  }, [newsPosts]);

  const triggerBallRoll = () => {
    setIsBallRolling(true);
    setTimeout(() => {
      setIsBallRolling(false);
    }, 4000); // 4 seconds animation
  };

  useEffect(() => {
    // Trigger ball roll once on initial load with a slight delay
    const timer = setTimeout(() => {
      triggerBallRoll();
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Save to local storage on changes
  useEffect(() => {
    localStorage.setItem('integram_user_bets', JSON.stringify(userBets));
  }, [userBets]);

  useEffect(() => {
    localStorage.setItem('integram_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('integram_matches', JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem('integram_custom_events', JSON.stringify(customEvents));
  }, [customEvents]);

  useEffect(() => {
    localStorage.setItem('integram_duels', JSON.stringify(duels));
  }, [duels]);

  useEffect(() => {
    localStorage.setItem('integram_badges', JSON.stringify(badges));
  }, [badges]);

  useEffect(() => {
    localStorage.setItem('integram_leaderboard', JSON.stringify(leaderboard));
  }, [leaderboard]);

  useEffect(() => {
    localStorage.setItem('integram_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('integram_dispatch_logs', JSON.stringify(dispatchLogs));
  }, [dispatchLogs]);

  useEffect(() => {
    localStorage.setItem('integram_system_logs', JSON.stringify(systemLogs));
  }, [systemLogs]);

  // Pre-match (30 min before) automated check
  const [sentPreMatchIds, setSentPreMatchIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('integram_sent_prematch_ids');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('integram_sent_prematch_ids', JSON.stringify(sentPreMatchIds));
  }, [sentPreMatchIds]);

  useEffect(() => {
    const checkUpcomingMatches = () => {
      const now = Date.now();
      matches.forEach(m => {
        if (m.status === 'upcoming') {
          // Parse date: DD.MM.YYYY, time: HH:MM
          const parts = m.date.split('.');
          if (parts.length === 3) {
            const isoStr = `${parts[2]}-${parts[1]}-${parts[0]}T${m.time}:00`;
            const matchTime = new Date(isoStr).getTime();
            const diffMin = (matchTime - now) / (1000 * 60);

            // If match starts in 28 to 32 minutes, and we haven't sent a notification yet
            if (diffMin > 0 && diffMin <= 31 && !sentPreMatchIds.includes(m.id)) {
              setSentPreMatchIds(prev => [...prev, m.id]);
              
              const title = `🚨 Скоро матч: ${m.teamA} — ${m.teamB}`;
              const message = `До начала футбольного матча осталось ровно 30 минут (начало в ${m.time})! Успейте сделать ставки и бросить вызов друзьям в дуэлях!`;
              
              addNotification(title, message, 'match');

              // If Telegram notifications are enabled, also log to dispatch logs
              if (user.isTelegramNotificationEnabled) {
                const newLog: DispatchLog = {
                  id: 'lgr_pre_' + Date.now(),
                  duelId: '',
                  targetHandle: user.username || 'vlad_fan90',
                  channel: 'telegram',
                  status: 'delivered',
                  message: `[Рассылка] Телеграм-бот отправил напоминание за 30 минут до начала матча ${m.teamA} - ${m.teamB}.`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                };
                setDispatchLogs(prev => [newLog, ...prev]);
              }
            }
          }
        }
      });
    };

    const interval = setInterval(checkUpcomingMatches, 15000); // Check every 15 seconds
    checkUpcomingMatches(); // check immediately
    return () => clearInterval(interval);
  }, [matches, sentPreMatchIds, user.isTelegramNotificationEnabled, user.username]);

  const clearDispatchLogs = () => {
    setDispatchLogs([]);
  };

  const addSystemLog = (category: string, icon: string, text: string, type: 'user' | 'system') => {
    const newLog: SystemLog = {
      id: 'sys_' + Date.now(),
      category,
      icon,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type
    };
    setSystemLogs(prev => [newLog, ...prev]);
  };

  const addNotification = (title: string, message: string, type: 'match' | 'duel' | 'badge' | 'system') => {
    const newNotif: Notification = {
      id: 'n_' + Date.now(),
      title,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
      type
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const updateUserBalance = (amount: number) => {
    setUser(prev => ({
      ...prev,
      gramsBalance: Math.max(0, prev.gramsBalance + amount)
    }));
  };

  // 1. Place a regular bet on matches
  const placeBet = (matchId: string, outcome: 'teamA' | 'draw' | 'teamB', amount: number): boolean => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return false;

    const existingBet = userBets[matchId];
    if (existingBet && existingBet.outcome === outcome) {
      // Cancel bet (Deselect)
      updateUserBalance(existingBet.amount);
      setUserBets(prev => {
        const next = { ...prev };
        delete next[matchId];
        return next;
      });
      addNotification(
        'Ставка отменена',
        `Вы отменили свою ставку на исход "${outcome === 'teamA' ? match.teamA : outcome === 'draw' ? 'Ничья' : match.teamB}" в матче ${match.teamA} - ${match.teamB}. ${existingBet.amount} Integra возвращены на баланс.`,
        'system'
      );
      return true;
    }

    // Refund old bet if changing option
    let currentBalance = user.gramsBalance;
    if (existingBet) {
      currentBalance += existingBet.amount;
    }

    if (currentBalance < amount) {
      addNotification('Ошибка ставки', 'Недостаточно Integra на вашем балансе.', 'system');
      return false;
    }

    // Process change
    if (existingBet) {
      updateUserBalance(existingBet.amount);
    }
    updateUserBalance(-amount);
    setUserBets(prev => ({ ...prev, [matchId]: { outcome, amount } }));
    
    const outcomeText = outcome === 'teamA' ? match.teamA : outcome === 'draw' ? 'Ничью' : match.teamB;
    addNotification(
      'Ставка принята!',
      `Вы поставили ${amount} Integra на исход: ${outcomeText} в матче ${match.teamA} - ${match.teamB}.`,
      'match'
    );

    const outcomeTextNormal = outcome === 'teamA' ? match.teamA : outcome === 'draw' ? 'Ничья' : match.teamB;
    addSystemLog(
      'Участник',
      '⚽',
      `Участник @${user.username || 'user'} зафиксировал выбор (${amount} Integra) на исход [${outcomeTextNormal}] в матче ${match.teamA} — ${match.teamB}.`,
      'user'
    );

    // Simulate other participants reacting to this bet automatically in the logs!
    setTimeout(() => {
      const randomAmounts = [100, 150, 50, 200, 300];
      const randomFriends = ['@alex_predict', '@dimas_chelsea', '@mary_goals', '@serg_analyst', '@helga_oraculum', '@nike_fan'];
      const shuffled = [...randomFriends].sort(() => 0.5 - Math.random());
      
      // Person 1 agrees:
      addSystemLog(
        'Участник',
        '👍',
        `Участник ${shuffled[0]} поддержал выбор @${user.username || 'user'} и тоже поставил ${randomAmounts[Math.floor(Math.random() * randomAmounts.length)]} Integra на исход [${outcomeTextNormal}]!`,
        'user'
      );
      
      // Person 2 disagrees:
      const oppositeOutcome = outcome === 'teamA' ? 'teamB' : 'teamA';
      const oppositeText = oppositeOutcome === 'teamA' ? match.teamA : match.teamB;
      setTimeout(() => {
        addSystemLog(
          'Участник',
          '🔥',
          `Участник ${shuffled[1]} пошел против мнения толпы и поставил ${randomAmounts[Math.floor(Math.random() * randomAmounts.length)]} Integra на исход [${oppositeText}]. Калькулятор тотализатора пересчитал коэффициенты!`,
          'user'
        );
      }, 1500);
    }, 1000);

    return true;
  };

  // Create voting team (friend pool)
  const createVotingTeam = (matchId: string, teamName: string, outcome: 'teamA' | 'draw' | 'teamB', amount: number) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const predictionText = outcome === 'teamA' ? match.teamA : outcome === 'draw' ? 'Ничья' : match.teamB;

    const shuffled = [...MOCK_FRIENDS].sort(() => 0.5 - Math.random());
    const friendsCount = 3 + Math.floor(Math.random() * 3); // 3 to 5 friends
    const chosenFriends = shuffled.slice(0, friendsCount);

    const outcomes: ('teamA' | 'draw' | 'teamB')[] = ['teamA', 'draw', 'teamB'];

    const members = [
      {
        name: `${user.name} (Вы)`,
        avatar: user.avatar,
        prediction: predictionText,
        amount: amount
      },
      ...chosenFriends.map(f => {
        const friendOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
        const friendPredictionText = friendOutcome === 'teamA' ? match.teamA : friendOutcome === 'draw' ? 'Ничья' : match.teamB;
        return {
          name: f.name,
          avatar: f.avatar,
          prediction: friendPredictionText,
          amount: 50 + Math.floor(Math.random() * 4) * 50
        };
      })
    ];

    const newTeam: VotingTeam = {
      id: 'vt_' + Date.now(),
      matchId,
      matchTitle: `${match.teamA} — ${match.teamB}`,
      teamName,
      createdTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      members
    };

    setVotingTeams(prev => [newTeam, ...prev]);

    addSystemLog(
      'Участник',
      '👥',
      `Участник @${user.username || 'user'} собрал команду «${teamName}» для голосования по матчу ${match.teamA} — ${match.teamB}. В команду вошли: ${chosenFriends.map(f => f.name).join(', ')}.`,
      'user'
    );

    addNotification(
      'Команда собрана!',
      `Команда «${teamName}» успешно собрана для совместного голосования по матчу ${match.teamA} — ${match.teamB}. Ставки участников отображаются в вашем личном кабинете!`,
      'system'
    );
  };

  // Calculate dynamic pari-mutuel odds
  const getMatchDynamicOdds = (match: Match) => {
    const baseOddsA = match.oddsA;
    const baseOddsDraw = match.oddsDraw;
    const baseOddsB = match.oddsB;

    const wA = 1 / baseOddsA;
    const wDraw = 1 / baseOddsDraw;
    const wB = 1 / baseOddsB;
    const totalWeight = wA + wDraw + wB;

    // Use a realistic base total pool (e.g. 5000 Integra) for dynamic shifting
    const baselineTotalPool = 5000;
    
    let poolA = baselineTotalPool * (wA / totalWeight);
    let poolDraw = baselineTotalPool * (wDraw / totalWeight);
    let poolB = baselineTotalPool * (wB / totalWeight);

    // Sum user bet if it exists
    const userBet = userBets[match.id];
    if (userBet) {
      if (userBet.outcome === 'teamA') {
        poolA += userBet.amount;
      } else if (userBet.outcome === 'draw') {
        poolDraw += userBet.amount;
      } else if (userBet.outcome === 'teamB') {
        poolB += userBet.amount;
      }
    }

    const totalPool = poolA + poolDraw + poolB;
    
    // Direct pari-mutuel calculation with a tiny house edge of 4%
    const margin = 0.96;
    const oddsA = Math.max(1.02, Number(((totalPool / poolA) * margin).toFixed(2)));
    const oddsDraw = Math.max(1.02, Number(((totalPool / poolDraw) * margin).toFixed(2)));
    const oddsB = Math.max(1.02, Number(((totalPool / poolB) * margin).toFixed(2)));

    return {
      oddsA,
      oddsDraw,
      oddsB,
      poolA: Math.round(poolA),
      poolDraw: Math.round(poolDraw),
      poolB: Math.round(poolB),
      totalPool: Math.round(totalPool)
    };
  };

  // 2. Add custom match event
  const addCustomEvent = (
    matchId: string, 
    title: string, 
    description: string,
    category?: 'penalties' | 'offsides' | 'shots' | 'custom',
    categoryTeam?: 'teamA' | 'teamB' | 'both',
    categoryCondition?: 'greater' | 'less',
    categoryValue?: number
  ) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const newEvent: CustomEvent = {
      id: 'ce_' + Date.now(),
      matchId,
      matchTitle: `${match.teamA} - ${match.teamB}`,
      title,
      description,
      oddsYes: Math.round((2.5 + Math.random() * 8) * 10) / 10,
      oddsNo: Math.round((1.1 + Math.random() * 0.4) * 10) / 10,
      status: 'active',
      votesYes: 1,
      votesNo: 0,
      creatorName: user.name,
      category,
      categoryTeam,
      categoryCondition,
      categoryValue
    };

    setCustomEvents(prev => [newEvent, ...prev]);
    
    // Unlock "Создатель" badge or show hint
    unlockBadgeDirectly('b5');

    addNotification(
      'Событие создано!',
      `Ваше событие "${title}" добавлено в список для голосования к матчу ${newEvent.matchTitle}! Вы получили 50 Integra за творчество.`,
      'system'
    );

    updateUserBalance(50); // bonus for creating

    // Also update Creators' leaderboard rating
    setLeaderboard(prev => {
      return prev.map(entry => {
        if (entry.id === 'u_me') {
          return { ...entry, isCreator: true, score: entry.score + 50 };
        }
        return entry;
      });
    });
  };

  // Vote on custom event
  const voteCustomEvent = (eventId: string, selection: 'yes' | 'no', amount: number): boolean => {
    if (user.gramsBalance < amount) {
      addNotification('Ошибка', 'Недостаточно Integra для голосования.', 'system');
      return false;
    }

    setCustomEvents(prev => prev.map(event => {
      if (event.id === eventId) {
        return {
          ...event,
          votesYes: selection === 'yes' ? event.votesYes + 1 : event.votesYes,
          votesNo: selection === 'no' ? event.votesNo + 1 : event.votesNo,
          isUserVoted: true,
          userVoteSelection: selection
        };
      }
      return event;
    }));

    updateUserBalance(-amount);
    addNotification('Голос учтен', `Вы поставили ${amount} Integra на то, что событие произойдет: ${selection === 'yes' ? 'Да' : 'Нет'}.`, 'match');
    return true;
  };

  // 3. Challenge a friend to a duel
  const createDuel = (
    matchId: string,
    predictionType: 'match_outcome' | 'custom_event',
    predictionDetail: string,
    captainSelection: string,
    friendName: string,
    amount: number,
    friendHandle?: string,
    notificationChannel?: 'telegram' | 'vk' | 'yandex' | 'none',
    isGroupGame?: boolean
  ): boolean => {
    if (user.gramsBalance < amount) {
      addNotification('Ошибка дуэли', 'Недостаточно Integra для ставки.', 'system');
      return false;
    }

    const match = matches.find(m => m.id === matchId);
    if (!match) return false;

    const duelId = 'd_' + Date.now();

    const newDuel: Duel = {
      id: duelId,
      matchId,
      matchTitle: `${match.teamA} - ${match.teamB}`,
      creatorId: 'u_me',
      creatorName: user.name,
      creatorAvatar: user.avatar,
      targetFriendName: isGroupGame ? 'Групповой вызов' : friendName,
      targetFriendHandle: isGroupGame ? undefined : friendHandle,
      notificationChannel: isGroupGame ? 'none' : notificationChannel,
      betAmount: amount,
      predictionType,
      predictionDetail,
      status: isGroupGame ? 'accepted' : 'pending',
      captainSelection,
      isGroupGame,
      maxParticipants: 1000,
      participants: isGroupGame ? [] : undefined,
    };

    setDuels(prev => [newDuel, ...prev]);
    updateUserBalance(-amount);

    if (isGroupGame) {
      addNotification(
        'Групповая игра создана!',
        `Вы создали приглашение в игру по матчу ${match.teamA} - ${match.teamB}! Ссылка готова, лимит — до 1000 участников.`,
        'duel'
      );
    } else {
      addNotification(
        'Вызов отправлен!',
        `Вы вызвали игрока ${friendName} на дуэль пророков в матче ${match.teamA} - ${match.teamB}! Ждем согласия друга.`,
        'duel'
      );
    }

    // Queue simulated dispatch logs if handle is provided
    if (!isGroupGame && notificationChannel && notificationChannel !== 'none' && friendHandle) {
      const cleanHandle = friendHandle.trim();
      const channelLabel = notificationChannel === 'telegram' ? 'Telegram' : notificationChannel === 'vk' ? 'ВКонтакте' : 'Yandex';
      const logMsg1 = `[Очередь] Подготовка уведомления для ${cleanHandle} в ${channelLabel}. Анализ шаблона...`;
      
      const newLog1: DispatchLog = {
        id: 'lgr_' + Date.now() + '_1',
        duelId: duelId,
        targetHandle: cleanHandle,
        channel: notificationChannel as any,
        status: 'queued',
        message: logMsg1,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      
      setDispatchLogs(prev => [newLog1, ...prev]);

      // Sent Log after 1000ms
      setTimeout(() => {
        let msg = '';
        if (notificationChannel === 'telegram') {
          msg = `[Отправлено] Вызов t.me/bot_api. Метод sendMessage. Тело: {"chat_id": "${cleanHandle}", "text": "Вас вызвали на дуэль..."}. Статус: 200 OK.`;
        } else if (notificationChannel === 'vk') {
          msg = `[Отправлено] Вызов vk.api/messages.send. Получатель: ${cleanHandle}. Отправка интерактивного сниппета дуэли.`;
        } else {
          msg = `[Отправлено] SMTP сессия инициализирована. HELO mail.yandex.ru. RCPT TO: <${cleanHandle}>. Письмо передано в MTA.`;
        }
        
        const newLog2: DispatchLog = {
          id: 'lgr_' + (Date.now() + 1000) + '_2',
          duelId: duelId,
          targetHandle: cleanHandle,
          channel: notificationChannel as any,
          status: 'sent',
          message: msg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        setDispatchLogs(prev => [newLog2, ...prev]);
      }, 1000);

      // Delivered Log after 2500ms
      setTimeout(() => {
        let msg = '';
        if (notificationChannel === 'telegram') {
          msg = `[Доставлено] Чат-бот зафиксировал прочтение. Пользователь ${cleanHandle} получил Push-уведомление в клиенте Telegram.`;
        } else if (notificationChannel === 'vk') {
          msg = `[Доставлено] Вебхук подтвердил доставку сообщения для ${cleanHandle}. Индикатор прочитанного установлен.`;
        } else {
          msg = `[Доставлено] Письмо успешно доставлено в папку "Входящие" для ${cleanHandle}. SPF/DKIM подписи верифицированы.`;
        }

        const newLog3: DispatchLog = {
          id: 'lgr_' + (Date.now() + 2500) + '_3',
          duelId: duelId,
          targetHandle: cleanHandle,
          channel: notificationChannel as any,
          status: 'delivered',
          message: msg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        setDispatchLogs(prev => [newLog3, ...prev]);
      }, 2500);
    }

    // Auto accept after 5 seconds for interactive demo purposes
    if (!isGroupGame) {
      setTimeout(() => {
        setDuels(currentDuels => {
          const target = currentDuels.find(d => d.id === newDuel.id);
          if (target && target.status === 'pending') {
            addNotification(
              'Вызов принят!',
              `${friendName} принял вашу дуэль! Он прогнозирует противоположный исход. Ссылка-карточка сгенерирована!`,
              'duel'
            );
            return currentDuels.map(d => {
              if (d.id === newDuel.id) {
                return {
                  ...d,
                  status: 'accepted',
                  friendSelection: captainSelection === 'yes' ? 'no' : captainSelection === 'teamA' ? 'teamB' : 'teamA'
                };
              }
              return d;
            });
          }
          return currentDuels;
        });
      }, 4000);
    } else {
      // For group game, automatically add a few mock participants after 3 seconds to make it feel alive!
      setTimeout(() => {
        simulateGroupParticipants(duelId, 12);
      }, 3000);
    }

    return true;
  };

  const joinGroupGame = (duelId: string, participantName: string, selection: string, betAmount: number): boolean => {
    let success = false;
    setDuels(prev => prev.map(d => {
      if (d.id === duelId && d.isGroupGame) {
        const currentCount = d.participants?.length || 0;
        if (currentCount >= 1000) {
          addNotification('Ошибка', 'Достигнут лимит в 1000 участников!', 'system');
          return d;
        }
        
        const avatarOptions = ['⚽️', '🏆', '🔥', '🦁', '🦉', '🦊', '🐉', '👟', '⭐', '⚡'];
        const randomAvatar = avatarOptions[Math.floor(Math.random() * avatarOptions.length)];
        const newPart = {
          name: participantName,
          avatar: randomAvatar,
          selection,
          betAmount,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        const updatedParts = [...(d.participants || []), newPart];
        success = true;
        
        addNotification(
          'Ставка сделана!',
          `Участник ${participantName} присоединился к игре и поставил ${betAmount} Integra на ${
            selection === 'teamA' ? 'Команду А' : selection === 'draw' ? 'Ничью' : selection === 'teamB' ? 'Команду Б' : selection === 'yes' ? 'Да' : 'Нет'
          }!`,
          'duel'
        );
        
        return {
          ...d,
          participants: updatedParts
        };
      }
      return d;
    }));
    return success;
  };

  const simulateGroupParticipants = (duelId: string, count: number) => {
    const firstNames = ['Алексей', 'Дмитрий', 'Мария', 'Евгений', 'Ольга', 'Владислав', 'Анна', 'Сергей', 'Павел', 'Елена', 'Артем', 'Никита', 'Кирилл', 'Татьяна', 'Ирина', 'Михаил', 'Андрей', 'Иван', 'Роман', 'Наталья'];
    const lastNames = ['Смирнов', 'Иванов', 'Кузнецов', 'Попов', 'Васильев', 'Петров', 'Соколов', 'Михайлов', 'Новиков', 'Федоров', 'Морозов', 'Волков', 'Алексеев', 'Лебедев', 'Семенов', 'Егоров', 'Павлов', 'Козлов', 'Степанов', 'Николаев'];
    const avatarOptions = ['⚽️', '🏆', '🔥', '🦁', '🦉', '🦊', '🐉', '👟', '⭐', '⚡', '🤖', '🦊', '🐻', '🐼', '🐯'];
    
    setDuels(prev => prev.map(d => {
      if (d.id === duelId && d.isGroupGame) {
        const currentParticipants = d.participants || [];
        const currentCount = currentParticipants.length;
        const slotsLeft = 1000 - currentCount;
        const actualToAdd = Math.min(count, slotsLeft);
        
        if (actualToAdd <= 0) return d;
        
        const selections = d.predictionType === 'match_outcome' ? ['teamA', 'draw', 'teamB'] : ['yes', 'no'];
        const newParticipants = [];
        
        for (let i = 0; i < actualToAdd; i++) {
          const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
          const avatar = avatarOptions[Math.floor(Math.random() * avatarOptions.length)];
          const selection = selections[Math.floor(Math.random() * selections.length)];
          const betAmount = Math.floor(Math.random() * 40) * 10 + 50; // 50 to 450 grams
          const timestamp = new Date(Date.now() - Math.random() * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          newParticipants.push({
            name,
            avatar,
            selection,
            betAmount,
            timestamp
          });
        }
        
        addNotification(
          'Участники зашли!',
          `К игре успешно присоединилось еще ${actualToAdd} участников! (Всего: ${currentCount + actualToAdd} из 1000)`,
          'duel'
        );
        
        return {
          ...d,
          participants: [...currentParticipants, ...newParticipants]
        };
      }
      return d;
    }));
  };

  const acceptDuel = (duelId: string) => {
    setDuels(prev => prev.map(d => {
      if (d.id === duelId) {
        addNotification('Дуэль принята', `Вы приняли вызов от ${d.creatorName}!`, 'duel');
        return {
          ...d,
          status: 'accepted',
          friendSelection: d.captainSelection === 'yes' ? 'no' : d.captainSelection === 'teamA' ? 'teamB' : 'teamA'
        };
      }
      return d;
    }));
  };

  // Unlock badges directly
  const unlockBadgeDirectly = (badgeId: string) => {
    setBadges(prev => {
      const alreadyUnlocked = prev.find(b => b.id === badgeId)?.isUnlocked;
      if (alreadyUnlocked) return prev;

      addNotification(
        '🏆 Новый значок получен!',
        `Поздравляем! Вы разблокировали значок "${prev.find(b => b.id === badgeId)?.title}". Загляните в профиль!`,
        'badge'
      );

      return prev.map(b => b.id === badgeId ? { ...b, isUnlocked: true, unlockedAt: new Date().toLocaleDateString() } : b);
    });

    setUser(prev => {
      if (prev.badges.includes(badgeId)) return prev;
      return {
        ...prev,
        badges: [...prev.badges, badgeId]
      };
    });
  };

  // Resolve Duel Manually (admin tool or simulation)
  const resolveDuelManually = (duelId: string, winner: 'captain' | 'friend' | 'all_lost' | 'both_oracle') => {
    setDuels(prev => prev.map(d => {
      if (d.id === duelId) {
        let text = '';
        if (winner === 'captain') {
          text = `Поздравляем! Вы победили в дуэли против ${d.targetFriendName}! Вы получили значок "Пророк" и выиграли ${d.betAmount * 2} Integra!`;
          unlockBadgeDirectly('b1'); // Пророк
          updateUserBalance(d.betAmount * 2);
          setUser(u => ({ ...u, wins: u.wins + 1 }));
          addNotification('Победа в дуэли!', text, 'duel');
          return { ...d, status: 'captain_won' };
        } else if (winner === 'friend') {
          text = `Увы, ${d.targetFriendName} оказался прозорливее и выиграл дуэль. Вы получили значок "Дивергент" для друга! Он забирает ваши ${d.betAmount} Integra.`;
          unlockBadgeDirectly('b2'); // Дивергент (как пример)
          setUser(u => ({ ...u, losses: u.losses + 1 }));
          addNotification('Поражение в дуэли', text, 'duel');
          return { ...d, status: 'friend_won' };
        } else if (winner === 'both_oracle') {
          text = `Коллективный Оракул! И вы, и ${d.targetFriendName} угадали этот сложнейший исход! Получен мега-значок Футбольный Оракул и +${d.betAmount * 3} Integra!`;
          unlockBadgeDirectly('b4'); // Оракул
          updateUserBalance(d.betAmount * 3);
          setUser(u => ({ ...u, wins: u.wins + 1 }));
          addNotification('Сверхординарный исход!', text, 'duel');
          return { ...d, status: 'captain_won', isCollectiveOracle: true };
        } else {
          text = `Все ошиблись! Даже Афоня ошибается... Вы и ${d.targetFriendName} не угадали. Получен значок "Афоня" с мемным напутствием!`;
          unlockBadgeDirectly('b3'); // Афоня
          setUser(u => ({ ...u, losses: u.losses + 1 }));
          addNotification('Никто не угадал!', text, 'duel');
          return { ...d, status: 'all_lost' };
        }
      }
      return d;
    }));
  };

  // 4. Simulate a football match
  const simulateMatchOutcome = (matchId: string, scoreA: number, scoreB: number, customEventResolutions?: { [eventId: string]: 'yes' | 'no' }) => {
    // Update match score and status
    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          status: 'finished',
          scoreA,
          scoreB
        };
      }
      return m;
    }));

    const matchObj = matches.find(m => m.id === matchId);
    if (!matchObj) return;

    addNotification(
      'Матч завершен!',
      `Финальный счет матча ${matchObj.teamA} - ${matchObj.teamB}: [${scoreA}:${scoreB}]! Идет расчет ваших ставок и дуэлей...`,
      'match'
    );

    // Resolve standard bet if any
    const betObj = userBets[matchId];
    if (betObj) {
      const matchOutcome = scoreA > scoreB ? 'teamA' : scoreA < scoreB ? 'teamB' : 'draw';
      const userGuessed = betObj.outcome === matchOutcome;
      if (userGuessed) {
        const dynamicOdds = getMatchDynamicOdds(matchObj);
        let odds = 1.0;
        if (matchOutcome === 'teamA') odds = dynamicOdds.oddsA;
        else if (matchOutcome === 'draw') odds = dynamicOdds.oddsDraw;
        else if (matchOutcome === 'teamB') odds = dynamicOdds.oddsB;

        const winnings = Math.round(betObj.amount * odds);
        updateUserBalance(winnings);
        setUser(u => ({ ...u, wins: u.wins + 1 }));
        addNotification(
          'Ставка выиграла! 🎉',
          `Поздравляем! Ваша ставка на матч ${matchObj.teamA} - ${matchObj.teamB} принесла вам ${winnings} Integra!`,
          'match'
        );
      } else {
        setUser(u => ({ ...u, losses: u.losses + 1 }));
        addNotification(
          'Ставка проиграла 😢',
          `Увы, ваша ставка на матч ${matchObj.teamA} - ${matchObj.teamB} не сыграла.`,
          'match'
        );
      }
    }

    // Resolve custom events related to this match
    if (customEventResolutions) {
      setCustomEvents(prev => prev.map(event => {
        if (event.matchId === matchId && customEventResolutions[event.id]) {
          const res = customEventResolutions[event.id];
          const isYes = res === 'yes';
          
          if (event.isUserVoted) {
            const userGuessed = event.userVoteSelection === res;
            if (userGuessed) {
              const winnings = Math.round(50 * (isYes ? event.oddsYes : event.oddsNo));
              updateUserBalance(winnings);
              addNotification(
                'Событие сбылось!',
                `Ура! Событие "${event.title}" завершилось исходом [${isYes ? 'Да' : 'Нет'}]. Вы угадали и выиграли ${winnings} Integra!`,
                'match'
              );
            } else {
              addNotification(
                'Событие не сбылось',
                `Событие "${event.title}" завершилось исходом [${isYes ? 'Да' : 'Нет'}]. В этот раз прогноз не оправдался.`,
                'match'
              );
            }
          }
          return {
            ...event,
            status: isYes ? 'resolved_yes' as const : 'resolved_no' as const
          };
        }
        return event;
      }));
    }

    // Resolve associated duels
    setDuels(prev => {
      const duelsToResolve = prev.filter(d => d.matchId === matchId && d.status === 'accepted');
      
      if (duelsToResolve.length > 0) {
        duelsToResolve.forEach(d => {
          setTimeout(() => {
            // Determine winner based on score
            const matchOutcome = scoreA > scoreB ? 'teamA' : scoreA < scoreB ? 'teamB' : 'draw';
            
            if (d.predictionType === 'match_outcome') {
              const captainGuessed = d.captainSelection === matchOutcome;
              const friendGuessed = d.friendSelection === matchOutcome;

              if (captainGuessed && friendGuessed) {
                resolveDuelManually(d.id, 'both_oracle');
              } else if (captainGuessed) {
                resolveDuelManually(d.id, 'captain');
              } else if (friendGuessed) {
                resolveDuelManually(d.id, 'friend');
              } else {
                resolveDuelManually(d.id, 'all_lost');
              }
            } else {
              // custom event prediction
              // If there was a resolution for the event, use it, otherwise mock 50% chance
              let eventIsYes = Math.random() > 0.5;
              if (customEventResolutions) {
                const associatedEvent = customEvents.find(e => e.matchId === matchId);
                if (associatedEvent && customEventResolutions[associatedEvent.id]) {
                  eventIsYes = customEventResolutions[associatedEvent.id] === 'yes';
                }
              }

              const outcomeSelect = eventIsYes ? 'yes' : 'no';
              const captainGuessed = d.captainSelection === outcomeSelect;
              const friendGuessed = d.friendSelection === outcomeSelect;

              if (captainGuessed && friendGuessed) {
                resolveDuelManually(d.id, 'both_oracle');
              } else if (captainGuessed) {
                resolveDuelManually(d.id, 'captain');
              } else if (friendGuessed) {
                resolveDuelManually(d.id, 'friend');
              } else {
                resolveDuelManually(d.id, 'all_lost');
              }
            }
          }, 1500);
        });
      }
      return prev;
    });

    // Sync global leaderboard rankings randomly to simulate other players playing
    setLeaderboard(prev => {
      return prev.map(entry => {
        if (entry.id === 'u_me') {
          return { ...entry, score: user.gramsBalance, badgesCount: user.badges.length };
        }
        // simulate a little random change for others
        const change = Math.floor(Math.random() * 80) - 30;
        return {
          ...entry,
          score: Math.max(100, entry.score + change)
        };
      }).sort((a, b) => b.score - a.score).map((entry, index) => ({ ...entry, rank: index + 1 }));
    });

    // Notify results representing the 3-minute limit after broadcast (simulated with 1.5 seconds)
    setTimeout(() => {
      const isTg = user.isTelegramNotificationEnabled;
      const targetHandle = user.username || 'vlad_fan90';
      
      const newLog: DispatchLog = {
        id: 'lgr_post_' + Date.now(),
        duelId: '',
        targetHandle: targetHandle,
        channel: isTg ? 'telegram' : 'unknown',
        status: 'delivered',
        message: `[Рассылка] Результаты матча ${matchObj.teamA} - ${matchObj.teamB} (${scoreA}:${scoreB}) успешно разосланы всем участникам через 1.5 минуты после эфира матча (в рамках 3-минутного регламента).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      setDispatchLogs(prev => [newLog, ...prev]);

      addNotification(
        '📢 Итоги матча подведены!',
        `Официальные результаты матча ${matchObj.teamA} - ${matchObj.teamB} (${scoreA}:${scoreB}) разосланы участникам в течение 3 минут после эфира!`,
        'match'
      );
    }, 1500);
  };

  const triggerPreMatchAlert = (matchId: string) => {
    const m = matches.find(match => match.id === matchId);
    if (!m) return;

    const title = `🚨 Скоро матч: ${m.teamA} — ${m.teamB}`;
    const message = `До начала футбольного матча осталось ровно 30 минут (начало в ${m.time})! Успейте сделать ставки и бросить вызов друзьям в дуэлях!`;
    
    addNotification(title, message, 'match');

    const newLog: DispatchLog = {
      id: 'lgr_pre_manual_' + Date.now(),
      duelId: '',
      targetHandle: user.username || 'vlad_fan90',
      channel: user.isTelegramNotificationEnabled ? 'telegram' : 'unknown',
      status: 'delivered',
      message: `[Рассылка] Отправлено напоминание за 30 минут до начала матча ${m.teamA} - ${m.teamB} в Telegram/VK.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setDispatchLogs(prev => [newLog, ...prev]);
  };

  // News feed system
  const addNewsPost = (title: string, content: string, category: 'news' | 'insight' | 'outrage') => {
    const newPost: NewsPost = {
      id: 'np_' + Date.now(),
      authorName: user.name,
      authorUsername: user.username,
      authorAvatar: user.avatar,
      title: title,
      content: content,
      category: category,
      likes: 0,
      dislikes: 0,
      commentsCount: 0,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      gramsReward: 100,
      repostsCount: 0,
      isLikedByUser: false,
      isDislikedByUser: false
    };

    setNewsPosts(prev => [newPost, ...prev]);
    updateUserBalance(100);

    addNotification(
      'Новость опубликована! 📢',
      `Спасибо за вашу активность! Ваша публикация в ленту успешно добавлена. Вы получили вознаграждение +100 Integra!`,
      'system'
    );

    addSystemLog(
      'Лента',
      category === 'news' ? '📢' : category === 'insight' ? '💡' : '🤬',
      `Пользователь ${user.name} опубликовал ${category === 'news' ? 'новость' : category === 'insight' ? 'инсайт' : 'негодование'} и получил +100 Integra.`,
      'user'
    );
  };

  const likeNewsPost = (postId: string) => {
    setNewsPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const isLiked = post.isLikedByUser;
        const isDisliked = post.isDislikedByUser;
        return {
          ...post,
          likes: isLiked ? post.likes - 1 : post.likes + 1,
          dislikes: isDisliked ? post.dislikes - 1 : post.dislikes,
          isLikedByUser: !isLiked,
          isDislikedByUser: false
        };
      }
      return post;
    }));
  };

  const dislikeNewsPost = (postId: string) => {
    setNewsPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const isLiked = post.isLikedByUser;
        const isDisliked = post.isDislikedByUser;
        return {
          ...post,
          dislikes: isDisliked ? post.dislikes - 1 : post.dislikes + 1,
          likes: isLiked ? post.likes - 1 : post.likes,
          isDislikedByUser: !isDisliked,
          isLikedByUser: false
        };
      }
      return post;
    }));
  };

  const shareNewsPost = (postId: string, platform: 'telegram' | 'vk' | 'yandex') => {
    setNewsPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          repostsCount: (post.repostsCount || 0) + 1
        };
      }
      return post;
    }));

    updateUserBalance(150);

    const platformName = platform === 'telegram' ? 'Telegram' : platform === 'vk' ? 'ВКонтакте' : 'Яндекс/Email';

    addNotification(
      'Бонус за репост! 🔄',
      `Вы успешно сделали репост в ${platformName} и получили +150 Integra на ваш баланс!`,
      'system'
    );

    addSystemLog(
      'Репост',
      '🔗',
      `Пользователь совершил репост в ${platformName} и получил +150 Integra.`,
      'user'
    );
  };

  // Referral system
  const addReferral = (friendName: string) => {
    setUser(prev => ({
      ...prev,
      referralsCount: prev.referralsCount + 1,
      gramsBalance: prev.gramsBalance + 150 // both receive 150 grams
    }));

    addNotification(
      'Реферал зарегистрирован!',
      `Ваш друг ${friendName} присоединился к Интеграм FC по вашей ссылке! Вы оба получили по +150 Integra на баланс.`,
      'system'
    );
  };

  // Reset state
  const resetState = () => {
    localStorage.removeItem('integram_user');
    localStorage.removeItem('integram_matches');
    localStorage.removeItem('integram_custom_events');
    localStorage.removeItem('integram_duels');
    localStorage.removeItem('integram_badges');
    localStorage.removeItem('integram_leaderboard');
    localStorage.removeItem('integram_notifications');
    localStorage.removeItem('integram_dispatch_logs');
    localStorage.removeItem('integram_voting_teams');
    localStorage.removeItem('integram_news_posts');
    
    setDispatchLogs([]);
    setVotingTeams([]);
    setUser({
      id: 'u_me',
      name: 'Владимир (Болельщик)',
      username: 'vlad_fan90',
      avatar: '⚽️',
      gramsBalance: 500,
      wins: 4,
      losses: 2,
      referralCode: 'INT-FC-77',
      referralsCount: 2,
      badges: [],
      authProvider: undefined,
      isTelegramNotificationEnabled: false,
    });
    setMatches(INITIAL_MATCHES);
    setUserBets({});
    setBadges(INITIAL_BADGES);
    setLeaderboard(INITIAL_LEADERBOARD);
    setDuels([
      {
        id: 'd1',
        matchId: 'm1',
        matchTitle: 'Испания - Германия',
        creatorId: 'u_me',
        creatorName: 'Владимир (Болельщик)',
        creatorAvatar: '⚽️',
        targetFriendName: 'Влад Торпедо',
        betAmount: 100,
        predictionType: 'match_outcome',
        predictionDetail: 'Победа Испании (2:1)',
        status: 'accepted',
        captainSelection: 'teamA',
        friendSelection: 'teamB',
      }
    ]);
    setCustomEvents([
      {
        id: 'ce1',
        matchId: 'm1',
        matchTitle: 'Испания - Германия',
        title: 'Вратарь забьет гол',
        description: 'Мануэль Нойер побежит в чужую штрафную при угловом на последних минутах и забьет головой!',
        oddsYes: 15.0,
        oddsNo: 1.05,
        status: 'active',
        votesYes: 45,
        votesNo: 120,
        creatorName: 'Алексей Смирнов'
      }
    ]);
    setNewsPosts([
      {
        id: 'np1',
        authorName: 'Алексей Смирнов',
        authorUsername: 'alex_predict',
        authorAvatar: '🦁',
        title: '🔥 Испания против Германии: Анализ тактики',
        content: 'Испания показывает феноменальный прессинг в первом тайме! Ламин Ямаль разрывает левый фланг защиты немцев. Германия отвечает быстрыми контратаками через Мусиалу. Кто возьмет верх во втором тайме? Ставлю на победу Испании 2:1!',
        category: 'insight',
        likes: 42,
        dislikes: 5,
        commentsCount: 12,
        timestamp: '18:15',
        gramsReward: 100,
        repostsCount: 14
      },
      {
        id: 'np2',
        authorName: 'Ольга Кузнецова',
        authorUsername: 'helga_oraculum',
        authorAvatar: '🦊',
        title: '📢 Сенсационный состав на Аргентина — Франция!',
        content: 'Появилась инсайдерская информация: Лионель Месси выйдет на поле с первых минут, несмотря на небольшое растяжение. Тренерский штаб Аргентины идет ва-банк! Франция готовит связку Мбаппе-Дембеле для контратак.',
        category: 'news',
        likes: 89,
        dislikes: 3,
        commentsCount: 24,
        timestamp: '17:40',
        gramsReward: 100,
        repostsCount: 32
      },
      {
        id: 'np3',
        authorName: 'Игорь Канонир',
        authorUsername: 'vlad_torp',
        authorAvatar: '🐺',
        title: '🤬 Что это за судейство в матче?! Полное негодование!',
        content: 'Чистейший подкат в штрафной площади Германии, а судья даже не посмотрел VAR! Это стопроцентный пенальти в ворота немцев! Моему негодованию просто нет предела, судью на мыло!',
        category: 'outrage',
        likes: 124,
        dislikes: 21,
        commentsCount: 56,
        timestamp: '18:32',
        gramsReward: 100,
        repostsCount: 45
      }
    ]);
    setNotifications([
      {
        id: 'n_welcome',
        title: 'Данные сброшены',
        message: 'Приложение возвращено в исходное демонстрационное состояние.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: false,
        type: 'system'
      }
    ]);
    setActiveTab('matches');
  };

  return (
    <AppContext.Provider
      value={{
        user,
        matches,
        customEvents,
        duels,
        badges,
        leaderboard,
        notifications,
        dispatchLogs,
        systemLogs,
        newsPosts,
        addNewsPost,
        likeNewsPost,
        dislikeNewsPost,
        shareNewsPost,
        addSystemLog,
        activeTab,
        setActiveTab,
        preselectedDuelType,
        setPreselectedDuelType,
        placeBet,
        addCustomEvent,
        voteCustomEvent,
        createDuel,
        joinGroupGame,
        simulateGroupParticipants,
        clearDispatchLogs,
        acceptDuel,
        resolveDuelManually,
        simulateMatchOutcome,
        triggerPreMatchAlert,
        addReferral,
        addNotification,
        clearNotifications,
        unlockBadgeDirectly,
        updateUserBalance,
        resetState,
        setUser,
        isBallRolling,
        triggerBallRoll,
        userBets,
        votingTeams,
        createVotingTeam,
        getMatchDynamicOdds,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
