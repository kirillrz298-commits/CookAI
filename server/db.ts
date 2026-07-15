import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';
import { RECIPES } from '../src/data/recipes';

type SqliteDatabase = import('sqlite').Database<any>;

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const usePostgres = Boolean(connectionString);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SQLITE_DB_PATH = path.resolve(__dirname, 'database.sqlite');

const { Pool } = pg;
let pool: pg.Pool | null = null;
let sqliteDbPromise: Promise<SqliteDatabase> | null = null;

if (usePostgres) {
  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  sqliteDbPromise = (async () => {
    const sqlite = await import('sqlite');
    const sqlite3 = await import('sqlite3');
    const db = await sqlite.open({
      filename: SQLITE_DB_PATH,
      driver: sqlite3.Database
    });
    await db.exec('PRAGMA foreign_keys = ON');
    return db;
  })();
}

function convertSql(sql: string): string {
  if (!usePostgres) {
    return sql;
  }
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

function primaryKeyDefinition(): string {
  return usePostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
}

const primaryKey = primaryKeyDefinition();

class DatabaseWrapper {
  private client: pg.PoolClient | SqliteDatabase<sqlite3.Database>;

  constructor(client: pg.PoolClient | SqliteDatabase<sqlite3.Database>) {
    this.client = client;
  }

  // Execute multi-line DDL or commands
  async exec(sql: string): Promise<void> {
    if (!usePostgres && sql.trim().toUpperCase().startsWith('PRAGMA')) {
      return;
    }

    const converted = convertSql(sql);
    if (usePostgres) {
      await (this.client as pg.PoolClient).query(converted);
    } else {
      await (this.client as SqliteDatabase<sqlite3.Database>).exec(converted);
    }
  }

  // Fetch a single row
  async get(sql: string, params: any[] = []): Promise<any> {
    const converted = convertSql(sql);
    if (usePostgres) {
      const res = await (this.client as pg.PoolClient).query(converted, params);
      return res.rows[0] || null;
    }
    return await (this.client as SqliteDatabase<sqlite3.Database>).get(converted, params);
  }

  // Fetch all rows
  async all(sql: string, params: any[] = []): Promise<any[]> {
    const converted = convertSql(sql);
    if (usePostgres) {
      const res = await (this.client as pg.PoolClient).query(converted, params);
      return res.rows;
    }
    return await (this.client as SqliteDatabase<sqlite3.Database>).all(converted, params);
  }

  // Run a query (update, insert, delete)
  async run(sql: string, params: any[] = []): Promise<{ lastID: any; changes: number }> {
    const converted = convertSql(sql);
    if (usePostgres) {
      const res = await (this.client as pg.PoolClient).query(converted, params);
      return {
        lastID: null,
        changes: res.rowCount ?? 0
      };
    }

    const res = await (this.client as SqliteDatabase<sqlite3.Database>).run(converted, params);
    return {
      lastID: (res as any).lastID,
      changes: (res as any).changes ?? 0
    };
  }

  // Release client back to the pool
  async close(): Promise<void> {
    if (usePostgres) {
      (this.client as pg.PoolClient).release();
    }
  }
}

export async function getDbConnection(): Promise<DatabaseWrapper> {
  if (usePostgres) {
    const client = await pool!.connect();
    return new DatabaseWrapper(client);
  }

  const client = await sqliteDbPromise!;
  return new DatabaseWrapper(client);
}

const DEFAULT_CATEGORIES = [
  { name: 'Завтраки', icon: '🍳' },
  { name: 'Обеды', icon: '🥗' },
  { name: 'Ужины', icon: '🥩' },
  { name: 'Супы', icon: '🍜' },
  { name: 'Десерты', icon: '🍰' },
  { name: 'Выпечка', icon: '🍞' },
  { name: 'Паста', icon: '🍝' },
  { name: 'Пицца', icon: '🍕' },
  { name: 'Бургеры', icon: '🍔' },
  { name: 'Салаты', icon: '🥗' },
  { name: 'Закуски', icon: '🧀' },
  { name: 'Напитки', icon: '🍹' },
  { name: 'ПП', icon: '🥑' },
  { name: 'Вегетарианское', icon: '🌱' },
  { name: 'Фастфуд', icon: '🍟' },
  { name: 'Гриль', icon: '🔥' }
];

export async function initDatabase() {
  console.log('Initializing PostgreSQL database with Extended Admin Controls on Neon...');
  const db = await getDbConnection();

  try {
    // Create Users Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        avatar TEXT,
        created_at TEXT NOT NULL,
        blocked INTEGER DEFAULT 0,
        first_name TEXT,
        last_name TEXT
      )
    `);

    // Create Categories Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id ${primaryKey},
        name TEXT UNIQUE NOT NULL,
        icon TEXT
      )
    `);

    // Create Recipes Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        image TEXT,
        rating REAL,
        reviews_count INTEGER,
        author TEXT,
        author_id TEXT,
        views INTEGER DEFAULT 0,
        prep_time INTEGER,
        servings INTEGER,
        difficulty TEXT,
        calories INTEGER,
        protein INTEGER,
        fat INTEGER,
        carbs INTEGER,
        cuisine TEXT,
        category TEXT,
        tags TEXT,
        status TEXT DEFAULT 'published',
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Create Ingredients Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS ingredients (
        id ${primaryKey},
        recipe_id TEXT NOT NULL,
        name TEXT NOT NULL,
        amount REAL,
        unit TEXT,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
      )
    `);

    // Create Steps Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS steps (
        id ${primaryKey},
        recipe_id TEXT NOT NULL,
        step_num INTEGER,
        text TEXT NOT NULL,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
      )
    `);

    // Create Tips Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS tips (
        id ${primaryKey},
        recipe_id TEXT NOT NULL,
        text TEXT NOT NULL,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
      )
    `);

    // Create Comments Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        recipe_id TEXT NOT NULL,
        author TEXT NOT NULL,
        avatar TEXT,
        text TEXT NOT NULL,
        date TEXT NOT NULL,
        rating INTEGER,
        user_id TEXT,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Create User Favorites Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_favorites (
        user_id TEXT NOT NULL,
        recipe_id TEXT NOT NULL,
        PRIMARY KEY (user_id, recipe_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
      )
    `);

    // Create User Settings Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id TEXT PRIMARY KEY,
        dark_mode INTEGER DEFAULT 1,
        notifications_enabled INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create Search History Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS search_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        query TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create View History Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS view_history (
        id ${primaryKey},
        user_id TEXT NOT NULL,
        recipe_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create AI logs
    await db.exec(`
      CREATE TABLE IF NOT EXISTS ai_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        query TEXT NOT NULL,
        response TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Badges / Achievements
    await db.exec(`
      CREATE TABLE IF NOT EXISTS badges (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        earned_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Cooking Streak
    await db.exec(`
      CREATE TABLE IF NOT EXISTS streaks (
        user_id TEXT PRIMARY KEY,
        current_streak INTEGER DEFAULT 0,
        max_streak INTEGER DEFAULT 0,
        last_cook_date TEXT,
        total_cooked INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Shopping List
    await db.exec(`
      CREATE TABLE IF NOT EXISTS shopping_lists (
        user_id TEXT PRIMARY KEY,
        items TEXT NOT NULL DEFAULT '[]',
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Meal Planner
    await db.exec(`
      CREATE TABLE IF NOT EXISTS meal_plans (
        user_id TEXT PRIMARY KEY,
        week_start TEXT NOT NULL,
        plan_data TEXT NOT NULL DEFAULT '{}',
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Calorie Log
    await db.exec(`
      CREATE TABLE IF NOT EXISTS calorie_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        recipe_id TEXT NOT NULL,
        recipe_title TEXT NOT NULL,
        servings REAL NOT NULL DEFAULT 1,
        calories INTEGER NOT NULL,
        protein INTEGER NOT NULL DEFAULT 0,
        fat INTEGER NOT NULL DEFAULT 0,
        carbs INTEGER NOT NULL DEFAULT 0,
        meal_type TEXT NOT NULL DEFAULT 'snack',
        added_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Author Subscriptions
    await db.exec(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        follower_id TEXT NOT NULL,
        author_username TEXT NOT NULL,
        author_avatar TEXT,
        subscribed_at TEXT NOT NULL,
        PRIMARY KEY (follower_id, author_username),
        FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Seed default Users if users table is empty
    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    if (userCount && parseInt(userCount.count, 10) === 0) {
      console.log('Users table is empty. Seeding default demo credentials...');
      
      // Seed admin (username: admin, password: adminpass)
      await db.run(
        `INSERT INTO users (id, username, password, role, avatar, created_at, blocked, first_name, last_name) 
         VALUES ('u-admin', 'admin', 'adminpass', 'admin', ?, ?, 0, 'Администратор', 'CookBook')`,
        ['https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', new Date().toLocaleDateString('ru-RU')]
      );

      // Seed default user (username: chef, password: chefpass)
      await db.run(
        `INSERT INTO users (id, username, password, role, avatar, created_at, blocked, first_name, last_name) 
         VALUES ('u-chef', 'chef', 'chefpass', 'user', ?, ?, 0, 'Шеф', 'Гурман')`,
        ['https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=150&q=80', new Date().toLocaleDateString('ru-RU')]
      );

      // Insert initial settings
      await db.run("INSERT INTO user_settings (user_id, dark_mode, notifications_enabled) VALUES ('u-admin', 1, 1)");
      await db.run("INSERT INTO user_settings (user_id, dark_mode, notifications_enabled) VALUES ('u-chef', 1, 1)");
    }

    // Seed Categories if empty
    const catCount = await db.get('SELECT COUNT(*) as count FROM categories');
    if (catCount && parseInt(catCount.count, 10) === 0) {
      console.log('Categories table is empty. Seeding default database categories...');
      for (const cat of DEFAULT_CATEGORIES) {
        await db.run('INSERT INTO categories (name, icon) VALUES (?, ?)', [cat.name, cat.icon]);
      }
    }

    // Seed recipes if empty
    const recipeCount = await db.get('SELECT COUNT(*) as count FROM recipes');
    if (recipeCount && parseInt(recipeCount.count, 10) === 0) {
      console.log('Recipes table is empty. Seeding recipes data...');
      
      for (const recipe of RECIPES) {
        await db.run(
          `INSERT INTO recipes (
            id, title, description, image, rating, reviews_count, author, author_id, views, 
            prep_time, servings, difficulty, calories, protein, fat, carbs, cuisine, category, tags, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'u-admin', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')`,
          [
            recipe.id,
            recipe.title,
            recipe.description,
            recipe.image,
            recipe.rating,
            recipe.reviewsCount,
            recipe.author,
            recipe.views,
            recipe.prepTime,
            recipe.servings,
            recipe.difficulty,
            recipe.calories,
            recipe.macros.protein,
            recipe.macros.fat,
            recipe.macros.carbs,
            recipe.cuisine,
            recipe.category,
            recipe.tags.join(',')
          ]
        );

        for (const ing of recipe.ingredients) {
          await db.run(
            `INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (?, ?, ?, ?)`,
            [recipe.id, ing.name, ing.amount, ing.unit]
          );
        }

        for (let i = 0; i < recipe.steps.length; i++) {
          await db.run(
            `INSERT INTO steps (recipe_id, step_num, text) VALUES (?, ?, ?)`,
            [recipe.id, i + 1, recipe.steps[i]]
          );
        }

        for (const tip of recipe.tips) {
          await db.run(
            `INSERT INTO tips (recipe_id, text) VALUES (?, ?)`,
            [recipe.id, tip]
          );
        }

        for (const comment of recipe.comments) {
          await db.run(
            `INSERT INTO comments (id, recipe_id, author, avatar, text, date, rating, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, 'u-admin')`,
            [comment.id, recipe.id, comment.author, comment.avatar, comment.text, comment.date, comment.rating]
          );
        }
      }
    }

    // Seed user favorites ONLY AFTER users and recipes exist
    const favCount = await db.get('SELECT COUNT(*) as count FROM user_favorites');
    if (favCount && parseInt(favCount.count, 10) === 0) {
      console.log('Seeding user favorites...');
      await db.run("INSERT INTO user_favorites (user_id, recipe_id) VALUES ('u-admin', 'pot-1')");
      await db.run("INSERT INTO user_favorites (user_id, recipe_id) VALUES ('u-admin', 'beef-1')");
      await db.run("INSERT INTO user_favorites (user_id, recipe_id) VALUES ('u-chef', 'pot-1')");
      await db.run("INSERT INTO user_favorites (user_id, recipe_id) VALUES ('u-chef', 'des-1')");
    }

    console.log('PostgreSQL database verification complete.');
  } catch (err) {
    console.error('Error during PostgreSQL initialization:', err);
  } finally {
    await db.close();
  }
}
