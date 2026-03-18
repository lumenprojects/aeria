# Aeria Runbook

Runbook для стабильного запуска backend/content контура без "случайно работающих" состояний.

## 1) Подготовка окружения
1. `cp .env.example .env`
2. Поднять Postgres одним способом:
- Docker: `docker compose up -d`
- Локальный кластер: `npm run db:up` (нужны `initdb`, `pg_ctl`, `createdb` в `PATH`)
3. Если выбран локальный кластер, перенести напечатанный `DATABASE_URL` в `.env` (по умолчанию это порт `55432`).
4. Проверить `DATABASE_URL` в `.env`.

## 2) Обязательные проверки
- `npm run verify`
- `npm run verify:content`

`verify:content` включает:
- preflight env,
- тесты `packages/content`,
- миграции,
- dry-run импорта.

## 3) Основные команды
- `npm run db:up` — поднять локальный Postgres (`.local/postgres`, порт `55432` по умолчанию; требует локальные PostgreSQL binaries в `PATH`).
- `npm run db:down` — остановить локальный Postgres.
- `npm run db:status` — статус локального Postgres.
- `npm run db:reset` — сброс локальной БД.
- `npm run migrate` — применить миграции.
- `npm run content:dry-run` — проверить импорт без записи.
- `npm run content:import` — выполнить импорт.
- `npm run search:worker` — запустить воркер индексации.
- `npm run test -w packages/content` — unit/smoke content.
- `npm run test:integration -w packages/content` — интеграционные тесты (тестовая БД).

## 4) Типовые проблемы
`password authentication failed`
- Неверные креды в `DATABASE_URL`.
- Проверить `.env`; при необходимости пересоздать локальный кластер.

`Local run uses DATABASE_URL from process.env without .env`
- Используется глобальная переменная shell без локального `.env`.
- Решение: явно заполнить `.env`.

`verify:content` падает на миграциях
- БД не запущена или `DATABASE_URL` указывает не туда.
- Проверить `npm run db:status` или `docker compose ps`.

`npm run db:up` падает сразу
- В `PATH` нет `initdb`, `pg_ctl` или `createdb`.
- Решение: установить локальные PostgreSQL binaries или использовать Docker flow.

## 5) Правила чистоты
- Схема БД меняется только миграциями.
- API-контракты меняются через `packages/shared` + smoke.
- Изменения процесса импорта фиксируются в `docs/Guide.md` и при необходимости в этом Runbook.
