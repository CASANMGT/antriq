# AntriQ — Product Requirements Document (v1.2)

| | |
| --- | --- |
| **Product** | AntriQ — restaurant queue, table flow and floor insight |
| **Version** | 1.2 (multi-brand, multi-branch release) |
| **Date** | 7 November 2026 |
| **Owner** | Product / Engineering |
| **Status** | Released (v0.3.0) |
| **Reference study** | WaitHub (`web.waithub.id`), F&B vertical — see [REVERSE_ENGINEERING.md](REVERSE_ENGINEERING.md) |
| **Scope** | Multiple brands → multiple branches, walk-in queue, seat numbers + PIC (no advance reservations in v1) |

> **v1.2 amendment — 7 November 2026.** AntriQ now supports **multiple brands and multiple branches**. Brands own identity and assets (logo, menu PDF, Instagram); branches own URL, hours, tables, staff and queue. Every operational row is branch-scoped, and owner/staff access is scoped to platform, brand, or branch. Guests can be seated at a table with an optional **seat number**; the greeter/cashier who opened the seat is recorded as PIC and shown on the guest ticket. See §22 for the full amendment; any remaining “single restaurant” wording below is superseded.

> **v1.1 amendment — 7 November 2026.** AntriQ now ships with the Nikumaru & Tenka demo, a full Fredoka/tomato/butter/pink visual system, **Indonesian as the default language with an English toggle**, and a **queue-first guest experience**. Guests no longer see wait-time estimates or hold countdowns; the queue number, position, parties ahead and the called code are the product. The hold engine and ETA maths remain internal (auto no-show / analytics) but are not surfaced. Sections below that describe ETA/hold in the UI are superseded by §21.

---

## 1. Summary

AntriQ gives a hospitality group three connected surfaces:

1. **Guest pages per branch** (`/b/[brand]/[branch]`) that turn “how long is the wait?” into a clear answer and a live ticket.
2. **A host stand** that helps a greeter or cashier call, seat and turn tables without a clipboard, shouting, or guesswork.
3. **An owner dashboard** that shows the room now and the service over time, scoped to the brand or branch the owner can manage.

## 2. Problem

### 2.1 Guest problem

A walk-in guest arrives at a full restaurant and is told “about 30 minutes.” They have no idea whether that is real, where they are in line, or whether leaving the queue will cost them the table. They hover near the door, ask repeatedly, or abandon.

The information asymmetry is the product problem: **the restaurant has the queue, the guest has the anxiety.**

### 2.2 Greeter problem

The host stand runs on memory and paper. A greeter must remember:

- who arrived first,
- which parties are large,
- which tables are being bussed,
- who was called and disappeared,
- who is celebrating a birthday,
- which table is blocked.

When it gets busy, the queue loses its fairness and the floor loses turns. The greeter becomes a traffic controller with no instrument panel.

### 2.3 Owner problem

The owner sees the result at the end of the night, not the cause during service. They cannot answer:

- How long did guests actually wait?
- How many parties walked away or no-showed?
- Which hour is under-staffed?
- Are big tables turning slowly?
- Did the new hold policy help?

### 2.4 Market context

Indonesian F&B operators increasingly use queue products (WaitHub, Antrian.online, Qmatic-style systems) but the category is usually sold as generic “queue management,” not restaurant flow. Restaurant-specific needs — party size, table capacity, hold windows, table reset, no-shows — are often represented as generic “services” or “counters.” AntriQ starts from the table, not the ticket counter.

## 3. Goals & non-goals

### 3.1 Product goals

| Goal | Measure |
| --- | --- |
| Reduce guest uncertainty | A guest can state their queue position, parties ahead and the code being called without asking staff |
| Make the line fair | Parties are called in arrival order unless a party cannot physically fit a free table |
| Protect turns | Called guests get a clear hold window; expired holds release the table |
| Make the floor legible | A greeter can see waiting, at-door, seated and table state in one scan |
| Give the owner evidence | Daily wait, no-show and turn metrics without spreadsheet work |
| Stay operationally simple | One restaurant can go live with one database and two PINs |

### 3.2 Non-goals (v1)

