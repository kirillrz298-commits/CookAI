import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Star, Lock, ChefHat, Award } from 'lucide-react';
import type { Badge, UserStreak } from '../types';

interface AchievementsProps {
  streak: UserStreak;
  badges: Badge[];
  totalRecipes: number;
}

// Full badge catalog
const BADGE_CATALOG: Omit<Badge, 'earnedAt' | 'unlocked'>[] = [
  { id: 'first_cook', type: 'first_cook', title: 'Первые шаги', description: 'Приготовил первый рецепт', icon: '🍳' },
  { id: 'cook_5', type: 'cook_5', title: 'Начинающий кулинар', description: 'Приготовил 5 рецептов', icon: '👨‍🍳' },
  { id: 'cook_10', type: 'cook_10', title: 'Опытный повар', description: 'Приготовил 10 рецептов', icon: '🍽' },
  { id: 'cook_25', type: 'cook_25', title: 'Шеф-повар', description: 'Приготовил 25 рецептов', icon: '⭐' },
  { id: 'cook_50', type: 'cook_50', title: 'Мастер кухни', description: 'Приготовил 50 рецептов', icon: '🏆' },
  { id: 'streak_3', type: 'streak_3', title: 'На волне', description: 'Готовил 3 дня подряд', icon: '🔥' },
  { id: 'streak_7', type: 'streak_7', title: 'Неделя готовки', description: 'Готовил 7 дней подряд', icon: '🔥🔥' },
  { id: 'streak_30', type: 'streak_30', title: 'Месяц кулинара', description: 'Готовил 30 дней подряд', icon: '💎' },
  { id: 'first_comment', type: 'first_comment', title: 'Первый отзыв', description: 'Оставил первый комментарий', icon: '💬' },
  { id: 'first_favorite', type: 'first_favorite', title: 'Гурман', description: 'Добавил рецепт в избранное', icon: '❤️' },
  { id: 'explorer', type: 'explorer', title: 'Исследователь', description: 'Просмотрел 20 рецептов', icon: '🧭' },
  { id: 'ai_user', type: 'ai_user', title: 'Друг ИИ', description: 'Пообщался с AI-шефом', icon: '🤖' },
  { id: 'planner', type: 'planner', title: 'Стратег меню', description: 'Составил план питания на неделю', icon: '📅' },
  { id: 'shopper', type: 'shopper', title: 'Запасливый', description: 'Создал список покупок', icon: '🛒' },
  { id: 'creator', type: 'creator', title: 'Автор рецепта', description: 'Создал свой рецепт', icon: '✍️' },
];

export const AchievementsPanel: React.FC<AchievementsProps> = ({ streak, badges, totalRecipes }) => {
  const [tab, setTab] = useState<'badges' | 'streak'>('badges');

  const earnedIds = new Set(badges.map(b => b.type));

  const allBadges: Badge[] = BADGE_CATALOG.map(b => ({
    ...b,
    unlocked: earnedIds.has(b.type),
    earnedAt: badges.find(eb => eb.type === b.type)?.earnedAt,
  }));

  const unlocked = allBadges.filter(b => b.unlocked);
  const locked = allBadges.filter(b => !b.unlocked);

  // Streak color
  const streakColor = streak.currentStreak >= 30 ? 'text-purple-400'
    : streak.currentStreak >= 7 ? 'text-orange-400'
    : streak.currentStreak >= 3 ? 'text-yellow-400'
    : 'text-slate-400';

  return (
    <div className="space-y-6">
      {/* Streak hero card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-transparent border border-orange-500/20 p-6"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame className={`w-6 h-6 ${streakColor}`} />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Серия готовки</span>
            </div>
            <div className={`text-6xl font-black ${streakColor}`}>
              {streak.currentStreak}
            </div>
            <p className="text-sm text-slate-400 mt-1">
              {streak.currentStreak === 0 ? 'Начни готовить сегодня!' : `${streak.currentStreak} дн. подряд`}
            </p>
          </div>
          <div className="text-right space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Рекорд</p>
              <p className="text-2xl font-black text-slate-300">{streak.maxStreak} дн.</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Всего приготовлено</p>
              <p className="text-2xl font-black text-brand-orange">{streak.totalCooked}</p>
            </div>
          </div>
        </div>

        {/* Streak milestone markers */}
        <div className="relative mt-6">
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((streak.currentStreak / 30) * 100, 100)}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-500 font-bold mt-1">
            <span>3 🔥</span><span>7 🔥🔥</span><span>14 ⭐</span><span>30 💎</span>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <Trophy className="w-4 h-4" />, label: 'Бейджей', value: unlocked.length, color: 'text-yellow-400' },
          { icon: <ChefHat className="w-4 h-4" />, label: 'Готовил', value: totalRecipes, color: 'text-brand-orange' },
          { icon: <Star className="w-4 h-4" />, label: 'Рекорд серии', value: `${streak.maxStreak}д`, color: 'text-purple-400' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass-effect rounded-2xl p-3 text-center border border-white/5"
          >
            <div className={`flex justify-center mb-1 ${stat.color}`}>{stat.icon}</div>
            <div className={`font-black text-xl ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] text-slate-500 font-semibold">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Badges tabs */}
      <div>
        <div className="flex gap-4 border-b border-slate-700/50 mb-4">
          <button
            onClick={() => setTab('badges')}
            className={`pb-2 text-sm font-bold transition-colors ${tab === 'badges' ? 'text-brand-orange border-b-2 border-brand-orange' : 'text-slate-500 hover:text-slate-300'}`}
          >
            🏆 Полученные ({unlocked.length})
          </button>
          <button
            onClick={() => setTab('streak')}
            className={`pb-2 text-sm font-bold transition-colors ${tab === 'streak' ? 'text-brand-orange border-b-2 border-brand-orange' : 'text-slate-500 hover:text-slate-300'}`}
          >
            🔒 Заблокированные ({locked.length})
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <AnimatePresence mode="wait">
            {(tab === 'badges' ? unlocked : locked).map((badge, i) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: i * 0.04 }}
                className={`relative rounded-2xl p-4 text-center border transition-all ${
                  badge.unlocked
                    ? 'bg-gradient-to-b from-amber-500/10 to-transparent border-amber-500/20 hover:border-amber-500/40'
                    : 'bg-slate-800/30 border-slate-700/30 opacity-50 grayscale'
                }`}
              >
                {!badge.unlocked && (
                  <Lock className="absolute top-2 right-2 w-3 h-3 text-slate-600" />
                )}
                <div className="text-3xl mb-2">{badge.icon}</div>
                <div className="text-xs font-bold text-white mb-0.5">{badge.title}</div>
                <div className="text-[10px] text-slate-400 leading-snug">{badge.description}</div>
                {badge.earnedAt && (
                  <div className="text-[9px] text-amber-500/70 mt-1">{badge.earnedAt}</div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {tab === 'badges' && unlocked.length === 0 && (
          <div className="text-center py-10 text-slate-500">
            <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Пока нет достижений</p>
            <p className="text-sm mt-1">Начни готовить, чтобы получить первый бейдж!</p>
          </div>
        )}
      </div>
    </div>
  );
};
