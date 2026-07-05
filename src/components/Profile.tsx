import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Copy, CheckCircle, Gift, Users, Trophy, ExternalLink, ShieldQuestion, Calendar } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, badges, addNotification, updateUserBalance, setActiveTab, setUser, votingTeams } = useApp();
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);
  const [referralCopied, setReferralCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      addNotification('Ошибка файла', 'Пожалуйста, выберите изображение.', 'system');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      addNotification('Размер превышен', 'Максимальный размер фото — 2МБ.', 'system');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        setUser(prev => ({ ...prev, avatar: event.target!.result as string }));
        addNotification('Профиль обновлен', 'Ваш новый аватар успешно загружен!', 'system');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}?invite=${user.referralCode}` : '';
  const shareText = `🎁 Лови +150 Integra на баланс в футбольном тотализаторе «Интеграм FC»!\nЗаходи, создавай дуэли, выигрывай значки и болей за любимые команды!\n👉 Зарегистрироваться за 10 секунд: ${inviteLink}`;
  const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;
  const vkShareUrl = `https://vk.com/share.php?url=${encodeURIComponent(inviteLink)}&title=${encodeURIComponent(shareText)}`;

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2000);
      addNotification('Реферальный код', 'Текст приглашения с кодом скопирован в буфер обмена!', 'system');
    });
  };

  // Preloaded mock referrals
  const mockReferrals = [
    { name: 'Влад Торпедо', date: '30.06.2026', bonus: '+150 Integra', avatar: '🐉' },
    { name: 'Игорь Канонир', date: '01.07.2026', bonus: '+150 Integra', avatar: '🐺' }
  ];

  const winRate = user.wins + user.losses > 0 
    ? Math.round((user.wins / (user.wins + user.losses)) * 100) 
    : 100;

  const isCustomImage = user.avatar.startsWith('data:') || user.avatar.startsWith('http') || user.avatar.startsWith('blob:');

  return (
    <div className="space-y-8">
      {/* Upper Grid: Profile Card & Referral widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* PROFILE GENERAL CARD */}
        <div className="lg:col-span-1 bg-[#130b2c] border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-between gap-6">
          <div className="w-full text-center space-y-4">
            {/* Avatar display with drag and drop / upload */}
            <div className="relative inline-block group">
              <label 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`cursor-pointer block relative rounded-full overflow-hidden border-4 bg-slate-950 shadow-inner transition duration-250 w-28 h-28 mx-auto ${
                  isDragging ? 'border-amber-500 bg-amber-950/20 scale-105' : 'border-slate-850 group-hover:border-rose-500/50'
                }`}
              >
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarUpload}
                />
                {isCustomImage ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-full h-full object-cover select-none"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-7xl w-full h-full flex items-center justify-center select-none">
                    {user.avatar}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-black uppercase tracking-wider gap-1">
                  <span>Загрузить</span>
                  <span>фото 📷</span>
                </div>
              </label>
              <span className="absolute bottom-0 right-1 bg-gradient-to-r from-[#e11d48] to-[#f59e0b] text-white font-mono text-[9px] font-black py-1 px-2 rounded-full border-2 border-[#130b2c] shadow">
                PRO
              </span>
            </div>

            {/* Quick preset selections */}
            <div className="pt-1">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-2">Быстрый выбор эмодзи</p>
              <div className="flex justify-center gap-1.5 flex-wrap">
                {['⚽️', '🏆', '🔥', '🦁', '🦉', '🦊', '🐉'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setUser(prev => ({ ...prev, avatar: emoji }));
                      addNotification('Аватар обновлен', `Выбран аватар ${emoji}`, 'system');
                    }}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-md hover:bg-slate-800 transition cursor-pointer ${
                      user.avatar === emoji ? 'bg-slate-800 border border-amber-500' : 'bg-slate-900 border border-slate-850'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-black text-white leading-tight font-display">{user.name}</h2>
              {user.username && user.username !== user.name && !user.name.includes(user.username) && (
                <p className="text-slate-400 font-semibold text-md mt-1">@{user.username}</p>
              )}
            </div>

            {/* Social network auth pill */}
            {user.authProvider ? (
              <span className="inline-flex items-center gap-1.5 bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 rounded-full py-1.5 px-4 font-black text-xs uppercase tracking-wider">
                ✓ Связан с {user.authProvider.toUpperCase()}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-yellow-950/40 text-yellow-300 border border-yellow-500/30 rounded-full py-1.5 px-4 font-black text-xs uppercase tracking-wider animate-pulse">
                ⚠️ Гостевой вход
              </span>
            )}
          </div>

          {/* User statistics panel - Large figures */}
          <div className="w-full bg-slate-950 border border-slate-850 rounded-2xl p-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Победы</p>
              <p className="text-2xl font-black text-slate-200 font-mono mt-0.5">{user.wins}</p>
            </div>
            <div className="border-x border-slate-850">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Поражения</p>
              <p className="text-2xl font-black text-slate-200 font-mono mt-0.5">{user.losses}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Процент</p>
              <p className="text-2xl font-black text-emerald-400 font-mono mt-0.5">{winRate}%</p>
            </div>
          </div>

          <div className="w-full text-center text-xs text-slate-500 font-mono flex items-center justify-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Зарегистрирован: 01.07.2026</span>
          </div>
        </div>

        {/* REFERRAL SYSTEM - kept sky-blue as requested */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#0b1c3c] via-[#09152b] to-[#060a17] border-2 border-sky-500/30 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col justify-between gap-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 text-9xl opacity-5 select-none pointer-events-none">🎁</div>
          <div className="space-y-3">
            <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 w-fit">
              <Gift className="w-4 h-4" /> Пригласи друзей — получи Integra
            </span>
            <h3 className="text-2xl md:text-3xl font-extrabold text-white font-display">
              Поделитесь реферальной ссылкой
            </h3>
            <p className="text-slate-300 text-md leading-relaxed">
              Пригласите своих болельщиков присоединиться к вашей команде в «Интеграм FC». При переходе по ссылке новый пользователь получит <span className="font-bold text-sky-300">+150 Integra</span> на стартовый баланс, и вам также начислится <span className="font-bold text-sky-300">+150 Integra</span>!
            </p>
          </div>

          {/* Copy referral box - kept sky-blue highlighted */}
          <div className="space-y-4">
            <div className="bg-slate-950 border-2 border-sky-500/25 rounded-2xl p-4 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Ваш инвайт-код</p>
                <p className="text-xl md:text-2xl font-black font-mono text-sky-300 mt-1.5 tracking-wider">{user.referralCode}</p>
              </div>
              {referralCopied ? (
                <span className="text-emerald-400 text-md font-bold flex items-center gap-1 animate-pulse">
                  <CheckCircle className="w-5 h-5" /> Скопировано!
                </span>
              ) : (
                <button
                  onClick={handleCopyReferral}
                  className="bg-sky-500 hover:bg-sky-600 text-white font-extrabold py-2 px-4 rounded-xl text-sm transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-sky-500/10"
                >
                  <Copy className="w-4 h-4" /> Скопировать
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a 
                href={tgShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-sky-500/20 transition text-md text-center flex items-center justify-center gap-2"
              >
                Отправить в Telegram ✈️
              </a>
              <a 
                href={vkShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-blue-500/20 transition text-md text-center flex items-center justify-center gap-2"
              >
                Поделиться в ВК 🔵
              </a>
            </div>
          </div>

          {/* Invited Friends List */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4" /> Ваши приглашенные болельщики ({user.referralsCount}):
            </p>
            <div className="flex flex-wrap gap-3">
              {mockReferrals.map((ref, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl py-1.5 px-3.5 flex items-center gap-2.5 shadow-sm text-sm font-bold text-slate-300">
                  <span>{ref.avatar}</span>
                  <span>{ref.name}</span>
                  <span className="text-xs text-emerald-400 font-mono">({ref.bonus})</span>
                </div>
              ))}
              <div className="bg-dashed border-2 border-slate-800 rounded-xl py-1.5 px-3.5 flex items-center justify-center text-xs text-slate-500 font-bold">
                + ждем остальных
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VOTING TEAMS / FRIEND POOLS */}
      <div className="bg-[#130b2c] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
        <div>
          <h3 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2 font-display">
            <span>🙌</span> Собранные Команды для Голосования
          </h3>
          <p className="text-slate-400 text-md mt-0.5 font-medium">Ваши пулы друзей и коллег, собранные по конкретным футбольным матчам для совместных ставок.</p>
        </div>

        {votingTeams && votingTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {votingTeams.map((team) => (
              <div key={team.id} className="bg-slate-900/80 border border-slate-850 rounded-2xl p-5 space-y-4 shadow-md relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="text-lg font-black text-white">{team.teamName}</h4>
                      <p className="text-xs text-sky-400 font-bold flex items-center gap-1 mt-1">
                        <span>⚽</span> {team.matchTitle}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-950 px-2 py-1 rounded">
                      Создана в {team.createdTime}
                    </span>
                  </div>

                  <div className="border-t border-slate-800/80 pt-3 mt-3 space-y-2.5">
                    <p className="text-slate-400 text-xs font-mono font-bold uppercase tracking-wider">Участники и их прогнозы:</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {team.members.map((member, mIdx) => (
                        <div key={mIdx} className="flex items-center justify-between bg-slate-950/50 p-2.5 rounded-xl border border-slate-850">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{member.avatar}</span>
                            <div>
                              <span className="text-xs font-black text-slate-200 block">{member.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono font-bold">Прогноз: {member.prediction}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-extrabold text-amber-500">{member.amount} Integra</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850 flex items-center justify-between text-xs font-bold text-slate-400 mt-4">
                  <span>Общий пул голосов команды:</span>
                  <span className="font-extrabold text-emerald-400 text-sm">
                    {team.members.reduce((acc, m) => acc + m.amount, 0)} Integra
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-3">
            <span className="text-4xl block">🙌</span>
            <p className="text-slate-300 font-bold">У вас пока нет собранных команд</p>
            <p className="text-slate-500 text-xs max-w-md mx-auto">
              Чтобы собрать друзей или коллег в пул, сделайте ставку на любой футбольный матч во вкладке <span className="text-sky-400 font-black cursor-pointer hover:underline" onClick={() => setActiveTab('matches')}>«Матчи»</span>, а затем нажмите кнопку <span className="text-emerald-400 font-black">«Собрать команду для голосования»</span>.
            </p>
          </div>
        )}
      </div>

      {/* BADGES / REWARDS GRID - The main visual milestone */}
      <div className="bg-[#130b2c] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
        <div>
          <h3 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2 font-display">
            <span>🏆</span> Коллекция Знаков Отличия
          </h3>
          <p className="text-slate-400 text-md mt-0.5 font-medium">Получайте уникальные бейджи за прогнозы, дуэли и активность. Нажмите на значок для деталей!</p>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {badges.map(badge => {
            const isUnlocked = badge.isUnlocked;
            const isSelected = selectedBadgeId === badge.id;

            return (
              <motion.div
                key={badge.id}
                whileHover={{ scale: 1.03 }}
                onClick={() => setSelectedBadgeId(isSelected ? null : badge.id)}
                className={`group p-5 rounded-2xl border cursor-pointer transition text-center flex flex-col items-center justify-between relative ${
                  badge.type === 'creator'
                    ? 'badge-god-glow'
                    : isUnlocked
                      ? isSelected 
                        ? 'border-sky-500 bg-[#141d44]/60 shadow-lg shadow-sky-950/20 font-extrabold' 
                        : 'border-slate-850 bg-[#0f0927] hover:border-slate-800'
                      : isSelected
                        ? 'border-sky-500/50 bg-[#141d44]/35 shadow-md opacity-100 font-extrabold'
                        : 'border-slate-900 bg-slate-950/40 opacity-40 hover:opacity-100 hover:border-slate-800'
                }`}
              >
                {/* Checkmark indicator for unlocked */}
                {isUnlocked && (
                  <span className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-0.5 text-[9px] font-black">
                    ✓
                  </span>
                )}

                <span className={`text-5xl md:text-6xl select-none mb-3 transition duration-300 ${
                  badge.type === 'creator'
                    ? ''
                    : isUnlocked || isSelected
                      ? 'filter-none'
                      : 'filter grayscale group-hover:filter-none'
                }`}>
                  {badge.iconName}
                </span>

                <div>
                  <h4 className="font-extrabold text-slate-200 text-md md:text-lg font-display">{badge.title}</h4>
                  <p className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider mt-1">
                    {isUnlocked ? `Разблокирован` : 'Заблокирован'}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Badge detail Tooltip display / Integram advertising - kept sky-blue */}
        <AnimatePresence>
          {selectedBadgeId && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-[#0b1c3c] border-2 border-sky-500/30 rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden"
            >
              {(() => {
                const badge = badges.find(b => b.id === selectedBadgeId);
                if (!badge) return null;
                return (
                  <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
                    <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                      <span className={`text-6xl select-none p-3 bg-slate-950 rounded-2xl shadow-md border ${badge.type === 'creator' ? 'badge-god-glow border-yellow-400' : 'border-slate-800'}`}>
                        {badge.iconName}
                      </span>
                      <div>
                        <h4 className="text-xl font-black text-white flex items-center gap-2 font-display">
                          Значок: «{badge.title}»
                          <span className={`text-xs px-2.5 py-0.5 rounded font-black ${badge.isUnlocked ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-900 text-slate-500'}`}>
                            {badge.isUnlocked ? 'ПОЛУЧЕН' : 'ЕЩЕ НЕ ОТКРЫТ'}
                          </span>
                        </h4>
                        <p className="text-slate-300 text-md mt-1 leading-relaxed max-w-xl">{badge.description}</p>
                        {badge.isUnlocked && (
                          <p className="text-xs text-emerald-400 font-mono font-bold mt-1.5">✓ Дата получения: {badge.unlockedAt || '01.07.2026'}</p>
                        )}
                        {badge.type === 'creator' && (
                          <div className="mt-4 p-4 bg-slate-950/60 rounded-2xl border border-sky-500/30 max-w-xl space-y-3">
                            <p className="text-xs font-black text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                              <span>🛠️</span> Тултип Создателя Интеграм
                            </p>
                            <p className="text-slate-200 text-xs leading-relaxed font-medium">
                              Хотите такой же значок для своей компании? В конструкторе Интеграм можно настраивать любые бейджи под любые активности пользователей без единой строчки кода!
                            </p>
                            <button
                              onClick={() => setActiveTab('integram')}
                              className="w-full bg-gradient-to-r from-sky-400 to-sky-600 hover:from-sky-500 hover:to-sky-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-lg shadow-sky-500/20"
                            >
                              Посмотреть пример генерации вашего приложения <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
