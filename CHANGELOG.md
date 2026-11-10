# Changelog

All notable changes to AntriQ are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Planned
- Reservation / booking date flow.
- WhatsApp notification adapter.
- SSE for call events (polling remains a fallback).
- Push notifications and PWA install prompt.

## [0.16.0] — 2026-11-10

The **reviews, timeslots and Hadir privacy** release.

### Added
- Guests can rate while waiting, while called, and after being marked **Hadir**; releasing the queue also offers an optional rating.
- After rating, the ticket shows a **rating summary** with a finish or close action.
- Hosts see the guest's rating and review on **Hadir** cards.
- Rating analysis is broken down by **hourly time slot** (17:00–18:00, 18:00–19:00, and so on).
- **Tidak Hadir** cards show the guest's start time and how long they waited.

### Changed
- Hadir cards no longer show the guest's phone number or WhatsApp link.
- Customer-facing “Duduk” wording is now **“Hadir”** throughout.

## [0.15.0] — 2026-11-10

The **rating reviews** release.

### Added
- Each star rating now offers **pre-filled review suggestions**, so guests can send useful feedback in one tap.
- The submitted review is shown on the ticket result.
- Rating analysis by restaurant now includes the latest **review comments and content**.

## [0.14.1] — 2026-11-10

The **QA data cleanup** release.

### Fixed
- One-time cleanup removes QA test tickets and their ratings from production data.

## [0.14.0] — 2026-11-10

The **A/B queue, Hadir list and ratings** release.

### Added
- Queue groups are **A/B by default**, and the host queue is split into **Antrean A** and **Antrean B**.
- Called guests can be **called again** with a fresh push notification and a **WhatsApp** link when a phone number exists.
- The **Hadir** list shows the check-in time and sorts the newest check-ins first.
- A **Tidak Hadir** column lets the host put a no-show guest back into the queue with a new code.
- Guests can **rate their queue experience 1–5** on the ticket; owners see the average, distribution and latest ratings by restaurant.

### Changed
- “Duduk” is now **“Hadir”** across the host board and guest ticket.
- Ratings and notes are included in the reports CSV.

### Fixed
- Owner dashboard relative times no longer cause a hydration mismatch.

## [0.13.0] — 2026-11-10

The **Owner & Host roles** release.

### Changed
- Staff roles are now **Owner** and **Host** only; manager, greeter and cashier accounts become Host.
- Team names are generic (“Owner”, “Host Blok M”) instead of personal names.
- New staff and PIN resets default to **1234**.
- Owners can still run the host stand; only owners can pause/reopen the queue and manage settings.

### Fixed
- `antriq.vercel.app` now serves the working deployment instead of the broken project.

## [0.12.2] — 2026-11-10

The **ticket-stub mascot** release.

### Changed
- The mascot now reads as a ticket stub: a clean rectangular body, side notches and a perforated tear line.
- Colours, face, arms, shoes and moods are unchanged.

## [0.12.1] — 2026-11-09

The **Selesai Antrian + Tebet hours** release.

### Changed
- The seated-ticket reset button is now labelled **“Selesai Antrian”**.
- Nikumaru Tebet now defaults to **10:00–22:00**.

## [0.12.0] — 2026-11-09

The **queue again from a seated ticket** release.

### Added
- Seated guests get a **“Order at another restaurant”** button that closes the ticket and clears this device’s ticket history.
- The action clears the device cookie and local ticket link so the same phone can join a new queue.

### Changed
- Closing a seated ticket from the guest side marks the table as needing a reset.

## [0.11.0] — 2026-11-09

The **optional time-to-table countdown** release.

### Added
- Per-branch setting to show the **“time to table”** countdown after a guest is called.
- Off by default; enable it in Settings to show the countdown on the ticket and host board.

### Changed
- Default maximum party size is now **10 guests**.
- When the countdown is off, calls no longer auto-release and the “Saya hadir” option is hidden.

## [0.10.1] — 2026-11-09

The **guest ticket wait-time privacy** release.

### Changed
- The guest ticket no longer shows the time the guest joined.
- Host cards still show the live waiting time.

