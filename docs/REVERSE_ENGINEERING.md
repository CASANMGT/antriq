# Reverse engineering notes — WaitHub (F&B) → AntriQ

**Date:** 6 November 2026  
**Reference:** `https://web.waithub.id/` (public web app), its public HTML/JS and publicly reachable read endpoints  
**Scope:** The restaurant / F&B customer flow only. No authenticated merchant data was accessed, no accounts were created, and no personal data was collected.

> **Independence note.** AntriQ is an independent implementation. No source code, assets, copy, or trademarks from WaitHub/Antrique are reused. The observations below are of publicly rendered UI and public API responses, used to understand the category and make better product decisions. Brand names belong to their owners.

---

## 1. What WaitHub is

WaitHub is a multi-vertical queue SaaS operated by Antrique. The public site covers:

- Healthcare (`Kesehatan`)
- Banking / finance (`Keuangan`)
- Service centres (`Service Center`)
- Food & beverage (`Makanan & Minuman`)
- Beauty / grooming (`Perawatan Tubuh`)

Each merchant has a public profile, service list, date picker and ticket registration. Customers can join online or at the venue via QR. The product sends WhatsApp notifications and offers an optional paid “Waiting Plus” monitoring product.

### Restaurant examples observed

| Merchant | Code | Observed services |
| --- | --- | --- |
| FnB WaitHub (Demo) | `RQ242` | `1-2 Persons`, `3-4 persons` |
| THE FULL YOLK — All Day Cafe | `RQ245` | `>4 Pax (Non-Smoking)`, `1-2 Pax (Smoking)`, `3-4 Pax (Smoking)`, `>4 Pax (Smoking)`, `1-2 Pax Non smoking` |
| Sakura Cafe & Resto Bar | `RQ266` | `Meja 1-2 Orang`, `Meja 3-4 Orang`, `Meja 5 orang lebih` |

This is the key insight: **F&B is modelled as party-size services**, not physical tables. The “service” is a capacity bucket.

## 2. Observed guest flow

### 2.1 Discovery

`/find-merchant` lists merchants with logo, name, location, services and a link to `/profile-merchant/<code>`. Search hits `https://aether.waithub.id/merchant/legacy-search?keyword=&page=1`.

Restaurant service names are the only restaurant-specific signal on the listing; there is no “table for 2” availability view.

### 2.2 Merchant profile

`/profile-merchant/RQ242` shows:

- Banner, logo, name, open status and close time (`08:00–22:00`)
- Address (maps link), description
- Date picker (defaults to today in the merchant timezone)
- Service cards: party-size group, hours, “Waiting” count, `REGISTER`
- A “now serving” code for the selected service

Observed requests:

```text
GET /merchant/RQ242
GET /merchant/1860/feature
GET /merchant-accent-color/RQ242
GET /legacy-customer-merchant/RQ242/service?queue_source=Online&booking_date=2026-11-06
```

The `feature` response revealed capabilities:

```json
["CustomMerchantAccentColor","HiddenCustomerRating","HiddenCustomerVisitor",
 "ExpressCalling","Form","DynamicQrRegistration"]
```

This is a feature-flagged, merchant-configurable product. The accent colour is fetched per merchant and applied to the UI.

### 2.3 Service detail

`/views?service_code=IQRp2H&merhcant_code=RQ242&booking_date=2026-11-06` shows:

- Service name + merchant
- Date and hours
- “Persyaratan” (requirements) link
- Last called number (`Terakhir Dilayani`)
- Number waiting
- `Daftar` (register)
- Announcement panel (“Thank you for scanning the barcode…”)

Requests:

```text
GET /service/IQRp2H?booking_date=2026-11-06
GET /service/IQRp2H/openess?queue_source_method=Online&booking_date=2026-11-06
```

The service response carries `operational_status` (`Open` / `SoldOut`), `total_ticket_waiting`, `opening_time`, `closing_time`, `price_status`, `service_price` and a short `link_s` code.

### 2.4 Registration

`/create-ticket?service_code=...` collects:

- Visit date
- Registrant name (required)
- Phone with country selector
- Note (optional)
- Consent checkbox
- Cloudflare Turnstile

