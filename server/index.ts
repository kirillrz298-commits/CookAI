import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { getDbConnection, initDatabase } from './db';
import type { Recipe, Comment, UserProfile, SearchHistoryItem, UserSession, AdminLog } from '../src/types';

const app = express();
const PORT = process.env.PORT || 3001;
const DIST_PATH = path.resolve(process.cwd(), 'dist');

const isDev = process.env.NODE_ENV === 'development';
const PROD_PAGE = path.join(DIST_PATH, 'landing.html');
const APP_PAGE = path.join(DIST_PATH, 'index.html');

app.use(cors());
app.use(express.json());
app.use(express.static(DIST_PATH, { index: false }));

app.get('/', (req: Request, res: Response) => {
  if (isDev) {
    return res.sendFile(APP_PAGE);
  }
  return res.sendFile(PROD_PAGE);
});

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    if (isDev) {
      return res.sendFile(APP_PAGE);
    }
    return res.sendFile(PROD_PAGE);
  }
  next();
});

// Initialize database before starting server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`[CookBook AI Backend] Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('[CookBook AI Backend] Failed to start database:', err);
  process.exit(1);
});

// Authentication Middleware
interface AuthRequest extends Request {
  user?: UserSession;
}

async function authenticateUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing token' });
    return;
  }
  
  const userId = authHeader.split(' ')[1];
  try {
    const db = await getDbConnection();
    const user = await db.get('SELECT id, username, role, avatar, blocked FROM users WHERE id = ?', [userId]);
    await db.close();

    if (!user) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }

    if (user.blocked === 1) {
      res.status(403).json({ error: 'Ваш аккаунт был заблокирован администратором' });
      return;
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role as 'admin' | 'user',
      avatar: user.avatar,
      blocked: user.blocked
    };
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal Auth Error' });
  }
}

// Helper to assemble full recipe structure
async function assembleRecipe(db: any, row: any): Promise<Recipe> {
  const recipeId = row.id;

  const ingredientsRows = await db.all('SELECT name, amount, unit FROM ingredients WHERE recipe_id = ?', [recipeId]);
  
  const stepsRows = await db.all('SELECT text FROM steps WHERE recipe_id = ? ORDER BY step_num ASC', [recipeId]);
  const steps = stepsRows.map((s: any) => s.text);

  const tipsRows = await db.all('SELECT text FROM tips WHERE recipe_id = ?', [recipeId]);
  const tips = tipsRows.map((t: any) => t.text);

  const commentsRows = await db.all('SELECT id, author, avatar, text, date, rating FROM comments WHERE recipe_id = ? ORDER BY id DESC', [recipeId]);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    image: row.image,
    rating: row.rating,
    reviewsCount: row.reviews_count,
    author: row.author,
    views: row.views,
    prepTime: row.prep_time,
    servings: row.servings,
    difficulty: row.difficulty as 'Easy' | 'Medium' | 'Hard',
    calories: row.calories,
    macros: {
      protein: row.protein,
      fat: row.fat,
      carbs: row.carbs
    },
    ingredients: ingredientsRows,
    steps,
    tips,
    comments: commentsRows,
    cuisine: row.cuisine,
    category: row.category,
    tags: row.tags ? row.tags.split(',') : [],
    author_id: row.author_id,
    status: row.status as 'published' | 'draft'
  };
}

// --- AUTHENTICATION ROUTES ---

