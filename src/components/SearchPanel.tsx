import React from 'react';
import { Search, SlidersHorizontal, RotateCcw, Flame, Clock, ChefHat, Sparkles } from 'lucide-react';

interface SearchFilters {
  query: string;
  cuisine: string;
  category: string;
  difficulty: string;
  maxTime: number;
  maxCalories: number;
  sortBy: string;
  ingredients: string[];
}

interface SearchPanelProps {
  filters: SearchFilters;
  onChangeFilters: (filters: SearchFilters) => void;
  onReset: () => void;
  availableCuisines: string[];
  availableCategories: string[];
  totalResults: number;
}

const POPULAR_INGREDIENTS = [
  'Картофель', 'Говядина', 'Курица', 'Бекон', 'Сыр', 
  'Шампиньоны', 'Сливки', 'Лимон', 'Лосось', 'Нут', 'Авокадо'
];

export const SearchPanel: React.FC<SearchPanelProps> = ({
  filters,
  onChangeFilters,
  onReset,
  availableCuisines,
  availableCategories,
  totalResults
}) => {
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeFilters({ ...filters, query: e.target.value });
  };

  const handleSelectCuisine = (cuisine: string) => {
    onChangeFilters({ ...filters, cuisine: filters.cuisine === cuisine ? '' : cuisine });
  };

  const handleSelectCategory = (category: string) => {
    onChangeFilters({ ...filters, category: filters.category === category ? '' : category });
  };

  const handleSelectDifficulty = (difficulty: string) => {
    onChangeFilters({ ...filters, difficulty: filters.difficulty === difficulty ? '' : difficulty });
  };

  const handleToggleIngredient = (ing: string) => {
    const isSelected = filters.ingredients.includes(ing);
    const updatedIngredients = isSelected
      ? filters.ingredients.filter(i => i !== ing)
      : [...filters.ingredients, ing];
    
    onChangeFilters({ ...filters, ingredients: updatedIngredients });
  };

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Top Search Bar & Sort Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        {/* Main Search Input */}
        <div className="relative flex-grow">
          <input
            type="text"
            value={filters.query}
            onChange={handleQueryChange}
            placeholder="Поиск по названию, ингредиентам (например: картошка, говядина)..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm md:text-base focus:outline-none focus:border-brand-orange shadow-sm font-medium transition-all"
          />
          <Search className="absolute left-4.5 top-4 w-5 h-5 text-slate-400" />
        </div>

        {/* Filter Toggle & Sort Dropdown */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`md:hidden flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border font-semibold text-sm transition-all shadow-sm ${
              showMobileFilters 
                ? 'bg-brand-orange text-white border-brand-orange' 
                : 'glass-effect border-slate-200/50 dark:border-slate-800/50 text-slate-600 dark:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-4.5 h-4.5" />
            <span>Фильтры</span>
          </button>

          <select
            value={filters.sortBy}
            onChange={(e) => onChangeFilters({ ...filters, sortBy: e.target.value })}
            className="glass-effect border border-slate-200/50 dark:border-slate-800/50 rounded-2xl px-4 py-3.5 text-sm font-semibold focus:outline-none text-slate-700 dark:text-slate-200 shadow-sm"
          >
            <option value="default">Сортировка: По умолчанию</option>
            <option value="rating">По рейтингу</option>
            <option value="views">По популярности</option>
            <option value="timeAsc">Быстрые сначала</option>
            <option value="caloriesAsc">Низкокалорийные сначала</option>
          </select>
        </div>
      </div>

      {/* Ingredient quick tags */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mr-1">
          Популярные ингредиенты:
        </span>
        {POPULAR_INGREDIENTS.map(ing => {
          const isSelected = filters.ingredients.includes(ing);
          return (
            <button
              key={ing}
              onClick={() => handleToggleIngredient(ing)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-brand-orange text-white border-brand-orange shadow-sm scale-105'
                  : 'bg-white/40 dark:bg-slate-900/40 border-slate-200/40 dark:border-slate-800/40 text-slate-500 hover:border-brand-orange dark:hover:border-brand-orange'
              }`}
            >
              {ing}
            </button>
          );
        })}
      </div>

      {/* Main Filter Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side Filters (Collapsible on mobile) */}
        <div className={`lg:col-span-3 lg:flex flex-col gap-5 ${showMobileFilters ? 'flex' : 'hidden'}`}>
          <div className="glass-effect rounded-3xl p-5 border shadow-md flex flex-col gap-6">
            
            {/* Header / Reset */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-200/40 dark:border-slate-800/40">
              <span className="font-display font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4" /> Фильтры
              </span>
              <button
                onClick={onReset}
                className="text-xs font-semibold text-slate-400 hover:text-brand-orange transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Сбросить
              </button>
            </div>

            {/* Cuisines filter */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-orange" /> Кухни
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {availableCuisines.map(cuisine => {
                  const isSelected = filters.cuisine === cuisine;
                  return (
                    <button
                      key={cuisine}
                      onClick={() => handleSelectCuisine(cuisine)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-brand-orange/10 border-brand-orange text-brand-orange font-bold'
                          : 'bg-transparent border-slate-200/50 dark:border-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {cuisine}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Categories filter */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Категории</h4>
              <div className="flex flex-wrap gap-1.5">
                {availableCategories.map(cat => {
                  const isSelected = filters.category === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => handleSelectCategory(cat)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-brand-orange/10 border-brand-orange text-brand-orange font-bold'
                          : 'bg-transparent border-slate-200/50 dark:border-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty filter */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5 text-brand-orange" /> Сложность
              </h4>
              <div className="grid grid-cols-3 gap-1.5">
                {['Easy', 'Medium', 'Hard'].map((diff) => {
                  const isSelected = filters.difficulty === diff;
                  const label = diff === 'Easy' ? 'Легко' : diff === 'Medium' ? 'Средне' : 'Сложно';
                  return (
                    <button
                      key={diff}
                      onClick={() => handleSelectDifficulty(diff)}
                      className={`py-1.5 rounded-xl text-xs font-medium border text-center transition-all ${
                        isSelected
                          ? 'bg-brand-orange/10 border-brand-orange text-brand-orange font-bold'
                          : 'bg-transparent border-slate-200/50 dark:border-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preparation time limit slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-orange" /> Время готовки
                </h4>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{filters.maxTime} мин</span>
              </div>
              <input
                type="range"
                min="15"
                max="120"
                step="5"
                value={filters.maxTime}
                onChange={(e) => onChangeFilters({ ...filters, maxTime: parseInt(e.target.value) })}
                className="w-full accent-brand-orange cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>15 мин</span>
                <span>120 мин</span>
              </div>
            </div>

            {/* Max Calories slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-brand-orange" /> Калорийность
                </h4>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{filters.maxCalories} ккал</span>
              </div>
              <input
                type="range"
                min="100"
                max="800"
                step="20"
                value={filters.maxCalories}
                onChange={(e) => onChangeFilters({ ...filters, maxCalories: parseInt(e.target.value) })}
                className="w-full accent-brand-orange cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>100 ккал</span>
                <span>800 ккал</span>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side Content Results (Grid of cards) placeholder/controller */}
        <div className="lg:col-span-9 flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-sm font-semibold text-slate-500">
              Найдено рецептов: <span className="text-slate-800 dark:text-slate-100 font-bold">{totalResults}</span>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
