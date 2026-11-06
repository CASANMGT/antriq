# AntriQ — Architecture

## 1. Shape

AntriQ is a single Next.js application deployed as one Vercel project, backed by one Postgres database.

```text
┌────────────────┐   ┌────────────────┐   ┌────────────────┐
│  Diner phone   │   │  Host tablet   │   │ Owner laptop   │
└───────┬────────┘   └───────┬────────┘   └───────┬────────┘
        │  HTTPS              │  HTTPS             │  HTTPS
        ▼                     ▼                    ▼
┌───────────────────────────────────────────────────────────┐
│                     Next.js 16 (Vercel)                   │
│                                                           │
│  Server Components            Route handlers              │
│  ─ guest page                 ─ /api/join                 │
│  ─ ticket                     ─ /api/ticket/[token]        │
│  ─ host board (first paint)   ─ /api/host/state|action     │
│  ─ dashboard/reports          ─ /api/owner/*               │
│                                                           │
│  lib/queue.ts (pure rules)   lib/store.ts (SQL + mapping) │
└───────────────────────────────┬───────────────────────────┘
                                │ postgres.js (pooled)
                                ▼
┌───────────────────────────────────────────────────────────┐
│  Postgres 16 (Neon / Supabase / Vercel Postgres / Docker) │
│  restaurant · staff · dining_tables · queue_entries ·     │
│  queue_sequence · activity                                │
└───────────────────────────────────────────────────────────┘
```

There is no separate backend, worker, queue broker, or websocket service. That is deliberate: a single restaurant has a small working set, and operational simplicity is a feature.

## 2. Request lifecycle

### 2.1 First paint (server)

- `/` — `getPublicSnapshot()`: restaurant, waiting count, tables free, typical wait, last called.
- `/t/[token]` — `getTicketView(token)`: entry, position, ETA, hold, restaurant.
- `/host` — `getHostState()`: active queue, tables, recent, stats. Requires staff session.
- `/dashboard` — `getOwnerOverview(7)`: KPIs, hourly, week, activity. Requires owner.
- `/dashboard/reports` — `getOwnerOverview(days)`.
- `/dashboard/*` — tables, staff, settings, QR.

All these pages are `force-dynamic`; there is no stale cached floor.

### 2.2 Live updates (client polling)

| Surface | Endpoint | Interval | Pauses when hidden |
| --- | --- | --- | --- |
| Ticket | `GET /api/ticket/[token]` | 4s | yes |
| Host | `GET /api/host/state` | 4s | yes |
| Owner | `GET /api/owner/overview` | 8s | yes |

Why polling instead of websockets/Pusher:

- No additional vendor, keys, or per-message cost.
- Works on flaky restaurant Wi-Fi and sleeping tablets.
- The payload is small and the read path is one indexed query set.
- Serverless websockets need a separate real-time service; that is complexity we don’t need for one restaurant.
- Roadmap: SSE for sub-second call events when the product needs it; polling remains the fallback.

### 2.3 Writes

All writes are JSON route handlers. Server Actions are used only for login/logout.

```text
client → POST /api/host/action  { type: "seat", entryId, tableId }
       → auth (signed cookie) → store.seatEntry()
       → Postgres transaction:
            lock entry row, lock table row
            validate status + capacity
            update entry → seated
            update table → seated
            insert activity
       → { ok: true, message: "A-014 seated at T4." }
client → refresh host state → UI updates
```

Why route handlers over server actions for writes:

- Explicit request/response contract, easy to test with `fetch`.
- No implicit RSC refresh that can abort a request mid-flight.
- The same API can later serve a native app, a POS webhook, or a kiosk.
- The client controls exactly when to refresh, and can show the returned message.

## 3. Database

### 3.1 Driver

`lib/db.ts` exposes one tiny interface:

```ts
interface Queryable {
  query<T>(text: string, params?: unknown[]): Promise<T[]>;
}
```

Two implementations:

- **Postgres** (`postgres.js`) when `DATABASE_URL` is set. `prepare: false` keeps compatibility with transaction poolers (Supabase/Neon).
- **PGlite** (WASM Postgres) when `DATABASE_URL` is absent, for local experiments and the test suite.

`tx(fn)` is implemented for both so the same store code runs in tests and production.

### 3.2 Initialisation

On the first request per process:

1. Create the driver singleton.
2. Run `SCHEMA_STATEMENTS` (`CREATE TABLE IF NOT EXISTS`, indexes).
3. Seed restaurant/staff/tables when empty.
4. In demo mode, seed a lived-in floor and reset it if no entries exist for today.