## [0.10.0] — 2026-11-09

The **optional Saya hadir button** release.

### Added
- Per-branch setting to enable the **“Saya hadir”** button on the ticket.
- Off by default; the countdown and host flow still work without it.

### Changed
- When disabled, the ticket countdown asks guests to show their code to the host instead of tapping a button.
- The acknowledge API rejects the action when the button is disabled.

## [0.9.0] — 2026-11-09

The **host wait times + cleaner seated ticket** release.

### Added
- Host queue and seated cards show how long the guest has waited.
- Waiting time is calculated from scan/join to now or to the call.

### Changed
- Seat release is renamed to **“Selesai”** with a check icon.
- Seated guest tickets no longer show the host name or directions.

## [0.8.0] — 2026-11-07

The **nearest restaurants + distances** release.

### Added
- Guest restaurant picker can use the visitor’s location.
- Brands and branches sort nearest first, with distance labels and a “Nearest” badge.
- Branch latitude/longitude fields in Settings and the branch editor.
- Seeded coordinates for the demo branches.

### Fixed
- Geolocation is now allowed by the site Permissions-Policy.
- If location is denied or unsupported, the default order remains available.

## [0.7.3] — 2026-11-07

The **handover session hardening** release.

### Fixed
- Staff sessions now re-check the live staff record.
- Pausing a staff member or changing their role takes effect on the next request.
- Inactive or deleted staff can no longer keep an old session.

## [0.7.2] — 2026-11-07

The **ticket identity** release.

### Added
- The live ticket now shows the guest’s entered **name** and **phone number**.
- Long names wrap and long phone numbers stay fully visible.

## [0.7.1] — 2026-11-07

The **one active ticket per guest** release.

### Added
- Duplicate protection by guest device cookie and phone number.
- Existing-ticket panel replaces the join form when the guest already has an active ticket.

### Fixed
- Rejoining no longer creates a second active ticket.
- After releasing or completing a ticket, the guest can join again normally.
- Host walk-ins can still override duplicate protection when explicitly added by staff.

## [0.7.0] — 2026-11-07

The **operations audit + in-app changelog** release.

### Added
- In-app **version badge** and `/changelog` page with curated release notes.
- Version/changelog links in the guest footer, ticket footer, owner sidebar, mobile dashboard nav and host header.
- Version test that fails if `lib/version.ts` drifts from `package.json`.

### Fixed
- Greeters and cashiers can no longer pause, close or reopen the queue; only owners and managers can.
- The host `P` shortcut and pause controls are hidden from front-line staff.
- Brand branch cards now show **outside hours** and the actual opening hours instead of always showing “Open now”.
- Manager dashboard kicker now reads **Manager dashboard**, not “Owner dashboard”.
- Active-ticket banner no longer stretches the mobile guest join card.
- Mobile wordmark now matches desktop and keeps the receipt mark.

### Verified
- Owner and manager queue pause/reopen.
- Greeter queue controls are hidden and the API rejects their queue-status mutation.
- Guest join blocked outside hours; closed-hours panel renders; restore works.
- Mobile layouts at 390 px, notification delivery, and manager scoping.

## [0.6.0] — 2026-11-07

The **queue control + service hours** release.

### Added
- **Queue toggle on the owner/manager dashboard**:
  - Pause new joins while existing guests keep their place.
  - Reopen the queue again.
  - Managers can use it without gaining access to settings or user management.
- **Opening-hours gate** for guest joins:
  - Outside service hours, the join form is replaced by a panel showing the opening hours, timezone and next opening time.
  - `POST /api/join` rejects guest joins outside service hours with a clear message.
  - Staff walk-ins can still be added outside hours when the host explicitly overrides.
- `nextOpening()` helper with overnight-window support.

### Changed
- The waiting ticket notification banner is hidden while the branch is closed, paused or outside hours.
- Guest queues are only accepted during the branch’s configured opening hours.

