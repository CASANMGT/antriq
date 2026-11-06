import type {
  DiningTable,
  HourPoint,
  HostStats,
  QueueEntry,
} from "./types";
import { minutesInTz, parseTimeToMinutes } from "./time";

export const ACTIVE_STATUSES = ["waiting", "called", "seated"] as const;

export function codeFor(seq: number): string {
  return `A-${String(seq).padStart(3, "0")}`;
}

export function orderWaiting<T extends { joinedAt: string; id: number }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    const delta = new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    return delta !== 0 ? delta : a.id - b.id;
  });
}

export function positionOf(entryId: number, waiting: QueueEntry[]): number | null {
  const index = waiting.findIndex((entry) => entry.id === entryId);
  return index === -1 ? null : index + 1;
}

interface EstimateInput {
  position: number;
  avgTurnMinutes: number;
  tableCount: number;
  availableTables: number;
}

/**
 * Wait estimate in minutes.
 *
 * The restaurant turns tables in cycles. A party's realistic wait is the number
 * of full seating cycles ahead of it, multiplied by the average time it takes
 * one table to turn. Free tables collapse the first cycle instantly.
 */
export function estimateWaitMinutes({
  position,
  avgTurnMinutes,
  tableCount,
  availableTables,
}: EstimateInput): number {
  const safePosition = Math.max(1, position);
  const ahead = safePosition - 1;
  const tables = Math.max(1, tableCount);
  const perParty = clamp(avgTurnMinutes / tables, 4, 20);
  const freeSeats = Math.min(availableTables, ahead + 1);
  const cycles = Math.max(0, ahead - availableTables);
  const firstCycle = freeSeats > 0 ? 2 : perParty;
  return Math.round(clamp(firstCycle + cycles * perParty, 2, 180));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Smallest available table that still fits the party. */
export function selectBestTable(tables: DiningTable[], partySize: number): DiningTable | null {
  const candidates = tables
    .filter((table) => table.status === "available" && table.capacity >= partySize)
    .sort((a, b) => a.capacity - b.capacity || a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
  return candidates[0] ?? null;
}

export type NextPick =
  | { ok: true; entry: QueueEntry; table: DiningTable | null }
  | { ok: false; reason: "empty" | "no-table" | "no-fit"; message: string };

/**
 * Fair next-call selection: first party in line that an available table can
 * physically seat. `force` lets a host call the next party while a table is
 * being bussed, accepting that no table is free yet.
 */
export function pickNext(waiting: QueueEntry[], tables: DiningTable[], force = false): NextPick {
  if (waiting.length === 0) {
    return { ok: false, reason: "empty", message: "The waitlist is empty." };
  }

  const available = tables.filter((table) => table.status === "available");
  if (available.length === 0 && !force) {
    return {
      ok: false,
      reason: "no-table",
      message: "No table is ready yet. Clear a table, or call anyway.",
    };
  }

  const largest = Math.max(0, ...tables.map((table) => table.capacity));
  for (const entry of waiting) {
    if (entry.partySize > largest) {
      if (force) {
        return {
          ok: true,
          entry,
          table: null,
        };
      }
      continue;
    }
    const table = selectBestTable(available, entry.partySize);
    if (table) {
      return { ok: true, entry, table };
    }
  }

  if (force) {
    return { ok: true, entry: waiting[0], table: selectBestTable(available, waiting[0].partySize) };
  }

  return {
    ok: false,
    reason: "no-fit",
    message: "Waiting parties are larger than the tables that are free. Clear a larger table first.",
  };
}

export function holdSecondsLeft(entry: Pick<QueueEntry, "holdExpiresAt">, now = new Date()): number {
  if (!entry.holdExpiresAt) return 0;
  return Math.max(0, Math.round((new Date(entry.holdExpiresAt).getTime() - now.getTime()) / 1000));
}

export function statsFrom(
  entries: QueueEntry[],
  tables: DiningTable[],
  now = new Date(),
): HostStats {
  const active = entries.filter((entry) => entry.status === "waiting" || entry.status === "called" || entry.status === "seated");
  const waiting = active.filter((entry) => entry.status === "waiting");
  const called = active.filter((entry) => entry.status === "called");
  const seated = active.filter((entry) => entry.status === "seated");

  const waits = entries
    .filter((entry) => entry.seatedAt && entry.status !== "cancelled")
    .map((entry) => minutesBetween(entry.joinedAt, entry.seatedAt as string));
  const avgWait = waits.length ? Math.round(waits.reduce((sum, value) => sum + value, 0) / waits.length) : 0;
  const longest = waiting.length
    ? Math.max(...waiting.map((entry) => minutesBetween(entry.joinedAt, now.toISOString())))
    : 0;

  return {
    waiting: waiting.length,
    called: called.length,
    seated: seated.length,
    availableTables: tables.filter((table) => table.status === "available").length,
    dirtyTables: tables.filter((table) => table.status === "dirty").length,
    blockedTables: tables.filter((table) => table.status === "blocked").length,
    totalTables: tables.length,
    joinedToday: entries.length,
    seatedToday: entries.filter((entry) => entry.seatedAt).length,
    noShowToday: entries.filter((entry) => entry.status === "no_show").length,
    avgWaitMinutes: avgWait,
    longestWaitMinutes: longest,
  };
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function minutesBetween(from: string, to: string): number {
  return Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60_000));
}

export function noShowRate(entries: QueueEntry[]): number {
  const showed = entries.filter(
    (entry) => entry.status === "seated" || entry.status === "completed",
  ).length;
  const noShows = entries.filter((entry) => entry.status === "no_show").length;
  const denominator = showed + noShows;
  return denominator === 0 ? 0 : Math.round((noShows / denominator) * 100);
}

export function buildHourly(
  entries: QueueEntry[],
  timezone: string,
  openTime: string,
  closeTime: string,
): HourPoint[] {
  const open = Math.floor(parseTimeToMinutes(openTime) / 60);
  const closeRaw = parseTimeToMinutes(closeTime);
  let close = Math.ceil(closeRaw / 60);
  if (close <= open) close += 24;

  const buckets = new Map<number, HourPoint>();
  for (let hour = open; hour <= close; hour += 1) {
    buckets.set(hour % 24, { hour: hour % 24, joined: 0, seated: 0 });
  }

  for (const entry of entries) {
    if (entry.status === "cancelled") continue;
    const joinedHour = Math.floor(minutesInTz(entry.joinedAt, timezone) / 60);
    const joinedBucket = buckets.get(joinedHour);
    if (joinedBucket) joinedBucket.joined += 1;

    if (entry.seatedAt) {
      const seatedHour = Math.floor(minutesInTz(entry.seatedAt, timezone) / 60);
      const seatedBucket = buckets.get(seatedHour);
      if (seatedBucket) seatedBucket.seated += 1;
    }
  }

  return [...buckets.values()];
}

/** Average table turn in minutes, from completed visits in the supplied set. */
export function averageTurn(entries: QueueEntry[], fallback: number): number {
  const turns = entries
    .filter((entry) => entry.status === "completed" && entry.seatedAt && entry.closedAt)
    .map((entry) => minutesBetween(entry.seatedAt as string, entry.closedAt as string))
    .filter((value) => value > 0 && value < 360);
  return turns.length >= 3 ? average(turns) : fallback;
}