- Advance reservations and deposits.
- Multiple outlets or a chain hierarchy.
- POS / kitchen display integration.
- Payments, tipping or loyalty.
- Native iOS/Android apps.
- Diner accounts, social login, or marketing automation.
- WhatsApp/SMS delivery (the ticket is a live web link; contact is manual).
- Table combining, split tables, or floor-plan drag-and-drop.
- Waitlist for services other than dining (clinics, banks, government offices).

## 4. Personas

### 4.1 Dina — the diner

- 28–45, arrives with 2–6 people, often on a Friday or weekend.
- Has a phone, low patience for uncertainty, may be with family or on a date.
- Wants to know: *how long, where am I, will I lose my table if I step out?*
- Success: joins in under 30 seconds; sees a clear queue position and call; is seated without repeating her name.

### 4.2 Ayu — the greeter

- 20–35, host stand, tablet or phone, high interruption rate.
- Manages walk-ins, phone calls, seating, table resets, and the door simultaneously.
- Wants: one screen, big tap targets, no typing, no ambiguity, fast recovery from mistakes.
- Success: calls the right party, seats them at a table that fits, clears the table, repeats.

### 4.3 Rani — the owner

- 30–50, operates one or two restaurants, checks the floor at service and the numbers after.
- Wants: “Are we busy? Are people waiting too long? Are we losing tables to no-shows?”
- Success: sees the answer in under 10 seconds; changes hold time or pauses the queue without calling a developer.

## 5. Jobs to be done

| When | I want to | So that |
| --- | --- | --- |
| I arrive and the room is full | see the real wait and my place | I can decide to stay, walk, or come back |
| I am waiting nearby | watch my ticket update | I don’t have to hover at the door |
| My table is called | know how long it is held | I can get there without panic |
| I change my mind | release my place | I’m not blocking someone else |
| I am hosting | call the next party that fits | the line moves without empty tables |
| I am hosting | extend a hold or mark a no-show | the floor reflects reality |
| I am hosting | reset a table | the next party can be seated |
| I own the restaurant | see wait/no-show/turn | I can change policy with evidence |
| I own the restaurant | add a table or staff PIN | the system matches my operation |

## 6. Product principles

1. **The guest sees the same truth as the floor.** No vanity ETAs, no “5 minutes” forever.
2. **Fairness is visible.** Arrival order is the default; the only exception is physical fit.
3. **One tap, one outcome.** Every greeter action has a clear, reversible result.
4. **The room is the interface.** Tables, not abstractions, are the primary object.
5. **No login for guests.** A ticket link is the guest’s identity.
6. **Quiet by default.** Warm, editorial, calm; motion only to explain state.
7. **Operate on bad Wi-Fi.** Server-rendered first paint, small JSON polls, optimistic states.
8. **One restaurant can understand the whole system.** No hidden hierarchy.

## 7. Scope

### 7.1 In scope (v1, shipped)

- Single restaurant profile and hours.
- Walk-in waitlist with party size, name, optional phone/note.
- Live guest ticket: position, parties ahead, now-serving, called state, acknowledge, cancel — no time estimate or hold countdown.
- Greeter board: call next, call specific, seat, extend, no-show, undo, walk-in, table lifecycle, pause/close, search.
- Table inventory: label, capacity, zone, available/seated/dirty/blocked.
- Owner dashboard: live KPIs, hourly pulse, floor map, queue, activity, 7/30/90-day reports, CSV.
- Table and staff management, PIN reset, access pause, last-owner protection.
- Restaurant settings: identity, timezone, hours, accent, announcement, average turn, hold window, party/queue caps, auto no-show.
- Printable QR poster and copyable guest link.
- Demo seed and one-click demo credentials.
- Responsive layouts, keyboard shortcuts, reduced motion.

### 7.2 Out of scope (v1)

See §3.2. Adjacent items are tracked in [ROADMAP.md](../ROADMAP.md).

## 8. User flows

### 8.1 Guest joins the waitlist