### Verified
- Manager paused and reopened the queue from the dashboard.
- Closed-hours page showed the opening-hours panel, hid the join form and returned **400** on a join attempt.
- Restoring the hours immediately brought the form back and allowed a normal join.

## [0.5.0] — 2026-11-07

The **manager role + mobile polish** release.

### Added
- **Manager staff role**:
  - Monitors every brand and branch they are scoped to.
  - Can operate the live host floor and view reports, customers and QR posters.
  - Cannot manage staff accounts, PINs, settings, brands, branches or tables.
- Manager option in Team, with brand/branch scope (all brands, one brand, or one branch).
- Manager quick-login shortcut in local development.
- Seeded demo manager **Rina Manager** for fresh databases.

### Changed
- Toasts now sit **above the mobile bottom navigation** instead of covering it.
- The branch page logo and footer logo now link to the **brand page** (mobile-friendly branch list) instead of the global picker.
- Mobile navigation hides owner-only items for managers.

### Fixed
- Staff role constraint accepts `manager` on existing databases.
- Owner-only pages redirect managers back to the dashboard instead of the host stand.

## [0.4.0] — 2026-11-07

The **single-group queue + production access** release.

### Added
- **Queue groups** branch setting:
  - **1 group (default)** — every guest joins one queue.
  - **2 groups** — A for 1–2 guests, B for 3+ guests.
- Guest join card, branch stats, ticket and host cards adapt to the selected queue group.
- **All branches** report for owners, scoped to the branches they manage.
- All-branch CSV export with a `branch` column.

### Changed
- Production login no longer shows the demo PIN shortcuts (`1234`). Demo shortcuts remain on local development only.
- The AntriQ receipt mark is hidden on small screens so the wordmark reads clearly.
- Single-group guest joins show a ticket icon instead of an “A/B” category badge.

### Fixed
- Report totals and daily chart can aggregate multiple branches without losing scope.
- Larger tap targets for the subtle footer Staff link.

## [0.3.9] — 2026-11-07

The **clean print + verified notifications** release.

### Fixed
- Print poster no longer prints the dashboard header, action buttons or download link.
- Print poster prints on exactly **one A4 page**; the poster card fills the page and the footer sits at the bottom.
- QR prints at **80 mm** and stays high resolution.

### Changed
- Mobile tap targets are larger for the language switch and the AntriQ logo.
- The ticket waiting screen shows the full notification opt-in banner instead of a small inline button.

### Verified
- Playwright notification QA: a granted-permission guest ticket receives a service-worker notification with the correct ticket code when the tab is hidden and the host calls it.
- All guest, brand, branch and login pages were checked at **390 × 844** with no horizontal overflow.

## [0.3.8] — 2026-11-07

The **mobile join + hold settings** release.

### Changed
- Guest mobile layout puts the join card first, followed by brand/queue details.
- Name field uses mobile-friendly autocomplete/capitalisation and “next” keyboard hints.
- Removed the Staff link from the guest top navigation; Staff remains as a subtle footer link.
- “Saya menuju host” is now **“Saya hadir”**.
- Owner Settings can configure:
  - call hold/countdown minutes
  - what **Saya hadir** does: stop the countdown or add minutes
  - how many minutes to add
- Ticket shows “Countdown extended” when the guest adds time.

### Added
- Firefox-specific notification guidance (lock icon → Permissions → Notifications → Allow).
- Unsupported-browser notification message.

### Fixed
- Queue-only and A/B mobile labels no longer clip.
- Mobile queue bar fits all tabs and owner/QR shortcuts.

## [0.3.7] — 2026-11-07

The **circular brand avatars + print-ready QR** release.

### Changed
- Brand logos are now square/circular social-media-style avatars and display larger:
  - guest branch page: 96px
  - brand page: 128px
  - restaurant picker: 64px
  - ticket: 80px
  - QR poster: circular brand mark
- QR poster QR is generated at **1600px** with high error correction and prints at 68mm on A4.
- Added a QR poster shortcut to the host queue screen (desktop and mobile).
- Mobile pass:
  - shorter A/B stat labels
  - queue tab label “Duduk” instead of “Sedang duduk”
  - icon-only owner/QR actions in the mobile queue bar
  - compact branch selector label
  - break-safe brand titles

