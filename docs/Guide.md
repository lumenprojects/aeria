# Aeria — Guide (актуальная версия)

Документ фиксирует текущие продуктовые и инженерные контракты проекта. Если код и Guide расходятся, это считается багом.

## 1) Назначение и стек
- Aeria — SPA для ранобэ-проекта: эпизоды, персонажи, атлас.
- Язык интерфейса и основного контента: русский.
- v1 без полноценного i18n-слоя (кроме отдельных `*_native` полей данных).

Технологии:
- Web: React + Vite + TypeScript + React Router + Framer Motion.
- API: Fastify + TypeScript + Zod + pg.
- DB: PostgreSQL + `node-pg-migrate`.
- Поиск: Typesense через очередь `search_queue`.

## 2) Monorepo и каталоги
- `apps/web` — SPA.
- `apps/api` — API.
- `packages/shared` — DTO/схемы контрактов.
- `packages/db` — миграции.
- `packages/content` — импорт markdown-контента.
- `content/` — source markdown.
- `assets/` — медиа/иконки/шрифты.
- `docs/` — системная документация.

## 3) Контент и импорт
Обязательные правила:
- Импорт идемпотентный: `source_path` + `content_hash`.
- Удалённые файлы архивируются (`archived_at`), не удаляются физически.
- Импорт батчами в транзакциях.
- Есть dry-run (`content:dry-run`).
- Ссылки по slug валидируются до записи.
- Markdown санитизируется.
- `characters.avatar_asset_path` обязателен; для `locations`/`atlas_entries` — опционален.
- `avatar_asset_path` хранится как абсолютный web-path внутри проекта (`/assets/...`).
- `reading_minutes`: 180 слов/мин, округление вверх.
- Индексация поиска выполняется через очередь, не в транзакции импорта.

Порядок загрузки:
- `countries -> locations -> series -> episodes -> characters -> atlas -> links`.

## 4) API контракты
Основные публичные роуты:
- `/api/home`
- `/api/episodes`, `/api/episodes/:slug`
- `/api/series`, `/api/series/:slug`
- `/api/characters`, `/api/characters/fact-of-day`, `/api/characters/:slug`, `/api/characters/:slug/preview`
- `/api/atlas`, `/api/atlas/:slug`, `/api/atlas/:slug/preview`
- `/api/countries`, `/api/locations`
- `/api/search`

Общие правила:
- List-эндпоинты поддерживают `page`, `limit` (+ предметные фильтры).
- `archived_at` не отдаётся в публичных DTO.
- Публичные DTO содержат канонический `url`.

### `/api/characters` (list)
- Поддерживает: `page`, `limit`, `q`, `country`, `affiliation`, `sort`.
- `sort`: `name_asc` (default), `name_desc`.
- `q` ищет по:
  - `name_ru`, `name_native`, `tagline`, `bio_markdown`;
  - `country.title_ru`, `affiliation.title_ru`;
  - профильным полям (`gender`, `race`, `mbti`, `favorite_food`).
- В публичный list/search попадают только `listed = true`.
- Detail `/api/characters/:slug` остаётся доступным по slug и для `listed = false`.

Shape item в `/api/characters`:
- `avatar_asset_path` (обязательно),
- `country: CountryFlagDTO | null`,
- `affiliation: AtlasReferenceDTO | null`.

### `/api/characters/fact-of-day`
- Источник: таблица `character_facts`.
- Ротация фиксируется по `Europe/Moscow` (переключение в `00:00 MSK`).
- `comment_author_character` может быть `null`.

### `/api/home`
- Отдаёт `latest_episode`, `about_profile`, `world_quote`.

## 5) Поиск
- Глобальный поиск (navbar): `Ctrl/Cmd + K`, группы по типам сущностей.
- Индексация через `search_queue` worker.
- `listed = false` персонажи не попадают в публичный индекс.

Отдельно для `/characters`:
- Поиск только по персонажам.
- Серверный запрос через `/api/characters?q=...`.
- Debounce: `200ms`.
- URL-sync: `q`, `country`, `affiliation`, `sort`.

## 6) Навбар (контракт)
- `sticky` верхний navbar + mobile bottom nav.
- Верхний navbar живёт в `width-wide`, без full-width контента.
- Вертикальный inset: сверху `--space-lg`, снизу `--space-md`.
- Режимы: разделы / detail breadcrumbs / reading-progress.
- Поиск открывается inline под navbar (не modal).

