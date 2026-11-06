import { randomBytes } from "node:crypto";
import { q, tx, type Queryable } from "./db";
import {
  average,
  averageTurn,
  buildHourly,
  codeFor,
  estimateWaitMinutes,
  minutesBetween,
  noShowRate,
  orderWaiting,
  pickNext,
  positionOf,
  selectBestTable,
  statsFrom,
} from "./queue";
import { addDaysToDay, dayInTz, elapsedMinutes, isOpenAt, parseTimeToMinutes } from "./time";
import { isDemoMode, seedDatabase } from "./seed";
import type {
  ActionResult,
  ActivityItem,
  DayPoint,
  DiningTable,
  EntryStatus,
  HostState,
  OwnerOverview,
  PublicSnapshot,
  PublicStaff,
  QueueEntry,
  QueueSource,
  Restaurant,
  Role,
  TableStatus,
  TicketView,
  WaitlistStatus,
} from "./types";
import {
  AppError,
  cleanText,
  clampInt,
  validateAccent,
  validateGuestName,
  validateNotes,
  validatePartySize,
  validatePin,
  validateTableLabel,
  validateTime,
  validateZone,
  normalizePhone,
} from "./validation";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const ENTRY_COLUMNS = `
  qe.id, qe.token, qe.code, to_char(qe.day, 'YYYY-MM-DD') as day_text, qe.seq,
  qe.guest_name, qe.phone, qe.party_size, qe.notes, qe.source, qe.status,
  qe.table_id, qe.called_count, qe.acknowledged, qe.joined_at, qe.called_at,
  qe.hold_expires_at, qe.seated_at, qe.closed_at, qe.cancelled_by,
  t.label as table_label
`;