1. Guest scans the QR poster or opens the restaurant link.
2. Page shows restaurant identity, open status, parties waiting, tables free, typical wait.
3. If the waitlist is paused/closed, the form is replaced by the reason and a “see the host” note.
4. Guest chooses party size (1…max), enters a name, optionally phone + note.
5. Client validates quickly; server re-validates and enforces queue cap and party cap.
6. Server atomically allocates the next daily code (`A-014`), creates a random ticket token, computes position and ETA.
7. Client stores the token in `localStorage` and navigates to `/t/<token>`.
8. Ticket shows code, party, joined time, position, people ahead, ETA, now-serving, tables free, hold policy.

**Failure paths:** waitlist paused, queue full, invalid party size, rate-limited, network error. Each shows a human reason and a next step.

### 8.2 Guest waits, is called, is seated

1. Ticket polls every 4 seconds while visible.
2. Waiting → position decreases; ETA recalculates against live tables.
3. Greeter calls the party → ticket becomes **Table ready** with hold countdown.
4. Guest may tap **I’m on my way** once: +3 minutes and “we’re expecting you”.
5. Guest may tap **Release my table** → cancelled, place released.
6. If hold expires (auto-no-show on), ticket becomes **We missed you** with a rejoin link.
7. If greeter seats them → **Seated at T4**, wait time shown.
8. When the table is cleared → **Visit complete**, thank-you state.

### 8.3 Greeter opens the floor

1. Sign in with name + PIN (demo shortcut available in demo mode).
2. Session is a signed HTTP-only cookie, 12 hours.
3. Greeter lands on `/host`, which server-renders the current board and then polls `/api/host/state`.
4. Stats strip: waiting, at door, seated, tables free, avg wait, longest wait.
5. Three columns: Waitlist / At the door / Floor. On a phone, the same sections become tabs.

### 8.4 Greeter works the line

1. **Call next** picks the first waiting party that fits an available table, suggests the smallest fitting table.
2. If no table is free, the board offers **call anyway** for a party while a table is being bussed.
3. Called party appears under **At the door** with a hold countdown.
4. Greeter can **Seat** (choose table), **+5 min**, **No-show** (confirm), or **Undo** (return to original place).
5. **Seat** opens a modal of available tables that fit, best fit first. Seating updates the entry and table atomically.
6. **Walk-in** opens a form; the guest enters the line without needing a phone.
7. Pause/close the waitlist with a reason. Existing tickets keep their place.
8. Table actions: **Clear** (complete visit, mark dirty), **Ready** (dirty → available), **Block/Unblock**.

### 8.5 Owner reviews service

1. Sign in with owner PIN → `/dashboard`.
2. Overview loads server-side with data, then polls every 8 seconds.
3. KPIs, hourly service pulse, floor map, live queue and activity.
4. Reports: 7/30/90-day range, daily table, insights, CSV.
5. Settings: changes save via API, refresh the page, and apply immediately to the guest page and host stand.
6. Tables and Team: CRUD with guardrails.
7. QR poster: print A4, copy link, download QR.

## 9. Functional requirements

### 9.1 Guest requirements

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| G-01 | Show live restaurant status | Open/closed/paused, hours, address, phone, Instagram, announcement |
| G-02 | Show live wait signals | Parties waiting, tables free, typical wait, now-serving code |
| G-03 | Join with party size 1…max | Stepper enforces 1 and restaurant max; server re-checks |
| G-04 | Collect guest details | Name 2–60 chars required; phone optional 7–16 digits; note ≤200 chars |
| G-05 | Respect waitlist state | Joining rejected with a clear message when paused/closed |
| G-06 | Respect queue capacity | Joining rejected when waiting ≥ `max_queue_size` |
| G-07 | Allocate a daily code | `A-001`, `A-002`… resets at midnight in restaurant timezone |
| G-08 | Issue a capability ticket | 18 random bytes, URL-safe; `/t/<token>` only way to read the ticket |
| G-09 | Live position | Polling ≤4s; position = index in FIFO waiting queue; show parties ahead |
| G-10 | Called state | “Meja siap!” with directions, “Saya menuju host” once, release — no countdown |
| G-11 | Final states | Seated, completed, no-show, cancelled all render a clear end state |
| G-12 | Cancel | Only waiting/called; releases place immediately; idempotent failure message |
| G-13 | Keep my ticket | Store token locally; show “open ticket” banner on the guest page |
| G-14 | Queue-first | No wait-time estimate or hold timer is shown to guests; queue position and call status only |
| G-15 | Language | Indonesian is the default; English is available via a persistent toggle |
| G-15 | Privacy | Ticket URL is unguessable; no diner account; no public name list |