Правая группа:
- `Поиск` (+ счётчик главы на чтении),
- разделитель,
- `День/Ночь`, `Aa`, `...`.

### Подчёркивания (единая система)
Локальные клоны underline запрещены.

Допустимые классы:
- `ui-underline` — всегда активна.
- `ui-underline-click` — по активному состоянию.
- `ui-underline-hover` — по `hover/focus-visible`.

Активация `ui-underline-click`:
- `.ui-underline-active`,
- `data-underline-active="true"`,
- `aria-current="page"`,
- `aria-expanded="true"`,
- системные active-классы (`navbar-link-active`, `navbar-icon-active`).

Эти правила обязательны для:
- ссылок разделов navbar,
- кнопок `Поиск`, `Aa`, `...`,
- кнопки фильтров в каталоге персонажей.

### Настройки navbar
Источник истины: cookie `aeria-theme`.

Храним:
- `theme`, `mode`,
- `fontUi`, `fontHeading`, `fontBody`,
- `noise`, `tapEffect`.

## 7) Страница `/characters` (v1)
Текущий состав:
1. `CharacterFactOfDaySection`.
2. `SectionBreak` (`stars`).
3. Каталог: `поиск + фильтры`.
4. Список строк персонажей.

Контейнер и ритм:
- каталог живёт в `width-medium`.
- разрыв между controls и списком: `--space-lg`.
- UI пагинации нет; загружается до 100 записей.
- список имеет стабильную высоту (min/max) и внутренний `overflow-y`, чтобы страница не дёргалась при сужении выдачи.

Фильтры v1:
- `Страна`, `Принадлежность`, `Сортировка`, `Сбросить`.
- Surface: desktop-панель справа, mobile-полноширинное меню.

Строка персонажа:
- полностью кликабельна (переход на detail),
- структура: `Avatar(sm)` + вертикальный блок + chevron,
- inset `--space-md`, gap `--space-md`, внутри текстового блока `--space-sm`,
- нижняя линия: default `divider`, на hover плавно в `accent`.
- при отсутствии страны/принадлежности используется нейтральный fallback без ломки ритма.

## 8) Дизайн-система
Базовые токены:
- Отступы: `--space-xs/sm/md/lg/xl` (+ микро `--space-1..10`).
- Типографика: `--type-extra/medium/normal/small` + `--type-reading`.
- Ширины: `--width-narrow/medium/wide`.
- Скругления: `--radius-sm/md/lg`.
- Непрозрачности текста: `--opacity-100/64/36/8`.
- Reading/preview tokens: `--lh-reading`, `--measure-reading-scene-label`, `--indent-reading-list`, `--width-preview-surface`.

Жёсткие правила:
- Только системные токены, без page-local чисел.
- Нельзя добавлять локальные `clamp()` под один блок.
- Нельзя дублировать ритм одновременно через `gap` и `margin`.
- Любая визуальная правка должна синхронизировать код и docs в одном изменении.

## 9) UI policy (Radix/shadcn)
- Shadcn — стартовый слой поведения/a11y, не финальный визуал.
- В фичах используются только наши обёртки из `components/ui`/`components/entities`.
- Typography только через `Typography` и роли `ui|heading|body`.
- `Avatar` один базовый с size-variants `xs|sm|md|lg`.
- `Flag` отдельный примитив, не кликабелен в v1.

## 10) Motion
Разрешено:
- медленные reveal/blur/fade,
- layout/spring для control-групп,
- drag там, где это функционально оправдано.

Запрещено:
- декоративный шум motion без пользы,
- паттерны, ухудшающие a11y или читаемость.

## 11) Quality baseline
Перед merge в `main`:
- `npm run verify`
- для контентных/БД изменений: `npm run verify:content`

`verify` включает:
- lint,
- typecheck,
- build,
- smoke.

## 12) Быстрый старт
1. `npm install`
2. `docker compose up -d` (или `npm run db:up`)
3. `cp .env.example .env`
4. `npm run migrate`
5. `npm run content:dry-run`
6. `npm run content:import`
7. `npm run search:worker`
8. `npm run dev`
