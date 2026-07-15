import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, ScrollText, BarChart3, Trash2, Search, Eye, 
  Bot, Clock, Shield, Database, Award, Activity 
} from 'lucide-react';
import type { UserSession, AdminLog, Category } from '../types';
import { 
  apiFetchAdminUsers, apiDeleteAdminUser, apiFetchAdminLogs,
  apiBlockUser, apiChangeUserRole, apiFetchCategories,
  apiCreateCategory, apiDeleteCategory, apiExportDatabase, apiExportDatabaseTxt
} from '../services/api';

interface AdminPanelProps {
  currentUserId: string;
  addToast: (message: string, type: 'success' | 'info' | 'warning') => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUserId, addToast }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'stats' | 'categories'>('users');
  const [usersList, setUsersList] = useState<UserSession[]>([]);
  const [logsList, setLogsList] = useState<AdminLog[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🍳');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const list = await apiFetchAdminUsers();
        setUsersList(list);
      } else if (activeTab === 'logs') {
        const logs = await apiFetchAdminLogs();
        setLogsList(logs);
      } else if (activeTab === 'categories') {
        const list = await apiFetchCategories();
        setCategoriesList(list);
      }
    } catch (err) {
      console.error("Error loading admin data", err);
      addToast("Не удалось загрузить данные админ-панели", "warning");
    } finally {
      setLoading(false);
    }
  }, [activeTab, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteUser = async (userId: string, username: string) => {
    if (userId === currentUserId) {
      addToast("Вы не можете удалить самого себя", "warning");
      return;
    }
    if (userId === 'u-admin') {
      addToast("Нельзя удалить главного администратора системы", "warning");
      return;
    }

    if (window.confirm(`Вы уверены, что хотите окончательно удалить пользователя "${username}"?`)) {
      try {
        await apiDeleteAdminUser(userId);
        addToast(`Пользователь ${username} успешно удален`, "success");
        setUsersList(prev => prev.filter(u => u.id !== userId));
      } catch (err) {
        addToast("Не удалось удалить пользователя", "warning");
      }
    }
  };

  const handleBlockUser = async (userId: string, username: string, currentBlocked: number) => {
    if (userId === currentUserId) {
      addToast("Вы не можете заблокировать самого себя", "warning");
      return;
    }
    if (userId === 'u-admin') {
      addToast("Нельзя заблокировать главного администратора", "warning");
      return;
    }

    const nextBlocked = currentBlocked === 1 ? 0 : 1;
    try {
      await apiBlockUser(userId, nextBlocked === 1);
      addToast(
        nextBlocked === 1 
          ? `Пользователь ${username} успешно заблокирован 🚫` 
          : `Пользователь ${username} успешно разблокирован ✅`,
        "info"
      );
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, blocked: nextBlocked } : u));
    } catch (err) {
      addToast("Не удалось изменить статус блокировки", "warning");
    }
  };

  const handleChangeRole = async (userId: string, role: 'admin' | 'user') => {
    if (userId === currentUserId) {
      addToast("Вы не можете изменить роль самому себе", "warning");
      return;
    }
    if (userId === 'u-admin') {
      addToast("Нельзя изменить роль главного администратора", "warning");
      return;
    }

    try {
      await apiChangeUserRole(userId, role);
      addToast(`Роль пользователя успешно изменена на ${role === 'admin' ? 'Администратор' : 'Пользователь'}`, "success");
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch (err) {
      addToast("Не удалось изменить роль", "warning");
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const created = await apiCreateCategory(newCatName, newCatIcon);
      setCategoriesList(prev => [...prev, created]);
      addToast(`Категория "${newCatName}" успешно добавлена!`, "success");
      setNewCatName('');
    } catch (err: any) {
      addToast(err.message || "Не удалось добавить категорию", "warning");
    }
  };

  const handleDeleteCategory = async (catId: number, catName: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить категорию "${catName}"?`)) {
      try {
        await apiDeleteCategory(catId);
        setCategoriesList(prev => prev.filter(c => c.id !== catId));
        addToast("Категория удалена", "info");
      } catch (err) {
        addToast("Не удалось удалить категорию", "warning");
      }
    }
  };

  const handleExportData = async () => {
    addToast("Подготовка файла экспорта...", "info");
    await apiExportDatabase();
  };

  const handleExportTxtData = async () => {
    addToast("Подготовка текстового отчета...", "info");
    await apiExportDatabaseTxt();
  };

  // Filter logs by search term
  const filteredLogs = logsList.filter(log => 
    log.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.detail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-16"
    >
      {/* Title section */}
      <div className="flex flex-col gap-1.5 mb-6 text-center md:text-left">
        <h1 className="font-display font-extrabold text-2xl md:text-4xl tracking-tight flex items-center gap-2.5 justify-center md:justify-start">
          <Shield className="w-8 h-8 text-brand-orange" />
          <span>Панель Администратора</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Управляйте пользователями, отслеживайте логи активности и просматривайте системную аналитику базы данных.
        </p>
      </div>

      {/* Tabs headers */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-6 justify-center md:justify-start">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 font-semibold text-sm transition-all relative flex items-center gap-1.5 ${
            activeTab === 'users' ? 'text-brand-orange' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Пользователи</span>
          {activeTab === 'users' && (
            <motion.div layoutId="adminTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 font-semibold text-sm transition-all relative flex items-center gap-1.5 ${
            activeTab === 'logs' ? 'text-brand-orange' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ScrollText className="w-4 h-4" />
          <span>Логи аудита</span>
          {activeTab === 'logs' && (
            <motion.div layoutId="adminTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 font-semibold text-sm transition-all relative flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'categories' ? 'text-brand-orange' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Категории</span>
          {activeTab === 'categories' && (
            <motion.div layoutId="adminTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`pb-3 font-semibold text-sm transition-all relative flex items-center gap-1.5 ${
            activeTab === 'stats' ? 'text-brand-orange' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Аналитика</span>
          {activeTab === 'stats' && (
            <motion.div layoutId="adminTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange" />
          )}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="glass-effect rounded-3xl p-6 border shadow-lg">
        
        {/* Panel 1: Users table */}
        {activeTab === 'users' && (
          <div className="overflow-x-auto w-full">
            {loading ? (
              <p className="text-center text-sm py-12 text-slate-400">Загрузка списка пользователей...</p>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200/50 dark:border-slate-800/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Пользователь</th>
                    <th className="py-3.5 px-4">User ID</th>
                    <th className="py-3.5 px-4">Роль</th>
                    <th className="py-3.5 px-4">Дата регистрации</th>
                    <th className="py-3.5 px-4 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/30 dark:divide-slate-800/30">
                  {usersList.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-800" />
                        <span className="font-semibold text-slate-850 dark:text-slate-200">{user.username}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-400">{user.id}</td>
                      <td className="py-3.5 px-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleChangeRole(user.id, e.target.value as any)}
                          disabled={user.id === currentUserId || user.id === 'u-admin'}
                          className="bg-transparent text-slate-800 dark:text-slate-100 border border-slate-200/50 dark:border-slate-800/50 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-brand-orange"
                        >
                          <option value="user">Пользователь</option>
                          <option value="admin">Администратор</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-slate-450">{user.createdAt || '08.07.2026'}</td>
                      <td className="py-3.5 px-4 text-right flex justify-end gap-1.5">
                        <button
                          onClick={() => handleBlockUser(user.id, user.username, user.blocked || 0)}
                          disabled={user.id === currentUserId || user.id === 'u-admin'}
                          className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all border cursor-pointer ${
                            user.blocked === 1
                              ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                              : 'bg-slate-500/5 text-slate-400 hover:text-red-500 border-slate-200/20 dark:border-slate-800/20 hover:border-red-500/20'
                          }`}
                          title={user.blocked === 1 ? "Разблокировать пользователя" : "Заблокировать пользователя"}
                        >
                          {user.blocked === 1 ? 'Заблок.' : 'Блок.'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          disabled={user.id === currentUserId || user.id === 'u-admin'}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/5 rounded-xl disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                          title="Удалить аккаунт"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Panel 2: Logs timeline */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            {/* Search filter for logs */}
            <div className="relative max-w-sm mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по имени или логу..."
                className="w-full bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-brand-orange"
              />
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            </div>

            {loading ? (
              <p className="text-center text-sm py-12 text-slate-400">Загрузка логов аудита...</p>
            ) : filteredLogs.length === 0 ? (
              <p className="text-center text-sm py-12 text-slate-400 italic">Логи активности не найдены</p>
            ) : (
              <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-2">
                {filteredLogs.map((log) => {
                  const logIcon = {
                    search: <Search className="w-3.5 h-3.5 text-blue-500" />,
                    view: <Eye className="w-3.5 h-3.5 text-brand-green" />,
                    ai_query: <Bot className="w-3.5 h-3.5 text-brand-orange" />
                  }[log.type];

                  const logBg = {
                    search: 'bg-blue-500/10 border-blue-500/10',
                    view: 'bg-brand-green/10 border-brand-green/10',
                    ai_query: 'bg-brand-orange/10 border-brand-orange/10'
                  }[log.type];

                  return (
                    <div 
                      key={log.id} 
                      className={`p-3 rounded-2xl border ${logBg} flex items-center justify-between text-xs gap-3`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center border shadow-xs flex-shrink-0">
                          {logIcon}
                        </div>
                        <div>
                          <span className="font-bold text-slate-700 dark:text-slate-200 mr-2">@{log.username}</span>
                          <span className="text-slate-600 dark:text-slate-350">{log.detail}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 flex-shrink-0">
                        <Clock className="w-3 h-3" /> {log.timestamp}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Panel 4: Categories Catalog */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Form to create new category */}
              <form onSubmit={handleCreateCategory} className="lg:col-span-4 p-4 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 space-y-4">
                <h4 className="font-bold text-sm">Добавить новую категорию</h4>
                
                <div>
                  <label className="text-[10px] text-slate-450 font-bold block mb-1 uppercase tracking-wider">Название категории *</label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Например: Стейки"
                    className="w-full bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-orange"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-450 font-bold block mb-1 uppercase tracking-wider">Эмодзи иконка</label>
                  <select
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                    className="w-full bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-orange"
                  >
                    {['🍳', '🥗', '🥩', '🍜', '🍰', '🍞', '🍝', '🍕', '🍔', '🧀', '🍹', '🥑', '🌱', '🍟', '🔥', '🍖', '🍣', '🌶️'].map(emoji => (
                      <option key={emoji} value={emoji}>{emoji} {emoji}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-brand-orange text-white text-xs font-bold shadow-md hover:bg-brand-orange/95 cursor-pointer"
                >
                  Создать категорию
                </button>
              </form>

              {/* Listing grid */}
              <div className="lg:col-span-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categoriesList.map((cat) => (
                    <div 
                      key={cat.id} 
                      className="p-3.5 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 bg-white/40 dark:bg-slate-900/40 flex justify-between items-center group transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{cat.icon}</span>
                        <span className="font-semibold text-xs">{cat.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-500/5 group-hover:opacity-100 opacity-30 transition-all cursor-pointer"
                        title="Удалить категорию"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Panel 3: Stats cards */}
        {activeTab === 'stats' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Stat 1 */}
              <div className="p-5 rounded-2xl bg-brand-orange/5 border border-brand-orange/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">Всего участников</span>
                  <span className="font-display font-black text-2xl text-brand-orange">3 пользователя</span>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">База рецептов</span>
                  <span className="font-display font-black text-2xl text-blue-500">22 шедевра</span>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="p-5 rounded-2xl bg-brand-green/5 border border-brand-green/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">Активность за неделю</span>
                  <span className="font-display font-black text-2xl text-brand-green">94 клика</span>
                </div>
              </div>

              {/* Stat 4 */}
              <div className="p-5 rounded-2xl bg-brand-yellow/5 border border-brand-yellow/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-yellow/10 flex items-center justify-center text-brand-yellow">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">Средний рейтинг рецепта</span>
                  <span className="font-display font-black text-2xl text-brand-yellow">4.8 / 5.0</span>
                </div>
              </div>
            </div>

            {/* Database Export report card */}
            <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col lg:flex-row justify-between items-center gap-4">
              <div>
                <h4 className="font-bold text-sm">Экспорт отчетов и резервных копий</h4>
                <p className="text-xs text-slate-450 mt-0.5">Выгрузите кулинарную базу данных в удобном и понятном текстовом формате или полной копии.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <button
                  type="button"
                  onClick={handleExportTxtData}
                  className="px-5 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green/90 text-white font-bold text-xs shadow-md transition-colors cursor-pointer text-center"
                >
                  Скачать простой отчет (TXT)
                </button>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orange/95 text-white font-bold text-xs shadow-md transition-colors cursor-pointer text-center"
                >
                  Скачать базу данных (JSON)
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </motion.div>
  );
};