// 1. POST /api/auth/register
app.post('/api/auth/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, firstName, lastName } = req.body;
    if (!username || !password || username.trim().length < 3 || password.trim().length < 4) {
      res.status(400).json({ error: 'Имя пользователя должно быть от 3 символов, а пароль — от 4 символов' });
      return;
    }
    if (!firstName || !firstName.trim()) {
      res.status(400).json({ error: 'Пожалуйста, укажите ваше имя' });
      return;
    }

    const db = await getDbConnection();
    
    // Check if user already exists
    const existing = await db.get('SELECT id FROM users WHERE username = ?', [username.trim()]);
    if (existing) {
      res.status(400).json({ error: 'Пользователь с таким именем уже существует' });
      await db.close();
      return;
    }

    const userId = `u-${Date.now()}`;
    const avatar = `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 900000)}?auto=format&fit=crop&w=150&q=80`;
    const createdAt = new Date().toLocaleDateString('ru-RU');
    
    // Assign admin role if username starts with 'admin' for demo purposes
    const role = username.toLowerCase().startsWith('admin') ? 'admin' : 'user';

    // Insert user
    await db.run(
      'INSERT INTO users (id, username, password, role, avatar, created_at, blocked, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)',
      [userId, username.trim(), password, role, avatar, createdAt, firstName.trim(), lastName ? lastName.trim() : '']
    );

    // Create default settings row
    await db.run(
      'INSERT INTO user_settings (user_id, dark_mode, notifications_enabled) VALUES (?, 1, 1)',
      [userId]
    );

    await db.close();
    res.status(201).json({ id: userId, username, role, avatar, blocked: 0 });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. POST /api/auth/login
app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Укажите логин и пароль' });
      return;
    }

    const db = await getDbConnection();
    const user = await db.get('SELECT id, username, password, role, avatar, blocked FROM users WHERE username = ?', [username.trim()]);
    await db.close();

    if (!user || user.password !== password) {
      res.status(400).json({ error: 'Неверное имя пользователя или пароль' });
      return;
    }

    if (user.blocked === 1) {
      res.status(403).json({ error: 'Ваш аккаунт заблокирован администратором' });
      return;
    }

    res.json({ id: user.id, username: user.username, role: user.role, avatar: user.avatar, blocked: user.blocked });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. GET /api/auth/me
app.get('/api/auth/me', authenticateUser, (req: AuthRequest, res: Response) => {
  res.json(req.user);
});


// --- RECIPE CRUD ROUTES (Admin and User) ---

