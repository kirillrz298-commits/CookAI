import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Plus, Trash2, Save, FileText, ListTodo, Flame, ChefHat 
} from 'lucide-react';
import type { Recipe, Ingredient } from '../types';

interface RecipeFormProps {
  recipe?: Recipe | null;
  onSubmit: (recipeData: Partial<Recipe>) => void;
  onCancel: () => void;
  addToast: (message: string, type: 'success' | 'info' | 'warning') => void;
}

export const RecipeForm: React.FC<RecipeFormProps> = ({
  recipe,
  onSubmit,
  onCancel,
  addToast
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'specs' | 'ingredients'>('info');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [prepTime, setPrepTime] = useState(30);
  const [servings, setServings] = useState(2);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [calories, setCalories] = useState(250);
  const [protein, setProtein] = useState(10);
  const [fat, setFat] = useState(10);
  const [carbs, setCarbs] = useState(30);
  const [cuisine, setCuisine] = useState('Русская');
  const [category, setCategory] = useState('Обеды');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [categoriesList, setCategoriesList] = useState<string[]>(['Завтраки', 'Обеды', 'Ужины', 'Супы', 'Десерты', 'Выпечка']);

  // Dynamic category fetch
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCategoriesList(data.map(c => c.name));
        }
      })
      .catch(() => {});
  }, []);

  // Arrays states
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', amount: 0, unit: 'г' }
  ]);
  const [steps, setSteps] = useState<string[]>(['']);
  const [tips, setTips] = useState<string[]>(['']);

  // Pre-fill fields if in edit mode
  useEffect(() => {
    if (recipe) {
      setTitle(recipe.title);
      setDescription(recipe.description);
      setImage(recipe.image);
      setPrepTime(recipe.prepTime);
      setServings(recipe.servings);
      setDifficulty(recipe.difficulty);
      setCalories(recipe.calories);
      setProtein(recipe.macros.protein);
      setFat(recipe.macros.fat);
      setCarbs(recipe.macros.carbs);
      setCuisine(recipe.cuisine);
      setCategory(recipe.category);
      setStatus(recipe.status || 'published');
      setIngredients(recipe.ingredients.length > 0 ? [...recipe.ingredients] : [{ name: '', amount: 0, unit: 'г' }]);
      setSteps(recipe.steps.length > 0 ? [...recipe.steps] : ['']);
      setTips(recipe.tips.length > 0 ? [...recipe.tips] : ['']);
    }
  }, [recipe]);

  // Ingredients handlers
  const handleIngredientChange = (idx: number, field: keyof Ingredient, val: any) => {
    const updated = [...ingredients];
    updated[idx] = { ...updated[idx], [field]: val };
    setIngredients(updated);
  };

  const addIngredientRow = () => {
    setIngredients([...ingredients, { name: '', amount: 0, unit: 'г' }]);
  };

  const removeIngredientRow = (idx: number) => {
    if (ingredients.length === 1) {
      addToast("Необходимо указать хотя бы один ингредиент", "warning");
      return;
    }
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  // Steps handlers
  const handleStepChange = (idx: number, val: string) => {
    const updated = [...steps];
    updated[idx] = val;
    setSteps(updated);
  };

  const addStepRow = () => {
    setSteps([...steps, '']);
  };

  const removeStepRow = (idx: number) => {
    if (steps.length === 1) {
      addToast("Необходимо указать хотя бы один шаг инструкции", "warning");
      return;
    }
    setSteps(steps.filter((_, i) => i !== idx));
  };

  // Tips handlers
  const handleTipChange = (idx: number, val: string) => {
    const updated = [...tips];
    updated[idx] = val;
    setTips(updated);
  };

  const addTipRow = () => {
    setTips([...tips, '']);
  };

  const removeTipRow = (idx: number) => {
    setTips(tips.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!title.trim()) {
      addToast("Укажите название рецепта", "warning");
      return;
    }
    const cleanIngredients = ingredients.filter(ing => ing.name.trim() !== '');
    if (cleanIngredients.length === 0) {
      addToast("Добавьте хотя бы один заполненный ингредиент", "warning");
      return;
    }
    const cleanSteps = steps.filter(step => step.trim() !== '');
    if (cleanSteps.length === 0) {
      addToast("Добавьте хотя бы один заполненный шаг", "warning");
      return;
    }

    const recipeData: Partial<Recipe> = {
      title: title.trim(),
      description: description.trim(),
      image: image.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      prepTime,
      servings,
      difficulty,
      calories,
      macros: { protein, fat, carbs },
      ingredients: cleanIngredients,
      steps: cleanSteps,
      tips: tips.filter(tip => tip.trim() !== ''),
      cuisine,
      category,
      status
    };

    onSubmit(recipeData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-3xl mx-auto pb-16"
    >
      {/* Header card */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display font-extrabold text-2xl md:text-3xl tracking-tight flex items-center gap-2">
          <ChefHat className="w-7 h-7 text-brand-orange" />
          <span>{recipe ? 'Редактировать рецепт' : 'Добавить свой рецепт'}</span>
        </h1>
        <button
          onClick={onCancel}
          className="p-2 rounded-xl glass-effect border hover:text-brand-orange transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs list */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 mb-6 justify-center md:justify-start">
        <button
          onClick={() => setActiveTab('info')}
          className={`pb-3 font-semibold text-sm transition-all relative flex items-center gap-1.5 ${
            activeTab === 'info' ? 'text-brand-orange' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>1. Описание</span>
          {activeTab === 'info' && (
            <motion.div layoutId="formTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange" />
          )}
        </button>
        
        <button
          onClick={() => setActiveTab('specs')}
          className={`pb-3 font-semibold text-sm transition-all relative flex items-center gap-1.5 ${
            activeTab === 'specs' ? 'text-brand-orange' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>2. КБЖУ и время</span>
          {activeTab === 'specs' && (
            <motion.div layoutId="formTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('ingredients')}
          className={`pb-3 font-semibold text-sm transition-all relative flex items-center gap-1.5 ${
            activeTab === 'ingredients' ? 'text-brand-orange' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>3. Ингредиенты & Этапы</span>
          {activeTab === 'ingredients' && (
            <motion.div layoutId="formTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange" />
          )}
        </button>
      </div>

      {/* Main Form Box */}
      <form onSubmit={handleSubmit} className="glass-effect rounded-3xl p-6 md:p-8 border shadow-lg space-y-6">
        
        {/* Tab 1: Info */}
        {activeTab === 'info' && (
          <div className="space-y-5">
            <div>
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1.5 pl-1">Название блюда *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Спагетти Карбонара"
                className="w-full bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
                required
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1.5 pl-1">Краткое описание *</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Расскажите об особенностях блюда, его происхождении или секретах вкуса..."
                className="w-full bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all resize-none"
                required
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1.5 pl-1">Ссылка на фото блюда (изображение)</label>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://images.unsplash.com/photo-... или оставьте пустым"
                className="w-full bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1.5 pl-1">Тип кухни *</label>
                <select
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  className="w-full bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-all"
                >
                  {['Русская', 'Итальянская', 'Грузинская', 'Французская', 'Азиатская', 'Американская', 'Средиземноморская'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1.5 pl-1">Категория *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-all"
                >
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1.5 pl-1">Статус публикации *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-all"
              >
                <option value="published">Опубликовано (доступно всем пользователям)</option>
                <option value="draft">Черновик (видно только мне в личном кабинете)</option>
              </select>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                className="px-6 py-2.5 rounded-xl bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange/90 transition-colors shadow-md flex items-center gap-1.5"
              >
                <span>Далее</span>
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Specs & Macros */}
        {activeTab === 'specs' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1.5 pl-1">Время (минут) *</label>
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={prepTime}
                  onChange={(e) => setPrepTime(Number(e.target.value))}
                  className="w-full bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1.5 pl-1">Порции *</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value))}
                  className="w-full bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1.5 pl-1">Сложность *</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-all"
                >
                  <option value="Easy">Легко</option>
                  <option value="Medium">Средне</option>
                  <option value="Hard">Сложно</option>
                </select>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-brand-orange/5 border border-brand-orange/10 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-1.5 text-brand-orange">
                <Flame className="w-4 h-4" />
                <span>Энергетическая ценность (на 1 порцию)</span>
              </h3>
              
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Калории (ккал)</label>
                  <input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(Number(e.target.value))}
                    className="w-full bg-white/40 dark:bg-slate-900/40 border border-slate-250 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-orange"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Белки (г)</label>
                  <input
                    type="number"
                    value={protein}
                    onChange={(e) => setProtein(Number(e.target.value))}
                    className="w-full bg-white/40 dark:bg-slate-900/40 border border-slate-250 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-orange"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Жиры (г)</label>
                  <input
                    type="number"
                    value={fat}
                    onChange={(e) => setFat(Number(e.target.value))}
                    className="w-full bg-white/40 dark:bg-slate-900/40 border border-slate-250 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-orange"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Углеводы (г)</label>
                  <input
                    type="number"
                    value={carbs}
                    onChange={(e) => setCarbs(Number(e.target.value))}
                    className="w-full bg-white/40 dark:bg-slate-900/40 border border-slate-250 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Назад
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ingredients')}
                className="px-6 py-2.5 rounded-xl bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange/90 transition-colors shadow-md"
              >
                Далее
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Ingredients & Steps */}
        {activeTab === 'ingredients' && (
          <div className="space-y-6">
            
            {/* Ingredients rows */}
            <div className="space-y-3.5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 pb-1.5 border-b border-slate-200/40 dark:border-slate-800/40 flex justify-between items-center">
                <span>Список ингредиентов *</span>
                <button
                  type="button"
                  onClick={addIngredientRow}
                  className="text-xs text-brand-orange hover:text-brand-orange/80 flex items-center gap-1 font-semibold uppercase"
                >
                  <Plus className="w-3.5 h-3.5" /> Добавить
                </button>
              </h3>

              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex gap-2.5 items-center">
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => handleIngredientChange(idx, 'name', e.target.value)}
                    placeholder="Название (например: Мука)"
                    className="flex-grow bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-orange"
                    required
                  />
                  <input
                    type="number"
                    step="any"
                    value={ing.amount || ''}
                    onChange={(e) => handleIngredientChange(idx, 'amount', Number(e.target.value))}
                    placeholder="Кол-во"
                    className="w-20 bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-orange"
                    required
                  />
                  <input
                    type="text"
                    value={ing.unit}
                    onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                    placeholder="ед. изм."
                    className="w-16 bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-orange"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredientRow(idx)}
                    className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Steps rows */}
            <div className="space-y-3.5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 pb-1.5 border-b border-slate-200/40 dark:border-slate-800/40 flex justify-between items-center">
                <span>Инструкция по шагам *</span>
                <button
                  type="button"
                  onClick={addStepRow}
                  className="text-xs text-brand-orange hover:text-brand-orange/80 flex items-center gap-1 font-semibold uppercase"
                >
                  <Plus className="w-3.5 h-3.5" /> Добавить шаг
                </button>
              </h3>

              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-2.5 items-start">
                  <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-display font-bold text-xs flex-shrink-0 mt-1">
                    {idx + 1}
                  </span>
                  <textarea
                    rows={2}
                    value={step}
                    onChange={(e) => handleStepChange(idx, e.target.value)}
                    placeholder={`Шаг ${idx + 1}: Что необходимо сделать...`}
                    className="flex-grow bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-orange resize-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeStepRow(idx)}
                    className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/50 mt-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Tips Rows */}
            <div className="space-y-3.5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 pb-1.5 border-b border-slate-200/40 dark:border-slate-800/40 flex justify-between items-center">
                <span>Полезные советы шеф-повара</span>
                <button
                  type="button"
                  onClick={addTipRow}
                  className="text-xs text-brand-orange hover:text-brand-orange/80 flex items-center gap-1 font-semibold uppercase"
                >
                  <Plus className="w-3.5 h-3.5" /> Добавить совет
                </button>
              </h3>

              {tips.map((tip, idx) => (
                <div key={idx} className="flex gap-2.5 items-center">
                  <input
                    type="text"
                    value={tip}
                    onChange={(e) => handleTipChange(idx, e.target.value)}
                    placeholder="Например: Не взбивайте пюре блендером"
                    className="flex-grow bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-orange"
                  />
                  <button
                    type="button"
                    onClick={() => removeTipRow(idx)}
                    className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Назад
              </button>
              
              <button
                type="submit"
                className="px-8 py-3 rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white font-bold text-sm shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4.5 h-4.5" />
                <span>Сохранить рецепт</span>
              </button>
            </div>
          </div>
        )}

      </form>
    </motion.div>
  );
};
