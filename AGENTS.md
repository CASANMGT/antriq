# AntriQ — working notes for agents

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project conventions

- **Product:** multi-brand, multi-branch restaurant queues. Brands own identity/assets; branches own hours, tables, staff and the live queue. Do not add a marketplace or generic queue builder without a product decision.
- **Scope:** platform owner = no brand/branch; brand owner = `brand_id`; branch owner = `brand_id` + `branch_id`; greeter/cashier = fixed `branch_id`. Enforce scope in every page and API.
- **Writes** go through JSON route handlers (`app/api/*`), not client-side DB access. Server Actions are only for login/logout.
- **Queue rules** live in `lib/queue.ts` and must stay pure. Add tests for any rule change.
- **SQL** is positional and lives in `lib/store.ts`; schema changes go in `lib/schema.ts` and must be idempotent.
- **Time** must use the restaurant timezone (`lib/time.ts`), never `new Date().toISOString().slice(0, 10)`.
- **Guest identity** is the ticket token. Never add a guest account requirement.
- **Design** is warm editorial: Fraunces display, DM Sans UI, paper/clay/sage tokens in `app/globals.css`. Avoid generic SaaS purple gradients.
- **Accessibility** is not optional: labels, focus states, `aria-live` for tickets/notices, reduced motion.
- **Before finishing:** `npm run lint && npm test && npm run build`.

## Local setup

- `docker compose up -d db` (Postgres on 5433)
- copy `.env.example` to `.env.local`
- `npm run dev`
- Demo: platform owner Rani / 1234, greeter Ayu / 1234, cashier Sari / 1234. All demo staff use PIN `1234` for now. Branches: `/b/nikumaru/blok-m`, `/b/nikumaru/tebet`, `/b/tenka/aeon-tanjung-barat`, `/b/tenka/bintaro-xchange`, `/b/tenka/kamaja`.

## Key files

| File | Why |
| --- | --- |
| `lib/queue.ts` | Pure queue/ETA/table rules |
| `lib/store.ts` | SQL + DTO mapping + domain composition |
| `lib/scope.ts` | Owner branch resolution |
| `lib/db.ts` | Postgres/PGlite adapter and init lock |
| `lib/schema.ts` | Idempotent DDL (brands → branches) |
| `lib/seed.ts` | Demo brands, branches + lived-in floor |
| `app/api/host/action/route.ts` | Every greeter/cashier mutation |
| `app/api/owner/action/route.ts` | Every owner mutation + brand/branch/staff CRUD |
| `scripts/reset-db.mjs` | One-time v0.2 → v0.3 schema reset |
| `docs/PRD.md` | Requirements, metrics, edge cases |
| `docs/ARCHITECTURE.md` | Decisions and trade-offs |
