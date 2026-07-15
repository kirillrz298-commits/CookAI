import React from 'react';
import { ChefHat, Heart, Moon, Sun, Compass, Shield, PlusCircle, LogOut, Calendar, Flame, Trophy, ShoppingCart } from 'lucide-react';
import type { UserProfile, UserSession } from '../types';

type PageType = 'home' | 'search' | 'recipe' | 'profile' | 'create-recipe' | 'admin' | 'meal-planner' | 'calories' | 'achievements' | 'shopping';

interface LayoutProps {
  children: React.ReactNode;
  profile: UserProfile;
  user: UserSession | null;
  activePage: PageType;
  onNavigate: (page: Exclude<PageType, 'recipe'>) => void;
  onToggleTheme: () => void;
  onLogout: () => void;
  shoppingCount?: number;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  profile,
  user,
  activePage,
  onNavigate,
  onToggleTheme,
  onLogout,
  shoppingCount = 0,
}) => {
  const isAdmin = user?.role === 'admin';

  const navItem = (page: Exclude<PageType, 'recipe'>, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => onNavigate(page)}
      className={`text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
        activePage === page
          ? 'text-brand-orange'
          : 'text-slate-500 dark:text-slate-300 hover:text-brand-orange dark:hover:text-brand-orange'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 glass-effect border-b border-slate-200/40 dark:border-slate-800/40 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div 
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-2xl bg-brand-orange flex items-center justify-center text-white shadow-md shadow-brand-orange/20 group-hover:scale-105 transition-transform">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-display font-black text-lg tracking-tight bg-gradient-to-r from-brand-orange to-brand-yellow bg-clip-text text-transparent block">
                CookBook
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block -mt-1">
                AI Library
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-5">
            {navItem('home', 'Главная', null)}
            {navItem('search', 'Поиск', <Compass className="w-4 h-4" />)}
            {navItem('meal-planner', 'Меню', <Calendar className="w-4 h-4" />)}
            {navItem('calories', 'Калории', <Flame className="w-4 h-4" />)}
            {navItem('achievements', 'Достижения', <Trophy className="w-4 h-4" />)}
            {navItem('create-recipe', 'Свой рецепт', <PlusCircle className="w-4 h-4" />)}
            {navItem('profile', `Избранное (${profile.favorites.length})`, <Heart className="w-4 h-4 text-brand-orange fill-brand-orange/10" />)}
            {isAdmin && navItem('admin', 'Админка', <Shield className="w-4 h-4" />)}
          </nav>

          {/* User controls */}
          <div className="flex items-center gap-2">

            {/* Shopping cart */}
            <button
              onClick={() => onNavigate('shopping')}
              className={`relative p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${activePage === 'shopping' ? 'text-brand-orange' : 'text-slate-500 dark:text-slate-200'}`}
              title="Список покупок"
            >
              <ShoppingCart className="w-5 h-5" />
              {shoppingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-orange text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {shoppingCount > 9 ? '9+' : shoppingCount}
                </span>
              )}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-200 cursor-pointer"
              title="Переключить тему"
            >
              {profile.settings.darkMode ? (
                <Sun className="w-5 h-5 text-amber-500" />
              ) : (
                <Moon className="w-5 h-5 text-slate-500" />
              )}
            </button>

            {/* Profile button */}
            <button
              onClick={() => onNavigate('profile')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                activePage === 'profile'
                  ? 'bg-brand-orange/10 border-brand-orange text-brand-orange font-bold'
                  : 'glass-effect border-slate-200/50 dark:border-slate-800/50 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <img 
                src={profile.avatar} 
                alt={profile.name} 
                className="w-6 h-6 rounded-full object-cover border border-white/20" 
              />
              <span className="text-xs font-semibold hidden sm:inline">{profile.name}</span>
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="p-2.5 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
              title="Выйти из аккаунта"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <nav className="md:hidden flex items-center justify-around px-2 py-2 border-t border-slate-200/30 dark:border-slate-800/30">
          {[
            { page: 'home' as const, label: 'Главная', icon: '🏠' },
            { page: 'search' as const, label: 'Поиск', icon: '🔍' },
            { page: 'meal-planner' as const, label: 'Меню', icon: '📅' },
            { page: 'calories' as const, label: 'Калории', icon: '🔥' },
            { page: 'achievements' as const, label: 'Трофеи', icon: '🏆' },
            { page: 'profile' as const, label: 'Профиль', icon: '❤️' },
          ].map(item => (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors ${
                activePage === item.page ? 'text-brand-orange' : 'text-slate-400'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[9px] font-bold">{item.label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/40 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 py-10 transition-colors print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-brand-orange" />
            <span className="font-display font-extrabold text-sm tracking-tight">
              CookBook <span className="text-brand-orange">AI</span>
            </span>
            <span className="text-xs text-slate-400">© 2026. Все права защищены.</span>
          </div>
          <div className="flex gap-6 text-xs font-semibold text-slate-400">
            <button onClick={() => onNavigate('home')} className="hover:text-brand-orange transition-colors cursor-pointer">Главная</button>
            <button onClick={() => onNavigate('search')} className="hover:text-brand-orange transition-colors cursor-pointer">Поиск</button>
            <button onClick={() => onNavigate('meal-planner')} className="hover:text-brand-orange transition-colors cursor-pointer">Планировщик</button>
            <button onClick={() => onNavigate('achievements')} className="hover:text-brand-orange transition-colors cursor-pointer">Достижения</button>
            <button onClick={() => onNavigate('profile')} className="hover:text-brand-orange transition-colors cursor-pointer">Профиль</button>
            {isAdmin && <button onClick={() => onNavigate('admin')} className="hover:text-brand-orange transition-colors cursor-pointer">Админка</button>}
          </div>
        </div>
      </footer>
    </div>
  );
};
