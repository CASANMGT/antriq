import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import { SCHEMA_STATEMENTS } from "./schema";
import { hashPin } from "./pin";
import { logoNikumaru, logoTenka, seedDatabase } from "./seed";

export interface Queryable {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
}

export interface Database extends Queryable {
  kind: "postgres" | "pglite";
  tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

let instance: Database | null = null;
let readyPromise: Promise<Database> | null = null;

function createDatabase(): Database {
  const url = process.env.DATABASE_URL;

  if (!url && process.env.NODE_ENV === "production" && !process.env.PGLITE_DATA_DIR) {
    throw new Error(
      "DATABASE_URL is required in production. Connect a Postgres database (Neon, Supabase or Vercel Postgres) and redeploy.",
    );
  }

  if (url) {
    const sql = postgres(url, {
      max: 5,
      idle_timeout: 20,
      max_lifetime: 60 * 15,
      connect_timeout: 15,
      prepare: false,
      connection: { application_name: "antriq" },
      onnotice: () => {
        // CREATE TABLE IF NOT EXISTS is intentionally idempotent; suppress
        // expected "already exists, skipping" notices on every cold start.
      },
    });

    const query: Queryable["query"] = async <T>(text: string, params?: unknown[]) => {
      const rows = await sql.unsafe(text, (params ?? []) as never[]);
      return rows as unknown as T[];
    };

    return {
      kind: "postgres",
      query,
      async tx<T>(fn: (q: Queryable) => Promise<T>) {
        return sql.begin(async (tx) => {
          const scoped: Queryable = {
            query: async <R>(text: string, params?: unknown[]) => {
              const rows = await tx.unsafe(text, (params ?? []) as never[]);
              return rows as unknown as R[];
            },
          };
          return fn(scoped);
        }) as Promise<T>;
      },
      async close() {
        await sql.end({ timeout: 5 });
      },
    };
  }

  const configured = process.env.PGLITE_DATA_DIR;
  const dataDir =
    configured === "memory://"
      ? undefined
      : configured ?? (process.env.VERCEL ? "/tmp/antriq-pglite" : ".data/pglite");

  if (process.env.VERCEL && !configured) {
    console.warn(
      "[antriq] DATABASE_URL is not set. Falling back to an ephemeral PGlite database in /tmp — data is per-instance and will be lost. Connect Postgres for a real deployment.",
    );
  }

  if (dataDir) {
    try {
      mkdirSync(dataDir, { recursive: true });
    } catch {
      // PGlite will report a clearer error if the directory truly can't be used.
    }
  }

  const pglite = new PGlite(dataDir);

  const query: Queryable["query"] = async <T>(text: string, params?: unknown[]) => {
    const result = await pglite.query(text, (params ?? []) as never[]);
    return result.rows as unknown as T[];
  };

  return {
    kind: "pglite",
    query,
    async tx<T>(fn: (q: Queryable) => Promise<T>) {
      return pglite.transaction(async (tx) => {
        const scoped: Queryable = {
          query: async <R>(text: string, params?: unknown[]) => {
            const result = await tx.query(text, (params ?? []) as never[]);
            return result.rows as unknown as R[];
          },
        };
        return fn(scoped);
      });
    },
    async close() {
      await pglite.close();
    },
  };
}

async function applySchema(db: Queryable) {
  for (const statement of SCHEMA_STATEMENTS) {
    await db.query(statement);
  }
}

async function runDataMigrations(db: Queryable) {
  const inserted = await db.query<{ key: string }>(
    `insert into app_meta (key, value) values ('hold_minutes_3', 'done')
     on conflict (key) do nothing returning key`,
  );
  if (inserted.length > 0) {
    // v0.3 shipped with an 8-minute default; the product now uses 3 minutes.
    await db.query("update branches set hold_minutes = 3 where hold_minutes = 8");
  }

  const paused = await db.query<{ key: string }>(
    `insert into app_meta (key, value) values ('acknowledged_null_hold', 'done')
     on conflict (key) do nothing returning key`,
  );
  if (paused.length > 0) {
    // Demo/legacy called entries with no expiry are already "at the door";
    // mark them acknowledged so the new countdown shows as paused, not 0:00.
    await db.query(
      "update queue_entries set acknowledged = true where status = 'called' and hold_expires_at is null",
    );
  }

  const brandStructure = await db.query<{ key: string }>(
    `insert into app_meta (key, value) values ('brand_structure_v2', 'done')
     on conflict (key) do nothing returning key`,
  );
  if (brandStructure.length > 0) {    await db.query(
      `update brands set name = 'Nikumaru', instagram = '@nikumaru.id',
         description = 'Japanese beef hamburg & niku rice. No pork, no lard, no mirin. Blok M and Tebet, Jakarta.'
       where slug = 'nikumaru'`,
    );
    await db.query(
      `update brands set name = 'Tenka', instagram = '@tenka.idn',
         description = 'Halal-certified tempura & katsu house. AEON Mall Tanjung Barat, Bintaro Xchange Mall 2, and KAMAJA Social Space.'
       where slug = 'tenka'`,
    );

    const updates = [
      {
        brand: "nikumaru",
        oldSlug: "senopati",
        name: "Nikumaru Blok M",
        slug: "blok-m",
        tagline: "Japanese Hamburg & Niku Rice · Blok M",
        address:
          "Jl. Sunan Kalijaga No. 1, RT.1/RW.1, Melawai, Kebayoran Baru, Jakarta Selatan 12160 (seberang Taman Literasi, samping M Bloc Space)",
        openTime: "10:00",
        closeTime: "22:00",
      },
      {
        brand: "nikumaru",
        oldSlug: "kemang",
        name: "Nikumaru Tebet",
        slug: "tebet",
        tagline: "Japanese Hamburg & Niku Rice · Tebet",
        address: "Jl. Tebet Raya, Tebet Barat, Tebet, Jakarta Selatan 12810",
        openTime: "10:00",
        closeTime: "22:00",
      },
      {
        brand: "tenka",
        oldSlug: "senopati",
        name: "Tenka KAMAJA",
        slug: "kamaja",
        tagline: "Tempura & Katsu · KAMAJA Social Space",
        address:
          "KAMAJA Social Space, Jl. Kyai Maja No. 70, Kramat Pela, Kebayoran Baru, Jakarta Selatan 12120",
        openTime: "10:00",
        closeTime: "22:00",
      },
    ];
    for (const update of updates) {
      await db.query(
        `update branches set name=$1, slug=$2, tagline=$3, address=$4, open_time=$5, close_time=$6, updated_at=now()
         where brand_id = (select id from brands where slug=$7) and slug=$8
           and not exists (
             select 1 from branches existing
             where existing.brand_id = branches.brand_id and existing.slug = $2
           )`,
        [update.name, update.slug, update.tagline, update.address, update.openTime, update.closeTime, update.brand, update.oldSlug],
      );
    }

    const newBranches = [
      {
        name: "Tenka AEON Tanjung Barat",
        slug: "aeon-tanjung-barat",
        tagline: "Tempura & Katsu · AEON Mall Tanjung Barat",
        address:
          "AEON Mall Tanjung Barat, Jl. Lenteng Agung Raya No. 163, RT.1/RW.1, Tanjung Barat, Jagakarsa, Jakarta Selatan 12530",
        phone: "+62 811 9000 414",
      },
      {
        name: "Tenka Bintaro Xchange",
        slug: "bintaro-xchange",
        tagline: "Tempura & Katsu · Bintaro Xchange Mall 2",
        address:
          "Bintaro Jaya Xchange Mall 2, Lantai FF Unit FF-F-09, Jl. Boulevard Bintaro Jaya No. 2, Pondok Jaya, Pondok Aren, Tangerang Selatan 15227",
        phone: "+62 811 9000 515",
      },
    ];
    for (const branch of newBranches) {
      await db.query(
        `insert into branches
          (brand_id, name, slug, tagline, address, phone, timezone, open_time, close_time, accent, seating_mode)
         select id, $1, $2, $3, $4, $5, 'Asia/Jakarta', '10:00', '22:00', '#E3A02D', 'manual'
         from brands where slug = 'tenka'
         on conflict (brand_id, slug) do nothing`,
        [branch.name, branch.slug, branch.tagline, branch.address, branch.phone],
      );
    }
  }

  const staffPin = await db.query<{ key: string }>(
    `insert into app_meta (key, value) values ('staff_pin_1234', 'done')
     on conflict (key) do nothing returning key`,
  );
  if (staffPin.length > 0) {
    // Demo passcode: everyone signs in with 1234 until real PINs are assigned.
    await db.query("update staff set pin_hash = $1", [hashPin("1234")]);
  }

  const staffNames = await db.query<{ key: string }>(
    `insert into app_meta (key, value) values ('staff_names_v1', 'done')
     on conflict (key) do nothing returning key`,
  );
  if (staffNames.length > 0) {
    await db.query("update staff set name = 'Iwanna', initials = 'IW' where name in ('Rani Wijaya', 'Rani')");
    await db.query("update staff set name = 'Wuri', initials = 'WU' where name in ('Ayu Lestari', 'Ayu')");
  }

  const legacyBranches = await db.query<{ key: string }>(
    `insert into app_meta (key, value) values ('cleanup_legacy_branches_v1', 'done')
     on conflict (key) do nothing returning key`,
  );
  if (legacyBranches.length > 0) {
    // Remove the pre-correction duplicates now that the canonical branches exist.
    await db.query(
      `delete from branches br
       using brands b
       where br.brand_id = b.id
         and (
           (b.slug = 'nikumaru' and br.slug in ('senopati', 'kemang')
             and exists (select 1 from branches c where c.brand_id = br.brand_id and c.slug in ('blok-m', 'tebet')))
           or
           (b.slug = 'tenka' and br.slug = 'senopati'
             and exists (select 1 from branches c where c.brand_id = br.brand_id and c.slug = 'kamaja'))
         )`,
    );
  }

  const brandLogos = await db.query<{ key: string }>(
    `insert into app_meta (key, value) values ('brand_logos_v2', 'done')
     on conflict (key) do nothing returning key`,
  );
  if (brandLogos.length > 0) {
    await db.query("update brands set logo_data = $1, logo_mime = 'image/svg+xml', updated_at = now() where slug = 'nikumaru'", [
      Buffer.from(logoNikumaru()),
    ]);
    await db.query("update brands set logo_data = $1, logo_mime = 'image/svg+xml', updated_at = now() where slug = 'tenka'", [
      Buffer.from(logoTenka()),
    ]);
  }

  const circleLogos = await db.query<{ key: string }>(
    `insert into app_meta (key, value) values ('brand_logos_circle_v1', 'done')
     on conflict (key) do nothing returning key`,
  );
  if (circleLogos.length > 0) {
    await db.query("update brands set logo_data = $1, logo_mime = 'image/svg+xml', updated_at = now() where slug = 'nikumaru'", [
      Buffer.from(logoNikumaru()),
    ]);
    await db.query("update brands set logo_data = $1, logo_mime = 'image/svg+xml', updated_at = now() where slug = 'tenka'", [
      Buffer.from(logoTenka()),
    ]);
  }

  const queueMode = await db.query<{ key: string }>(
    `insert into app_meta (key, value) values ('seating_queue_default_v1', 'done')
     on conflict (key) do nothing returning key`,
  );
  if (queueMode.length > 0) {
    await db.query("update branches set seating_mode = 'queue' where seating_mode = 'manual'");
  }

  const branchCoordinates = await db.query<{ key: string }>(
    `insert into app_meta (key, value) values ('branch_coordinates_v1', 'done')
     on conflict (key) do nothing returning key`,
  );
  if (branchCoordinates.length > 0) {
    const points: Array<[string, number, number]> = [
      ["blok-m", -6.2423253, 106.7997002],
      ["tebet", -6.2301344, 106.8522128],
      ["aeon-tanjung-barat", -6.3061495, 106.8403831],
      ["bintaro-xchange", -6.2840882, 106.7273494],
      ["kamaja", -6.2415471, 106.7918167],
    ];
    for (const [slug, latitude, longitude] of points) {
      await db.query(
        `update branches set latitude = $2, longitude = $3
         where slug = $1 and (latitude is null or longitude is null)`,
        [slug, latitude, longitude],
      );
    }
  }

  const maxParty = await db.query<{ key: string }>(
    `insert into app_meta (key, value) values ('max_party_size_10_v1', 'done')
     on conflict (key) do nothing returning key`,
  );
  if (maxParty.length > 0) {
    // Product default is now 10 guests per party; migrate the old default of 12.
    await db.query("update branches set max_party_size = 10 where max_party_size = 12");
  }

  const tebetHours = await db.query<{ key: string }>(
    `insert into app_meta (key, value) values ('tebet_hours_10_22_v1', 'done')
     on conflict (key) do nothing returning key`,
  );
  if (tebetHours.length > 0) {
    await db.query("update branches set open_time = '10:00', close_time = '22:00' where slug = 'tebet'");
  }

  const splitDefault = await db.query<{ key: string }>(
    `insert into app_meta (key, value) values ('queue_split_default_v1', 'done')
     on conflict (key) do nothing returning key`,
  );
  if (splitDefault.length > 0) {
    // A/B queue groups are now the default; existing single queues join them.
    await db.query("update branches set queue_mode = 'split' where queue_mode = 'single'");
  }

  const genericStaff = await db.query<{ key: string }>(
    `insert into app_meta (key, value) values ('generic_staff_names_v1', 'done')
     on conflict (key) do nothing returning key`,
  );
  if (genericStaff.length > 0) {
    const rows = await db.query<{
      id: number;
      role: string;
      brand_name: string | null;
      branch_name: string | null;
    }>(
      `select s.id, s.role, b.name as brand_name, br.name as branch_name
       from staff s
       left join brands b on b.id = s.brand_id
       left join branches br on br.id = s.branch_id
       order by s.id`,
    );
    const counts = new Map<string, number>();
    for (const row of rows) {
      const brand = row.brand_name ? String(row.brand_name) : null;
      const branch = row.branch_name ? String(row.branch_name) : null;
      let label: string;
      if (row.role === "owner") {
        label = branch ? `Owner ${branch}` : brand ? `Owner ${brand}` : "Owner";
      } else if (branch) {
        const shortBranch = brand && branch.startsWith(`${brand} `) ? branch.slice(brand.length + 1) : branch;
        label = `Host ${shortBranch}`;
      } else {
        label = brand ? `Host ${brand}` : "Host";
      }
      const count = (counts.get(label) ?? 0) + 1;
      counts.set(label, count);
      const name = count === 1 ? label : `${label} ${count}`;
      const words = name.split(" ").filter(Boolean);
      const initials = `${words[0]?.[0] ?? "?"}${words[1]?.[0] ?? ""}`.toUpperCase();
      await db.query("update staff set name = $2, initials = $3 where id = $1", [row.id, name, initials]);
    }
  }
}

const LEGACY_TABLES = [
  "activity",
  "queue_sequence",
  "queue_entries",
  "dining_tables",
  "staff",
  "restaurant",
];

/**
 * v0.2 used a single `restaurant` table. Move the old tables (and their
 * indexes/constraints) into a separate schema so the v0.3 brands/branches
 * tables can be created without name collisions. Data is preserved, not
 * dropped, and this is a no-op on a fresh v0.3 database.
 */
async function migrateLegacySchema(db: Queryable) {
  const rows = await db.query<{ legacy: string | null; current: string | null }>(
    "select to_regclass('public.restaurant')::text as legacy, to_regclass('public.brands')::text as current",
  );
  if (!rows[0]?.legacy || rows[0]?.current) return;

  await db.query("create schema if not exists antriq_v2_backup");
  for (const table of LEGACY_TABLES) {
    await db.query(`alter table if exists public.${table} set schema antriq_v2_backup`);
  }
}

async function initialize(db: Database) {
  if (db.kind === "postgres") {
    await db.tx(async (q) => {
      // Serialize first boot across serverless instances.
      await q.query("select pg_advisory_xact_lock(918273645)");
      await migrateLegacySchema(q);
      await applySchema(q);
      await runDataMigrations(q);
      await seedDatabase(q);
    });
  } else {
    await migrateLegacySchema(db);
    await applySchema(db);
    await runDataMigrations(db);
    await seedDatabase(db);
  }
}

export async function ready(): Promise<Database> {
  if (!readyPromise) {
    const db = (instance ??= createDatabase());
    readyPromise = initialize(db)
      .then(() => db)
      .catch((error) => {
        readyPromise = null;
        throw error;
      });
  }
  return readyPromise;
}

export async function q<T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const db = await ready();
  return db.query<T>(text, params);
}

export async function tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T> {
  const db = await ready();
  return db.tx(fn);
}

export async function closeDatabase(): Promise<void> {
  if (instance) {
    await instance.close();
    instance = null;
  }
  readyPromise = null;
}

export async function resetDatabaseForTests(): Promise<void> {
  await closeDatabase();
}