For Postgres, steps 2–4 run inside a transaction holding `pg_advisory_xact_lock(918273645)`. Multiple serverless instances can cold-start together without double-seeding or racing table creation.

`readyPromise` is cached per process. If initialisation fails, the promise is cleared so the next request retries.

### 3.3 Time

- The restaurant’s timezone (default `Asia/Jakarta`) determines the service day and ticket code sequence.
- `dayInTz()` uses `Intl.DateTimeFormat` part extraction — no UTC date slicing.
- All timestamps are stored as `timestamptz` (UTC); display conversion happens with `Intl`.
- `queue_sequence` is keyed by `(restaurant_id, day)` so codes reset at local midnight.

### 3.4 Atomic ticket allocation

```sql
insert into queue_sequence (restaurant_id, day, last_seq)
values (1, $1::date, 1)
on conflict (restaurant_id, day)
do update set last_seq = queue_sequence.last_seq + 1
returning last_seq;
```

Code format: `A-%03d` (`A-001`). More than 999 parties in a day widen naturally (`A-1234`).

### 3.5 Table and entry invariants

- Seating locks the entry row and the table row `FOR UPDATE`.
- A table can only be seated from `available` and only for a party that fits.
- Clearing a table completes the latest seated entry and moves the table to `dirty`.
- Deleting a table is blocked while seated; `queue_entries.table_id` is `ON DELETE SET NULL`.
- Daily codes are unique per day through `unique (day, seq)`.

### 3.6 No-show expiry

There is no cron in v1. Every read path calls `expireHolds()`:

```sql
update queue_entries
set status = 'no_show', closed_at = now(), hold_expires_at = null
where status = 'called' and hold_expires_at < now()
returning ...;
```

The conditional update means concurrent readers cannot double-log the same expiry: only the request that performed the transition receives the rows.

## 4. Domain layer

`lib/queue.ts` is pure and exhaustively tested:

- `codeFor`
- `orderWaiting`
- `positionOf`
- `estimateWaitMinutes`
- `selectBestTable`
- `pickNext`
- `statsFrom`
- `averageTurn`
- `buildHourly`
- `noShowRate`

`lib/store.ts` maps rows to camelCase DTOs and composes the domain functions with SQL. Keeping the rules pure means the ETA and fit logic can be reasoned about without a database.

## 5. Auth

- **Staff** select their name and enter a 4–8 digit PIN.
- PINs are salted scrypt hashes (`scrypt:<salt>:<hex>`); verification is constant-time.
- On success the server sets `antriq_session`: base64url(JSON payload) + HMAC-SHA256 signature.
- Cookie is HTTP-only, SameSite=Lax, Secure in production, 12 hours.
- `getSession()` verifies signature + expiry on every server read.
- Login throttle: six failures per staff id per five minutes (in-process, per instance). A distributed limiter is a roadmap item.
- Role guards live in layouts (`/host`, `/dashboard`) and repeated in every API route. UI hiding is never the only guard.

Guest identity is different by design: the ticket token **is** the credential. It is 18 random bytes (144 bits), stored in the URL and optionally in `localStorage`. There is no diner account, password, or PII in the URL.

## 6. Error handling

- `AppError` carries a human message, code and HTTP status.
- `actionError()` converts unknown errors into a safe message and logs the server-side detail.
- API envelope is uniform: `{ ok, message?, data? }`.
- The host board doesn’t hard-fail on a stale ticket; it shows a friendly message and refreshes.
- A missing ticket renders a 404 with a rejoin path.
- A failed database boot renders a readable error page (`app/error.tsx`) and `/api/health` returns 503.

## 7. Security posture

| Area | Decision |
| --- | --- |
| SQL injection | Positional parameters only; identifiers are internal constants |
| XSS | React escaping; no `dangerouslySetInnerHTML`; user text rendered as text |
| CSRF | SameSite=Lax cookies + JSON content-type (CORS preflight) for writes |
| Token guessing | 144-bit random ticket tokens |
| PIN brute force | scrypt + 6-failure throttle + short PIN allowed only for staff |
| Role escalation | Server-side owner guard in every owner API and layout |
| PII | Guest data only via capability token or staff session |
| Secrets | `AUTH_SECRET` and `DATABASE_URL` only in environment |
| Indexing | `robots.txt` disallows app surfaces; ticket metadata is `noindex` |
| Headers | `poweredByHeader: false`; add CSP at the edge as a follow-up |

