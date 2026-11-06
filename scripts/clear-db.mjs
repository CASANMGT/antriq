#!/usr/bin/env node
/**
 * Clear live queue data without deleting brands, branches, staff or tables.
 * Use this before a service, after a demo, or when onboarding a real venue.
 *
 * Usage:
 *   DATABASE_URL=postgres://... npm run db:clear -- --yes
 */
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}
if (!process.argv.includes("--yes")) {
  console.error("This deletes all queue entries and activity. Re-run with `-- --yes`.");
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false });
try {
  await sql.begin(async (tx) => {
    await tx.unsafe("delete from activity");
    await tx.unsafe("delete from queue_entries");
    await tx.unsafe("delete from queue_sequence");
    await tx.unsafe("update dining_tables set status = 'available', status_changed_at = now()");
  });
  console.log("Queue, activity and table state cleared. Brands, branches, staff and tables kept.");
} finally {
  await sql.end({ timeout: 5 });
}
