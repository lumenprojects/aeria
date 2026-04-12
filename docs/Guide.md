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
- Данные world-индекса импортируются из `content/world` в единую сущность `atlas_entities`.
- `characters.avatar_asset_path` обязателен; для world-сущностей — optional.
- `world.sections[]` поддерживают editorial-поля:
  - `fact = { title, text, meta? }`
  - `quotes[] = { text, character_slug } | { text, speaker_name, speaker_meta? }`
- `quotes` задаются на уровне секции и доступны для любых world-сущностей, где это уместно редакционно.
- `avatar_asset_path` хранится как абсолютный web-path внутри проекта (`/assets/...`).
- `reading_minutes`: 180 слов/мин, округление вверх.
- Индексация поиска выполняется через очередь, не в транзакции импорта.

Порядок загрузки:
- `world -> series -> episodes -> characters`.

## 4) API контракты
Основные публичные роуты:
- `/api/home`
- `/api/home/world-quote/random`
- `/api/episodes`, `/api/episodes/:slug`
- `/api/series`, `/api/series/:slug`
- `/api/characters`, `/api/characters/fact-of-day`, `/api/characters/:slug`, `/api/characters/:slug/preview`
- `/api/atlas/catalog`, `/api/atlas/:slug`, `/api/atlas/:slug/preview`
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

### `/api/home/world-quote/random`
- Возвращает случайную цитату мира.
- Поддерживает optional `exclude_id`, чтобы не повторять только что показанную цитату.
- Используется главной страницей для кнопки `Подслушать ещё`.

### `/api/atlas/catalog`
- Единый мировой индекс для `country`, `location` и остальных `atlas_entities`.
- Поддерживает: `page`, `limit`, `q`, `type`, `section`, `country`, `location`, `sort`.
- `sort`: `title_asc` (default), `title_desc`, `recent`.
- `q` ищет по:
  - `title_ru`, `summary`, `overview_markdown`;
  - `country.title_ru`, `location.title_ru`;
  - списку секций world-узла.
- Shape item:
  - `type`,
  - `sections[]`,
  - resolved `country` и `location`,
  - `related_count`,
  - `published_at`.
- Ответ дополнительно содержит facets:
  - `type`,
  - `section`,
  - `country`,
  - `location`.

### `/api/atlas/:slug`
- Detail работает по единой записи из `atlas_entities`.
- Payload содержит:
  - `entity`,
  - `sections[]`,
  - `relations[]`.
- `sections[]` включают `title_ru`, `summary`, `body_markdown`, optional `fact`, optional `quotes[]`.
- `relations[]` содержат resolved target `{ type, slug, url, title, avatar_asset_path, country? }`.

### `/api/atlas/:slug/preview`
- Preview содержит `type`, `sections[]`, optional `country` и optional `location`.

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
- по умолчанию: `Поиск`, разделитель, `День/Ночь`, `Aa`, `...`;
- на чтении: `Поиск`, разделитель, счётчик главы, разделитель, `День/Ночь`, `Aa`, `...`.

Detail-режим:
- back-control отображается символом `<`, не текстом `Назад`;
- back-control использует тот же icon-control box, что и другие кнопки navbar;
- между back-control и breadcrumbs стоит такой же разделитель;
- breadcrumbs используют separator `>`, не `/`.
- breadcrumbs в navbar собираются через системный `components/ui/breadcrumb` (shadcn-структура + наши токены/spacing).

Reading progress:
- счётчик главы использует компактную UI-типографику;
- текущая глава в полном цвете, ` / всего` в opacity `36%`.
- progress-strip рендерится под navbar, не по верхней кромке страницы;
- progress-strip использует navbar underline thickness и accent-токен.

Глобальный якорь `Наверх`:
- появляется на всех страницах после прокрутки;
- выравнивается по правой границе той же `width-wide` зоны, что и desktop navbar, и не подходит к краям экрана ближе `--space-xl`;
- нижний inset на desktop — `--space-lg`; на mobile control поднимается над нижним navbar, сохраняя тот же `lg`-ритм относительно fixed-nav;
- использует канонический directional asset `/assets/icons/aeria-arrow.svg`;
- исходный SVG хранится направленным вправо и поворачивается в коде по нужному направлению;
- якорь не использует отдельную круговую обводку или filled badge; в интерфейсе остаётся только сам directional-sign.

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
- кнопок фильтров в каталогах персонажей и эпизодов.

