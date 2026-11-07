# QA & release checklist

## Automated

```bash
npm run lint     # ESLint, Next 16 + React 19 rules
npm test         # 29 domain + integration tests on PGlite
npm run build    # production build
```

Last run: **7 Nov 2026** — lint clean, 29/29 tests passing, production build green (v0.5.0 manager role + mobile polish).

### Notification delivery QA

- Chromium (headed, `notifications` granted) opens a live ticket.
- The tab is hidden and the host calls the ticket.
- Assert the service worker `showNotification` fires with title `Meja siap!`, the ticket code and tag `antriq-call`.
- Assert no page errors.
- Firefox permission prompt and blocked-permission instructions verified visually.

### Print QA

- Generate `/dashboard/qr?branch=1` as an A4 PDF from a **390 × 844** viewport.
- Assert exactly **1 page**, no dashboard header/buttons/download link.
- Visual check: brand mark, branch name, 80 mm QR and footer all on one page.

### Queue groups

- Default branch setting is **1 group**; a party of 3+ joins with an `A-` code and sees one queue.
- Switch the branch to **2 groups**; a party of 2 joins as `A`, a party of 3+ joins as `B`.
- Guest cards, ticket and host cards show A/B only in 2-group mode.

### Production access

- `/login` in production does not render the demo shortcut block or show `1234`.
- Local development still renders the demo shortcuts.
- Platform owner sees **all branches** in Laporan; a brand owner sees only their brand’s branches; host/cashier cannot open Laporan.
- “All branches” CSV includes a `branch` column and only in-scope branches.

### Manager role

- Manager logs in and lands on the dashboard.
- Owns no admin navigation: Team, Settings, Tables, Brands and Branches are hidden.
- Direct visits to those pages redirect to `/dashboard`.
- Manager can open the host stand for any covered branch and call/seat guests.
- `POST /api/owner/action` returns **401** for a manager.
- Laporan “all branches” and CSV stay scoped to covered branches.
- Toast floats above the mobile bottom navigation (33 px gap at 390 × 844).
- Branch page logo links to `/b/{brand}`, not the global picker.

### Deployment verification

- [x] Vercel project `antriq1` deployed from `CASANMGT/antriq`
- [x] Neon Postgres (Singapore, free plan) connected via `DATABASE_URL`
- [x] `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL=https://antriq1.vercel.app`, `DEMO_MODE=1`
- [x] `GET /api/health` → `200 {"ok":true,"service":"antriq"}`
- [x] Live guest join → owner call → seat → clear flow
- [x] Live ticket states (waiting, called, seated, completed)
- [x] Demo floor reseeded after the smoke test
- [x] v0.3 deployed to `antriq1`; legacy tables moved to `antriq_v2_backup`
- [x] Production queues cleared; all branches show 0 waiting / all tables available
- [x] `/` is the customer restaurant picker; `/demo` redirects to the primary branch
- [x] `/dashboard/customers` lists guests with contact, table/seat, opener/releaser PIC
- [x] Modals accept typing; focus is not stolen after opening
- [x] Production `/b/nikumaru`, `/b/nikumaru/blok-m`, `/b/nikumaru/tebet`, `/b/tenka/aeon-tanjung-barat`, `/b/tenka/bintaro-xchange`, `/b/tenka/kamaja` → 200
- [x] Legacy branch URLs redirect to the new slugs
- [x] All five production branches cleared: 0 waiting / 0 called / 0 seated
- [x] Production branches default to manual seating
- [x] Production brand logo route → 200 `image/svg+xml`
- [x] `X-Vercel-Id` confirms `sin1` (Singapore)

### v1.2 multi-brand, multi-branch checks

- [x] Editing a brand owner no longer shows the role as Host (old-session `undefined` branch fix)
- [x] Owner/Greeter/Cashier roles are all selectable where allowed
- [x] Call starts a 3-minute countdown on host and guest ticket
- [x] “Saya hadir” pauses or extends the countdown per Settings; host card shows paused/on-the-way
- [x] Browser notification permission prompt appears when permission is `default`; denied state is explained
- [x] Hidden tab receives a browser notification when a call is added
- [x] “Open seat” seats at the best-fit table without a seat number
- [x] “Release seat” is available to cashier/host; `released_by` is recorded and shown in activity/CSV

