import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Layout } from './components/Layout';
import { RecipeCard } from './components/RecipeCard';
import { RecipeDetail } from './components/RecipeDetail';
import { SearchPanel } from './components/SearchPanel';
import { UserProfile } from './components/UserProfile';
import { AIChad } from './components/AIChad';
import { SkeletonList } from './components/SkeletonCard';
import { ToastContainer, type ToastType } from './components/Toast';
import { AuthScreen } from './components/AuthScreen';
import { RecipeForm } from './components/RecipeForm';
import { AdminPanel } from './components/AdminPanel';
import { ShoppingListPanel } from './components/ShoppingList';
import { MealPlanner } from './components/MealPlanner';
import { CalorieDashboard } from './components/CalorieDashboard';
import { AchievementsPanel } from './components/Achievements';
import { MethodicalManual } from './components/MethodicalManual';
import { RECIPES } from './data/recipes';
import type { Recipe, UserProfile as UserProfileType, UserSession, ShoppingListItem, MealPlan, DayKey, CalorieLogEntry, DailyCalories, UserStreak, Badge } from './types';
import { 
  Search, Compass, Star, ArrowRight, 
  ShieldAlert, Eye, Sparkles
} from 'lucide-react';
import { 
  apiFetchRecipes, apiFetchRecipeById, apiFetchUserProfile, 
  apiUpdateUserProfile, apiToggleFavorite, apiAddSearchHistory, 
  apiAddViewHistory, apiGetCurrentUser, apiLogout, 
  apiCreateRecipe, apiUpdateRecipe, apiDeleteRecipe, apiFetchCategories 
} from './services/api';
import { getRecipeImage } from './utils/recipeImage';

const CATEGORIES_DATA = [
  { name: 'Завтраки', icon: '🍳' },
  { name: 'Обеды', icon: '🥗' },
  { name: 'Ужины', icon: '🥩' },
  { name: 'Супы', icon: '🍜' },
  { name: 'Десерты', icon: '🍰' },
  { name: 'Выпечка', icon: '🍞' },
  { name: 'Паста', icon: '🍝' },
  { name: 'Пицца', icon: '🍕' },
  { name: 'Бургеры', icon: '🍔' },
  { name: 'Салаты', icon: '🥗' },
  { name: 'Закуски', icon: '🧀' },
  { name: 'Напитки', icon: '🍹' },
  { name: 'ПП', icon: '🥑' },
  { name: 'Вегетарианское', icon: '🌱' },
  { name: 'Фастфуд', icon: '🍟' },
  { name: 'Национальная кухня', icon: '🕌' },
  { name: 'Гриль', icon: '🔥' }
];

