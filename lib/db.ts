import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import { SCHEMA_STATEMENTS } from "./schema";
import { seedDatabase } from "./seed";

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
      connect_timeout: 15,
      prepare: false,
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

async function initialize(db: Database) {
  if (db.kind === "postgres") {
    await db.tx(async (q) => {
      // Serialize first boot across serverless instances.
      await q.query("select pg_advisory_xact_lock(918273645)");
      await applySchema(q);
      await seedDatabase(q);
    });
  } else {
    await applySchema(db);
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