### Fixed
- Brand logo assets migrate once to the circular versions.
- QR download is branch-specific and high resolution.
- “Now serving” only shows an entry that is currently called; no-shows/completed tickets no longer appear as active.
- Mobile queue bar fits Antrean / Dipanggil / Duduk plus owner and QR shortcuts.

## [0.3.6] — 2026-11-07

The **queue-only + A/B categories** release.

### Added
- **Queue-only mode** (`seating_mode = queue`) is now the default. Guests and hosts do not need tables or seat numbers.
- **Queue A** for parties of 1–2 and **Queue B** for parties of 3+. Ticket codes use the matching prefix (`A-001`, `B-002`).
- Category badge on host cards and “your queue category” on the ticket.
- New mascot pose holding an AntriQ ticket, used on the waiting ticket.
- Circular, larger brand logo on the ticket.

### Changed
- Customer surfaces no longer show empty-table counts. The branch page, restaurant picker and ticket show Queue A / Queue B / now-serving instead.
- Host board in queue mode shows Queue, Called and Seated only; the table stat is hidden.
- Existing manual branches migrate to queue-only; owners can still choose Manual or Table plan in Settings.

### Fixed
- Old `seating_mode` check constraints now accept `queue`.
- Existing queue rows get A/B categories from party size and regenerated codes.
- Demo entries generate `A-` or `B-` codes from party size.

## [0.3.5] — 2026-11-07

The **branding, upload and QR** release.

### Added
- Customer-facing notification opt-in banner on the branch page, so Chrome/Firefox guests can allow notifications before joining.
- Brand identity card on the printable QR poster: brand logo + branch name + address, with the branch URL QR below it.
- A decoded-QR test (`jsqr`) proving the poster QR resolves to the branch URL.
- New horizontal Nikumaru and Tenka seed logos; refreshed AntriQ wordmark and app icon.

### Changed
- Platform owner name: **Iwanna**; primary greeter name: **Wuri**. Existing demo staff migrate once.
- QR uses high error correction (`H`) and a larger print size.
- Brand assets revalidate immediately after upload.

### Fixed
- Brand logo/menu upload now accepts files with missing or generic MIME types by falling back to the filename extension.
- Upload errors are shown in the UI instead of a generic failure; files over 4 MB are caught before upload.
- Re-selecting the same file now triggers upload again.
- Asset routes no longer serve stale logos/menus for 60 seconds after an upload.
- Brand upload failures return JSON instead of an HTML 500.

## [0.3.4] — 2026-11-07

### Changed
- All demo staff PINs are now **`1234`** (owner, brand owner, greeters and cashiers) until real PINs are assigned.
- One-time `staff_pin_1234` migration updates existing staff rows.
- Demo login shortcuts and docs updated to `1234`.

## [0.3.3] — 2026-11-07

The **brand correction + manual seating** release.

### Changed
- **Nikumaru** is now defined as Japanese beef hamburg & niku rice with **Blok M** and **Tebet** branches.
- **Tenka** is now defined as halal tempura & katsu with **AEON Mall Tanjung Barat**, **Bintaro Xchange Mall 2**, and **KAMAJA Social Space**.
- Corrected addresses and Instagram handles (`@nikumaru.id`, `@tenka.idn`).
- Existing demo branches migrate automatically: `senopati → blok-m`, `kemang → tebet`, `tenka/senopati → kamaja`; AEON and Bintaro branches are added.
- Legacy branch URLs redirect to the new slugs.
- Guest branch/brand headers now link back to the **all-restaurant picker** at `/`.
- Demo rows only seed on first boot unless `DEMO_AUTO_RESET=1`, so cleared production data stays empty across redeploys.

### Added
- **Seating mode** per branch:
  - **Manual** (default): one tap **Dudukkan**, no table or seat number; a **Sedang duduk** list with **Lepas kursi**.
  - **Table plan**: the existing table + optional seat-number flow.
