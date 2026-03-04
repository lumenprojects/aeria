# Aeria Runbook

## Цель
Этот runbook нужен для одного: стабильно запускать backend/content-контур и не допускать «случайно работающего» состояния.

## 1) Подготовка окружения
1. Скопировать переменные окружения:
   - `cp .env.example .env`
2. Выбрать один способ поднять Postgres:
   - Docker: `docker compose up -d`
   - Локальный встроенный кластер (без Docker): `npm run db:up`
3. Убедиться, что `DATABASE_URL` в `.env` указывает на реальную БД.

## 2) Обязательные проверки
- Полный gate проекта:
  - `npm run verify`
- Gate контент-контура:
  - `npm run verify:content`

`verify:content` выполняет:
- preflight env;
- smoke/unit тесты `packages/content`;
- миграции БД;
- dry-run импорта контента.

## 3) Полезные команды
- `npm run db:up` - поднять локальный Postgres в `.local/postgres` (порт `55432` по умолчанию).
- `npm run db:down` - остановить локальный Postgres.
- `npm run db:status` - проверить состояние локального Postgres.
- `npm run db:reset` - удалить локальные данные Postgres и инициализировать заново.
- `npm run migrate` - применить миграции.
- `npm run content:dry-run` - dry-run импорта без записи.
- `npm run content:import` - фактический импорт.
- `npm run test -w packages/content` - unit/smoke тесты content-пакета.
- `npm run test:integration -w packages/content` - интеграционные тесты импортера (опционально, только на тестовой БД).

## 4) Типовые проблемы
- `password authentication failed for user ...`
  - `DATABASE_URL` не совпадает с реальными credentials БД.
  - Проверить `.env`, затем пересоздать БД/кластер.
- `Local run uses DATABASE_URL from process.env without .env`
  - Нет явного `.env`, а используется глобальная переменная shell.
  - Решение: задать `DATABASE_URL` в `.env`.
- `verify:content` падает на миграциях
  - БД не запущена или неверные креды.
  - Проверить `db:status` / `docker compose ps`.

## 5) Правило чистоты
- Никаких ручных правок схемы БД на окружениях.
- Любое изменение структуры данных только через миграции.
- Любое изменение контрактов API фиксировать в `packages/shared` + smoke-тестах API.
