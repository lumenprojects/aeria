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
2. `docker-compose up -d`
3. `cp .env.example .env` and adjust if needed
4. `npm run migrate`
5. `npm run content:import -- --dry-run`
6. `npm run content:import`
7. `npm run dev`

## Content import
- Content lives in `content/`.
- Schema version in `content/schema.json`.
- Import is transactional with dry-run diff, logging, and search queueing.

## Scripts
- `npm run dev` - web + api
- `npm run migrate` - run DB migrations
- `npm run content:import` - import Markdown content
- `npm run search:worker` - process Typesense queue
