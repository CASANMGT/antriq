import { hashPin } from "./pin";
import type { Queryable } from "./db";
import { dayInTz } from "./time";

export const DEMO_RESTAURANT = {
  name: "Sage & Ember",
  tagline: "Wood-fired bistro · Senopati",
  address: "Jl. Senopati No. 21, Kebayoran Baru, Jakarta",
  phone: "+62 811 9000 212",
  instagram: "@sageandember",
  timezone: "Asia/Jakarta",
  openTime: "11:00",
  closeTime: "23:30",
  accent: "#C8452B",
  announcement:
    "Welcome to Sage & Ember. Join the waitlist from your phone — we'll let you know the moment your table is ready.",
};

const STAFF_SEED = [
  { name: "Rani Wijaya", role: "owner", pin: "2468", initials: "RW" },
  { name: "Ayu Lestari", role: "greeter", pin: "1357", initials: "AL" },
  { name: "Bima Pratama", role: "greeter", pin: "1122", initials: "BP" },
];

const TABLES_SEED = [
  { label: "T1", capacity: 2, zone: "Main dining", sort: 1 },
  { label: "T2", capacity: 2, zone: "Main dining", sort: 2 },
  { label: "T3", capacity: 4, zone: "Main dining", sort: 3 },
  { label: "T4", capacity: 4, zone: "Main dining", sort: 4 },
  { label: "T5", capacity: 4, zone: "Main dining", sort: 5 },
  { label: "T6", capacity: 6, zone: "Main dining", sort: 6 },
  { label: "T7", capacity: 6, zone: "Main dining", sort: 7 },
  { label: "T8", capacity: 8, zone: "Main dining", sort: 8 },
  { label: "P1", capacity: 2, zone: "Terrace", sort: 9 },
  { label: "P2", capacity: 4, zone: "Terrace", sort: 10 },
  { label: "P3", capacity: 4, zone: "Terrace", sort: 11 },
  { label: "P4", capacity: 6, zone: "Terrace", sort: 12 },
  { label: "C1", capacity: 1, zone: "Counter", sort: 13 },
  { label: "C2", capacity: 1, zone: "Counter", sort: 14 },
];