### 9.2 Greeter requirements

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| H-01 | PIN login | 4–8 digits, scrypt verification, signed 12h cookie, throttled |
| H-02 | Live board | Waiting/called/seated/recent + tables + stats; polls every 4s |
| H-03 | Call next | FIFO, first party that fits a free table; returns a specific error if none |
| H-04 | Call any | Individual call; sets hold timer; increments call count |
| H-05 | Override call | “Call anyway” while tables are bussing; no table suggested |
| H-06 | Seat | Waiting or called party; table must be free and large enough; atomic |
| H-07 | Extend hold | +1…15 min (default 5), marks acknowledged |
| H-08 | No-show | Called/waiting → no_show; confirmation modal; logged |
| H-09 | Undo call | called → waiting at original FIFO position |
| H-10 | Walk-in | Add guest while paused/closed; source = walkin |
| H-11 | Table lifecycle | clear seated → dirty → available; block/unblock |
| H-12 | Pause/close | Preserve existing queue; reason optional; logged |
| H-13 | Search | Name, code, or phone, case-insensitive |
| H-14 | Error recovery | Stale tickets return a friendly message and refresh the board |
| H-15 | Mobile | Tabs for waitlist/at door/floor; ≥44px touch targets |
| H-16 | Chime | Optional sound when another device calls a guest; mute persisted |
| H-17 | Shortcuts | N/W/P on desktop, ignored while typing or in a dialog |

### 9.3 Owner requirements

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| O-01 | Owner-only access | Greeters are redirected from `/dashboard`; APIs return 401 |
| O-02 | Live KPIs | Waiting, avg wait, seated today, no-show rate |
| O-03 | Service pulse | Hourly joined vs seated for today, peak hour |
| O-04 | Floor map | Tables by zone with status legend |
| O-05 | Queue preview | First 6 waiting with code, party, wait, note |
| O-06 | Activity | Last 14 events with actor, code/name/table and relative time |
| O-07 | Reports | 7/30/90 days; totals, avg wait, avg turn, no-show rate, daily table |
| O-08 | CSV | All entries in range with timestamps, wait and turn minutes |
| O-09 | Tables CRUD | Unique label, capacity 1–40, zone; cannot delete seated table |
| O-10 | Staff CRUD | Add owner/greeter, reset PIN, pause access; last owner protected |
| O-11 | Settings | Identity, hours, timezone, accent, announcement, policy |
| O-12 | Waitlist control | Open/pause/close from settings and host stand |
| O-13 | QR poster | A4 print, QR to public URL, copy link, download PNG |
| O-14 | Demo mode | Seed fictional restaurant + show demo shortcuts on login |

### 9.4 System requirements

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| S-01 | Idempotent schema | `CREATE TABLE IF NOT EXISTS`; safe cold starts |
| S-02 | Serialized first boot | Postgres advisory transaction lock around schema + seed |
| S-03 | Atomic counters | Daily ticket sequence survives concurrency |
| S-04 | Lazy no-show expiry | Expired holds released on the next read; logged once |
| S-05 | Timezone correctness | Day boundaries and service hours use restaurant timezone |
| S-06 | Audit feed | Join/call/seat/complete/no-show/cancel/settings/team events |
| S-07 | Health check | `/api/health` verifies DB |
| S-08 | No-store reads | All live endpoints send `Cache-Control: no-store` |
| S-09 | Error envelope | All writes return `{ ok, message?, data? }` |
| S-10 | Production DB required | No silent serverless file database in production |

## 10. Queue, ETA and table algorithm

### 10.1 Ordering

Waiting entries are ordered by `joined_at ASC, id ASC`. There is no paid priority in v1 (a reference product offers “Waiting Plus”; AntriQ deliberately keeps fairness simple).

### 10.2 Smart call

