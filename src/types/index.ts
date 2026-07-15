export interface MacroNutrition {
  protein: number; // in grams
  fat: number;     // in grams
  carbs: number;   // in grams
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  date: string;
  rating: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  rating: number;
  reviewsCount: number;
  author: string;
  views: number;
  prepTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  calories: number;
  macros: MacroNutrition;
  ingredients: Ingredient[];
  steps: string[];
  tips: string[];
  comments: Comment[];
  cuisine: string;
  category: string;
  tags: string[];
  author_id?: string;
  status?: 'published' | 'draft';
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  suggestedRecipeIds?: string[];
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: string;
}

export interface UserProfile {
  name: string;
  avatar: string;
  favorites: string[];
  searchHistory: SearchHistoryItem[];
  viewHistory: string[];
  settings: {
    darkMode: boolean;
    notificationsEnabled: boolean;
    language?: 'ru' | 'en';
  };
}

export interface UserSession {
  id: string;
  username: string;
  role: 'admin' | 'user';
  avatar: string;
  createdAt?: string;
  blocked?: number;
}

export interface AdminLog {
  id: string;
  userId: string;
  username: string;
  type: 'search' | 'view' | 'ai_query';
  detail: string;
  timestamp: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
}

// === NEW TYPES ===

export interface Badge {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  earnedAt?: string;
  unlocked: boolean;
}

export interface UserStreak {
  currentStreak: number;
  maxStreak: number;
  lastCookDate: string | null;
  totalCooked: number;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  checked: boolean;
  recipeTitle?: string;
}

export interface ShoppingList {
  items: ShoppingListItem[];
  updatedAt: string;
}

export interface MealSlot {
  recipeId: string | null;
  recipeTitle?: string;
  recipeImage?: string;
  calories?: number;
}

export interface MealPlanDay {
  breakfast: MealSlot;
  lunch: MealSlot;
  dinner: MealSlot;
}

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface MealPlan {
  weekStart: string;
  days: Record<DayKey, MealPlanDay>;
}

export interface CalorieLogEntry {
  id: string;
  date: string;
  recipeId: string;
  recipeTitle: string;
  servings: number;
  calories: number;
  macros: MacroNutrition;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  addedAt: string;
}

export interface DailyCalories {
  date: string;
  entries: CalorieLogEntry[];
  totalCalories: number;
  totalMacros: MacroNutrition;
  goal: number;
}

export interface AuthorSubscription {
  authorUsername: string;
  authorAvatar: string;
  subscribedAt: string;
  recipeCount?: number;
}
