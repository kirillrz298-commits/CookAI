import { AI_CONFIG } from '../config/ai';
import type { Message, Recipe } from '../types';
import { RECIPES } from '../data/recipes';

const API_KEY = AI_CONFIG["ключ для ии"];
const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL_NAME = "llama-3.3-70b-versatile";

// Construct a summary of available recipes for the AI system prompt
const RECIPE_SUMMARY_FOR_AI = RECIPES.map(r => 
  `- ID: ${r.id}, Название: "${r.title}", Категория: "${r.category}", Кухня: "${r.cuisine}", Ингредиенты: ${r.ingredients.map(i => i.name).join(', ')}, Время: ${r.prepTime} мин, Сложность: ${r.difficulty}`
).join('\n');

const SYSTEM_PROMPT = `Ты — шеф-повар кулинарного портала CookBook AI. Твоя цель — помогать пользователям подбирать рецепты из нашей библиотеки на основе их запросов, имеющихся ингредиентов, времени или настроения.

Ты общаешься вежливо, увлеченно, с кулинарным вдохновением, как опытный и дружелюбный шеф-повар.

У нас есть строгая база рецептов. Вот список доступных блюд:
${RECIPE_SUMMARY_FOR_AI}

ПРАВИЛА ОТВЕТА:
1. Отвечай только на русском языке.
2. Анализируй продукты пользователя и предлагай блюда из нашего списка выше, которые наиболее подходят.
3. Для каждого подходящего блюда напиши:
   - Почему оно подходит.
   - Сколько времени понадобится.
   - Уровень сложности.
   - Какие продукты еще понадобятся (если есть недостающие ингредиенты).
4. ОБЯЗАТЕЛЬНО для каждого рекомендуемого блюда в конце его описания вставь специальную метку: [Рецепт: ID_РЕЦЕПТА], где ID_РЕЦЕПТА — это точный ID из списка выше (например, [Рецепт: pot-1]). 
   ВАЖНО: Пиши именно в формате '[Рецепт: ID_РЕЦЕПТА]', это критично для работы интерфейса, чтобы кнопка 'Открыть рецепт' появилась под сообщением. Не выдумывай несуществующие ID!
5. Если в нашей базе нет подходящих рецептов, вежливо скажи об этом и посоветуй что-то похожее из имеющихся, либо предложи изменить ингредиенты. Не придумывай рецепты, которых нет в нашей базе данных.
6. Отвечай лаконично, структурированно, красиво оформляя текст (используй списки и жирный шрифт).
`;

// Helper to provide a local mock response if Groq API is unavailable or rate-limited
function getMockChefResponse(userQuery: string): { text: string; suggestedRecipeIds: string[] } {
  const query = userQuery.toLowerCase();
  const matchedRecipes: Recipe[] = [];

  // Simple keyword matching for local fallback
  if (query.includes("картош") || query.includes("картофе")) {
    matchedRecipes.push(...RECIPES.filter(r => r.id.startsWith("pot-")));
  }
  if (query.includes("говядин") || query.includes("мясо") || query.includes("фарш")) {
    matchedRecipes.push(...RECIPES.filter(r => r.id.includes("beef") || r.id === "pot-4" || r.id.includes("lamb")));
  }
  if (query.includes("куриц") || query.includes("курин") || query.includes("филе")) {
    matchedRecipes.push(...RECIPES.filter(r => r.id.startsWith("chk-") || r.id === "pot-7" || r.id === "sea-1"));
  }
  if (query.includes("рыб") || query.includes("лосос") || query.includes("семг")) {
    matchedRecipes.push(...RECIPES.filter(r => r.id === "sea-1"));
  }
  if (query.includes("макарон") || query.includes("паст") || query.includes("спагетт")) {
    matchedRecipes.push(...RECIPES.filter(r => r.id.startsWith("pst-")));
  }
  if (query.includes("пицц")) {
    matchedRecipes.push(...RECIPES.filter(r => r.id.startsWith("pza-")));
  }
  if (query.includes("сладк") || query.includes("десерт") || query.includes("шоколад") || query.includes("сырник")) {
    matchedRecipes.push(...RECIPES.filter(r => r.id.startsWith("des-")));
  }
  if (query.includes("быстр") || query.includes("20 минут") || query.includes("30 минут")) {
    matchedRecipes.push(...RECIPES.filter(r => r.prepTime <= 30));
  }
  if (query.includes("полезн") || query.includes("здоров") || query.includes("пп")) {
    matchedRecipes.push(...RECIPES.filter(r => r.category === "ПП" || r.tags.includes("пп")));
  }
  if (query.includes("вегетариан") || query.includes("без мяс")) {
    matchedRecipes.push(...RECIPES.filter(r => r.category === "Вегетарианское" || r.tags.includes("вегетарианское")));
  }

  // Deduplicate and limit to 3 suggestions
  const finalSuggestions = Array.from(new Set(matchedRecipes)).slice(0, 3);

  if (finalSuggestions.length > 0) {
    let text = `Приветствую! Как шеф-повар CookBook AI, я проанализировал ваш запрос. На основе ваших предпочтений я подобрал отличные варианты из нашей кулинарной библиотеки:\n\n`;
    
    finalSuggestions.forEach(r => {
      text += `🍳 **${r.title}** (${r.cuisine} кухня)\n`;
      text += `   - **Почему подходит:** Отличный выбор, соответствующий вашему запросу. Рецепт проверен временем.\n`;
      text += `   - **Время приготовления:** ~${r.prepTime} минут.\n`;
      text += `   - **Сложность:** ${r.difficulty === 'Easy' ? 'Легко' : r.difficulty === 'Medium' ? 'Средне' : 'Сложно'}.\n`;
      text += `   - **Ингредиенты:** ${r.ingredients.map(i => i.name).join(', ')}.\n`;
      text += `   [Рецепт: ${r.id}]\n\n`;
    });

    text += `Вы можете открыть любое из этих блюд прямо сейчас, нажав на кнопку под моим ответом! Что скажете?`;
    
    return {
      text,
      suggestedRecipeIds: finalSuggestions.map(r => r.id)
    };
  } else {
    // Generic chef advice
    return {
      text: `Приветствую! Я с радостью помогу вам подобрать рецепт. 

Попробуйте написать, какие ингредиенты у вас есть (например, *«у меня есть картошка и сыр»*), или укажите время приготовления (*«что приготовить за 20 минут?»*).

Поскольку в моем локальном блокноте не нашлось точного совпадения под ваш запрос, я рекомендую заглянуть в раздел **«Популярные рецепты»** на главной странице, где собраны лучшие кулинарные шедевры со всего мира!`,
      suggestedRecipeIds: []
    };
  }
}

