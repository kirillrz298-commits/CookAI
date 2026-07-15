import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Flame, Zap } from 'lucide-react';
import type { MealPlan, DayKey, Recipe } from '../types';
import { getRecipeImage } from '../utils/recipeImage';

interface MealPlannerProps {
  plan: MealPlan;
  onUpdatePlan: (plan: MealPlan) => void;
  onSelectRecipeForSlot: (day: DayKey, mealType: 'breakfast' | 'lunch' | 'dinner') => void;
  allRecipes: Recipe[];
}

const DAY_NAMES: Record<DayKey, string> = {
  mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Вс'
};
const DAY_FULL: Record<DayKey, string> = {
  mon: 'Понедельник', tue: 'Вторник', wed: 'Среда', thu: 'Четверг', fri: 'Пятница', sat: 'Суббота', sun: 'Воскресенье'
};
const DAYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const MEAL_LABELS = { breakfast: '🌅 Завтрак', lunch: '☀️ Обед', dinner: '🌙 Ужин' };

function emptyDay() {
  return { breakfast: { recipeId: null }, lunch: { recipeId: null }, dinner: { recipeId: null } };
}

export const MealPlanner: React.FC<MealPlannerProps> = ({ plan, onUpdatePlan, onSelectRecipeForSlot, allRecipes }) => {
  const [activeDay, setActiveDay] = useState<DayKey>('mon');

  const clearSlot = (day: DayKey, meal: 'breakfast' | 'lunch' | 'dinner') => {
    const updated = { ...plan, days: { ...plan.days, [day]: { ...plan.days[day], [meal]: { recipeId: null } } } };
    onUpdatePlan(updated);
  };

  // Calculate weekly nutrition totals
  let totalCal = 0, totalProt = 0, totalFat = 0, totalCarbs = 0;
  DAYS.forEach(day => {
    ['breakfast', 'lunch', 'dinner'].forEach(meal => {
      const slot = plan.days[day]?.[meal as 'breakfast' | 'lunch' | 'dinner'];
      if (slot?.recipeId) {
        const recipe = allRecipes.find(r => r.id === slot.recipeId);
        if (recipe) {
          totalCal += recipe.calories;
          totalProt += recipe.macros.protein;
          totalFat += recipe.macros.fat;
          totalCarbs += recipe.macros.carbs;
        }
      }
    });
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-black text-2xl tracking-tight">🥗 Меню на неделю</h2>
          <p className="text-slate-400 text-sm mt-0.5">Спланируй питание и отслеживай КБЖУ</p>
        </div>
      </div>

      {/* Weekly nutrition summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Калорий/нед.', value: `${totalCal}`, unit: 'ккал', color: 'text-brand-orange', icon: <Flame className="w-3.5 h-3.5" /> },
          { label: 'Белки', value: `${totalProt}`, unit: 'г', color: 'text-blue-400', icon: <Zap className="w-3.5 h-3.5" /> },
          { label: 'Жиры', value: `${totalFat}`, unit: 'г', color: 'text-yellow-400', icon: <Zap className="w-3.5 h-3.5" /> },
          { label: 'Углеводы', value: `${totalCarbs}`, unit: 'г', color: 'text-green-400', icon: <Zap className="w-3.5 h-3.5" /> },
        ].map((stat, i) => (
          <div key={i} className="glass-effect rounded-2xl p-3 border border-white/5 text-center">
            <div className={`flex justify-center mb-0.5 ${stat.color}`}>{stat.icon}</div>
            <div className={`font-black text-lg ${stat.color}`}>{stat.value}</div>
            <div className="text-[9px] text-slate-500 font-bold uppercase">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Day selector tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {DAYS.map(day => {
          const dayPlan = plan.days[day] || emptyDay();
          const filledSlots = ['breakfast', 'lunch', 'dinner'].filter(m => dayPlan[m as keyof typeof dayPlan]?.recipeId).length;
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-2xl transition-all border text-xs font-bold ${
                activeDay === day
                  ? 'bg-brand-orange text-white border-brand-orange shadow-lg shadow-brand-orange/20'
                  : 'glass-effect border-white/10 text-slate-400 hover:border-brand-orange/30 hover:text-white'
              }`}
            >
              <span>{DAY_NAMES[day]}</span>
              <div className="flex gap-0.5 mt-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < filledSlots ? (activeDay === day ? 'bg-white' : 'bg-brand-orange') : 'bg-slate-600'}`} />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active day meals */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeDay}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-3"
        >
          <h3 className="font-bold text-slate-300 text-sm">{DAY_FULL[activeDay]}</h3>

          {(['breakfast', 'lunch', 'dinner'] as const).map(meal => {
            const slot = plan.days[activeDay]?.[meal] || { recipeId: null };
            const recipe = slot.recipeId ? allRecipes.find(r => r.id === slot.recipeId) : null;

            return (
              <div key={meal} className="glass-effect rounded-2xl border border-white/5 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">{MEAL_LABELS[meal]}</span>
                  {recipe && (
                    <span className="text-xs text-brand-orange font-semibold">{recipe.calories} ккал</span>
                  )}
                </div>

                {recipe ? (
                  <div className="flex items-center gap-3 p-3">
                    <img
                      src={getRecipeImage(recipe.title, recipe.category, recipe.image)}
                      alt={recipe.title}
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-white line-clamp-1">{recipe.title}</p>
                      <p className="text-xs text-slate-400">{recipe.prepTime} мин · {recipe.difficulty === 'Easy' ? 'Легко' : recipe.difficulty === 'Medium' ? 'Средне' : 'Сложно'}</p>
                      <div className="flex gap-2 mt-1 text-[10px] text-slate-500 font-semibold">
                        <span>Б: {recipe.macros.protein}г</span>
                        <span>Ж: {recipe.macros.fat}г</span>
                        <span>У: {recipe.macros.carbs}г</span>
                      </div>
                    </div>
                    <button
                      onClick={() => clearSlot(activeDay, meal)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onSelectRecipeForSlot(activeDay, meal)}
                    className="w-full p-4 flex items-center gap-3 text-slate-500 hover:text-brand-orange hover:bg-brand-orange/5 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-xl border-2 border-dashed border-slate-600 group-hover:border-brand-orange/50 flex items-center justify-center transition-colors">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Добавить рецепт</span>
                  </button>
                )}
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
