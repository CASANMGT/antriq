#!/usr/bin/env node
/**
 * Reset a database to an empty public schema.
 *
 * The v0.3 brands/branches model is not compatible with the v0.2
 * single-restaurant schema, so a demo deployment must be reset once.
 *
 * Usage:
 *   DATABASE_URL=postgres://... npm run db:reset -- --yes
 *
 * The app re-creates the schema and seeds the demo on the next request.
 */
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

if (!process.argv.includes("--yes")) {
  console.error(
    "This drops the entire public schema. Re-run with `-- --yes` once you are sure.",
  );
  process.exit(1);
}

const target = (() => {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return "the configured database";
  }
})();

console.log(`Resetting ${target} …`);
const sql = postgres(url, { max: 1, prepare: false });
try {
  await sql.unsafe("drop schema if exists public cascade");
  await sql.unsafe("create schema public");
  await sql.unsafe("grant all on schema public to public");
  console.log("Schema reset. The app will create tables and seed demo data on first boot.");
} finally {
  await sql.end({ timeout: 5 });
}
