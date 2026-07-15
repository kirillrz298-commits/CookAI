import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Plus, X, Loader2, Save, Sparkles } from 'lucide-react';
import { generateRecipeFromIngredients, type GeneratedRecipe } from '../services/ai';

interface RecipeGeneratorProps {
  onSaveRecipe: (recipe: GeneratedRecipe) => void;
  onClose: () => void;
}

const CATEGORIES = ['Завтраки', 'Обеды', 'Ужины', 'Супы', 'Десерты', 'Выпечка', 'Паста', 'Пицца', 'Бургеры', 'Салаты', 'Закуски', 'ПП', 'Вегетарианское', 'Гриль'];
const DIFFICULTIES = [{ value: 'Easy', label: '🟢 Легко' }, { value: 'Medium', label: '🟡 Средне' }, { value: 'Hard', label: '🔴 Сложно' }];

export const RecipeGenerator: React.FC<RecipeGeneratorProps> = ({ onSaveRecipe, onClose }) => {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [category, setCategory] = useState('Обеды');
  const [difficulty, setDifficulty] = useState('Easy');
  const [maxTime, setMaxTime] = useState(60);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipe | null>(null);
  const [error, setError] = useState('');

  const addIngredient = () => {
    const val = ingredientInput.trim();
    if (!val || ingredients.includes(val)) return;
    setIngredients(prev => [...prev, val]);
    setIngredientInput('');
  };

  const removeIngredient = (ing: string) => {
    setIngredients(prev => prev.filter(i => i !== ing));
  };

  const handleGenerate = async () => {
    if (ingredients.length === 0) {
      setError('Добавьте хотя бы один ингредиент');
      return;
    }
    setError('');
    setIsGenerating(true);
    setGeneratedRecipe(null);

    const result = await generateRecipeFromIngredients(ingredients, { category, difficulty, maxTime });
    setIsGenerating(false);

    if (result) {
      setGeneratedRecipe(result);
    } else {
      setError('Не удалось сгенерировать рецепт. Попробуйте ещё раз.');
    }
  };

  const COMMON_INGREDIENTS = ['Картофель', 'Яйца', 'Молоко', 'Сыр', 'Курица', 'Говядина', 'Рис', 'Паста', 'Помидоры', 'Лук', 'Чеснок', 'Морковь'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-slate-900 rounded-3xl border border-slate-700/50 overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between bg-gradient-to-r from-purple-600/20 to-brand-orange/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="font-bold text-white">AI Генератор рецептов</h2>
              <p className="text-xs text-slate-400">Введи ингредиенты — ИИ придумает блюдо</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {!generatedRecipe ? (
            <>
              {/* Ingredients */}
              <div>
                <label className="text-sm font-bold text-slate-300 mb-2 block">🥕 Ингредиенты</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={ingredientInput}
                    onChange={e => setIngredientInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
                    placeholder="Введите ингредиент..."
                    className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                  <button
                    onClick={addIngredient}
                    className="px-4 py-2.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition-colors font-bold"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Common ingredients quick-add */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {COMMON_INGREDIENTS.filter(i => !ingredients.includes(i)).map(ing => (
                    <button
                      key={ing}
                      onClick={() => setIngredients(prev => [...prev, ing])}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-400 hover:border-purple-400 hover:text-purple-300 transition-colors"
                    >
                      + {ing}
                    </button>
                  ))}
                </div>

                {/* Selected ingredients */}
                {ingredients.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {ingredients.map(ing => (
                      <motion.span
                        key={ing}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium"
                      >
                        {ing}
                        <button onClick={() => removeIngredient(ing)} className="hover:text-red-400 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </motion.span>
                    ))}
                  </div>
                )}
              </div>

              {/* Preferences */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1.5 block uppercase tracking-wider">Категория</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1.5 block uppercase tracking-wider">Сложность</label>
                  <select
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
                  >
                    {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1.5 block uppercase tracking-wider">Время (мин)</label>
                  <input
                    type="number"
                    value={maxTime}
                    onChange={e => setMaxTime(Number(e.target.value))}
                    min={10} max={180} step={5}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-xl px-4 py-2">{error}</p>}

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-brand-orange text-white font-bold text-base flex items-center justify-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-60 shadow-lg"
              >
                {isGenerating ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> ИИ генерирует рецепт...</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> Сгенерировать рецепт</>
                )}
              </button>
            </>
          ) : (
            /* Generated recipe preview */
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-black text-xl text-white">{generatedRecipe.title}</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold">{generatedRecipe.category}</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{generatedRecipe.description}</p>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Время', value: `${generatedRecipe.prepTime}м` },
                  { label: 'Ккал', value: generatedRecipe.calories },
                  { label: 'Порций', value: generatedRecipe.servings },
                  { label: 'Сложность', value: generatedRecipe.difficulty === 'Easy' ? 'Легко' : generatedRecipe.difficulty === 'Medium' ? 'Средне' : 'Сложно' },
                ].map(s => (
                  <div key={s.label} className="bg-slate-800/50 rounded-xl p-2 text-center">
                    <p className="text-xs text-slate-500 font-bold">{s.label}</p>
                    <p className="text-sm font-black text-white">{s.value}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ингредиенты</p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {generatedRecipe.ingredients.map((ing, i) => (
                    <div key={i} className="flex justify-between text-sm py-1 border-b border-slate-800">
                      <span className="text-white">{ing.name}</span>
                      <span className="text-slate-400">{ing.amount} {ing.unit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Шаги приготовления</p>
                <ol className="space-y-2 max-h-40 overflow-y-auto">
                  {generatedRecipe.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-brand-orange/20 text-brand-orange font-bold flex-shrink-0 flex items-center justify-center text-xs">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setGeneratedRecipe(null)}
                  className="flex-1 py-3 rounded-2xl border border-slate-600 text-slate-400 hover:border-slate-500 font-bold transition-colors"
                >
                  Попробовать ещё
                </button>
                <button
                  onClick={() => { onSaveRecipe(generatedRecipe); onClose(); }}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-brand-orange text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  Сохранить рецепт
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