Given `waiting` (FIFO) and `tables`:

```text
available = tables where status = available
if available is empty: return "no-table" (host may force)
for entry in waiting:
  if entry.party_size > largest_table_capacity: skip
  table = smallest available table with capacity >= entry.party_size
  if table: return (entry, table)
return "no-fit" (host must clear a larger table)
```

Calling does not reserve the suggested table in v1; the greeter seats within the hold. This avoids blocking a table if the guest disappears. The suggested table is shown in the call activity and the seat modal.

### 10.3 ETA maths (internal only)

> **v1.1:** this calculation remains available to the API and analytics for future work, but it is **not displayed** to guests or hosts. Queue position is the guest-facing signal.

```text
perParty = clamp(avgTurnMinutes / tableCount, 4, 20)
ahead = position - 1
freeSeats = min(availableFittableTables, ahead + 1)
cycles = max(0, ahead - availableFittableTables)
firstCycle = freeSeats > 0 ? 2 : perParty
eta = clamp(round(firstCycle + cycles * perParty), 2, 180)
```

- `avgTurnMinutes` is the average of completed visits today (fallback: restaurant setting) when at least 3 turns exist.
- `tableCount` and `availableTables` are filtered to tables that fit the party’s size, so a 6-top does not get a 2-top estimate.
- Rationale: the estimate is a **floor**, not a promise. It collapses when tables are free and stretches with queue depth.

### 10.4 Hold and no-show

- Calling sets `hold_expires_at = now + hold_minutes` (default 8).
- Guest “I’m on my way”: +3 minutes, only once (`acknowledged` flag).
- Host “+5 min”: adds 5 minutes, marks acknowledged.
- On every read of host/owner/ticket state: `status='called' AND hold_expires_at < now()` → `no_show`, `closed_at=now`, activity logged by `System`.
- `auto_no_show` can be turned off; then expiry is manual.

### 10.5 Table lifecycle

```text
available ──seat──► seated ──clear──► dirty ──ready──► available
     │                                                   ▲
     └──────────────block────────────────────────────────┘
```

- A table can only be seated if `status='available'` and `capacity >= party_size`.
- Clearing a table completes the seated visit and marks the table dirty.
- A dirty or blocked table cannot be used for seating.
- A seated table cannot be deleted or shrunk below its current party.

### 10.6 Cancellation and no-show

- Guest cancel is allowed in waiting or called.
- Cancelled/no-show entries release their position immediately.
- No-show rate denominator = seated + completed + no-show (attendance), consistent across dashboard and reports.

## 11. Roles & permissions

| Capability | Guest (ticket) | Greeter | Owner |
| --- | --- | --- | --- |
| View restaurant / wait | yes | yes | yes |
| Join waitlist | yes | walk-in only | walk-in only |
| View own ticket | yes | via board | via board |
| Cancel own ticket | yes | — | — |
| Host board | — | yes | yes |
| Call / seat / no-show | — | yes | yes |
| Pause waitlist | — | yes | yes |
| Tables CRUD | — | — | yes |
| Staff CRUD / PIN reset | — | — | yes |
| Reports / CSV | — | — | yes |
| Restaurant settings | — | — | yes |
| QR poster | — | — | yes |

## 12. Data model

```text
restaurant 1 ─── * staff
      │
      ├────── * dining_tables 1 ─── * queue_entries
      ├────── * queue_entries
      ├────── * queue_sequence
      └────── * activity
```

Key invariants:

- `queue_entries.token` is unique and unguessable.
- `(day, seq)` is unique; codes are allocated atomically.
- A table is `seated` iff at most one active seated entry references it (enforced by flow).
- `queue_entries.table_id` is nullable (waiting/called) and set on seat.
- `activity` has no FK to entries so history survives cleanup.
- `day` is derived in the restaurant timezone, not server UTC.

See [`lib/schema.ts`](../lib/schema.ts) for the full DDL.

## 13. Edge cases

