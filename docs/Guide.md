# Aeria — Гайдлайн проекта

Этот документ описывает, что именно сделано в текущем фундаменте Aeria и на что он рассчитан. Цель — держать структуру предсказуемой и не допускать расползания в случайные локальные решения.

## Назначение
Aeria — это SPA-сайт для ранобэ-проекта: эпизоды (главы), персонажи, атлас (весь остальной лор). Контент хранится в Markdown, импортируется в PostgreSQL и индексируется в Typesense для глобального поиска.
- Язык интерфейса и основного контента: русский.
- Переводный слой не внедряется в v1 (кроме `title_native` у главы как отдельного поля данных).

## Архитектура
- **Monorepo**: единый репозиторий, чтобы не дублировать типы/контракты и держать единый стиль.
- **Web**: React + Vite + TypeScript + React Router + Framer Motion.
- **API**: Fastify + TypeScript + Zod + pg.
- **DB**: PostgreSQL, миграции через `node-pg-migrate`.
- **Search**: Typesense (через очередь `search_queue`).

## Структура репозитория
- `apps/web` — фронтенд SPA.
- `apps/api` — backend API.
- `packages/shared` — общие типы и Zod-схемы DTO.
- `packages/db` — миграции Postgres.
- `packages/content` — парсер Markdown, валидатор, импортер, очередь индексации.
- `content/` — исходные Markdown файлы.
- `assets/` — ассеты проекта (images/flags/textures/icons/fonts).
- `docs/` — UX/UI правила и системная документация.

## Контент и импорт
Контент хранится в `content/*` как Markdown с YAML frontmatter.

Ключевые правила импорта:
- **Idempotent re-import**: у каждой записи `source_path` и `content_hash`.
- **Удаление**: при исчезновении файла запись архивируется через `archived_at`.
- **Транзакции**: импорт идёт батчами, с rollback при ошибке.
- **Dry-run**: есть режим `--dry-run` с diff-отчётом.
- **Проверка ссылок**: все slug-ссылки валидируются до записи.
- **Markdown sanitation**: входной Markdown нормализуется, HTML вычищается.
- **reading_minutes**: единая формула 180 слов/мин, округление вверх.
- **schema_version**: версия формата контента фиксируется в `content/schema.json`.
- **Логи импорта**: `import_runs`, `import_errors`.
- **Поиск**: Typesense обновляется **не** в транзакции, а через очередь и worker.
- **Порядок загрузки**: `countries → locations → series → episodes → characters → atlas → links`.

## База данных
Ключевые сущности:
- `episodes`, `episode_series`, `characters`, `atlas_entries`, `countries`, `locations`.
- M:N: `episode_characters`, `episode_locations`.
- 1:N: `character_traits`, `character_rumors`.
- Связи атласа: `atlas_links` (направленные связи между сущностями).

Уникальности:
- `episodes(global_order)`
- `episodes(series_id, episode_number)`
- join-таблицы и `atlas_links` с уникальными индексами.

## API
- Эндпоинты:
  - `/api/episodes`, `/api/episodes/:slug`
  - `/api/series`, `/api/series/:slug`
  - `/api/characters`, `/api/characters/:slug`
  - `/api/atlas`, `/api/atlas/:slug`
  - `/api/countries`, `/api/locations`
  - `/api/search`
- Фильтрация на list-эндпоинтах: `page`, `limit`, плюс сущностные фильтры (`series`, `country`, `kind`).
- `archived_at` исключается из выдачи.

## Поиск
- Typesense индексирует эпизоды, персонажей, атлас, серии, страны, локации.
- Глобальный поиск доступен в навбаре (`Ctrl/Cmd + K`).
- Индексация идёт через очередь `search_queue` и воркер.

## Frontend и навбар
- SPA без перезагрузок.
- Глобальный навбар:
  - режим разделов
  - режим breadcrumbs внутри карточек
  - режим чтения главы (полоса прогресса)
