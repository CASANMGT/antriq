# Migrating v0.2 → v0.3 (multi-brand, multi-branch)

v0.3 replaces the single `restaurant` table with `brands` → `branches` and adds
`branch_id` to every operational table. There is **no in-place migration** from
the v0.2 demo schema: the safest path for a demo/staging/production database is
a one-time reset followed by the new seed.

## 1. Back up anything you need

The v0.2 database contains only demo data in this project. If you have real
data, export it first:

```bash
pg_dump "$DATABASE_URL" --no-owner --no-acl > antriq-v0.2-backup.sql
```

## 2. Point at the target database

Use the pooled connection string of the **specific** environment:

```bash
export DATABASE_URL="postgres://…"
```

Never run the reset against a shared staging/production database by accident.
The script prints the host and database name before doing anything.

## 3. Reset the public schema (or let v0.3 migrate automatically)

**Automatic:** on first boot, v0.3 detects a legacy `public.restaurant` table and
moves the old tables and their indexes into a `antriq_v2_backup` schema before
creating the new model. Data is preserved, not dropped. This is a no-op on a
fresh v0.3 database.

**Manual:** for a clean slate (or if you prefer a reset):

```bash
npm run db:reset -- --yes
```

This runs:

```sql
drop schema if exists public cascade;
create schema public;
grant all on schema public to public;
```

The app creates `brands`, `branches`, `staff`, `dining_tables`, `queue_entries`,
`queue_sequence` and `activity` on the next request, then seeds the demo.

## 4. Verify

```bash
curl -s https://your-app.example/api/health
# {"ok":true,"service":"antriq","time":"…"}
```

Open:

- `/b/nikumaru/senopati` — primary demo branch
- `/b/nikumaru/kemang` — second Nikumaru branch
- `/b/tenka/senopati` — Tenka branch
- `/login` — platform owner Rani / `2468`

## 5. Production and staging

| Environment | Vercel | Database | `NEXT_PUBLIC_APP_URL` |
| --- | --- | --- | --- |
| Production | `antriq1` project | Neon production database (Singapore) | `https://antriq1.vercel.app` |
| Staging | Preview or separate project | Separate Neon branch/project | staging URL |

- Use a different `AUTH_SECRET` for each environment.
- Keep `vercel.json` `regions: ["sin1"]` and the Neon primary region in Singapore.
- Set `DEMO_MODE=1` only where you want the lived-in demo queue. Without it, the
  demo brands/branches/staff/tables are still created on an empty database, but
  the queue starts empty.

## 6. What changed in the data model

| v0.2 | v0.3 |
| --- | --- |
| `restaurant` | `brands` + `branches` |
| `staff` (owner/greeter) | `staff` (+ `cashier`, `brand_id`, `branch_id`) |
| `dining_tables` | + `branch_id` |
| `queue_entries` | + `branch_id`, `seat_number`, `opened_by`, `opened_by_staff_id` |
| `queue_sequence` | keyed by `(branch_id, day)` |
| `activity` | + `branch_id` |

Brand logo/menu bytes live on `brands.logo_data` / `brands.menu_data`.