function toIso(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mapRestaurant(row: Row): Restaurant {
  return {
    id: toNumber(row.id, 1),
    name: String(row.name),
    tagline: row.tagline ?? null,
    address: row.address ?? null,
    phone: row.phone ?? null,
    instagram: row.instagram ?? null,
    timezone: String(row.timezone ?? "Asia/Jakarta"),
    openTime: String(row.open_time ?? "11:00"),
    closeTime: String(row.close_time ?? "23:30"),
    accent: String(row.accent ?? "#C8452B"),
    announcement: row.announcement ?? null,
    waitlistStatus: (row.waitlist_status ?? "open") as WaitlistStatus,
    pauseReason: row.pause_reason ?? null,
    avgTurnMinutes: toNumber(row.avg_turn_minutes, 55),
    holdMinutes: toNumber(row.hold_minutes, 8),
    maxPartySize: toNumber(row.max_party_size, 12),
    maxQueueSize: toNumber(row.max_queue_size, 40),
    autoNoShow: Boolean(row.auto_no_show),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString(),
  };
}

function mapTable(row: Row): DiningTable {
  return {
    id: toNumber(row.id),
    label: String(row.label),
    capacity: toNumber(row.capacity),
    zone: String(row.zone ?? "Main dining"),
    status: (row.status ?? "available") as TableStatus,
    statusChangedAt: toIso(row.status_changed_at) ?? new Date().toISOString(),
    sortOrder: toNumber(row.sort_order),
  };
}

function mapEntry(row: Row, tablesById: Map<number, string>, now = new Date()): QueueEntry {
  const joinedAt = toIso(row.joined_at) ?? now.toISOString();
  const seatedAt = toIso(row.seated_at);
  const calledAt = toIso(row.called_at);
  const closedAt = toIso(row.closed_at);
  const holdExpiresAt = toIso(row.hold_expires_at);
  const tableId = row.table_id === null || row.table_id === undefined ? null : toNumber(row.table_id);
  const waitUntil = seatedAt ?? closedAt ?? now.toISOString();

  return {
    id: toNumber(row.id),
    code: String(row.code),
    day: String(row.day_text ?? row.day ?? "").slice(0, 10),
    seq: toNumber(row.seq),
    guestName: String(row.guest_name),
    phone: row.phone ?? null,
    partySize: toNumber(row.party_size),
    notes: row.notes ?? null,
    source: (row.source ?? "qr") as QueueSource,
    status: (row.status ?? "waiting") as EntryStatus,
    tableId,
    tableLabel: row.table_label ?? (tableId ? tablesById.get(tableId) ?? null : null),
    calledCount: toNumber(row.called_count),
    acknowledged: Boolean(row.acknowledged),
    joinedAt,
    calledAt,
    holdExpiresAt,
    seatedAt,
    closedAt,
    cancelledBy: row.cancelled_by ?? null,
    waitMinutes: elapsedMinutes(joinedAt, waitUntil),
    calledMinutesAgo: calledAt ? elapsedMinutes(calledAt, now.toISOString()) : null,
    holdSecondsLeft: holdExpiresAt
      ? Math.max(0, Math.round((new Date(holdExpiresAt).getTime() - now.getTime()) / 1000))
      : 0,
  };
}

function tablesByIdMap(tables: DiningTable[]): Map<number, string> {
  return new Map(tables.map((table) => [table.id, table.label]));
}

async function logActivity(
  db: Queryable | null,
  type: string,
  actor: string | null,
  payload: {
    entryId?: number | null;
    tableId?: number | null;
    code?: string | null;
    name?: string | null;
    partySize?: number | null;
    tableLabel?: string | null;
    note?: string | null;
  },
  at?: string,
): Promise<void> {
  const runner: Queryable = db ?? { query: q };
  await runner.query(
    `insert into activity (type, entry_id, table_id, actor, detail, created_at)
     values ($1, $2, $3, $4, $5::jsonb, coalesce($6::timestamptz, now()))`,
    [
      type,
      payload.entryId ?? null,
      payload.tableId ?? null,
      actor,
      JSON.stringify({
        code: payload.code ?? null,
        name: payload.name ?? null,
        partySize: payload.partySize ?? null,
        tableLabel: payload.tableLabel ?? null,
        note: payload.note ?? null,
      }),
      at ?? null,
    ],
  );
}

/* ------------------------------- reads ---------------------------------- */

export async function getRestaurant(): Promise<Restaurant> {
  const rows = await q<Row>("select * from restaurant where id = 1");
  if (!rows[0]) throw new Error("Restaurant not initialised");
  return mapRestaurant(rows[0]);
}

export async function listTables(db: Queryable | null = null): Promise<DiningTable[]> {
  const runner: Queryable = db ?? { query: q };
  const rows = await runner.query<Row>(
    "select * from dining_tables order by zone, sort_order, label",
  );
  return rows.map(mapTable);
}

export async function listStaffPublic(): Promise<PublicStaff[]> {
  const rows = await q<Row>(
    "select id, name, role, initials from staff where active = true order by role desc, name asc",
  );
  return rows.map((row) => ({
    id: toNumber(row.id),
    name: String(row.name),
    role: row.role as Role,
    initials: row.initials ?? null,
  }));
}

export async function listStaff(): Promise<(PublicStaff & { active: boolean; createdAt: string })[]> {
  const rows = await q<Row>("select id, name, role, initials, active, created_at from staff order by role desc, name asc");
  return rows.map((row) => ({
    id: toNumber(row.id),
    name: String(row.name),
    role: row.role as Role,
    initials: row.initials ?? null,
    active: Boolean(row.active),
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
  }));
}

export async function verifyStaffPin(id: number, pin: string): Promise<PublicStaff | null> {
  const rows = await q<Row>(
    "select id, name, role, initials, pin_hash, active from staff where id = $1",
    [id],
  );
  const row = rows[0];
  if (!row || !row.active) return null;
  const { verifyPin } = await import("./pin");
  if (!verifyPin(pin, String(row.pin_hash))) return null;
  return {
    id: toNumber(row.id),
    name: String(row.name),
    role: row.role as Role,
    initials: row.initials ?? null,
  };
}

async function entriesForDay(day: string, db: Queryable | null = null): Promise<QueueEntry[]> {
  const runner: Queryable = db ?? { query: q };
  const rows = await runner.query<Row>(
    `select ${ENTRY_COLUMNS}
     from queue_entries qe
     left join dining_tables t on t.id = qe.table_id
     where qe.day = $1::date
     order by qe.joined_at asc`,
    [day],
  );
  const tables = await listTables(runner);
  const map = tablesByIdMap(tables);
  return rows.map((row) => mapEntry(row, map));
}

async function entryByToken(token: string): Promise<QueueEntry | null> {
  const rows = await q<Row>(
    `select ${ENTRY_COLUMNS}
     from queue_entries qe
     left join dining_tables t on t.id = qe.table_id
     where qe.token = $1`,
    [token],
  );
  if (!rows[0]) return null;
  return mapEntry(rows[0], tablesByIdMap(await listTables()));
}

/**
 * Demo mode should look alive on the first request of every new service day,
 * even when a warm serverless instance survived midnight.
 */
async function ensureDemoDay(restaurant: Restaurant): Promise<void> {
  if (!isDemoMode()) return;
  const today = dayInTz(new Date(), restaurant.timezone);
  const rows = await q<Row>(
    "select count(*)::int as count from queue_entries where day = $1::date",
    [today],
  );
  if (toNumber(rows[0]?.count) === 0) {
    await seedDatabase({ query: q });
  }
}

async function expireHolds(restaurant: Restaurant): Promise<void> {
  if (!restaurant.autoNoShow) return;
  const expired = await q<Row>(
    `update queue_entries
     set status = 'no_show', closed_at = now(), hold_expires_at = null
     where status = 'called' and hold_expires_at is not null and hold_expires_at < now()
     returning id, code, guest_name, party_size`,
  );
  for (const row of expired) {
    await logActivity(null, "no_show", "System", {
      entryId: toNumber(row.id),
      code: String(row.code),
      name: String(row.guest_name),
      partySize: toNumber(row.party_size),
      note: "Hold expired",
    });
  }
}

export async function getHostState(): Promise<HostState> {
  const restaurant = await getRestaurant();
  await ensureDemoDay(restaurant);
  await expireHolds(restaurant);
  const now = new Date();
  const today = dayInTz(now, restaurant.timezone);
  const tables = await listTables();
  const entries = await entriesForDay(today);
  const waiting = orderWaiting(entries.filter((entry) => entry.status === "waiting"));
  const called = entries
    .filter((entry) => entry.status === "called")
    .sort((a, b) => new Date(a.calledAt ?? a.joinedAt).getTime() - new Date(b.calledAt ?? b.joinedAt).getTime());
  const seated = entries.filter((entry) => entry.status === "seated");
  const recent = entries
    .filter((entry) => ["completed", "no_show", "cancelled"].includes(entry.status))
    .sort((a, b) => new Date(b.closedAt ?? b.joinedAt).getTime() - new Date(a.closedAt ?? a.joinedAt).getTime())
    .slice(0, 8);
  const stats = statsFrom(entries, tables, now);

  return {
    restaurant,
    tables,
    waiting,
    called,
    seated,
    recent,
    stats,
    serverNow: now.toISOString(),
    canSeat: tables.some((table) => table.status === "available"),
  };
}

export async function getPublicSnapshot(): Promise<PublicSnapshot> {
  const restaurant = await getRestaurant();
  await ensureDemoDay(restaurant);
  await expireHolds(restaurant);
  const now = new Date();
  const today = dayInTz(now, restaurant.timezone);
  const tables = await listTables();
  const entries = await entriesForDay(today);
  const waiting = orderWaiting(entries.filter((entry) => entry.status === "waiting"));
  const lastCalledRows = await q<Row>(
    `select code from queue_entries
     where day = $1::date and called_at is not null
     order by called_at desc limit 1`,
    [today],
  );
  const avgTurn = averageTurn(entries, restaurant.avgTurnMinutes);
  const fittable = tables.filter((table) => table.capacity >= 2);

  return {
    restaurant,
    waiting: waiting.length,
    availableTables: tables.filter((table) => table.status === "available").length,
    lastCalledCode: lastCalledRows[0]?.code ?? null,
    isOpenNow: isOpenAt(restaurant, now),
    typicalWaitMinutes:
      waiting.length === 0
        ? null
        : estimateWaitMinutes({
            position: waiting.length + 1,
            avgTurnMinutes: avgTurn,
            tableCount: Math.max(1, fittable.length),
            availableTables: fittable.filter((table) => table.status === "available").length,
          }),
    serverNow: now.toISOString(),
  };
}

export async function getTicketView(token: string): Promise<TicketView | null> {
  const restaurant = await getRestaurant();
  await expireHolds(restaurant);
  const entry = await entryByToken(token);
  if (!entry) return null;

  const now = new Date();
  const today = dayInTz(now, restaurant.timezone);
  const tables = await listTables();
  const entries = await entriesForDay(today);
  const waiting = orderWaiting(entries.filter((item) => item.status === "waiting"));
  const waitingEntry = waiting.find((item) => item.id === entry.id) ?? null;
  const position = waitingEntry ? positionOf(waitingEntry.id, waiting) : null;
  const fittable = tables.filter((table) => table.capacity >= entry.partySize);
  const availableFittable = fittable.filter((table) => table.status === "available").length;
  const avgTurn = averageTurn(entries, restaurant.avgTurnMinutes);
  const eta =
    position === null
      ? null
      : estimateWaitMinutes({
          position,
          avgTurnMinutes: avgTurn,
          tableCount: Math.max(1, fittable.length),
          availableTables: availableFittable,
        });

  const lastCalledRows = await q<Row>(
    `select code from queue_entries
     where day = $1::date and called_at is not null
     order by called_at desc limit 1`,
    [today],
  );

  return {
    restaurant,
    entry,
    position,
    peopleAhead: position === null ? null : Math.max(0, position - 1),
    etaMinutes: eta,
    lastCalledCode: lastCalledRows[0]?.code ?? null,
    waitingCount: waiting.length,
    availableTables: tables.filter((table) => table.status === "available").length,
    serverNow: now.toISOString(),
    isOpenNow: isOpenAt(restaurant, now),
  };
}

/* ------------------------------ mutations -------------------------------- */

export interface JoinInput {
  guestName: string;
  phone?: string;
  partySize: number;
  notes?: string;
  source?: QueueSource;
  actor?: string;
}

export interface JoinResult {
  token: string;
  code: string;
  position: number;
  etaMinutes: number;
}

export async function joinQueue(input: JoinInput, allowPaused = false): Promise<JoinResult> {
  const restaurant = await getRestaurant();
  const name = validateGuestName(input.guestName);
  const partySize = validatePartySize(input.partySize, restaurant.maxPartySize);
  const phone = normalizePhone(input.phone);
  const notes = validateNotes(input.notes);
  const source: QueueSource = input.source === "walkin" ? "walkin" : input.source === "online" ? "online" : "qr";

  if (!allowPaused && restaurant.waitlistStatus !== "open") {
    throw new AppError(
      restaurant.waitlistStatus === "paused"
        ? "The waitlist is paused right now. Please ask the host."
        : "The waitlist is closed for today.",
      "waitlist_closed",
      409,
    );
  }

  return tx(async (db) => {
    const today = dayInTz(new Date(), restaurant.timezone);
    const counts = await db.query<Row>(
      `select
         count(*) filter (where status = 'waiting')::int as waiting,
         count(*) filter (where status in ('waiting','called'))::int as active
       from queue_entries where day = $1::date`,
      [today],
    );
    const waiting = toNumber(counts[0]?.waiting);
    if (waiting >= restaurant.maxQueueSize) {
      throw new AppError(
        "The waitlist is full right now. Please see the host — we may still be able to seat you.",
        "queue_full",
        409,
      );
    }

    const seqRows = await db.query<Row>(
      `insert into queue_sequence (restaurant_id, day, last_seq)
       values (1, $1::date, 1)
       on conflict (restaurant_id, day)
       do update set last_seq = queue_sequence.last_seq + 1
       returning last_seq`,
      [today],
    );
    const seq = toNumber(seqRows[0]?.last_seq, 1);
    const token = randomBytes(18).toString("base64url");
    const code = codeFor(seq);

    const inserted = await db.query<Row>(
      `insert into queue_entries
        (token, code, day, seq, guest_name, phone, party_size, notes, source, status)
       values ($1,$2,$3::date,$4,$5,$6,$7,$8,$9,'waiting')
       returning id`,
      [token, code, today, seq, name, phone, partySize, notes, source],
    );
    const entryId = toNumber(inserted[0]?.id);

    await logActivity(db, source === "walkin" ? "walkin" : "join", input.actor ?? "Guest", {
      entryId,
      code,
      name,
      partySize,
      note: notes,
    });

    const all = await entriesForDay(today, db);
    const waitingList = orderWaiting(all.filter((entry) => entry.status === "waiting"));
    const position = positionOf(entryId, waitingList) ?? waitingList.length;
    const tables = await listTables(db);
    const fittable = tables.filter((table) => table.capacity >= partySize);
    const etaMinutes = estimateWaitMinutes({
      position,
      avgTurnMinutes: restaurant.avgTurnMinutes,
      tableCount: Math.max(1, fittable.length),
      availableTables: fittable.filter((table) => table.status === "available").length,
    });

    return { token, code, position, etaMinutes };
  });
}

export async function cancelTicket(token: string): Promise<ActionResult> {
  return tx(async (db) => {
    const rows = await db.query<Row>(
      `update queue_entries
       set status = 'cancelled', closed_at = now(), cancelled_by = 'guest', hold_expires_at = null
       where token = $1 and status in ('waiting','called')
       returning id, code, guest_name, party_size`,
      [token],
    );
    if (!rows[0]) return { ok: false, message: "This ticket can no longer be cancelled." };
    await logActivity(db, "cancel", "Guest", {
      entryId: toNumber(rows[0].id),
      code: String(rows[0].code),
      name: String(rows[0].guest_name),
      partySize: toNumber(rows[0].party_size),
      note: "Cancelled from ticket",
    });
    return { ok: true, message: "Your place in line has been released." };
  });
}

export async function acknowledgeTicket(token: string): Promise<ActionResult> {
  const rows = await q<Row>(
    `update queue_entries
     set acknowledged = true,
         hold_expires_at = coalesce(hold_expires_at, now()) + interval '3 minutes'
     where token = $1 and status = 'called' and acknowledged = false
     returning id, code, guest_name, party_size, hold_expires_at`,
    [token],
  );

  if (!rows[0]) {
    const existing = await q<Row>("select status, acknowledged from queue_entries where token = $1", [token]);
    if (existing[0]?.status === "called") {
      return { ok: true, message: "We already have your heads-up — the host is expecting you." };
    }
    return { ok: false, message: "This ticket is not waiting for a table right now." };
  }

  await logActivity(null, "acknowledge", "Guest", {
    entryId: toNumber(rows[0].id),
    code: String(rows[0].code),
    name: String(rows[0].guest_name),
    partySize: toNumber(rows[0].party_size),
    note: "Guest confirmed — hold extended 3 min",
  });
  return { ok: true, message: "We'll hold your table a little longer." };
}

async function updateEntryStatus(
  entryId: number,
  from: EntryStatus[],
  patch: Record<string, unknown>,
  actor: string,
  type: string,
  note: string,
  successMessage: string,
): Promise<ActionResult> {
  return tx(async (db) => {
    const columns = Object.keys(patch);
    const assignments = columns.map((column, index) => `${column} = $${index + 2}`).join(", ");
    const params = [entryId, ...columns.map((column) => patch[column])];
    const rows = await db.query<Row>(
      `update queue_entries set ${assignments}
       where id = $1 and status = any($${params.length + 1}::text[])
       returning id, code, guest_name, party_size, table_id`,
      [...params, from],
    );
    if (!rows[0]) {
      return { ok: false, message: "That guest was already handled. Refreshing the board…" };
    }
    await logActivity(db, type, actor, {
      entryId: toNumber(rows[0].id),
      code: String(rows[0].code),
      name: String(rows[0].guest_name),
      partySize: toNumber(rows[0].party_size),
      note,
    });
    return { ok: true, message: successMessage };
  });
}

export async function callEntry(entryId: number, actor: string): Promise<ActionResult> {
  const restaurant = await getRestaurant();
  return tx(async (db) => {
    const rows = await db.query<Row>(
      `update queue_entries
       set status = 'called', called_at = now(),
           hold_expires_at = now() + ($2 || ' minutes')::interval,
           called_count = called_count + 1, acknowledged = false
       where id = $1 and status = 'waiting'
       returning id, code, guest_name, party_size`,
      [entryId, restaurant.holdMinutes],
    );
    if (!rows[0]) return { ok: false, message: "That guest was already handled." };
    await logActivity(db, "call", actor, {
      entryId,
      code: String(rows[0].code),
      name: String(rows[0].guest_name),
      partySize: toNumber(rows[0].party_size),
      note: "Table ready",
    });
    return { ok: true, message: `${rows[0].code} called. The hold timer is running.` };
  });
}

export async function callNext(actor: string, force = false): Promise<ActionResult<{ code: string }>> {
  const restaurant = await getRestaurant();
  return tx(async (db) => {
    const today = dayInTz(new Date(), restaurant.timezone);
    const entries = await entriesForDay(today, db);
    const waiting = orderWaiting(entries.filter((entry) => entry.status === "waiting"));
    const tables = await listTables(db);
    const pick = pickNext(waiting, tables, force);
    if (!pick.ok) return { ok: false, message: pick.message };

    const hold = new Date(Date.now() + restaurant.holdMinutes * 60_000).toISOString();
    const updated = await db.query<Row>(
      `update queue_entries
       set status = 'called', called_at = now(), hold_expires_at = $2,
           called_count = called_count + 1, acknowledged = false
       where id = $1 and status = 'waiting'
       returning id, code, guest_name, party_size`,
      [pick.entry.id, hold],
    );
    if (!updated[0]) {
      return { ok: false, message: "Another host just called that guest. Refreshing…" };
    }
    await logActivity(db, "call", actor, {
      entryId: toNumber(updated[0].id),
      code: String(updated[0].code),
      name: String(updated[0].guest_name),
      partySize: toNumber(updated[0].party_size),
      tableLabel: pick.table?.label ?? null,
      note: pick.table ? `Suggested ${pick.table.label}` : "No table free yet",
    });
    return {
      ok: true,
      message: `Called ${updated[0].code} · ${updated[0].guest_name}${pick.table ? ` → ${pick.table.label}` : ""}`,
      data: { code: String(updated[0].code) },
    };
  });
}

export async function seatEntry(entryId: number, tableId: number, actor: string): Promise<ActionResult> {
  return tx(async (db) => {
    const entryRows = await db.query<Row>(
      "select id, code, guest_name, party_size, status from queue_entries where id = $1 for update",
      [entryId],
    );
    const entry = entryRows[0];
    if (!entry) return { ok: false, message: "That guest no longer exists." };
    if (!["waiting", "called"].includes(String(entry.status))) {
      return { ok: false, message: "That guest is not waiting for a table." };
    }
    const tableRows = await db.query<Row>(
      "select id, label, capacity, status from dining_tables where id = $1 for update",
      [tableId],
    );
    const table = tableRows[0];
    if (!table) return { ok: false, message: "That table no longer exists." };
    if (table.status !== "available") return { ok: false, message: `${table.label} is not free right now.` };
    if (toNumber(entry.party_size) > toNumber(table.capacity)) {
      return { ok: false, message: `${table.label} seats ${table.capacity}; this party is ${entry.party_size}.` };
    }

    await db.query(
      `update queue_entries
       set status = 'seated', seated_at = now(), table_id = $2, hold_expires_at = null
       where id = $1`,
      [entryId, tableId],
    );
    await db.query(
      "update dining_tables set status = 'seated', status_changed_at = now() where id = $1",
      [tableId],
    );
    await logActivity(db, "seat", actor, {
      entryId,
      tableId,
      code: String(entry.code),
      name: String(entry.guest_name),
      partySize: toNumber(entry.party_size),
      tableLabel: String(table.label),
      note: `Seated at ${table.label}`,
    });
    return { ok: true, message: `${entry.code} seated at ${table.label}.` };
  });
}

export async function markNoShow(entryId: number, actor: string): Promise<ActionResult> {
  return updateEntryStatus(
    entryId,
    ["called", "waiting"],
    { status: "no_show", closed_at: new Date().toISOString(), hold_expires_at: null },
    actor,
    "no_show",
    "Marked as no-show",
    "Guest marked as a no-show.",
  );
}

export async function undoCall(entryId: number, actor: string): Promise<ActionResult> {
  return updateEntryStatus(
    entryId,
    ["called"],
    { status: "waiting", called_at: null, hold_expires_at: null, acknowledged: false },
    actor,
    "undo_call",
    "Returned to waitlist",
    "Guest returned to the waitlist.",
  );
}

export async function extendHold(entryId: number, minutes: number, actor: string): Promise<ActionResult> {
  const extra = clampInt(minutes, 1, 15, 5);
  const rows = await q<Row>(
    `update queue_entries
     set hold_expires_at = greatest(coalesce(hold_expires_at, now()), now()) + ($2 || ' minutes')::interval,
         acknowledged = true
     where id = $1 and status = 'called'
     returning id, code`,
    [entryId, extra],
  );
  if (!rows[0]) return { ok: false, message: "That guest is not on hold." };
  await logActivity(null, "extend", actor, {
    entryId,
    code: String(rows[0].code),
    note: `Hold extended ${extra} min`,
  });
  return { ok: true, message: `Hold extended by ${extra} minutes.` };
}

export async function clearTable(tableId: number, actor: string): Promise<ActionResult> {
  return tx(async (db) => {
    const tableRows = await db.query<Row>(
      "select id, label, status from dining_tables where id = $1 for update",
      [tableId],
    );
    const table = tableRows[0];
    if (!table) return { ok: false, message: "That table no longer exists." };
    if (table.status !== "seated") return { ok: false, message: `${table.label} is not marked as seated.` };

    const entryRows = await db.query<Row>(
      `select id, code, guest_name, party_size from queue_entries
       where table_id = $1 and status = 'seated' order by seated_at desc limit 1`,
      [tableId],
    );
    await db.query(
      "update dining_tables set status = 'dirty', status_changed_at = now() where id = $1",
      [tableId],
    );
    if (entryRows[0]) {
      await db.query(
        "update queue_entries set status = 'completed', closed_at = now() where id = $1",
        [toNumber(entryRows[0].id)],
      );
      await logActivity(db, "complete", actor, {
        entryId: toNumber(entryRows[0].id),
        tableId,
        code: String(entryRows[0].code),
        name: String(entryRows[0].guest_name),
        partySize: toNumber(entryRows[0].party_size),
        tableLabel: String(table.label),
        note: "Visit completed",
      });
    }
    await logActivity(db, "clear", actor, {
      tableId,
      tableLabel: String(table.label),
      note: "Table needs resetting",
    });
    return { ok: true, message: `${table.label} cleared. Mark it ready once reset.` };
  });
}

export async function setTableStatus(
  tableId: number,
  status: TableStatus,
  actor: string,
): Promise<ActionResult> {
  if (!["available", "dirty", "blocked"].includes(status)) {
    return { ok: false, message: "That table status can't be set manually." };
  }
  const rows = await q<Row>(
    `update dining_tables set status = $2, status_changed_at = now()
     where id = $1 and status <> 'seated'
     returning id, label, status`,
    [tableId, status],
  );
  if (!rows[0]) return { ok: false, message: "Clear the seated party first." };
  await logActivity(null, status === "available" ? "ready" : "table_status", actor, {
    tableId,
    tableLabel: String(rows[0].label),
    note: status === "blocked" ? "Blocked" : status === "dirty" ? "Marked dirty" : "Ready for guests",
  });
  return { ok: true, message: `${rows[0].label} is ${status}.` };
}

export async function setWaitlistStatus(
  status: WaitlistStatus,
  reason: string | null,
  actor: string,
): Promise<ActionResult> {
  if (!["open", "paused", "closed"].includes(status)) {
    return { ok: false, message: "Unknown waitlist state." };
  }
  const rows = await q<Row>(
    `update restaurant set waitlist_status = $1, pause_reason = $2, updated_at = now()
     where id = 1 returning waitlist_status`,
    [status, reason ? cleanText(reason, 120) : null],
  );
  if (!rows[0]) return { ok: false, message: "Could not update the waitlist." };
  await logActivity(null, "waitlist", actor, {
    note:
      status === "open"
        ? "Waitlist opened"
        : status === "paused"
          ? `Waitlist paused${reason ? `: ${reason}` : ""}`
          : "Waitlist closed",
  });
  return {
    ok: true,
    message:
      status === "open"
        ? "Waitlist is open — guests can join."
        : status === "paused"
          ? "Waitlist paused. Existing guests keep their place."
          : "Waitlist closed for new guests.",
  };
}

export interface RestaurantPatch {
  name?: string;
  tagline?: string | null;
  address?: string | null;
  phone?: string | null;
  instagram?: string | null;
  openTime?: string;
  closeTime?: string;
  accent?: string;
  announcement?: string | null;
  avgTurnMinutes?: number;
  holdMinutes?: number;
  maxPartySize?: number;
  maxQueueSize?: number;
  autoNoShow?: boolean;
  timezone?: string;
}

export async function updateRestaurant(patch: RestaurantPatch, actor: string): Promise<Restaurant> {
  const current = await getRestaurant();
  const next = {
    name: patch.name !== undefined ? cleanText(patch.name, 80) : current.name,
    tagline: patch.tagline !== undefined ? cleanText(patch.tagline, 120) || null : current.tagline,
    address: patch.address !== undefined ? cleanText(patch.address, 200) || null : current.address,
    phone: patch.phone !== undefined ? cleanText(patch.phone, 40) || null : current.phone,
    instagram: patch.instagram !== undefined ? cleanText(patch.instagram, 60) || null : current.instagram,
    openTime: patch.openTime !== undefined ? validateTime(patch.openTime, "Opening time") : current.openTime,
    closeTime: patch.closeTime !== undefined ? validateTime(patch.closeTime, "Closing time") : current.closeTime,
    accent: patch.accent !== undefined ? validateAccent(patch.accent) : current.accent,
    announcement:
      patch.announcement !== undefined ? cleanText(patch.announcement, 300) || null : current.announcement,
    avgTurnMinutes: clampInt(patch.avgTurnMinutes ?? current.avgTurnMinutes, 10, 240, current.avgTurnMinutes),
    holdMinutes: clampInt(patch.holdMinutes ?? current.holdMinutes, 2, 30, current.holdMinutes),
    maxPartySize: clampInt(patch.maxPartySize ?? current.maxPartySize, 1, 40, current.maxPartySize),
    maxQueueSize: clampInt(patch.maxQueueSize ?? current.maxQueueSize, 1, 500, current.maxQueueSize),
    autoNoShow: patch.autoNoShow ?? current.autoNoShow,
    timezone: patch.timezone ? cleanText(patch.timezone, 60) : current.timezone,
  };

  if (!next.name) throw new AppError("The restaurant needs a name.");
  if (parseTimeToMinutes(next.openTime) === parseTimeToMinutes(next.closeTime)) {
    throw new AppError("Opening and closing times cannot be the same.");
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: next.timezone });
  } catch {
    throw new AppError("That timezone isn't recognised.");
  }

  const rows = await q<Row>(
    `update restaurant set
       name=$1, tagline=$2, address=$3, phone=$4, instagram=$5, open_time=$6, close_time=$7,
       accent=$8, announcement=$9, avg_turn_minutes=$10, hold_minutes=$11, max_party_size=$12,
       max_queue_size=$13, auto_no_show=$14, timezone=$15, updated_at=now()
     where id = 1 returning *`,
    [
      next.name,
      next.tagline,
      next.address,
      next.phone,
      next.instagram,
      next.openTime,
      next.closeTime,
      next.accent,
      next.announcement,
      next.avgTurnMinutes,
      next.holdMinutes,
      next.maxPartySize,
      next.maxQueueSize,
      next.autoNoShow,
      next.timezone,
    ],
  );
  await logActivity(null, "settings", actor, { note: "Restaurant settings updated" });
  return mapRestaurant(rows[0]);
}