### Настройки navbar
Источник истины: cookie `aeria-theme`.

Храним:
- `theme`, `mode`,
- `fontUi`, `fontHeading`, `fontBody`,
- `tapEffect`.
- Контролы выбора в сабменю `Aa` и `...` используют системный `components/ui/select` на Radix/shadcn; native browser `select` в navbar запрещён.
- Trigger и option-list этих Select-контролов обязаны иметь читаемую hover/focus/open реакцию, а не выглядеть как статичный browser text.
- В `Настройки -> Style` каждый пункт темы показывает цветную акцентную точку рядом с названием, чтобы палитра считывалась до применения.

## 7) Каталоги (v1)
### `/episodes`
Текущий состав:
1. Hero-блок `Самый свежий Эпизод`.
2. FAQ-блок об эпизодах и сериях.
3. Optional context-блок активной серии, если открыт `/episodes?series=...`.
4. Каталог: `поиск + фильтры`.
5. Список строк эпизодов.

Контейнер и ритм:
- каталог живёт в `width-medium`;
- поиск и список разведены через `--space-lg`;
- UI пагинации нет; загружается до 100 записей;
- страница наследует общий catalog-ритм, но не копирует силуэт каталога персонажей.

Фильтры v1:
- `Персонаж`, `Серия`, `Порядок`, `Сбросить фильтры`;
- поиск работает локально по заголовку, описанию и номеру уже загруженных эпизодов;
- при активной `series` страница показывает краткий контекст выбранной серии и действие `Показать весь каталог`;
- surface: inline collapsible drawer под поиском, открывается icon-control кнопкой.

Строка эпизода:
- полностью кликабельна (переход на reading/detail);
- структура: номерной блок + вертикальный текстовый блок;
- внутри текстового блока используются `title_ru`, участники, summary, серия и время чтения;
- нижняя линия: default `divider`, на hover плавно в `accent`;
- визуально ощущается частью той же системы, что и каталог персонажей, но различается силуэтом и акцентом на номер/редакционную подачу.

### `/characters`
Текущий состав:
1. `CharacterFactOfDaySection`.
2. `SectionBreak` (`stars`).
3. Каталог: `поиск + фильтры`.
4. Список строк персонажей.

Контейнер и ритм:
- каталог живёт в `width-medium`.
- разрыв между controls и списком: `--space-lg`.
- UI пагинации нет; загружается до 100 записей.
- список живёт в нормальном потоке страницы, без внутреннего `overflow-y`.

Фильтры v1:
- `Страна`, `Принадлежность`, `Сортировка`, `Сбросить`.
- Surface: inline collapsible drawer под поиском; на mobile сетка фильтров схлопывается в одну колонку.

Строка персонажа:
- полностью кликабельна (переход на detail),
- структура: `Avatar(md)` + вертикальный блок + chevron,
- inset `--space-md`, gap `--space-md`, внутри текстового блока `--space-sm`,
- нижняя линия: default `divider`, на hover плавно в `accent`.
- при отсутствии страны/принадлежности используется нейтральный fallback без ломки ритма.

### `/atlas`
Текущий состав:
1. Optional feature-блок с редакционным входом в атлас.
2. `SectionBreak` (`line`) между feature и каталогом.
3. Каталог: `поиск + кнопка фильтров`.
4. Applied filters bar с `Сбросить всё`.
5. Toolbar `Режим обзора` с переключением режима list/section.
6. Inline collapsible drawer с фильтрами.
7. Результаты каталога в list-режиме или grouped-режиме.

Контейнер и ритм:
- каталог живёт в `width-medium`;
- иерархия строится воздухом, типографикой и underline-системой;
- редакционные блоки могут использовать карточную/медийную подачу, но list-строки остаются частью общей системы каталога.

