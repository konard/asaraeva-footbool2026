import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Shield, Award, Settings, RefreshCw, Smartphone, Navigation2, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ThreeDBall } from './ThreeDBall';

export const Navigation: React.FC = () => {
  const { user, notifications, activeTab, setActiveTab, resetState, setUser, addNotification, triggerBallRoll } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const toggleTelegramNotifications = () => {
    const nextState = !user.isTelegramNotificationEnabled;
    setUser(prev => ({ ...prev, isTelegramNotificationEnabled: nextState }));
    
    if (nextState) {
      addNotification(
        'Telegram Уведомления',
        'Вы успешно подписались на уведомления о матчах! Бот «Интеграм FC» будет присылать результаты и вызовы.',
        'system'
      );
    } else {
      addNotification(
        'Telegram Уведомления',
        'Вы отписались от уведомлений о матчах.',
        'system'
      );
    }
  };

  const navItems = [
    { id: 'matches', label: '⚽ Матчи и Ставки', mobileLabel: 'Матчи' },
    { id: 'duels', label: '⚔️ Битва друзей', mobileLabel: 'Дуэли' },
    { id: 'results', label: '🏆 Результаты', mobileLabel: 'Итоги' },
    { id: 'news', label: '📢 Лента новостей', mobileLabel: 'Лента' },
    { id: 'leaderboard', label: '🏆 Лидерборд', mobileLabel: 'Топ' },
    { id: 'profile', label: '🧑🏻 Мой Профиль', mobileLabel: 'Профиль' }
  ];

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-22">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.08, rotate: 15 }}
              whileTap={{ scale: 0.95 }}
              className="cursor-pointer"
              onClick={() => {
                setActiveTab('matches');
                triggerBallRoll();
              }}
              title="Нажмите, чтобы запустить мяч!"
            >
              <ThreeDBall className="w-12 h-12 sm:w-14 sm:h-14" />
            </motion.div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-amber-500 to-emerald-500 tracking-tight leading-none font-display">
                Интеграм FC
              </h1>
              <p className="text-[10px] sm:text-xs text-amber-600 font-bold tracking-wider uppercase mt-1">
                ЧЕМПИОНАТ 2026 • ТОТАЛИЗАТОР
              </p>
            </div>
          </div>
 
          {/* User Balance and Quick Status */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Grams balance display - large and bold */}
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className="bg-gradient-to-r from-rose-500 via-[#f43f5e] to-orange-500 border border-rose-400 rounded-2xl py-2 px-3 sm:px-5 flex items-center gap-2 sm:gap-3 shadow-md cursor-pointer relative overflow-hidden"
              onClick={() => setActiveTab('profile')}
            >
              <span className="text-2xl sm:text-3xl z-10">💎</span>
              <div className="z-10">
                <p className="text-[10px] text-rose-100 font-bold uppercase tracking-wider leading-none">Баланс</p>
                <p className="text-lg sm:text-2xl font-black text-white font-mono leading-none mt-0.5">
                  {user.gramsBalance} <span className="text-sm font-bold text-amber-100">Integra</span>
                </p>
              </div>
            </motion.div>

            {/* User Profile Info with Avatar */}
            <div 
              onClick={() => setActiveTab('profile')}
              className="flex flex-col items-center cursor-pointer group shrink-0 animate-fade-in"
              title="Перейти в Мой Профиль"
            >
              <div 
                className={`h-12 w-12 sm:h-14 sm:w-14 rounded-2xl border-2 transition duration-200 overflow-hidden flex items-center justify-center relative shadow-sm ${
                  activeTab === 'profile' ? 'border-amber-500 bg-amber-500/10' : 'border-slate-200 bg-slate-100 hover:border-slate-350'
                }`}
              >
                {user.avatar.startsWith('data:') || user.avatar.startsWith('http') || user.avatar.startsWith('blob:') ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-full h-full object-cover select-none"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl select-none">
                    {user.avatar}
                  </span>
                )}
              </div>

              {user.username && (
                <span className={`text-[10px] sm:text-xs font-bold font-mono transition duration-200 mt-1 leading-none ${
                  activeTab === 'profile' ? 'text-amber-600 font-extrabold' : 'text-slate-500 group-hover:text-amber-600'
                }`}>
                  @{user.username}
                </span>
              )}
            </div>
 
            {/* Notifications panel toggle - placed after profile icon */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-3 sm:p-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl border border-slate-200 transition relative cursor-pointer"
              >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-black rounded-full h-6 w-6 flex items-center justify-center border-2 border-white animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>
 
              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 p-4 max-h-[480px] overflow-y-auto z-50 text-slate-800">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                      <h3 className="font-black text-slate-850 text-lg">Уведомления</h3>
                      <button 
                        onClick={() => { resetState(); setShowNotifications(false); }}
                        className="text-xs text-red-500 font-bold hover:underline cursor-pointer"
                        title="Сбросить всё к демо-состоянию"
                      >
                        Сбросить демо
                      </button>
                    </div>
 
                    <div className="divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <p className="text-slate-400 text-center py-6 text-base">Нет новых уведомлений</p>
                      ) : (
                        notifications.map(notif => (
                          <div 
                            key={notif.id} 
                            className="py-2.5 px-1 text-sm transition"
                          >
                            <div className="flex justify-between items-start gap-1">
                              <span className="font-extrabold text-slate-800 text-md flex items-center gap-1.5">
                                {notif.type === 'badge' ? '🎖️' : notif.type === 'duel' ? '⚔️' : notif.type === 'match' ? '⚽' : '🔔'} 
                                {notif.title}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">{notif.timestamp}</span>
                            </div>
                            <p className="text-slate-600 mt-0.5 leading-snug">{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Telegram Notification Quick Switch - styled as a beautiful red/green toggle switch, slightly smaller */}
            <div className="flex flex-col items-center shrink-0">
              <span className="text-[9px] font-black text-slate-400 font-mono tracking-tight leading-none mb-1 select-none">
                Увед. TG
              </span>
              <button
                onClick={toggleTelegramNotifications}
                className={`w-8 h-5 rounded-full transition-colors duration-200 ease-in-out relative flex items-center focus:outline-none p-0.5 cursor-pointer shadow-inner ${
                  user.isTelegramNotificationEnabled ? 'bg-emerald-500' : 'bg-red-500'
                }`}
                title={user.isTelegramNotificationEnabled ? "Telegram-уведомления включены" : "Включить Telegram-уведомления"}
              >
                <span 
                  className={`w-3.5 h-3.5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
                    user.isTelegramNotificationEnabled ? 'translate-x-3.5' : 'translate-x-0'
                  }`}
                >
                  <span className="text-[8px]">✈️</span>
                </span>
              </button>
            </div>
          </div>
        </div>
 
        {/* Large Navigation Tabs */}
        <nav className="flex justify-start overflow-x-auto py-2.5 gap-2 scrollbar-none">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            const isIntegram = item.id === 'integram';
            
            let btnClass = "";
            if (isActive) {
              if (isIntegram) {
                btnClass = 'bg-sky-500 text-white shadow-md border border-sky-400';
              } else {
                btnClass = 'bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white shadow-md border border-rose-500';
              }
            } else {
              if (isIntegram) {
                // Highlight Integram tab uniquely in sky-blue
                btnClass = 'bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100';
              } else {
                btnClass = 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200';
              }
            }
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`py-3.5 px-5 sm:px-6 font-bold text-sm sm:text-md rounded-2xl transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${btnClass}`}
              >
                <span className="hidden sm:inline">{item.label}</span>
                <span className="inline sm:hidden">{item.mobileLabel}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