export default function App() {
  // Authentication & Navigation
  const [user, setUser] = useState<UserSession | null>(apiGetCurrentUser());
  const [activePage, setActivePage] = useState<'home' | 'search' | 'recipe' | 'profile' | 'create-recipe' | 'admin' | 'meal-planner' | 'calories' | 'achievements' | 'shopping' | 'manual'>('home');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);

  // Database records state
  const [recipes, setRecipes] = useState<Recipe[]>(RECIPES);
  const [searchResults, setSearchResults] = useState<Recipe[]>(RECIPES);
  const [categoriesList, setCategoriesList] = useState<{ name: string; icon: string }[]>(CATEGORIES_DATA);

  // Search & Filters State
  const [filters, setFilters] = useState({
    query: '',
    cuisine: '',
    category: '',
    difficulty: '',
    maxTime: 120,
    maxCalories: 800,
    sortBy: 'default',
    ingredients: [] as string[]
  });

  // User Profile State
  const [profile, setProfile] = useState<UserProfileType>({
    name: 'Шеф Гурман',
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=150&q=80',
    favorites: [],
    searchHistory: [],
    viewHistory: [],
    settings: {
      darkMode: true,
      notificationsEnabled: true
    }
  });

  // === NEW FEATURE STATE ===
  // Shopping List
  const [shoppingItems, setShoppingItems] = useState<ShoppingListItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('cookai_shopping') || '[]'); } catch { return []; }
  });

  // Meal Plan
  const [mealPlan, setMealPlan] = useState<MealPlan>(() => {
    try {
      const saved = localStorage.getItem('cookai_mealplan');
      if (saved) return JSON.parse(saved);
    } catch {}
    const days = ['mon','tue','wed','thu','fri','sat','sun'];
    const emptyDay = { breakfast: { recipeId: null }, lunch: { recipeId: null }, dinner: { recipeId: null } };
    const planDays: any = {};
    days.forEach(d => { planDays[d] = { ...emptyDay }; });
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    return { weekStart: weekStart.toISOString().split('T')[0], days: planDays };
  });

  // Calorie Log
  const [calorieEntries, setCalorieEntries] = useState<CalorieLogEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem('cookai_calories') || '[]'); } catch { return []; }
  });
  const [calorieGoal, setCalorieGoal] = useState(() => {
    return Number(localStorage.getItem('cookai_calgoal') || '2000');
  });

  // Achievements / Streak
  const [badges, setBadges] = useState<Badge[]>(() => {
    try { return JSON.parse(localStorage.getItem('cookai_badges') || '[]'); } catch { return []; }
  });
  const [streak, setStreak] = useState<UserStreak>(() => {
    try { return JSON.parse(localStorage.getItem('cookai_streak') || JSON.stringify({ currentStreak: 0, maxStreak: 0, lastCookDate: null, totalCooked: 0 })); }
    catch { return { currentStreak: 0, maxStreak: 0, lastCookDate: null, totalCooked: 0 }; }
  });

  // Meal planner recipe selector
  const [mealSlotTarget, setMealSlotTarget] = useState<{ day: DayKey; meal: 'breakfast' | 'lunch' | 'dinner' } | null>(null);

  // Persist to localStorage
  useEffect(() => { localStorage.setItem('cookai_shopping', JSON.stringify(shoppingItems)); }, [shoppingItems]);
  useEffect(() => { localStorage.setItem('cookai_mealplan', JSON.stringify(mealPlan)); }, [mealPlan]);
  useEffect(() => { localStorage.setItem('cookai_calories', JSON.stringify(calorieEntries)); }, [calorieEntries]);
  useEffect(() => { localStorage.setItem('cookai_calgoal', String(calorieGoal)); }, [calorieGoal]);
  useEffect(() => { localStorage.setItem('cookai_badges', JSON.stringify(badges)); }, [badges]);
  useEffect(() => { localStorage.setItem('cookai_streak', JSON.stringify(streak)); }, [streak]);

  // Recipe of the day — deterministic by date seed
  const recipeOfDay = useMemo(() => {
    if (recipes.length === 0) return null;
    const seed = new Date().toDateString();
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
    return recipes[Math.abs(hash) % recipes.length];
  }, [recipes]);

  // Load recipes and profile on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const fetchedRecipes = await apiFetchRecipes({
          query: '', cuisine: '', category: '', difficulty: '',
          maxTime: 120, maxCalories: 800, sortBy: 'default', ingredients: []
        });
        setRecipes(fetchedRecipes);

        if (user) {
          const fetchedProfile = await apiFetchUserProfile();
          setProfile(fetchedProfile);
        }

        try {
          const dynamicCats = await apiFetchCategories();
          if (dynamicCats && dynamicCats.length > 0) {
            setCategoriesList(dynamicCats);
          }
        } catch (catErr) {
          console.warn("Failed to fetch dynamic categories:", catErr);
        }
      } catch (err) {
        console.error("Error loading startup data:", err);
      }
    };
    loadInitialData();
  }, [user]);

  // Update search results whenever filters change
  useEffect(() => {
    const loadSearchResults = async () => {
      setLoading(true);
      try {
        const res = await apiFetchRecipes(filters);
        setSearchResults(res);
      } catch (err) {
        console.error("Error loading recipes search results:", err);
      } finally {
        setLoading(false);
      }
    };
    loadSearchResults();
  }, [filters]);

  // Notification Toasts State
  const [toasts, setToasts] = useState<{ id: string; message: string; type: ToastType }[]>([]);

  // Effect to apply dark mode classes globally
  useEffect(() => {
    const isDark = profile.settings.darkMode;
    const body = document.body;
    if (isDark) {
      body.classList.remove('light');
      body.classList.add('dark');
      body.style.backgroundColor = '#0b0f19';
    } else {
      body.classList.remove('dark');
      body.classList.add('light');
      body.style.backgroundColor = '#fafaf9';
    }
  }, [profile.settings.darkMode]);

  // Toast Helpers
  const addToast = (message: string, type: ToastType = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Profile settings sync
  const updateProfileAndSync = async (updatedProfile: UserProfileType) => {
    setProfile(updatedProfile);
    try {
      await apiUpdateUserProfile(updatedProfile);
    } catch (err) {
      console.error("Error syncing profile with SQLite backend:", err);
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async (recipeId: string) => {
    try {
      const updatedFavs = await apiToggleFavorite(recipeId);
      setProfile(prev => ({
        ...prev,
        favorites: updatedFavs
      }));

      const isFav = profile.favorites.includes(recipeId);
      addToast(
        isFav ? "Рецепт удален из избранного" : "Рецепт добавлен в избранное! ❤️",
        isFav ? 'info' : 'success'
      );
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const handleToggleFavoriteFromCard = (e: React.MouseEvent, recipeId: string) => {
    e.stopPropagation();
    handleToggleFavorite(recipeId);
  };

  // Run Search Query
  const handleRunSearchQuery = async (queryText: string) => {
    setFilters(prev => ({
      ...prev,
      query: queryText
    }));

    setActivePage('search');
    triggerShimmer();

    try {
      const logItem = await apiAddSearchHistory(queryText);
      if (logItem) {
        setProfile(prev => ({
          ...prev,
          searchHistory: [logItem, ...prev.searchHistory.filter(h => h.query !== queryText)].slice(0, 10)
        }));
      }
    } catch (err) {
      console.error("Error adding search query history:", err);
    }
  };

  // Quick navigation to category
  const handleCategorySelect = (categoryName: string) => {
    setFilters({
      query: '',
      cuisine: '',
      category: categoryName,
      difficulty: '',
      maxTime: 120,
      maxCalories: 800,
      sortBy: 'default',
      ingredients: []
    });
    setActivePage('search');
    triggerShimmer();
  };

  // Trigger loading shimmer effect
  const triggerShimmer = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 450);
  };

  // Navigate directly to a specific recipe
  const handleSelectRecipe = async (recipe: Recipe) => {
    // Fetch fresh recipe details from database including views update
    try {
      const freshRecipe = await apiFetchRecipeById(recipe.id);
      setSelectedRecipe(freshRecipe);
      setActivePage('recipe');

      await apiAddViewHistory(recipe.id);
      // Refresh profile view history
      const freshProfile = await apiFetchUserProfile();
      setProfile(freshProfile);
      // Increment views count locally for immediate sync
      setRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, views: r.views + 1 } : r));
    } catch (err) {
      console.error("Error loading recipe details:", err);
      // Fallback
      setSelectedRecipe(recipe);
      setActivePage('recipe');
    }
  };

  const handleOpenRecipeById = (recipeId: string) => {
    const found = recipes.find(r => r.id === recipeId);
    if (found) {
      handleSelectRecipe(found);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilters({
      query: '',
      cuisine: '',
      category: '',
      difficulty: '',
      maxTime: 120,
      maxCalories: 800,
      sortBy: 'default',
      ingredients: []
    });
    triggerShimmer();
    addToast("Фильтры сброшены", "info");
  };

  // Auth Handlers
  const handleAuthSuccess = (session: UserSession) => {
    setUser(session);
    setActivePage('home');
  };

  const handleLogout = () => {
    apiLogout();
    setUser(null);
    setProfile({
      name: 'Гость',
      avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=150&q=80',
      favorites: [],
      searchHistory: [],
      viewHistory: [],
      settings: { darkMode: true, notificationsEnabled: true }
    });
    addToast("Вы вышли из системы. До встречи!", "info");
  };

  // Recipe CRUD Handlers
  const handleRecipeSubmit = async (recipeData: Partial<Recipe>) => {
    try {
      if (editingRecipe) {
        const updated = await apiUpdateRecipe(editingRecipe.id, recipeData);
        setRecipes(prev => prev.map(r => r.id === editingRecipe.id ? updated : r));
        addToast("Рецепт успешно обновлен! 📝", "success");
      } else {
        const created = await apiCreateRecipe(recipeData);
        setRecipes(prev => [created, ...prev]);
        addToast("Рецепт успешно создан! 🍳", "success");
      }
      setEditingRecipe(null);
      setActivePage('home');
    } catch (err: any) {
      addToast(err.message || "Не удалось сохранить рецепт", "warning");
    }
  };

  const handleRecipeDelete = async (recipeId: string) => {
    try {
      await apiDeleteRecipe(recipeId);
      setRecipes(prev => prev.filter(r => r.id !== recipeId));
      addToast("Рецепт удален из базы данных", "info");
      setActivePage('home');
    } catch (err: any) {
      addToast("Не удалось удалить рецепт", "warning");
    }
  };

  // Extracted lists for filter inputs (computed dynamically from DB records)
  const availableCuisines = Array.from(new Set(recipes.map(r => r.cuisine)));
  const availableCategories = Array.from(new Set(recipes.map(r => r.category)));

  // Landing sections computed dynamically from loaded database
  const popularRecipes = [...recipes].sort((a, b) => b.rating - a.rating).slice(0, 3);
  const newRecipes = [...recipes].slice(3, 6);
  const weeklyHits = [...recipes].slice(6, 9);
  const mostViewed = [...recipes].sort((a, b) => b.views - a.views).slice(0, 3);

  // 1. WELCOME & AUTH ROUTE BLOCK
  if (!user) {
    return (
      <>
        <AuthScreen onAuthSuccess={handleAuthSuccess} addToast={addToast} />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

  // Shopping list helpers
  const addIngredientsToShopping = (recipe: Recipe) => {
    const newItems: ShoppingListItem[] = recipe.ingredients.map((ing, i) => ({
      id: `sl-${Date.now()}-${i}`,
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      checked: false,
      recipeTitle: recipe.title,
    }));
    setShoppingItems(prev => {
      const existingNames = new Set(prev.map(i => i.name.toLowerCase()));
      const fresh = newItems.filter(i => !existingNames.has(i.name.toLowerCase()));
      return [...prev, ...fresh];
    });
    addToast(`${recipe.ingredients.length} ингредиентов добавлено в список покупок 🛒`, 'success');
  };

  // Calorie log helpers
  const handleAddCalorieEntry = (entry: Omit<CalorieLogEntry, 'id' | 'addedAt'>) => {
    const newEntry: CalorieLogEntry = { ...entry, id: `cal-${Date.now()}`, addedAt: new Date().toISOString() };
    setCalorieEntries(prev => [...prev, newEntry]);
    addToast(`+${entry.calories} ккал добавлено в дневник`, 'success');
  };

  const handleRemoveCalorieEntry = (id: string) => {
    setCalorieEntries(prev => prev.filter(e => e.id !== id));
  };

  // Build today's calorie summary
  const todayDate = new Date().toISOString().split('T')[0];
  const todayEntries = calorieEntries.filter(e => e.date === todayDate);
  const todayLog: DailyCalories = {
    date: todayDate,
    entries: todayEntries,
    totalCalories: todayEntries.reduce((s, e) => s + e.calories, 0),
    totalMacros: {
      protein: todayEntries.reduce((s, e) => s + e.macros.protein, 0),
      fat: todayEntries.reduce((s, e) => s + e.macros.fat, 0),
      carbs: todayEntries.reduce((s, e) => s + e.macros.carbs, 0),
    },
    goal: calorieGoal,
  };

  // Build week logs (last 7 days)
  const weekLogs: DailyCalories[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    const dateStr = d.toISOString().split('T')[0];
    const entries = calorieEntries.filter(e => e.date === dateStr);
    return {
      date: dateStr, entries,
      totalCalories: entries.reduce((s, e) => s + e.calories, 0),
      totalMacros: { protein: 0, fat: 0, carbs: 0 },
      goal: calorieGoal,
    };
  });

  // Mark recipe as cooked → update streak + maybe award badge
  const handleMarkCooked = (recipe: Recipe) => {
    const today = new Date().toISOString().split('T')[0];
    const newStreak = { ...streak };
    if (newStreak.lastCookDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().split('T')[0];
      newStreak.currentStreak = newStreak.lastCookDate === yStr ? newStreak.currentStreak + 1 : 1;
      newStreak.maxStreak = Math.max(newStreak.currentStreak, newStreak.maxStreak);
      newStreak.lastCookDate = today;
      newStreak.totalCooked += 1;
      setStreak(newStreak);

      // Check badge awards
      const newBadges = [...badges];
      const earned = (type: string, title: string) => {
        if (!newBadges.find(b => b.type === type)) {
          newBadges.push({ id: `b-${type}`, type, title, description: '', icon: '🏆', unlocked: true, earnedAt: new Date().toLocaleDateString('ru-RU') });
          addToast(`🏆 Новый бейдж: "${title}"!`, 'success');
        }
      };
      if (newStreak.totalCooked >= 1) earned('first_cook', 'Первые шаги');
      if (newStreak.totalCooked >= 5) earned('cook_5', 'Начинающий кулинар');
      if (newStreak.totalCooked >= 10) earned('cook_10', 'Опытный повар');
      if (newStreak.totalCooked >= 25) earned('cook_25', 'Шеф-повар');
      if (newStreak.totalCooked >= 50) earned('cook_50', 'Мастер кухни');
      if (newStreak.currentStreak >= 3) earned('streak_3', 'На волне');
      if (newStreak.currentStreak >= 7) earned('streak_7', 'Неделя готовки');
      if (newStreak.currentStreak >= 30) earned('streak_30', 'Месяц кулинара');
      setBadges(newBadges);
    }
    addToast(`✅ "${recipe.title}" отметичен как приготовленный! 🔥`, 'success');
  };

  return (
    <>
    {mealSlotTarget && (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setMealSlotTarget(null)}>
        <div className="w-full max-w-lg bg-slate-900 rounded-3xl border border-slate-700/50 p-6" onClick={e => e.stopPropagation()}>
          <h3 className="font-bold text-white text-lg mb-4">Выберите рецепт</h3>
          <div className="max-h-80 overflow-y-auto space-y-2">
            {recipes.map(recipe => (
              <button key={recipe.id} onClick={() => {
                setMealPlan(prev => ({ ...prev, days: { ...prev.days, [mealSlotTarget.day]: { ...prev.days[mealSlotTarget.day], [mealSlotTarget.meal]: { recipeId: recipe.id, recipeTitle: recipe.title, calories: recipe.calories } } } }));
                setMealSlotTarget(null);
                addToast(`${recipe.title} добавлен в plan меню`, 'success');
              }} className="w-full flex gap-3 items-center p-3 rounded-xl hover:bg-slate-800 text-left border border-transparent hover:border-slate-700 transition-all">
                <img src={getRecipeImage(recipe.title, recipe.category, recipe.image)} alt="" className="w-12 h-12 rounded-lg object-cover" />
                <div><p className="text-sm font-semibold text-white">{recipe.title}</p><p className="text-xs text-slate-400">{recipe.calories} ккал · {recipe.prepTime} мин</p></div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )}
    <Layout
      profile={profile}
      user={user}
      activePage={activePage}
      onNavigate={(page) => {
        setActivePage(page as any);
        if (page === 'search') triggerShimmer();
      }}
      onToggleTheme={() => {
        setProfile(prev => ({
          ...prev,
          settings: { ...prev.settings, darkMode: !prev.settings.darkMode }
        }));
      }}
      onLogout={handleLogout}
      shoppingCount={shoppingItems.filter(i => !i.checked).length}
    >
      {/* 1. HOME PAGE VIEW */}
      {activePage === 'home' && (
        <div className="flex flex-col gap-14">
          
          {/* Hero Block Section */}
          <div className="rounded-[40px] overflow-hidden shadow-2xl relative border border-slate-200/20 dark:border-slate-800/10 min-h-[460px] flex items-center p-6 md:p-16">
            
            {/* Background image & gradient overlay */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat brightness-45 md:brightness-[0.55]" 
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1600&q=80')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/80 via-brand-dark/45 to-transparent dark:from-black/90 dark:via-black/50" />

            {/* Hero text & Search Form */}
            <div className="relative z-10 text-white max-w-3xl flex flex-col gap-6">
              <span className="text-xs font-extrabold uppercase tracking-widest text-brand-orange bg-brand-orange/15 px-3 py-1 rounded-full max-w-max border border-brand-orange/30">
                🍳 Кулинарная библиотека
              </span>
              <h1 className="font-display font-extrabold text-3xl md:text-5xl lg:text-6xl text-white tracking-tight leading-tight">
                Найдите идеальный рецепт для любого случая
              </h1>
              <p className="text-sm md:text-base text-slate-200 max-w-xl font-medium leading-relaxed">
                Тысячи рецептов со всего мира. Поиск по ингредиентам, кухне, времени приготовления и многое другое.
              </p>

              {/* Hero Search input */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const val = (e.currentTarget.elements.namedItem('heroSearch') as HTMLInputElement).value;
                  if (val.trim()) handleRunSearchQuery(val);
                }}
                className="flex items-center gap-2 p-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg max-w-xl"
              >
                <div className="relative flex-grow">
                  <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-350" />
                  <input
                    type="text"
                    name="heroSearch"
                    placeholder="Какое блюдо приготовим сегодня?"
                    className="w-full bg-transparent pl-11 pr-4 py-3.5 text-sm font-semibold focus:outline-none placeholder-slate-350"
                  />
                </div>
                <button 
                  type="submit"
                  className="bg-brand-orange hover:bg-brand-orange/95 px-6 py-3.5 rounded-xl font-bold text-sm shadow-md transition-colors duration-200 cursor-pointer text-white"
                >
                  Найти
                </button>
              </form>
            </div>
          </div>

          {/* Quick Categories Bar */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="font-display font-black text-xl md:text-2xl tracking-tight">Популярные категории</h2>
                <p className="text-xs text-slate-450 mt-1">Изучите наши кулинарные направления</p>
              </div>
            </div>

            <div className="flex gap-3.5 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {categoriesList.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCategorySelect(cat.name)}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 glass-effect hover:border-brand-orange/40 hover:scale-103 shadow-xs hover:shadow-md transition-all cursor-pointer flex-shrink-0"
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recipe of the day */}
          {recipeOfDay && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-brand-orange/5 to-transparent p-6 flex flex-col md:flex-row gap-6 items-center"
            >
              <img src={getRecipeImage(recipeOfDay.title, recipeOfDay.category, recipeOfDay.image)} className="w-28 h-28 rounded-2xl object-cover shadow-lg" alt="" />
              <div className="flex-1 space-y-2 text-center md:text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-450 bg-purple-500/15 px-2.5 py-1 rounded-full inline-block">🎲 Рецепт дня</span>
                <h3 className="font-display font-black text-lg md:text-xl text-white leading-tight">{recipeOfDay.title}</h3>
                <p className="text-xs md:text-sm text-slate-400 max-w-xl">{recipeOfDay.description}</p>
                <div className="flex gap-4 justify-center md:justify-start text-xs text-slate-500 font-semibold pt-1">
                  <span>⏰ {recipeOfDay.prepTime} мин</span>
                  <span>★ {recipeOfDay.rating}</span>
                  <span>🔥 {recipeOfDay.calories} ккал</span>
                </div>
              </div>
              <button onClick={() => handleSelectRecipe(recipeOfDay)} className="w-full md:w-auto px-6 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold transition-colors shadow-lg shadow-purple-500/20">
                Приготовить
              </button>
            </motion.div>
          )}

          {/* Landing Grid Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Sec 1: Popular */}
            <div className="flex flex-col gap-4">
              <h2 className="font-display font-bold text-xl tracking-tight flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500/10" />
                <span>Популярные шедевры</span>
              </h2>
              <div className="flex flex-col gap-3.5">
                {popularRecipes.map(recipe => (
                  <div 
                    key={recipe.id}
                    onClick={() => handleSelectRecipe(recipe)}
                    className="p-3.5 rounded-3xl border border-slate-200/40 dark:border-slate-800/40 glass-effect hover:border-brand-orange/30 transition-all cursor-pointer flex gap-4 items-center"
                  >
                    <img src={getRecipeImage(recipe.title, recipe.category, recipe.image)} alt={recipe.title} className="w-18 h-18 rounded-2xl object-cover" />
                    <div className="flex-grow">
                      <span className="text-[10px] uppercase font-black tracking-widest text-brand-orange block mb-0.5">{recipe.cuisine}</span>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-white leading-snug">{recipe.title}</h4>
                      <div className="flex items-center gap-2.5 mt-1.5 text-xs text-slate-450 font-semibold">
                        <span className="flex items-center gap-1">★ {recipe.rating}</span>
                        <span>•</span>
                        <span>{recipe.prepTime} мин</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 mr-2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Sec 2: New */}
            <div className="flex flex-col gap-4">
              <h2 className="font-display font-bold text-xl tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-orange" />
                <span>Новинки от шефов</span>
              </h2>
              <div className="flex flex-col gap-3.5">
                {newRecipes.map(recipe => (
                  <div 
                    key={recipe.id}
                    onClick={() => handleSelectRecipe(recipe)}
                    className="p-3.5 rounded-3xl border border-slate-200/40 dark:border-slate-800/40 glass-effect hover:border-brand-orange/30 transition-all cursor-pointer flex gap-4 items-center"
                  >
                    <img src={getRecipeImage(recipe.title, recipe.category, recipe.image)} alt={recipe.title} className="w-18 h-18 rounded-2xl object-cover" />
                    <div className="flex-grow">
                      <span className="text-[10px] uppercase font-black tracking-widest text-brand-orange block mb-0.5">{recipe.category}</span>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-white leading-snug">{recipe.title}</h4>
                      <div className="flex items-center gap-2.5 mt-1.5 text-xs text-slate-450 font-semibold">
                        <span className="flex items-center gap-1">★ {recipe.rating}</span>
                        <span>•</span>
                        <span>{recipe.prepTime} мин</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 mr-2" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Double Column (Weekly Hits + Views list) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Weekly Hits */}
            <div className="flex flex-col gap-4">
              <h2 className="font-display font-bold text-xl tracking-tight flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-500" />
                <span>Хиты недели</span>
              </h2>
              <div className="flex flex-col gap-3.5">
                {weeklyHits.map(recipe => (
                  <div 
                    key={recipe.id}
                    onClick={() => handleSelectRecipe(recipe)}
                    className="p-3.5 rounded-3xl border border-slate-200/40 dark:border-slate-800/40 glass-effect hover:border-brand-orange/30 transition-all cursor-pointer flex gap-4 items-center"
                  >
                    <img src={getRecipeImage(recipe.title, recipe.category, recipe.image)} alt={recipe.title} className="w-18 h-18 rounded-2xl object-cover" />
                    <div className="flex-grow">
                      <span className="text-[10px] uppercase font-black tracking-widest text-brand-orange block mb-0.5">{recipe.cuisine}</span>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-white leading-snug">{recipe.title}</h4>
                      <div className="flex items-center gap-2.5 mt-1.5 text-xs text-slate-450 font-semibold">
                        <span className="flex items-center gap-1">★ {recipe.rating}</span>
                        <span>•</span>
                        <span>{recipe.prepTime} мин</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 mr-2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Most Viewed */}
            <div className="flex flex-col gap-4">
              <h2 className="font-display font-bold text-xl tracking-tight flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-500" />
                <span>Самые просматриваемые</span>
              </h2>
              <div className="flex flex-col gap-3.5">
                {mostViewed.map(recipe => (
                  <div 
                    key={recipe.id}
                    onClick={() => handleSelectRecipe(recipe)}
                    className="p-3.5 rounded-3xl border border-slate-200/40 dark:border-slate-800/40 glass-effect hover:border-brand-orange/30 transition-all cursor-pointer flex gap-4 items-center"
                  >
                    <img src={getRecipeImage(recipe.title, recipe.category, recipe.image)} alt={recipe.title} className="w-18 h-18 rounded-2xl object-cover" />
                    <div className="flex-grow">
                      <span className="text-[10px] uppercase font-black tracking-widest text-brand-orange block mb-0.5">{recipe.category}</span>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-white leading-snug">{recipe.title}</h4>
                      <div className="flex items-center gap-2.5 mt-1.5 text-xs text-slate-450 font-semibold">
                        <span className="flex items-center gap-1">★ {recipe.rating}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {recipe.views}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 mr-2" />
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 2. ADVANCED RECIPE SEARCH VIEW */}
      {activePage === 'search' && (
        <div className="flex flex-col gap-6">
          <SearchPanel
            filters={filters}
            onChangeFilters={(f) => {
              setFilters(f);
              triggerShimmer();
            }}
            onReset={handleResetFilters}
            availableCuisines={availableCuisines}
            availableCategories={availableCategories}
            totalResults={searchResults.length}
          />

          {/* Recipes Listing (Cards Grid or Shimmer state) */}
          <div className="mt-4">
            {loading ? (
              <SkeletonList count={6} />
            ) : searchResults.length === 0 ? (
              <div className="text-center py-20 glass-effect rounded-[32px] border border-slate-200/50 dark:border-slate-800/50 max-w-xl mx-auto mt-6">
                <ShieldAlert className="w-12 h-12 text-brand-orange/60 mx-auto mb-4" />
                <h3 className="font-display font-bold text-xl mb-2">Рецепты не найдены</h3>
                <p className="text-sm text-slate-450 px-6">
                  Мы не нашли совпадений по вашим критериям. Попробуйте сбросить фильтры или ввести другие ингредиенты.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-6 px-6 py-2.5 rounded-full bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold text-xs shadow-md transition-colors"
                >
                  Сбросить все фильтры
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map(recipe => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    isFavorite={profile.favorites.includes(recipe.id)}
                    onSelect={handleSelectRecipe}
                    onToggleFavorite={handleToggleFavoriteFromCard}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. RECIPE DETAIL PAGE VIEW */}
      {activePage === 'recipe' && selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          isFavorite={profile.favorites.includes(selectedRecipe.id)}
          user={user}
          onToggleFavorite={handleToggleFavorite}
          onBack={() => {
            setActivePage('search');
            triggerShimmer();
          }}
          onSelectRecipe={handleSelectRecipe}
          onEditRecipe={(recipe) => {
            setEditingRecipe(recipe);
            setActivePage('create-recipe');
          }}
          onDeleteRecipe={handleRecipeDelete}
          addToast={addToast}
          onAddToShoppingList={addIngredientsToShopping}
          onMarkAsCooked={handleMarkCooked}
        />
      )}

      {/* 4. USER PROFILE VIEW */}
      {activePage === 'profile' && (
        <UserProfile
          profile={profile}
          recipes={recipes}
          user={user}
          onUpdateProfile={updateProfileAndSync}
          onSelectRecipe={handleSelectRecipe}
          onRunSearchQuery={handleRunSearchQuery}
          onEditRecipe={(recipe) => {
            setEditingRecipe(recipe);
            setActivePage('create-recipe');
          }}
          onDeleteRecipe={handleRecipeDelete}
          addToast={addToast}
        />
      )}

      {/* 5. CREATE OR EDIT RECIPE VIEW */}
      {activePage === 'create-recipe' && (
        <RecipeForm
          recipe={editingRecipe}
          onSubmit={handleRecipeSubmit}
          onCancel={() => {
            setEditingRecipe(null);
            setActivePage('home');
          }}
          addToast={addToast}
        />
      )}

      {/* 6. ADMIN DASHBOARD VIEW */}
      {activePage === 'admin' && (
        <AdminPanel
          currentUserId={user.id}
          addToast={addToast}
        />
      )}

      {/* 7. MEAL PLANNER VIEW */}
      {activePage === 'meal-planner' && (
        <MealPlanner
          plan={mealPlan}
          onUpdatePlan={setMealPlan}
          onSelectRecipeForSlot={(day, meal) => setMealSlotTarget({ day, meal })}
          allRecipes={recipes}
        />
      )}

      {/* 8. CALORIE DASHBOARD VIEW */}
      {activePage === 'calories' && (
        <CalorieDashboard
          todayLog={todayLog}
          weekLogs={weekLogs}
          allRecipes={recipes}
          calorieGoal={calorieGoal}
          onAddEntry={handleAddCalorieEntry}
          onRemoveEntry={handleRemoveCalorieEntry}
          onSetGoal={setCalorieGoal}
        />
      )}

      {/* 9. ACHIEVEMENTS VIEW */}
      {activePage === 'achievements' && (
        <AchievementsPanel
          streak={streak}
          badges={badges}
          totalRecipes={streak.totalCooked}
        />
      )}

      {/* 10. SHOPPING LIST VIEW */}
      {activePage === 'shopping' && (
        <ShoppingListPanel
          items={shoppingItems}
          onUpdateItems={setShoppingItems}
          onClose={() => setActivePage('home')}
        />
      )}

      {/* 11. METHODICAL MANUAL VIEW */}
      {activePage === 'manual' && (
        <MethodicalManual />
      )}

      {/* AI Chef Assistant Floating Chat */}
      <AIChad onOpenRecipe={handleOpenRecipeById} />

      {/* Toast Notification container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </Layout>
    </>
  );
}