Поведение и визуальный контракт:
- `/atlas` является единым world index, а не каталогом только `atlas_entries`;
- все видимые сигналы в строке обязаны иметь фильтрационный паритет (`type/country/location/section`);
- строки полностью кликабельны и подаются как editorial-узлы:
  - заголовок,
  - контекст (`тип / секции / страна / локация`),
  - summary,
  - число связей.

### `/characters/:slug`
Текущий состав:
1. Hero профиля: аватар + имя (`h1`) + флаг страны рядом с именем.
2. `SectionBreak` (`line`) сразу после hero.
3. Ниже hero — горизонтальная прокручиваемая лента параметров (conveyor-паттерн главной) без разделителей.
4. Отдельная центрированная секция tagline: текст второстепенного тона `36%` (tone-tertiary) в размере `h2`, с типографскими кавычками, без подписи секции.
5. Под tagline ставится второй `SectionBreak` (`line`) для нижнего разделения.
6. Контентный блок: биография (reading-подача) + колонка «особые приметы».
7. `SectionBreak` (`stars`) + цитаты «Что говорят другие?» в двухколоночной сетке (desktop) с центрированным заголовком `h1`.
8. `SectionBreak` (`line`) + список глав с участием персонажа.

Контейнер и ритм:
- каркас страницы живёт в `width-wide`, список глав — в `width-medium`;
- вертикальный ритм строится через `--space-lg/--space-xl/--space-2xl`;
- в секциях используются только линии, типографика и воздух; сплошные заливные surface-блоки запрещены.

Поведение и визуальный контракт:
- ссылки на источники слухов и строки глав используют системный `ui-underline-hover`;
- список глав визуально родственен `/episodes`, но имеет отдельный силуэт страницы персонажа;
- биография использует reading-паттерн (`MarkdownContent preset="reading"`), но остаётся в структуре detail-страницы.
- нижний фиксированный флаг (центр, размер `md`, bottom `--space-md`) появляется только когда флаг рядом с именем ушёл из viewport;
- параметры вынесены в отдельный блок ниже hero: conveyor-лента без разделителей; категория показана emoji-сигнатурой слева, значение — справа; в ленту входит и принадлежность;
- слухи оформляются как цитаты; атрибуция строится от аватара источника, без дублирующих текстовых меток вида `Источник:`.

### `/atlas/:slug`
Текущий состав:
1. Типографский hero: название (`h1`), флаг страны и summary.
2. Блок `Описание` с reading-подачей overview.
3. `SectionBreak` (`line`) перед детализированными секциями world-узла.
4. Список секций узла:
   - заголовок и optional summary секции;
   - optional reading-body;
   - optional editorial-цитаты;
   - optional fact-блок.
5. `SectionBreak` (`stars`) перед grouped relations.
6. Отдельная секция `Связи`.

Контейнер и ритм:
- каркас страницы живёт в `width-wide`;
- reading-блоки держат `width-narrow` внутри общего каркаса;
- вертикальный ритм строится через `--space-lg/--space-xl/--space-2xl`;
- в секциях используются только линии, типографика и воздух; сплошные заливные surface-блоки запрещены.

Поведение и визуальный контракт:
- slug-страницы атласа остаются detail-узлом и не копируют силуэт `/characters/:slug`;
- editorial-слой строится через `fact` и `quotes`, без карточных заливок и декоративных рамок;
- связи группируются по типу цели и каждая строка становится кликабельной навигационной единицей;
- основной текст записи рендерится через `MarkdownContent preset="reading"`.

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
- Для иконографических стрелок предпочтителен единый asset `/assets/icons/aeria-arrow.svg`; текстовые символы `<` и `>` допустимы только там, где это отдельно закреплено UX-контрактом.

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
2. `cp .env.example .env`
3. Поднять Postgres одним способом:
   - Docker: `docker compose up -d`
   - Локальный кластер: `npm run db:up` (нужны `initdb`, `pg_ctl`, `createdb` в `PATH`)
4. Если выбран локальный кластер, перенести напечатанный `DATABASE_URL` в `.env` (по умолчанию это порт `55432`)
5. `npm run migrate`
6. `npm run content:dry-run`
7. `npm run content:import`
8. `npm run search:reindex`
9. `npm run dev`
