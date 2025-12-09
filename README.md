# Лабораторная работа: Разработка плагина для VS code

## Введение

### Цель работы

Изучение архитектуры современных IDE на примере Visual Studio Code и разработка функционального плагина для расширения возможностей редактора.

### Задачи

1. Изучить архитектуру VS Code в контексте подключения сторонних расширений
2. Освоить VS Code Extension API
3. Разработать плагин для отслеживания времени работы программиста
4. Реализовать сохранение и отображение статистики

---

## Архитектура VS Code и система расширений

### Общая архитектура VS Code

Visual Studio Code построен на платформе Electron (Chromium + Node.js) и состоит из нескольких уровней:

1. Пользовательский интерфейс

Отвечает за всё, что видит пользователь — редактор кода (Monaco Editor) и рабочее пространство (Workbench).

2. Extension Host Process

Отдельный процесс Node.js, где работают расширения.
Он включает:

Extension API (vscode) — интерфейс для взаимодействия с VS Code;

Плагины (Extensions) — внешние модули, написанные на JavaScript или TypeScript.

3. Основной процесс (Main Process)

Это часть Electron, которая управляет окнами, системными ресурсами и координирует работу всех остальных слоёв.

### Механизм работы расширений

#### 1. Activation Events (События активации)

Плагин загружается не сразу при старте VS Code, а только когда происходит определенное событие:

```json
"activationEvents": [
    "onStartupFinished",              // После запуска редактора
    "onCommand:extension.command",    // При вызове команды
    "onLanguage:javascript",          // При открытии файла
    "*"                               // Немедленно
]
```

**В плагине** используется `"onStartupFinished"` - плагин активируется после полной загрузки VS Code, не замедляя старт редактора.

#### 2. Extension Manifest (package.json)

Манифест описывает метаданные и возможности расширения:

- **Команды** (`contributes.commands`) - регистрация команд в палитре
- **События активации** (`activationEvents`) - когда загружать плагин
- **Точка входа** (`main`) - JavaScript файл для запуска
- **Зависимости** (`dependencies`, `devDependencies`)

#### 3. Extension API

VS Code предоставляет API через модуль `vscode`:

```typescript
import * as vscode from 'vscode';

// Доступ к редактору
vscode.window.activeTextEditor

// События
vscode.workspace.onDidChangeTextDocument
vscode.window.onDidChangeActiveTextEditor

// UI компоненты
vscode.window.createStatusBarItem()
vscode.window.createWebviewPanel()

// Хранилище данных
context.globalState.update()
```

#### 4. Жизненный цикл расширения

```
1. VS Code запускается
2. Сканирование папки расширений (~/.vscode/extensions)
3. Чтение package.json каждого расширения
4. Ожидание activationEvent
5. Запуск Extension Host процесса
6. Вызов activate(context) функции
7. Регистрация команд, событий, UI элементов
8. Плагин работает
9. При закрытии VS Code: deactivate()
```

### Изоляция

- **Отдельный процесс**: Расширения выполняются в изолированном Node.js процессе
- **API ограничения**: Плагины могут использовать только предоставленный API
- **Sandbox**: Webview контент работает в изолированной среде
- **Permissions**: Нет прямого доступа к файловой системе пользователя

---

## Описание плагина

### Название

**Wakacode** - трекер времени для VS Code

### Назначение

Плагин автоматически отслеживает время работы программиста в редакторе и предоставляет детальную статистику по:
- Общему времени работы
- Используемым языкам программирования
- Редактируемым файлам
- Проектам

### Аналог

