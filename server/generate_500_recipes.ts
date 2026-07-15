import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { RECIPES } from '../src/data/recipes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, 'database.sqlite');

const CUISINES = ["Русская", "Итальянская", "Французская", "Грузинская", "Азиатская", "Мексиканская", "Американская", "Японская", "Испанская", "Греческая"];
const CATEGORIES = ["Завтраки", "Обеды", "Ужины", "Супы", "Десерты", "Выпечка", "Паста", "Пицца", "Бургеры", "Салаты", "Закуски", "Напитки", "ПП", "Вегетарианское", "Гриль", "Фастфуд"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

// Combinatorics for standard savory recipes
const ADJECTIVES = ["Пряный", "Ароматный", "Нежный", "Сливочный", "Классический", "Острый", "Домашний", "Хрустящий", "Сочный", "Пикантный", "Запеченный", "Жареный"];
const PROTEINS = [
  { name: "курицей", ingredient: "Куриное филе", amount: 300, unit: "г", protein: 22, fat: 3, carbs: 0 },
  { name: "говядиной", ingredient: "Говядина без кости", amount: 250, unit: "г", protein: 19, fat: 12, carbs: 0 },
  { name: "свининой", ingredient: "Свиная вырезка", amount: 250, unit: "г", protein: 18, fat: 15, carbs: 0 },
  { name: "лососем", ingredient: "Филе лосося", amount: 200, unit: "г", protein: 20, fat: 13, carbs: 0 },
  { name: "креветками", ingredient: "Очищенные креветки", amount: 150, unit: "г", protein: 18, fat: 1, carbs: 0 },
  { name: "грибами", ingredient: "Шампиньоны", amount: 200, unit: "г", protein: 3, fat: 1, carbs: 4 },
  { name: "сыром тофу", ingredient: "Сыр Тофу", amount: 200, unit: "г", protein: 8, fat: 4, carbs: 1 },
  { name: "индейкой", ingredient: "Филе индейки", amount: 300, unit: "г", protein: 21, fat: 2, carbs: 0 }
];
const BASES = [
  { name: "картофелем", ingredient: "Картофель", amount: 300, unit: "г", protein: 2, fat: 0, carbs: 16 },
  { name: "рисом басмати", ingredient: "Рис Басмати", amount: 120, unit: "г", protein: 3, fat: 0, carbs: 28 },
  { name: "итальянской пастой", ingredient: "Паста твердых сортов", amount: 150, unit: "г", protein: 5, fat: 1, carbs: 30 },
  { name: "овощным рагу", ingredient: "Болгарский перец и кабачки", amount: 250, unit: "г", protein: 1, fat: 0, carbs: 6 },
  { name: "сладкой тыквой", ingredient: "Тыква свежая", amount: 300, unit: "г", protein: 1, fat: 0, carbs: 7 },
  { name: "баклажанами и томатами", ingredient: "Баклажаны", amount: 200, unit: "г", protein: 1, fat: 0, carbs: 5 },
  { name: "зеленой гречкой", ingredient: "Гречневая крупа", amount: 120, unit: "г", protein: 4, fat: 1, carbs: 25 }
];
const SAUCES = [
  { name: "в чесночном соусе", ingredient: "Чесночный соус", amount: 50, unit: "г", protein: 1, fat: 10, carbs: 4 },
  { name: "в сливках с зеленью", ingredient: "Сливки 20%", amount: 100, unit: "мл", protein: 2, fat: 20, carbs: 4 },
  { name: "под сырной корочкой", ingredient: "Сыр Моцарелла", amount: 80, unit: "г", protein: 18, fat: 18, carbs: 1 },
  { name: "в кисло-сладком соусе", ingredient: "Кисло-сладкий соус", amount: 60, unit: "г", protein: 0, fat: 0, carbs: 15 },
  { name: "с томатным соусом маринара", ingredient: "Томатная паста", amount: 80, unit: "г", protein: 1, fat: 0, carbs: 8 }
];

// Special category templates to make culinary sense
const DRINK_ADJS = ["Освежающий", "Пряный", "Горячий", "Холодный", "Цитрусовый", "Тонизирующий", "Фруктовый", "Мятный"];
const DRINK_NOUNS = ["морс", "чай", "лимонад", "коктейль", "смузи", "пунш", "напиток", "компот"];
const DRINK_ADDITIONS = ["с лесной черникой", "с лимоном и мятой", "с имбирем и медом", "с сочным апельсином", "с садовой клубникой", "с брусникой и корицей"];

const SWEET_ADJS = ["Нежный", "Сладкий", "Шоколадный", "Клубничный", "Ванильный", "Ягодный", "Воздушный", "Ароматный"];
const SWEET_NOUNS = ["пирог", "кекс", "мусс", "пудинг", "рулет", "суфле", "чизкейк", "бисквит"];
const SWEET_ADDITIONS = ["с карамелью", "с грецкими орехами", "с темным шоколадом", "с лесной малиной", "со сливочным кремом"];

const PIZZA_TYPES = ["пепперони", "маргарита", "с ветчиной и грибами", "с курицей и ананасами", "четыре сыра", "с овощами гриль", "с острым салями"];
const BURGER_TYPES = ["с мраморной говядиной", "с сочной куриной грудкой", "с беконом и луком фри", "барбекю с чеддером", "острый халапеньо"];

// Per-category image pools — each generated recipe gets a photo matching its dish type
const CATEGORY_IMAGES: Record<string, string[]> = {
  "Завтраки": [
    "https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=800&q=80", // pancakes
    "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80", // eggs benedict
    "https://images.unsplash.com/photo-1546039907-7fa05f864c02?auto=format&fit=crop&w=800&q=80", // oatmeal
    "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80", // breakfast bowl
    "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80"  // toast avocado
  ],
  "Обеды": [
    "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80", // grilled meat
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80", // pizza style
    "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80", // rice dish
    "https://images.unsplash.com/photo-1432139509613-5c4255815697?auto=format&fit=crop&w=800&q=80", // chicken
    "https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&w=800&q=80"  // stew
  ],
  "Ужины": [
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80", // steak
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80", // dinner plate
    "https://images.unsplash.com/photo-1432139509613-5c4255815697?auto=format&fit=crop&w=800&q=80", // roast chicken
    "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80", // salmon
    "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=800&q=80"  // pasta bake
  ],
  "Супы": [
    "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80", // soup bowl
    "https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=800&q=80", // cream soup
    "https://images.unsplash.com/photo-1604152135912-04a022e23696?auto=format&fit=crop&w=800&q=80", // ramen
    "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80", // tomato soup
    "https://images.unsplash.com/photo-1575871000396-43c9cb1b74b8?auto=format&fit=crop&w=800&q=80"  // pho
  ],
  "Десерты": [
    "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80", // cake slice
    "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=800&q=80", // dessert plate
    "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80", // chocolate cake
    "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80", // ice cream
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80"  // cheesecake
  ],
  "Выпечка": [
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80", // bread loaf
    "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80", // pastry
    "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=800&q=80", // muffins
    "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80", // croissants
    "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=800&q=80"  // cookies
  ],
  "Паста": [
    "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=800&q=80", // pasta plate
    "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=800&q=80", // spaghetti
    "https://images.unsplash.com/photo-1548141369-b40f9fdf7c73?auto=format&fit=crop&w=800&q=80", // penne
    "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=80", // carbonara
    "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=800&q=80"  // pasta bolognese
  ],
  "Пицца": [
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80", // margherita pizza
    "https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&w=800&q=80", // pepperoni pizza
    "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80", // pizza slice
    "https://images.unsplash.com/photo-1595854341625-f33ee10dbf98?auto=format&fit=crop&w=800&q=80", // pizza close up
    "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80"  // pizza rustic
  ],
  "Бургеры": [
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80", // classic burger
    "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=800&q=80", // cheeseburger
    "https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=800&q=80", // burger stack
    "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80", // gourmet burger
    "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=800&q=80"  // smash burger
  ],
  "Салаты": [
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80", // fresh salad
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80", // green salad
    "https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=800&q=80", // caesar salad
    "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=800&q=80", // greek salad
    "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=800&q=80"  // niçoise
  ],
  "Закуски": [
    "https://images.unsplash.com/photo-1541014741259-de529411b96a?auto=format&fit=crop&w=800&q=80", // appetizers
    "https://images.unsplash.com/photo-1536816579748-4ecb3f03d72a?auto=format&fit=crop&w=800&q=80", // bruschetta
    "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=800&q=80", // dips
    "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=800&q=80", // tapas
    "https://images.unsplash.com/photo-1621510456681-2330135e5871?auto=format&fit=crop&w=800&q=80"  // finger food
  ],
  "Напитки": [
    "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=80", // cocktail
    "https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=800&q=80", // smoothie
    "https://images.unsplash.com/photo-1541658016709-a5831d6bfd24?auto=format&fit=crop&w=800&q=80", // lemonade
    "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80", // juice
    "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=800&q=80"  // mulled wine / hot drink
  ],
  "ПП": [
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80", // healthy bowl
    "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80", // clean eating
    "https://images.unsplash.com/photo-1543352634-99a5d50ae78e?auto=format&fit=crop&w=800&q=80", // quinoa bowl
    "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=800&q=80", // balanced meal
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"  // salad plate
  ],
  "Вегетарианское": [
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80", // veggie plate
    "https://images.unsplash.com/photo-1540914124281-342587941389?auto=format&fit=crop&w=800&q=80", // vegetable stew
    "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80", // buddha bowl
    "https://images.unsplash.com/photo-1506459225024-1428097a7e18?auto=format&fit=crop&w=800&q=80", // roasted veggies
    "https://images.unsplash.com/photo-1574484284002-952d92a03a52?auto=format&fit=crop&w=800&q=80"  // veggie curry
  ],
  "Гриль": [
    "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80", // grill bbq
    "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80", // grilled steak
    "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=80", // grilled chicken
    "https://images.unsplash.com/photo-1625943553852-781234c0b0b3?auto=format&fit=crop&w=800&q=80", // bbq ribs
    "https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=800&q=80"  // shashlik
  ],
  "Фастфуд": [
    "https://images.unsplash.com/photo-1551782450-17144efb9c50?auto=format&fit=crop&w=800&q=80", // fast food tray
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80", // pizza slice
    "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=800&q=80", // burger
    "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80", // fries
    "https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?auto=format&fit=crop&w=800&q=80"  // hot dog
  ]
};

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=800&q=80"
];

