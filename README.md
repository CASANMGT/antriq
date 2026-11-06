<div align="center">

# AntriQ

**Fewer waits. Better tables.**

A calm restaurant waitlist and table-flow app for one restaurant — built for the guest at the door, the greeter on the floor, and the owner watching the room.

[PRD](docs/PRD.md) · [Architecture](docs/ARCHITECTURE.md) · [Reverse engineering](docs/REVERSE_ENGINEERING.md) · [Roadmap](ROADMAP.md) · [Changelog](CHANGELOG.md)

</div>

---

## What it is

AntriQ is a single-restaurant queue system with three surfaces:

| Surface | Who | What they can do |
| --- | --- | --- |
| **Guest page** | Diner, no account | See the live wait, join the waitlist, get a ticket with position + honest ETA, get called, confirm “I’m on my way”, cancel |
| **Host stand** | Greeter or owner (PIN) | Work the line, call the next fitting party, seat at the best table, extend holds, no-show, add walk-ins, clear/reset/block tables, pause the waitlist |
| **Owner dashboard** | Owner (PIN) | Live KPIs, hourly service pulse, floor map, queue, activity feed, 7/30/90-day reports, CSV export, table + team management, settings, printable QR poster |

Everything is live — the guest ticket checks every 4 seconds, the host board every 4, the owner dashboard every 8.

![Guest page](docs/screenshots/01-guest-desktop.jpg)
![Owner dashboard](docs/screenshots/02-dashboard.jpg)

| Host stand | Live guest ticket |
| --- | --- |
| ![Host stand](docs/screenshots/03-host-stand.jpg) | ![Live ticket](docs/screenshots/08-ticket-called.jpg) |

## Demo access

The demo seed creates **Sage & Ember**, a fictional bistro in Senopati, with 14 tables and a lived-in Friday service.

| Role | Name | PIN |
| --- | --- | --- |
| Owner | Rani Wijaya | `2468` |
| Greeter | Ayu Lestari | `1357` |
| Greeter | Bima Pratama | `1122` |

Login at `/login`. With `DEMO_MODE=1`, the login page also shows one-click demo shortcuts.

> Demo data is intentionally fictional. Remove `DEMO_MODE` for a real restaurant and the queue starts empty.

## Features

### Guest
- Live “now serving” number, parties waiting, tables free, and typical wait.
- Join with party size, name, optional phone, optional note.
- Ticket with a human code (`A-014`), queue position, people ahead, ETA.
- Called state with a **hold countdown ring**, “I’m on my way” (+3 min), directions, release.
- Final states: seated (table label), completed, no-show, cancelled.
- Capability URL + local ticket memory (`localStorage`) so guests don’t need an account.
- Mobile-first, installable (web app manifest), reduced-motion aware.

### Greeter
- PIN login, 12-hour signed session.
- Three-column board: **Waitlist**, **At the door**, **Floor** — tabs on phones.
- **Smart call next**: skips parties no free table can seat, suggests the smallest fitting table.
- **Seat** from waiting or called, with capacity validation.
- Hold timer, extend +5, no-show with confirmation, undo call.
- Walk-in form, search, pause / close / reopen the waitlist with a reason.
- Table lifecycle: available → seated → dirty → available, plus blocked.
- Optional call chime, keyboard shortcuts (`N` call next, `W` walk-in, `P` pause).
- Live stats: waiting, at door, seated, tables free, avg wait, longest wait.

### Owner
- Live KPI cards: waiting, average wait, seated today, no-show rate.
- Hourly **service pulse** (joined vs seated), peak hour, joined / seated / walk-ins.
- Floor map grouped by zone with status legend.
- Live queue preview and a readable activity feed.
- 7/30/90-day reports, daily table, insights, CSV export.
- Tables CRUD with capacity + zone, safe against shrinking a seated table.
- Team management: add owner/greeter, reset PIN, pause access, never lock out the last owner.
- Settings: identity, accent, timezone, hours, hold window, average turn, party cap, queue cap, auto no-show, announcement.
- QR poster: print-ready A4, copy link, download QR.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js 16** App Router + React 19 | Server rendering, route handlers, one deploy on Vercel |
| Styling | **Tailwind CSS 4** + custom design tokens | Fast, consistent, no heavy component library |
| Database | **Postgres** (`postgres.js`) | Real persistence on serverless; works with Neon, Supabase, Vercel Postgres |
| Dev/test DB | **PGlite** (WASM Postgres) | Zero-config integration tests that run the same SQL |
| Auth | Signed HTTP-only cookie + **scrypt** PINs | No account system to maintain; staff-only |
| Icons | lucide-react | Small, consistent |
| QR | `qrcode` | Server-rendered poster |
| Tests | Vitest | Domain + integration coverage |

### Architecture

```text
Diner phone ─┐
Host tablet ─┼─► Next.js on Vercel ──► Postgres
Owner laptop ┘      │
                    ├─ Server Components: first paint + metadata
                    ├─ Route handlers /api/*: JSON writes + polling reads
                    └─ lib/queue.ts: pure queue rules (tested in isolation)
```

The write path is JSON route handlers, never client-side DB access. Reads are server-rendered first, then poll a small, no-store JSON endpoint. This keeps the board honest on flaky restaurant Wi-Fi and avoids websocket infrastructure. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

### Queue rules in one minute

