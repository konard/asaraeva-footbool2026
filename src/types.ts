export interface Match {
  id: string;
  teamA: string;
  teamB: string;
  teamAFlag: string;
  teamBFlag: string;
  date: string; // e.g. "01.07.2026"
  time: string; // e.g. "21:00"
  status: 'upcoming' | 'live' | 'finished';
  scoreA?: number;
  scoreB?: number;
  oddsA: number;
  oddsDraw: number;
  oddsB: number;
  players: string[];
  lineupA?: string[];
  lineupB?: string[];
}

export interface CustomEvent {
  id: string;
  matchId: string;
  matchTitle: string;
  title: string;
  description: string;
  oddsYes: number;
  oddsNo: number;
  status: 'active' | 'resolved_yes' | 'resolved_no';
  votesYes: number;
  votesNo: number;
  creatorName: string;
  isUserVoted?: boolean;
  userVoteSelection?: 'yes' | 'no';
  category?: 'penalties' | 'offsides' | 'shots' | 'custom';
  categoryTeam?: 'teamA' | 'teamB' | 'both';
  categoryCondition?: 'greater' | 'less';
  categoryValue?: number;
}

export interface Duel {
  id: string;
  matchId: string;
  matchTitle: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  targetFriendName: string;
  targetFriendHandle?: string; // e.g. @vlad_torp or vlad@yandex.ru
  notificationChannel?: 'telegram' | 'vk' | 'yandex' | 'none';
  betAmount: number; // in grams
  predictionType: 'match_outcome' | 'custom_event';
  predictionDetail: string; // e.g., "Победа Испании" or "Вратарь забьет гол"
  status: 'pending' | 'accepted' | 'captain_won' | 'friend_won' | 'all_lost';
  captainSelection: string; // 'yes' / 'no' or 'teamA' / 'draw' / 'teamB'
  friendSelection?: string;
  isCollectiveOracle?: boolean; // if both captain and friend guessed correctly
  isGroupGame?: boolean;
  maxParticipants?: number; // up to 1000
  participants?: { name: string; avatar: string; selection: string; betAmount: number; timestamp: string }[];
}

export interface DispatchLog {
  id: string;
  duelId: string;
  targetHandle: string;
  channel: 'telegram' | 'vk' | 'yandex' | 'unknown';
  status: 'sent' | 'delivered' | 'failed' | 'queued';
  message: string;
  timestamp: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  iconName: string;
  type: 'prophet' | 'divergent' | 'afonya' | 'oracle' | 'creator';
  isUnlocked: boolean;
  tooltipText: string;
  unlockedAt?: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  email?: string;
  gramsBalance: number;
  wins: number;
  losses: number;
  referralCode: string;
  referralsCount: number;
  badges: string[]; // badgeIds
  authProvider?: 'telegram' | 'vk' | 'yandex';
  isTelegramNotificationEnabled: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  username: string;
  avatar: string;
  score: number; // grams
  badgesCount: number;
  isCreator: boolean; // if they created popular custom events
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'match' | 'duel' | 'badge' | 'system';
}

export interface SystemLog {
  id: string;
  category: string;
  icon: string;
  text: string;
  time: string;
  type: 'user' | 'system';
}

export interface VotingTeam {
  id: string;
  matchId: string;
  matchTitle: string;
  teamName: string;
  createdTime: string;
  members: {
    name: string;
    avatar: string;
    prediction: string;
    amount: number;
  }[];
}

export interface NewsPost {
  id: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  title: string;
  content: string;
  category: 'news' | 'insight' | 'outrage'; // новости, инсайты, негодования
  likes: number;
  dislikes: number;
  commentsCount: number;
  timestamp: string;
  gramsReward: number;
  repostsCount?: number;
  isLikedByUser?: boolean;
  isDislikedByUser?: boolean;
}

