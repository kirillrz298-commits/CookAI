import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Lock, User, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { apiLogin, apiRegister } from '../services/api';
import type { UserSession } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (session: UserSession) => void;
  addToast: (message: string, type: 'success' | 'info' | 'warning') => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, addToast }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Пожалуйста, заполните обязательные поля');
      return;
    }

    if (!isLogin) {
      if (!firstName.trim()) {
        setError('Пожалуйста, укажите ваше имя');
        return;
      }
      if (password !== confirmPassword) {
        setError('Пароли не совпадают');
        return;
      }
    }

    setError('');
    setLoading(true);

    try {
      let session: UserSession;
      if (isLogin) {
        session = await apiLogin(username, password);
        addToast(`С возвращением, ${session.username}! 🍳`, 'success');
      } else {
        session = await apiRegister(username, password, firstName, lastName);
        addToast(`Аккаунт ${session.username} создан! Добро пожаловать! 🎉`, 'success');
      }
      onAuthSuccess(session);
    } catch (err: any) {
      setError(err.message || 'Ошибка аутентификации. Проверьте подключение.');
      addToast(err.message || 'Вход не удался', 'warning');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative p-4 overflow-hidden bg-slate-900">
      {/* Background graphic blur circles */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-brand-orange/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-yellow/10 rounded-full blur-3xl" />
      
      {/* Brand logo header */}
      <motion.div 
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-3 mb-8 z-10 select-none cursor-default"
      >
        <div className="w-12 h-12 rounded-2xl bg-brand-orange flex items-center justify-center text-white shadow-xl shadow-brand-orange/30">
          <ChefHat className="w-7 h-7 text-white" />
        </div>
        <div>
          <span className="font-display font-black text-2xl tracking-tight bg-gradient-to-r from-brand-orange to-brand-yellow bg-clip-text text-transparent block">
            CookBook
          </span>
          <span className="text-xs uppercase font-black tracking-widest text-slate-400 block -mt-1">
            AI Library
          </span>
        </div>
      </motion.div>

      {/* Main Form container */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-effect rounded-[32px] p-8 border border-white/10 w-full max-w-md shadow-2xl relative z-10 bg-slate-900/40 backdrop-blur-xl"
      >
        {/* Sign In / Sign Up tab header */}
        <div className="flex gap-4 border-b border-white/10 mb-6 justify-center">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`pb-3 font-semibold text-sm transition-all relative px-4 flex items-center gap-2 ${
              isLogin ? 'text-brand-orange' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Вход</span>
            {isLogin && (
              <motion.div layoutId="authTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange" />
            )}
          </button>
          
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`pb-3 font-semibold text-sm transition-all relative px-4 flex items-center gap-2 ${
              !isLogin ? 'text-brand-orange' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Регистрация</span>
            {!isLogin && (
              <motion.div layoutId="authTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange" />
            )}
          </button>
        </div>

        {/* Display Errors */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2.5 items-center text-xs text-red-400 font-semibold"
            >
              <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input fields */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1.5 pl-1">Имя *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Иван"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all text-white font-medium"
                  required={!isLogin}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1.5 pl-1">Фамилия</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Иванов"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all text-white font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1.5 pl-1">Имя пользователя (логин) *</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Например, chef_master"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all text-white font-medium"
                required
              />
              <User className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1.5 pl-1">Пароль *</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 4 символа"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all text-white"
                required
              />
              <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-500" />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1.5 pl-1">Повторите пароль *</label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Введите пароль еще раз"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all text-white"
                  required={!isLogin}
                />
                <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-500" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-brand-orange hover:bg-brand-orange/95 text-white font-bold text-sm shadow-lg hover:shadow-brand-orange/20 cursor-pointer transition-all disabled:opacity-50"
          >
            {loading ? 'Обработка...' : isLogin ? 'Войти в личный кабинет' : 'Зарегистрироваться'}
          </button>
        </form>

        {/* Info block */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-start gap-3 bg-white/5 rounded-2xl px-4 py-3.5 border border-white/8">
            <span className="text-lg leading-none mt-0.5">💡</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              После регистрации вы получите доступ ко всем функциям платформы.{' '}
              <span className="text-slate-300 font-semibold">Администратор</span> — это универсальный аккаунт с расширенными правами, который создаётся отдельно.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
