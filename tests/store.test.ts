import { beforeEach, describe, expect, it } from "vitest";

process.env.PGLITE_DATA_DIR = "memory://";
process.env.DEMO_MODE = "1";

import { q, resetDatabaseForTests } from "@/lib/db";
import {
  acknowledgeTicket,
  callEntry,
  callNext,
  cancelTicket,
  clearTable,
  getBranchBySlugs,
  getHostState,
  getOwnerOverview,
  getPublicSnapshot,
  getReportCsv,
  getTicketView,
  joinQueue,
  listStaff,
  markNoShow,
  seatEntry,
  setWaitlistStatus,
  undoCall,
  verifyStaffPin,
} from "@/lib/store";
import { AppError } from "@/lib/validation";

async function primaryBranchId(): Promise<number> {
  const found = await getBranchBySlugs("nikumaru", "blok-m");
  if (!found) throw new Error("Demo branch missing");
  return found.branch.id;
}

describe("store integration (PGlite + demo seed)", () => {
  beforeEach(async () => {
    await resetDatabaseForTests();
  });

  it("seeds two brands, three branches and a believable service", async () => {
    const branchId = await primaryBranchId();
    const snapshot = await getPublicSnapshot(branchId);
    expect(snapshot.branch.name).toBe("Nikumaru Blok M");
    expect(snapshot.brand?.name).toBe("Nikumaru");
    expect(snapshot.waiting).toBe(6);
    expect(snapshot.availableTables).toBe(2);
    expect(snapshot.typicalWaitMinutes).toBeGreaterThan(5);
    expect(snapshot.lastCalledCode).toBe("A-005");

    expect(await getBranchBySlugs("nikumaru", "tebet")).not.toBeNull();
    expect(await getBranchBySlugs("tenka", "kamaja")).not.toBeNull();
    expect(await getBranchBySlugs("tenka", "aeon-tanjung-barat")).not.toBeNull();
    expect(await getBranchBySlugs("tenka", "bintaro-xchange")).not.toBeNull();
  });

  it("verifies staff PINs and rejects the wrong one", async () => {
    const people = await listStaff();
    const ayu = people.find((person) => person.name === "Ayu Lestari");
    expect(ayu).toBeTruthy();
    expect((await verifyStaffPin(ayu!.id, "1234"))?.name).toBe("Ayu Lestari");
    expect(await verifyStaffPin(ayu!.id, "9999")).toBeNull();
    expect(await verifyStaffPin(999, "1234")).toBeNull();
  });

  it("joins the queue, shows the live ticket, then cancels", async () => {
    const branchId = await primaryBranchId();
    const joined = await joinQueue(branchId, {
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

    const cancelled = await cancelTicket(joined.token);
    expect(cancelled.ok).toBe(true);
    const after = await getTicketView(joined.token);
    expect(after?.entry.status).toBe("cancelled");
  });

  it("calls the next fitting party and starts the hold", async () => {
    const branchId = await primaryBranchId();
    const before = await getHostState(branchId);
    const result = await callNext(branchId, "Ayu");
    expect(result.ok).toBe(true);
    expect(result.message).toContain("A-001");

    const after = await getHostState(branchId);
    expect(after.waiting.length).toBe(before.waiting.length - 1);
    expect(after.called.length).toBe(before.called.length + 1);
    const called = after.called.find((entry) => entry.code === "A-001");
    expect(called).toBeTruthy();
    expect(called!.holdSecondsLeft).toBeGreaterThan(160);
    expect(called!.holdSecondsLeft).toBeLessThanOrEqual(180);
    expect(called!.countdownPaused).toBe(false);
  });

  it("seats a called party with a seat number and records the PIC", async () => {
    const branchId = await primaryBranchId();
    const called = await callNext(branchId, "Ayu");
    expect(called.ok).toBe(true);
    const state = await getHostState(branchId);
    const entry = state.called.find((item) => item.code === "A-001");
    expect(entry).toBeTruthy();

    const table = state.tables
      .filter((item) => item.status === "available" && item.capacity >= entry!.partySize)
      .sort((a, b) => a.capacity - b.capacity)[0];
    expect(table).toBeTruthy();

    const seated = await seatEntry(branchId, entry!.id, table.id, "Ayu Lestari", 2, 2);
    expect(seated.ok).toBe(true);

    const after = await getHostState(branchId);
    expect(after.called.find((item) => item.code === "A-001")).toBeUndefined();
    const seatedEntry = after.seated.find((item) => item.code === "A-001");
    expect(seatedEntry).toBeTruthy();
    expect(seatedEntry!.seatNumber).toBe(2);
    expect(seatedEntry!.openedBy).toBe("Ayu Lestari");
    expect(seatedEntry!.openedByStaffId).toBe(2);
    expect(after.tables.find((item) => item.id === table.id)?.status).toBe("seated");
  });

  it("refuses to seat a party that doesn't fit", async () => {
    const branchId = await primaryBranchId();
    const state = await getHostState(branchId);
    const big = state.waiting.find((entry) => entry.partySize === 6)!;
    const rows = await q<{ id: number }>(
      "insert into dining_tables (branch_id, label, capacity, zone, status) values ($1, 'TX', 2, 'Test', 'available') returning id",
      [branchId],
    );
    const result = await seatEntry(branchId, big.id, rows[0].id, "Ayu", null);
    expect(result.ok).toBe(false);
    expect(result.message).toContain("seats 2");
  });

  it("marks a no-show and can undo a call back to the line", async () => {
    const branchId = await primaryBranchId();
    const called = await callNext(branchId, "Ayu");
    expect(called.ok).toBe(true);
    let state = await getHostState(branchId);
    const entry = state.called.find((item) => item.code === "A-001")!;

    const undone = await undoCall(branchId, entry.id, "Ayu");
    expect(undone.ok).toBe(true);
    state = await getHostState(branchId);
    expect(state.waiting.some((item) => item.code === "A-001")).toBe(true);

    const calledAgain = await callNext(branchId, "Ayu");
    expect(calledAgain.ok).toBe(true);
    state = await getHostState(branchId);
    const entryAgain = state.called.find((item) => item.code === "A-001")!;
    const noShow = await markNoShow(branchId, entryAgain.id, "Ayu");
    expect(noShow.ok).toBe(true);
    state = await getHostState(branchId);
    expect(state.recent.some((item) => item.code === "A-001" && item.status === "no_show")).toBe(true);
  });

  it("acknowledges a called guest once and pauses the countdown", async () => {
    const branchId = await primaryBranchId();
    const joined = await joinQueue(branchId, { guestName: "Ack Guest", partySize: 2 });
    const view = await getTicketView(joined.token);
    const called = await callEntry(branchId, view!.entry.id, "Ayu");
    expect(called.ok).toBe(true);

    const first = await acknowledgeTicket(joined.token);
    expect(first.ok).toBe(true);
    const afterFirst = await getTicketView(joined.token);
    expect(afterFirst?.entry.acknowledged).toBe(true);
    expect(afterFirst?.entry.countdownPaused).toBe(true);
    expect(afterFirst?.entry.holdSecondsLeft).toBe(0);

    const second = await acknowledgeTicket(joined.token);
    expect(second.ok).toBe(true);
    const afterSecond = await getTicketView(joined.token);
    expect(afterSecond?.entry.countdownPaused).toBe(true);
  });

  it("auto-releases a hold that has expired", async () => {
    const branchId = await primaryBranchId();
    const called = await callNext(branchId, "Ayu");
    expect(called.ok).toBe(true);
    await q("update queue_entries set hold_expires_at = now() - interval '1 minute' where code = 'A-001'");
    const state = await getHostState(branchId);
    expect(state.called.some((item) => item.code === "A-001")).toBe(false);
    expect(state.recent.some((item) => item.code === "A-001" && item.status === "no_show")).toBe(true);
  });

  it("pausing blocks new joins but walk-ins can still be added", async () => {
    const branchId = await primaryBranchId();
    await setWaitlistStatus(branchId, "paused", "Kitchen catching up", "Rani");
    await expect(
      joinQueue(branchId, { guestName: "Blocked Guest", partySize: 2 }),
    ).rejects.toBeInstanceOf(AppError);

    const walkIn = await joinQueue(
      branchId,
      { guestName: "Walk-in Guest", partySize: 2, source: "walkin", actor: "Ayu" },
      true,
    );
    expect(walkIn.code).toMatch(/^A-/);
    await setWaitlistStatus(branchId, "open", null, "Rani");
    const joined = await joinQueue(branchId, { guestName: "Allowed Guest", partySize: 2 });
    expect(joined.token).toBeTruthy();
  });

  it("seats manually without a table or seat number", async () => {
    const branchId = await primaryBranchId();
    const joined = await joinQueue(branchId, { guestName: "Manual Guest", partySize: 2 });
    const view = await getTicketView(joined.token);
    const seated = await seatEntry(branchId, view!.entry.id, null, "Ayu", 2, null);
    expect(seated.ok).toBe(true);
    const after = await getTicketView(joined.token);
    expect(after?.entry.status).toBe("seated");
    expect(after?.entry.tableId).toBeNull();
    expect(after?.entry.seatNumber).toBeNull();
  });

  it("releases a seated table and records the cashier who freed it", async () => {
    const branchId = await primaryBranchId();
    const state = await getHostState(branchId);
    const seated = state.seated.find((entry) => entry.tableId);
    expect(seated).toBeTruthy();

    const result = await clearTable(branchId, seated!.tableId!, "Sari Kasir", 4, "Payment settled");
    expect(result.ok).toBe(true);

    const after = await getHostState(branchId);
    expect(after.tables.find((table) => table.id === seated!.tableId)?.status).toBe("dirty");
    const released = await q<{ released_by: string; status: string }>(
      "select released_by, status from queue_entries where id = $1",
      [seated!.id],
    );
    expect(released[0]?.status).toBe("completed");
    expect(released[0]?.released_by).toBe("Sari Kasir");
  });

  it("computes owner metrics and a CSV export", async () => {
    const branchId = await primaryBranchId();
    const overview = await getOwnerOverview(branchId, 7);
    expect(overview.week).toHaveLength(7);
    expect(overview.stats.seated).toBe(10);
    expect(overview.today.avgWaitMinutes).toBeGreaterThan(0);
    expect(overview.today.utilization).toBeGreaterThanOrEqual(0);
    expect(overview.activity.length).toBeGreaterThan(0);

    const csv = await getReportCsv(branchId, 30);
    expect(csv.split("\r\n")[0]).toContain("code,day,guest");
    expect(csv).toContain("A-001");
    expect(csv).toContain("opened_by");
  });
});
