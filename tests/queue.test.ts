import { describe, expect, it } from "vitest";
import {
  averageTurn,
  buildHourly,
  codeFor,
  estimateWaitMinutes,
  orderWaiting,
  pickNext,
  positionOf,
  selectBestTable,
  statsFrom,
} from "@/lib/queue";
import type { DiningTable, QueueEntry } from "@/lib/types";

function entry(overrides: Partial<QueueEntry> & { id: number; joinedAt: string }): QueueEntry {
  return {
    code: `A-00${overrides.id}`,
    day: "2026-11-06",
    seq: overrides.id,
    guestName: `Guest ${overrides.id}`,
    phone: null,
    partySize: 2,
    notes: null,
    source: "qr",
    status: "waiting",
    tableId: null,
    tableLabel: null,
    calledCount: 0,
    acknowledged: false,
    calledAt: null,
    holdExpiresAt: null,
    seatedAt: null,
    closedAt: null,
    cancelledBy: null,
    waitMinutes: 0,
    calledMinutesAgo: null,
    holdSecondsLeft: 0,
    ...overrides,
  };
}

function table(id: number, label: string, capacity: number, status: DiningTable["status"] = "available"): DiningTable {
  return {
    id,
    label,
    capacity,
    zone: "Main",
    status,
    statusChangedAt: "2026-11-06T10:00:00.000Z",
    sortOrder: id,
  };
}

describe("queue domain", () => {
  it("formats daily ticket codes with three digits", () => {
    expect(codeFor(1)).toBe("A-001");
    expect(codeFor(42)).toBe("A-042");
    expect(codeFor(1234)).toBe("A-1234");
  });

  it("orders the waiting line by join time, then id", () => {
    const list = [
      entry({ id: 2, joinedAt: "2026-11-06T10:05:00.000Z" }),
      entry({ id: 1, joinedAt: "2026-11-06T10:00:00.000Z" }),
      entry({ id: 3, joinedAt: "2026-11-06T10:05:00.000Z" }),
    ];
    expect(orderWaiting(list).map((item) => item.id)).toEqual([1, 2, 3]);
    expect(positionOf(2, orderWaiting(list))).toBe(2);
    expect(positionOf(99, list)).toBeNull();
  });

  it("selects the smallest table that fits", () => {
    const tables = [
      table(1, "T1", 4),
      table(2, "T2", 2),
      table(3, "T3", 8),
      table(4, "T4", 2, "seated"),
    ];
    expect(selectBestTable(tables, 2)?.label).toBe("T2");
    expect(selectBestTable(tables, 3)?.label).toBe("T1");
    expect(selectBestTable(tables, 9)).toBeNull();
  });

  it("picks the first waiting party an available table can seat", () => {
    const waiting = [
      entry({ id: 1, joinedAt: "2026-11-06T10:00:00.000Z", partySize: 6 }),
      entry({ id: 2, joinedAt: "2026-11-06T10:05:00.000Z", partySize: 2 }),
    ];
    const tables = [table(1, "T1", 2), table(2, "T2", 4)];
    const pick = pickNext(waiting, tables);
    expect(pick.ok).toBe(true);
    if (pick.ok) {
      expect(pick.entry.id).toBe(2);
      expect(pick.table?.label).toBe("T1");
    }
  });

  it("explains why it cannot call next", () => {
    const waiting = [entry({ id: 1, joinedAt: "2026-11-06T10:00:00.000Z", partySize: 4 })];
    expect(pickNext(waiting, [table(1, "T1", 2)])).toMatchObject({ ok: false, reason: "no-fit" });
    expect(pickNext([], [table(1, "T1", 2)])).toMatchObject({ ok: false, reason: "empty" });
    expect(pickNext(waiting, [table(1, "T1", 2, "seated")])).toMatchObject({
      ok: false,
      reason: "no-table",
    });
  });

  it("lets a host force a call while a table is being cleared", () => {
    const waiting = [entry({ id: 1, joinedAt: "2026-11-06T10:00:00.000Z", partySize: 2 })];
    const pick = pickNext(waiting, [table(1, "T1", 2, "dirty")], true);
    expect(pick.ok).toBe(true);
    if (pick.ok) {
      expect(pick.entry.id).toBe(1);
      expect(pick.table).toBeNull();
    }
  });

  it("estimates wait from queue position, table count and free tables", () => {
    expect(estimateWaitMinutes({ position: 1, avgTurnMinutes: 55, tableCount: 14, availableTables: 3 })).toBe(2);
    expect(estimateWaitMinutes({ position: 1, avgTurnMinutes: 55, tableCount: 14, availableTables: 0 })).toBe(4);
    const long = estimateWaitMinutes({ position: 8, avgTurnMinutes: 55, tableCount: 14, availableTables: 0 });
    expect(long).toBeGreaterThan(20);
    expect(long).toBeLessThan(40);
    expect(
      estimateWaitMinutes({ position: 40, avgTurnMinutes: 240, tableCount: 1, availableTables: 0 }),
    ).toBe(180);
  });

  it("summarises live stats and longest wait", () => {
    const now = new Date("2026-11-06T12:00:00.000Z");
    const entries = [
      entry({ id: 1, joinedAt: "2026-11-06T11:20:00.000Z", status: "waiting" }),
      entry({
        id: 2,
        joinedAt: "2026-11-06T10:50:00.000Z",
        status: "seated",
        seatedAt: "2026-11-06T11:10:00.000Z",
      }),
      entry({ id: 3, joinedAt: "2026-11-06T10:00:00.000Z", status: "no_show", calledAt: "2026-11-06T10:20:00.000Z" }),
    ];
    const stats = statsFrom(entries, [table(1, "T1", 2), table(2, "T2", 2, "seated")], now);
    expect(stats.waiting).toBe(1);
    expect(stats.seated).toBe(1);
    expect(stats.availableTables).toBe(1);
    expect(stats.longestWaitMinutes).toBe(40);
    expect(stats.avgWaitMinutes).toBe(20);
  });

  it("buckets joins and seats into service hours", () => {
    const entries = [
      entry({ id: 1, joinedAt: "2026-11-06T04:10:00.000Z" }),
      entry({
        id: 2,
        joinedAt: "2026-11-06T04:40:00.000Z",
        status: "seated",
        seatedAt: "2026-11-06T05:10:00.000Z",
      }),
    ];
    const points = buildHourly(entries, "Asia/Jakarta", "11:00", "13:00");
    expect(points.map((point) => point.hour)).toEqual([11, 12, 13]);
    expect(points.find((point) => point.hour === 11)?.joined).toBe(2); // 04:10Z and 04:40Z are 11:10 / 11:40 WIB
    expect(points.find((point) => point.hour === 12)?.seated).toBe(1);
  });

  it("falls back to the configured turn time with sparse data", () => {
    expect(averageTurn([], 55)).toBe(55);
  });
});