1. **Ordering** — waiting parties are FIFO by `joined_at`.
2. **Call next** — walk the line in order and pick the first party an **available table can physically seat**; suggest the smallest such table. A host can override while a table is being bussed.
3. **ETA** — `perParty = clamp(avgTurn / tableCount, 4, 20)`; free tables collapse the first seating cycle. The guest sees a floor estimate, not a fake promise.
4. **Hold** — calling starts a `hold_minutes` timer (default 8). “I’m on my way” extends once by 3 minutes. Expired holds become no-shows lazily on the next read.
5. **Turn** — clear a seated table → visit completed, table dirty; mark ready → available.
6. **Fairness** — cancelled and no-show tickets release their place; a greeter can undo a call to return a guest to the line.

## Quick start

**Requirements:** Node 20.9+ and Docker (for the local database).

```bash
git clone <your-repo-url> antriq
cd antriq
npm install

# 1. Start Postgres
docker compose up -d db

# 2. Configure
cp .env.example .env.local
# then edit AUTH_SECRET (the rest works as-is)

# 3. Run
npm run dev
```

Open:

- Guest page — http://localhost:3000
- Staff login — http://localhost:3000/login
- Owner dashboard — http://localhost:3000/dashboard
- Health check — http://localhost:3000/api/health

The schema is created and seeded automatically on the first request. `docker compose down -v` resets the database.

### Useful scripts

```bash
npm run dev       # Next dev server
npm run build     # Production build
npm start         # Production server
npm run lint      # ESLint (Next 16 + React 19 rules)
npm test          # 21 domain + integration tests
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. Create a free Postgres database — **Neon**, **Supabase**, or **Vercel Postgres**. Copy the pooled connection string.
3. Import the repo in Vercel and set:

| Variable | Example | Notes |
| --- | --- | --- |
| `DATABASE_URL` | `postgres://…` | **Required.** Pooled connection string. |
| `AUTH_SECRET` | 32+ random chars | Required in production. |
| `NEXT_PUBLIC_APP_URL` | `https://antriq.vercel.app` | Used in metadata + QR poster. |
| `DEMO_MODE` | `1` | Optional; seeds the demo floor. Omit for real use. |

4. Deploy. The first request runs idempotent schema creation and seeding (guarded by a Postgres advisory lock).

```bash
# or from the CLI
vercel --prod
```

> The app also has a PGlite fallback for local experiments, but production **must** use `DATABASE_URL`; serverless instances do not share `/tmp`.

## API

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | public | Liveness + DB check |
| `POST` | `/api/join` | public (rate-limited) | Join the waitlist |
| `GET` | `/api/ticket/[token]` | capability token | Live ticket |
| `POST` | `/api/ticket/[token]/action` | capability token | `cancel` / `acknowledge` |
| `GET` | `/api/host/state` | staff | Full host board snapshot |
| `POST` | `/api/host/action` | staff | `callNext`, `callEntry`, `seat`, `noShow`, `undoCall`, `extend`, `walkin`, `clearTable`, `tableStatus`, `waitlist` |
| `GET` | `/api/owner/overview?days=7` | owner | KPIs, chart, activity, floor |
| `POST` | `/api/owner/action` | owner | `settings`, `waitlist`, `table*`, `staff*` |
| `GET` | `/api/owner/export?days=30` | owner | CSV download |

All writes are validated, parameterised, and return the same `{ ok, message, data }` envelope.

## Data model

```text
restaurant (1)
  ├─ staff (owner | greeter, scrypt pin_hash)
  ├─ dining_tables (capacity, zone, status)
  ├─ queue_entries (token, code, day+seq, party, status, hold, table)
  ├─ queue_sequence (per-day atomic ticket counter)
  └─ activity (audit feed, jsonb detail)
```

Full schema: [`lib/schema.ts`](lib/schema.ts). See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for state machines and invariants.

## Security & privacy

- Diner tickets are **capability URLs** (`/t/<22-char random>`), not guessable ids.
- Staff sessions are HMAC-signed, HTTP-only, SameSite=Lax, 12-hour cookies.
- PINs are salted **scrypt** hashes; never logged or returned.
- Owner-only routes are guarded on the server for both reads and writes.
- Login and join endpoints have small in-process rate limits.
- SQL uses positional parameters throughout; inputs are length- and enum-validated.
- No third-party analytics or tracking scripts.
- Guest names/phones are visible only to staff and the holder of that ticket link.
- `robots.txt` disallows `/host`, `/dashboard`, `/t/`, and `/api/`.

## Tests

```bash
npm test
```

- **Pure domain**: ticket codes, FIFO, best-fit table, smart call next, ETA clamps, stats, hourly buckets, turn fallback.
- **Integration on PGlite**: seeded service, PIN verification, join → ticket → cancel, call next, seat, capacity refusal, no-show, undo, hold expiry, pause + walk-in, owner metrics, CSV.

See [docs/QA.md](docs/QA.md) for the manual release checklist.

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
lib/
  queue.ts                 Pure domain rules
  store.ts                 Queries + mutations
  db.ts                    Postgres / PGlite adapter
  schema.ts                Idempotent SQL schema
  seed.ts                  Demo restaurant
  auth.ts                  Sessions + throttling
tests/                     Vitest suites
docs/                      PRD, architecture, reverse engineering, QA
```

## Why “AntriQ”?

“Antri” is Indonesian for *queue*. AntriQ is the queue, answered.

## License

MIT — see [LICENSE](LICENSE).