Плагин является упрощенной версией популярного [WakaTime](https://wakatime.com/), но:
- Не требует регистрации и сервера
- Все данные хранятся локально
- Полностью открытый исходный код

---

## Функциональные возможности

### 1. Автоматическое отслеживание времени

- **Таймер в реальном времени**: отображение времени текущей сессии в статус-баре
- **Автоматический старт**: плагин активируется сразу после запуска VS Code
- **Определение простоя**: время останавливается при неактивности более 2 минут
- **Автосохранение**: данные сохраняются каждую секунду

### 2. Статистика по языкам программирования

Плагин отслеживает какие языки вы используете

### 3. Статистика по файлам

Топ-5 файлов по времени работы с указанием:
- Имени файла
- Времени работы с файлом

### 4. Статистика по проектам

Распределение времени между разными workspace folders.

### 5. История по дням

Сохранение статистики за каждый день отдельно:
- Просмотр активности за сегодня
- Просмотр активности за любой предыдущий день
- Общая статистика за все время

### 6. Команды плагина

Доступны через Command Palette (`Cmd/Ctrl + Shift + P`):

- `Wakacode: Show Today's Activity` - Показать активность за сегодня
- `Wakacode: Show Statistics` - Показать статистику за все время
- `Wakacode: Reset Statistics` - Очистить всю статистику

### 7. Интерактивный статус-бар

- Отображение времени текущей сессии
- Иконка часов
- Клик открывает детальную статистику

---

### Используемые технологии

- **TypeScript** - язык разработки
- **VS Code Extension API** - API для расширений
- **Node.js** - runtime окружение
- **HTML** - отображение статистики


### Основные компоненты

#### 1. TimeTracker (`src/timeTracker.ts`)

**Назначение**: Основная бизнес-логика отслеживания времени

**Ключевые методы**:
```typescript
class TimeTracker {
    private sessionTime: number = 0;
    private lastActivity: number = 0;

    // Запуск таймера
    private startTracking(): void

    // Запись активности пользователя
    public recordActivity(document: vscode.TextDocument): void

    // Обновление дневной статистики
    private updateDailyStats(fileName: string, languageId: string): void

    // Получение статистики
    public getSessionStats(): SessionStats
    public getTodayStats(): SerializedDailyStats
    public getAllStats(): { [date: string]: SerializedDailyStats }
}
```

#### 2. StatusBarManager (`src/statusBar.ts`)

**Назначение**: Управление отображением в статус-баре

**Функционал**:
- Создание элемента в статус-баре
- Обновление времени каждую секунду
- Форматирование вывода (иконка + время)
- Обработка клика (открытие статистики)

#### 3. StatsDisplay (`src/statsDisplay.ts`)

**Назначение**: Генерация и отображение статистики

**Функционал**:
- Создание Webview панели
- Генерация простого HTML без CSS
- Форматирование данных (списки языков, файлов)
- Подсчет общего времени

#### 4. Types (`src/types.ts`)

**Назначение**: TypeScript интерфейсы для типизации данных

```typescript
interface SessionStats {
    startTime: number;
    totalTime: number;
    currentFile?: string;
    currentLanguage?: string;
}

interface SerializedDailyStats {
    date: string;
    totalTime: number;
    languages: { [key: string]: number };
    files: { [key: string]: number };
    projects: { [key: string]: number };
}
```

### События VS Code

Плагин подписывается на следующие события:

```typescript
// 1. Изменение текста (когда пользователь печатает)
vscode.workspace.onDidChangeTextDocument((event) => {
    tracker.recordActivity(event.document);
});

// 2. Переключение между файлами
vscode.window.onDidChangeActiveTextEditor((editor) => {
    tracker.recordActivity(editor.document);
});
```

### Хранение данных

**Механизм**: `context.globalState` (встроенное хранилище VS Code)

**Структура данных**:
```json
{
  "activities": [],
  "dailyStats": {
    "2025-10-28": {
      "date": "2025-10-28",
      "totalTime": 7200,
      "languages": {
        "typescript": 5000,
        "javascript": 2200
      },
      "files": {
        "/path/to/file.ts": 5000,
        "/path/to/app.js": 2200
      },
      "projects": {
        "my-project": 7200
      }
    }
  }
}
```

**Местоположение на диске**:
- macOS: `~/Library/Application Support/Code/User/globalStorage/`
- Windows: `%APPDATA%\Code\User\globalStorage\`
- Linux: `~/.config/Code/User/globalStorage/`

---

## Установка и запуск

### Требования

- Visual Studio Code версии 1.85.0 или выше
- Node.js (версия 18.x или выше)
- npm

### Установка зависимостей

```bash
# Клонирование репозитория
git clone https://github.com/Danzil21/wakacode
cd test_plugin_isrpo

# Установка зависимостей
npm install
```

### Компиляция

```bash
npm run compile
```

### Запуск в режиме разработки

1. Откройте проект в VS Code
2. Нажмите `F5` или выберите `Run → Start Debugging`
3. Откроется новое окно "Extension Development Host"
4. Плагин автоматически активируется
5. Внизу справа появится `таймер 0с`

### Использование

1. **Автоматическое отслеживание**: Просто работайте - время отслеживается автоматически
2. **Просмотр статистики**: Кликните на время в статус-баре или используйте команды
3. **Сброс данных**: Команда `Wakacode: Reset Statistics`

---

## Структура проекта

```
simple-wakatime/
├── .vscode/
│   ├── launch.json
│   └── tasks.json
├── out/
├── src/
│   ├── extension.ts
│   ├── timeTracker.ts
│   ├── statusBar.ts
│   ├── statsDisplay.ts
│   └── types.ts
├── package.json
├── tsconfig.json
├── README.md
```

**Всего: ~457 строк кода TypeScript**

---

## Результаты работы

#### 1. Статистика за сегодня (HTML вывод)

```html
Статистика за сегодня

Общее время: 2ч 35м
Текущая сессия: 45м

─────────────────────

Языки:
• TypeScript: 1ч 30м
• JavaScript: 1ч 5м

Топ файлов:
• extension.ts: 45м
• timeTracker.ts: 30м
• statsDisplay.ts: 15м
```

#### 2. Статистика за все время

```html
Вся статистика

Общее время за все дни: 8ч 15м

─────────────────────

По дням:
• 2025-10-28: 2ч 35м
• 2025-10-27: 3ч 20м
• 2025-10-26: 2ч 20м
```


### Изученные технологии и концепции

**VS Code Extension API**:
- Жизненный цикл расширений (activate/deactivate)
- События редактора (onDidChangeTextDocument, onDidChangeActiveTextEditor)
- Команды (registerCommand)
- UI компоненты (StatusBarItem, WebviewPanel)
- Хранилище данных (globalState)

**TypeScript**:
- Интерфейсы и типы
- Классы и модули
- Template literals для HTML
- Асинхронные функции
---