- Settings control for seating mode with staffing guidance.
- Notification prompt on the waiting ticket, so permission can be enabled before the call.
- Production `antriq1` now runs the five corrected branches, all cleared: 0 waiting / 0 seated.
- Legacy branch URLs redirect to the new slugs.

## [0.3.2] — 2026-11-07

The **customer picker, modal input fix and floor integrity** release.

### Added
- Customer-facing **restaurant picker** at `/` — brands, branches, live waiting count, open tables, now serving, address, hours, brand menu/Instagram and branch links.
- `/demo` shortcut redirects to the primary seeded branch.
- Owner **Customers** page (`/dashboard/customers?branch=`) with name, contact, party, status, table/seat, opener PIC, releaser PIC and join time; 1/7/30-day ranges and CSV.
- `npm run db:clear -- --yes` clears queue/activity/table state while keeping brands, branches, staff and tables.
- Owner **Settings → Clear queue data** for a branch-scoped clear from the dashboard.
- `DEMO_AUTO_RESET` is now opt-in: production can clear its queues and stay empty.
- Production `antriq1` queues were cleared; all three branches show 0 waiting and all tables available.

### Fixed
- **All modal inputs were not typeable**: the modal focus timer re-ran on every parent render and stole focus from fields. It now runs only when the dialog opens and never steals focus already inside the panel.
- Floor could show an available table with a seated guest (and a “Duduk” count that disagreed with the grid). Reads now reconcile table status from seated entries.
- Added a partial unique index so a table can never have two active seated entries; duplicate seated rows are closed on migration.
- README now lists production, demo and branch links plus production/demo database separation.

## [0.3.1] — 2026-11-07

The **call countdown, notifications and seat release** patch.

### Added
- **3-minute call countdown** (default `hold_minutes = 3`) shown on the called guest ticket and host cards.
- Tapping **“Saya menuju host”** pauses the countdown (`acknowledged = true`, `hold_expires_at = null`); the host can still extend it.
- Browser notification permission prompt on the host stand and called ticket, with a service worker for Chrome/Firefox notifications. A hidden tab gets notified when a guest is called.
- **Open seat** action: seat a party at the best-fit table without assigning a seat number.
- **Release seat** action for cashiers and hosts. Records `released_by` / `released_by_staff_id` and logs a `release` activity event.
- Cashier role pill on the host board; cashier release reasons distinguish payment-settled from host release.
- CSV now includes `released_by`.
- Data migration: existing branches with the old 8-minute default move to 3 minutes once, tracked in `app_meta`.

### Fixed
- Editing a team member with an old session cookie could hide the Owner role and show Host instead. Sessions now normalize missing `brandId`/`branchId` to `null`, and the modal no longer treats `undefined` as a locked branch.
- Owner-role editing keeps the real role selected; brand/branch selectors now show the correct scope.
- Notification permission state is checked without crashing in browsers that do not support the API.

## [0.3.0] — 2026-11-07

The **multi-brand, multi-branch** release: brand and branch URLs, scoped owners, cashier access, seat numbers with PIC tracking, and brand asset uploads.

### Added
- **Brands → branches** data model. Brands own name, slug, Instagram, description, accent, logo and menu PDF. Branches own URL slug, hours, timezone, announcement, tables, staff and queue.
- Public brand page `/b/[brand]` and branch page `/b/[brand]/[branch]`. `/` redirects to the primary branch.
- Demo split into **Nikumaru** (Senopati, Kemang) and **Tenka** (Senopati).
- Scope model: platform owner (all), brand owner (`brand_id`), branch owner (`brand_id` + `branch_id`), greeter/cashier (fixed branch).
- **Cashier** role with the same branch-scoped live floor access as a greeter.
- Team assignment UI for role + brand + branch, with role editing and scoped staff lists.
- Owner **Brands** page: edit identity and upload logo / menu PDF; public asset routes `/api/brands/[id]/logo` and `/api/brands/[id]/menu` (stored as Postgres `bytea`).
- Owner **Branches** page: create/edit branches, link to per-branch settings and public page.
- Host **seat number picker** (1..capacity or “Let the host decide”), recording `opened_by` + `opened_by_staff_id` (PIC).
- Guest ticket shows the assigned table, seat number and the staff member who opened it.
- Table cards and activity/CSV include seat number and PIC.
- Branch switcher on the host stand and owner shell; every service/report/QR link carries `?branch=`.
- `vercel.json` pins functions to Singapore (`sin1`); Postgres pool tuned for serverless (max 5, 15-minute lifetime).
- `npm run db:reset -- --yes` one-time schema reset for v0.2 → v0.3.
- Automatic v0.2 migration: legacy tables are moved to an `antriq_v2_backup` schema on first boot (data preserved), then the new model is created and seeded.
- Staging/production guidance: separate database and `AUTH_SECRET` per environment.

