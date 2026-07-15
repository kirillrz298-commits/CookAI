import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Star, Flame, Eye, Heart } from 'lucide-react';
import type { Recipe } from '../types';
import { getRecipeImage } from '../utils/recipeImage';

interface RecipeCardProps {
  recipe: Recipe;
  isFavorite: boolean;
  onSelect: (recipe: Recipe) => void;
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ 
  recipe, 
  isFavorite, 
  onSelect, 
  onToggleFavorite 
}) => {
  // Difficulty translations and colors
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -6, scale: 1.01 }}
      onClick={() => onSelect(recipe)}
      className="glass-effect rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-[440px] cursor-pointer group border relative"
    >
      {/* Recipe Image & Overlay Buttons */}
      <div className="h-52 w-full overflow-hidden relative">
        <img 
          src={getRecipeImage(recipe.title, recipe.category, recipe.image)} 
          alt={recipe.title} 
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Dark overlay gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60" />

        {/* Favorite Button */}
        <button
          onClick={(e) => onToggleFavorite(e, recipe.id)}
          className="absolute top-4 right-4 p-2.5 rounded-full glass-effect border border-white/20 hover:scale-110 transition-transform duration-200 shadow-md group/fav z-10"
        >
          <Heart 
            className={`w-5 h-5 transition-colors ${
              isFavorite 
                ? 'fill-brand-orange text-brand-orange animate-heart-pop' 
                : 'text-white group-hover/fav:text-brand-orange/80'
            }`} 
          />
        </button>

        {/* Cuisines & Category Labels */}
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
          <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-brand-orange text-white shadow-sm">
            {recipe.category}
          </span>
          <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-brand-dark/80 backdrop-blur-md text-white border border-white/10">
            {recipe.cuisine}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex flex-col justify-between flex-grow">
        <div>
          {/* Title */}
          <h3 className="font-display font-bold text-lg md:text-xl line-clamp-1 group-hover:text-brand-orange transition-colors duration-200 mb-2">
            {recipe.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
            {recipe.description}
          </p>
        </div>

        <div>
          {/* Divider */}
          <div className="h-[1px] w-full bg-slate-200/60 dark:bg-slate-800/60 my-3" />

          {/* Cooking stats footer */}
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 font-medium">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-brand-orange" />
              <span>{recipe.prepTime} мин</span>
            </div>

            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-brand-yellow fill-brand-yellow" />
              <span className="font-bold text-slate-700 dark:text-slate-200">{recipe.rating}</span>
              <span className="opacity-75">({recipe.reviewsCount})</span>
            </div>

            <div className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold uppercase ${difficultyColor[recipe.difficulty]}`}>
              {difficultyLabel[recipe.difficulty]}
            </div>
          </div>

          {/* Additional details */}
          <div className="flex justify-between items-center text-[11px] text-slate-400 dark:text-slate-500 mt-3 pt-2 border-t border-dashed border-slate-200/50 dark:border-slate-800/50">
            <div className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-brand-orange" />
              <span>{recipe.calories} ккал / порция</span>
            </div>
            <div className="flex items-center gap-0.5">
              <Eye className="w-3.5 h-3.5" />
              <span>{recipe.views} просмотров</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
