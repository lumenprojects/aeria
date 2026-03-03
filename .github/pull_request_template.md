## Summary
- What changed:
- Why:

## Validation
- [ ] `npm run verify`
- [ ] `npm run verify:content` (if DB/content code changed)

## Guardrails
- [ ] No direct SQL schema edits outside `packages/db/migrations`
- [ ] No new ad-hoc typography/spacing tokens outside design system
- [ ] Navbar settings persistence (`aeria-theme` cookie) remains intact
- [ ] Server state remains in TanStack Query (no permanent global entity store)
- [ ] Public DTOs do not expose `source_path`, `content_hash`, `archived_at`

## UX Checks (if frontend touched)
- [ ] Navbar height stays stable between modes
- [ ] Inline search works (icon + `Ctrl/Cmd+K`)
- [ ] Episode reading mode shows progress and chapter context
