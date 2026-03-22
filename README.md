# Aeria

Monorepo for the Aeria site.

## Stack
- Web: React + Vite + TypeScript + React Router + Framer Motion
- API: Fastify + TypeScript + Zod + pg
- DB: PostgreSQL + node-pg-migrate
- Search: Typesense
- Content: Markdown with YAML frontmatter

## Quick start
1. `npm install`
2. `cp .env.example .env`
3. Choose one database flow:
   - Docker: `docker compose up -d`
   - Local cluster: `npm run db:up` (requires `initdb`, `pg_ctl`, `createdb` in `PATH`)
4. If you used `npm run db:up`, replace `DATABASE_URL` in `.env` with the URL printed by the script
5. `npm run migrate`
6. `npm run content:dry-run`
7. `npm run content:import`
8. `npm run search:reindex`
9. `npm run dev`

## Content import
- Content lives in `content/`.
- Schema version in `content/schema.json`.
- Import is transactional with dry-run diff, logging, and search queueing.

## Scripts
- `npm run dev` - web + api
- `npm run migrate` - run DB migrations
- `npm run content:import` - import Markdown content
- `npm run search:reindex` - rebuild Typesense index from current DB state
- `npm run search:worker` - process queued Typesense updates once
- `npm run search:watch` - keep processing the search queue in watch mode
