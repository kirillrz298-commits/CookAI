import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Plus, X, TrendingUp } from 'lucide-react';
import type { CalorieLogEntry, DailyCalories, Recipe } from '../types';
import { getRecipeImage } from '../utils/recipeImage';

interface CalorieDashboardProps {
  todayLog: DailyCalories;
  weekLogs: DailyCalories[];
  allRecipes: Recipe[];
  calorieGoal: number;
  onAddEntry: (entry: Omit<CalorieLogEntry, 'id' | 'addedAt'>) => void;
  onRemoveEntry: (id: string) => void;
  onSetGoal: (goal: number) => void;
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: '🌅 Завтрак',
  lunch: '☀️ Обед',
  dinner: '🌙 Ужин',
  snack: '🍎 Перекус',
};

export const CalorieDashboard: React.FC<CalorieDashboardProps> = ({
  todayLog, weekLogs, allRecipes, calorieGoal, onAddEntry, onRemoveEntry, onSetGoal
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [servings, setServings] = useState(1);
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [searchQuery, setSearchQuery] = useState('');
  const [editGoal, setEditGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(calorieGoal));

  const totalCal = todayLog.totalCalories;
  const progressPct = Math.min((totalCal / calorieGoal) * 100, 100);
  const remaining = Math.max(calorieGoal - totalCal, 0);

  const filteredRecipes = allRecipes.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 20);

  const handleAdd = () => {
    if (!selectedRecipeId) return;
    const recipe = allRecipes.find(r => r.id === selectedRecipeId);
    if (!recipe) return;

    const today = new Date().toISOString().split('T')[0];
    onAddEntry({
      date: today,
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      servings,
      calories: Math.round(recipe.calories * servings),
      macros: {
        protein: Math.round(recipe.macros.protein * servings),
        fat: Math.round(recipe.macros.fat * servings),
        carbs: Math.round(recipe.macros.carbs * servings),
      },
      mealType,
    });
    setShowAddModal(false);
    setSelectedRecipeId('');
    setServings(1);
  };

  // Week chart data
  const maxCalInWeek = Math.max(...weekLogs.map(d => d.totalCalories), calorieGoal, 1);

  const macroTotal = todayLog.totalMacros.protein + todayLog.totalMacros.fat + todayLog.totalMacros.carbs || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-black text-2xl tracking-tight">📊 Дневник калорий</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-orange text-white text-sm font-bold hover:bg-brand-orange/90 transition-colors shadow-lg shadow-brand-orange/20"
        >
          <Plus className="w-4 h-4" />
          Добавить
        </button>
      </div>

      {/* Main calorie ring */}
      <div className="glass-effect rounded-3xl border border-white/5 p-6">
        <div className="flex items-center gap-6">
          {/* SVG Ring */}
          <div className="relative w-28 h-28 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(30,41,59)" strokeWidth="10" />
              <motion.circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke={progressPct >= 100 ? '#ef4444' : '#f97316'}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - progressPct / 100) }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-white">{totalCal}</span>
              <span className="text-[9px] text-slate-400 font-bold">ккал</span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-bold text-slate-400">Прогресс</span>
                <span className="text-xs font-bold text-brand-orange">{Math.round(progressPct)}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${progressPct >= 100 ? 'bg-red-500' : 'bg-gradient-to-r from-brand-orange to-amber-400'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800/50 rounded-xl p-2">
                <p className="text-slate-500 font-bold">Цель</p>
                {editGoal ? (
                  <div className="flex gap-1 mt-0.5">
                    <input
                      type="number"
                      value={goalInput}
                      onChange={e => setGoalInput(e.target.value)}
                      className="w-16 bg-slate-700 rounded px-1 text-white text-xs"
                      onBlur={() => { onSetGoal(Number(goalInput)); setEditGoal(false); }}
                      autoFocus
                    />
                  </div>
                ) : (
                  <button onClick={() => setEditGoal(true)} className="font-black text-white hover:text-brand-orange transition-colors">
                    {calorieGoal} ккал
                  </button>
                )}
              </div>
              <div className="bg-slate-800/50 rounded-xl p-2">
                <p className="text-slate-500 font-bold">Осталось</p>
                <p className={`font-black ${remaining === 0 ? 'text-red-400' : 'text-green-400'}`}>{remaining} ккал</p>
              </div>
            </div>
          </div>
        </div>

        {/* Macro breakdown */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: 'Белки', value: todayLog.totalMacros.protein, pct: Math.round((todayLog.totalMacros.protein / macroTotal) * 100), color: '#3b82f6' },
            { label: 'Жиры', value: todayLog.totalMacros.fat, pct: Math.round((todayLog.totalMacros.fat / macroTotal) * 100), color: '#eab308' },
            { label: 'Углеводы', value: todayLog.totalMacros.carbs, pct: Math.round((todayLog.totalMacros.carbs / macroTotal) * 100), color: '#22c55e' },
          ].map(m => (
            <div key={m.label} className="text-center">
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-1">
                <div className="h-full rounded-full" style={{ width: `${m.pct}%`, backgroundColor: m.color }} />
              </div>
              <p className="text-xs font-bold text-white">{m.value}г</p>
              <p className="text-[9px] text-slate-500">{m.label} {m.pct}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Week chart */}
      <div className="glass-effect rounded-2xl border border-white/5 p-4">
        <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          За неделю
        </p>
        <div className="flex items-end gap-2 h-20">
          {weekLogs.map((day, i) => {
            const barH = Math.max((day.totalCalories / maxCalInWeek) * 100, 4);
            const isToday = day.date === new Date().toISOString().split('T')[0];
            const overGoal = day.totalCalories > calorieGoal;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: '64px' }}>
                  <motion.div
                    className={`w-full rounded-t-lg ${overGoal ? 'bg-red-500/70' : isToday ? 'bg-brand-orange' : 'bg-slate-600'}`}
                    initial={{ height: 0 }}
                    animate={{ height: `${barH}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05 }}
                  />
                </div>
                <span className={`text-[9px] font-bold ${isToday ? 'text-brand-orange' : 'text-slate-500'}`}>
                  {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'][i] ?? '-'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's entries by meal */}
      {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(mealKey => {
        const entries = todayLog.entries.filter(e => e.mealType === mealKey);
        if (entries.length === 0) return null;
        const mealCal = entries.reduce((s, e) => s + e.calories, 0);
        return (
          <div key={mealKey}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-300">{MEAL_TYPE_LABELS[mealKey]}</span>
              <span className="text-xs font-bold text-brand-orange">{mealCal} ккал</span>
            </div>
            <div className="space-y-2">
              {entries.map(entry => (
                <div key={entry.id} className="flex items-center gap-3 p-3 glass-effect rounded-xl border border-white/5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white line-clamp-1">{entry.recipeTitle}</p>
                    <p className="text-xs text-slate-400">{entry.servings} порц. · Б:{entry.macros.protein}г Ж:{entry.macros.fat}г У:{entry.macros.carbs}г</p>
                  </div>
                  <span className="text-sm font-bold text-brand-orange">{entry.calories} ккал</span>
                  <button
                    onClick={() => onRemoveEntry(entry.id)}
                    className="p-1 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {todayLog.entries.length === 0 && (
        <div className="text-center py-10 text-slate-500">
          <Flame className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Сегодня ничего не добавлено</p>
          <p className="text-sm mt-1">Нажми «Добавить» чтобы отследить приём пищи</p>
        </div>
      )}

      {/* Add entry modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center"
            onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full max-w-lg bg-slate-900 rounded-t-3xl border-t border-slate-700/50 p-6 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-lg">Добавить приём пищи</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setMealType(t)}
                    className={`py-2 rounded-xl text-sm font-bold transition-all border ${mealType === t ? 'bg-brand-orange text-white border-brand-orange' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
                  >
                    {MEAL_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Поиск рецепта..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange"
              />

              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {filteredRecipes.map(recipe => (
                  <button
                    key={recipe.id}
                    onClick={() => setSelectedRecipeId(recipe.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all border ${
                      selectedRecipeId === recipe.id ? 'border-brand-orange bg-brand-orange/10' : 'border-transparent hover:bg-slate-800'
                    }`}
                  >
                    <img src={getRecipeImage(recipe.title, recipe.category, recipe.image)} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white line-clamp-1">{recipe.title}</p>
                      <p className="text-xs text-slate-400">{recipe.calories} ккал/порц.</p>
                    </div>
                  </button>
                ))}
              </div>

              {selectedRecipeId && (
                <div className="flex items-center gap-3">
                  <label className="text-sm text-slate-400 font-semibold whitespace-nowrap">Порций:</label>
                  <input
                    type="number"
                    value={servings}
                    onChange={e => setServings(Number(e.target.value))}
                    min={0.5}
                    step={0.5}
                    max={10}
                    className="w-20 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange"
                  />
                  <span className="text-brand-orange font-bold text-sm">
                    = {Math.round((allRecipes.find(r => r.id === selectedRecipeId)?.calories || 0) * servings)} ккал
                  </span>
                </div>
              )}

              <button
                onClick={handleAdd}
                disabled={!selectedRecipeId}
                className="w-full py-3 rounded-2xl bg-brand-orange text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-orange/90 transition-colors"
              >
                Добавить в дневник
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