export function isDemoMode(): boolean {
  return ["1", "true", "yes", "on"].includes((process.env.DEMO_MODE ?? "").toLowerCase());
}

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function isoMinutesFromNow(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

export async function seedDatabase(db: Queryable): Promise<void> {
  const existing = await db.query<{ count: string }>("select count(*)::text as count from restaurant");
  if (Number(existing[0]?.count ?? 0) === 0) {
    await db.query(
      `insert into restaurant
        (id, name, tagline, address, phone, instagram, timezone, open_time, close_time, accent,
         announcement, waitlist_status, avg_turn_minutes, hold_minutes, max_party_size, max_queue_size)
       values (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'open', 55, 8, 12, 40)
       on conflict (id) do nothing`,
      [
        DEMO_RESTAURANT.name,
        DEMO_RESTAURANT.tagline,
        DEMO_RESTAURANT.address,
        DEMO_RESTAURANT.phone,
        DEMO_RESTAURANT.instagram,
        DEMO_RESTAURANT.timezone,
        DEMO_RESTAURANT.openTime,
        DEMO_RESTAURANT.closeTime,
        DEMO_RESTAURANT.accent,
        DEMO_RESTAURANT.announcement,
      ],
    );
  }

  const staff = await db.query<{ count: string }>("select count(*)::text as count from staff");
  if (Number(staff[0]?.count ?? 0) === 0) {
    for (const person of STAFF_SEED) {
      await db.query(
        `insert into staff (name, role, pin_hash, initials) values ($1, $2, $3, $4)`,
        [person.name, person.role, hashPin(person.pin), person.initials],
      );
    }
  }

  const tables = await db.query<{ count: string }>("select count(*)::text as count from dining_tables");
  if (Number(tables[0]?.count ?? 0) === 0) {
    for (const table of TABLES_SEED) {
      await db.query(
        `insert into dining_tables (label, capacity, zone, sort_order) values ($1, $2, $3, $4)`,
        [table.label, table.capacity, table.zone, table.sort],
      );
    }
  }

  if (!isDemoMode()) return;

  const today = dayInTz(new Date(), DEMO_RESTAURANT.timezone);
  const todays = await db.query<{ count: string }>(
    "select count(*)::text as count from queue_entries where day = $1::date",
    [today],
  );
  if (Number(todays[0]?.count ?? 0) > 0) return;

  // Demo mode resets the floor each new day so a stale demo never greets visitors.
  await db.query("delete from activity");
  await db.query("delete from queue_entries");
  await db.query("update dining_tables set status = 'available', status_changed_at = now()");

  const tableRows = await db.query<{ id: number; label: string }>("select id, label from dining_tables");
  const tableId = (label: string) => tableRows.find((row) => row.label === label)?.id ?? null;

  const demo = [
    {
      seq: 1, code: "A-001", name: "Joaquin Reyes", party: 2, phone: "+62 812 1111 0101",
      source: "qr", status: "waiting", joined: 34, notes: "Window seat if possible",
    },
    {
      seq: 2, code: "A-002", name: "Mira Santoso", party: 4, phone: "+62 812 1111 0102",
      source: "online", status: "waiting", joined: 27, notes: null,
    },
    {
      seq: 3, code: "A-003", name: "Daniel Park", party: 2, phone: "+62 812 1111 0103",
      source: "qr", status: "waiting", joined: 19, notes: null,
    },
    {
      seq: 4, code: "A-004", name: "The Oka Family", party: 6, phone: "+62 812 1111 0104",
      source: "qr", status: "waiting", joined: 11, notes: "One high chair, please",
    },
    {
      seq: 5, code: "A-005", name: "Clara Nguyen", party: 3, phone: "+62 812 1111 0105",
      source: "online", status: "called", joined: 22, notes: "Celebrating a birthday",
      called: 2, table: null,
    },
    {
      seq: 6, code: "A-006", name: "Ben Hartono", party: 2, phone: "+62 812 1111 0106",
      source: "qr", status: "seated", joined: 55, notes: null, seated: 38, table: "T4",
    },
    {
      seq: 7, code: "A-007", name: "Sari & Dimas", party: 4, phone: "+62 812 1111 0107",
      source: "qr", status: "seated", joined: 48, notes: "Anniversary", seated: 31, table: "P2",
    },
    {
      seq: 8, code: "A-008", name: "Noah Lim", party: 6, phone: "+62 812 1111 0108",
      source: "online", status: "seated", joined: 70, notes: null, seated: 50, table: "T7",
    },
    {
      seq: 9, code: "A-009", name: "Emma Wijaya", party: 2, phone: "+62 812 1111 0109",
      source: "qr", status: "completed", joined: 120, notes: null, seated: 95, closed: 50, table: "T2",
    },
    {
      seq: 10, code: "A-010", name: "Arif Setiawan", party: 8, phone: "+62 812 1111 0110",
      source: "online", status: "no_show", joined: 90, notes: null, called: 80, closed: 72, table: null,
    },
    {
      seq: 11, code: "A-011", name: "Nadia Kusuma", party: 2, phone: "+62 812 1111 0111",
      source: "qr", status: "cancelled", joined: 100, notes: null, closed: 88, table: null,
    },
    {
      seq: 12, code: "A-012", name: "Priya Nair", party: 2, phone: "+62 812 1111 0112",
      source: "qr", status: "waiting", joined: 7, notes: null,
    },
    {
      seq: 13, code: "A-013", name: "Tom Bakker", party: 3, phone: "+62 812 1111 0113",
      source: "online", status: "waiting", joined: 3, notes: "Bar seat is fine",
    },
    {
      seq: 14, code: "A-014", name: "Luca Moretti", party: 4, phone: "+62 812 1111 0114",
      source: "qr", status: "seated", joined: 47, notes: null, seated: 22, table: "T3",
    },
    {
      seq: 15, code: "A-015", name: "Nina Halim", party: 3, phone: "+62 812 1111 0115",
      source: "qr", status: "seated", joined: 62, notes: "No shellfish", seated: 18, table: "T5",
    },
    {
      seq: 16, code: "A-016", name: "Omar Haddad", party: 4, phone: "+62 812 1111 0116",
      source: "online", status: "seated", joined: 44, notes: null, seated: 12, table: "P3",
    },
    {
      seq: 17, code: "A-017", name: "Grace Tan", party: 6, phone: "+62 812 1111 0117",
      source: "qr", status: "seated", joined: 58, notes: "Birthday cake in the fridge", seated: 8, table: "P4",
    },
    {
      seq: 18, code: "A-018", name: "Sam Rivera", party: 1, phone: "+62 812 1111 0118",
      source: "walkin", status: "seated", joined: 30, notes: null, seated: 5, table: "C1",
    },
    {
      seq: 19, code: "A-019", name: "Theo Lim", party: 2, phone: "+62 812 1111 0119",
      source: "qr", status: "completed", joined: 150, notes: null, seated: 120, closed: 78, table: "T1",
    },
    {
      seq: 20, code: "A-020", name: "Iris Chen", party: 2, phone: "+62 812 1111 0120",
      source: "online", status: "completed", joined: 160, notes: null, seated: 135, closed: 95, table: "P1",
    },
    {
      seq: 21, code: "A-021", name: "Will Tan", party: 2, phone: "+62 812 1111 0121",
      source: "qr", status: "seated", joined: 40, notes: null, seated: 20, table: "T1",
    },
    {
      seq: 22, code: "A-022", name: "Zoe Park", party: 2, phone: "+62 812 1111 0122",
      source: "qr", status: "seated", joined: 36, notes: null, seated: 16, table: "P1",
    },
    {
      seq: 23, code: "A-023", name: "Hana Sato", party: 2, phone: "+62 812 1111 0123",
      source: "qr", status: "completed", joined: 180, notes: null, seated: 140, closed: 110, table: "T6",
    },
    {
      seq: 24, code: "A-024", name: "Ravi Menon", party: 4, phone: "+62 812 1111 0124",
      source: "online", status: "completed", joined: 200, notes: null, seated: 165, closed: 125, table: "T5",
    },
    {
      seq: 25, code: "A-025", name: "Elena Rossi", party: 6, phone: "+62 812 1111 0125",
      source: "qr", status: "completed", joined: 210, notes: null, seated: 175, closed: 130, table: "P4",
    },
  ] as const;

  for (const item of demo) {
    const joinedAt = isoMinutesAgo(item.joined);
    const calledAt = "called" in item && item.called ? isoMinutesAgo(item.called) : null;
    const holdExpiresAt =
      item.status === "called" ? isoMinutesFromNow(6) : null;
    const seatedAt = "seated" in item && item.seated ? isoMinutesAgo(item.seated) : null;
    const closedAt = "closed" in item && item.closed ? isoMinutesAgo(item.closed) : null;
    const table = "table" in item ? item.table ?? null : null;

    await db.query(
      `insert into queue_entries
        (token, code, day, seq, guest_name, phone, party_size, notes, source, status,
         table_id, called_count, acknowledged, joined_at, called_at, hold_expires_at, seated_at, closed_at, cancelled_by)
       values ($1,$2,$3::date,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
      [
        `demo-${item.seq}-${today}`,
        item.code,
        today,
        item.seq,
        item.name,
        item.phone,
        item.party,
        item.notes,
        item.source,
        item.status,
        table ? tableId(table) : null,
        item.status === "called" ? 1 : 0,
        false,
        joinedAt,
        calledAt,
        holdExpiresAt,
        seatedAt,
        closedAt,
        item.status === "cancelled" ? "guest" : null,
      ],
    );
  }

  await db.query(
    `insert into queue_sequence (restaurant_id, day, last_seq) values (1, $1::date, 25)
     on conflict (restaurant_id, day) do update set last_seq = 25`,
    [today],
  );

  await db.query(
    `update dining_tables set status = 'seated', status_changed_at = now()
     where label in ('T4','P2','T7','T3','T5','P3','P4','C1','T1','P1')`,
  );
  await db.query(`update dining_tables set status = 'dirty', status_changed_at = now() where label = 'T2'`);

  const events = [
    { type: "join", code: "A-004", name: "The Oka Family", party: 6, actor: "Guest", minutes: 11, table: null, detail: "QR waitlist" },
    { type: "call", code: "A-005", name: "Clara Nguyen", party: 3, actor: "Ayu Lestari", minutes: 2, table: null, detail: "Table ready" },
    { type: "seat", code: "A-006", name: "Ben Hartono", party: 2, actor: "Ayu Lestari", minutes: 38, table: "T4", detail: "Seated" },
    { type: "clear", code: "A-009", name: "Emma Wijaya", party: 2, actor: "Bima Pratama", minutes: 50, table: "T2", detail: "Table cleared" },
    { type: "no_show", code: "A-010", name: "Arif Setiawan", party: 8, actor: "Ayu Lestari", minutes: 72, table: null, detail: "Did not arrive" },
    { type: "cancel", code: "A-011", name: "Nadia Kusuma", party: 2, actor: "Guest", minutes: 88, table: null, detail: "Cancelled by guest" },
  ];

  for (const event of events) {
    await db.query(
      `insert into activity (type, actor, detail, created_at)
       values ($1, $2, $3::jsonb, $4)`,
      [
        event.type,
        event.actor,
        JSON.stringify({
          code: event.code,
          name: event.name,
          partySize: event.party,
          tableLabel: event.table,
          note: event.detail,
        }),
        isoMinutesAgo(event.minutes),
      ],
    );
  }
}