Submit is `Register Now`. The service model supports a price (`service_price`), although the demo services are free.

### 2.5 Ticket (from the customer bundle)

The customer SPA includes `/ticket/:id`, `/detail-ticket/:id`, `/queue/m/:id`, `/queue/waiting-plus/:id`, `/waiting-plus-payment/:id`, `/payment`, `/payment-status`.

Observed ticket concepts:

- Queue number (`cd_queue`) and my queue number
- Date, merchant, service
- QR code for the ticket
- “Pantau Panggilan Antrian” (monitor the queue call)
- Cancel (`Batalkan`)
- Waiting Plus upsell (“free 5 minutes”, upgrade to priority monitoring)
- WhatsApp status (`/queue/:id/whatsapp-status`)
- Cancel endpoint: `POST /customer-queue/:id/cancel`

### 2.6 Live updates and identity

- Pusher websockets (`ws-ap1.pusher.com`) with channel auth endpoints.
- Google One Tap / Google login for customer accounts (`customer-auth/*`).
- Cloudflare Turnstile on registration.
- `i18next` for localization; `pusherTransportTLS` in local storage.
- Merchant images on `storage.googleapis.com/waithub-store*` and `merchant.antrique.com`.

### 2.7 Merchant dashboard

`https://dashboard.waithub.id` is a separate React/Mantine app with a login (username/email + password) and routes around tickets, services, branches, agents and reports:

- Report types: SLA per service, sub-service, operator, branch, pending case.
- Ticket search and branch ticket detail.
- Service/sub-service management.
- “Agent” and branch concepts.

This is a generic queue-operations console. It is not visibly a restaurant floor/table board in the public surface we observed.

## 3. What WaitHub does well

1. **Frictionless guest entry** — no account needed to join; name + phone + note is enough.
2. **Honest live signals** — now serving, waiting count, service open/sold-out, date selector.
3. **WhatsApp notifications** — the right channel for Indonesia; stronger than email.
4. **Merchant branding** — per-merchant accent colour and assets make the queue feel native.
5. **Feature flags per merchant** — forms, express calling, dynamic QR, hidden ratings.
6. **Multi-vertical abstraction** — one queue engine serves clinics, banks, government offices and restaurants.
7. **Paid priority lane** — a monetization layer on top of a free queue.
8. **Operational reporting** — SLA, operator and branch reports.

## 4. Gaps in the restaurant experience

These gaps are the reason AntriQ is not a clone.

| Gap | Consequence |
| --- | --- |
| Party size is a “service”, not a table | The system can’t reason about capacity, best-fit seating, or table turns |
| No visible table lifecycle | Greeter still tracks dirty/ready/seated tables outside the product |
| Generic merchant dashboard | Restaurant owner sees ticket stats, not a floor or a dinner service pulse |
| Setup is merchant/vertical heavy | A single bistro pays for concepts (branches, agents, services) it doesn’t use |
| WhatsApp-first communication | Great for guests, but a live self-serve ticket is lower latency and free |
| Waiting Plus monetization | Fairness becomes a paid feature; a small restaurant may not want that |
| Customer accounts and OAuth | Unnecessary friction for a 30-minute wait |
| No public API contract for a single restaurant | Hard to embed in a restaurant’s own site or POS |

The reference product is a **queue platform**. AntriQ is a **restaurant flow tool**: the table is the unit, the host is the operator, the owner needs service evidence, and the guest needs a calm answer.

## 5. Feature parity & divergence