export async function createTable(
  input: { label: string; capacity: number; zone: string },
  actor: string,
): Promise<ActionResult> {
  const label = validateTableLabel(input.label);
  const capacity = clampInt(input.capacity, 1, 40, 2);
  const zone = validateZone(input.zone);
  try {
    const rows = await q<Row>(
      "insert into dining_tables (label, capacity, zone, sort_order) values ($1,$2,$3,(select coalesce(max(sort_order),0)+1 from dining_tables)) returning id, label",
      [label, capacity, zone],
    );
    await logActivity(null, "table_added", actor, {
      tableId: toNumber(rows[0]?.id),
      tableLabel: label,
      note: `${capacity} seats · ${zone}`,
    });
    return { ok: true, message: `${label} added.` };
  } catch (error) {
    if (String(error).includes("duplicate key")) return { ok: false, message: `Table ${label} already exists.` };
    throw error;
  }
}

export async function updateTable(
  id: number,
  input: { label: string; capacity: number; zone: string },
  actor: string,
): Promise<ActionResult> {
  const label = validateTableLabel(input.label);
  const capacity = clampInt(input.capacity, 1, 40, 2);
  const zone = validateZone(input.zone);

  const current = await q<Row>("select id, label, status from dining_tables where id = $1", [id]);
  if (!current[0]) return { ok: false, message: "Table not found." };
  if (current[0].status === "seated") {
    const party = await q<Row>(
      "select party_size from queue_entries where table_id = $1 and status = 'seated' order by seated_at desc limit 1",
      [id],
    );
    if (party[0] && toNumber(party[0].party_size) > capacity) {
      return {
        ok: false,
        message: `A party of ${party[0].party_size} is seated here — clear the table before shrinking it.`,
      };
    }
  }

  try {
    const rows = await q<Row>(
      "update dining_tables set label=$2, capacity=$3, zone=$4 where id=$1 returning id, label, status",
      [id, label, capacity, zone],
    );
    if (!rows[0]) return { ok: false, message: "Table not found." };
    await logActivity(null, "table_updated", actor, {
      tableId: id,
      tableLabel: label,
      note: `${capacity} seats · ${zone}`,
    });
    return { ok: true, message: `${label} saved.` };
  } catch (error) {
    if (String(error).includes("duplicate key")) return { ok: false, message: `Table ${label} already exists.` };
    throw error;
  }
}

