import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Award } from 'lucide-react';

type Provider = 'telegram' | 'vk' | 'yandex';

interface AuthConfig {
  vk: boolean;
  yandex: boolean;
  telegram: { enabled: boolean; botUsername: string | null };
}

interface OAuthProfile {
  provider: Provider;
  providerId: string;
  email?: string;
  name: string;
  username: string;
  avatarUrl?: string;
}

const DEFAULT_AUTH_CONFIG: AuthConfig = {
  vk: false,
  yandex: false,
  telegram: { enabled: false, botUsername: null },
};

const PROVIDER_NAMES: Record<Provider, string> = {
  telegram: 'Telegram',
  vk: 'ВКонтакте',
  yandex: 'Яндекс',
};

declare global {
  interface Window {
    onTelegramAuth?: (tgUser: Record<string, string>) => void;
  }
}

export const AuthModal: React.FC = () => {
  const { user, updateUserBalance, addNotification, setUser } = useApp();
  const [isOpen, setIsOpen] = useState(user.authProvider === undefined);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [inputVal, setInputVal] = useState('');
  const [authConfig, setAuthConfig] = useState<AuthConfig>(DEFAULT_AUTH_CONFIG);

  // Discover which providers have real OAuth credentials configured server-side.
  useEffect(() => {
    fetch('/api/auth/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((config: AuthConfig | null) => {
        if (config) setAuthConfig(config);
      })
      .catch(() => {
        // Real OAuth backend unreachable — the local demo flow below still works.
      });
  }, []);

  const applyOAuthProfile = useCallback(
    (profile: OAuthProfile) => {
      setUser((prev) => ({
        ...prev,
        authProvider: profile.provider,
        name: profile.name || prev.name,
        username: profile.username || prev.username,
        avatar: profile.avatarUrl || prev.avatar,
        email: profile.email || prev.email,
      }));

      updateUserBalance(100); // 100 grams bonus for linking social network

      addNotification(
        'Успешный вход!',
        `Вы успешно авторизовались через ${PROVIDER_NAMES[profile.provider]}! На ваш счет зачислено +100 Integra бонуса.`,
        'system'
      );

      setIsOpen(false);
    },
    [setUser, updateUserBalance, addNotification]
  );

  // Handle the redirect back from the VK / Yandex OAuth callback (?auth=success|error).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authResult = params.get('auth');
    if (!authResult) return;

    const providerParam = params.get('provider') as Provider | null;
    const providerLabel = providerParam ? PROVIDER_NAMES[providerParam] ?? providerParam : 'соцсеть';

    if (authResult === 'success') {
      fetch('/api/auth/session')
        .then((res) => res.json())
        .then((data: { authenticated: boolean; profile?: OAuthProfile }) => {
          if (data.authenticated && data.profile) {
            applyOAuthProfile(data.profile);
          }
        })
        .catch(() => {
          addNotification('Ошибка входа', `Не удалось получить данные профиля после входа через ${providerLabel}.`, 'system');
        });
    } else {
      const message = params.get('message');
      addNotification(
        'Ошибка входа',
        message ? decodeURIComponent(message) : `Не удалось авторизоваться через ${providerLabel}.`,
        'system'
      );
    }

    params.delete('auth');
    params.delete('provider');
    params.delete('message');
    const cleanedSearch = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (cleanedSearch ? `?${cleanedSearch}` : ''));
    // Only run once on mount — this is a one-time redirect callback check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Inject the official Telegram Login Widget once a bot username is configured.
  useEffect(() => {
    if (!authConfig.telegram.enabled || !authConfig.telegram.botUsername) return;

    window.onTelegramAuth = (tgUser: Record<string, string>) => {
      fetch('/api/auth/telegram/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tgUser),
      })
        .then((res) => res.json())
        .then((data: { ok: boolean; profile?: OAuthProfile; error?: string }) => {
          if (data.ok && data.profile) {
            applyOAuthProfile(data.profile);
          } else {
            addNotification('Ошибка входа', data.error || 'Не удалось авторизоваться через Telegram.', 'system');
          }
        })
        .catch(() => addNotification('Ошибка входа', 'Не удалось связаться с сервером авторизации Telegram.', 'system'));
    };

    const container = document.getElementById('telegram-login-widget-container');
    if (container && container.childElementCount === 0) {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.async = true;
      script.setAttribute('data-telegram-login', authConfig.telegram.botUsername);
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '12');
      script.setAttribute('data-request-access', 'write');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      container.appendChild(script);
    }

    return () => {
      delete window.onTelegramAuth;
    };
  }, [authConfig.telegram.enabled, authConfig.telegram.botUsername, applyOAuthProfile]);

  const isProviderLive = (provider: Provider): boolean =>
    provider === 'vk' ? authConfig.vk : provider === 'yandex' ? authConfig.yandex : authConfig.telegram.enabled;

  const handleAuth = (provider: Provider) => {
    if (provider === 'vk' && authConfig.vk) {
      window.location.href = '/api/auth/vk/start';
      return;
    }
    if (provider === 'yandex' && authConfig.yandex) {
      window.location.href = '/api/auth/yandex/start';
      return;
    }
    if (provider === 'telegram' && authConfig.telegram.enabled) {
      setSelectedProvider('telegram');
      setStep(2);
      return;
    }

    // Demo fallback for providers without configured OAuth credentials.
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

    setUser((prev) => ({
      ...prev,
      authProvider: selectedProvider,
      name: selectedProvider === 'telegram' ? inputVal : prev.name,
      username: selectedProvider === 'telegram' ? inputVal.replace('@', '') : prev.username,
    }));

    updateUserBalance(100); // 100 grams bonus for linking social network

    addNotification(
      'Успешный вход!',
      `Вы успешно авторизовались через ${PROVIDER_NAMES[selectedProvider]}! На ваш счет зачислено +100 Integra бонуса.`,
      'system'
    );

    setIsOpen(false);
  };

  const isTelegramLiveStep = selectedProvider === 'telegram' && authConfig.telegram.enabled;

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
                          <p className="text-sm text-slate-300">{isProviderLive('telegram') ? 'OAuth 2.0 · Рекомендуемый способ' : 'Демо-режим (сервер не настроен)'}</p>
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
                          <p className="text-sm text-slate-300">{isProviderLive('vk') ? 'OAuth 2.0 · Через социальную сеть VK' : 'Демо-режим (сервер не настроен)'}</p>
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
                          <p className="text-sm text-slate-300">{isProviderLive('yandex') ? 'OAuth 2.0 · Единый Яндекс-паспорт' : 'Демо-режим (сервер не настроен)'}</p>
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
                        Мы не запрашиваем ваши пароли. Авторизация происходит по протоколу OAuth 2.0 напрямую с сервером провайдера. При входе дарим 100 Integra!
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
                    <h2 className="text-2xl font-bold text-slate-900 font-display">
                      {isTelegramLiveStep ? 'Войдите через Telegram' : 'Подтвердите данные'}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                      Вы входите через {selectedProvider ? PROVIDER_NAMES[selectedProvider] : ''}
                    </p>
                  </div>

                  {isTelegramLiveStep ? (
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-center py-2" id="telegram-login-widget-container" />
                      <p className="text-center text-xs text-slate-500">
                        Нажмите кнопку выше — Telegram запросит подтверждение входа в мессенджере и вернет ваше имя, никнейм и аватар.
                      </p>
                    </div>
                  ) : (
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
                    </div>
                  )}

                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3 mb-6">
                    <Award className="text-emerald-600 w-7 h-7 shrink-0" />
                    <div>
                      <p className="text-sm text-emerald-800 font-bold">Приветственный бонус гарантирован!</p>
                      <p className="text-xs text-emerald-600 font-mono">+100 Integra будут начислены мгновенно</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 font-bold py-3.5 px-4 rounded-xl transition text-lg cursor-pointer"
                    >
                      Назад
                    </button>
                    {!isTelegramLiveStep && (
                      <button
                        onClick={handleConfirm}
                        className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-sky-500/10 transition text-lg cursor-pointer"
                      >
                        Подтвердить
                      </button>
                    )}
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
