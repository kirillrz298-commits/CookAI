import React from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, History, Search, Settings, Moon, Sun, Bell, 
  Trash2, BookOpen, Clock, Star, ChevronRight, UserCheck, Edit
} from 'lucide-react';
import type { Recipe, UserProfile as UserProfileType, UserSession } from '../types';
import { getRecipeImage } from '../utils/recipeImage';

interface UserProfileProps {
  profile: UserProfileType;
  recipes: Recipe[];
  user: UserSession | null;
  onUpdateProfile: (profile: UserProfileType) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onRunSearchQuery: (query: string) => void;
  onEditRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (recipeId: string) => void;
  addToast: (message: string, type: 'success' | 'info' | 'warning') => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  profile,
  recipes,
  user,
  onUpdateProfile,
  onSelectRecipe,
  onRunSearchQuery,
  onEditRecipe,
  onDeleteRecipe,
  addToast
}) => {
  const [activeTab, setActiveTab] = React.useState<'favorites' | 'history' | 'my-recipes' | 'settings'>('favorites');

  // Fetch full recipe objects from their IDs using the database records
  const favoriteRecipes = recipes.filter(r => profile.favorites.includes(r.id));
  const viewedRecipes = recipes.filter(r => profile.viewHistory.includes(r.id));
  const myRecipes = recipes.filter(r => r.author_id === user?.id);

  const handleToggleTheme = () => {
    const nextDark = !profile.settings.darkMode;
    onUpdateProfile({
      ...profile,
      settings: { ...profile.settings, darkMode: nextDark }
    });
    addToast(nextDark ? "Включена темная тема" : "Включена светлая тема", "info");
  };

  const handleToggleNotifications = () => {
    const nextNotif = !profile.settings.notificationsEnabled;
    onUpdateProfile({
      ...profile,
      settings: { ...profile.settings, notificationsEnabled: nextNotif }
    });
    addToast(nextNotif ? "Уведомления включены" : "Уведомления выключены", "info");
  };

  const handleClearHistory = (type: 'search' | 'views') => {
    if (type === 'search') {
      onUpdateProfile({ ...profile, searchHistory: [] });
      addToast("История поиска очищена", "success");
    } else {
      onUpdateProfile({ ...profile, viewHistory: [] });
      addToast("История просмотров очищена", "success");
    }
  };

  const handleRemoveFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateProfile({
      ...profile,
      favorites: profile.favorites.filter(favId => favId !== id)
    });
    addToast("Рецепт удален из избранного", "info");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto pb-16"
    >
      {/* Top Banner and Avatar */}
      <div className="glass-effect rounded-3xl p-6 md:p-8 border shadow-lg mb-8 relative overflow-hidden">
        {/* Background gradient decor */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-bl from-brand-orange/10 to-brand-yellow/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="relative">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-md"
            />
            <div className="absolute bottom-1 right-1 bg-brand-green p-1.5 rounded-full border-2 border-white dark:border-slate-900" title="Профиль шефа активен">
              <UserCheck className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <div className="text-center md:text-left flex-grow">
            <h1 className="font-display font-extrabold text-2xl md:text-3xl mb-1.5">{profile.name}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Любитель кулинарных шедевров & Домашний шеф-повар</p>
            
            {/* Quick Stats badges */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs font-semibold">
              <span className="px-3 py-1.5 rounded-xl bg-brand-orange/10 text-brand-orange border border-brand-orange/10">
                ⭐ Избранных рецептов: {profile.favorites.length}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-brand-green/10 text-brand-green border border-brand-green/10">
                👁️ Просмотрено рецептов: {profile.viewHistory.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-6 justify-center md:justify-start">
        <button
          onClick={() => setActiveTab('favorites')}
          className={`pb-3 font-semibold text-sm transition-all relative flex items-center gap-1.5 ${
            activeTab === 'favorites' ? 'text-brand-orange' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Избранное</span>
          {activeTab === 'favorites' && (
            <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 font-semibold text-sm transition-all relative flex items-center gap-1.5 ${
            activeTab === 'history' ? 'text-brand-orange' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <History className="w-4 h-4" />
          <span>История активности</span>
          {activeTab === 'history' && (
            <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('my-recipes')}
          className={`pb-3 font-semibold text-sm transition-all relative flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'my-recipes' ? 'text-brand-orange' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Мои рецепты ({myRecipes.length})</span>
          {activeTab === 'my-recipes' && (
            <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 font-semibold text-sm transition-all relative flex items-center gap-1.5 ${
            activeTab === 'settings' ? 'text-brand-orange' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Настройки</span>
          {activeTab === 'settings' && (
            <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange" />
          )}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="min-h-[300px]">
        {/* Favorites list tab */}
        {activeTab === 'favorites' && (
          <div className="space-y-4">
            {favoriteRecipes.length === 0 ? (
              <div className="text-center py-16 glass-effect rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
                <Heart className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <h3 className="font-display font-bold text-lg mb-1">Избранных рецептов пока нет</h3>
                <p className="text-sm text-slate-400 max-w-xs mx-auto">
                  Нажмите на иконку сердечка на карточке любого блюда, чтобы сохранить его сюда!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favoriteRecipes.map(fav => (
                  <div
                    key={fav.id}
                    onClick={() => onSelectRecipe(fav)}
                    className="flex gap-4 p-3 rounded-2xl glass-effect border hover:border-brand-orange transition-all cursor-pointer group shadow-sm items-center"
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-800">
                      <img src={fav.image} alt={fav.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>

                    <div className="flex-grow py-0.5 min-w-0">
                      <h4 className="font-semibold text-sm leading-snug line-clamp-1 group-hover:text-brand-orange transition-colors">
                        {fav.title}
                      </h4>
                      <span className="text-[10px] uppercase font-bold text-brand-orange block mb-2">
                        {fav.cuisine} • {fav.category}
                      </span>
                      
                      <div className="flex gap-4 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-0.5"><Clock className="w-3.5 h-3.5 text-brand-orange" /> {fav.prepTime} мин</span>
                        <span className="flex items-center gap-0.5"><Star className="w-3.5 h-3.5 text-brand-yellow fill-brand-yellow" /> {fav.rating}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleRemoveFavorite(fav.id, e)}
                      className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History tab */}
        {activeTab === 'history' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* View history */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display font-bold text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-orange" /> История просмотров
                </h3>
                {viewedRecipes.length > 0 && (
                  <button
                    onClick={() => handleClearHistory('views')}
                    className="text-xs font-semibold text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Очистить
                  </button>
                )}
              </div>

              {viewedRecipes.length === 0 ? (
                <div className="text-center py-10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
                  Вы пока не просматривали рецепты
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                  {viewedRecipes.map(recipe => (
                    <div
                      key={recipe.id}
                      onClick={() => onSelectRecipe(recipe)}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-800/50 cursor-pointer group text-sm border border-transparent hover:border-slate-200/30 transition-all"
                    >
                      <img src={getRecipeImage(recipe.title, recipe.category, recipe.image)} alt={recipe.title} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="min-w-0 flex-grow">
                        <span className="font-semibold block line-clamp-1 group-hover:text-brand-orange transition-colors">{recipe.title}</span>
                        <span className="text-[10px] text-slate-400">{recipe.cuisine} • {recipe.prepTime} мин</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Search History */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display font-bold text-base flex items-center gap-2">
                  <Search className="w-4 h-4 text-brand-orange" /> История поиска
                </h3>
                {profile.searchHistory.length > 0 && (
                  <button
                    onClick={() => handleClearHistory('search')}
                    className="text-xs font-semibold text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Очистить
                  </button>
                )}
              </div>

              {profile.searchHistory.length === 0 ? (
                <div className="text-center py-10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
                  История поиска пуста
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {profile.searchHistory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onRunSearchQuery(item.query)}
                      className="flex justify-between items-center p-3 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 hover:bg-brand-orange/5 dark:hover:bg-brand-orange/5 border border-slate-200/40 dark:border-slate-800/40 hover:border-brand-orange/20 cursor-pointer group text-xs transition-colors"
                    >
                      <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-brand-orange">
                        "{item.query}"
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Recipes tab panel */}
        {activeTab === 'my-recipes' && (
          <div className="glass-effect rounded-3xl p-6 border shadow-md space-y-6">
            <h3 className="font-display font-bold text-base border-b border-slate-200/40 dark:border-slate-800/40 pb-2 flex justify-between items-center">
              <span>Мои кулинарные рецепты</span>
              <span className="text-xs text-slate-400 font-normal">Здесь собраны рецепты, созданные вами</span>
            </h3>

            {myRecipes.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
                Вы еще не добавили ни одного собственного рецепта. Нажмите кнопку «Свой рецепт» в верхнем меню, чтобы начать!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myRecipes.map((r) => (
                  <div 
                    key={r.id} 
                    className="p-3.5 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 bg-white/40 dark:bg-slate-900/40 flex items-center gap-4 hover:border-brand-orange/30 transition-all shadow-xs"
                  >
                    <img 
                      src={r.image} 
                      alt={r.title} 
                      className="w-16 h-16 rounded-xl object-cover cursor-pointer" 
                      onClick={() => onSelectRecipe(r)}
                    />
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="text-[9px] uppercase font-black text-brand-orange">{r.cuisine}</span>
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
                          r.status === 'draft' 
                            ? 'bg-slate-500/10 text-slate-500 border border-slate-500/20' 
                            : 'bg-brand-green/10 text-brand-green border border-brand-green/20'
                        }`}>
                          {r.status === 'draft' ? 'Черновик' : 'Опубликовано'}
                        </span>
                      </div>
                      <h4 
                        className="font-bold text-sm text-slate-800 dark:text-white leading-snug cursor-pointer line-clamp-1 hover:text-brand-orange"
                        onClick={() => onSelectRecipe(r)}
                      >
                        {r.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 block mt-0.5">👁️ {r.views} просмотров</span>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => onEditRecipe(r)}
                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/5 rounded-xl transition-all cursor-pointer"
                        title="Редактировать рецепт"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Вы уверены, что хотите удалить рецепт "${r.title}"?`)) {
                            onDeleteRecipe(r.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all cursor-pointer"
                        title="Удалить рецепт"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings tab */}
        {activeTab === 'settings' && (
          <div className="glass-effect rounded-3xl p-6 border shadow-md max-w-md mx-auto space-y-6">
            <h3 className="font-display font-bold text-base border-b border-slate-200/40 dark:border-slate-800/40 pb-2">Управление приложением</h3>
            
            {/* Dark Mode toggle */}
            <div className="flex justify-between items-center py-2">
              <div>
                <span className="font-semibold text-sm block">Темная тема</span>
                <span className="text-xs text-slate-400">Переключение визуального режима сайта</span>
              </div>
              <button
                onClick={handleToggleTheme}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 flex items-center ${
                  profile.settings.darkMode ? 'bg-brand-orange justify-end' : 'bg-slate-300 dark:bg-slate-800 justify-start'
                }`}
              >
                <div className="w-4.5 h-4.5 rounded-full bg-white shadow-md flex items-center justify-center">
                  {profile.settings.darkMode ? (
                    <Moon className="w-2.5 h-2.5 text-brand-orange" />
                  ) : (
                    <Sun className="w-2.5 h-2.5 text-amber-500" />
                  )}
                </div>
              </button>
            </div>

            {/* Notifications Toggle */}
            <div className="flex justify-between items-center py-2">
              <div>
                <span className="font-semibold text-sm block">Уведомления</span>
                <span className="text-xs text-slate-400">Получать оповещения о рецептах недели</span>
              </div>
              <button
                onClick={handleToggleNotifications}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 flex items-center ${
                  profile.settings.notificationsEnabled ? 'bg-brand-orange justify-end' : 'bg-slate-300 dark:bg-slate-800 justify-start'
                }`}
              >
                <div className="w-4.5 h-4.5 rounded-full bg-white shadow-md flex items-center justify-center">
                  <Bell className={`w-2.5 h-2.5 ${profile.settings.notificationsEnabled ? 'text-brand-orange' : 'text-slate-400'}`} />
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
