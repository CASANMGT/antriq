# QA & release checklist

## Automated

```bash
npm run lint     # ESLint, Next 16 + React 19 rules
npm test         # 21 domain + integration tests on PGlite
npm run build    # production build
```

Last run: **6 Nov 2026** — lint clean, 21/21 tests passing, production build green.

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
- [x] Staff PIN verification (right, wrong, unknown)
- [x] Join → ticket → position/ETA → cancel
- [x] Call next and hold timer
- [x] Seat at the best-fit table
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
| 8 | Tap “I’m on my way” | +3 min, note changes, button disappears, hold is not extended twice | Pass |
| 9 | Host seats the party | Ticket shows “Seated at T4” and wait minutes | Pass |
| 10 | Host clears the table | Ticket becomes “Thanks for dining” | Pass |
| 11 | Release while waiting | Confirmation, then cancelled state, local ticket removed | Pass |
| 12 | Waitlist paused | Form replaced by reason + “see the host”; join blocked | Pass |
| 13 | Unknown token `/t/nope` | Friendly 404 with rejoin | Pass |

### Host stand

| # | Step | Expected | Result |
| --- | --- | --- | --- |
| 1 | Sign in with Ayu / 1357 | Redirect to `/host`, session persists | Pass |
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
| 1 | Sign in with Rani / 2468 | `/dashboard` | Pass |
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