function getImageForCategory(category: string): string {
  const pool = CATEGORY_IMAGES[category] || FALLBACK_IMAGES;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function generate() {
  console.log("Connecting to database...");
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  console.log("Cleaning tables...");
  await db.run("DELETE FROM recipes");
  await db.run("DELETE FROM ingredients");
  await db.run("DELETE FROM steps");
  await db.run("DELETE FROM tips");

  console.log("Seeding 46 premium recipes...");
  let count = 0;
  const categoryCounts: Record<string, number> = {};
  
  // Initialize counts for all categories
  CATEGORIES.forEach(c => { categoryCounts[c] = 0; });

  for (const recipe of RECIPES) {
    const authorId = recipe.id.startsWith('u-') ? recipe.author_id : 'u-admin';
    await db.run(
      `INSERT INTO recipes (
        id, title, description, image, rating, reviews_count, author, author_id, views, 
        prep_time, servings, difficulty, calories, protein, fat, carbs, cuisine, category, tags, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')`,
      [
        recipe.id, recipe.title, recipe.description, recipe.image, recipe.rating, recipe.reviewsCount,
        recipe.author, authorId, recipe.views, recipe.prepTime, recipe.servings, recipe.difficulty,
        recipe.calories, recipe.macros.protein, recipe.macros.fat, recipe.macros.carbs,
        recipe.cuisine, recipe.category, recipe.tags.join(',')
      ]
    );

    // Save ingredients
    for (const ing of recipe.ingredients) {
      await db.run(
        'INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (?, ?, ?, ?)',
        [recipe.id, ing.name, ing.amount, ing.unit]
      );
    }

    // Save steps
    for (let i = 0; i < recipe.steps.length; i++) {
      await db.run(
        'INSERT INTO steps (recipe_id, step_num, text) VALUES (?, ?, ?)',
        [recipe.id, i + 1, recipe.steps[i]]
      );
    }

    // Save tips
    if (recipe.tips) {
      for (const tip of recipe.tips) {
        await db.run('INSERT INTO tips (recipe_id, text) VALUES (?, ?)', [recipe.id, tip]);
      }
    }

    if (categoryCounts[recipe.category] !== undefined) {
      categoryCounts[recipe.category]++;
    }
    count++;
  }

  console.log("Starting transaction for batch generation...");
  await db.run("BEGIN TRANSACTION");

  const uniqueTitles = new Set<string>();
  RECIPES.forEach(r => uniqueTitles.add(r.title.toLowerCase()));

  // Target: make sure EVERY category has at least 32 recipes!
  const minRequiredCount = 32;
  let keepGenerating = true;

  while (keepGenerating) {
    // Find the category with the lowest amount of recipes
    let targetCategory = "";
    let minCount = Infinity;
    
    for (const cat of CATEGORIES) {
      if (categoryCounts[cat] < minCount) {
        minCount = categoryCounts[cat];
        targetCategory = cat;
      }
    }

    // If the lowest count is >= 32, we have met the goal!
    if (minCount >= minRequiredCount) {
      keepGenerating = false;
      break;
    }

    // Generate a recipe tailored to targetCategory
    let title = "";
    let desc = "";
    let prepTime = 20;
    let protein = 10, fat = 10, carbs = 20;
    let ingredientsList: { name: string; amount: number; unit: string }[] = [];
    let stepsList: string[] = [];
    let tipsList: string[] = [];

    if (targetCategory === "Напитки") {
      const adj = DRINK_ADJS[Math.floor(Math.random() * DRINK_ADJS.length)];
      const noun = DRINK_NOUNS[Math.floor(Math.random() * DRINK_NOUNS.length)];
      const add = DRINK_ADDITIONS[Math.floor(Math.random() * DRINK_ADDITIONS.length)];
      title = `${adj} ${noun} ${add}`;
      desc = `${title} — восхитительный освежающий напиток. Прекрасно утоляет жажду и дарит заряд бодрости на весь день.`;
      prepTime = 10;
      protein = 0; fat = 0; carbs = 15 + Math.floor(Math.random() * 15);
      ingredientsList = [
        { name: "Основной ягодный или лимонный сок", amount: 150, unit: "мл" },
        { name: "Свежая мята или специи", amount: 10, unit: "г" },
        { name: "Очищенная содовая или вода", amount: 200, unit: "мл" },
        { name: "Тростниковый сахар или мед", amount: 15, unit: "г" },
        { name: "Колотый лед", amount: 100, unit: "г" }
      ];
      stepsList = [
        "Тщательно вымойте зелень и дольки фруктов, поместите на дно кувшина.",
        "Разомните ингредиенты ложкой, чтобы раскрыть эфирные масла и сок.",
        "Засыпьте колотый лед, залейте водой и добавьте сахарный сироп.",
        "Тщательно перемешайте лопаткой до охлаждения и подавайте к столу."
      ];
      tipsList = ["Используйте очищенную воду, чтобы не испортить тонкий вкус ягод.", "Подавайте в бокалах с широкой соломинкой."];
    } 
    else if (targetCategory === "Десерты" || targetCategory === "Выпечка") {
      const adj = SWEET_ADJS[Math.floor(Math.random() * SWEET_ADJS.length)];
      const noun = SWEET_NOUNS[Math.floor(Math.random() * SWEET_NOUNS.length)];
      const add = SWEET_ADDITIONS[Math.floor(Math.random() * SWEET_ADDITIONS.length)];
      title = `${adj} ${noun} ${add}`;
      desc = `${title} — нежный домашний десерт с выраженным сладким вкусом. Идеальное дополнение к чаю или ароматному кофе.`;
      prepTime = 30 + Math.floor(Math.random() * 4) * 10;
      protein = 4 + Math.floor(Math.random() * 5);
      fat = 10 + Math.floor(Math.random() * 15);
      carbs = 30 + Math.floor(Math.random() * 25);
      ingredientsList = [
        { name: "Пшеничная мука высшего сорта", amount: 150, unit: "г" },
        { name: "Сахар или пудра", amount: 80, unit: "г" },
        { name: "Куриные яйца", amount: 2, unit: "шт" },
        { name: "Сливочное масло 82.5%", amount: 50, unit: "г" },
        { name: "Сладкие кондитерские добавки", amount: 40, unit: "г" }
      ];
      stepsList = [
        "Взбейте куриные яйца с сахарным песком до образования стойкой пены.",
        "Растопите сливочное масло, остудите и введите к яйцам.",
        "Постепенно всыпьте просеянную муку и разрыхлитель, замешивая гладкое тесто.",
        "Аккуратно вмешайте топпинги и выпекайте в духовке 25 минут при температуре 180°C."
      ];
      tipsList = ["Дайте десерту остыть в форме, чтобы он не потерял воздушную текстуру."];
    }
    else if (targetCategory === "Пицца") {
      const type = PIZZA_TYPES[Math.floor(Math.random() * PIZZA_TYPES.length)];
      title = `Пицца ${type} по-домашнему`;
      desc = `${title} на тонком дрожжевом тесте с ароматными травами и расплавленным сыром. Ресторанный вкус на вашей кухне.`;
      prepTime = 30;
      protein = 15; fat = 14; carbs = 42;
      ingredientsList = [
        { name: "Тесто дрожжевое для пиццы", amount: 200, unit: "г" },
        { name: "Фирменный соус маринара", amount: 50, unit: "г" },
        { name: "Сыр Моцарелла", amount: 100, unit: "г" },
        { name: "Начинка ассорти согласно рецепту", amount: 80, unit: "г" },
        { name: "Оливковое масло и сушеный орегано", amount: 8, unit: "г" }
      ];
      stepsList = [
        "Раскатайте дрожжевое тесто в тонкий круг на присыпанном мукой столе.",
        "Равномерно смажьте томатным соусом, оставляя небольшие бортики.",
        "Распределите тертый сыр и ломтики начинки по всей площади.",
        "Выпекайте 10 минут в духовке, предварительно разогретой до максимальных 240°C."
      ];
      tipsList = ["Выкладывайте пиццу на раскаленный противень для хрустящей корочки."];
    }
    else if (targetCategory === "Бургеры") {
      const type = BURGER_TYPES[Math.floor(Math.random() * BURGER_TYPES.length)];
      title = `Бургер ${type}`;
      desc = `${title} — сочный и сытный бургер на мягкой бриошь-булочке с хрустящими овощами и пикантным фирменным соусом.`;
      prepTime = 20;
      protein = 24; fat = 22; carbs: 32;
      ingredientsList = [
        { name: "Сдобная булочка Бриошь", amount: 1, unit: "шт" },
        { name: "Котлета мясная сформированная", amount: 150, unit: "г" },
        { name: "Ломтик плавленого сыра", amount: 20, unit: "г" },
        { name: "Листья салата и свежий помидор", amount: 40, unit: "г" },
        { name: "Фирменный бургер-соус", amount: 20, unit: "г" }
      ];
      stepsList = [
        "Разрежьте булочку пополам и обжарьте внутренние срезы на сухой сковороде.",
        "Обжарьте котлету на раскаленном гриле по 3 минуты с каждой стороны.",
        "За минуту до готовности выложите ломтик сыра на горячую котлету.",
        "Соберите бургер: соус, салатные листья, помидор, котлета с расплавленным сыром, верхняя булочка."
      ];
      tipsList = ["Дайте готовой котлете полежать 1 минуту, чтобы она сохранила сочность внутри."];
    }
    else {
      // General savory categories (Lunch, Dinner, Soups, Salads, ПП, Vegetarian, etc.)
      const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
      const prot = PROTEINS[Math.floor(Math.random() * PROTEINS.length)];
      const base = BASES[Math.floor(Math.random() * BASES.length)];
      const sauce = SAUCES[Math.floor(Math.random() * SAUCES.length)];
      title = `${adj} ${prot.name} с ${base.name} ${sauce.name}`;
      desc = `${title} — аппетитное, богатое витаминами и нутриентами горячее блюдо. Идеально сбалансировано для сытного приема пищи.`;
      prepTime = 25 + Math.floor(Math.random() * 5) * 10;
      protein = prot.protein + base.protein + sauce.protein;
      fat = prot.fat + base.fat + sauce.fat;
      carbs = prot.carbs + base.carbs + sauce.carbs;
      ingredientsList = [
        { name: prot.ingredient, amount: prot.amount, unit: prot.unit },
        { name: base.ingredient, amount: base.amount, unit: base.unit },
        { name: sauce.ingredient, amount: sauce.amount, unit: sauce.unit },
        { name: "Сливочное или оливковое масло", amount: 15, unit: "г" },
        { name: "Специи и морская соль", amount: 4, unit: "г" }
      ];
      stepsList = [
        `Промойте и подготовьте ${prot.ingredient.toLowerCase()} и овощи к термической обработке.`,
        `Разогрейте масло на среднем огне. Пассеруйте мясопродукты до золотистой корочки 8 минут.`,
        `Всыпьте гарнир ${base.ingredient.toLowerCase()} и обжаривайте все вместе еще 5 минут.`,
        `Залейте ${sauce.ingredient.toLowerCase()}, накройте сковороду крышкой и томите на слабом огне 15 минут.`
      ];
      tipsList = ["Посыпайте готовое блюдо свежей рубленой зеленью перед подачей."];
    }

    if (uniqueTitles.has(title.toLowerCase())) {
      continue;
    }
    uniqueTitles.add(title.toLowerCase());

    const id = `gen-cat-${count + 1}`;
    const image = getImageForCategory(targetCategory);
    const rating = Math.round((4.2 + Math.random() * 0.8) * 10) / 10;
    const reviews = 5 + Math.floor(Math.random() * 95);
    const views = 100 + Math.floor(Math.random() * 2500);
    const difficulty = DIFFICULTIES[Math.floor(Math.random() * DIFFICULTIES.length)];
    const cuisine = CUISINES[Math.floor(Math.random() * CUISINES.length)];
    
    // Ensure calories are computed correctly
    const calories = Math.round(protein * 4 + fat * 9 + (carbs || 0) * 4);
    const tags = [cuisine, targetCategory, title].join(',').toLowerCase();

    // Insert recipe
    await db.run(
      `INSERT INTO recipes (
        id, title, description, image, rating, reviews_count, author, author_id, views, 
        prep_time, servings, difficulty, calories, protein, fat, carbs, cuisine, category, tags, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'Шеф-Повар Бот', 'u-admin', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')`,
      [
        id, title, desc, image, rating, reviews, views, prepTime, 4, difficulty,
        calories, protein, fat, carbs || 0, cuisine, targetCategory, tags
      ]
    );

    // Insert ingredients
    for (const ing of ingredientsList) {
      await db.run(
        'INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (?, ?, ?, ?)',
        [id, ing.name, ing.amount, ing.unit]
      );
    }

    // Insert steps
    for (let i = 0; i < stepsList.length; i++) {
      await db.run(
        'INSERT INTO steps (recipe_id, step_num, text) VALUES (?, ?, ?)',
        [id, i + 1, stepsList[i]]
      );
    }

    // Insert tips
    for (const tip of tipsList) {
      await db.run('INSERT INTO tips (recipe_id, text) VALUES (?, ?)', [id, tip]);
    }

    categoryCounts[targetCategory]++;
    count++;
  }

  await db.run("COMMIT");
  await db.close();

  console.log("Successfully compiled all categories! Totals:");
  Object.keys(categoryCounts).forEach(cat => {
    console.log(`- Категория "${cat}": ${categoryCounts[cat]} рецептов`);
  });
  console.log(`Total recipes loaded in SQLite database: ${count}`);
}

generate().catch(err => {
  console.error("Generator execution failed:", err);
});
