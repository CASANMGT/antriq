<div align="center">

# AntriQ

**Antrean restoran, lebih praktis.**  
*Makan enak. Nunggu santai.*

A bold, warm restaurant queue for guests, hosts and owners — built for **Nikumaru & Tenka**.

[Live demo](https://antriq1.vercel.app) · [GitHub](https://github.com/CASANMGT/antriq) · [PRD](docs/PRD.md) · [Architecture](docs/ARCHITECTURE.md) · [Reverse engineering](docs/REVERSE_ENGINEERING.md) · [Roadmap](ROADMAP.md) · [Changelog](CHANGELOG.md)

</div>

---

## What it is

AntriQ is a single-restaurant queue system with three connected surfaces:

| Surface | Who | What they can do |
| --- | --- | --- |
| **Guest** | Diner, no account | See the live queue, take a number, watch position and now-serving, get called, walk to the table |
| **Host stand** | Greeter or owner (PIN) | Work the line, call the next fitting party, seat, mark no-shows, add walk-ins, manage tables, pause the queue |
| **Owner dashboard** | Owner (PIN) | Live queue counts, service pulse, floor map, activity, reports, CSV, tables, team, settings, QR poster |

**Queue-first by design:** guests see a queue number, position, parties ahead and the code being called. There are **no wait-time estimates and no hold countdowns** in the interface. The operational hold still exists behind the scenes for auto no-show, but it is not a guest-facing promise.

**Bahasa Indonesia is the default; English is one tap away.** The language toggle stores a cookie and refreshes both server and client surfaces.

![Guest page](docs/screenshots/01-guest-desktop.jpg)
![Owner dashboard](docs/screenshots/02-dashboard.jpg)

| Host stand | Live guest ticket |
| --- | --- |
| ![Host stand](docs/screenshots/03-host-stand.jpg) | ![Live ticket](docs/screenshots/08-ticket-called.jpg) |

## Demo access — Nikumaru & Tenka

A fictional **ramen & izakaya** house in Senopati, with 14 tables and a lived-in service floor.

| Role | Name | PIN |
| --- | --- | --- |
| Owner | Rani Wijaya | `2468` |
| Greeter | Ayu Lestari | `1357` |
| Greeter | Bima Pratama | `1122` |

Open `/login`. With `DEMO_MODE=1`, the login page also shows one-click demo shortcuts.

> The demo resets its floor on the first request of each new day, even on a warm serverless instance. Remove `DEMO_MODE` for a real restaurant and the queue starts empty.

## Brand system

The UI is built from the uploaded AntriQ brand direction:

| Token | Value | Use |
| --- | --- | --- |
| Tomato Red | `#F24B3F` | Primary actions, called state, highlights |
| Butter | `#FFF1CA` | Surfaces, queue stats, poster headline |
| Ink | `#262321` | Text, 2px outlines, offset shadows |
| Soft Pink | `#FFD6DF` | Waiting/warm states, secondary cards |
| Leaf | `#2E7D4F` | Seated/ready/success |
| Display | **Fredoka** | Headlines, numbers, the wordmark |
| UI | **Plus Jakarta Sans** | Body, controls, tables |

Chunky 2px outlines, sticker shadows, red brush accents, the toast mascot, and warm paper backgrounds carry across the guest app, ticket, host stand, owner dashboard, login and printable QR poster.

## Features

### Guest
- Live queue snapshot: parties waiting, tables open, now serving, restaurant status.
- Take a number in about 20 seconds: party size, name, optional phone/note.
- Ticket with a human code (`A-024`), queue position, parties ahead, now-serving code.
- Called state: **“Meja siap!”** with “Saya menuju host”, directions and release.
- Seated, completed, no-show and cancelled end states.
- Capability URL + local ticket memory; no account.
- Mobile-first, installable, reduced-motion aware, Indonesian/English.

### Greeter
- PIN login, 12-hour signed session.
- Three-column board: **Antrean / Dipanggil / Lantai** — tabs on phones.
- Queue positions on every card, not waiting-time guesses.
- **Panggil berikutnya** selects the first party a free table can physically seat; suggests the smallest fitting table.
- Seat from waiting or called, with hard capacity validation.
- No-show with confirmation, undo call, walk-in add, search.
- Table lifecycle: seated → dirty → ready, plus blocked.
- Pause / close / reopen queue, optional call chime, shortcuts (`N`, `W`, `P`).
- Live stats: waiting, called, seated, tables open, seated today, no-shows.

### Owner
- Queue-focused KPIs: waiting, called, seated today, tables open.
- Hourly service pulse (joined vs seated), floor map by zone, live queue, activity feed.
- 7/30/90-day reports: joined, seated, attendance, no-shows, cancellations, CSV.
- Tables CRUD with capacity/zone and seated-table protection.
- Team management: add owner/greeter, reset PIN, pause access, last-owner protection.
- Settings: identity, accent, timezone, hours, max party, queue cap, auto no-show, announcement.
- Printable A4 QR poster with mascot and queue-first copy.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | **Next.js 16** App Router + React 19 |
| Styling | **Tailwind CSS 4** + custom brand tokens |
| Type | **Fredoka** + **Plus Jakarta Sans** via `next/font` |
| Database | **Postgres** (`postgres.js`); **PGlite** for tests |
| Auth | Signed HTTP-only cookie + scrypt staff PINs |
| Icons | lucide-react |
| QR | `qrcode` |
| Tests | Vitest (domain + PGlite integration) |

```text
Guest phone ─┐
Host tablet ─┼─► Next.js on Vercel ──► Postgres (Neon)
Owner laptop ┘      │
                    ├─ Server Components: first paint + metadata
                    ├─ Route handlers /api/*: JSON reads/writes
                    └─ lib/queue.ts: pure queue rules
```

Writes go through JSON route handlers; reads are server-rendered then polled (4s guest/host, 8s owner). No websocket vendor, no client-side database access. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Quick start

**Requirements:** Node 20.9+ and Docker.

```bash
git clone https://github.com/CASANMGT/antriq.git
cd antriq
npm install

docker compose up -d db
cp .env.example .env.local
# edit AUTH_SECRET (everything else works for local demo)

npm run dev
```

Open:

- Guest — http://localhost:3000
- Staff login — http://localhost:3000/login
- Owner — http://localhost:3000/dashboard
- Health — http://localhost:3000/api/health

The schema is created and seeded automatically on the first request. `docker compose down -v` resets the database.

```bash
npm run dev       # development
npm run build     # production build
npm start         # production server
npm run lint      # ESLint (Next 16 + React 19 rules)
npm test          # 21 domain + integration tests
```

## Deploy to Vercel

The current production deployment is **https://antriq1.vercel.app** (Vercel project `antriq1`), backed by a free **Neon Postgres** database in Singapore.

1. Push the repo to GitHub.
2. Create Postgres (Neon / Supabase / Vercel Postgres) and copy the pooled connection string.
3. Import the repo in Vercel and set:

| Variable | Example | Notes |
| --- | --- | --- |
| `DATABASE_URL` | `postgres://…` | **Required.** Pooled URL. |
| `AUTH_SECRET` | 32+ random chars | Required in production. |
| `NEXT_PUBLIC_APP_URL` | `https://antriq1.vercel.app` | Metadata + QR poster. |
| `DEMO_MODE` | `1` | Optional; seeds the demo floor. Omit for real use. |

4. Deploy. The first request runs idempotent schema creation and seeding under a Postgres advisory lock.

> The app also has a PGlite fallback for local experiments, but production **must** use `DATABASE_URL`; serverless instances do not share `/tmp`.

### CI

The initial GitHub token lacked the `workflow` scope, so the CI definition lives at [`docs/ci-example.yml`](docs/ci-example.yml). Copy it to `.github/workflows/ci.yml` when available; it runs lint, tests and a production build.

## API

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | public | Liveness + DB check |
| `POST` | `/api/join` | public (rate-limited) | Take a queue number |
| `GET` | `/api/ticket/[token]` | capability token | Live ticket |
| `POST` | `/api/ticket/[token]/action` | capability token | `cancel` / `acknowledge` |
| `GET` | `/api/host/state` | staff | Full host board snapshot |
| `POST` | `/api/host/action` | staff | `callNext`, `callEntry`, `seat`, `noShow`, `undoCall`, `walkin`, `clearTable`, `tableStatus`, `waitlist` |
| `GET` | `/api/owner/overview?days=7` | owner | Queue counts, chart, activity, floor |
| `POST` | `/api/owner/action` | owner | `settings`, `waitlist`, `table*`, `staff*` |
| `GET` | `/api/owner/export?days=30` | owner | CSV download |

All writes are validated, parameterised, and return `{ ok, message, data }`.

## Data model

```text
restaurant (1)
  ├─ staff (owner | greeter, scrypt pin_hash)
  ├─ dining_tables (capacity, zone, status)
  ├─ queue_entries (token, code, day+seq, party, status, table, hold_expires_at)
  ├─ queue_sequence (per-day atomic ticket counter)
  └─ activity (audit feed, jsonb detail)
```

Full DDL: [`lib/schema.ts`](lib/schema.ts). State machines and invariants: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Security & privacy

- Diner tickets are **capability URLs** (`/t/<22-char random>`).
- Staff sessions: HMAC-signed, HTTP-only, SameSite=Lax, 12h.
- PINs: salted **scrypt** hashes; never logged or returned.
- Owner guards on every owner page and API.
- Rate limits on joins, ticket actions and login attempts.
- Positional SQL only; input length/enum validation.
- No third-party analytics or tracking scripts.
- Guest names/phones visible only to staff and the ticket holder.
- `robots.txt` disallows `/host`, `/dashboard`, `/t/`, `/api/`.

## Tests

```bash
npm test
```

- **Domain:** ticket codes, FIFO, best-fit table, smart call, ETA engine (internal), stats, hourly buckets, turn fallback.
- **Integration on PGlite:** seed, PIN verification, join → ticket → cancel, call next, seat, capacity refusal, no-show, undo, hold expiry, pause + walk-in, owner metrics, CSV.

See [docs/QA.md](docs/QA.md) for the release checklist.

## Project layout

```text
app/
  page.tsx                 Guest landing + join
  t/[token]/               Live ticket
  login/                   Staff PIN login
  host/                    Greeter board
  dashboard/               Owner: overview, reports, tables, team, settings, QR
  api/                     JSON reads/writes
components/
  diner/ host/ owner/ ticket/ login/   Surface components
  Logo, Mascot, LanguageToggle, ...
lib/
  queue.ts                 Pure domain rules
  store.ts                 Queries + mutations
  db.ts                    Postgres / PGlite adapter
  schema.ts                Idempotent SQL schema
  seed.ts                  Demo restaurant
  i18n.ts                  Indonesian + English dictionary
  auth.ts                  Sessions + throttling
  labels.ts                Zone labels
tests/                     Vitest suites
docs/                      PRD, architecture, reverse engineering, QA
```

## Why “AntriQ”?

“Antri” is Indonesian for *queue*. AntriQ is the queue, answered.

## License

MIT — see [LICENSE](LICENSE).
