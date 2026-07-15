import React, { useState } from 'react';
import { 
  BookOpen, Terminal, Clipboard, Search, Award, Copy, Check, 
  Cpu, Settings, RefreshCw,
  Flame, Download, ChevronRight, Info
} from 'lucide-react';

interface ManualChapter {
  id: string;
  number: string;
  title: string;
  content: React.ReactNode;
}

export const MethodicalManual: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('manual');
  const [selectedChapter, setSelectedChapter] = useState<string>('1');
  const [searchTopic, setSearchTopic] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('все');

  // Grading calculator states
  const [gradeInputs, setGradeInputs] = useState({
    idea: 10,
    ui: 15,
    func: 25,
    desktop: 15,
    ai: 15,
    build: 10,
    presentation: 10
  });

  const [studentName, setStudentName] = useState('Иван Иванов');
  const [projectTitle, setProjectTitle] = useState('AI File Organizer');

  // Prompt variables builder states
  const [promptTheme, setPromptTheme] = useState('Умный сортировщик файлов с AI');
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  // IPC Simulator states
  const [ipcStep, setIpcStep] = useState<number>(0);
  const [ipcConsoleLogs, setIpcConsoleLogs] = useState<string[]>([]);
  const [ipcSimulating, setIpcSimulating] = useState(false);

  // Clipboard copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  // IPC Simulator runner
  const runIpcSimulation = async (action: 'selectFile' | 'saveFile' | 'getVersion') => {
    if (ipcSimulating) return;
    setIpcSimulating(true);
    setIpcStep(1);
    setIpcConsoleLogs([]);

    const log = (msg: string) => setIpcConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    // Step 1: React initiates
    log(`React: Вызов метода window.electronAPI.${action}()`);
    await new Promise(r => setTimeout(r, 800));

    // Step 2: Preload Bridge
    setIpcStep(2);
    log(`Preload Bridge: Получение вызова. Перенаправление через IPC канал 'app:${action}' или 'dialog:${action}'`);
    await new Promise(r => setTimeout(r, 800));

    // Step 3: IPC Channel
    setIpcStep(3);
    log(`IPC Channel: Передача запроса в Main Process...`);
    await new Promise(r => setTimeout(r, 600));

    // Step 4: Main Process & OS
    setIpcStep(4);
    log(`Main Process: Обработка события. Доступ к Node.js API / Системным вызовам...`);
    
    let result = '';
    try {
      if (window.electronAPI) {
        if (action === 'selectFile') {
          const res = await window.electronAPI.selectFile();
          result = res ? `Выбран файл: ${res}` : 'Действие отменено пользователем';
        } else if (action === 'saveFile') {
          const res = await window.electronAPI.saveFile('test.txt', 'Привет из CookBook AI!');
          result = res ? `Сохранено в: ${res}` : 'Действие отменено пользователем';
        } else {
          const version = await window.electronAPI.getVersion();
          result = `Версия приложения: ${version}`;
        }
      } else {
        // Simulation in web browser
        await new Promise(r => setTimeout(r, 1000));
        if (action === 'selectFile') {
          result = 'C:\\Users\\Teacher\\Documents\\manual.pdf';
        } else if (action === 'saveFile') {
          result = 'C:\\Users\\Teacher\\Downloads\\shopping_list_export.txt';
        } else {
          result = '1.0.0 (Режим симуляции в браузере)';
        }
      }
      log(`Main Process: Результат получен: "${result}"`);
    } catch (err: any) {
      log(`Ошибка IPC: ${err.message}`);
      result = `Ошибка: ${err.message}`;
    }

    await new Promise(r => setTimeout(r, 800));

    // Step 5: Returning to React
    setIpcStep(5);
    log(`Preload Bridge: Возврат значения в React-компонент`);
    await new Promise(r => setTimeout(r, 600));

    setIpcStep(6);
    log(`React: Обновление состояния интерфейса. Успех!`);
    setIpcSimulating(false);
  };

  // Grade calculation
  const totalScore = 
    Number(gradeInputs.idea) + 
    Number(gradeInputs.ui) + 
    Number(gradeInputs.func) + 
    Number(gradeInputs.desktop) + 
    Number(gradeInputs.ai) + 
    Number(gradeInputs.build) + 
    Number(gradeInputs.presentation);

  const getGradeEvaluation = (score: number) => {
    if (score >= 90) return { label: 'Отлично (A)', color: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' };
    if (score >= 75) return { label: 'Хорошо (B)', color: 'text-cyan-500 border-cyan-500/20 bg-cyan-500/5' };
    if (score >= 60) return { label: 'Удовлетворительно (C)', color: 'text-amber-500 border-amber-500/20 bg-amber-500/5' };
    return { label: 'Неудовлетворительно (D/F)', color: 'text-rose-500 border-rose-500/20 bg-rose-500/5' };
  };

  const evalInfo = getGradeEvaluation(totalScore);

  const generatedFeedbackText = `Оценка проекта "${projectTitle}" ученика ${studentName}:
- Общий балл: ${totalScore} из 100
- Статус: ${evalInfo.label}

Распределение баллов:
1. Идея (актуальность): ${gradeInputs.idea}/10
2. Интерфейс (UI/UX): ${gradeInputs.ui}/15
3. Функциональность: ${gradeInputs.func}/25
4. Desktop-возможности (файлы/IPC): ${gradeInputs.desktop}/15
5. Интеграция ИИ: ${gradeInputs.ai}/15
6. Сборка (EXE/установщик): ${gradeInputs.build}/10
7. Защита проекта: ${gradeInputs.presentation}/10

Комментарий преподавателя:
${totalScore >= 90 ? 'Великолепная работа! Отличная реализация desktop-функций и интеграция ИИ.' : 
 totalScore >= 75 ? 'Хороший проект с качественным интерфейсом. Обратите внимание на оптимизацию работы с файлами.' :
 totalScore >= 60 ? 'Проект сдан, но требуется доработка в части работы с локальными данными и сборки.' : 
 'Требуется значительная доработка по основным критериям.'}`;

  // Chapters list
  const chapters: ManualChapter[] = [
    {
      id: '1',
      number: '1',
      title: 'Цель мануала',
      content: (
        <div>
          <p className="mb-4">Я, <strong>Данила Бородин</strong>, подготовил этот мануал как практическую основу для блока занятий по desktop-разработке. Цель блока — показать ученикам, что искусственный интеллект и веб-технологии можно применять не только для сайтов, но и для полноценных программ под Windows.</p>
          <p className="mb-4">К этому моменту ученики уже умеют создавать сайты, простые AI-сервисы, работать с файлами, Excel-данными и автоматизацией. Следующий логичный шаг — desktop-приложения, где они смогут работать с локальными файлами, папками, документами, изображениями и системными возможностями компьютера.</p>
          <div className="p-4 rounded-xl border border-brand-orange/20 bg-brand-orange/5 text-slate-700 dark:text-slate-200">
            <h5 className="font-bold flex items-center gap-1.5 text-brand-orange mb-1">
              <Info className="w-4 h-4" /> Педагогическая идея
            </h5>
            Не давать ученикам очередной сайт. Дать им задачу создать программу, которая решает реальную бытовую, учебную или рабочую проблему.
          </div>
        </div>
      )
    },
    {
      id: '2',
      number: '2',
      title: 'Что такое Electron',
      content: (
        <div>
          <p className="mb-4"><strong>Electron</strong> — это фреймворк для создания desktop-приложений с использованием HTML, CSS и JavaScript. Если объяснять максимально просто: Electron позволяет взять веб-интерфейс, например React-приложение, и запустить его как обычную программу на компьютере.</p>
          <p className="mb-4">Внутри Electron есть две ключевые технологии: <strong>Chromium</strong>, который отвечает за отображение интерфейса, и <strong>Node.js</strong>, который дает доступ к файловой системе, локальным данным и системным возможностям. Поэтому приложение выглядит как сайт, но ведет себя как настоящая desktop-программа.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Приложение можно запускать через ярлык на рабочем столе.</li>
            <li>Можно собрать установщик или EXE-файл.</li>
            <li>Можно работать с локальными файлами пользователя.</li>
            <li>Можно делать приложения для Windows, macOS и Linux.</li>
            <li>Можно использовать знакомые ученикам технологии: React, CSS, TypeScript, npm.</li>
          </ul>
        </div>
      )
    },
    {
      id: '3',
      number: '3',
      title: 'Зачем нужен Electron в учебе',
      content: (
        <div>
          <p className="mb-4">Electron хорошо подходит для группы искусственного интеллекта, потому что соединяет несколько навыков: интерфейс, работу с данными, автоматизацию, файловую систему и AI-функции. Это дает ученикам ощущение реального продукта, а не учебной демки.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>После сайтов ученики видят новый формат продукта.</li>
            <li>Desktop-приложения ближе к реальной повседневной пользе.</li>
            <li>Можно делать утилиты для учебы, преподавателей, документов, изображений, бизнеса и личной продуктивности.</li>
            <li>Проекты хорошо смотрятся в портфолио: их можно показать как установленную программу.</li>
            <li>Можно плавно перейти к мобильным приложениям, потому что ученики уже думают не страницами, а продуктами.</li>
          </ul>
        </div>
      )
    },
    {
      id: '4',
      number: '4',
      title: 'Как устроено Electron-приложение',
      content: (
        <div>
          <p className="mb-4">Electron-приложение состоит из нескольких процессов. Это важно объяснить ученикам сразу, потому что главная ошибка новичков — думать, что Electron работает точно как обычный сайт.</p>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse border border-slate-200 dark:border-slate-800">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800">
                  <th className="border border-slate-200 dark:border-slate-800 p-2 text-left">Часть</th>
                  <th className="border border-slate-200 dark:border-slate-800 p-2 text-left">Роль</th>
                  <th className="border border-slate-200 dark:border-slate-800 p-2 text-left">Пример задачи</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-200 dark:border-slate-800 p-2 font-semibold">Main process</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2">Главный процесс приложения. Создает окна и управляет системной логикой.</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2">Открыть окно, выбрать файл, сохранить данные, показать системное уведомление.</td>
                </tr>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                  <td className="border border-slate-200 dark:border-slate-800 p-2 font-semibold">Renderer process</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2">Интерфейс приложения. Здесь работает React.</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2">Кнопки, формы, страницы, таблицы, дизайн, состояния.</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 dark:border-slate-800 p-2 font-semibold">Preload script</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2">Безопасный мост между интерфейсом и системными функциями.</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2">Разрешить React вызвать только нужную функцию: сохранить файл, открыть папку.</td>
                </tr>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                  <td className="border border-slate-200 dark:border-slate-800 p-2 font-semibold">IPC</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2">Канал связи между renderer и main process.</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2">React просит main process прочитать файл, main возвращает результат.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl font-mono text-xs">
            <strong>Схема работы:</strong><br />
            React-кнопка --&gt; preload --&gt; IPC --&gt; main process --&gt; файловая система --&gt; ответ обратно в React
          </div>
        </div>
      )
    },
    {
      id: '5',
      number: '5',
      title: 'Рекомендуемый стек',
      content: (
        <div>
          <p className="mb-4">Для учебной группы я выбираю стек <strong>Electron + React + TypeScript + Vite</strong>. Он дает хороший баланс между простотой, современностью и реальной применимостью.</p>
          <ul className="list-disc pl-5 space-y-2 mb-4">
            <li><strong>Electron</strong> — оболочка desktop-приложения.</li>
            <li><strong>React</strong> — интерфейс и компоненты.</li>
            <li><strong>TypeScript</strong> — типизация и меньше ошибок.</li>
            <li><strong>Vite</strong> — быстрый запуск и удобная разработка.</li>
            <li><strong>Electron Forge</strong> или <strong>electron-builder</strong> — сборка EXE/установщика.</li>
            <li><strong>Tailwind CSS</strong> или обычный CSS — стилизация интерфейса.</li>
            <li><strong>localStorage, JSON-файлы, SQLite</strong> или <strong>electron-store</strong> — локальное хранение данных.</li>
          </ul>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 rounded-xl">
            <strong>Рекомендация для первого потока:</strong> Не перегружать учеников Rust, Tauri, сложной архитектурой и backend-инфраструктурой. Сначала дать Electron + React как понятный мост от сайтов к desktop.
          </div>
        </div>
      )
    },
    {
      id: '6',
      number: '6',
      title: 'Установка окружения',
      content: (
        <div>
          <p className="mb-4">Перед началом занятий у учеников должны быть установлены базовые инструменты:</p>
          <ol className="list-decimal pl-5 space-y-2 mb-4">
            <li>Node.js LTS.</li>
            <li>npm, который устанавливается вместе с Node.js.</li>
            <li>VS Code или Cursor.</li>
            <li>Git (желательно).</li>
            <li>Google Chrome или Edge для отладки веб-части.</li>
            <li>PowerShell или встроенный терминал VS Code.</li>
          </ol>
          <p className="mb-2 font-semibold">Проверочные команды в консоли:</p>
          <pre className="bg-slate-100 dark:bg-slate-900 p-3 rounded-lg font-mono text-xs text-slate-800 dark:text-slate-200">
            node -v{"\n"}
            npm -v{"\n"}
            git --version
          </pre>
        </div>
      )
    },
    {
      id: '7',
      number: '7',
      title: 'Создание первого проекта',
      content: (
        <div>
          <p className="mb-4">Для старта можно использовать Electron Forge с шаблоном Vite + TypeScript. Команда создает базовый проект, который уже умеет запускаться как desktop-приложение.</p>
          <pre className="bg-slate-100 dark:bg-slate-900 p-3 rounded-lg font-mono text-xs text-slate-800 dark:text-slate-200 mb-4">
            npx create-electron-app@latest my-desktop-app --template=vite-typescript{"\n"}
            cd my-desktop-app{"\n"}
            npm install{"\n"}
            npm start
          </pre>
          <p className="mb-4">Если нужен именно React-интерфейс, преподаватель может заранее подготовить стартовый шаблон Electron + React + TypeScript + Vite и раздать его ученикам. Это сэкономит время и снизит количество технических ошибок на первом занятии.</p>
        </div>
      )
    },
    {
      id: '8',
      number: '8',
      title: 'Структура проекта',
      content: (
        <div>
          <p className="mb-2 font-semibold">Один из вариантов учебной структуры проекта:</p>
          <pre className="bg-slate-100 dark:bg-slate-900 p-3 rounded-lg font-mono text-xs text-slate-800 dark:text-slate-200 mb-4">
{`my-desktop-app/
  src/
    main.ts              # главный процесс Electron
    preload.ts           # безопасный мост между main и React
    renderer/
      App.tsx            # главное React-приложение
      components/        # UI-компоненты
      pages/             # страницы приложения
      styles/            # стили
      utils/             # вспомогательные функции
  package.json
  forge.config.ts
  tsconfig.json`}
          </pre>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li><strong>main.ts</strong> отвечает за создание окна, меню, диалоги и доступ к системе.</li>
            <li><strong>preload.ts</strong> открывает безопасные функции для интерфейса.</li>
            <li><strong>renderer/App.tsx</strong> содержит React-интерфейс.</li>
            <li><strong>components</strong> и <strong>pages</strong> помогают не писать весь код в одном файле.</li>
            <li><strong>package.json</strong> хранит команды запуска и сборки.</li>
          </ul>
        </div>
      )
    },
    {
      id: '9',
      number: '9',
      title: 'Связь React и Electron',
      content: (
        <div>
          <p className="mb-4">В обычном сайте React не может напрямую читать файлы с компьютера пользователя. В Electron это возможно, но делать это нужно безопасно. Правильная схема: React вызывает функцию из preload, preload отправляет запрос в main process, main process делает системную операцию и возвращает результат.</p>
          <p className="mb-2 font-semibold">Пример: React просит выбрать файл</p>
          <pre className="bg-slate-100 dark:bg-slate-900 p-3 rounded-lg font-mono text-xs text-slate-800 dark:text-slate-200 mb-4">
{`// 1. Renderer (React): пользователь нажал кнопку
const filePath = await window.api.selectFile();

// 2. Preload: безопасно открываем функцию
contextBridge.exposeInMainWorld('api', {
  selectFile: () => ipcRenderer.invoke('dialog:selectFile')
});

// 3. Main: выполняем системное действие
ipcMain.handle('dialog:selectFile', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openFile'] });
  return result.filePaths[0];
});`}
          </pre>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4 text-sm text-slate-700 dark:text-slate-200">
            <strong>Попробуйте IPC в действии!</strong> Перейдите на вкладку <strong>"IPC Симулятор"</strong> в панели выше, чтобы запустить интерактивную анимацию этого процесса.
          </div>
        </div>
      )
    },
    {
      id: '10',
      number: '10',
      title: 'Локальное хранение данных',
      content: (
        <div>
          <p className="mb-4">Desktop-приложение должно уметь сохранять данные между запусками. Для учебных проектов можно использовать несколько вариантов:</p>
          <div className="overflow-x-auto text-sm mb-4">
            <table className="w-full border-collapse border border-slate-200 dark:border-slate-800">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800">
                  <th className="border border-slate-200 dark:border-slate-800 p-2 text-left">Вариант</th>
                  <th className="border border-slate-200 dark:border-slate-800 p-2 text-left">Когда использовать</th>
                  <th className="border border-slate-200 dark:border-slate-800 p-2 text-left">Плюсы</th>
                  <th className="border border-slate-200 dark:border-slate-800 p-2 text-left">Минусы</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-200 dark:border-slate-800 p-2 font-semibold">localStorage</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2">Простые настройки и небольшие данные</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2 text-emerald-600">Очень просто</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2 text-rose-600">Не для сложных данных</td>
                </tr>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                  <td className="border border-slate-200 dark:border-slate-800 p-2 font-semibold">JSON-файл</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2">Заметки, списки, история, настройки</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2 text-emerald-600">Понятно ученикам</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2 text-rose-600">Нужно аккуратно читать/писать</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 dark:border-slate-800 p-2 font-semibold">electron-store</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2">Настройки и небольшие базы данных</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2 text-emerald-600">Удобный готовый пакет</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2 text-rose-600">Надо подключать через main/preload</td>
                </tr>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                  <td className="border border-slate-200 dark:border-slate-800 p-2 font-semibold">SQLite</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2">Серьезные проекты с таблицами</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2 text-emerald-600">Похоже на реальную базу</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2 text-rose-600">Сложнее для новичков</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )
    },
    {
      id: '11',
      number: '11',
      title: 'Сборка проекта в EXE',
      content: (
        <div>
          <p className="mb-4">Главный момент для мотивации учеников — они должны получить не просто код, а программу, которую можно запустить с рабочего стола.</p>
          <p className="mb-2 font-semibold">Базовые команды:</p>
          <pre className="bg-slate-100 dark:bg-slate-900 p-3 rounded-lg font-mono text-xs text-slate-800 dark:text-slate-200 mb-4">
            npm install{"\n"}
            npm start{"\n"}
            npm run make   # или npm run build-exe в зависимости от конфигурации
          </pre>
          <p className="mb-4">После команды сборки готовые файлы обычно появляются в папке <strong>out</strong> или <strong>dist</strong>. Там может быть установщик или готовый исполняемый файл в зависимости от настроек проекта.</p>
          <pre className="bg-slate-100 dark:bg-slate-900 p-3 rounded-lg font-mono text-xs text-slate-800 dark:text-slate-200 mb-4">
{`project/
  out/
    make/
      squirrel.windows/
      zip/
    MyApp.exe`}
          </pre>
          <p className="mb-2 font-semibold">Что должен сделать ученик для сдачи:</p>
          <ul className="list-decimal pl-5 space-y-1.5">
            <li>Запустить проект локально через <code>npm start</code>.</li>
            <li>Проверить, что все основные функции работают.</li>
            <li>Выполнить сборку (<code>npm run make</code> / <code>npm run build</code>).</li>
            <li>Найти собранный EXE или установщик в папке вывода.</li>
            <li>Создать ярлык на рабочем столе.</li>
            <li>Показать запуск приложения без VS Code.</li>
            <li>Сдать исходный код и готовый билд.</li>
          </ul>
        </div>
      )
    },
    {
      id: '12',
      number: '12',
      title: 'Универсальные промпты',
      content: (
        <div>
          <p className="mb-4">Промпты для AI-инструментов (ChatGPT, Claude, Cursor) помогают ученикам создавать приложения и решать технические затыки. Вы можете протестировать и кастомизировать их во вкладке <strong>"Промпты"</strong> выше.</p>
        </div>
      )
    },
    {
      id: '13',
      number: '13',
      title: 'Методика преподавания',
      content: (
        <div>
          <p className="mb-4">Блок по desktop-разработке строится не как лекция по теории Electron, а как серия практических мини-проектов. Ученики должны как можно быстрее увидеть окно приложения, кнопку, сохранение данных и итоговую сборку.</p>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-xs border-collapse border border-slate-200 dark:border-slate-800">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800">
                  <th className="border border-slate-200 dark:border-slate-800 p-2 text-left">Неделя</th>
                  <th className="border border-slate-200 dark:border-slate-800 p-2 text-left">Тема</th>
                  <th className="border border-slate-200 dark:border-slate-800 p-2 text-left">Практика</th>
                  <th className="border border-slate-200 dark:border-slate-800 p-2 text-left">Результат</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-200 dark:border-slate-800 p-2 font-bold">1</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2 font-semibold">Введение в Electron</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2">Создание окна, React-интерфейс, навигация</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2">Первое desktop-приложение</td>
                </tr>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                  <td className="border border-slate-200 dark:border-slate-800 p-2 font-bold">2</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2 font-semibold">Файлы и локальные данные</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2">Чтение/запись JSON, выбор папки, сохранение настроек</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2">Приложение с реальными локальными данными</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 dark:border-slate-800 p-2 font-bold">3</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2 font-semibold">AI-функции и обработка файлов</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2">Генерация текста, анализ документа, экспорт результата</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2">Интеллектуальная утилита</td>
                </tr>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                  <td className="border border-slate-200 dark:border-slate-800 p-2 font-bold">4</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2 font-semibold">Финальный проект и защита</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2">Сборка EXE, презентация, демонстрация продукта</td>
                  <td className="border border-slate-200 dark:border-slate-800 p-2">Готовый и собранный продукт</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-brand-orange/10 border border-brand-orange/20 text-slate-800 dark:text-slate-200 rounded-2xl flex items-start gap-3">
            <Flame className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-brand-orange">Главное правило курса</span>
              Никаких пустых учебных демо. Каждый проект должен отвечать на вопрос: кто будет этим пользоваться и какую проблему приложение решает?
            </div>
          </div>
        </div>
      )
    },
    {
      id: '14',
      number: '14',
      title: 'Требования к итоговому проекту',
      content: (
        <div>
          <p className="mb-4">Каждый ученик в конце блока должен представить и защитить свой собственный проект, удовлетворяющий следующим критериям:</p>
          <ul className="list-disc pl-5 space-y-2 mb-4">
            <li>Desktop-приложение на Electron + React.</li>
            <li>Минимум 3 экрана или раздела.</li>
            <li>Локальное хранение данных (localStorage / JSON / DB).</li>
            <li>Работа хотя бы с одним типом файлов: TXT, JSON, CSV, PDF, изображение, аудио или папка.</li>
            <li>Возможность экспорта результата.</li>
            <li>Современный, отзывчивый интерфейс.</li>
            <li>Обработка ошибок и состояния загрузки.</li>
            <li>Инструкция по запуску и сборке.</li>
            <li>Сборка в EXE или установщик.</li>
            <li><strong>Защита проекта:</strong> формулировка проблемы, целевая аудитория, функции, демонстрация сценария использования, дальнейшее развитие.</li>
          </ul>
        </div>
      )
    },
    {
      id: '15',
      number: '15',
      title: 'Каталог тем',
      content: (
        <div>
          <p className="mb-4">Для выбора тем перейдите во вкладку <strong>"Каталог тем"</strong> в панели управления. Там вы найдете полную базу идей по 14 категориям с фильтрацией и поиском.</p>
        </div>
      )
    },
    {
      id: '16',
      number: '16',
      title: 'Как оценивать проекты',
      content: (
        <div>
          <p className="mb-4">Для оценки готовых работ используйте шкалу критериев во вкладке <strong>"Калькулятор оценок"</strong>. Система автоматически посчитает суммарный балл и создаст готовый текстовый отзыв.</p>
        </div>
      )
    },
    {
      id: '17',
      number: '17',
      title: 'Частые ошибки и решения',
      content: (
        <div className="space-y-4">
          <div className="p-3 border border-red-500/20 bg-red-500/5 rounded-xl">
            <span className="font-bold text-red-500 block">Ошибка: Приложение запускается в браузере, а не как программа</span>
            <span className="text-sm">Решение: Проверить, что проект запущен через команду Electron, а не обычный Vite dev-сервер. Проверьте scripts в package.json.</span>
          </div>
          <div className="p-3 border border-red-500/20 bg-red-500/5 rounded-xl">
            <span className="font-bold text-red-500 block">Ошибка: React не может прочитать локальный файл</span>
            <span className="text-sm">Решение: Использовать main process + preload + IPC, а не пытаться вызывать fs напрямую из React.</span>
          </div>
          <div className="p-3 border border-red-500/20 bg-red-500/5 rounded-xl">
            <span className="font-bold text-red-500 block">Ошибка: Команда npm run make не работает</span>
            <span className="text-sm">Решение: Проверить package.json, зависимости Electron Forge/electron-builder, версию Node.js, убедиться, что в пути к проекту нет кириллицы и пробелов.</span>
          </div>
          <div className="p-3 border border-red-500/20 bg-red-500/5 rounded-xl">
            <span className="font-bold text-red-500 block">Ошибка: Белое окно при запуске приложения</span>
            <span className="text-sm">Решение: Проверить консоль разработчика (Ctrl+Shift+I), пути к bundle-файлам в main.ts, настройки loadURL/loadFile в BrowserWindow.</span>
          </div>
          <div className="p-3 border border-red-500/20 bg-red-500/5 rounded-xl">
            <span className="font-bold text-red-500 block">Ошибка: EXE работает только на компьютере ученика</span>
            <span className="text-sm">Решение: Убедиться, что сборка была выполнена через команду сборщика, отсутствуют жестко закодированные абсолютные пути к файлам на ПК разработчика.</span>
          </div>
        </div>
      )
    },
    {
      id: '18',
      number: '18',
      title: 'Источники и ориентиры',
      content: (
        <div>
          <p className="mb-4">Для подготовки технической части использованы официальные материалы Electron и Electron Forge:</p>
          <ul className="list-disc pl-5 space-y-2 text-sm mb-4">
            <li><strong>Electron Documentation:</strong> разделы Process Model, Main/Renderer/Preload, IPC.</li>
            <li><strong>Electron Forge / electron-builder Documentation:</strong> разделы Packaging, Making applications, CLI tools.</li>
            <li><strong>Electron Security Recommendations:</strong> правила contextIsolation, preload scripts, безопасный IPC.</li>
          </ul>
          <p className="text-slate-500 text-xs italic">Примечание: В учебной работе важно опираться на официальную документацию, так как JS-инструменты обновляются очень быстро.</p>
        </div>
      )
    }
  ];

  // Topics Database (Section 15)
  const topics = [
    { cat: 'учеба', name: 'AI-конспектировщик лекций', desc: 'Загрузка текста/PDF, краткий и подробный конспект, тест, карточки, экспорт, история лекций, поиск по базе.' },
    { cat: 'учеба', name: 'Генератор тестов', desc: 'Тема, уровень сложности, количество вопросов, варианты ответов, правильные ответы, экспорт PDF/DOCX.' },
    { cat: 'учеба', name: 'Проверка домашних заданий', desc: 'Загрузка работы, критерии проверки, комментарии, оценка, рекомендации, отчет.' },
    { cat: 'учеба', name: 'Flashcards-приложение', desc: 'Карточки, категории, интервальное повторение, режим экзамена, статистика, импорт/экспорт CSV.' },
    { cat: 'учеба', name: 'AI-репетитор', desc: 'Предмет, объяснение темы, задания, проверка ответа, история прогресса, уровни сложности.' },
    { cat: 'учеба', name: 'Планировщик подготовки к экзамену', desc: 'Дата экзамена, темы, автоматический план, ежедневные задачи, прогресс, напоминания.' },
    { cat: 'учеба', name: 'Генератор шпаргалок', desc: 'Сжатие материала, формулы, определения, карточный режим, экспорт PDF.' },
    { cat: 'учеба', name: 'PDF-читалка с AI', desc: 'Открытие PDF, выделение текста, объяснение фрагмента, заметки, закладки, экспорт заметок.' },
    
    { cat: 'преподаватель', name: 'Журнал группы', desc: 'Ученики, посещаемость, оценки, комментарии, статистика, отчет по ученику, экспорт Excel.' },
    { cat: 'преподаватель', name: 'Генератор плана урока', desc: 'Тема, цели, тайминг, практика, домашнее задание, критерии оценки, экспорт.' },
    { cat: 'преподаватель', name: 'Генератор домашних заданий', desc: 'Тема, сложность, количество заданий, критерии проверки, экспорт.' },
    { cat: 'преподаватель', name: 'Анализатор успеваемости', desc: 'Оценки, графики, слабые темы, рекомендации, отчет по группе.' },
    { cat: 'преподаватель', name: 'Генератор сертификатов', desc: 'Шаблон, импорт учеников, пакетная генерация PDF/PNG.' },
    
    { cat: 'файлы', name: 'AI File Sorter', desc: 'Выбор папки, анализ файлов, сортировка по типу/дате/смыслу, предпросмотр, откат.' },
    { cat: 'файлы', name: 'Массовый переименователь', desc: 'Правила переименования, нумерация, замена слов, дата, предпросмотр, откат.' },
    { cat: 'файлы', name: 'Поиск дубликатов', desc: 'Сравнение по имени, размеру, хэшу, удаление, отчет.' },
    { cat: 'файлы', name: 'File Cleaner', desc: 'Временные, старые и большие файлы, безопасное удаление, отчет.' },
    { cat: 'файлы', name: 'Folder Analyzer', desc: 'Размеры папок, топ больших файлов, типы файлов, диаграммы, экспорт.' },

    { cat: 'документы', name: 'PDF Toolbox', desc: 'Объединение, разделение, поворот, удаление страниц, сжатие, водяной знак.' },
    { cat: 'документы', name: 'PDF Translator', desc: 'Загрузка PDF, извлечение текста, перевод, постраничный режим, история.' },
    { cat: 'документы', name: 'Resume Builder', desc: 'Анкета, шаблоны, генерация опыта, экспорт PDF, несколько версий.' },
    { cat: 'документы', name: 'Invoice Creator', desc: 'Клиенты, услуги, суммы, налоги, счет, история, экспорт PDF.' },
    { cat: 'документы', name: 'Договор-генератор', desc: 'Тип договора, данные сторон, условия, генерация DOCX/PDF, архив.' },

    { cat: 'изображения', name: 'Image Compressor', desc: 'Пакетное сжатие, качество, сравнение до/после, папка вывода.' },
    { cat: 'изображения', name: 'Batch Image Resizer', desc: 'Массовое изменение размера, форматы, пропорции, предпросмотр.' },
    { cat: 'изображения', name: 'Watermark Studio', desc: 'Текст/логотип, позиция, прозрачность, пакетная обработка.' },
    { cat: 'изображения', name: 'Генератор карточек товара', desc: 'Фото, название, цена, описание, шаблоны, экспорт PNG.' },
    { cat: 'изображения', name: 'Photo Organizer', desc: 'Сортировка по дате, альбомы, поиск, дубли, архив.' },

    { cat: 'аудио/видео', name: 'Subtitle Generator', desc: 'Загрузка видео, распознавание речи, редактор субтитров, экспорт SRT.' },
    { cat: 'аудио/видео', name: 'Voice Notes', desc: 'Запись голоса, текст, категории, поиск, экспорт.' },
    { cat: 'аудио/видео', name: 'AI Meeting Assistant', desc: 'Аудио встречи, расшифровка, резюме, задачи, ответственные, протокол.' },
    { cat: 'аудио/видео', name: 'Video Cutter', desc: 'Загрузка видео, выбор фрагментов, нарезка, экспорт, история.' },

    { cat: 'обычная жизнь', name: 'Домашняя бухгалтерия', desc: 'Доходы, расходы, категории, графики, лимиты, Excel-экспорт, месячный отчет.' },
    { cat: 'обычная жизнь', name: 'Планировщик питания', desc: 'Цель, калории, продукты, меню на неделю, список покупок.' },
    { cat: 'обычная жизнь', name: 'Кулинарный помощник', desc: 'Продукты дома, рецепты, избранное, таймер, список покупок.' },
    { cat: 'обычная жизнь', name: 'Трекер привычек', desc: 'Привычки, календарь, серии дней, статистика, напоминания.' },
    { cat: 'обычная жизнь', name: 'Планировщик дня', desc: 'Задачи, приоритеты, тайм-блоки, помодоро, отчет дня.' },
    { cat: 'обычная жизнь', name: 'Личный дневник', desc: 'Записи, настроение, теги, поиск, статистика, пароль.' },
    { cat: 'обычная жизнь', name: 'Семейный бюджет', desc: 'Участники, общие расходы, долги, цели накоплений, отчеты.' },
    { cat: 'обычная жизнь', name: 'Аптечка дома', desc: 'Лекарства, срок годности, напоминания, инструкции, категории.' },
    { cat: 'обычная жизнь', name: 'Гарантии и чеки', desc: 'Чеки, фото, дата покупки, срок гарантии, напоминания.' },
    { cat: 'обычная жизнь', name: 'Планировщик уборки', desc: 'Комнаты, задачи, график, ответственные, история.' },

    { cat: 'продуктивность', name: 'Clipboard Manager', desc: 'История буфера, поиск, избранное, категории, быстрая вставка.' },
    { cat: 'продуктивность', name: 'Prompt Manager', desc: 'Промпты, категории, избранное, переменные, экспорт, поиск.' },
    { cat: 'продуктивность', name: 'AI Prompt Optimizer', desc: 'Улучшение промпта, варианты, объяснение, история.' },
    { cat: 'продуктивность', name: 'Smart Notes', desc: 'Заметки, папки, теги, AI-резюме, связанные заметки.' },
    { cat: 'продуктивность', name: 'Focus Timer', desc: 'Помодоро, задачи, статистика, звуки, отчет продуктивности.' },
    { cat: 'продуктивность', name: 'Bookmark Manager', desc: 'Ссылки, категории, описания, поиск, проверка битых ссылок.' },

    { cat: 'программисты', name: 'JSON Formatter', desc: 'Форматирование, валидация, поиск ошибок, сравнение JSON, экспорт.' },
    { cat: 'программисты', name: 'Regex Builder', desc: 'Описание задачи, генерация regex, тестовая строка, подсветка совпадений.' },
    { cat: 'программисты', name: 'API Tester', desc: 'GET/POST/PUT/DELETE, headers, body, история, коллекции.' },
    { cat: 'программисты', name: 'Code Snippet Manager', desc: 'Сниппеты, языки, теги, поиск, копирование, экспорт.' },
    { cat: 'программисты', name: 'SQL Helper', desc: 'Генерация SQL, форматирование, объяснение, шаблоны.' },

    { cat: 'бизнес', name: 'CRM Mini', desc: 'Клиенты, статусы, заметки, задачи, история контактов, экспорт.' },
    { cat: 'бизнес', name: 'Учет заказов', desc: 'Клиенты, товары, статусы, оплата, доставка, отчет.' },
    { cat: 'бизнес', name: 'Генератор КП', desc: 'Клиент, услуги, цены, описание, экспорт PDF.' },
    { cat: 'бизнес', name: 'Контент-планер', desc: 'Идеи, календарь, статусы, генерация текста, экспорт.' },
    { cat: 'бизнес', name: 'Анализ отзывов', desc: 'Загрузка отзывов, тональность, частые проблемы, рекомендации, отчет.' },
    { cat: 'бизнес', name: 'Складской учет Mini', desc: 'Товары, остатки, приход, расход, поиск, Excel-экспорт.' },
    { cat: 'бизнес', name: 'Генератор описаний товаров', desc: 'Характеристики, SEO-описание, короткая версия, экспорт.' },

    { cat: 'безопасность', name: 'Локальный менеджер паролей', desc: 'Записи, категории, мастер-пароль, генератор паролей, локальное шифрование.' },
    { cat: 'безопасность', name: 'Проверка утечек привычек безопасности', desc: 'Чек-листы, рекомендации, оценка риска, отчет. Без взлома и вредоносных функций.' },

    { cat: 'для семьи', name: 'Планировщик дней рождения', desc: 'Контакты, даты, идеи подарков, напоминания, бюджет.' },
    { cat: 'для семьи', name: 'Домашний инвентарь', desc: 'Вещи, фото, стоимость, место хранения, гарантия, экспорт.' },

    { cat: 'для здоровья', name: 'Трекер воды', desc: 'Цель воды, дневная статистика, напоминания, график.' },
    { cat: 'для здоровья', name: 'Трекер сна', desc: 'Время сна, качество, заметки, графики, рекомендации общего характера.' },

    { cat: 'путешествия', name: 'Travel Planner', desc: 'Маршрут, бюджет, вещи, документы, список мест, экспорт плана.' },
    { cat: 'путешествия', name: 'Packing List', desc: 'Тип поездки, длительность, погода, список вещей, чек-лист.' }
  ];

  const categories = ['все', ...Array.from(new Set(topics.map(t => t.cat)))];

  const filteredTopics = topics.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTopic.toLowerCase()) || 
                          t.desc.toLowerCase().includes(searchTopic.toLowerCase());
    const matchesCategory = categoryFilter === 'все' || t.cat === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Prompt template text (Section 12)
  const getPromptText = () => {
    return `Ты senior Electron + React + TypeScript разработчик.

Создай desktop-приложение на Electron + React + TypeScript + Vite.

Тема приложения: "${promptTheme}".

Требования:
1. Приложение должно запускаться как desktop-программа.
2. Интерфейс должен быть современным, аккуратным и понятным.
3. Используй React-компоненты.
4. Используй TypeScript.
5. Данные должны храниться локально на компьютере.
6. Нужны минимум 3 основные страницы или раздела.
7. Нужна боковая навигация.
8. Нужна темная и светлая тема.
9. Нужна обработка ошибок.
10. Нужно состояние загрузки.
11. Нужна возможность экспортировать результат в файл.
12. Нужна инструкция, как запустить проект.
13. Нужна инструкция, как собрать приложение в EXE.

Работай поэтапно:
Сначала создай структуру проекта.
Потом создай интерфейс.
Потом добавь локальное хранение данных.
Потом добавь основную бизнес-логику.
Потом добавь экспорт файлов.
Потом добавь сборку в EXE.

Не пиши весь код хаотично.
Объясняй, в какой файл что вставлять.
После каждого этапа проверяй, что проект запускается.`;
  };

  const getTopicPrompt = () => {
    return `Придумай desktop-приложение на Electron + React для обычной жизни.

Опиши:
1. Кто пользователь приложения.
2. Какую проблему оно решает.
3. Главные функции.
4. Минимальную версию MVP.
5. Улучшенную версию.
6. Какие экраны нужны.
7. Какие данные нужно хранить.
8. Какие файлы можно импортировать.
9. Какие файлы можно экспортировать.
10. Как можно добавить искусственный интеллект.
11. Какие сложности могут возникнуть.
12. Как проверить, что приложение работает правильно.`;
  };

  const getBuildPrompt = () => {
    return `Объясни, как собрать этот Electron-проект в EXE для Windows.

Проверь package.json.
Добавь недостающие scripts.
Настрой Electron Forge или electron-builder.
Объясни команды:
npm install
npm start
npm run make

Покажи, где после сборки будет лежать EXE-файл.
Объясни, какие ошибки могут возникнуть и как их исправить.`;
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl p-6 sm:p-8 border border-slate-200/50 dark:border-slate-800/50 shadow-xl transition-all duration-300">
      
      {/* Learning Center Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-200/60 dark:border-slate-800/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <BookOpen className="w-6 h-6 text-brand-orange" />
            <h1 className="text-2xl font-display font-black tracking-tight bg-gradient-to-r from-brand-orange to-brand-yellow bg-clip-text text-transparent">
              Учебный центр Electron + React
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl">
            Методический мануал для преподавателя и интерактивный симулятор для учеников. 
            Автор методики: Данила Бородин.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-200/60 dark:bg-slate-850 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto">
          {[
            { id: 'manual', label: 'Методичка', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'ipc', label: 'IPC Симулятор', icon: <Cpu className="w-4 h-4" /> },
            { id: 'prompts', label: 'Промпты', icon: <Clipboard className="w-4 h-4" /> },
            { id: 'catalog', label: 'Каталог тем', icon: <Search className="w-4 h-4" /> },
            { id: 'evaluator', label: 'Калькулятор оценок', icon: <Award className="w-4 h-4" /> },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === t.id
                  ? 'bg-white dark:bg-slate-800 text-brand-orange shadow-md shadow-slate-300/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT: MANUAL TEXT */}
      {activeTab === 'manual' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chapter Sidebar */}
          <div className="lg:col-span-1 max-h-[550px] overflow-y-auto bg-slate-100/50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/30 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 px-3 block mb-2">Разделы мануала</span>
            {chapters.map(ch => (
              <button
                key={ch.id}
                onClick={() => setSelectedChapter(ch.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between group transition-colors cursor-pointer ${
                  selectedChapter === ch.id
                    ? 'bg-brand-orange/10 text-brand-orange font-bold border-l-2 border-brand-orange'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-850/50'
                }`}
              >
                <span className="truncate pr-2">
                  <span className="opacity-60 font-mono mr-1.5">{ch.number}.</span>
                  {ch.title}
                </span>
                <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${selectedChapter === ch.id ? 'opacity-100 text-brand-orange' : 'text-slate-400'}`} />
              </button>
            ))}
          </div>

          {/* Chapter Viewport */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-950/40 p-6 sm:p-8 rounded-3xl border border-slate-200/40 dark:border-slate-800/40 shadow-xs max-h-[550px] overflow-y-auto">
            {(() => {
              const ch = chapters.find(c => c.id === selectedChapter);
              if (!ch) return null;
              return (
                <article className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-100">
                  <span className="text-xs font-mono font-bold text-brand-orange uppercase tracking-wider block mb-1">Глава {ch.number}</span>
                  <h2 className="text-xl font-display font-black mb-5 text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                    {ch.title}
                  </h2>
                  <div className="text-sm leading-relaxed space-y-4">
                    {ch.content}
                  </div>
                </article>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB CONTENT: IPC SIMULATOR */}
      {activeTab === 'ipc' && (
        <div className="space-y-6">
          <div className="bg-brand-orange/5 border border-brand-orange/10 p-4 rounded-2xl flex items-start gap-3">
            <Info className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Этот интерактивный инструмент наглядно визуализирует архитектуру IPC (Inter-Process Communication). 
              В обычном браузере вы увидите симуляцию процесса. Внутри Electron-версии этого приложения 
              будет запущен <strong>настоящий системный IPC-запрос</strong> с вызовом диалогов ОС!
            </p>
          </div>

          {/* Controller */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => runIpcSimulation('selectFile')}
              disabled={ipcSimulating}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-brand-orange/15 dark:hover:bg-brand-orange/15 text-slate-700 dark:text-slate-200 hover:text-brand-orange rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <Terminal className="w-4 h-4" />
              Выбрать локальный файл
            </button>
            <button
              onClick={() => runIpcSimulation('saveFile')}
              disabled={ipcSimulating}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-brand-orange/15 dark:hover:bg-brand-orange/15 text-slate-700 dark:text-slate-200 hover:text-brand-orange rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Экспортировать (Save Dialog)
            </button>
            <button
              onClick={() => runIpcSimulation('getVersion')}
              disabled={ipcSimulating}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-brand-orange/15 dark:hover:bg-brand-orange/15 text-slate-700 dark:text-slate-200 hover:text-brand-orange rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <Settings className="w-4 h-4" />
              Запросить версию приложения
            </button>
          </div>

          {/* Visual Architecture Map */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-stretch relative">
            
            {/* Box 1: Renderer */}
            <div className={`p-4 rounded-2xl border text-center flex flex-col justify-center items-center transition-all ${
              ipcStep === 1 || ipcStep === 6 
                ? 'bg-brand-orange/10 border-brand-orange shadow-md shadow-brand-orange/10 scale-105' 
                : 'bg-white dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/60'
            }`}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Renderer Process</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">React UI (App.tsx)</span>
              <p className="text-[10px] text-slate-400 mt-1">Отправляет запрос через API</p>
            </div>

            <div className="flex items-center justify-center text-slate-300 dark:text-slate-700 text-lg font-bold font-mono">➔</div>

            {/* Box 2: Preload */}
            <div className={`p-4 rounded-2xl border text-center flex flex-col justify-center items-center transition-all ${
              ipcStep === 2 || ipcStep === 5 
                ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10 scale-105' 
                : 'bg-white dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/60'
            }`}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Preload Bridge</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">preload.ts</span>
              <p className="text-[10px] text-slate-400 mt-1">window.electronAPI</p>
            </div>

            <div className="flex items-center justify-center text-slate-300 dark:text-slate-700 text-lg font-bold font-mono">➔</div>

            {/* Box 3: Main Process */}
            <div className={`p-4 rounded-2xl border text-center flex flex-col justify-center items-center transition-all ${
              ipcStep === 3 || ipcStep === 4 
                ? 'bg-blue-500/10 border-blue-500 shadow-md shadow-blue-500/10 scale-105' 
                : 'bg-white dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/60'
            }`}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Main Process</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">main-electron.ts</span>
              <p className="text-[10px] text-slate-400 mt-1">Node.js / OS API access</p>
            </div>

          </div>

          {/* Console / Terminal logs */}
          <div className="bg-slate-900 border border-slate-950 rounded-2xl p-4 font-mono text-xs text-slate-200 shadow-inner">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-3">
              <span className="text-slate-400 font-bold flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-brand-orange" /> Вывод терминала IPC</span>
              {ipcSimulating && <span className="flex items-center gap-1 text-[10px] text-brand-orange"><RefreshCw className="w-3 h-3 animate-spin" /> Работает...</span>}
            </div>
            <div className="space-y-1 max-h-[180px] overflow-y-auto">
              {ipcConsoleLogs.length === 0 ? (
                <span className="text-slate-500 italic">// Нажмите на любую кнопку выше, чтобы запустить IPC поток</span>
              ) : (
                ipcConsoleLogs.map((l, idx) => (
                  <div key={idx} className={l.includes('Ошибка') ? 'text-red-400' : l.includes('Успех') ? 'text-emerald-400' : 'text-slate-300'}>
                    {l}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PROMPTS LIBRARY */}
      {activeTab === 'prompts' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-950/40 rounded-2xl p-4 sm:p-5 border border-slate-200/40 dark:border-slate-800/40">
            <span className="text-xs font-bold text-slate-400 block mb-2">Настроить параметры генератора промптов:</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Тема разрабатываемого приложения:</label>
                <input
                  type="text"
                  value={promptTheme}
                  onChange={(e) => setPromptTheme(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-brand-orange"
                  placeholder="Например, Умный планировщик задач"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Prompt 1 */}
            <div className="bg-white dark:bg-slate-950/40 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 overflow-hidden shadow-xs">
              <div className="flex justify-between items-center px-4 py-3 bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200/40 dark:border-slate-800/40">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Clipboard className="w-3.5 h-3.5 text-brand-orange" /> Главный промпт создания проекта (раздел 12.1)</span>
                <button
                  onClick={() => handleCopy(getPromptText(), 'main')}
                  className="flex items-center gap-1 text-[10px] font-bold text-brand-orange hover:bg-brand-orange/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedPromptId === 'main' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedPromptId === 'main' ? 'Скопировано!' : 'Копировать'}
                </button>
              </div>
              <pre className="p-4 font-mono text-[10px] leading-relaxed text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-950/20 max-h-[220px] overflow-y-auto whitespace-pre-wrap">
                {getPromptText()}
              </pre>
            </div>

            {/* Prompt 2 */}
            <div className="bg-white dark:bg-slate-950/40 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 overflow-hidden shadow-xs">
              <div className="flex justify-between items-center px-4 py-3 bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200/40 dark:border-slate-800/40">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Clipboard className="w-3.5 h-3.5 text-brand-orange" /> Промпт для детализации идеи (раздел 12.2)</span>
                <button
                  onClick={() => handleCopy(getTopicPrompt(), 'topic')}
                  className="flex items-center gap-1 text-[10px] font-bold text-brand-orange hover:bg-brand-orange/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedPromptId === 'topic' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedPromptId === 'topic' ? 'Скопировано!' : 'Копировать'}
                </button>
              </div>
              <pre className="p-4 font-mono text-[10px] leading-relaxed text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-950/20 max-h-[150px] overflow-y-auto whitespace-pre-wrap">
                {getTopicPrompt()}
              </pre>
            </div>

            {/* Prompt 3 */}
            <div className="bg-white dark:bg-slate-950/40 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 overflow-hidden shadow-xs">
              <div className="flex justify-between items-center px-4 py-3 bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200/40 dark:border-slate-800/40">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Clipboard className="w-3.5 h-3.5 text-brand-orange" /> Промпт для сборки EXE (раздел 12.3)</span>
                <button
                  onClick={() => handleCopy(getBuildPrompt(), 'build')}
                  className="flex items-center gap-1 text-[10px] font-bold text-brand-orange hover:bg-brand-orange/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedPromptId === 'build' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedPromptId === 'build' ? 'Скопировано!' : 'Копировать'}
                </button>
              </div>
              <pre className="p-4 font-mono text-[10px] leading-relaxed text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-950/20 max-h-[150px] overflow-y-auto whitespace-pre-wrap">
                {getBuildPrompt()}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CATALOG OF TOPICS */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="text-xs font-bold text-slate-500 block mb-1">Поиск темы:</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTopic}
                  onChange={(e) => setSearchTopic(e.target.value)}
                  placeholder="Поиск по ключевым словам..."
                  className="w-full text-xs font-semibold pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-850 bg-slate-100/50 dark:bg-slate-900 rounded-xl focus:outline-none focus:border-brand-orange"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 block mb-1">Категория:</label>
              <div className="flex gap-2 flex-wrap max-h-[100px] overflow-y-auto bg-slate-100/30 dark:bg-slate-900/20 p-2 rounded-xl border border-slate-200/50 dark:border-slate-850">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      categoryFilter === cat
                        ? 'bg-brand-orange text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid list of topics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[380px] overflow-y-auto pr-1">
            {filteredTopics.map((t, idx) => (
              <div 
                key={idx}
                className="bg-white dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 hover:border-brand-orange/30 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-md text-[8px] uppercase tracking-wider font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/30 dark:border-slate-800/30">
                      {t.cat}
                    </span>
                  </div>
                  <h4 className="text-xs font-display font-extrabold text-slate-900 dark:text-white mb-1.5">{t.name}</h4>
                  <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{t.desc}</p>
                </div>
                
                <button
                  onClick={() => {
                    setPromptTheme(t.name);
                    setActiveTab('prompts');
                  }}
                  className="mt-3 text-[9px] font-black uppercase text-brand-orange hover:underline text-left cursor-pointer flex items-center gap-0.5"
                >
                  Сгенерировать промпт <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ))}
            {filteredTopics.length === 0 && (
              <div className="col-span-full py-8 text-center text-slate-400 text-sm">
                Ничего не найдено по вашему запросу.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: EVALUATOR CALCULATOR */}
      {activeTab === 'evaluator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-4 bg-white dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/40 dark:border-slate-800/40">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
              <Award className="w-4.5 h-4.5 text-brand-orange" /> Карточка оценивания
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">ФИО Ученика:</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-brand-orange rounded-xl"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Название проекта:</label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-brand-orange rounded-xl"
                />
              </div>
            </div>

            {/* Criteria Inputs */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold text-slate-400 tracking-wider uppercase border-t border-slate-100 dark:border-slate-800 pt-3">Критерии:</div>
              
              {[
                { key: 'idea' as const, label: 'Идея (пользователь, реальная проблема)', max: 10 },
                { key: 'ui' as const, label: 'Интерфейс (дизайн, навигация, чистота)', max: 15 },
                { key: 'func' as const, label: 'Функциональность (стабильная работа)', max: 25 },
                { key: 'desktop' as const, label: 'Desktop-возможности (файлы, папки, IPC)', max: 15 },
                { key: 'ai' as const, label: 'Интеграция ИИ (осмысленность функции)', max: 15 },
                { key: 'build' as const, label: 'Сборка (EXE билд, инструкция)', max: 10 },
                { key: 'presentation' as const, label: 'Защита проекта (презентация)', max: 10 },
              ].map(crit => (
                <div key={crit.key} className="flex justify-between items-center gap-4 py-1.5 border-b border-slate-100/50 dark:border-slate-900/50 text-xs">
                  <span className="text-slate-600 dark:text-slate-300 font-semibold">{crit.label}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max={crit.max}
                      value={gradeInputs[crit.key]}
                      onChange={(e) => setGradeInputs(prev => ({ ...prev, [crit.key]: Number(e.target.value) }))}
                      className="w-24 sm:w-32 accent-brand-orange h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="w-12 text-right font-mono font-bold text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-md">
                      {gradeInputs[crit.key]} / {crit.max}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 flex flex-col items-center text-center shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Итоговая Оценка</span>
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-orange to-brand-yellow flex flex-col justify-center items-center text-white shadow-lg shadow-brand-orange/15 mb-3">
                <span className="text-3xl font-black">{totalScore}</span>
                <span className="text-[10px] font-bold opacity-85">из 100</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-black border ${evalInfo.color} mb-3`}>
                {evalInfo.label}
              </div>
              <p className="text-slate-500 text-[10px]">
                {totalScore >= 90 ? 'Проект готов к публикации и отвечает всем высшим стандартам.' : 
                 totalScore >= 75 ? 'Проект готов к сдаче. Можно улучшить некоторые desktop-фичи.' :
                 totalScore >= 60 ? 'Требуется небольшая корректировка перед защитой.' : 
                 'Проект не соответствует минимальным требованиям.'}
              </p>
            </div>

            {/* Generated copyable report */}
            <div className="bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 p-4 relative shadow-xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Генератор Отчетов</span>
              <button
                onClick={() => handleCopy(generatedFeedbackText, 'feedback')}
                className="absolute top-3 right-3 flex items-center gap-1 text-[9px] font-black text-brand-orange hover:bg-brand-orange/10 px-2 py-0.5 rounded-md cursor-pointer"
              >
                {copiedPromptId === 'feedback' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedPromptId === 'feedback' ? 'Копировать!' : 'Копировать'}
              </button>
              <pre className="font-mono text-[9px] text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed max-h-[140px] overflow-y-auto">
                {generatedFeedbackText}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
