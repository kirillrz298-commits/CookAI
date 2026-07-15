import type { Recipe, Comment, UserProfile, SearchHistoryItem, UserSession, AdminLog, Category } from '../types';
import { RECIPES } from '../data/recipes';

const API_BASE = '/api';

// Helper to retrieve the current auth token (user ID) from localStorage
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('cookbook_auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// --- OFFLINE FALLBACK ENGINE ---
// Fallback states used if the Express SQLite backend is not responsive.

function getLocalProfile(username = 'Шеф Гурман'): UserProfile {
  const saved = localStorage.getItem(`cookbook_profile_${username}`);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { /* ignore */ }
  }
  
  const defaultProfile: UserProfile = {
    name: username,
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=150&q=80',
    favorites: ['pot-1', 'beef-1', 'des-1'],
    searchHistory: [
      { id: 'h1', query: 'картошка', timestamp: '08.07.2026, 15:20' },
      { id: 'h2', query: 'курица на гриле', timestamp: '08.07.2026, 14:15' }
    ],
    viewHistory: ['pot-1', 'pst-1'],
    settings: {
      darkMode: true,
      notificationsEnabled: true
    }
  };
  localStorage.setItem(`cookbook_profile_${username}`, JSON.stringify(defaultProfile));
  return defaultProfile;
}

function saveLocalProfile(profile: UserProfile, username: string) {
  localStorage.setItem(`cookbook_profile_${username}`, JSON.stringify(profile));
}

function getLocalComments(recipeId: string): Comment[] {
  const saved = localStorage.getItem(`cookbook_comments_${recipeId}`);
  return saved ? JSON.parse(saved) : [];
}

function saveLocalComment(recipeId: string, comment: Comment) {
  const current = getLocalComments(recipeId);
  localStorage.setItem(`cookbook_comments_${recipeId}`, JSON.stringify([comment, ...current]));
}

// Local mock array of recipes that supports CRUD updates in memory / localStorage
function getLocalRecipes(): Recipe[] {
  const saved = localStorage.getItem('cookbook_custom_recipes');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return RECIPES;
    }
  }
  localStorage.setItem('cookbook_custom_recipes', JSON.stringify(RECIPES));
  return RECIPES;
}

function saveLocalRecipes(list: Recipe[]) {
  localStorage.setItem('cookbook_custom_recipes', JSON.stringify(list));
}


// --- ACTIVE API SERVICE CLIENT FUNCTIONS ---

// Authentication

export async function apiLogin(username: string, password: string): Promise<UserSession> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Ошибка входа');
    }
    const session: UserSession = await res.json();
    localStorage.setItem('cookbook_auth_token', session.id);
    localStorage.setItem('cookbook_auth_user', JSON.stringify(session));
    return session;
  } catch (error) {
    console.warn('[CookBook API] Login failed, simulating local guest session.');
    
    // Offline simulation credentials
    if (username === 'admin' && password === 'adminpass') {
      const session: UserSession = { id: 'u-admin', username: 'admin', role: 'admin', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' };
      localStorage.setItem('cookbook_auth_token', session.id);
      localStorage.setItem('cookbook_auth_user', JSON.stringify(session));
      return session;
    } else if (username === 'chef' && password === 'chefpass') {
      const session: UserSession = { id: 'u-chef', username: 'chef', role: 'user', avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=150&q=80' };
      localStorage.setItem('cookbook_auth_token', session.id);
      localStorage.setItem('cookbook_auth_user', JSON.stringify(session));
      return session;
    }

    // Default register-on-fly offline fallback
    const mockId = `u-${Date.now()}`;
    const session: UserSession = { id: mockId, username, role: 'user', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' };
    localStorage.setItem('cookbook_auth_token', session.id);
    localStorage.setItem('cookbook_auth_user', JSON.stringify(session));
    return session;
  }
}

export async function apiRegister(username: string, password: string, firstName: string, lastName: string): Promise<UserSession> {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, firstName, lastName })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Ошибка регистрации');
    }
    const session: UserSession = await res.json();
    localStorage.setItem('cookbook_auth_token', session.id);
    localStorage.setItem('cookbook_auth_user', JSON.stringify(session));
    return session;
  } catch (error) {
    console.warn('[CookBook API] Registration failed, simulating local registration.');
    const mockId = `u-${Date.now()}`;
    const role = username.toLowerCase().startsWith('admin') ? 'admin' : 'user';
    const session: UserSession = { id: mockId, username, role, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf375fde?auto=format&fit=crop&w=150&q=80' };
    localStorage.setItem('cookbook_auth_token', session.id);
    localStorage.setItem('cookbook_auth_user', JSON.stringify(session));
    return session;
  }
}