export async function deleteTable(id: number, actor: string): Promise<ActionResult> {
  const rows = await q<Row>("select id, label, status from dining_tables where id = $1", [id]);
  const table = rows[0];
  if (!table) return { ok: false, message: "Table not found." };
  if (table.status === "seated") return { ok: false, message: `Clear ${table.label} before deleting it.` };
  await q("delete from dining_tables where id = $1", [id]);
  await logActivity(null, "table_deleted", actor, {
    tableLabel: String(table.label),
    note: "Table removed",
  });
  return { ok: true, message: `${table.label} removed.` };
}

export async function createStaff(
  input: { name: string; role: Role; pin: string },
  actor: string,
): Promise<ActionResult> {
  const name = validateGuestName(input.name);
  const pin = validatePin(input.pin);
  const role: Role = input.role === "owner" ? "owner" : "greeter";
  const { hashPin } = await import("./pin");
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  await q<Row>(
    "insert into staff (name, role, pin_hash, initials) values ($1,$2,$3,$4) returning id",
    [name, role, hashPin(pin), initials],
  );
  await logActivity(null, "staff_added", actor, {
    note: `${name} · ${role}`,
  });
  return { ok: true, message: `${name} can now sign in.`, data: undefined };
}

export async function setStaffPin(id: number, pin: string, actor: string): Promise<ActionResult> {
  const safePin = validatePin(pin);
  const { hashPin } = await import("./pin");
  const rows = await q<Row>(
    "update staff set pin_hash = $2 where id = $1 returning name",
    [id, hashPin(safePin)],
  );
  if (!rows[0]) return { ok: false, message: "Team member not found." };
  await logActivity(null, "staff_pin", actor, {
    note: `PIN reset for ${rows[0].name}`,
  });
  return { ok: true, message: `PIN updated for ${rows[0].name}.` };
}