- [x] `/` shows the customer restaurant/branch picker
- [x] `/demo` redirects to the primary seeded branch
- [x] Modals accept typing; focus is not stolen after opening
- [x] Floor reconciliation heals table/entry status drift
- [x] Brand page `/b/nikumaru` lists Blok M + Tebet with logo/menu/IG
- [x] `/b/tenka/kamaja` renders the Tenka branch and its own queue
- [x] Legacy `/b/nikumaru/senopati`, `/b/nikumaru/kemang`, `/b/tenka/senopati` redirect
- [x] Manual seating mode: one-tap seat, no table required, Seated list + release
- [x] Table-plan mode still supports table + seat number
- [x] Customer branch page shows notification opt-in; Chrome/Firefox permission prompt works
- [x] Brand logo/menu upload survives MIME fallback and is served immediately
- [x] QR poster shows the Tenka/Nikumaru brand logo and decodes to the branch URL
- [x] Platform owner is Iwanna; primary greeter is Wuri
- [x] Customer pages do not show empty-table counts
- [x] Queue A (1–2) and Queue B (3+) codes/labels work
- [x] Queue-only mode default; host hides table stat and seats openly
- [x] Ticket shows circular brand logo and ticket-holding mascot
- [x] Guest join card appears first on mobile; name + Ambil antrean above the fold
- [x] Guest top nav has no Staff link; footer Staff link is subtle
- [x] Firefox blocked-notification instructions render
- [x] “Saya hadir” can stop or extend the countdown per Settings
- [x] Countdown duration is configurable in Settings
- [x] Unknown brand/branch returns 404
- [x] Platform owner sees all branches; brand owner only Tenka; branch owner only their branch
- [x] Host board switcher changes branch and all actions carry `branchId`
- [x] Greeter/cashier cannot open a branch outside their assignment (403)
- [x] Team add/edit supports owner/greeter/cashier + brand + branch
- [x] Branch settings/tables/QR/report links keep `?branch=`
- [x] Brand logo and menu PDF upload + public asset routes
- [x] Seat number picker: “Let the host decide” and `1..capacity`
- [x] Seat action records `opened_by` + `opened_by_staff_id`
- [x] Guest ticket shows table, seat and PIC after seating
- [x] Table card and CSV include seat + PIC
- [x] ID/EN dictionaries cover every new label
- [x] `vercel.json` pins `sin1`; staging uses a separate database and secret

### v1.1 visual & language checks

- [x] Fredoka + Plus Jakarta Sans load on guest, host, dashboard and login
- [x] Tomato/butter/ink/pink/leaf tokens applied instead of the old serif/clay theme
- [x] Toast mascot renders on guest, ticket, login, empty queue and QR poster
- [x] Sticker outlines + offset shadows on cards, buttons and inputs
- [x] Guest page: no ETA, no hold timer, no “we hold for X minutes”
- [x] Ticket: no ETA, no countdown; waiting/called/seated/completed states clear
- [x] Host: queue positions, counts and actions; no wait/hold timers
- [x] Owner: queue-first KPIs; no average-wait KPI; reports use counts
- [x] Settings: no hold/avg-turn fields
- [x] QR poster: no hold time; text does not collide with mascot
- [x] ID default on a fresh browser; `EN` toggle updates server and client text
- [x] Switching back to `ID` restores Indonesian without a reload loop
- [x] 430px mobile: no horizontal overflow; host tabs + owner link fit
- [x] 1440px: three-column host, cream dashboard sidebar, poster layout
- [x] Demo called guest stays at the door; with `DEMO_AUTO_RESET=1`, floor resets on a new service day

### Domain suite (`tests/queue.test.ts`)

- [x] Daily ticket code formatting and widening above 999
- [x] FIFO ordering with deterministic id tie-break
- [x] Position lookup and missing entry
- [x] Best-fit table selection
- [x] Smart next pick skips parties that don’t fit
- [x] “No table” / “no fit” / “empty” reasons
- [x] Force-call while a table is being bussed
- [x] ETA clamps (2–180), free-table collapse, table-count effect
- [x] Live stats and longest wait
- [x] Hourly buckets in restaurant timezone
- [x] Turn fallback with sparse data

### Integration suite (`tests/store.test.ts`)

- [x] Demo seed is believable and public snapshot is correct
- [x] Two brands + three branches resolve by slug
- [x] Staff PIN verification (right, wrong, unknown)
- [x] Join → ticket → position → cancel
- [x] Call next and hold timer
- [x] Seat at the best-fit table with seat number + PIC
- [x] Acknowledge pauses or extends the countdown per branch setting
- [x] Release a seated table records the cashier and completes the visit
- [x] Refuse a party that doesn’t fit
- [x] No-show + undo back to the line
- [x] Acknowledge once (idempotent, no stacking extensions)
- [x] Auto-release an expired hold
- [x] Paused waitlist blocks joins, walk-ins still allowed
- [x] Owner metrics and CSV export

## Manual release checklist

Tested on Chrome 152 (Windows) at **1440×1000**, **816×2412**, and emulated **430×932** mobile. Touch targets and responsive breakpoints verified visually.

### Guest

| # | Step | Expected | Result |
| --- | --- | --- | --- |
| 1 | Open `/` while the waitlist is open | Restaurant, status, waiting, tables free, typical wait, form | Pass |
| 2 | Increment/decrement party size | 1 ≤ size ≤ max, controls disable at edges | Pass |
| 3 | Submit with empty name | Native required validation; no request | Pass |
| 4 | Join as “Maya Putri”, 2 guests | Ticket `A-0xx`, position, ETA, hold policy | Pass |
| 5 | Reload the ticket | Same ticket, live data | Pass |
| 6 | Open `/` again | “Your open ticket” banner links back | Pass |
| 7 | Host calls the party | Ticket becomes Table ready; ring counts down; vibrates on Android | Pass |
| 8 | Tap “Saya hadir” | Countdown pauses or adds the configured minutes; note changes; button disappears | Pass |
| 9 | Host seats the party | Ticket shows “Seated at T4” and wait minutes | Pass |
| 10 | Host clears the table | Ticket becomes “Thanks for dining” | Pass |
| 11 | Release while waiting | Confirmation, then cancelled state, local ticket removed | Pass |
| 12 | Waitlist paused | Form replaced by reason + “see the host”; join blocked | Pass |
| 13 | Unknown token `/t/nope` | Friendly 404 with rejoin | Pass |

