# Aeria Roadmap

Документ отражает ближайшие этапы после стабилизации базового контура.

## Статус на 17 марта 2026
Фундамент закрыт:
- `verify` и `verify:content` зелёные.
- API контракты валидируются Zod-схемами.
- Smoke покрывают ключевые list/detail/search сценарии.
- CI содержит обязательные проверки.

## Что уже зафиксировано в продукте
- Navbar с inline-глобальным поиском.
- Главная на `/api/home`.
- Страница `/characters` пересобрана:
  - `Факт дня` -> `SectionBreak(stars)` -> `поиск+фильтры` -> список.
  - серверный поиск/фильтры с URL-sync.
  - единая underline-система (`ui-underline-*`).
- `/api/characters` расширен параметрами `q/country/affiliation/sort` и item shape.
- Atlas production pass закрыт:
  - `/atlas` стал unified world index для `country/location/atlas_entry`;
  - добавлен `/api/atlas/catalog` с facets и редакционными фильтрами;
  - `/atlas/:slug` получил fact strip, outline, editorial-слой (`fact/quotes`) и grouped clickable relations;
  - legacy atlas list и сырые detail-links удалены из публичного контракта.

## Приоритеты v1 (следующие)
1. Episodes reading polish
- Дополнить сценарии чтения эпизода (progress, breadcrumbs, deep-link).
- Проверить регрессии типографики и motion на длинных текстах.

2. Search quality
- Улучшить релевантность глобального поиска (веса/синонимы/опечатки).
- Зафиксировать метрики качества выдачи для smoke/e2e.

3. Catalog e2e pass
- Добавить e2e-сценарии для `/characters` и `/atlas`:
  - поиск,
  - фильтры,
  - URL-sync,
  - reset/apply-filters.
- Проверить устойчивость list-поверхностей без UI-пагинации при 100 записях.

## Инженерные рельсы (не нарушать)
- Изменения БД только миграциями.
- Изменения API-контрактов только через `packages/shared` и тесты в том же PR.
- Любая визуальная правка: код + docs в одном изменении.
- Перед merge: минимум `npm run verify`; для контентного контура дополнительно `npm run verify:content`.
