# Roadmap

AntriQ is deliberately small. This roadmap protects that: every item must make the door, the floor, or the owner’s decisions better. Dates are targets, not promises.

## Now — v0.1 MVP (shipped)

- [x] Single-restaurant guest waitlist + live ticket
- [x] Greeter board with smart call, seating, holds, no-shows, walk-ins
- [x] Table lifecycle and capacity guards
- [x] Owner KPIs, hourly pulse, 7/30/90-day reports, CSV
- [x] Staff PINs, owner guard, settings, QR poster
- [x] Postgres persistence, demo seed, tests, CI-ready docs

**Exit criteria:** a real restaurant can run one dinner service end-to-end on a phone and a tablet.

## Shipped — v0.2 “Brand + queue-first” (7 Nov 2026)

- [x] Fredoka + Plus Jakarta Sans, tomato/butter/ink/pink palette, sticker outlines
- [x] Toast mascot, new logo, icon, manifest, QR poster
- [x] Indonesian default + English toggle across every surface
- [x] Removed guest-facing ETA and hold countdown; queue position is the signal
- [x] Renamed demo restaurant to Nikumaru & Tenka with Indonesian seed data
- [x] Queue-first KPIs: waiting, called, seated, tables open
- [x] Daily demo reset on warm serverless instances
- [x] Deployed at antriq1.vercel.app

## Next — v0.3 “Trust & reach” (6–8 weeks)

### Reservations that respect the floor
- A booking date/time, party size, and grace period.
- Checked-in reservations join the live queue **at check-in time**, not booking time.
- Owner sees reserved vs walk-in demand by hour.
- 15-minute grace; auto-release with activity log.
- Acceptance: a booked party can check in, join, be called, and be seated without breaking walk-in fairness.

### Notifications without a new app
- WhatsApp Cloud API adapter (template: “Your table is ready — please come to the host stand”).
- Optional SMS fallback.
- Preferences per restaurant; consent captured at join.
- Retry/outbox with idempotency; delivery status in activity.
- Acceptance: called guests receive a message within 10s; opt-out is respected.

### Guest confidence
- Indonesian + English UI with locale detection.
- “Running late” once from the ticket (already present) plus a clear “call the host” action.
- Add-to-home-screen prompt and an offline ticket snapshot.
- Acceptance: a guest can complete the whole flow in Indonesian; no layout breaks.

### Operations
- SSE channel for call events; polling fallback.
- Vercel Cron for hold expiry every minute.
- Audit log filter (by actor, type, day) in owner settings.
- Acceptance: calls appear in under 1s; expiry does not depend on a page being open.

## Later — v0.4 “One more location”

### Multi-location
- `restaurant_id` scoping, location switcher, per-location staff and tables.
- Consolidated owner view and per-location reports.
- Shared guest entry per location; QR encodes location.
- Acceptance: an owner can compare two outlets’ wait and no-show without spreadsheets.

### Better floor
- Drag-and-drop floor plan (zones, table shapes) with a mobile list fallback.
- Table combining for large parties.
- Reserved table hold with a timer.
- Acceptance: a 10-top can be seated across two joined tables without breaking capacity math.

### Revenue protection
- Optional deposits or a small hold fee for large parties (Stripe/Xendit).
- No-show fee policy with clear consent.
- Waitlist priority only when the restaurant explicitly enables it (never silently).
- Acceptance: a large-party no-show can be charged according to a policy the guest accepted.

### Integrations
- Public read/write API keys per restaurant.
- POS webhook: table cleared → mark dirty automatically.
- Google Reserve / Maps “join waitlist” deep link.
- Acceptance: a POS can close a visit without a greeter tap.

## Later — v1.0 “The operating system for the door”

- Shift handover notes and staff performance (calls, seats, turn time).
- Menu-aware wait (kitchen prep time affects ETA).
- Guest feedback on the ticket (one tap) and recovery alerts for low scores.
- Demand forecasting: “Friday 19:00 needs one more host.”
- Chain analytics and benchmarks (opt-in, anonymized).
- SOC2-lite security review, SSO for groups, audit export.
- Native wrapper only if PWA push proves insufficient.

## Explicitly not planned

- A full restaurant POS.
- A consumer discovery marketplace or reviews.
- Delivery/logistics orchestration.
- Loyalty points or a wallet.
- Paid queue-jumping at the expense of arrival fairness (unless a restaurant opts in conspicuously).
- A generic multi-vertical queue builder (clinics, banks, government). AntriQ is for restaurants.

## How items get prioritised

1. Does it reduce guest uncertainty at the door?
2. Does it protect a table turn or a host’s attention?
3. Does it give the owner a decision they can act on?
4. Can a single restaurant understand and operate it without training?
5. Does it keep the system runnable by one small team?

If the answer is no to 1–3, it waits. If it violates 4–5, it is redesigned or rejected.

## Release gates

- [ ] `npm run lint` clean
- [ ] `npm test` green
- [ ] `npm run build` succeeds
- [ ] Manual QA checklist in [docs/QA.md](docs/QA.md)
- [ ] Health check green on the deployed URL
- [ ] Changelog entry written before tagging
