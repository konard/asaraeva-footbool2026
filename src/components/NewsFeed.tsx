import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Share2, Plus, AlertCircle, Sparkles, Send, Award, Search, HelpCircle } from 'lucide-react';
import { NewsPost } from '../types';

export const NewsFeed: React.FC = () => {
  const { newsPosts, addNewsPost, likeNewsPost, dislikeNewsPost, shareNewsPost, user } = useApp();
  const [activeFilter, setActiveFilter] = useState<'all' | 'news' | 'insight' | 'outrage'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'news' | 'insight' | 'outrage'>('news');

  // Share dropdown state
  const [activeShareId, setActiveShareId] = useState<string | null>(null);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    addNewsPost(title, content, category);
    
    // Reset form
    setTitle('');
    setContent('');
    setCategory('news');
    setShowCreateModal(false);
  };

  const handleShareClick = (postId: string, platform: 'telegram' | 'vk' | 'yandex') => {
    shareNewsPost(postId, platform);
    setActiveShareId(null);

    const shareUrl = encodeURIComponent('https://ideav.ru');
    const shareText = encodeURIComponent(`Читайте интересную публикацию в Интеграм FC: "${newsPosts.find(p => p.id === postId)?.title}"!`);

    let finalUrl = '';
    if (platform === 'telegram') {
      finalUrl = `https://t.me/share/url?url=${shareUrl}&text=${shareText}`;
    } else if (platform === 'vk') {
      finalUrl = `https://vk.com/share.php?url=${shareUrl}&title=${shareText}`;
    } else {
      finalUrl = `mailto:?subject=${shareText}&body=${shareUrl}`;
    }

    window.open(finalUrl, '_blank');
  };

  const filteredPosts = newsPosts
    .filter(post => activeFilter === 'all' || post.category === activeFilter)
    .filter(post => 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.authorName.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getCategoryDetails = (cat: 'news' | 'insight' | 'outrage') => {
    switch (cat) {
      case 'news':
        return {
          label: 'Новость',
          emoji: '📢',
          colorClass: 'bg-blue-50 text-blue-800 border-blue-200',
          gradientClass: 'from-blue-500 to-sky-400'
        };
      case 'insight':
        return {
          label: 'Инсайт',
          emoji: '💡',
          colorClass: 'bg-amber-50 text-amber-800 border-amber-200',
          gradientClass: 'from-amber-500 to-yellow-400'
        };
      case 'outrage':
        return {
          label: 'Негодование',
          emoji: '🤬',
          colorClass: 'bg-rose-50 text-rose-800 border-rose-200',
          gradientClass: 'from-rose-500 to-orange-400'
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner explaining Rules & Rewards */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-10 font-black text-9xl">FC</div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-yellow-300" /> Активность и Награды
            </div>
            <h1 className="text-2xl md:text-3xl font-black font-display tracking-tight leading-tight">
              Футбольная Лента Интеграм FC
            </h1>
            <p className="text-sm text-emerald-50/90 font-medium">
              Делитесь горячими инсайдами из раздевалок, официальными новостями или высказывайте свое искреннее негодование по судейским решениям! 
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs font-bold text-emerald-100">
              <div className="flex items-center gap-2 bg-emerald-700/30 p-2 rounded-xl border border-emerald-500/20">
                <span className="text-lg">📢</span>
                <span>Публикация поста: <span className="text-yellow-300 font-extrabold">+100 Integra</span></span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-700/30 p-2 rounded-xl border border-emerald-500/20">
                <span className="text-lg">🎁</span>
                <span>Репост в соцсеть: <span className="text-yellow-300 font-extrabold">+150 Integra за каждый</span></span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="self-start md:self-center bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black px-6 py-3.5 rounded-2xl flex items-center gap-2 transition cursor-pointer shrink-0 shadow-lg shadow-yellow-500/20"
          >
            <Plus className="w-5 h-5" /> Опубликовать пост
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white border border-slate-200 p-3 rounded-2xl shadow-sm">
        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Все подряд
          </button>
          <button
            onClick={() => setActiveFilter('news')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1 ${
              activeFilter === 'news'
                ? 'bg-blue-600 text-white'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <span>📢</span> Новости
          </button>
          <button
            onClick={() => setActiveFilter('insight')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1 ${
              activeFilter === 'insight'
                ? 'bg-amber-500 text-white'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <span>💡</span> Инсайты
          </button>
          <button
            onClick={() => setActiveFilter('outrage')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1 ${
              activeFilter === 'outrage'
                ? 'bg-rose-600 text-white'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <span>🤬</span> Негодования
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по ленте..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 outline-none rounded-xl py-2 pl-9 pr-3 text-xs font-medium text-slate-800"
          />
        </div>
      </div>

      {/* News Feed List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => {
              const catDetails = getCategoryDetails(post.category);
              return (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:border-slate-300 transition space-y-4"
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xl shadow-2xs">
                        {post.authorAvatar || '👤'}
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-slate-850 flex items-center gap-1.5">
                          {post.authorName}
                          {post.authorUsername === user.username && (
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md border">Вы</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">@{post.authorUsername} • {post.timestamp}</div>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border ${catDetails.colorClass}`}>
                      <span>{catDetails.emoji}</span> {catDetails.label}
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="space-y-2">
                    <h3 className="font-black text-slate-800 text-lg leading-snug font-display">
                      {post.title}
                    </h3>
                    <p className="text-slate-650 text-sm font-medium leading-relaxed font-sans whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </div>

                  {/* Card Footer actions */}
                  <div className="pt-3.5 border-t border-slate-150 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Likes */}
                      <button
                        onClick={() => likeNewsPost(post.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          post.isLikedByUser
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${post.isLikedByUser ? 'fill-emerald-600' : ''}`} />
                        <span>{post.likes}</span>
                      </button>

                      {/* Dislikes */}
                      <button
                        onClick={() => dislikeNewsPost(post.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          post.isDislikedByUser
                            ? 'bg-rose-50 border-rose-300 text-rose-800'
                            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <ThumbsDown className={`w-3.5 h-3.5 ${post.isDislikedByUser ? 'fill-rose-600' : ''}`} />
                        <span>{post.dislikes}</span>
                      </button>
                    </div>

                    {/* Share / Repost with Bonus Label */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveShareId(activeShareId === post.id ? null : post.id)}
                        className="bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Репост (+150 Integra) 🎁</span>
                        {post.repostsCount !== undefined && post.repostsCount > 0 && (
                          <span className="bg-emerald-600 text-white rounded-full px-1.5 py-0.5 text-[9px] font-mono">{post.repostsCount}</span>
                        )}
                      </button>

                      <AnimatePresence>
                        {activeShareId === post.id && (
                          <>
                            <div className="fixed inset-0 z-25" onClick={() => setActiveShareId(null)} />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 5 }}
                              className="absolute right-0 bottom-full mb-2 bg-white border border-slate-200 rounded-2xl p-2.5 shadow-xl w-56 z-30 space-y-1"
                            >
                              <div className="text-[9px] font-black uppercase text-slate-400 px-2 pb-1 border-b mb-1">Куда опубликовать?</div>
                              <button
                                onClick={() => handleShareClick(post.id, 'telegram')}
                                className="w-full text-left font-semibold text-xs text-slate-700 hover:bg-sky-50 hover:text-sky-800 p-2 rounded-xl flex items-center gap-2 cursor-pointer transition"
                              >
                                <span>✈️</span> Telegram (+150 Integra)
                              </button>
                              <button
                                onClick={() => handleShareClick(post.id, 'vk')}
                                className="w-full text-left font-semibold text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-800 p-2 rounded-xl flex items-center gap-2 cursor-pointer transition"
                              >
                                <span>💙</span> ВКонтакте (+150 Integra)
                              </button>
                              <button
                                onClick={() => handleShareClick(post.id, 'yandex')}
                                className="w-full text-left font-semibold text-xs text-slate-700 hover:bg-rose-50 hover:text-rose-800 p-2 rounded-xl flex items-center gap-2 cursor-pointer transition"
                              >
                                <span>📧</span> Email / Яндекс (+150 Integra)
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center text-slate-400 space-y-3">
              <span className="text-4xl">📭</span>
              <p className="font-semibold text-sm">Ничего не найдено по данному запросу.</p>
              <button
                onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}
                className="text-xs text-sky-500 font-extrabold underline hover:text-sky-600 cursor-pointer"
              >
                Сбросить фильтры
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Posting Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-xl shadow-2xl relative space-y-4 text-slate-850"
            >
              <div className="flex justify-between items-center pb-2 border-b">
                <h2 className="font-black text-xl text-slate-800 font-display flex items-center gap-2">
                  <span>✍️</span> Новая публикация
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-700 font-black text-xl cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Reward Notification Banner inside modal */}
              <div className="bg-yellow-50 border border-yellow-200 p-3.5 rounded-2xl flex gap-2 items-center text-xs text-yellow-800 font-extrabold">
                <Award className="w-5 h-5 text-yellow-600 animate-bounce shrink-0" />
                <span>
                  За публикацию вы моментально получите <span className="underline">+100 Integra</span> к вашему балансу!
                </span>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Тип публикации</label>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setCategory('news')}
                      className={`py-2 px-1.5 rounded-xl font-bold text-xs text-center transition cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
                        category === 'news'
                          ? 'bg-white text-blue-800 shadow-xs border border-blue-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>📢</span> <span>Новость</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategory('insight')}
                      className={`py-2 px-1.5 rounded-xl font-bold text-xs text-center transition cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
                        category === 'insight'
                          ? 'bg-white text-amber-800 shadow-xs border border-amber-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>💡</span> <span>Инсайт</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategory('outrage')}
                      className={`py-2 px-1.5 rounded-xl font-bold text-xs text-center transition cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
                        category === 'outrage'
                          ? 'bg-white text-rose-800 shadow-xs border border-rose-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>🤬</span> <span>Негодование</span>
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Заголовок</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Придумайте звучный заголовок вашей публикации..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 outline-none rounded-xl p-3 text-sm font-semibold text-slate-800"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Текст публикации</label>
                  <textarea
                    required
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Опишите подробности новости, инсайда или вашего негодования..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 outline-none rounded-xl p-3 text-sm font-medium text-slate-800"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 px-4 rounded-xl text-sm border cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-xl text-sm cursor-pointer shadow-md shadow-sky-500/10 flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-4 h-4" /> Опубликовать (+100 Integra)
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
