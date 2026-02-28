# Aeria — Гайдлайн проекта

Этот документ описывает, что именно сделано в текущем фундаменте Aeria и на что он рассчитан. Цель — держать структуру предсказуемой и не допускать расползания в случайные локальные решения.

## Назначение
Aeria — это SPA-сайт для ранобэ-проекта: эпизоды (главы), персонажи, атлас (весь остальной лор). Контент хранится в Markdown, импортируется в PostgreSQL и индексируется в Typesense для глобального поиска.

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

## Дизайн-система
- Три типографические роли: `ui`, `heading`, `body`.
- Строгая иерархия отступов и шрифтов. Используется ограниченный общий список размерностей и не создаются никакие новые ситуативные решения.
- Темы: `Paper`, `Stone`, `Coral`, `Amoled` (каждая light/dark).
- Панель Aa: переключение шрифтовых пресетов.
- Компоненты на базе **Radix UI** + кастомные headless при отсутствии примитивов:
  - `Accordion`, `Aspect Ratio`, `Avatar`, `Badge`, `Breadcrumb`, `Button`, `Button Group`, `Carousel`, `Checkbox`, `Combobox`, `Input`, `Menubar`, `Navigation Menu`, `Pagination`, `Popover`, `Progress`, `Scroll Area`, `Separator`, `Skeleton`, `Tooltip`, `Typography`.

## Границы ответственности
- **Контент** редактируется только в Markdown, API и UI — читатели.
- **Схема БД** только через миграции, без ручных правок.
- **UI** развивается через дизайн-систему, без хаотичных вариантов.

## Быстрый старт
1. `npm install`
2. `docker-compose up -d`
3. `cp .env.example .env`
4. `npm run migrate`
5. `npm run content:import -- --dry-run`
6. `npm run content:import`
7. `npm run search:worker`
8. `npm run dev`
