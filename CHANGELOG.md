# Changelog

All notable changes to AntriQ are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Planned
- Reservation / booking date flow.
- WhatsApp notification adapter.
- SSE for call events (polling remains a fallback).
- Indonesian localization.

## [0.1.0] — 2026-11-06

First public MVP. One restaurant, three roles, a real database and a demo floor.

### Deployed
- Production: **https://antriq-s8vk.vercel.app** (Vercel + Neon Postgres, Singapore).
- Source: **https://github.com/CASANMGT/antriq**.
- Health probe verified: `GET /api/health` returns `200 {"ok":true}`.

### Added

**Guest**
- Public restaurant page with live wait signals: parties waiting, tables free, typical wait, now-serving, hours, address, phone, Instagram and announcement.
- Join form with party-size stepper, name, optional phone and note.
- Daily human ticket codes (`A-001`), 144-bit capability URLs, local ticket memory.
- Live ticket with queue position, people ahead, fit-aware ETA, now-serving, tables free, hold policy.
- Called state with hold countdown ring, “I’m on my way” (+3 min, once), directions and release.
- Seated, completed, no-show and cancelled end states with rejoin paths.
- Cancellation with a confirmation dialog and released place.
- Web app manifest, mobile-first layout, reduced-motion support.

**Host stand**
- PIN login with scrypt hashes and 12-hour signed sessions.
- Live three-column board: Waitlist, At the door, Floor; tabs on phones.
- Smart **Call next** that only selects parties a free table can seat, with best-fit suggestion.
- **Call anyway** override while tables are bussed.
- Seat from waiting or called, with strict capacity validation and a best-fit table picker.
- Hold timer, +5 min extension, no-show confirmation, undo call.
- Walk-in form that works while the waitlist is paused.
- Search by name, code or phone.
- Table lifecycle: clear (complete + dirty), ready (available), block/unblock.
- Waitlist open / paused / closed with a reason, logged in the activity feed.
- Live stats: waiting, at door, seated, tables free, average wait, longest wait.
- Optional call chime with persisted mute.
- Keyboard shortcuts: `N` call next, `W` walk-in, `P` pause.

**Owner dashboard**
- Live KPI cards: waiting, average wait, seated today, no-show rate.
- Hourly service pulse (joined vs seated), peak hour, joined/seated/walk-in totals.
- Floor map grouped by zone with status legend.
- Live queue preview and the last 14 activity events.
- 7/30/90-day reports with totals, daily table and insights.
- CSV export of every entry with timestamps, wait and turn minutes.
- Table CRUD with unique labels, capacity, zone, and seated-table protection.
- Team management with owner/greeter roles, PIN reset, access pause, and last-owner protection.
- Settings for identity, accent colour, timezone, hours, average turn, hold window, largest party, queue cap, auto no-show and guest announcement.
- Printable A4 QR poster, copy link, download QR.

**Platform**
- Next.js 16 App Router + React 19 + Tailwind CSS 4.
- Postgres persistence via `postgres.js`; PGlite fallback for local experiments and tests.
- Idempotent schema creation and demo seeding, serialized with a Postgres advisory lock.
- Atomic daily ticket sequence.
- Lazy hold expiry with idempotent no-show logging.
- Route-handler write API with a uniform `{ ok, message, data }` envelope.
- Signed HTTP-only staff cookies, owner guards on pages and APIs.
- Rate limiting for joins, ticket actions and login attempts.
- `/api/health` database probe.
- `robots.txt` disallows staff/ticket/API surfaces.
- Responsive layouts, accessible labels, focus states and print styles.

**Docs**
- PRD, architecture, reverse-engineering analysis, QA checklist, roadmap, README, env example, Docker Compose.
- 21 automated tests: domain rules + PGlite integration.

### Changed
- Guest branding is restaurant-first with AntriQ as the quiet product signature.
- The host board polls instead of holding a websocket; a deliberate reliability and ops choice.
- Owner and greeter surfaces are separate, but an owner can open the host stand.

### Fixed
- Hold acknowledgements are idempotent; repeated “I’m on my way” does not extend indefinitely.
- No-show rate is consistent between the dashboard and reports (attendance denominator).
- Table capacity cannot be reduced below a currently seated party.
- Concurrent call/seat attempts return a friendly “already handled” message.
- A second PGlite process cannot corrupt a shared dev directory (development now uses Postgres).

### Security
- PINs hashed with scrypt, per-user salt, constant-time verification.
- HMAC-SHA256 session tokens with expiry; HTTP-only, SameSite=Lax, Secure in production.
- Ticket tokens are 18 random bytes; ticket metadata is `noindex`.
- All SQL positional; all user input length/enum validated.
- Owner-only reads and writes guarded server-side.
- No third-party analytics or tracking scripts.

### Known limitations
- Today-only walk-in waitlist; no advance reservations.
- No automated WhatsApp/SMS; staff call the guest’s name, and the ticket is a live link.
- No table combining or floor-plan editor.
- English UI only.
- Single restaurant per deployment.
- Polling means up to 4s (host/ticket) or 8s (owner) latency.
- Manual no-show undo is not available (a no-show can rejoin as a new ticket).