export function apiLogout() {
  localStorage.removeItem('cookbook_auth_token');
  localStorage.removeItem('cookbook_auth_user');
}

export function apiGetCurrentUser(): UserSession | null {
  const saved = localStorage.getItem('cookbook_auth_user');
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { return null; }
  }
  return null;
}

// Recipes Client API CRUD

export async function apiFetchRecipes(filters: {
  query: string;
  cuisine: string;
  category: string;
  difficulty: string;
  maxTime: number;
  maxCalories: number;
  sortBy: string;
  ingredients: string[];
}): Promise<Recipe[]> {
  try {
    const params = new URLSearchParams();
    if (filters.query) params.append('query', filters.query);
    if (filters.cuisine) params.append('cuisine', filters.cuisine);
    if (filters.category) params.append('category', filters.category);
    if (filters.difficulty) params.append('difficulty', filters.difficulty);
    if (filters.maxTime) params.append('maxTime', String(filters.maxTime));
    if (filters.maxCalories) params.append('maxCalories', String(filters.maxCalories));
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.ingredients.length > 0) params.append('ingredients', filters.ingredients.join(','));

    const res = await fetch(`${API_BASE}/recipes?${params.toString()}`);
    if (!res.ok) throw new Error('API Response Error');
    return await res.json();
  } catch (error) {
    console.warn('[CookBook API] Fetch recipes failed. Falling back to local search matching.');
    const recipes = getLocalRecipes();
    
    // Filter local copies
    const filtered = recipes.filter(recipe => {
      if (filters.query?.trim()) {
        const q = filters.query.toLowerCase().trim();
        const matchTitle = recipe.title.toLowerCase().includes(q);
        const matchDesc = recipe.description.toLowerCase().includes(q);
        const matchTags = recipe.tags.some(tag => tag.toLowerCase().includes(q));
        const matchIngredients = recipe.ingredients.some(ing => ing.name.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchTags && !matchIngredients) return false;
      }
      if (filters.category) {
        const catMatch = recipe.tags.includes(filters.category.toLowerCase()) || recipe.category.toLowerCase() === filters.category.toLowerCase();
        if (!catMatch) return false;
      }
      if (filters.cuisine && recipe.cuisine !== filters.cuisine) return false;
      if (filters.difficulty && recipe.difficulty !== filters.difficulty) return false;
      if (filters.maxTime && recipe.prepTime > filters.maxTime) return false;
      if (filters.maxCalories && recipe.calories > filters.maxCalories) return false;
      if (filters.ingredients && filters.ingredients.length > 0) {
        const hasAll = filters.ingredients.every(name => 
          recipe.ingredients.some(i => i.name.toLowerCase().includes(name.toLowerCase())) ||
          recipe.tags.some(t => t.toLowerCase().includes(name.toLowerCase()))
        );
        if (!hasAll) return false;
      }
      return true;
    }).map(r => ({ ...r, comments: [...getLocalComments(r.id), ...r.comments] }));

    if (filters.sortBy === 'rating') return filtered.sort((a, b) => b.rating - a.rating);
    if (filters.sortBy === 'views') return filtered.sort((a, b) => b.views - a.views);
    if (filters.sortBy === 'timeAsc') return filtered.sort((a, b) => a.prepTime - b.prepTime);
    if (filters.sortBy === 'caloriesAsc') return filtered.sort((a, b) => a.calories - b.calories);
    return filtered;
  }
}

export async function apiFetchRecipeById(id: string): Promise<Recipe> {
  try {
    const res = await fetch(`${API_BASE}/recipes/${id}`);
    if (!res.ok) throw new Error('API Response Error');
    return await res.json();
  } catch (error) {
    console.warn(`[CookBook API] Fetch recipe ${id} failed. Reading local catalog copy.`);
    const list = getLocalRecipes();
    const recipe = list.find(r => r.id === id);
    if (!recipe) throw new Error('Recipe not found');
    
    // Add views
    recipe.views += 1;
    saveLocalRecipes(list);

    return {
      ...recipe,
      comments: [...getLocalComments(id), ...recipe.comments]
    };
  }
}