| Capability | WaitHub (observed) | AntriQ v1 | Notes |
| --- | --- | --- | --- |
| Guest joins without account | Yes | Yes | Capability ticket instead of customer auth |
| Party size | Service bucket | Party size + max | Explicit 1…N |
| Date selection | Yes (booking date) | Today only | Reservations on roadmap |
| Live now-serving | Yes | Yes | Same idea |
| Live position / ETA | Ticket UI | Yes, fit-aware ETA | AntriQ filters by table fit |
| WhatsApp notification | Yes | No (live link) | Roadmap v0.2 |
| Table inventory | Not visible | Yes | Core differentiator |
| Best-fit table suggestion | No | Yes | Smallest fitting table |
| Table lifecycle | No | Yes | available → seated → dirty → available |
| Greeter hold timer | ExpressCalling feature | Yes | Countdown + extend + acknowledge |
| No-show policy | Not visible | Yes | Auto/no-show + rate |
| Walk-in add | Onsite QR | Yes | Host can add while paused |
| Pause waitlist | Not visible | Yes | With reason |
| Owner floor view | No | Yes | Zone map + activity |
| Reports | Generic SLA/branch | Restaurant wait/turn/no-show | Focused |
| CSV export | Reports | Yes | 90-day window |
| QR poster | Dynamic QR feature | Yes | Print A4 |
| Paid priority | Waiting Plus | No | Deliberate fairness choice |
| Multi-vertical | Yes | No | Single restaurant |
| Multi-language | i18next | English v1 | Roadmap |
| Diner accounts | Google / customer auth | No | Simpler |
| Real-time transport | Pusher | Polling | Lower ops cost |

## 6. Technical observations (for context, not reuse)

| Layer | Observation |
| --- | --- |
| Customer web | Vite SPA (`/static/js/index-*.js`), React, Mantine, i18next, Pusher, Cloudflare Turnstile, Google GSI |
| Merchant dashboard | Separate Vite SPA (`dashboard.waithub.id`), React 18 + Mantine |
| API | `aether.waithub.id`, JSON, CORS enabled, public read endpoints for merchant/service |
| Images | Google Cloud Storage + `merchant.antrique.com` |
| Realtime | Pusher channels with `/pusher/auth` and `/pusher/user-auth` |
| Delivery | Cloudflare in front, WhatsApp notifications |
| Domain model | merchant → service (party-size bucket) → queue → ticket; branch/agent in dashboard |
| Auth | Customer OAuth/accounts; merchant username/password |

None of these implementation details are copied. They informed decisions such as: use a public-first guest page, brand per restaurant, keep the ticket URL as identity, and treat notifications as a later channel.

## 7. Decisions AntriQ makes differently

1. **Table-first model.** `dining_tables` with capacity and status; service buckets are gone. The host sees a floor, not a counter.
2. **One queue per restaurant.** Party size is an attribute of the entry; no separate service queues to reconcile.
3. **Fit-aware call and ETA.** The next call skips parties no free table can seat; ETA filters tables by party size.
4. **A real hold lifecycle.** Call → hold countdown → acknowledge → seat/no-show; the table is released when the promise expires.
5. **Owner metrics that match restaurant language.** Avg wait, avg turn, no-show rate, floor occupancy, walk-ins vs remote joins.
6. **No diner account.** A 144-bit capability link replaces OAuth, email, and a customer profile.
7. **No paid priority in v1.** A small restaurant’s fairness is the product; monetization is a subscription, not queue-jumping.
8. **Operational simplicity.** One Next.js deploy, one Postgres, polling instead of a realtime vendor.
9. **Open, testable SQL.** Plain schema + pure queue rules; the product can be audited and extended by its owner.

## 8. What we would still borrow conceptually

- A **date picker** for future reservations (not bookings today).
- **Per-merchant accent branding** — already implemented (`accent`).
- **WhatsApp templates** — the correct notification channel for Indonesia.
- **A QR-first entry point** — already implemented (printable poster).
- **Feature flags** for progressive rollout of reservations, deposits, and kiosk mode.
- **SLA reporting** — AntriQ’s wait/turn metrics are the restaurant equivalent.

## 9. Method & ethics

- Only public pages and unauthenticated read endpoints were observed.
- No attempt was made to bypass authentication, enumerate private merchant data, or create tickets in a live merchant’s queue.
- No customer PII was collected. The public endpoint payloads used for shape analysis contained merchant/service metadata.
- No code, CSS, images, copy, or brand assets were copied.
- The product name **AntriQ** and its copy are original.
- The analysis is dated; the reference product may change.

If you are the owner of the reference product and believe something here is inaccurate, open an issue and we will correct it.