### Changed
- Login resolves the correct branch and routes owners to `/dashboard?branch=` and staff to `/host?branch=`.
- Guest join, host state/actions, owner overview/export and ticket reads are all branch-scoped.
- Brand identity (Instagram, logo, menu) is managed at brand level; branch settings no longer pretend to own Instagram.
- Owner overview links, reports range links and QR poster URLs preserve the active branch.

### Fixed
- Postgres combined brand/branch queries now fetch the branch and brand separately, avoiding duplicate `id` columns.
- Branch-level Instagram falls back to the brand’s Instagram.
- Menu/logo caching can be busted after upload.
- Dashboard pages no longer assume a single restaurant.

## [0.2.0] — 2026-11-07

The **brand + queue-first** release: Nikumaru & Tenka, Indonesian-first, and a visual system built from the AntriQ brand boards.

### Added
- Full brand system: Fredoka + Plus Jakarta Sans, tomato/butter/ink/pink/leaf palette, 2px sticker outlines, offset shadows, paper backgrounds, brush accents and spark doodles.
- AntriQ toast mascot with `happy`, `calm`, `celebrate` and `sleep` moods, used on guest, ticket, login, empty states and the QR poster.
- New responsive logo, app icon, apple icon and manifest.
- **Bahasa Indonesia as default**, with a cookie-backed **English** toggle across guest, ticket, login, host stand, owner dashboard, reports, tables, team, settings, QR, 404 and error screens.
- New `lib/i18n.ts` dictionary, `LanguageProvider`, and server language detection.
- Queue-first guest experience: queue number, position, parties ahead, now serving and tables open.
- “Meja siap!” called state with mascot and “Saya menuju host”, without a countdown.
- Renamed demo restaurant to **Nikumaru & Tenka** (ramen & izakaya), with Indonesian seed notes.
- Printable QR poster redesigned around the brand.
- Demo floor resets on the first request of a new service day, even on warm serverless instances.
- Production deployment at **https://antriq1.vercel.app** (Vercel + Neon Postgres, Singapore).

### Changed
- Removed guest-facing wait estimates and hold countdowns. Queue position and call status are the primary signals.
- Removed average-wait KPIs from the owner overview and reports; replaced with queue counts, attendance and no-shows.
- Removed the average-turn and hold-duration fields from settings (the internal hold/auto-no-show engine remains).
- Host cards show queue positions instead of “waited X minutes”; called cards no longer show a countdown.
- Guest hero, ticket, host stand, dashboard, login and QR now use the new sticker/outlined visual language.
- Dashboard sidebar is now butter cream with a tomato active state.
- Seed restaurant hours extended to 23:30 Jakarta for a better evening demo.
- Updated docs, screenshots and metadata.

### Fixed
- Ghost small buttons no longer inherit a sticker shadow and stray underline.
- Called ticket shows the correct “we’re holding your table” note before acknowledgement.
- QR poster text no longer collides with the mascot.
- Floor cards show capacity with a proper space (`2 org` / `2 pax`).
- Demo called guest persists at the door instead of auto-expiring during a demo session.

## [0.1.0] — 2026-11-06

First public MVP. One restaurant, three roles, a real database and a demo floor.

### Deployed
- Production: **https://antriq1.vercel.app** (Vercel + Neon Postgres, Singapore).
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