export async function setStaffActive(id: number, active: boolean, actor: string): Promise<ActionResult> {
  const target = await q<Row>("select id, name, role, active from staff where id = $1", [id]);
  if (!target[0]) return { ok: false, message: "Team member not found." };
  if (!active && target[0].role === "owner") {
    const owners = await q<Row>("select count(*)::int as count from staff where role = 'owner' and active = true");
    if (toNumber(owners[0]?.count) <= 1) {
      return { ok: false, message: "You need at least one active owner." };
    }
  }
  await q("update staff set active = $2 where id = $1", [id, active]);
  await logActivity(null, "staff_status", actor, {
    note: `${target[0].name} ${active ? "reactivated" : "deactivated"}`,
  });
  return { ok: true, message: `${target[0].name} ${active ? "is active" : "is paused"}.` };
}

/* ------------------------------ reporting -------------------------------- */

export async function getOwnerOverview(days = 7): Promise<OwnerOverview> {
  const restaurant = await getRestaurant();
  await ensureDemoDay(restaurant);
  await expireHolds(restaurant);
  const now = new Date();
  const today = dayInTz(now, restaurant.timezone);
  const windowDays = Math.min(90, Math.max(1, Math.round(days)));
  const startDay = addDaysToDay(today, -(windowDays - 1));
  const tables = await listTables();

  const rows = await q<Row>(
    `select ${ENTRY_COLUMNS}
     from queue_entries qe
     left join dining_tables t on t.id = qe.table_id
     where qe.day >= $1::date
     order by qe.joined_at asc`,
    [startDay],
  );
  const map = tablesByIdMap(tables);
  const all = rows.map((row) => mapEntry(row, map, now));
  const todayEntries = all.filter((entry) => entry.day === today);
  const stats = statsFrom(todayEntries, tables, now);
  const seatedToday = todayEntries.filter((entry) => entry.seatedAt && entry.status !== "cancelled");
  const completed = todayEntries.filter((entry) => entry.status === "completed");
  const avgWaitMinutes = average(seatedToday.map((entry) => minutesBetween(entry.joinedAt, entry.seatedAt as string)));
  const avgTurnMinutes = averageTurn(todayEntries, restaurant.avgTurnMinutes);

  const utilization = Math.min(
    100,
    Math.round((stats.seated / Math.max(1, tables.length)) * 100),
  );

  const week: DayPoint[] = [];
  for (let index = windowDays - 1; index >= 0; index -= 1) {
    const day = addDaysToDay(today, -index);
    const dayEntries = all.filter((entry) => entry.day === day);
    const daySeated = dayEntries.filter((entry) => entry.seatedAt && entry.status !== "cancelled");
    week.push({
      day,
      joined: dayEntries.length,
      seated: daySeated.length,
      noShow: dayEntries.filter((entry) => entry.status === "no_show").length,
      cancelled: dayEntries.filter((entry) => entry.status === "cancelled").length,
      avgWaitMinutes: average(daySeated.map((entry) => minutesBetween(entry.joinedAt, entry.seatedAt as string))),
      avgTurnMinutes: averageTurn(dayEntries, restaurant.avgTurnMinutes),
    });
  }

  const activityRows = await q<Row>(
    "select id, type, actor, detail, created_at from activity order by created_at desc limit 14",
  );
  const activity: ActivityItem[] = activityRows.map((row) => {
    const detail = typeof row.detail === "string" ? safeJson(row.detail) : (row.detail ?? {});
    return {
      id: toNumber(row.id),
      type: String(row.type),
      actor: row.actor ?? null,
      createdAt: toIso(row.created_at) ?? now.toISOString(),
      code: detail.code ?? null,
      name: detail.name ?? null,
      partySize: detail.partySize ?? null,
      tableLabel: detail.tableLabel ?? null,
    };
  });

  return {
    restaurant,
    stats,
    today: {
      avgWaitMinutes,
      avgTurnMinutes,
      noShowRate: noShowRate(todayEntries),
      completed: completed.length,
      cancelled: todayEntries.filter((entry) => entry.status === "cancelled").length,
      utilization,
      walkIns: todayEntries.filter((entry) => entry.source === "walkin").length,
      remote: todayEntries.filter((entry) => entry.source !== "walkin").length,
    },
    hourly: buildHourly(todayEntries, restaurant.timezone, restaurant.openTime, restaurant.closeTime),
    week,
    activity,
    tables,
    waiting: orderWaiting(todayEntries.filter((entry) => entry.status === "waiting")),
    called: todayEntries.filter((entry) => entry.status === "called"),
    serverNow: now.toISOString(),
  };
}