// Get all recipes (search & filter) - Public & Scoped
app.get('/api/recipes', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDbConnection();
    const { query, cuisine, category, difficulty, maxTime, maxCalories, sortBy, ingredients } = req.query;

    // Detect if caller has authenticated session token to allow viewing drafts
    let authenticatedUserId: string | null = null;
    let isUserAdmin = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const caller = await db.get('SELECT id, role, blocked FROM users WHERE id = ?', [token]);
      if (caller && caller.blocked === 0) {
        authenticatedUserId = caller.id;
        isUserAdmin = caller.role === 'admin';
      }
    }

    let sql = 'SELECT * FROM recipes WHERE 1=1';
    const params: any[] = [];

    // Draft filtering scope: Admins see all, users see published + own drafts, guests see published only
    if (isUserAdmin) {
      // no draft filters
    } else if (authenticatedUserId) {
      sql += ' AND (status = "published" OR author_id = ?)';
      params.push(authenticatedUserId);
    } else {
      sql += ' AND status = "published"';
    }

    if (query && typeof query === 'string' && query.trim()) {
      const q = `%${query.toLowerCase().trim()}%`;
      sql += ' AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(tags) LIKE ?)';
      params.push(q, q, q);
    }
    if (cuisine && typeof cuisine === 'string') {
      sql += ' AND cuisine = ?';
      params.push(cuisine);
    }
    if (category && typeof category === 'string') {
      sql += ' AND (category = ? OR tags LIKE ?)';
      params.push(category, `%${category.toLowerCase()}%`);
    }
    if (difficulty && typeof difficulty === 'string') {
      sql += ' AND difficulty = ?';
      params.push(difficulty);
    }
    if (maxTime) {
      sql += ' AND prep_time <= ?';
      params.push(Number(maxTime));
    }
    if (maxCalories) {
      sql += ' AND calories <= ?';
      params.push(Number(maxCalories));
    }

    if (sortBy === 'rating') {
      sql += ' ORDER BY rating DESC';
    } else if (sortBy === 'views') {
      sql += ' ORDER BY views DESC';
    } else if (sortBy === 'timeAsc') {
      sql += ' ORDER BY prep_time ASC';
    } else if (sortBy === 'caloriesAsc') {
      sql += ' ORDER BY calories ASC';
    }

    const rows = await db.all(sql, params);
    const recipes: Recipe[] = [];

    for (const row of rows) {
      const assembled = await assembleRecipe(db, row);
      if (ingredients && typeof ingredients === 'string') {
        const selected = ingredients.split(',');
        const matches = selected.every(name => 
          assembled.ingredients.some(i => i.name.toLowerCase().includes(name.toLowerCase())) ||
          assembled.tags.some(t => t.toLowerCase().includes(name.toLowerCase()))
        );
        if (!matches) continue;
      }
      recipes.push(assembled);
    }

    await db.close();
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get recipe by ID - Public
app.get('/api/recipes/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDbConnection();
    const recipeId = req.params.id;

    await db.run('UPDATE recipes SET views = views + 1 WHERE id = ?', [recipeId]);
    const row = await db.get('SELECT * FROM recipes WHERE id = ?', [recipeId]);
    
    if (!row) {
      res.status(404).json({ error: 'Recipe not found' });
      await db.close();
      return;
    }

    const recipe = await assembleRecipe(db, row);
    await db.close();
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create new recipe - Authenticated Users
app.post('/api/recipes', authenticateUser, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDbConnection();
    const userId = req.user?.id;
    const authorName = req.user?.username || 'Шеф';
    
    const { 
      title, description, image, prepTime, servings, 
      difficulty, calories, macros, ingredients, steps, tips, cuisine, category, status 
    } = req.body;

    if (!title || !ingredients || !steps) {
      res.status(400).json({ error: 'Укажите название, ингредиенты и этапы приготовления' });
      await db.close();
      return;
    }

    const recipeId = `rec-${Date.now()}`;
    const defaultImage = image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
    const tags = [cuisine, category, title].filter(Boolean).join(',').toLowerCase();
    const recipeStatus = status || 'published';

    // Insert recipe
    await db.run(
      `INSERT INTO recipes (
        id, title, description, image, rating, reviews_count, author, author_id, views, 
        prep_time, servings, difficulty, calories, protein, fat, carbs, cuisine, category, tags, status
      ) VALUES (?, ?, ?, ?, 5.0, 0, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recipeId, title, description || '', defaultImage, authorName, userId,
        Number(prepTime || 30), Number(servings || 2), difficulty || 'Medium', Number(calories || 250),
        Number(macros?.protein || 10), Number(macros?.fat || 10), Number(macros?.carbs || 30),
        cuisine || 'Русская', category || 'Обеды', tags, recipeStatus
      ]
    );

    // Insert ingredients
    for (const ing of ingredients) {
      await db.run(
        'INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (?, ?, ?, ?)',
        [recipeId, ing.name, Number(ing.amount || 0), ing.unit || '']
      );
    }

    // Insert steps
    for (let i = 0; i < steps.length; i++) {
      await db.run(
        'INSERT INTO steps (recipe_id, step_num, text) VALUES (?, ?, ?)',
        [recipeId, i + 1, steps[i]]
      );
    }

    // Insert tips
    if (tips && Array.isArray(tips)) {
      for (const tip of tips) {
        if (tip.trim()) {
          await db.run('INSERT INTO tips (recipe_id, text) VALUES (?, ?)', [recipeId, tip]);
        }
      }
    }

    const createdRecipe = await assembleRecipe(db, { id: recipeId, title, description, image: defaultImage, rating: 5.0, reviews_count: 0, author: authorName, views: 0, prep_time: prepTime, servings, difficulty, calories, protein: macros?.protein, fat: macros?.fat, carbs: macros?.carbs, cuisine, category, tags, status: recipeStatus });
    await db.close();
    res.status(201).json(createdRecipe);
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update Recipe - Authenticated Author / Admin
app.put('/api/recipes/:id', authenticateUser, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDbConnection();
    const recipeId = req.params.id;
    const userId = req.user?.id;
    const isSysAdmin = req.user?.role === 'admin';

    // Verify ownership
    const recipeRecord = await db.get('SELECT author_id FROM recipes WHERE id = ?', [recipeId]);
    if (!recipeRecord) {
      res.status(404).json({ error: 'Recipe not found' });
      await db.close();
      return;
    }

    if (recipeRecord.author_id !== userId && !isSysAdmin) {
      res.status(403).json({ error: 'У вас нет прав на редактирование этого рецепта' });
      await db.close();
      return;
    }

    const { 
      title, description, image, prepTime, servings, 
      difficulty, calories, macros, ingredients, steps, tips, cuisine, category, status 
    } = req.body;

    const tags = [cuisine, category, title].filter(Boolean).join(',').toLowerCase();
    const recipeStatus = status || 'published';

    const defaultImage = image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

    // Update recipe base
    await db.run(
      `UPDATE recipes SET 
        title = ?, description = ?, image = ?, prep_time = ?, servings = ?, 
        difficulty = ?, calories = ?, protein = ?, fat = ?, carbs = ?, 
        cuisine = ?, category = ?, tags = ?, status = ?
      WHERE id = ?`,
      [
        title, description, defaultImage, Number(prepTime), Number(servings),
        difficulty, Number(calories), Number(macros?.protein), Number(macros?.fat), Number(macros?.carbs),
        cuisine, category, tags, recipeStatus, recipeId
      ]
    );

    // Re-insert ingredients
    await db.run('DELETE FROM ingredients WHERE recipe_id = ?', [recipeId]);
    for (const ing of ingredients) {
      await db.run(
        'INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (?, ?, ?, ?)',
        [recipeId, ing.name, Number(ing.amount), ing.unit]
      );
    }

    // Re-insert steps
    await db.run('DELETE FROM steps WHERE recipe_id = ?', [recipeId]);
    for (let i = 0; i < steps.length; i++) {
      await db.run(
        'INSERT INTO steps (recipe_id, step_num, text) VALUES (?, ?, ?)',
        [recipeId, i + 1, steps[i]]
      );
    }

    // Re-insert tips
    await db.run('DELETE FROM tips WHERE recipe_id = ?', [recipeId]);
    if (tips && Array.isArray(tips)) {
      for (const tip of tips) {
        if (tip.trim()) {
          await db.run('INSERT INTO tips (recipe_id, text) VALUES (?, ?)', [recipeId, tip]);
        }
      }
    }

    const updatedRow = await db.get('SELECT * FROM recipes WHERE id = ?', [recipeId]);
    const updatedRecipe = await assembleRecipe(db, updatedRow);
    await db.close();
    res.json(updatedRecipe);
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete Recipe - Authenticated Author / Admin
app.delete('/api/recipes/:id', authenticateUser, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDbConnection();
    const recipeId = req.params.id;
    const userId = req.user?.id;
    const isSysAdmin = req.user?.role === 'admin';

    const recipeRecord = await db.get('SELECT author_id FROM recipes WHERE id = ?', [recipeId]);
    if (!recipeRecord) {
      res.status(404).json({ error: 'Recipe not found' });
      await db.close();
      return;
    }

    if (recipeRecord.author_id !== userId && !isSysAdmin) {
      res.status(403).json({ error: 'У вас нет прав на удаление этого рецепта' });
      await db.close();
      return;
    }

    await db.run('DELETE FROM recipes WHERE id = ?', [recipeId]);
    await db.close();
    res.json({ message: 'Рецепт удален' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Add comment to recipe
app.post('/api/recipes/:id/comments', authenticateUser, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDbConnection();
    const recipeId = req.params.id;
    const userId = req.user?.id;
    const { author, avatar, text, date, rating } = req.body;

    if (!text || !rating) {
      res.status(400).json({ error: 'Укажите текст и оценку' });
      await db.close();
      return;
    }

    const commentId = `c-sql-${Date.now()}`;
    await db.run(
      'INSERT INTO comments (id, recipe_id, author, avatar, text, date, rating, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [commentId, recipeId, author, avatar || '', text, date || new Date().toLocaleDateString('ru-RU'), Number(rating), userId]
    );

    // Recompute averages
    const comments = await db.all('SELECT rating FROM comments WHERE recipe_id = ?', [recipeId]);
    const reviewsCount = comments.length;
    const avgRating = Number((comments.reduce((sum, c) => sum + c.rating, 0) / reviewsCount).toFixed(1));

    await db.run('UPDATE recipes SET rating = ?, reviews_count = ? WHERE id = ?', [avgRating, reviewsCount, recipeId]);

    await db.close();
    res.status(201).json({ id: commentId, author, avatar, text, date, rating });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// --- USER PROFILE & OWN UPLOADS ---

// Fetch Profile
app.get('/api/profile', authenticateUser, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDbConnection();
    const userId = req.user?.id;

    // Get user details
    const userRow = await db.get('SELECT username, avatar FROM users WHERE id = ?', [userId]);
    const settingsRow = await db.get('SELECT dark_mode, notifications_enabled FROM user_settings WHERE user_id = ?', [userId]);
    const favoritesRows = await db.all('SELECT recipe_id FROM user_favorites WHERE user_id = ?', [userId]);
    const searchHistoryRows = await db.all('SELECT id, query, timestamp FROM search_history WHERE user_id = ? ORDER BY id DESC LIMIT 10', [userId]);
    const viewHistoryRows = await db.all('SELECT recipe_id FROM view_history WHERE user_id = ? ORDER BY id DESC LIMIT 10', [userId]);

    const favorites = favoritesRows.map((f: any) => f.recipe_id);
    const viewIds = Array.from(new Set(viewHistoryRows.map((v: any) => v.recipe_id)));

    const responseProfile: UserProfile = {
      name: userRow.username,
      avatar: userRow.avatar,
      favorites,
      searchHistory: searchHistoryRows,
      viewHistory: viewIds,
      settings: {
        darkMode: settingsRow ? settingsRow.dark_mode === 1 : true,
        notificationsEnabled: settingsRow ? settingsRow.notifications_enabled === 1 : true
      }
    };

    await db.close();
    res.json(responseProfile);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update Profile settings
app.post('/api/profile', authenticateUser, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDbConnection();
    const userId = req.user?.id;
    const { name, avatar, settings } = req.body;

    const darkMode = settings?.darkMode ? 1 : 0;
    const notificationsEnabled = settings?.notificationsEnabled ? 1 : 0;

    // Update settings table
    await db.run(
      'INSERT INTO user_settings (user_id, dark_mode, notifications_enabled) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET dark_mode = excluded.dark_mode, notifications_enabled = excluded.notifications_enabled',
      [userId, darkMode, notificationsEnabled]
    );

    // Update username / avatar if changed
    if (name) {
      await db.run('UPDATE users SET username = ? WHERE id = ?', [name.trim(), userId]);
    }
    if (avatar) {
      await db.run('UPDATE users SET avatar = ? WHERE id = ?', [avatar, userId]);
    }

    await db.close();
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Toggle Favorite
app.post('/api/profile/favorites', authenticateUser, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDbConnection();
    const userId = req.user?.id;
    const { recipeId } = req.body;

    const existing = await db.get('SELECT recipe_id FROM user_favorites WHERE user_id = ? AND recipe_id = ?', [userId, recipeId]);
    
    if (existing) {
      await db.run('DELETE FROM user_favorites WHERE user_id = ? AND recipe_id = ?', [userId, recipeId]);
    } else {
      await db.run('INSERT INTO user_favorites (user_id, recipe_id) VALUES (?, ?)', [userId, recipeId]);
    }

    const updatedRows = await db.all('SELECT recipe_id FROM user_favorites WHERE user_id = ?', [userId]);
    const updatedFavs = updatedRows.map((f: any) => f.recipe_id);

    await db.close();
    res.json(updatedFavs);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Log Search Query
app.post('/api/profile/search-history', authenticateUser, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDbConnection();
    const userId = req.user?.id;
    const { query } = req.body;

    const timestamp = new Date().toLocaleString('ru-RU', { 
      hour: '2-digit', minute: '2-digit', 
      day: '2-digit', month: '2-digit', year: 'numeric' 
    });

    const searchId = `sh-${Date.now()}`;
    await db.run(
      'INSERT INTO search_history (id, user_id, query, timestamp) VALUES (?, ?, ?, ?)',
      [searchId, userId, query.trim(), timestamp]
    );

    // Keep last 10
    const logs = await db.all('SELECT id FROM search_history WHERE user_id = ? ORDER BY id DESC', [userId]);
    if (logs.length > 10) {
      const idsToDelete = logs.slice(10).map((l: any) => l.id);
      const placeholders = idsToDelete.map(() => '?').join(',');
      await db.run(`DELETE FROM search_history WHERE id IN (${placeholders})`, idsToDelete);
    }

    await db.close();
    res.json({ id: searchId, query, timestamp });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Log View Recipe
app.post('/api/profile/view-history', authenticateUser, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDbConnection();
    const userId = req.user?.id;
    const { recipeId } = req.body;

    const timestamp = new Date().toISOString();
    await db.run(
      'INSERT INTO view_history (user_id, recipe_id, timestamp) VALUES (?, ?, ?)',
      [userId, recipeId, timestamp]
    );

    // Keep last 10
    const logs = await db.all('SELECT id FROM view_history WHERE user_id = ? ORDER BY id DESC', [userId]);
    if (logs.length > 10) {
      const idsToDelete = logs.slice(10).map((l: any) => l.id);
      const placeholders = idsToDelete.map(() => '?').join(',');
      await db.run(`DELETE FROM view_history WHERE id IN (${placeholders})`, idsToDelete);
    }

    await db.close();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// --- DYNAMIC CATEGORIES API (Admin & Public) ---

app.get('/api/categories', async (req: Request, res: Response) => {
  try {
    const db = await getDbConnection();
    const list = await db.all('SELECT * FROM categories ORDER BY id ASC');
    await db.close();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read categories' });
  }
});

app.post('/api/categories', authenticateUser, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Admin only' });
      return;
    }
    const { name, icon } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Имя категории обязательно' });
      return;
    }

    const db = await getDbConnection();
    await db.run('INSERT INTO categories (name, icon) VALUES (?, ?)', [name.trim(), icon || '🍽️']);
    const newlyCreated = await db.get('SELECT * FROM categories WHERE name = ?', [name.trim()]);
    await db.close();

    res.status(201).json(newlyCreated);
  } catch (error) {
    res.status(500).json({ error: 'Категория с таким названием уже существует' });
  }
});

app.delete('/api/categories/:id', authenticateUser, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Admin only' });
      return;
    }
    const catId = req.params.id;
    const db = await getDbConnection();
    await db.run('DELETE FROM categories WHERE id = ?', [catId]);
    await db.close();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});


// --- AI INTERACTION CHAT LOGGING ---

// POST /api/ai/log (Save chatbot processing transactions)
app.post('/api/ai/log', authenticateUser, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDbConnection();
    const userId = req.user?.id;
    const { query, response } = req.body;

    if (!query || !response) {
      res.status(400).json({ error: 'query and response are required' });
      await db.close();
      return;
    }

    const logId = `ai-${Date.now()}`;
    const timestamp = new Date().toLocaleString('ru-RU');

    await db.run(
      'INSERT INTO ai_logs (id, user_id, query, response, timestamp) VALUES (?, ?, ?, ?, ?)',
      [logId, userId, query, response, timestamp]
    );

    await db.close();
    res.status(201).json({ id: logId, query, response, timestamp });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// --- ADMIN DASHBOARD PANEL (Admin-only routes) ---

// Verify Admin Middleware
async function checkAdmin(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Access Denied: Admin role required' });
    return;
  }
  next();
}

// 1. GET /api/admin/users
app.get('/api/admin/users', authenticateUser, checkAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDbConnection();
    const users = await db.all('SELECT id, username, role, avatar, created_at, blocked FROM users ORDER BY id DESC');
    await db.close();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. DELETE /api/admin/users/:id
app.delete('/api/admin/users/:id', authenticateUser, checkAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDbConnection();
    const userId = req.params.id;

    if (userId === 'u-admin') {
      res.status(400).json({ error: 'Нельзя удалить главного администратора' });
      await db.close();
      return;
    }

    await db.run('DELETE FROM users WHERE id = ?', [userId]);
    await db.close();
    res.json({ message: 'Пользователь удален' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. POST /api/admin/users/:id/block (Block/Unblock)
app.post('/api/admin/users/:id/block', authenticateUser, checkAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDbConnection();
    const userId = req.params.id;
    const { blocked } = req.body;

    if (userId === 'u-admin') {
      res.status(400).json({ error: 'Нельзя заблокировать главного администратора' });
      await db.close();
      return;
    }

    await db.run('UPDATE users SET blocked = ? WHERE id = ?', [blocked ? 1 : 0, userId]);
    await db.close();
    res.json({ success: true, blocked });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. POST /api/admin/users/:id/role (Change User Role)
app.post('/api/admin/users/:id/role', authenticateUser, checkAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDbConnection();
    const userId = req.params.id;
    const { role } = req.body;

    if (userId === 'u-admin') {
      res.status(400).json({ error: 'Нельзя изменить роль главного администратора' });
      await db.close();
      return;
    }

    if (role !== 'admin' && role !== 'user') {
      res.status(400).json({ error: 'Недопустимая роль' });
      await db.close();
      return;
    }

    await db.run('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    await db.close();
    res.json({ success: true, role });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 5. GET /api/admin/logs (Aggregated system activity audit logs)
app.get('/api/admin/logs', authenticateUser, checkAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDbConnection();

    // Query Search History logs
    const searchLogs = await db.all(`
      SELECT sh.id, sh.query as detail, sh.timestamp, u.username, u.id as userId
      FROM search_history sh
      JOIN users u ON sh.user_id = u.id
      ORDER BY sh.id DESC LIMIT 30
    `);
    const searchLogsMapped: AdminLog[] = searchLogs.map((l: any) => ({
      id: l.id,
      userId: l.userId,
      username: l.username,
      type: 'search',
      detail: `Поиск: "${l.detail}"`,
      timestamp: l.timestamp
    }));

    // Query View logs
    const viewLogs = await db.all(`
      SELECT vh.id, r.title as detail, vh.timestamp, u.username, u.id as userId
      FROM view_history vh
      JOIN users u ON vh.user_id = u.id
      JOIN recipes r ON vh.recipe_id = r.id
      ORDER BY vh.id DESC LIMIT 30
    `);
    const viewLogsMapped: AdminLog[] = viewLogs.map((l: any) => ({
      id: String(l.id),
      userId: l.userId,
      username: l.username,
      type: 'view',
      detail: `Просмотр рецепта: "${l.detail}"`,
      timestamp: new Date(l.timestamp).toLocaleString('ru-RU')
    }));

    // Query AI interaction logs
    const aiLogs = await db.all(`
      SELECT al.id, al.query, al.timestamp, u.username, u.id as userId
      FROM ai_logs al
      JOIN users u ON al.user_id = u.id
      ORDER BY al.id DESC LIMIT 30
    `);
    const aiLogsMapped: AdminLog[] = aiLogs.map((l: any) => ({
      id: l.id,
      userId: l.userId,
      username: l.username,
      type: 'ai_query',
      detail: `ИИ-запрос: "${l.query}"`,
      timestamp: l.timestamp
    }));

    // Merge and sort chronologically
    const allLogs = [...searchLogsMapped, ...viewLogsMapped, ...aiLogsMapped]
      .sort((a, b) => b.id.localeCompare(a.id))
      .slice(0, 50);

    await db.close();
    res.json(allLogs);
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 6. GET /api/admin/export (Backup Database as JSON Report)
app.get('/api/admin/export', authenticateUser, checkAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDbConnection();
    
    const users = await db.all('SELECT id, username, role, avatar, created_at, blocked FROM users');
    const recipesRows = await db.all('SELECT * FROM recipes');
    const categories = await db.all('SELECT * FROM categories');
    const comments = await db.all('SELECT * FROM comments');
    
    // Fetch logs
    const searchLogs = await db.all('SELECT * FROM search_history');
    const viewLogs = await db.all('SELECT * FROM view_history');
    const aiLogs = await db.all('SELECT * FROM ai_logs');

    const recipes: Recipe[] = [];
    for (const r of recipesRows) {
      recipes.push(await assembleRecipe(db, r));
    }

    await db.close();

    const backupData = {
      exportedAt: new Date().toISOString(),
      usersCount: users.length,
      recipesCount: recipes.length,
      categoriesCount: categories.length,
      users,
      recipes,
      categories,
      comments,
      auditLogs: {
        searches: searchLogs,
        views: viewLogs,
        aiInteractions: aiLogs
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=cookbook_database_export.json');
    res.json(backupData);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to compile database report' });
  }
});

// 7. GET /api/admin/export/txt (Backup Database as Plain-Text Report)
app.get('/api/admin/export/txt', authenticateUser, checkAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDbConnection();
    
    const users = await db.all('SELECT id, username, role, blocked FROM users');
    const recipes = await db.all('SELECT title, views, rating, category, cuisine FROM recipes');
    const categories = await db.all('SELECT name FROM categories');
    
    // Fetch logs with username fallbacks
    const aiLogs = await db.all(`
      SELECT al.query, al.timestamp, COALESCE(u.username, 'Аноним') as username 
      FROM ai_logs al 
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.id DESC LIMIT 15
    `);
    const searchLogs = await db.all(`
      SELECT sh.query, sh.timestamp, COALESCE(u.username, 'Аноним') as username 
      FROM search_history sh 
      LEFT JOIN users u ON sh.user_id = u.id
      ORDER BY sh.id DESC LIMIT 15
    `);
    
    await db.close();

    const timestamp = new Date().toLocaleString('ru-RU');

    let txt = `==================================================\n`;
    txt += `     ОТЧЕТ О СОСТОЯНИИ КУЛИНАРНОЙ БИБЛИОТЕКИ COOKBOOK AI\n`;
    txt += `==================================================\n`;
    txt += `Дата выгрузки: ${timestamp}\n\n`;

    txt += `1. ОБЩАЯ СТАТИСТИКА БАЗЫ ДАННЫХ\n`;
    txt += `--------------------------------------------------\n`;
    txt += `- Всего пользователей: ${users.length}\n`;
    txt += `- Всего рецептов в каталоге: ${recipes.length}\n`;
    txt += `- Всего категорий: ${categories.length}\n\n`;

    txt += `2. УЧАСТНИКИ ПРОЕКТА\n`;
    txt += `--------------------------------------------------\n`;
    users.forEach((u: any) => {
      txt += `- Логин: ${u.username} | Роль: ${u.role === 'admin' ? 'Администратор' : 'Пользователь'} | Статус: ${u.blocked === 1 ? 'ЗАБЛОКИРОВАН 🚫' : 'Активен ✅'}\n`;
    });
    txt += `\n`;

    txt += `3. КУЛИНАРНЫЙ АССОРТИМЕНТ (Топ по просмотрам)\n`;
    txt += `--------------------------------------------------\n`;
    const sortedRecipes = [...recipes].sort((a, b) => b.views - a.views);
    sortedRecipes.forEach((r: any, idx: number) => {
      txt += `${idx + 1}. "${r.title}" | Кухня: ${r.cuisine} | Категория: ${r.category} | Просмотров: ${r.views} | Оценка: ${r.rating}/5.0\n`;
    });
    txt += `\n`;

    txt += `4. ПОСЛЕДНИЕ ПОИСКОВЫЕ ЗАПРОСЫ ПОЛЬЗОВАТЕЛЕЙ\n`;
    txt += `--------------------------------------------------\n`;
    if (searchLogs.length === 0) {
      txt += `Запросов еще не зафиксировано.\n`;
    } else {
      searchLogs.forEach((s: any) => {
        txt += `[${s.timestamp}] @${s.username} искал: "${s.query}"\n`;
      });
    }
    txt += `\n`;

    txt += `5. ПОСЛЕДНИЕ ЗАПРОСЫ К ИИ ШЕФ-ПОВАРУ\n`;
    txt += `--------------------------------------------------\n`;
    if (aiLogs.length === 0) {
      txt += `Диалогов еще не зафиксировано.\n`;
    } else {
      aiLogs.forEach((al: any) => {
        txt += `[${al.timestamp}] @${al.username} спросил: "${al.query}"\n`;
      });
    }
    txt += `\n==================================================\n`;
    txt += `               КОНЕЦ ОТЧЕТА\n`;
    txt += `==================================================\n`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=cookbook_text_report.txt');
    res.send(txt);
  } catch (error) {
    console.error('TXT report error:', error);
    res.status(500).send('Ошибка при генерации текстового отчета');
  }
});
