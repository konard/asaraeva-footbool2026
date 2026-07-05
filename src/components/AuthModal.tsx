import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, HelpCircle, Check, ShieldAlert, Award } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { user, updateUserBalance, addNotification, setUser } = useApp();
  const [isOpen, setIsOpen] = useState(user.authProvider === undefined);
  const [selectedProvider, setSelectedProvider] = useState<'telegram' | 'vk' | 'yandex' | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [inputVal, setInputVal] = useState('');

  const handleAuth = (provider: 'telegram' | 'vk' | 'yandex') => {
    setSelectedProvider(provider);
    setStep(2);
    if (provider === 'telegram') {
      setInputVal('@' + user.username);
    } else {
      setInputVal(user.name);
    }
  };

  const handleConfirm = () => {
    if (!selectedProvider) return;

    const providerNames = {
      telegram: 'Telegram',
      vk: 'ВКонтакте',
      yandex: 'Яндекс'
    };

    setUser(prev => ({
      ...prev,
      authProvider: selectedProvider,
      name: selectedProvider === 'telegram' ? inputVal : prev.name,
      username: selectedProvider === 'telegram' ? inputVal.replace('@', '') : prev.username
    }));

    updateUserBalance(100); // 100 grams bonus for linking social network

    addNotification(
      'Успешный вход!',
      `Вы успешно авторизовались через ${providerNames[selectedProvider]}! На ваш счет зачислено +100 Integra бонуса.`,
      'system'
    );

    setIsOpen(false);
  };

  return (
    <>
      {/* If not logged in, show floating button or welcome banner */}
      {!user.authProvider && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white px-6 py-5 rounded-3xl shadow-xl mb-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-emerald-550/20 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 opacity-10 font-black text-8xl select-none pointer-events-none">FC</div>
          <div className="flex items-center gap-4 relative z-10">
            <span className="text-3xl p-3 bg-white/20 backdrop-blur-md rounded-2xl">🔑</span>
            <div>
              <h3 className="text-xl font-black font-display text-white">Войдите в профиль болельщика</h3>
              <p className="text-sm text-emerald-50/90 font-medium mt-0.5">Свяжите аккаунт (Telegram, VK или Яндекс) и получите стартовые <span className="font-extrabold text-yellow-300 font-mono">+100 Integra</span>!</p>
            </div>
          </div>
          <button 
            onClick={() => { setStep(1); setIsOpen(true); }}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold px-6 py-3.5 rounded-2xl transition shadow-lg text-sm shrink-0 cursor-pointer uppercase tracking-wider hover:scale-102 transform active:scale-98 relative z-10"
          >
            Войти и забрать бонус
          </button>
        </div>
      )}



      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-250 relative text-slate-800"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 border border-slate-200 cursor-pointer hover:bg-slate-200 transition"
              >
                ×
              </button>

              {step === 1 ? (
                <div>
                  <div className="text-center mb-6">
                    <span className="inline-block p-4 bg-slate-100 border border-slate-200 rounded-2xl mb-3 text-4xl">⚽️</span>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-display">Вход в «Интеграм FC»</h2>
                    <p className="text-slate-500 text-sm mt-1">Выберите способ авторизации для сохранения результатов и ставок</p>
                  </div>

                  <div className="space-y-4 mb-6">
                    {/* Telegram */}
                    <button
                      onClick={() => handleAuth('telegram')}
                      className="w-full flex items-center justify-between p-4 bg-[#0b1c3c] hover:bg-[#0f244a] border border-sky-500/30 rounded-2xl text-left transition group cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">✈️</span>
                        <div>
                          <p className="font-bold text-white text-lg">Telegram Login</p>
                          <p className="text-sm text-slate-300">Рекомендуемый способ</p>
                        </div>
                      </div>
                      <span className="bg-sky-500 text-white p-2 px-3 rounded-xl text-sm font-bold group-hover:scale-105 transition shadow-md">Войти</span>
                    </button>

                    {/* VK */}
                    <button
                      onClick={() => handleAuth('vk')}
                      className="w-full flex items-center justify-between p-4 bg-[#0a1835] hover:bg-[#0d224a] border border-blue-500/20 rounded-2xl text-left transition group cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">🔵</span>
                        <div>
                          <p className="font-bold text-white text-lg">ВКонтакте ID</p>
                          <p className="text-sm text-slate-300">Через социальную сеть VK</p>
                        </div>
                      </div>
                      <span className="bg-blue-600 text-white p-2 px-3 rounded-xl text-sm font-bold group-hover:scale-105 transition">Войти</span>
                    </button>

                    {/* Yandex */}
                    <button
                      onClick={() => handleAuth('yandex')}
                      className="w-full flex items-center justify-between p-4 bg-[#1a0e1a] hover:bg-[#251425] border border-red-500/20 rounded-2xl text-left transition group cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">🔴</span>
                        <div>
                          <p className="font-bold text-white text-lg">Яндекс ID</p>
                          <p className="text-sm text-slate-300">Единый Яндекс-паспорт</p>
                        </div>
                      </div>
                      <span className="bg-red-500 text-white p-2 px-3 rounded-xl text-sm font-bold group-hover:scale-105 transition">Войти</span>
                    </button>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                    <ShieldAlert className="text-amber-600 w-6 h-6 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-900 font-bold">Безопасность данных</p>
                      <p className="text-xs text-amber-800 leading-relaxed mt-0.5">
                        Мы не запрашиваем ваши пароли. Авторизация безопасна и происходит в один клик. При входе дарим 100 Integra!
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-center mb-6">
                    <span className="inline-block p-4 bg-slate-150 border border-slate-200 rounded-2xl mb-3 text-3xl font-bold">
                      {selectedProvider === 'telegram' ? '✈️' : selectedProvider === 'vk' ? '🔵' : '🔴'}
                    </span>
                    <h2 className="text-2xl font-bold text-slate-900 font-display">Подтвердите данные</h2>
                    <p className="text-slate-500 text-sm mt-1">
                      Вы входите через {selectedProvider === 'telegram' ? 'Telegram' : selectedProvider === 'vk' ? 'ВКонтакте' : 'Яндекс'}
                    </p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-slate-600 text-sm font-bold mb-2">Имя в игре</label>
                      <input
                        type="text"
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        placeholder="Введите ваше имя или юзернейм"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-sky-500 outline-none text-slate-800 font-medium text-lg"
                      />
                    </div>

                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3">
                      <Award className="text-emerald-600 w-7 h-7 shrink-0" />
                      <div>
                        <p className="text-sm text-emerald-800 font-bold">Приветственный бонус гарантирован!</p>
                        <p className="text-xs text-emerald-600 font-mono">+100 Integra будут начислены мгновенно</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 font-bold py-3.5 px-4 rounded-xl transition text-lg cursor-pointer"
                    >
                      Назад
                    </button>
                    <button
                      onClick={handleConfirm}
                      className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-sky-500/10 transition text-lg cursor-pointer"
                    >
                      Подтвердить
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
