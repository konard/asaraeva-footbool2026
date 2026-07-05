/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppProvider, useApp } from './context/AppContext';
import { Navigation } from './components/Navigation';
import { AuthModal } from './components/AuthModal';
import { MatchesList } from './components/MatchesList';
import { ResultsSection } from './components/ResultsSection';
import { DuelSection } from './components/DuelSection';
import { NewsFeed } from './components/NewsFeed';
import { Leaderboard } from './components/Leaderboard';
import { Profile } from './components/Profile';
import { IntegramDbSection } from './components/IntegramDbSection';
import { AdminPanel } from './components/AdminPanel';
import { ThreeDBall } from './components/ThreeDBall';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, BarChart3, HelpCircle } from 'lucide-react';

function AppContent() {
  const { activeTab, setActiveTab, isBallRolling } = useApp();

  return (
    <div className="min-h-screen bg-sky-100 text-slate-800 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Global simulated push notification indicator */}
      <Navigation />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-8">
        
        {/* Telegram/VK/Yandex simulated Auth container */}
        <AuthModal />

        {/* Dynamic Tab Switcher */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {activeTab === 'matches' && (
              <motion.div
                key="matches"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <MatchesList />
              </motion.div>
            )}

            {activeTab === 'results' && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <ResultsSection />
              </motion.div>
            )}

            {activeTab === 'duels' && (
              <motion.div
                key="duels"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <DuelSection />
              </motion.div>
            )}

            {activeTab === 'news' && (
              <motion.div
                key="news"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <NewsFeed />
              </motion.div>
            )}

            {activeTab === 'leaderboard' && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <Leaderboard />
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <Profile />
              </motion.div>
            )}

            {activeTab === 'integram' && (
              <motion.div
                key="integram"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <IntegramDbSection />
              </motion.div>
            )}

            {activeTab === 'admin' && (
              <motion.div
                key="admin"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <AdminPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Persistent bottom shortcut for Admin Panel */}
        <div className="pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm font-semibold">
          <p>© 2026 «Интеграм FC». Тотализатор и прогнозы для преданных болельщиков.</p>
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-xs transition cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-rose-100 border-rose-300 text-rose-700 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-sm'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Панель управления (Симулятор)
            </button>
          </div>
        </div>
      </main>

      {/* Volumetric rolling ball animation overlay */}
      <AnimatePresence>
        {isBallRolling && (
          <motion.div
            initial={{ left: '-120px', rotate: 0, bottom: '15%' }}
            animate={{ 
              left: '105%', 
              rotate: 1440,
              y: [0, -40, 0, -20, 0, -8, 0, -2, 0] // High quality bouncing animation
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              left: { duration: 3.8, ease: "linear" },
              rotate: { duration: 3.8, ease: "linear" },
              y: { duration: 3.8, ease: "easeOut" }
            }}
            className="fixed z-50 pointer-events-none"
            style={{ width: '80px', height: '80px' }}
          >
            <ThreeDBall className="w-20 h-20 filter drop-shadow-[0_12px_10px_rgba(0,0,0,0.35)]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

