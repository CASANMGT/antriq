import { beforeEach, describe, expect, it } from "vitest";

process.env.PGLITE_DATA_DIR = "memory://";
process.env.DEMO_MODE = "1";

import { q, resetDatabaseForTests } from "@/lib/db";
import {
  acknowledgeTicket,
  callEntry,
  callNext,
  cancelTicket,
  getHostState,
  getOwnerOverview,
  getPublicSnapshot,
  getReportCsv,
  getTicketView,
  joinQueue,
  markNoShow,
  seatEntry,
  setWaitlistStatus,
  undoCall,
  verifyStaffPin,
} from "@/lib/store";
import { AppError } from "@/lib/validation";

describe("store integration (PGlite + demo seed)", () => {
  beforeEach(async () => {
    await resetDatabaseForTests();
  });

  it("seeds a believable service and exposes a public snapshot", async () => {
    const snapshot = await getPublicSnapshot();
    expect(snapshot.restaurant.name).toBe("Nikumaru & Tenka");
    expect(snapshot.waiting).toBe(6);
    expect(snapshot.availableTables).toBe(3);
    expect(snapshot.typicalWaitMinutes).toBeGreaterThan(5);
    expect(snapshot.lastCalledCode).toBe("A-005");
  });

  it("verifies staff PINs and rejects the wrong one", async () => {
    expect((await verifyStaffPin(2, "1357"))?.name).toBe("Ayu Lestari");
    expect(await verifyStaffPin(2, "9999")).toBeNull();
    expect(await verifyStaffPin(999, "1357")).toBeNull();
  });

  it("joins the queue, shows the live ticket, then cancels", async () => {
    const joined = await joinQueue({
      guestName: "Test Guest",
      partySize: 3,
      phone: "081234567890",
      notes: "Window seat",
    });
    expect(joined.code).toMatch(/^A-\d{3,}$/);
    expect(joined.position).toBe(7);

    const view = await getTicketView(joined.token);
    expect(view?.entry.guestName).toBe("Test Guest");
    expect(view?.peopleAhead).toBe(6);
    expect(view?.etaMinutes).toBeGreaterThan(0);

    const cancelled = await cancelTicket(joined.token);
    expect(cancelled.ok).toBe(true);
    const after = await getTicketView(joined.token);
    expect(after?.entry.status).toBe("cancelled");
  });

  it("calls the next fitting party and starts the hold", async () => {
    const before = await getHostState();
    const result = await callNext("Ayu");
    expect(result.ok).toBe(true);
    expect(result.message).toContain("A-001");

    const after = await getHostState();
    expect(after.waiting.length).toBe(before.waiting.length - 1);
    expect(after.called.length).toBe(before.called.length + 1);
    const called = after.called.find((entry) => entry.code === "A-001");
    expect(called).toBeTruthy();
    expect(called!.holdSecondsLeft).toBeGreaterThan(400);
    expect(called!.holdSecondsLeft).toBeLessThanOrEqual(480);
  });

  it("seats a called party at the best-fit table", async () => {
    const called = await callNext("Ayu");
    expect(called.ok).toBe(true);
    const state = await getHostState();
    const entry = state.called.find((item) => item.code === "A-001");
    expect(entry).toBeTruthy();

    const table = state.tables
      .filter((item) => item.status === "available" && item.capacity >= entry!.partySize)
      .sort((a, b) => a.capacity - b.capacity)[0];
    expect(table).toBeTruthy();

    const seated = await seatEntry(entry!.id, table.id, "Ayu");
    expect(seated.ok).toBe(true);

    const after = await getHostState();
    expect(after.called.find((item) => item.code === "A-001")).toBeUndefined();
    expect(after.seated.some((item) => item.code === "A-001")).toBe(true);
    expect(after.tables.find((item) => item.id === table.id)?.status).toBe("seated");
  });

  it("refuses to seat a party that doesn't fit", async () => {
    const state = await getHostState();
    const big = state.waiting.find((entry) => entry.partySize === 6)!;
    const rows = await q<{ id: number }>(
      "insert into dining_tables (label, capacity, zone, status) values ('TX', 2, 'Test', 'available') returning id",
    );
    const result = await seatEntry(big.id, rows[0].id, "Ayu");
    expect(result.ok).toBe(false);
    expect(result.message).toContain("seats 2");
  });

  it("marks a no-show and can undo a call back to the line", async () => {
    const called = await callNext("Ayu");
    expect(called.ok).toBe(true);
    let state = await getHostState();
    const entry = state.called.find((item) => item.code === "A-001")!;

    const undone = await undoCall(entry.id, "Ayu");
    expect(undone.ok).toBe(true);
    state = await getHostState();
    expect(state.waiting.some((item) => item.code === "A-001")).toBe(true);

    const calledAgain = await callNext("Ayu");
    expect(calledAgain.ok).toBe(true);
    state = await getHostState();
    const entryAgain = state.called.find((item) => item.code === "A-001")!;
    const noShow = await markNoShow(entryAgain.id, "Ayu");
    expect(noShow.ok).toBe(true);
    state = await getHostState();
    expect(state.recent.some((item) => item.code === "A-001" && item.status === "no_show")).toBe(true);
  });

  it("acknowledges a called guest once and extends the hold", async () => {
    const joined = await joinQueue({ guestName: "Ack Guest", partySize: 2 });
    const view = await getTicketView(joined.token);
    const called = await callEntry(view!.entry.id, "Ayu");
    expect(called.ok).toBe(true);

    const first = await acknowledgeTicket(joined.token);
    expect(first.ok).toBe(true);
    const afterFirst = await getTicketView(joined.token);
    expect(afterFirst?.entry.acknowledged).toBe(true);
    const firstHold = afterFirst!.entry.holdSecondsLeft;

    const second = await acknowledgeTicket(joined.token);
    expect(second.ok).toBe(true);
    const afterSecond = await getTicketView(joined.token);
    expect(afterSecond!.entry.holdSecondsLeft).toBeLessThanOrEqual(firstHold + 2);
  });

  it("auto-releases a hold that has expired", async () => {
    const called = await callNext("Ayu");
    expect(called.ok).toBe(true);
    await q("update queue_entries set hold_expires_at = now() - interval '1 minute' where code = 'A-001'");
    const state = await getHostState();
    expect(state.called.some((item) => item.code === "A-001")).toBe(false);
    expect(state.recent.some((item) => item.code === "A-001" && item.status === "no_show")).toBe(true);
  });

  it("pausing blocks new joins but walk-ins can still be added", async () => {
    await setWaitlistStatus("paused", "Kitchen catching up", "Rani");
    await expect(
      joinQueue({ guestName: "Blocked Guest", partySize: 2 }),
    ).rejects.toBeInstanceOf(AppError);

    const walkIn = await joinQueue(
      { guestName: "Walk-in Guest", partySize: 2, source: "walkin", actor: "Ayu" },
      true,
    );
    expect(walkIn.code).toMatch(/^A-/);
    await setWaitlistStatus("open", null, "Rani");
    const joined = await joinQueue({ guestName: "Allowed Guest", partySize: 2 });
    expect(joined.token).toBeTruthy();
  });

  it("computes owner metrics and a CSV export", async () => {
    const overview = await getOwnerOverview(7);
    expect(overview.week).toHaveLength(7);
    expect(overview.stats.seated).toBe(10);
    expect(overview.today.avgWaitMinutes).toBeGreaterThan(0);
    expect(overview.today.utilization).toBeGreaterThanOrEqual(0);
    expect(overview.activity.length).toBeGreaterThan(0);

    const csv = await getReportCsv(30);
    expect(csv.split("\r\n")[0]).toContain("code,day,guest");
    expect(csv).toContain("A-001");
  });
});