| Case | Behaviour |
| --- | --- |
| Party larger than every table | Cannot be called/seated; error asks the host to handle directly |
| Queue full | Join rejected with a “see the host” message; walk-in override allowed |
| Waitlist paused | New joins blocked; existing tickets unaffected |
| Hold expires | Auto no-show; table stays free for the next party |
| Guest cancels while called | Ticket cancelled; table not allocated yet |
| Host refreshes mid-action | Atomic update guard returns “already handled”; board refreshes |
| Two hosts call next together | Conditional update ensures one wins |
| Table cleared twice | Second attempt says “not marked as seated” |
| Table shrunk below seated party | Refused with a clear message |
| Last owner deactivated | Refused; at least one owner stays active |
| Duplicate table label | Refused case-insensitively (labels uppercased) |
| Timezone midnight | New day → new code sequence; demo resets next day |
| Phone absent | Allowed; greeter calls the name instead |
| Network drops | Last known ticket/board remains; polling resumes on visibility |
| Ticket link lost | Guest can rejoin; staff can see the name in the line |
| Unknown ticket token | Friendly 404 with a rejoin link |
| Restaurant closed | Waitlist can still be paused/closed; joining follows waitlist state |
| Screenshot/print | QR poster has dedicated print styles; nav/buttons hidden |

## 14. Non-functional requirements

### Performance

- Server-rendered first paint under 1.5s on a warm server (p50).
- Poll payload < 60 KB for the host board at demo scale; < 100 KB for the owner overview.
- No layout shift when stats update; enter animations respect reduced motion.
- Guest join round-trip under 800ms on a warm server.
- Lighthouse targets: Performance ≥ 90 on the guest page, Accessibility ≥ 95.

### Reliability

- Health endpoint checks the database.
- All mutations are transactional where they touch more than one row.
- No-show expiry is idempotent and safe under concurrency.
- Schema creation is idempotent and serialized.
- Vercel + managed Postgres; no single-process state in production.

### Security

- Staff PINs hashed with scrypt, per-user salt.
- Session cookie: HMAC-SHA256, HTTP-only, SameSite=Lax, Secure in production, 12h.
- Owner checks on the server for pages and APIs.
- Rate limits: join 8/min/IP; ticket actions 12/min/IP; login 6 failures/5 min per staff id.
- All SQL parameterized; input length/enum validation.
- Capability tokens 144 bits of entropy.
- No third-party scripts, analytics, or pixels.

### Accessibility

- Semantic landmarks, labels on every input, `aria-live` on the ticket and notice.
- Visible focus rings.
- ≥ 44px primary touch targets on mobile.
- Color is never the only signal: status pills + text + counts.
- `prefers-reduced-motion` disables non-essential animation.
- Print styles for the QR poster.

### Privacy

- No diner account, email, or password.
- Phone is optional and used only for staff contact (no automated messaging in v1).
- Ticket data is readable only with the token.
- Staff can see guest names/phones; that is operationally necessary.
- No guest data in URLs beyond the random token.

### Localization

- v1.1 UI is **Indonesian by default**, with an English toggle. Copy lives in `lib/i18n.ts` and is ready for more languages.
- All timestamps are restaurant-timezone aware.
- `Intl` used for dates; no hard-coded UTC assumptions.

## 15. Success metrics

### Guest

- Join completion rate ≥ 90% of started forms.
- Ticket open rate (guest keeps the page) ≥ 70%.
- Median time from join to ticket view < 2s.
- Cancellation rate < 8% (signals a credible wait).
- Post-call acknowledgement rate ≥ 50%.

### Greeter

- Calls per service and seats per call.
- Time from call to seat (target < 6 min).
- No-show rate (target < 12%).
- Table reset time (dirty → ready; target < 5 min).
- Empty fit while parties wait: < 5 minutes per service (smart call effectiveness).

### Owner

- Week-over-week wait time and no-show trend.
- Table turn vs configured target.
- Peak-hour utilization.
- Daily active staff sessions.

### Technical

- API p95 < 400ms.
- Poll error rate < 0.5%.
- Zero data-loss incidents.
- Test suite green on every push.

## 16. Analytics event plan (roadmap)

