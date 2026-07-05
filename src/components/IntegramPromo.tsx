import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { Code, Smartphone, Rocket, CheckCircle2, Star, Sparkles, Wand2, Terminal, AlertCircle, HelpCircle, ArrowRight, ArrowLeft, Layers, Server, ShieldCheck, Database, RefreshCw } from 'lucide-react';

export const IntegramPromo: React.FC = () => {
  const { updateUserBalance, addNotification } = useApp();
  
  // State for editor
  const [selectedTemplate, setSelectedTemplate] = useState('football');
  const [userPrompt, setUserPrompt] = useState(
    'Создать полнофункциональный футбольный тотализатор. Добавить ставки в игровых токенах Integra, систему дуэлей между болельщиками "1 на 1", автоматическое начисление мемных карточек "Афоня" за ошибки и "Футбольный Оракул" за точные прогнозы.'
  );
  
  // App generation steps
  const [promoState, setPromoState] = useState<'editor' | 'connecting' | 'success'>('editor');
  const [logIndex, setLogIndex] = useState(0);
  const [hasCompletedGuide, setHasCompletedGuide] = useState(false);

  const templates = [
    { id: 'football', label: '⚽️ Футбольный тотализатор', desc: 'Предсказания на матчи ЧМ, Евро и Лиги Чемпионов.' },
    { id: 'esports', label: '🎮 Киберспорт (Dota2 / CS)', desc: 'Тотализатор на турниры Major и The International.' },
    { id: 'basketball', label: '🏀 Баскетбольный кубок', desc: 'Прогнозы на матчи NBA и Евролиги.' },
    { id: 'loyalty', label: '💎 Программа лояльности', desc: 'Кастомные токены, награды для преданных фанатов.' }
  ];

  const backendLogs = [
    { text: '🔌 Подключение к облачному бэкенду Integram... [OK]', type: 'info' },
    { text: '🧠 Инициализация искусственного интеллекта Agent-Driven Development...', type: 'info' },
    { text: `📝 Анализ вашего технического задания и промпта на шаблоне: "${selectedTemplate.toUpperCase()}"...`, type: 'info' },
    { text: '📂 Проектирование реляционной базы данных (таблицы пользователей, ставок, истории дуэлей)... [OK]', type: 'db' },
    { text: '🛡️ Создание ролевой модели прав доступа, интеграции с Telegram Auth API...', type: 'auth' },
    { text: '🖥️ Проектирование адаптивного WebApp интерфейса для десктопа и смартфонов...', type: 'ui' },
    { text: '🤖 Регистрация и запуск Telegram-бота логики уведомлений и реферальных бонусов...', type: 'bot' },
    { text: '📦 Сборка Docker-контейнера и деплой на защищенные сервера Integram Cluster...', type: 'deploy' },
    { text: '🚀 Бэкенд успешно запущен! Балансы, сокеты реального времени и API настроены.', type: 'success' }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (promoState === 'connecting') {
      interval = setInterval(() => {
        setLogIndex((prev) => {
          if (prev < backendLogs.length - 1) {
            return prev + 1;
          } else {
            clearInterval(interval);
            setTimeout(() => {
              setPromoState('success');
              if (!hasCompletedGuide) {
                updateUserBalance(100); // 100 Integra bonus for completing the guide
                addNotification(
                  'Развертывание Integram успешно!',
                  'Ваше новое мини-приложение создано и опубликовано в Telegram! Мы начислили вам стартовые +100 Integra за запуск.',
                  'system'
                );
                setHasCompletedGuide(true);
              }
            }, 1000);
            return prev;
          }
        });
      }, 700);
    }
    return () => clearInterval(interval);
  }, [promoState]);

  const handleStartGeneration = () => {
    if (!userPrompt.trim()) {
      addNotification('Внимание', 'Пожалуйста, заполните поле для ввода промпта, чтобы описать вашу задачу.', 'system');
      return;
    }
    const targetUrl = `https://ideav.ru/?prompt=${encodeURIComponent(userPrompt)}&template=${encodeURIComponent(selectedTemplate)}`;
    window.location.href = targetUrl;
  };

  const handleReset = () => {
    setPromoState('editor');
    setSelectedTemplate('football');
    setUserPrompt(
      'Создать полнофункциональный футбольный тотализатор. Добавить ставки в игровых токенах Integra, систему дуэлей между болельщиками "1 на 1", автоматическое начисление мемных карточек "Афоня" за ошибки и "Футбольный Оракул" за точные прогнозы.'
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Educational Banner - kept sky-blue */}
      <div className="bg-gradient-to-br from-[#0b1c3c] via-[#09152b] to-[#060a17] border-2 border-sky-500/30 text-slate-100 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 text-9xl opacity-10 pointer-events-none select-none">🛠️</div>
        <div className="max-w-3xl space-y-3">
          <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Архитектор Integram
          </span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight font-display text-white">
            Интерактивный архитектор веб-приложений Integram AI приветствует Вас!
          </h2>
          <p className="text-md text-slate-300 leading-relaxed">
            Этот тотализатор собран на визуальном архитекторе <strong className="text-sky-300">Integram</strong>. Хотите точно так же запустить свою игру под любой спорт или корпоративное событие? Попробуйте наш быстрый пример прямо сейчас! <strong className="text-amber-300 block mt-2 text-xs uppercase tracking-wider">💡 Обратите внимание: все внешние интеграции и автоматические синхронизации данных можно будет доработать на следующих этапах проекта.</strong>
          </p>
        </div>
      </div>

      {/* Main Grid: Interactive Form vs Marketing Why-Integram */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 text-slate-800">
        
        {/* INTERACTIVE PLAYGROUND (2 cols) */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between space-y-6">
          
          <AnimatePresence mode="wait">
            {promoState === 'editor' && (
              <motion.div
                key="editor"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="border-b border-slate-150 pb-4">
                  <h3 className="text-xl md:text-2xl font-black text-slate-850 flex items-center gap-2 font-display">
                    <span>⚡️</span> Интерактивная Песочница
                  </h3>
                  <p className="text-sm text-slate-555">Создайте приложение в 1 клик и получите <strong className="text-amber-500 font-extrabold">+100 Integra</strong> на ваш внутренний баланс!</p>
                </div>

                {/* Important item 1: Template selection */}
                <div className="space-y-3">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">
                    Шаг 1: Выберите шаблон веб-приложения
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTemplate(t.id)}
                        className={`text-left p-4 rounded-2xl border transition flex flex-col justify-between cursor-pointer text-sm ${
                          selectedTemplate === t.id
                            ? 'border-sky-500 bg-sky-50/50 shadow-sm text-sky-850'
                            : 'border-slate-200 bg-slate-50 hover:border-slate-350 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <p className="font-extrabold text-slate-850 text-md">{t.label}</p>
                          <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
                            selectedTemplate === t.id ? 'border-sky-500 bg-sky-500 text-white font-black' : 'border-slate-300 bg-white'
                          }`}>
                            {selectedTemplate === t.id && '✓'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-550 leading-normal">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Important item 2: Prompt input field */}
                <div className="space-y-3">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    Шаг 2: Напишите промпт (Опишите уникальные задачи) <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                  </label>
                  <textarea
                    rows={4}
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    placeholder="Опишите, какие функции вам нужны (базы данных, интеграции, роли, внешний вид)..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-semibold text-slate-800 focus:border-sky-500 focus:bg-white outline-none transition duration-200 resize-none shadow-inner"
                  />
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>ИИ-агент Integram автоматически спроектирует базу данных, API и интерфейс на основе вашего описания.</span>
                  </div>
                </div>

                {/* Call to action text block */}
                <div className="bg-sky-50/60 border border-sky-100 rounded-2xl p-4 text-slate-700 text-xs sm:text-sm leading-relaxed space-y-1">
                  <p className="font-bold text-sky-900 flex items-center gap-1.5">
                    <span>🚀</span> Готовы запустить свой проект?
                  </p>
                  <p className="text-slate-600 font-medium">
                    Начните бесплатно, выберите шаблон или опишите уникальные задачи, которые хотите решить, и нажмите <strong className="text-sky-700">"Продолжить"</strong>.
                  </p>
                </div>

                {/* Action Button */}
                <div className="pt-4 border-t border-slate-150">
                  <button
                    onClick={handleStartGeneration}
                    className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-black py-4 px-6 rounded-xl shadow-lg shadow-sky-500/10 transition text-md md:text-lg cursor-pointer flex items-center justify-center gap-2"
                  >
                    Продолжить в Интеграм <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {promoState === 'connecting' && (
              <motion.div
                key="connecting"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 py-4 flex flex-col justify-between"
              >
                <div className="text-center space-y-2">
                  <div className="inline-block p-3 bg-sky-50 border border-sky-100 rounded-2xl">
                    <RefreshCw className="w-8 h-8 text-sky-600 animate-spin" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 font-display">Подключение бэкенда Integram...</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    ИИ-агент разработки проектирует базу данных, настраивает роли и развертывает контейнеры на серверах.
                  </p>
                </div>

                {/* Real-time compilation logs simulating connection and generation */}
                <div className="bg-slate-900 text-slate-200 p-5 rounded-2xl font-mono text-xs space-y-2.5 shadow-lg border border-slate-800 max-h-[260px] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <span>📡 Integram Cloud Console Logs</span>
                    <span className="text-emerald-500 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {backendLogs.slice(0, logIndex + 1).map((log, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-2 leading-relaxed"
                      >
                        <span className="text-slate-500">[{idx + 1}]</span>
                        <span className={idx === logIndex ? "text-sky-300 font-bold" : "text-slate-300"}>
                          {log.text}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-100 flex items-center gap-3">
                  <Server className="w-5 h-5 text-sky-600 shrink-0" />
                  <p className="text-xs text-sky-800 font-medium">
                    Осталось совсем немного. Полный цикл Agent-Driven сборки завершается автоматически.
                  </p>
                </div>
              </motion.div>
            )}

            {promoState === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-5"
              >
                <div className="text-6xl text-center select-none animate-bounce">🎉</div>
                <h4 className="text-2xl font-black text-emerald-600 font-display">Приложение успешно запущено в Telegram!</h4>
                <p className="text-slate-600 text-md max-w-lg mx-auto font-medium">
                  Вы успешно смоделировали запуск своего проекта. Бэкенд Integram настроил реляционную базу данных и сгенерировал интерфейс.
                </p>

                {/* Success metrics */}
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-2">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 text-center">
                    <Database className="w-5 h-5 text-sky-600 mx-auto mb-1" />
                    <p className="text-[10px] text-slate-400 font-bold uppercase">База данных</p>
                    <p className="text-sm font-extrabold text-slate-800">Полноценная SQL</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 text-center">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Авторизация</p>
                    <p className="text-sm font-extrabold text-slate-800">Telegram OAuth</p>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-850 text-sm max-w-md mx-auto font-bold flex items-center justify-center gap-2">
                  <span>💎</span>
                  <span>Вам зачислено +100 Integra на внутренний баланс!</span>
                </div>

                <div className="pt-4 flex gap-3 max-w-md mx-auto">
                  <button
                    onClick={handleReset}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 font-black py-3 rounded-xl text-sm transition cursor-pointer"
                  >
                    Создать еще один проект
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* MARKETING SIDE PANEL: "ABOUT INTEGRAM" (1 col) */}
        <div className="space-y-6">
          
          {/* Why Integram core content */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="font-black text-slate-850 text-xl flex items-center gap-2 font-display">
              <span>💡</span> Почему Integram?
            </h4>
            
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-semibold bg-slate-50 p-4 rounded-2xl border border-slate-150">
              Это первая в мире система <strong>Agent-Driven Development</strong> (работает полностью самостоятельно на полном цикле разработки). Бизнес-приложения создает агент, а вы только пишете ему, какие функции вам нужны. Логика и задачи от вас, проектирование интерфейса, базы данных, ролей, интеграций с сервисами авторизации и данных и доступов — на стороне Integram.
            </p>

            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex gap-3 items-start">
                <span className="p-2 bg-slate-100 border border-slate-200 text-sky-600 rounded-xl font-bold">🚀</span>
                <div>
                  <p className="font-extrabold text-slate-800 text-md">Без программирования</p>
                  <p className="text-xs text-slate-550 leading-normal">
                    Полный цикл генерации: от таблиц и индексов в СУБД до верстки и сокетов уведомлений.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <span className="p-2 bg-slate-100 border border-slate-200 text-blue-600 rounded-xl font-bold">💬</span>
                <div>
                  <p className="font-extrabold text-slate-800 text-md">Мгновенные уведомления</p>
                  <p className="text-xs text-slate-550 leading-normal">
                    Полная интеграция с рассылками и Email. Оповещайте ваших участников о любых действиях мгновенно.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing promotion */}
          <div className="bg-slate-100 border border-slate-250 rounded-3xl p-6 text-center space-y-4">
            <span className="text-5xl select-none">⭐️</span>
            <div className="space-y-1">
              <h4 className="font-black text-slate-800 text-lg font-display">Готовы запустить свой проект?</h4>
              <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                Начните бесплатно! Зарегистрируйтесь в Integram, выберите шаблон или опишите ваши уникальные бизнес-задачи ИИ-разработчику.
              </p>
            </div>
            <a 
              href="https://integram.ru" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block bg-slate-800 hover:bg-slate-900 text-white font-extrabold py-3 px-6 rounded-xl transition text-md shadow-lg shadow-slate-800/10 border border-slate-750"
            >
              Перейти на Integram.ru
            </a>
          </div>

        </div>
      </div>
    </div>
  );
};
