import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Star, Flame, Eye, Heart, Share2, Users, ChevronLeft, 
  CheckCircle2, MessageSquare, Award, Lightbulb, 
  User, Send, Sparkles, Edit, Trash2, Bot, Printer, ShoppingCart
} from 'lucide-react';
import type { Recipe, Comment, UserSession } from '../types';
import { RECIPES } from '../data/recipes';
import confetti from 'canvas-confetti';
import { apiAddComment } from '../services/api';
import { getRecipeImage } from '../utils/recipeImage';

interface RecipeDetailProps {
  recipe: Recipe;
  isFavorite: boolean;
  user: UserSession | null;
  onToggleFavorite: (id: string) => void;
  onBack: () => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onEditRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (recipeId: string) => void;
  addToast: (message: string, type: 'success' | 'info' | 'warning') => void;
  onAddToShoppingList?: (recipe: Recipe) => void;
  onMarkAsCooked?: (recipe: Recipe) => void;
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({
  recipe,
  isFavorite,
  user,
  onToggleFavorite,
  onBack,
  onSelectRecipe,
  onEditRecipe,
  onDeleteRecipe,
  addToast,
  onAddToShoppingList,
  onMarkAsCooked
}) => {
  const [servings, setServings] = useState<number>(recipe.servings);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(
    new Array(recipe.steps.length).fill(false)
  );
  const [comments, setComments] = useState<Comment[]>(recipe.comments);
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentRating, setNewCommentRating] = useState(5);
  const [newCommentAuthor, setNewCommentAuthor] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  // Timer States
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);

  useEffect(() => {
    let interval: any = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && timerActive) {
      setTimerActive(false);
      addToast("⏰ Таймер кулинара сработал! Время проверить блюдо! 🍳", "success");
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
        oscillator.connect(audioCtx.destination);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 800);
      } catch (e) {}
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds, addToast]);

  const handleStartTimer = (minutes: number) => {
    setTimerSeconds(minutes * 60);
    setTimerActive(true);
    addToast(`⏰ Таймер запущен на ${minutes} минут!`, "info");
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyIngredients = () => {
    const listText = recipe.ingredients.map(ing => {
      const scaledAmount = Math.round((ing.amount * scaleFactor) * 10) / 10;
      return `- ${ing.name}: ${scaledAmount} ${ing.unit}`;
    }).join('\n');
    
    navigator.clipboard.writeText(`Список ингредиентов для "${recipe.title}" (${servings} порц.):\n\n${listText}`);
    addToast("Список покупок скопирован в буфер обмена! 📋", "success");
  };

  const handleAskAIChef = () => {
    const promptText = `Привет! Расскажи подробнее про секреты приготовления блюда "${recipe.title}". Чем можно заменить ингредиенты в нем?`;
    window.dispatchEvent(new CustomEvent('cookbook_ask_ai', { detail: promptText }));
    addToast("Запрос отправлен ИИ-шефу! Открываем чат... 🤖", "info");
  };

  // Sync state if recipe changes
  useEffect(() => {
    setServings(recipe.servings);
    setCompletedSteps(new Array(recipe.steps.length).fill(false));
    setComments(recipe.comments);
    setNewCommentText('');
    setNewCommentRating(5);
    setNewCommentAuthor('');
    setShowConfetti(false);
    setTimerSeconds(0);
    setTimerActive(false);
  }, [recipe]);

  const scaleFactor = servings / recipe.servings;

  const handleStepToggle = (index: number) => {
    const nextSteps = [...completedSteps];
    nextSteps[index] = !nextSteps[index];
    setCompletedSteps(nextSteps);

    // If all steps completed, fire confetti!
    if (nextSteps.every(Boolean)) {
      setShowConfetti(true);
      addToast("🎉 Поздравляем! Вы завершили приготовление блюда!", "success");
      // Fire confetti burst
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentAuthor.trim() || !newCommentText.trim()) {
      addToast("Пожалуйста, заполните имя и текст комментария", "warning");
      return;
    }

    const commentData = {
      author: newCommentAuthor.trim(),
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 900000)}?auto=format&fit=crop&w=100&q=80`,
      text: newCommentText.trim(),
      date: new Date().toLocaleDateString('ru-RU'),
      rating: newCommentRating
    };

    try {
      const savedComment = await apiAddComment(recipe.id, commentData);
      setComments(prev => [savedComment, ...prev]);
      setNewCommentText('');
      setNewCommentAuthor('');
      setNewCommentRating(5);
      addToast("Комментарий успешно добавлен!", "success");
    } catch (err) {
      addToast("Не удалось добавить комментарий", "warning");
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(`${url}#recipe-${recipe.id}`).then(() => {
      addToast("Ссылка на рецепт скопирована в буфер обмена!", "success");
    }).catch(() => {
      addToast("Не удалось скопировать ссылку", "warning");
    });
  };

  // Find 3 related recipes
  const relatedRecipes = RECIPES.filter(
    r => r.id !== recipe.id && (r.category === recipe.category || r.cuisine === recipe.cuisine)
  ).slice(0, 3);

  // Progress percentage
  const completedCount = completedSteps.filter(Boolean).length;
  const progressPercent = Math.round((completedCount / recipe.steps.length) * 100);

  // Macros total calculations
  const totalMacros = recipe.macros.protein + recipe.macros.fat + recipe.macros.carbs;
  const proteinPct = Math.round((recipe.macros.protein / totalMacros) * 100);
  const fatPct = Math.round((recipe.macros.fat / totalMacros) * 100);
  const carbsPct = Math.round((recipe.macros.carbs / totalMacros) * 100);

  const difficultyLabel = {
    Easy: 'Легко',
    Medium: 'Средне',
    Hard: 'Сложно'
  };

  const difficultyColor = {
    Easy: 'text-brand-green bg-brand-green/10 border-brand-green/20',
    Medium: 'text-brand-yellow bg-brand-yellow/10 border-brand-yellow/20',
    Hard: 'text-red-500 bg-red-500/10 border-red-500/20'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="pb-16"
    >
      {/* Back Button and Actions Panel */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-full glass-effect border border-slate-200/50 dark:border-slate-800/50 hover:text-brand-orange transition-colors font-semibold shadow-sm text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Назад к библиотеке</span>
        </button>

        <div className="flex gap-2">
          {((user?.role as string) === 'admin' || recipe.author_id === user?.id || (!recipe.author_id && (user?.role as string) === 'admin')) && (
            <>
              <button
                onClick={() => onEditRecipe(recipe)}
                className="px-3 py-1.5 rounded-full glass-effect border border-slate-200/50 dark:border-slate-800/50 hover:text-blue-500 hover:border-blue-500/30 transition-all font-semibold shadow-sm text-xs flex items-center gap-1 cursor-pointer"
                title="Редактировать рецепт"
              >
                <Edit className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Редактировать</span>
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Вы действительно хотите окончательно удалить этот рецепт?")) {
                    onDeleteRecipe(recipe.id);
                  }
                }}
                className="px-3 py-1.5 rounded-full glass-effect border border-slate-200/50 dark:border-slate-800/50 hover:text-red-500 hover:border-red-500/30 transition-all font-semibold shadow-sm text-xs flex items-center gap-1 cursor-pointer"
                title="Удалить рецепт"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Удалить</span>
              </button>
            </>
          )}
          <button
            onClick={() => onToggleFavorite(recipe.id)}
            className="p-2.5 rounded-full glass-effect border border-slate-200/50 dark:border-slate-800/50 hover:scale-105 transition-transform duration-200 shadow-sm"
            title="Добавить в избранное"
          >
            <Heart 
              className={`w-5 h-5 transition-colors ${
                isFavorite ? 'fill-brand-orange text-brand-orange' : 'text-slate-400 dark:text-slate-200'
              }`} 
            />
          </button>
          <button
            onClick={() => {
              if (onMarkAsCooked) onMarkAsCooked(recipe);
              confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            }}
            className="p-2.5 rounded-full bg-orange-500/10 hover:bg-orange-500/20 border border-brand-orange/30 text-brand-orange hover:scale-105 transition-all duration-200 shadow-sm"
            title="Отметить как приготовленное (серия готовки)"
          >
            <Flame className="w-5 h-5 fill-brand-orange/10" />
          </button>
          <button
            onClick={() => window.print()}
            className="p-2.5 rounded-full glass-effect border border-slate-200/50 dark:border-slate-800/50 hover:scale-105 transition-transform duration-200 shadow-sm text-slate-500 dark:text-slate-200 hover:text-brand-orange dark:hover:text-brand-orange"
            title="Распечатать рецепт"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button
            onClick={handleShare}
            className="p-2.5 rounded-full glass-effect border border-slate-200/50 dark:border-slate-800/50 hover:scale-105 transition-transform duration-200 shadow-sm text-slate-500 dark:text-slate-200 hover:text-brand-orange dark:hover:text-brand-orange"
            title="Поделиться рецептом"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Recipe Header Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        {/* Large Food Image */}
        <div className="lg:col-span-7 rounded-3xl overflow-hidden shadow-xl border border-slate-200/40 dark:border-slate-800/40 h-[320px] md:h-[450px] relative">
          <img 
            src={getRecipeImage(recipe.title, recipe.category, recipe.image)} 
            alt={recipe.title} 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/10 to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <div className="flex gap-2 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-brand-orange shadow-sm text-white">
                {recipe.category}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-900/70 backdrop-blur-md border border-white/10 text-white">
                {recipe.cuisine}
              </span>
            </div>
            <h1 className="font-display font-extrabold text-2xl md:text-4xl leading-tight mb-2 text-white">
              {recipe.title}
            </h1>
            <p className="text-sm text-slate-200 line-clamp-2 max-w-2xl">
              {recipe.description}
            </p>
          </div>
        </div>

        {/* Quick Stats Panel */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-effect rounded-3xl p-6 border flex-grow flex flex-col justify-between shadow-lg">
            {/* Meta attributes */}
            <div>
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
                <span className="text-sm text-slate-400">Автор рецепта:</span>
                <span className="font-display font-semibold flex items-center gap-1.5 text-brand-orange">
                  <Award className="w-4 h-4" /> {recipe.author}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center my-6">
                <div className="p-3 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl">
                  <Clock className="w-5 h-5 text-brand-orange mx-auto mb-1.5" />
                  <span className="block text-xs text-slate-400">Время</span>
                  <span className="font-display font-bold text-sm md:text-base">{recipe.prepTime} мин</span>
                </div>
                <div className="p-3 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl">
                  <Star className="w-5 h-5 text-brand-yellow fill-brand-yellow mx-auto mb-1.5" />
                  <span className="block text-xs text-slate-400">Рейтинг</span>
                  <span className="font-display font-bold text-sm md:text-base">{recipe.rating} ({recipe.reviewsCount})</span>
                </div>
                <div className="p-3 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl">
                  <div className={`mx-auto mb-1.5 px-2 py-0.5 max-w-max text-[10px] font-bold uppercase rounded-full border ${difficultyColor[recipe.difficulty]}`}>
                    {difficultyLabel[recipe.difficulty]}
                  </div>
                  <span className="block text-xs text-slate-400">Сложность</span>
                  <span className="font-display font-bold text-xs uppercase">{recipe.difficulty === 'Easy' ? 'Легкая' : recipe.difficulty === 'Medium' ? 'Средняя' : 'Сложная'}</span>
                </div>
              </div>
            </div>

            {/* Calories & Macros visual widgets */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold flex items-center gap-1.5">
                  <Flame className="w-4.5 h-4.5 text-brand-orange fill-brand-orange/20" /> Калорийность (на порцию):
                </span>
                <span className="font-display font-black text-xl text-brand-orange">{recipe.calories} ккал</span>
              </div>

              {/* Progress Bars for Macros */}
              <div className="space-y-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/50">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">БЖУ Баланс:</span>
                
                {/* Protein */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Белки ({recipe.macros.protein} г)</span>
                    <span className="text-brand-orange font-bold">{proteinPct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-brand-orange h-full rounded-full" style={{ width: `${proteinPct}%` }} />
                  </div>
                </div>

                {/* Fat */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Жиры ({recipe.macros.fat} г)</span>
                    <span className="text-brand-yellow font-bold">{fatPct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-brand-yellow h-full rounded-full" style={{ width: `${fatPct}%` }} />
                  </div>
                </div>

                {/* Carbs */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Углеводы ({recipe.macros.carbs} г)</span>
                    <span className="text-brand-green font-bold">{carbsPct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-brand-green h-full rounded-full" style={{ width: `${carbsPct}%` }} />
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 mt-4 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>Этот рецепт просмотрели {recipe.views} раз</span>
              </div>

              {/* Cooking Timer Widget */}
              <div className="mt-5 p-4 rounded-2xl bg-brand-orange/5 border border-brand-orange/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-brand-orange animate-pulse" />
                  <div>
                    <span className="text-[10px] text-slate-450 block font-bold uppercase tracking-wider">Кулинарный таймер</span>
                    <span className="font-display font-black text-sm text-slate-800 dark:text-slate-200">
                      {timerSeconds > 0 ? formatTimer(timerSeconds) : "Не запущен"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {timerSeconds > 0 ? (
                    <button
                      type="button"
                      onClick={() => setTimerActive(!timerActive)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer text-white transition-all ${
                        timerActive ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-green hover:bg-brand-green/90'
                      }`}
                    >
                      {timerActive ? 'Пауза' : 'Старт'}
                    </button>
                  ) : (
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartTimer(5)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-brand-orange hover:text-white transition-all text-xs font-semibold cursor-pointer"
                      >
                        5м
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartTimer(recipe.prepTime || 15)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-brand-orange hover:text-white transition-all text-xs font-semibold cursor-pointer"
                      >
                        {recipe.prepTime}м
                      </button>
                    </div>
                  )}
                  {timerSeconds > 0 && (
                    <button
                      type="button"
                      onClick={() => { setTimerSeconds(0); setTimerActive(false); }}
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 cursor-pointer"
                      title="Сбросить"
                    >
                      Сброс
                    </button>
                  )}
                </div>
              </div>

              {/* Ask AI Chef button */}
              <div className="mt-4 pt-4 border-t border-slate-200/40 dark:border-slate-800/40">
                <button
                  type="button"
                  onClick={handleAskAIChef}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 font-bold text-xs transition-all cursor-pointer"
                >
                  <Bot className="w-4 h-4" />
                  <span>Спросить ИИ-помощника об этом рецепте</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ingredients & Prep steps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">
        {/* Ingredients (Col 5) */}
        <div className="lg:col-span-5 glass-effect rounded-3xl p-6 border shadow-lg">
          <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-200/50 dark:border-slate-800/50">
            <h2 className="font-display font-bold text-xl">Ингредиенты</h2>
            
            <div className="flex items-center gap-3">
              {/* Copy ingredients list (Shopping List) */}
              <button 
                onClick={handleCopyIngredients}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-full border border-slate-200/50 dark:border-slate-800/50"
                title="Копировать список ингредиентов"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">В буфер</span>
              </button>

              {/* Add to shopping list */}
              {onAddToShoppingList && (
                <button
                  onClick={() => onAddToShoppingList(recipe)}
                  className="text-xs font-bold text-brand-orange hover:text-brand-orange/80 transition-colors flex items-center gap-1 cursor-pointer bg-brand-orange/5 px-2.5 py-1.5 rounded-full border border-brand-orange/15 animate-pulse-slow"
                  title="Добавить ингредиенты в список покупок"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">В список</span>
                </button>
              )}

              {/* Servings count adjustment */}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200/30 dark:border-slate-800/30">
                <Users className="w-4 h-4 text-brand-orange" />
                <button 
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  className="w-5 h-5 flex items-center justify-center font-bold hover:text-brand-orange text-sm cursor-pointer"
                >
                  -
                </button>
                <span className="font-display font-bold text-sm w-4 text-center">{servings}</span>
                <button 
                  onClick={() => setServings(Math.min(12, servings + 1))}
                  className="w-5 h-5 flex items-center justify-center font-bold hover:text-brand-orange text-sm cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <ul className="space-y-3.5">
            {recipe.ingredients.map((ing, idx) => (
              <li key={idx} className="flex justify-between items-center py-2 border-b border-dashed border-slate-200/40 dark:border-slate-800/40 last:border-b-0 text-sm">
                <span className="text-slate-700 dark:text-slate-300 font-medium">{ing.name}</span>
                <span className="font-display font-bold text-slate-800 dark:text-slate-200">
                  {/* Rounding numbers to avoid floating point representations */}
                  {Math.round((ing.amount * scaleFactor) * 10) / 10} {ing.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Preparation steps (Col 7) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="glass-effect rounded-3xl p-6 border shadow-lg relative overflow-hidden">
            {/* Steps Progress Header */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-display font-bold text-xl flex items-center gap-2">
                  <span>Инструкция</span>
                  <Sparkles className="w-4 h-4 text-brand-orange" />
                </h2>
                <span className="text-xs font-bold text-brand-orange px-2.5 py-1 rounded-full bg-brand-orange/10">
                  Выполнено: {progressPercent}%
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className="bg-brand-orange h-full rounded-full" 
                />
              </div>
            </div>

            {/* Steps Checklist */}
            <div className="space-y-6">
              {recipe.steps.map((step, idx) => (
                <div 
                  key={idx} 
                  onClick={() => handleStepToggle(idx)}
                  className={`flex gap-4 cursor-pointer p-3.5 rounded-2xl border transition-all duration-300 ${
                    completedSteps[idx] 
                      ? 'bg-brand-green/5 border-brand-green/20 opacity-80' 
                      : 'bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <button className="flex-shrink-0 mt-0.5">
                    <CheckCircle2 className={`w-6 h-6 transition-colors ${
                      completedSteps[idx] ? 'text-brand-green fill-brand-green/10' : 'text-slate-300 dark:text-slate-700'
                    }`} />
                  </button>
                  <div>
                    <span className="text-xs font-bold text-slate-400 block mb-1">Шаг {idx + 1}</span>
                    <p className={`text-sm leading-relaxed ${
                      completedSteps[idx] ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      {step}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Confetti Completed Panel */}
            <AnimatePresence>
              {showConfetti && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0 bg-brand-dark/95 backdrop-blur-sm flex flex-col justify-center items-center text-center p-8 z-20 text-white"
                >
                  <Sparkles className="w-16 h-16 text-brand-yellow mb-4 animate-bounce" />
                  <h3 className="font-display font-black text-2xl mb-2 text-white">Приятного аппетита! 🍽️</h3>
                  <p className="text-sm text-slate-300 max-w-sm mb-6">
                    Вы успешно приготовили блюдо «{recipe.title}». Нажмите кнопку ниже, чтобы сбросить шаги.
                  </p>
                  <button
                    onClick={() => {
                      setCompletedSteps(new Array(recipe.steps.length).fill(false));
                      setShowConfetti(false);
                    }}
                    className="px-6 py-2.5 rounded-full bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange/90 transition-colors shadow-lg"
                  >
                    Готовить снова
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Useful Tips */}
          {recipe.tips && recipe.tips.length > 0 && (
            <div className="glass-effect rounded-3xl p-6 border shadow-lg bg-brand-yellow/5 border-brand-yellow/10">
              <h3 className="font-display font-bold text-lg flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-brand-yellow fill-brand-yellow/20" /> Полезные советы шефа
              </h3>
              <ul className="space-y-3">
                {recipe.tips.map((tip, idx) => (
                  <li key={idx} className="flex gap-3 items-start text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow mt-2 flex-shrink-0" />
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">{tip}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Reviews and Comments Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
        <div className="lg:col-span-7 glass-effect rounded-3xl p-6 border shadow-lg">
          <h2 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-orange" />
            <span>Отзывы и комментарии ({comments.length})</span>
          </h2>

          {/* Comments List */}
          <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 mb-8">
            {comments.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-8">
                Комментариев пока нет. Будьте первым, кто оставит отзыв!
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="p-4 rounded-2xl bg-white/30 dark:bg-slate-900/30 border border-slate-200/30 dark:border-slate-800/30">
                  <div className="flex justify-between items-center mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={comment.avatar} 
                        alt={comment.author} 
                        className="w-9 h-9 rounded-full object-cover border border-slate-200" 
                      />
                      <div>
                        <span className="font-semibold text-sm block">{comment.author}</span>
                        <span className="text-[10px] text-slate-400">{comment.date}</span>
                      </div>
                    </div>
                    
                    {/* Rating stars */}
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star 
                          key={idx} 
                          className={`w-3.5 h-3.5 ${
                            idx < comment.rating ? 'text-brand-yellow fill-brand-yellow' : 'text-slate-300 dark:text-slate-700'
                          }`} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
                    {comment.text}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Leave a Comment form */}
          <form onSubmit={handleAddComment} className="border-t border-slate-200/50 dark:border-slate-800/50 pt-6">
            <h3 className="font-display font-semibold text-base mb-4">Оставить свой отзыв</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-semibold">Ваше имя</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={newCommentAuthor}
                    onChange={(e) => setNewCommentAuthor(e.target.value)}
                    placeholder="Например, Анна" 
                    className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-orange transition-colors"
                  />
                  <User className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-semibold">Ваша оценка</label>
                <div className="flex gap-2 items-center h-[46px] px-2">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setNewCommentRating(idx + 1)}
                      className="hover:scale-110 transition-transform"
                    >
                      <Star 
                        className={`w-7 h-7 cursor-pointer ${
                          idx < newCommentRating ? 'text-brand-yellow fill-brand-yellow' : 'text-slate-300 dark:text-slate-700'
                        }`} 
                      />
                    </button>
                  ))}
                  <span className="text-sm font-bold ml-2 font-display text-brand-yellow">{newCommentRating}/5</span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs text-slate-400 block mb-1.5 font-semibold">Текст отзыва</label>
              <textarea 
                rows={3}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Поделитесь своими впечатлениями о вкусе и процессе приготовления..." 
                className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-orange transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold flex items-center justify-center gap-2 text-sm shadow-md transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>Опубликовать отзыв</span>
            </button>
          </form>
        </div>

        {/* Similar Recipes Recommendations */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-effect rounded-3xl p-6 border shadow-lg">
            <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-1.5">
              <span>Рекомендуем попробовать</span>
            </h3>

            <div className="space-y-4">
              {relatedRecipes.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Похожих рецептов не найдено</p>
              ) : (
                relatedRecipes.map(rel => (
                  <div 
                    key={rel.id}
                    onClick={() => onSelectRecipe(rel)}
                    className="flex gap-3 cursor-pointer group p-2 rounded-2xl hover:bg-slate-100/50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-200/30 dark:hover:border-slate-850 transition-all duration-200"
                  >
                    <div className="w-18 h-18 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200/50 dark:border-slate-800/50">
                      <img src={rel.image} alt={rel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="flex flex-col justify-between py-0.5">
                      <div>
                        <h4 className="text-sm font-semibold line-clamp-1 group-hover:text-brand-orange transition-colors">
                          {rel.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">
                          {rel.cuisine} • {rel.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-0.5"><Clock className="w-3.5 h-3.5 text-brand-orange" /> {rel.prepTime} мин</span>
                        <span className="flex items-center gap-0.5"><Star className="w-3.5 h-3.5 text-brand-yellow fill-brand-yellow" /> {rel.rating}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