| Event | Properties |
| --- | --- |
| `guest_join_started` | party_size |
| `guest_joined` | code, party_size, position, eta |
| `guest_ticket_viewed` | code, status |
| `guest_acknowledged` | code, hold_seconds_left |
| `guest_cancelled` | code, status_when_cancelled |
| `host_called` | code, party_size, table_suggested |
| `host_seated` | code, table, wait_minutes |
| `host_no_show` | code, wait_minutes |
| `table_cleared` | table, turn_minutes |
| `waitlist_state_changed` | status, reason |

v1 stores the same events in `activity`; a warehouse sink is a roadmap item. No third-party analytics in v1.

## 17. Packaging & pricing (proposal)

| Plan | Price | Includes |
| --- | --- | --- |
| **Single** | IDR 299k / month | One restaurant, unlimited tickets, 3 staff, 30-day reports |
| **Pro** | IDR 599k / month | Everything + 90-day reports, CSV, QR kit, priority support |
| **Founder** | IDR 3.9m / year | Pro + onboarding, menu/loyalty integrations (roadmap), price lock |

A free 14-day trial with the demo restaurant. No per-ticket fees. The reference market charges per outlet/month; AntriQ’s wedge is restaurant-native workflow, not generic queueing.

## 18. Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Staff find the board too dense | Medium | High | Three-column scan, big actions, mobile tabs, keyboard shortcuts; observe a real shift |
| Guests ignore the ticket and leave | Medium | Medium | Hold countdown, clear call state, phone field for manual follow-up, optional WhatsApp next |
| No-shows remain high | Medium | Medium | Honest ETA, hold policy, “on my way”, no-show analytics; deposits later |
| Database cold start slows first request | Medium | Low | Warm health check, pooled connection, small schema, seed guard |
| Owner changes policy and blames the app | Low | Medium | Settings copy explains impact; reports compare wait/turn/no-show |
| Multi-device clock skew | Low | Low | Server `serverNow` included; countdown is based on server hold seconds |
| Data loss on serverless without DB | Low | Critical | Production requires `DATABASE_URL`; `/api/health` fails loudly |
| Scope creep into POS/CRM | High | High | Explicit non-goals; roadmap gates |

## 19. Open questions

1. Should reservations arrive before or after walk-ins in v2? (Recommendation: check-in time + grace, not booking time.)
2. Do we need table combining for large parties before deposits?
3. WhatsApp template messages: which provider (Meta Cloud API vs local gateway)?
4. Is a printed QR at the table better than at the door for reorders? (v2 experiment.)
5. Should no-show auto-mark be off by default for fine dining?
6. ~~Multi-language: Indonesian first or bilingual EN/ID?~~ Resolved in v1.1: Indonesian default, English toggle.

## 20. Launch checklist (v1.0 → v1.1)

- [x] PRD and architecture docs
- [x] Guest join → ticket → call → seat → complete
- [x] Host call next / seat / no-show / undo / walk-in
- [x] Table lifecycle and guardrails
- [x] Owner dashboard, reports, CSV
- [x] Staff PINs, sessions, owner guard
- [x] Schema + demo seed + advisory lock
- [x] Domain + integration tests
- [x] Lint and production build
- [x] QR poster
- [x] Responsive layouts and reduced motion
- [x] Live Postgres URL connected in Vercel (Neon, Singapore)
- [x] Production deploy verified with `/api/health` — https://antriq1.vercel.app
- [x] v1.1 brand foundation, mascot, queue-first screens
- [x] Indonesian default + English toggle
- [ ] Real restaurant pilot (2 weeks, one shift/day)
- [ ] Metric baseline captured before pricing conversations

## 21. v1.1 — brand & queue-first amendment

**Restaurant:** Nikumaru & Tenka (fictional ramen & izakaya, Senopati). One location, 14 tables, 3 staff.

**Language:** Indonesian is the default. English is available through a persistent cookie-backed toggle. All guest, ticket, host, owner, reports, tables, team, settings, QR, 404 and error surfaces are translated.

**Queue-first rule:** the guest sees:

- queue code (`A-024`)
- position (`#4 dari 6 rombongan`)
- parties ahead
- now-serving code
- tables open
- called / seated / completed / no-show / cancelled state

