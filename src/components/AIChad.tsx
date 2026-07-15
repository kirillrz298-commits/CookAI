import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Trash2, Sparkles, BookOpen, Compass, Mic, MicOff, Camera, Loader2 } from 'lucide-react';
import type { Message } from '../types';
import { sendMessageToAI, analyzePhotoIngredients } from '../services/ai';
import { apiLogAiQuery } from '../services/api';
import { RECIPES } from '../data/recipes';

interface AIChadProps {
  onOpenRecipe: (id: string) => void;
}

const QUICK_SUGGESTIONS = [
  "Есть картошка и мясо. Что приготовить?",
  "Что приготовить быстро за 20 минут?",
  "Подбери рецепт без мяса (вегетарианское)",
  "Есть яйца, картошка и сыр",
  "Что приготовить вкусное на ужин?"
];

// Web Speech API type declarations
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const AIChad: React.FC<AIChadProps> = ({ onOpenRecipe }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Приветствую вас, гурман! 👨‍🍳 Я виртуальный шеф-повар CookBook AI.\n\nПоделитесь, какие ингредиенты лежат у вас в холодильнике, или сфотографируйте содержимое холодильника 📷, и я подберу идеальные рецепты. Что мы приготовим сегодня?",
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      suggestedRecipeIds: []
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) setTimeout(scrollToBottom, 100);
  }, [messages, isOpen, isLoading]);

  const handleSendMessage = useCallback(async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInputText("");
    setIsLoading(true);

    try {
      const aiResponse = await sendMessageToAI(updatedHistory);
      const cleanText = aiResponse.text.replace(/\[Рецепт:\s*([a-zA-Z0-9-]+)\]/g, '').trim();

      const aiMessage: Message = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: cleanText,
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        suggestedRecipeIds: aiResponse.suggestedRecipeIds
      };

      setMessages(prev => [...prev, aiMessage]);
      apiLogAiQuery(textToSend, cleanText).catch(() => {});
    } catch (err) {
      console.error("Failed to generate AI response:", err);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  useEffect(() => {
    const handleAskEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail === 'string') {
        setIsOpen(true);
        setTimeout(() => handleSendMessage(customEvent.detail), 150);
      }
    };
    window.addEventListener('cookbook_ask_ai', handleAskEvent);
    return () => window.removeEventListener('cookbook_ask_ai', handleAskEvent);
  }, [handleSendMessage]);

  // ============================================================
  // 🎤 VOICE INPUT
  // ============================================================
  const startVoiceRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Ваш браузер не поддерживает распознавание речи. Попробуйте Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setInputText(transcript);

      if (event.results[event.results.length - 1].isFinal) {
        recognition.stop();
        // Auto-send after a short delay
        setTimeout(() => handleSendMessage(transcript), 300);
      }
    };

    recognition.start();
  }, [handleSendMessage]);

  const stopVoiceRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const toggleVoice = useCallback(() => {
    if (isListening) stopVoiceRecognition();
    else startVoiceRecognition();
  }, [isListening, startVoiceRecognition, stopVoiceRecognition]);

  // ============================================================
  // 📷 PHOTO ANALYSIS
  // ============================================================
  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (!event.target || typeof event.target.result !== 'string') return;
      const base64 = event.target.result.split(',')[1];

      // Add user message with photo indicator
      const userMessage: Message = {
        id: `msg-photo-${Date.now()}`,
        sender: 'user',
        text: '📷 Отправил фото холодильника/продуктов',
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, userMessage]);
      setIsAnalyzingPhoto(true);
      setIsLoading(true);

      try {
        const { ingredients, suggestion } = await analyzePhotoIngredients(base64);

        if (ingredients.length === 0) {
          const aiMsg: Message = {
            id: `msg-ai-${Date.now()}`,
            sender: 'ai',
            text: `😔 ${suggestion}\n\nПопробуйте сделать более чёткое фото с хорошим освещением.`,
            timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            suggestedRecipeIds: []
          };
          setMessages(prev => [...prev, aiMsg]);
        } else {
          // Now ask AI for recipes based on recognized ingredients
          const query = `На фото я вижу следующие продукты: ${ingredients.join(', ')}. ${suggestion} Что можно приготовить из этих ингредиентов?`;
          const historyWithPhoto = [...messages, userMessage, { id: 'temp', sender: 'user' as const, text: query, timestamp: '' }];
          const aiResponse = await sendMessageToAI(historyWithPhoto);
          const cleanText = aiResponse.text.replace(/\[Рецепт:\s*([a-zA-Z0-9-]+)\]/g, '').trim();

          const aiMsg: Message = {
            id: `msg-ai-${Date.now()}`,
            sender: 'ai',
            text: `🔍 **Нашёл на фото:** ${ingredients.join(', ')}\n\n${cleanText}`,
            timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            suggestedRecipeIds: aiResponse.suggestedRecipeIds
          };
          setMessages(prev => [...prev, aiMsg]);
        }
      } catch (err) {
        const aiMsg: Message = {
          id: `msg-err-${Date.now()}`,
          sender: 'ai',
          text: '⚠️ Не удалось проанализировать фото. Попробуйте ещё раз или опишите ингредиенты текстом.',
          timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          suggestedRecipeIds: []
        };
        setMessages(prev => [...prev, aiMsg]);
      } finally {
        setIsAnalyzingPhoto(false);
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [messages]);

  const handleClearChat = () => {
    setMessages([{
      id: "welcome",
      sender: "ai",
      text: "Приветствую вас, гурман! 👨‍🍳 Я виртуальный шеф-повар CookBook AI.\n\nПоделитесь, какие ингредиенты лежат у вас в холодильнике, или сфотографируйте содержимое холодильника 📷, и я подберу идеальные рецепты. Что мы приготовим сегодня?",
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      suggestedRecipeIds: []
    }]);
  };

  const formatText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const parts = line.split(/\*\*([^*]+)\*\*/g);
      return (
        <span key={idx} className="block min-h-[4px]">
          {parts.map((part, pIdx) =>
            pIdx % 2 === 1
              ? <strong key={pIdx} className="font-extrabold text-slate-800 dark:text-white">{part}</strong>
              : part
          )}
        </span>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className="glass-effect rounded-3xl shadow-2xl border w-[92vw] sm:w-[420px] h-[580px] flex flex-col overflow-hidden mb-4"
          >
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center bg-brand-orange text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/20">
                  <span className="text-xl">👨‍🍳</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-white">Шеф-повар ИИ</h3>
                  <span className="text-[10px] text-orange-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                    Голос · Фото · Текст
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleClearChat} className="p-1.5 rounded-lg hover:bg-white/10 text-orange-100 hover:text-white transition-colors" title="Очистить чат">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-orange-100 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isAI = msg.sender === 'ai';
                return (
                  <div key={msg.id} className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
                    <div className="max-w-[85%] flex flex-col gap-1">
                      <div className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                        isAI
                          ? 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-slate-800/30 rounded-tl-sm'
                          : 'bg-brand-orange text-white rounded-tr-sm'
                      }`}>
                        {formatText(msg.text)}

                        {isAI && msg.suggestedRecipeIds && msg.suggestedRecipeIds.length > 0 && (
                          <div className="mt-3.5 pt-3 border-t border-slate-200/40 dark:border-slate-700/40 flex flex-col gap-2">
                            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5" /> Рецепты в базе сайта:
                            </span>
                            {msg.suggestedRecipeIds.map(recipeId => {
                              const rec = RECIPES.find(r => r.id === recipeId);
                              if (!rec) return null;
                              return (
                                <button
                                  key={recipeId}
                                  onClick={() => onOpenRecipe(recipeId)}
                                  className="w-full flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:border-brand-orange dark:hover:border-brand-orange text-left text-xs font-semibold hover:text-brand-orange transition-all cursor-pointer shadow-xs group"
                                >
                                  <span className="line-clamp-1">{rec.title}</span>
                                  <Compass className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-orange transition-colors" />
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <span className={`text-[10px] text-slate-400 dark:text-slate-500 ${isAI ? 'text-left pl-1' : 'text-right pr-1'}`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Loader */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-800/30 rounded-tl-sm flex gap-1 items-center">
                    <span className="text-xs text-slate-400 mr-1 flex items-center gap-1.5">
                      {isAnalyzingPhoto ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Анализирую фото...</>
                      ) : (
                        <>👨‍🍳 Шеф думает</>
                      )}
                    </span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full dot-bounce" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full dot-bounce" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full dot-bounce" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick suggestions */}
            {messages.length === 1 && !isLoading && (
              <div className="px-4 py-2 flex flex-col gap-1.5 bg-slate-100/40 dark:bg-slate-900/40 border-t border-slate-200/30 dark:border-slate-800/30">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-brand-orange" /> Быстрые вопросы:
                </span>
                <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
                  {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(suggestion)}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800/65 rounded-xl text-[11px] font-medium text-slate-500 hover:text-brand-orange cursor-pointer transition-all whitespace-nowrap shadow-xs"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input area */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputText); }}
              className="p-3 border-t border-slate-200/50 dark:border-slate-800/50 flex gap-2 items-center"
            >
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />

              {/* Photo button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-orange hover:bg-brand-orange/10 transition-colors disabled:opacity-50 cursor-pointer"
                title="Сфотографировать ингредиенты"
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* Text input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isListening ? '🎤 Слушаю...' : 'Спросите шефа...'}
                className={`flex-grow bg-slate-100 dark:bg-slate-900 border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors ${
                  isListening
                    ? 'border-red-400 bg-red-50 dark:bg-red-900/10'
                    : 'border-slate-250 dark:border-slate-800 focus:border-brand-orange'
                }`}
                disabled={isLoading || isListening}
              />

              {/* Voice button */}
              <button
                type="button"
                onClick={toggleVoice}
                disabled={isLoading}
                className={`p-2.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-orange hover:bg-brand-orange/10'
                }`}
                title={isListening ? 'Остановить запись' : 'Голосовой ввод'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Send button */}
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="p-2.5 rounded-xl bg-brand-orange text-white shadow-md hover:bg-brand-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-brand-orange text-white shadow-2xl flex items-center justify-center cursor-pointer border border-white/10 hover:bg-brand-orange/95 relative group overflow-hidden"
      >
        <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        {isOpen ? (
          <X className="w-6 h-6 text-white relative z-10" />
        ) : (
          <div className="relative z-10 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
            <span className="absolute -top-1.5 -right-1.5 bg-brand-green text-[9px] font-black uppercase text-white px-1.5 py-0.5 rounded-full border border-brand-orange flex items-center justify-center">
              AI
            </span>
          </div>
        )}
      </motion.button>
    </div>
  );
};
