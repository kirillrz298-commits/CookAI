import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Trash2, Check, Copy, Printer, X, Package, Download } from 'lucide-react';
import type { ShoppingListItem } from '../types';

interface ShoppingListProps {
  items: ShoppingListItem[];
  onUpdateItems: (items: ShoppingListItem[]) => void;
  onClose: () => void;
}

const CATEGORY_GROUPS: Record<string, string[]> = {
  '🥩 Мясо и рыба': ['мясо', 'говядина', 'свинина', 'курица', 'рыба', 'лосось', 'тунец', 'фарш', 'индейка', 'креветки'],
  '🥛 Молочные': ['молоко', 'сливки', 'масло', 'сыр', 'творог', 'сметана', 'кефир', 'йогурт', 'яйца'],
  '🥦 Овощи': ['картофель', 'морковь', 'лук', 'чеснок', 'помидор', 'огурец', 'перец', 'баклажан', 'кабачок', 'тыква', 'капуста', 'зелень', 'укроп', 'петрушка'],
  '🍎 Фрукты и ягоды': ['яблоко', 'груша', 'банан', 'апельсин', 'лимон', 'клубника', 'малина', 'черника', 'вишня'],
  '🌾 Крупы и мука': ['рис', 'гречка', 'овсянка', 'мука', 'паста', 'макароны', 'спагетти', 'хлеб'],
  '🧂 Специи и соусы': ['соль', 'перец', 'паприка', 'специи', 'сахар', 'мед', 'уксус', 'соус', 'масло оливковое', 'масло растительное'],
  '🥫 Прочее': [],
};

function getCategory(itemName: string): string {
  const nameLower = itemName.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_GROUPS)) {
    if (keywords.some(kw => nameLower.includes(kw))) return cat;
  }
  return '🥫 Прочее';
}

export const ShoppingListPanel: React.FC<ShoppingListProps> = ({ items, onUpdateItems, onClose }) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('шт');

  const toggleItem = useCallback((id: string) => {
    onUpdateItems(items.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  }, [items, onUpdateItems]);

  const removeItem = useCallback((id: string) => {
    onUpdateItems(items.filter(item => item.id !== id));
  }, [items, onUpdateItems]);

  const clearChecked = useCallback(() => {
    onUpdateItems(items.filter(item => !item.checked));
  }, [items, onUpdateItems]);

  const addItem = useCallback(() => {
    if (!newItemName.trim()) return;
    const newItem: ShoppingListItem = {
      id: `sl-${Date.now()}`,
      name: newItemName.trim(),
      amount: parseFloat(newItemAmount) || 1,
      unit: newItemUnit,
      checked: false,
    };
    onUpdateItems([...items, newItem]);
    setNewItemName('');
    setNewItemAmount('');
  }, [items, newItemName, newItemAmount, newItemUnit, onUpdateItems]);

  const copyToClipboard = () => {
    const text = items.map(item =>
      `${item.checked ? '✓' : '○'} ${item.name} — ${item.amount} ${item.unit}${item.recipeTitle ? ` (${item.recipeTitle})` : ''}`
    ).join('\n');
    navigator.clipboard.writeText(text);
  };

  const printList = () => window.print();

  const exportToFile = async () => {
    const text = items.map(item =>
      `${item.checked ? '[x]' : '[ ]'} ${item.name} — ${item.amount} ${item.unit}${item.recipeTitle ? ` (${item.recipeTitle})` : ''}`
    ).join('\n');
    
    if (window.electronAPI) {
      try {
        const path = await window.electronAPI.saveFile('shopping-list.txt', text);
        if (path) {
          alert(`Список покупок успешно сохранен в файл:\n${path}`);
        }
      } catch (err: any) {
        alert(`Ошибка при сохранении файла: ${err.message}`);
      }
    } else {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'shopping-list.txt';
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  // Group items by category
  const grouped: Record<string, ShoppingListItem[]> = {};
  for (const item of items) {
    const cat = getCategory(item.name);
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }

  const checkedCount = items.filter(i => i.checked).length;

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col shadow-2xl print:static print:shadow-none"
    >
      <div className="flex flex-col h-full bg-slate-900/98 backdrop-blur-xl border-l border-slate-700/50">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">Список покупок</h2>
              <p className="text-xs text-slate-400">{items.length} товаров · {checkedCount} куплено</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={copyToClipboard} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors" title="Скопировать">
              <Copy className="w-4 h-4" />
            </button>
            <button onClick={exportToFile} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors" title="Скачать/Экспортировать как файл">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={printList} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors" title="Печать">
              <Printer className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {items.length > 0 && (
          <div className="px-5 py-2 print:hidden">
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-green-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(checkedCount / items.length) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        )}

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <Package className="w-16 h-16 text-slate-600 mb-4" />
              <p className="text-slate-400 font-semibold">Список пуст</p>
              <p className="text-slate-500 text-sm mt-1">Откройте рецепт и нажмите<br/>«В список покупок»</p>
            </div>
          ) : (
            Object.entries(grouped).map(([category, catItems]) => (
              <div key={category}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{category}</p>
                <div className="space-y-1.5">
                  <AnimatePresence>
                    {catItems.map(item => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 40 }}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          item.checked
                            ? 'bg-slate-800/30 border-slate-700/30 opacity-50'
                            : 'bg-slate-800/60 border-slate-700/50'
                        }`}
                      >
                        <button
                          onClick={() => toggleItem(item.id)}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            item.checked ? 'bg-green-500 border-green-500' : 'border-slate-500 hover:border-green-400'
                          }`}
                        >
                          {item.checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-medium text-white ${item.checked ? 'line-through text-slate-500' : ''}`}>
                            {item.name}
                          </span>
                          {item.recipeTitle && (
                            <p className="text-[10px] text-slate-500">{item.recipeTitle}</p>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                          {item.amount} {item.unit}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 rounded-lg hover:bg-red-500/20 text-slate-600 hover:text-red-400 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add item form */}
        <div className="px-5 py-4 border-t border-slate-700/50 print:hidden">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
              placeholder="Добавить продукт..."
              className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange"
            />
            <input
              type="number"
              value={newItemAmount}
              onChange={e => setNewItemAmount(e.target.value)}
              placeholder="1"
              className="w-16 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange"
            />
            <select
              value={newItemUnit}
              onChange={e => setNewItemUnit(e.target.value)}
              className="w-16 bg-slate-800 border border-slate-600 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
            >
              {['шт', 'г', 'кг', 'мл', 'л', 'ст.л', 'ч.л'].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <button
              onClick={addItem}
              className="w-10 h-10 rounded-xl bg-brand-orange hover:bg-brand-orange/90 flex items-center justify-center text-white transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          {checkedCount > 0 && (
            <button
              onClick={clearChecked}
              className="w-full py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Удалить купленные ({checkedCount})
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