export async function sendMessageToAI(chatHistory: Message[]): Promise<{ text: string; suggestedRecipeIds: string[] }> {
  const formattedMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...chatHistory.map(msg => ({
      role: msg.sender === 'user' ? "user" : "assistant",
      content: msg.text
    }))
  ];

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    const replyText = data.choices[0]?.message?.content || "";

    // Parse suggested recipe IDs from the text tags [Рецепт: ID]
    const recipeIdRegex = /\[Рецепт:\s*([a-zA-Z0-9-]+)\]/g;
    const suggestedRecipeIds: string[] = [];
    let match;

    while ((match = recipeIdRegex.exec(replyText)) !== null) {
      const id = match[1].trim();
      if (RECIPES.some(r => r.id === id) && !suggestedRecipeIds.includes(id)) {
        suggestedRecipeIds.push(id);
      }
    }

    return {
      text: replyText,
      suggestedRecipeIds
    };
  } catch (error) {
    console.warn("Groq API Call failed, falling back to local search matching:", error);
    // Use the last user message to generate a mock response
    const lastUserMsg = chatHistory[chatHistory.length - 1]?.text || "";
    return getMockChefResponse(lastUserMsg);
  }
}

// ============================================================
// 📷 PHOTO INGREDIENT ANALYSIS (Groq Vision)
// ============================================================
export async function analyzePhotoIngredients(base64Image: string): Promise<{ ingredients: string[]; suggestion: string }> {
  const VISION_MODEL = "llama-3.2-11b-vision-preview";
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [{
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
            { type: "text", text: `Ты — шеф-повар. Определи все видимые продукты на изображении.\nОтветь СТРОГО в формате JSON (без markdown):\n{\n  "ingredients": ["продукт1", "продукт2"],\n  "suggestion": "Что видишь и что можно приготовить (1-2 предложения)"\n}` }
          ]
        }],
        max_tokens: 500, temperature: 0.3
      })
    });
    if (!response.ok) throw new Error(`Vision API error: ${response.status}`);
    const data = await response.json();
    const content = data.choices[0]?.message?.content || "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return { ingredients: parsed.ingredients || [], suggestion: parsed.suggestion || "" };
    }
    throw new Error("Could not parse vision response");
  } catch (error) {
    console.warn("Groq Vision failed:", error);
    return { ingredients: [], suggestion: "Не удалось распознать ингредиенты на фото. Попробуйте сделать более чёткий снимок." };
  }
}

// ============================================================
// 🍽 AI RECIPE GENERATOR
// ============================================================
export interface GeneratedRecipe {
  title: string;
  description: string;
  category: string;
  cuisine: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prepTime: number;
  servings: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  ingredients: Array<{ name: string; amount: number; unit: string }>;
  steps: string[];
  tips: string[];
  tags: string[];
}

export async function generateRecipeFromIngredients(
  ingredients: string[],
  preferences?: { category?: string; difficulty?: string; maxTime?: number }
): Promise<GeneratedRecipe | null> {
  const prefText = preferences
    ? `Предпочтения: категория "${preferences.category || 'любая'}", сложность "${preferences.difficulty || 'любая'}", время не более ${preferences.maxTime || 60} мин.`
    : '';
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: "system", content: "Ты — профессиональный шеф-повар. Создавай подробные рецепты в формате JSON." },
          { role: "user", content: `Создай оригинальный рецепт из следующих ингредиентов: ${ingredients.join(', ')}.\n${prefText}\n\nВерни ТОЛЬКО валидный JSON (без markdown):\n{\n  "title": "Название",\n  "description": "Описание 1-2 предложения",\n  "category": "Обеды",\n  "cuisine": "Русская",\n  "difficulty": "Easy",\n  "prepTime": 30,\n  "servings": 4,\n  "calories": 350,\n  "protein": 25,\n  "fat": 12,\n  "carbs": 35,\n  "ingredients": [{"name": "ингредиент", "amount": 200, "unit": "г"}],\n  "steps": ["Шаг 1...", "Шаг 2..."],\n  "tips": ["Совет 1"],\n  "tags": ["тег1", "тег2"]\n}` }
        ],
        temperature: 0.8, max_tokens: 2000
      })
    });
    if (!response.ok) throw new Error(`Generate API error: ${response.status}`);
    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]) as GeneratedRecipe;
    throw new Error("Could not parse generated recipe JSON");
  } catch (error) {
    console.warn("Recipe generation failed:", error);
    return null;
  }
}