### Host stand

| # | Step | Expected | Result |
| --- | --- | --- | --- |
| 1 | Sign in with Wuri / 1234 | Redirect to `/host`, session persists | Pass |
| 2 | Wrong PIN ×7 | Throttle message after 6 failures | Pass |
| 3 | Open `/dashboard` as greeter | Redirect to `/host` | Pass |
| 4 | Call next | First fitting party moves to At the door, hold starts, toast names table | Pass |
| 5 | Call next with no free table | Error explains; “call anyway” appears | Pass |
| 6 | Seat a called party | Modal lists only free fitting tables, best fit first; seat + table update atomically | Pass |
| 7 | Seat a 6-top at a 2-top | Refused with capacity message | Pass |
| 8 | +5 min | Countdown increases; acknowledged | Pass |
| 9 | No-show | Confirmation; entry moves to recent; table unaffected | Pass |
| 10 | Undo a call | Guest returns to the line at original position | Pass |
| 11 | Add walk-in while paused | Added to line with source Walk-in | Pass |
| 12 | Pause then reopen | Existing tickets keep place; new join allowed after reopen | Pass |
| 13 | Clear a seated table | Visit completed; table turns “Reset” | Pass |
| 14 | Mark ready / block / unblock | Status transitions and log entries | Pass |
| 15 | Search by name/code/phone | Filters the line only | Pass |
| 16 | Mobile tabs | Waitlist / At door / Floor switch without losing state | Pass |
| 17 | Shortcut N / W / P | Works outside inputs and dialogs | Pass |
| 18 | Mute chime | Persists across reload | Pass |
| 19 | Session expiry | API 401 → login redirect | Pass |

### Owner

| # | Step | Expected | Result |
| --- | --- | --- | --- |
| 1 | Sign in with Iwanna / 1234 | `/dashboard` | Pass |
| 2 | Overview | KPIs, hourly pulse, floor by zone, queue, activity, 7-day strip | Pass |
| 3 | Waitlist control | Pause/Reopen from settings; guest page reflects it | Pass |
| 4 | Reports 7/30/90 | Totals, daily table, insights; range persists | Pass |
| 5 | CSV export | UTF-8 BOM, header, wait/turn columns, all entries | Pass |
| 6 | Save settings | Persists, toast, guest page updates | Pass |
| 7 | Invalid time / colour | Human validation message | Pass |
| 8 | Add table T9 | Appears by zone and in host seating | Pass |
| 9 | Shrink a seated table | Refused with party size in the message | Pass |
| 10 | Delete a seated table | Refused; clear first | Pass |
| 11 | Add team member | Can sign in with the new PIN | Pass |
| 12 | Reset PIN | Old PIN fails, new PIN works | Pass |
| 13 | Pause last owner | Refused (at least one active owner) | Pass |
| 14 | QR poster | QR scans to the public URL; print hides chrome | Pass |
| 15 | Owner opens host stand | Allowed; greeter areas work | Pass |
| 16 | Logout | Cookie cleared, login page | Pass |

### Cross-cutting

| Check | Result |
| --- | --- |
| No console errors on guest/host/owner happy paths | Pass |
| Reduced motion | Animations suppressed |
| Keyboard focus visible | Pass |
| 430px layout | No horizontal scroll; form fits |
| 1440px layout | Three-column host, owner sidebar |
| Slow network (DevTools throttling) | Last state stays; polling retries |
| Health check | `{ ok: true }` |
| Cold start | Schema/seed idempotent; demo not duplicated |
| Two tabs open | Both boards converge on refresh |

## Known limitations to re-test after fixes

- A no-show cannot be un-marked in v1; the guest can rejoin.
- Party size chosen in the demo script can lag if the form is submitted in the same tick as a stepper click (React state); real user pacing is fine.
- Polling latency is visible on a fast laptop; it is intentional.
- PGlite dev fallback must not be used with multiple Next dev workers; use Docker Postgres.

## Pre-deploy gate

- [ ] `DATABASE_URL` points at a pooled Postgres
- [ ] `AUTH_SECRET` is random and stored only in Vercel
- [ ] `NEXT_PUBLIC_APP_URL` matches the deployed domain
- [ ] `DEMO_MODE` is intentionally on or off
- [ ] `/api/health` returns 200
- [ ] QR poster prints A4 at 100%
- [ ] One full join → call → seat → clear cycle on a phone
- [ ] `CHANGELOG.md` updated and tagged