## 8. Performance

- The host board payload at demo scale is ~25–40 KB.
- Indexes: `queue_entries(status, joined_at)`, `(day)`, `(token)`, `activity(created_at desc)`, `dining_tables(status)`.
- The owner overview reads one rolling window (≤90 days) and aggregates in JS; at one-restaurant scale this is cheaper than ten round trips.
- Demo seed is one-time; cold starts only run `CREATE TABLE IF NOT EXISTS` + count checks.
- The diner page is mostly static markup with one DB snapshot; the ticket polls a single entry.
- Fonts are self-hosted by `next/font` (no render-blocking third-party request after the first build).

## 9. Deployment topology

- **Vercel** (Next.js), one region close to the restaurant.
- **Managed Postgres** with a pooled connection string (Neon/Supabase/Vercel Postgres).
- Environment: `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, optional `DEMO_MODE`.
- First request migrates + seeds; subsequent cold starts are idempotent.
- `/api/health` is the uptime probe.
- A Vercel Cron for hold expiry is not required (lazy expiry), but can be added to reduce read amplification at scale.

## 10. Trade-offs and decisions

### ADR-001 — Single restaurant, not multi-tenant
**Context:** The reference product covers many verticals and merchants.  
**Decision:** One restaurant per deployment/schema.  
**Why:** Faster to reason about, simpler settings, no tenant-filter bugs, and the target customer is an independent restaurant.  
**Cost:** A chain needs one deployment per outlet until v0.3.

### ADR-002 — Table-first, not service-first
**Context:** Reference F&B flows model party size as “services.”  
**Decision:** Keep physical tables with capacity and status, and match parties to tables.  
**Why:** The greeter’s real constraint is a table, not a service code. It enables fit-aware calls, honest ETAs, and table turn metrics.

### ADR-003 — Polling, not websockets
**Context:** “Live” is required, but restaurant Wi-Fi is unreliable.  
**Decision:** 4s/8s polling with visibility pause.  
**Why:** Zero extra infrastructure, resilient, simple to operate.  
**Cost:** Up to 4s latency; acceptable for a waitlist. SSE is on the roadmap.

### ADR-004 — Capability ticket, no diner account
**Context:** Account creation kills join completion.  
**Decision:** `/t/<random>` is the ticket.  
**Why:** 20-second joins, no password reset, no PII database beyond what’s needed.  
**Cost:** Losing the link loses the ticket; staff can still see the name in line.

### ADR-005 — PIN, not email/password for staff
**Context:** Hosts share a tablet and change shifts quickly.  
**Decision:** Name + 4–8 digit PIN.  
**Why:** Fast on a touch screen; no email dependency.  
**Cost:** Weaker than SSO; acceptable for a single-site tool. Owner can reset instantly.

### ADR-006 — Route handlers for writes
**Context:** Server Actions are convenient but opaque and coupled to RSC refresh.  
**Decision:** JSON APIs for all mutations except login/logout.  
**Why:** Predictable client control, testability, and a future native/POS path.  
**Cost:** A little more boilerplate.

### ADR-007 — PGlite for tests, Postgres for production
**Context:** Integration tests should exercise real SQL.  
**Decision:** PGlite (WASM Postgres) in Vitest; `postgres.js` in production.  
**Why:** No Docker requirement for CI tests, same SQL semantics.  
**Cost:** Two drivers behind one interface; occasional Postgres-version differences.

## 11. Failure modes

| Failure | User-visible | Recovery |
| --- | --- | --- |
| DB unreachable | Error page + health 503 | Vercel restarts; DB provider status |
| Cold start | First paint slower | Subsequent requests cached per process |
| Session expired | Redirect to login; API 401 | Sign in again |
| Poll fails | Last known state remains | Next interval retries |
| Action conflicts | “Already handled” toast | Board refresh |
| Hold expires during call | Auto no-show | Guest can rejoin; host can’t un-no-show in v1 |
| Ticket token lost | Link 404 | Guest rejoins; staff sees name in queue |

## 12. Future architecture moves

1. **SSE channel** per restaurant for call events; keep polling as fallback.
2. **Outbox + worker** for WhatsApp/SMS notifications and webhooks.
3. **Reservation table** with `scheduled_at` and grace periods; merge into the same call queue.
4. **Multi-location** via `restaurant_id` scoping and a location switcher (keeps single-restaurant simplicity for the MVP).
5. **Warehouse sink** for analytics once a restaurant exceeds a few hundred parties/day.