- Поиск и системные действия всегда доступны.
- На mobile — нижняя панель навигации.
- Глобальный поиск запускается `Ctrl/Cmd + K`, результаты группируются по типам.

### Navbar v1 (зафиксировано)
- Навбар `sticky`, фон на всю ширину экрана, без верхних/боковых отступов.
- Контент навбара ограничен контейнером колонок (`container`), а не full-width.
- Левый блок:
  - на корневых страницах: `Главная / Эпизоды / Персонажи / Атлас`;
  - на детальных страницах: `Назад` + breadcrumbs.
- Центр: логотип `Aeria` (временный шрифт из heading-стека, затем отдельный бренд-шрифт).
- Правый блок:
  - `Поиск`
  - индикатор главы `current/total` (только на странице чтения эпизода)
  - `День/Ночь`
  - `Aa`
  - `...`
- Индикатор главы в nav не кликабелен, это только контекст.
- Поиск открывается **inline** под навбаром (не модалка).
- В пустом запросе поиск показывает недавние открытые записи (recent).
- Полоса прогресса чтения показывается в верхней границе nav только в режиме чтения эпизода.
- На mobile сохраняется верхний nav и дублируется нижняя панель с разделами.

### Navbar: сохранение настроек
- Источник истины для настроек навбара: cookie `aeria-theme`.
- В cookie хранятся:
  - `theme`, `mode`
  - `fontUi`, `fontHeading`, `fontBody`
  - `noise`, `tapEffect`
- Параметры cookie:
  - `path=/`
  - `max-age=31536000` (1 год)
  - `sameSite=Lax`
  - `secure` при `https`
- Миграция: если cookie отсутствует, старые настройки из `localStorage` читаются один раз и переносятся в cookie.

### Navbar: поведение меню
- Меню `Aa`:
  - три независимых селектора `UI / Headings / Text`;
  - закреплённые наборы шрифтов:
    - UI: `Manrope`, `IBM Plex Sans`
    - Headings: `Fraunces`, `Playfair Display`
    - Text: `Source Serif 4`, `Spectral`
- Меню `...`:
  - `Style`: `Paper`, `Stone`, `Coral`, `Amoled`
  - `Noise`: `On/Off`
  - `Tap Effect`: `None/Ripple` (на текущем этапе только хранение настройки).

## Дизайн-система
- Три типографические роли: `ui`, `heading`, `body`.
- Строгая иерархия отступов и шрифтов. Используется ограниченный общий список размерностей и не создаются никакие новые ситуативные решения.
- Ширина колонок основного сайта строго трёх видов `small`, `medium`, `large`.
- Темы: `Paper`, `Stone`, `Coral`, `Amoled` (каждая light/dark).
- Панель Aa: отдельные шрифты для `UI / Headings / Text`, настройки сохраняются в cookies.
- Компоненты на базе **Radix UI** + кастомные headless при отсутствии примитивов:
  - `Accordion`, `Aspect Ratio`, `Avatar`, `Badge`, `Breadcrumb`, `Button`, `Button Group`, `Carousel`, `Checkbox`, `Combobox`, `Input`, `Menubar`, `Navigation Menu`, `Pagination`, `Popover`, `Progress`, `Scroll Area`, `Separator`, `Skeleton`, `Tooltip`, `Typography`.
- **Typography — единственная точка входа для текста.** Прямые размеры шрифтов в компонентах запрещены.

### Сетки и скейлы (ratio-based)
Исходные значения из Figma — это **соотношения**, а не абсолюты. На web они переводятся в `clamp()` между 360–1920.

**Брейкпоинты**
- 360 / 768 / 1280 / 1440 / 1920

**Типографика (4 размера)**
- `extra` / `medium` / `normal` / `small`
- Соотношение из Figma: 96 / 64 / 36 / 24
- В коде: `--type-extra`, `--type-medium`, `--type-normal`, `--type-small` через `clamp()`.
- Используются только эти размеры, без локальных исключений.
- Все тексты оформляются через `Typography` и роли (`ui`/`heading`/`body`).

