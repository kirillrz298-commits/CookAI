/**
 * Утилита для получения релевантной картинки рецепта.
 * Если картинка уже задана и не является "дефолтной" — используем её.
 * Иначе подбираем по ключевым словам из названия и категории.
 */

// Маппинг ключевых слов названия → конкретная картинка Unsplash
const KEYWORD_IMAGE_MAP: Array<{ keywords: string[]; url: string }> = [
  // === Картофель ===
  { keywords: ['пюре', 'картофельное пюре'], url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['картофель фри', 'картошка фри', 'фри'], url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['драники', 'деруны'], url: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['по-деревенски', 'дольки'], url: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['запеканка', 'запечённый'], url: 'https://images.unsplash.com/photo-1574484284002-952d92a03a52?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['крем-суп картоф', 'картофельный суп'], url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80' },
  // === Мясо ===
  { keywords: ['стейк', 'рибай', 'тибон'], url: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['говядина', 'говяжий'], url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['свинина', 'свиная', 'отбивная'], url: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['шашлык', 'шашлыки'], url: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['котлеты', 'котлета', 'биточки'], url: 'https://images.unsplash.com/photo-1607116667981-ff148a4b7a00?auto=format&fit=crop&w=800&q=80' },
  // === Курица ===
  { keywords: ['курица', 'курин', 'цыплёнок', 'цыпленок'], url: 'https://images.unsplash.com/photo-1432139509613-5c4255815697?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['крылышки', 'куриные крылья'], url: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80' },
  // === Рыба и морепродукты ===
  { keywords: ['лосось', 'сёмга', 'семга'], url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['рыба', 'рыбный'], url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['креветки', 'креветка'], url: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['суши', 'роллы', 'ролл'], url: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80' },
  // === Паста ===
  { keywords: ['карбонара'], url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['болоньезе', 'болонезе'], url: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['паста', 'спагетти', 'феттучини', 'пенне', 'тальятелле'], url: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['лазанья'], url: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=800&q=80' },
  // === Пицца ===
  { keywords: ['пицца маргарита'], url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['пицца пепперони'], url: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['пицца'], url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80' },
  // === Бургеры ===
  { keywords: ['бургер', 'гамбургер', 'чизбургер'], url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' },
  // === Супы ===
  { keywords: ['борщ'], url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['харчо', 'солянка', 'рассольник'], url: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['рамен', 'рамён'], url: 'https://images.unsplash.com/photo-1604152135912-04a022e23696?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['суп', 'похлёбка', 'уха', 'щи'], url: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=800&q=80' },
  // === Десерты ===
  { keywords: ['сырники', 'сырник'], url: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['чизкейк'], url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['шоколадный торт', 'шоколадный кекс', 'шоколадный пирог'], url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['мороженое', 'панакота', 'панна-котта'], url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['тирамису'], url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['торт', 'кейк', 'cake'], url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['блины', 'блин', 'оладьи', 'оладушки'], url: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['пирог', 'пирожки', 'пирожное'], url: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=800&q=80' },
  // === Выпечка ===
  { keywords: ['хлеб', 'багет', 'чиабата'], url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['круассан', 'круассаны'], url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['маффин', 'кекс', 'капкейк'], url: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=800&q=80' },
  // === Напитки ===
  { keywords: ['глинтвейн'], url: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['смузи'], url: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['лимонад'], url: 'https://images.unsplash.com/photo-1541658016709-a5831d6bfd24?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['сок', 'фреш'], url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['морс', 'компот'], url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['коктейль', 'мохито', 'маргарита'], url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=80' },
  // === Салаты ===
  { keywords: ['цезарь', 'цезарь'], url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['греческий салат', 'греческий'], url: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['оливье'], url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['салат', 'витаминный', 'овощной'], url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80' },
  // === Завтраки ===
  { keywords: ['яичница', 'яйца бенедикт', 'омлет'], url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['овсянка', 'каша', 'овсяная'], url: 'https://images.unsplash.com/photo-1546039907-7fa05f864c02?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['тосты', 'тост', 'авокадо тост'], url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80' },
  // === Рис ===
  { keywords: ['плов'], url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['ризотто'], url: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=800&q=80' },
  { keywords: ['рис', 'рисовый'], url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80' },
  // === Гриль ===
  { keywords: ['гриль', 'барбекю', 'bbq', 'ребра'], url: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80' },
];

// Категориальные fallback картинки
const CATEGORY_FALLBACK: Record<string, string> = {
  'Завтраки': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80',
  'Обеды': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
  'Ужины': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
  'Супы': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
  'Десерты': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',
  'Выпечка': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  'Паста': 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=800&q=80',
  'Пицца': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
  'Бургеры': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  'Салаты': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
  'Закуски': 'https://images.unsplash.com/photo-1536816579748-4ecb3f03d72a?auto=format&fit=crop&w=800&q=80',
  'Напитки': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=80',
  'ПП': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80',
  'Вегетарианское': 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80',
  'Гриль': 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80',
  'Фастфуд': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

/**
 * Возвращает URL картинки для рецепта.
 * Приоритет: подбор по ключевым словам названия → категориальный fallback → дефолт.
 */
export function getRecipeImage(title: string, category: string, existingImage?: string): string {
  const titleLower = title.toLowerCase();

  // Поиск по ключевым словам названия
  for (const { keywords, url } of KEYWORD_IMAGE_MAP) {
    if (keywords.some(kw => titleLower.includes(kw.toLowerCase()))) {
      return url;
    }
  }

  // Категориальный fallback
  if (CATEGORY_FALLBACK[category]) {
    return CATEGORY_FALLBACK[category];
  }

  // Используем существующую или дефолт
  return existingImage || DEFAULT_IMAGE;
}