export async function apiCreateRecipe(recipeData: Partial<Recipe>): Promise<Recipe> {
  try {
    const res = await fetch(`${API_BASE}/recipes`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(recipeData)
    });
    if (!res.ok) throw new Error('API Response Error');
    return await res.json();
  } catch (error) {
    console.warn('[CookBook API] Create recipe failed. Creating locally.');
    const user = apiGetCurrentUser();
    const recipeId = `rec-local-${Date.now()}`;
    const authorName = user?.username || 'Гость';

    const newRecipe: Recipe = {
      id: recipeId,
      title: recipeData.title || '',
      description: recipeData.description || '',
      image: recipeData.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      rating: 5.0,
      reviewsCount: 0,
      author: authorName,
      views: 0,
      prepTime: Number(recipeData.prepTime || 30),
      servings: Number(recipeData.servings || 2),
      difficulty: recipeData.difficulty || 'Medium',
      calories: Number(recipeData.calories || 250),
      macros: recipeData.macros || { protein: 10, fat: 10, carbs: 30 },
      ingredients: recipeData.ingredients || [],
      steps: recipeData.steps || [],
      tips: recipeData.tips || [],
      comments: [],
      cuisine: recipeData.cuisine || 'Русская',
      category: recipeData.category || 'Обеды',
      tags: [recipeData.cuisine, recipeData.category, recipeData.title].filter(Boolean).map(s => s!.toLowerCase())
    };

    const current = getLocalRecipes();
    saveLocalRecipes([newRecipe, ...current]);
    return newRecipe;
  }
}

export async function apiUpdateRecipe(id: string, recipeData: Partial<Recipe>): Promise<Recipe> {
  try {
    const res = await fetch(`${API_BASE}/recipes/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(recipeData)
    });
    if (!res.ok) throw new Error('API Response Error');
    return await res.json();
  } catch (error) {
    console.warn(`[CookBook API] Update recipe ${id} failed. Editing locally.`);
    const current = getLocalRecipes();
    const idx = current.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Recipe not found');

    const updated: Recipe = {
      ...current[idx],
      ...recipeData,
      id
    } as Recipe;

    current[idx] = updated;
    saveLocalRecipes(current);
    return updated;
  }
}

export async function apiDeleteRecipe(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/recipes/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('API Response Error');
  } catch (error) {
    console.warn(`[CookBook API] Delete recipe ${id} failed. Deleting locally.`);
    const current = getLocalRecipes();
    const updated = current.filter(r => r.id !== id);
    saveLocalRecipes(updated);
  }
}

export async function apiAddComment(recipeId: string, commentData: {
  author: string;
  avatar: string;
  text: string;
  date: string;
  rating: number;
}): Promise<Comment> {
  try {
    const res = await fetch(`${API_BASE}/recipes/${recipeId}/comments`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(commentData)
    });
    if (!res.ok) throw new Error('API Response Error');
    return await res.json();
  } catch (error) {
    console.warn('[CookBook API] Add comment failed. Writing comment locally.');
    const mockComment: Comment = {
      id: `c-local-${Date.now()}`,
      author: commentData.author,
      avatar: commentData.avatar,
      text: commentData.text,
      date: commentData.date,
      rating: commentData.rating
    };
    saveLocalComment(recipeId, mockComment);
    return mockComment;
  }
}

// User profile endpoints linked with headers token

export async function apiFetchUserProfile(): Promise<UserProfile> {
  try {
    const res = await fetch(`${API_BASE}/profile`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('API Response Error');
    return await res.json();
  } catch (error) {
    console.warn('[CookBook API] Fetch profile failed. Reading localStorage fallback profile.');
    const user = apiGetCurrentUser();
    return getLocalProfile(user?.username);
  }
}

export async function apiUpdateUserProfile(profile: UserProfile): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(profile)
    });
    if (!res.ok) throw new Error('API Response Error');
  } catch (error) {
    console.warn('[CookBook API] Sync profile failed. Storing in localStorage.');
    const user = apiGetCurrentUser();
    saveLocalProfile(profile, user?.username || 'Шеф Гурман');
  }
}

export async function apiToggleFavorite(recipeId: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/profile/favorites`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ recipeId })
    });
    if (!res.ok) throw new Error('API Response Error');
    return await res.json();
  } catch (error) {
    console.warn('[CookBook API] Toggle favorite failed. Toggling locally.');
    const user = apiGetCurrentUser();
    const local = getLocalProfile(user?.username);
    const isFav = local.favorites.includes(recipeId);
    
    const updated = isFav 
      ? local.favorites.filter(id => id !== recipeId)
      : [...local.favorites, recipeId];

    local.favorites = updated;
    saveLocalProfile(local, user?.username || 'Шеф Гурман');
    return updated;
  }
}

export async function apiAddSearchHistory(query: string): Promise<SearchHistoryItem | null> {
  try {
    const res = await fetch(`${API_BASE}/profile/search-history`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ query })
    });
    if (!res.ok) throw new Error('API Response Error');
    return await res.json();
  } catch (error) {
    console.warn('[CookBook API] Log query history failed. Saving locally.');
    const user = apiGetCurrentUser();
    const local = getLocalProfile(user?.username);
    const searchId = `sh-local-${Date.now()}`;
    const timestamp = new Date().toLocaleString('ru-RU', { 
      hour: '2-digit', minute: '2-digit', 
      day: '2-digit', month: '2-digit' 
    });
    
    const item: SearchHistoryItem = { id: searchId, query, timestamp };
    local.searchHistory = [item, ...local.searchHistory.filter(h => h.query !== query)].slice(0, 10);
    saveLocalProfile(local, user?.username || 'Шеф Гурман');
    return item;
  }
}