The guest does **not** see an ETA, a hold countdown, a “time left” meter, or a “we hold for X minutes” promise. `hold_expires_at` remains in the database for auto no-show, and `eta_minutes` remains in the ticket API for future use, but neither is rendered.

**Host rule:** waiting cards show queue positions, not wait duration. Called cards show name, party and actions (`Dudukkan`, `Tidak hadir`, `Batalkan panggilan`) without a timer. Stats are counts: waiting, called, seated, tables open, seated today, no-shows.

**Owner rule:** queue-focused KPIs (waiting, called, seated today, tables open); service pulse and reports use joined/seated/no-show/cancel counts. Average wait and average turn are no longer shown as headline KPIs. Settings no longer expose hold duration or average turn; the operational values are retained internally.

**Visual system:** Fredoka + Plus Jakarta Sans; tomato `#F24B3F`, butter `#FFF1CA`, ink `#262321`, soft pink `#FFD6DF`, leaf `#2E7D4F`; 2px outlines, sticker shadows, brush accents, toast mascot, paper backgrounds.

**Demo:** seeded floor with a called guest that stays at the door for demonstration; the floor resets on the first request of each new service day. Production URL: https://antriq1.vercel.app.

---

## 22. v1.2 — multi-brand, multi-branch amendment

### 22.1 Hierarchy

```text
brand (identity, logo, menu PDF, Instagram, accent)
  └── branch (public slug, address, phone, timezone, hours, announcement,
              queue policy, tables, staff, queue)
```

- **Brand URLs:** `/b/[brand]` lists branches and brand assets.
- **Branch URLs:** `/b/[brand]/[branch]` is the guest queue for that branch. `/` redirects to the primary branch.
- **Assets:** logos and menu PDFs are stored in Postgres `bytea` and served from `/api/brands/[id]/logo` and `/api/brands/[id]/menu`; no object-storage vendor is required.
- **QR posters** encode the exact branch URL.

### 22.2 Roles and scope

| Role | `brand_id` | `branch_id` | Can manage |
| --- | --- | --- | --- |
| Platform owner | null | null | Every brand and branch, brand creation |
| Brand owner | set | null | Their brand, every branch in it, brand staff |
| Branch owner | set | set | Their branch, branch settings/tables, branch staff |
| Greeter | set | set | Live floor for their branch |
| Cashier | set | set | Live floor for their branch |

- `canManageBranch`, `canManageBrand`, `canOperateBranch` and `listBranchesForStaff` enforce scope in `lib/store.ts`.
- Host/owner APIs reject out-of-scope branch requests with 403.
- Branch owners cannot create brands or branches and cannot promote someone to owner.

### 22.3 Staff assignment

- Owners can create/edit staff with **name, role, brand, branch, PIN**.
- Owners can edit role/brand/branch without changing the PIN; PIN reset is separate.
- At least one active platform owner is always required.
- Greeters and cashiers require a branch; owners may be platform-level, brand-level, or branch-level.

### 22.4 Seating and PIC

- Seating requires an available table whose capacity is at least the party size.
- The host may choose a **seat number** from `1..capacity`, or leave it as **“Let the host decide”** (`seat_number = null`).
- On seat: `opened_by` stores the acting staff name and `opened_by_staff_id` stores their id.
- The guest ticket shows table, seat number and the staff member who opened it.
- Table cards, activity and CSV include seat + PIC.
- Greeters, cashiers and owners (with scope) can perform seating; the guest sees the result.

### 22.5 Environment and deployment

- **Production:** `antriq1` on Vercel, Neon Postgres in Singapore, `NEXT_PUBLIC_APP_URL=https://antriq1.vercel.app`.
- **Staging:** separate Vercel environment/project, separate Neon branch/project, separate `AUTH_SECRET`.
- Functions are pinned to `sin1` in `vercel.json`; the Postgres pool uses a small max, short idle timeout and 15-minute max lifetime for serverless.
- The v0.2 schema is not compatible. v0.3 automatically moves the old tables into `antriq_v2_backup` and seeds the new model; `npm run db:reset -- --yes` is available when you want a clean slate.
- `DEMO_MODE=1` seeds the lived-in queue; without it, brands/branches/staff/tables are still created on an empty database but the queue starts empty.
