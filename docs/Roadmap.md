# Aeria Roadmap (до старта плотной разработки страниц)

## Текущий статус
Этап фундаментной стабилизации закрыт на `2026-03-04`:
1. `npm run verify` — зелёный.
2. `npm run verify:content` — зелёный.
3. Dry-run импорта проходит без ошибок ссылок.
4. API input/output контракты валидируются Zod.
5. Smoke-тесты покрывают list/detail/search сценарии API.
6. CI содержит обязательные job `verify`, `content-dry-run`, `content-integration`.

## Что считалось “закрытием этапа”

### Этап 1. Стабильный content-контур (закрыт)
- Env preflight для content-контура.
- Единый `verify:content`.
- Runbook с однозначным порядком запуска.
- Unit/smoke тесты критичной логики импортера.
- Интеграционный сценарий импортера (opt-in) + отдельная CI job.
- Локальный Postgres fallback (`npm run db:up`) для запуска без Docker.

### Этап 2. Контракты API (закрыт)
- DTO/Query/Response схемы в `packages/shared`.
- Валидация входа/выхода в API роутерах через Zod.
- Smoke-тесты контрактов:
  - invalid query -> 400;
  - list payload shape;
  - detail payload shape (`episodes/:slug`, `characters/:slug`, `atlas/:slug`);
  - not-found -> 404;
  - search backend unavailable -> 503.

### Этап 3. CI дисциплина (закрыт на уровне кода)
- В CI закреплены `verify`, `content-dry-run`, `content-integration`.
- Остался один ручной репозиторный шаг: включить branch protection в GitHub (настройка репо, не код).

## Что дальше (уже про практическую разработку страниц)
Дальше можно переходить к UI-страницам, сохраняя порядок:
1. `/episodes`, `/episodes/:slug`
2. `/characters`, `/characters/:slug`
3. `/atlas`, `/atlas/:slug`

Порядок внутри каждой страницы:
1. Данные и состояния (`loading/error/empty`) на TanStack Query.
2. Вёрстка по дизайн-системе (`Typography`, palette, spacing, width rules: `narrow / medium / wide`).
3. A11y + smoke-тест страницы.

## Рельсы, чтобы не скатиться в хаос
- Любое изменение БД только миграцией.
- Любое изменение API-контракта только через `packages/shared` + тест в том же PR.
- Любое новое поведение импортера фиксировать тестом + записью в `docs/Runbook.md`/`docs/Guide.md`.
- Перед merge в `main` всегда `npm run verify && npm run verify:content`.