**Отступы (4 размера)**
- `huge` / `high` / `average` / `small`
- Соотношение из Figma: 160 / 80 / 40 / 20
- В коде: `--space-huge`, `--space-high`, `--space-average`, `--space-small` через `clamp()`.
- Между логически связанными блоками — ближе, между несвязанными — дальше.

**Непрозрачности (только для текста)**
- `100 / 64 / 36 / 8` → `--opacity-100/64/36/8`
- 100 — основной текст, 64 — вторичный, 36 — третичный, 8 — разделители/подложки.

**Колонки**
- `small` / `medium` / `large` в Figma: 880 / 1400 / 2240
- В коде: `--container-small/medium/large` через `clamp()`.

**Шум**
- Gaussian noise на весь фон.
- По умолчанию **выключен** (`--noise-opacity: 0`), включается через настройки.
- Шум — глобальный слой, не применяется локально на карточки.

### Палитра тем
Каждая тема имеет **фон**, **текст**, **акцент**. Другие цвета выводятся только из этих трёх через смешивание/opacity.

**Paper**
- Light: фон `#FEFDFB`, текст `#2A2A2A`, акцент `#FFB44B`
- Dark: фон `#121212`, текст `#F1EEE9`, акцент `#F2CA86`

**Coral**
- Light: фон `#FFF6F4`, текст `#392D31`, акцент `#F95C4B`
- Dark: фон `#271C1D`, текст `#FFE6E1`, акцент `#FF7D6F`

**Stone**
- Light: фон `#E4DED2`, текст `#2B2621`, акцент `#8D6B44`
- Dark: фон `#1D1A18`, текст `#E8DFD2`, акцент `#D0A878`

**Amoled**
- Dark (основной): фон `#000000`, текст `#F1EEE9`, акцент `#72A5FF`
- Light: фон `#F2F2F0`, текст `#141414`, акцент `#6EA8FF`

**Исключение**
- Цвет серии эпизодов может быть вне палитры темы и отображается как самостоятельный акцент.

### Mobile-режим (правила)
- Основной размер body не опускается ниже `--type-small`.
- Заголовки масштабируются только через `--type-*` (никаких ручных размеров).
- Длина строки для чтения: 45–75 символов.
- Вертикальный ритм:
  - связанные блоки: `--space-small` / `--space-average`
  - независимые блоки: `--space-high`
  - глобальные разрывы секций: `--space-huge`
- Контейнеры на mobile используют `container-sm`.
- Приоритет: контекст + действие, без перегруза (progressive disclosure).

## Границы ответственности
- **Контент** редактируется только в Markdown, API и UI — читатели.
- **Схема БД** только через миграции, без ручных правок.
- **UI** развивается через дизайн-систему, без хаотичных вариантов.
- **Серверные данные во фронтенде** хранятся через TanStack Query, а не в постоянном глобальном store.
- **DTO публичного API** не раскрывают служебные поля импорта (`source_path`, `content_hash`, `archived_at`).

## Quality baseline (обязательно)
- Перед merge в `main` запускать `npm run verify`.
- Для изменений в БД/импорте/контенте дополнительно запускать `npm run verify:content`.
- `verify` включает:
  - lint (`apps/web`, `apps/api`)
  - typecheck (`apps/web`, `apps/api`)
  - build (`web + api`)
  - smoke tests (`web navbar`, `api /health`)
- `verify:content` включает:
  - миграции
  - `content:import -- --dry-run`
- В репозитории закреплены:
  - CI workflow: `.github/workflows/ci.yml`
  - PR checklist: `.github/pull_request_template.md`

## Быстрый старт
1. `npm install`
2. `docker-compose up -d`
3. `cp .env.example .env`
4. `npm run migrate`
5. `npm run content:import -- --dry-run`
6. `npm run content:import`
7. `npm run search:worker`
8. `npm run dev`