export async function apiAddViewHistory(recipeId: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/profile/view-history`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ recipeId })
    });
    if (!res.ok) throw new Error('API Response Error');
  } catch (error) {
    console.warn('[CookBook API] Log view history failed. Saving locally.');
    const user = apiGetCurrentUser();
    const local = getLocalProfile(user?.username);
    local.viewHistory = [recipeId, ...local.viewHistory.filter(id => id !== recipeId)].slice(0, 10);
    saveLocalProfile(local, user?.username || 'Шеф Гурман');
  }
}

// AI logs sync

export async function apiLogAiQuery(query: string, response: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/ai/log`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ query, response })
    });
  } catch (error) {
    console.warn('[CookBook API] AI chatbot logging failed.');
  }
}


// --- ADMIN DASHBOARD PANEL FUNCTIONS ---

export async function apiFetchAdminUsers(): Promise<UserSession[]> {
  try {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('API Response Error');
    return await res.json();
  } catch (error) {
    console.warn('[CookBook API] Fetch admin users list failed.');
    // Simulated offline users list
    return [
      { id: 'u-admin', username: 'admin', role: 'admin', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', createdAt: '08.07.2026' },
      { id: 'u-chef', username: 'chef', role: 'user', avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=150&q=80', createdAt: '08.07.2026' }
    ];
  }
}

export async function apiDeleteAdminUser(userId: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('API Response Error');
  } catch (error) {
    console.warn(`[CookBook API] Delete user ${userId} failed.`);
  }
}

export async function apiFetchAdminLogs(): Promise<AdminLog[]> {
  try {
    const res = await fetch(`${API_BASE}/admin/logs`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('API Response Error');
    return await res.json();
  } catch (error) {
    console.warn('[CookBook API] Fetch admin activity logs failed.');
    // Simulated offline logs list
    return [
      { id: 'l1', userId: 'u-chef', username: 'chef', type: 'search', detail: 'Поиск: "картофель"', timestamp: '08.07.2026, 16:30' },
      { id: 'l2', userId: 'u-chef', username: 'chef', type: 'view', detail: 'Просмотр рецепта: "Паста Карбонара"', timestamp: '08.07.2026, 16:31' },
      { id: 'l3', userId: 'u-chef', username: 'chef', type: 'ai_query', detail: 'ИИ-запрос: "Что приготовить быстро?"', timestamp: '08.07.2026, 16:32' }
    ];
  }
}

export async function apiBlockUser(userId: string, blocked: boolean): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/block`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ blocked })
    });
    if (!res.ok) throw new Error('API Response Error');
  } catch (error) {
    console.warn(`[CookBook API] Block user ${userId} failed.`);
  }
}

export async function apiChangeUserRole(userId: string, role: 'admin' | 'user'): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ role })
    });
    if (!res.ok) throw new Error('API Response Error');
  } catch (error) {
    console.warn(`[CookBook API] Change user role ${userId} failed.`);
  }
}

export async function apiFetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('API Response Error');
    return await res.json();
  } catch (error) {
    console.warn('[CookBook API] Fetch categories failed. Falling back to offline default categories.');
    return [
      { id: 1, name: 'Завтраки', icon: '🍳' },
      { id: 2, name: 'Обеды', icon: '🥗' },
      { id: 3, name: 'Ужины', icon: '🥩' },
      { id: 4, name: 'Супы', icon: '🍜' },
      { id: 5, name: 'Десерты', icon: '🍰' },
      { id: 6, name: 'Выпечка', icon: '🍞' }
    ];
  }
}

export async function apiCreateCategory(name: string, icon: string): Promise<Category> {
  try {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ name, icon })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create category');
    }
    return await res.json();
  } catch (error: any) {
    console.warn('[CookBook API] Create category failed.');
    throw error;
  }
}

export async function apiDeleteCategory(id: number): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('API Response Error');
  } catch (error) {
    console.warn(`[CookBook API] Delete category ${id} failed.`);
  }
}

export async function apiExportDatabase(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/admin/export`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('API Response Error');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cookbook_database_export.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.warn('[CookBook API] JSON Database Export failed.');
  }
}

export async function apiExportDatabaseTxt(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/admin/export/txt`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('API Response Error');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cookbook_text_report.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.warn('[CookBook API] TXT Database Export failed.');
  }
}