function safeJson(value: string): Row {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as Row) : {};
  } catch {
    return {};
  }
}

export async function getReportCsv(days = 30): Promise<string> {
  const windowDays = Math.min(90, Math.max(1, Math.round(days)));
  const restaurant = await getRestaurant();
  const today = dayInTz(new Date(), restaurant.timezone);
  const startDay = addDaysToDay(today, -(windowDays - 1));
  const rows = await q<Row>(
    `select qe.code, to_char(qe.day, 'YYYY-MM-DD') as day_text, qe.guest_name, qe.phone,
            qe.party_size, qe.source, qe.status, qe.joined_at, qe.called_at, qe.seated_at,
            qe.closed_at, qe.notes, t.label as table_label
     from queue_entries qe
     left join dining_tables t on t.id = qe.table_id
     where qe.day >= $1::date
     order by qe.joined_at asc`,
    [startDay],
  );

  const header = [
    "code", "day", "guest", "phone", "party_size", "source", "status",
    "joined_at", "called_at", "seated_at", "closed_at", "table", "wait_min", "turn_min", "notes",
  ];
  const lines = [header.join(",")];
  for (const row of rows) {
    const joined = toIso(row.joined_at);
    const seated = toIso(row.seated_at);
    const closed = toIso(row.closed_at);
    const wait = joined && seated ? minutesBetween(joined, seated) : "";
    const turn = seated && closed ? minutesBetween(seated, closed) : "";
    lines.push(
      [
        row.code,
        row.day_text,
        row.guest_name,
        row.phone ?? "",
        row.party_size,
        row.source,
        row.status,
        joined ?? "",
        toIso(row.called_at) ?? "",
        seated ?? "",
        closed ?? "",
        row.table_label ?? "",
        wait,
        turn,
        row.notes ?? "",
      ]
        .map((value) => csvCell(value))
        .join(","),
    );
  }
  return `\uFEFF${lines.join("\r\n")}`;
}

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function findEntryIdByToken(token: string): Promise<number | null> {
  const rows = await q<Row>("select id from queue_entries where token = $1", [token]);
  return rows[0] ? toNumber(rows[0].id) : null;
}

export async function bestTableForParty(partySize: number): Promise<DiningTable | null> {
  const tables = await listTables();
  return selectBestTable(tables, partySize);
}
