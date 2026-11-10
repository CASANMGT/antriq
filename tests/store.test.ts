import { beforeEach, describe, expect, it } from "vitest";

process.env.PGLITE_DATA_DIR = "memory://";
process.env.DEMO_MODE = "1";

import { q, resetDatabaseForTests } from "@/lib/db";
import {
  acknowledgeTicket,
  callEntry,
  callNext,
  canManageBranch,
  canManageBrand,
  canOperateBranch,
  cancelTicket,
  clearTable,
  createStaff,
  getBranchBySlugs,
  getBrandAsset,
  getHostState,
  getOwnerOverview,
  getOwnerWeekForBranches,
  getPublicSnapshot,
  getRatingAnalysis,
  getRatingRecords,
  getReportCsv,
  getTicketView,
  joinQueue,
  listBranches,
  listBranchesForStaff,
  listStaff,
  markNoShow,
  rateTicket,
  recallEntry,
  requeueEntry,
  resetGuestDevice,
  seatEntry,
  setBrandAsset,
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
    // Keep queue joins deterministic regardless of when the suite runs.
    await q("update branches set open_time = '00:00', close_time = '23:59'");
  });

  it("seeds two brands, three branches and a believable service", async () => {
    const branchId = await primaryBranchId();
    const snapshot = await getPublicSnapshot(branchId);
    expect(snapshot.branch.name).toBe("Nikumaru Blok M");
    expect(snapshot.brand?.name).toBe("Nikumaru");
    expect(snapshot.waiting).toBe(6);
    expect(snapshot.branch.queueMode).toBe("split");
    expect(snapshot.branch.acknowledgeEnabled).toBe(false);
    expect(snapshot.branch.holdEnabled).toBe(false);
    expect(snapshot.branch.maxPartySize).toBe(10);
    expect(snapshot.waitingA).toBeGreaterThan(0);
    expect(snapshot.waitingB).toBeGreaterThan(0);
    expect(snapshot.waitingA + snapshot.waitingB).toBe(6);
    expect(snapshot.availableTables).toBe(2);
    expect(snapshot.typicalWaitMinutes).toBeGreaterThan(5);
    expect(snapshot.lastCalledCode).toBe("B-005");

    expect(await getBranchBySlugs("nikumaru", "tebet")).not.toBeNull();
    expect(await getBranchBySlugs("tenka", "kamaja")).not.toBeNull();
    expect(await getBranchBySlugs("tenka", "aeon-tanjung-barat")).not.toBeNull();
    expect(await getBranchBySlugs("tenka", "bintaro-xchange")).not.toBeNull();
  });

  it("uses A/B groups by default and can fall back to one queue", async () => {
    const branchId = await primaryBranchId();
    const large = await joinQueue(branchId, { guestName: "Split Large", partySize: 4 });
    expect(large.code).toMatch(/^B-\d{3,}$/);
    const small = await joinQueue(branchId, { guestName: "Split Small", partySize: 2 });
    expect(small.code).toMatch(/^A-\d{3,}$/);

    const snapshot = await getPublicSnapshot(branchId);
    expect(snapshot.branch.queueMode).toBe("split");
    expect(snapshot.waitingA).toBeGreaterThan(0);
    expect(snapshot.waitingB).toBeGreaterThan(0);

    await q("update branches set queue_mode = 'single' where id = $1", [branchId]);
    const single = await joinQueue(branchId, { guestName: "Single Big", partySize: 4 });
    expect(single.code).toMatch(/^A-\d{3,}$/);
  });

  it("combines the daily report across all branches", async () => {
    const branches = await listBranches();
    expect(branches.length).toBeGreaterThanOrEqual(5);
    const week = await getOwnerWeekForBranches(branches.map((branch) => branch.id), 7);
    expect(week).toHaveLength(7);
    expect(week.reduce((sum, day) => sum + day.joined, 0)).toBeGreaterThan(0);
    expect(week.reduce((sum, day) => sum + day.seated, 0)).toBeGreaterThan(0);
  });

  it("seeds hosts who operate their branch without admin rights", async () => {
    const people = await listStaff();
    const host = people.find((person) => person.name === "Host Blok M");
    expect(host?.role).toBe("host");
    expect(await verifyStaffPin(host!.id, "1234")).toBeTruthy();

    const branches = await listBranchesForStaff(host!);
    expect(branches.length).toBe(1);
    const branchId = await primaryBranchId();
    expect(await canOperateBranch(host!, branchId)).toBe(true);
    expect(await canManageBranch(host!, branchId)).toBe(false);
    expect(await canManageBrand(host!, branches[0].brandId)).toBe(false);

    const tebet = (await listBranches()).find((branch) => branch.slug === "tebet")!;
    const created = await createStaff(
      { name: "Host Tebet 2", role: "host", pin: "4321", brandId: tebet.brandId, branchId: tebet.id },
      "Owner",
    );
    expect(created.ok).toBe(true);
    const second = (await listStaff()).find((person) => person.name === "Host Tebet 2");
    expect(second?.role).toBe("host");
    expect(second?.branchId).toBe(tebet.id);
  });

  it("prevents one guest from holding two active tickets", async () => {
    const branchId = await primaryBranchId();
    const phone = "081299990001";
    const first = await joinQueue(branchId, { guestName: "Duplicate One", partySize: 2, phone });

    await expect(
      joinQueue(branchId, { guestName: "Duplicate Two", partySize: 2, phone }),
    ).rejects.toMatchObject({ code: "duplicate_ticket" });

    await expect(
      joinQueue(branchId, { guestName: "Duplicate Token", partySize: 2, guestToken: first.token }),
    ).rejects.toMatchObject({ code: "duplicate_ticket" });

    await cancelTicket(first.token);
    const second = await joinQueue(branchId, { guestName: "Duplicate Three", partySize: 2, phone });
    expect(second.code).toMatch(/^A-\d{3,}$/);
    await cancelTicket(second.token);
  });

  it("lets a host override duplicate protection for a walk-in", async () => {
    const branchId = await primaryBranchId();
    const phone = "081299990002";
    const first = await joinQueue(branchId, { guestName: "Walk-in Existing", partySize: 2, phone });
    const override = await joinQueue(
      branchId,
      { guestName: "Walk-in Override", partySize: 2, phone },
      true,
    );
    expect(first.code).not.toBe(override.code);
    await cancelTicket(first.token);
    await cancelTicket(override.token);
  });

  it("verifies staff PINs and rejects the wrong one", async () => {
    const people = await listStaff();
    const ayu = people.find((person) => person.name === "Host Blok M");
    expect(ayu).toBeTruthy();
    expect((await verifyStaffPin(ayu!.id, "1234"))?.name).toBe("Host Blok M");
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
    expect(joined.code).toMatch(/^B-\d{3,}$/);
    expect(joined.position).toBe(4);

    const view = await getTicketView(joined.token);
    expect(view?.entry.guestName).toBe("Test Guest");
    expect(view?.peopleAhead).toBe(3);

    const cancelled = await cancelTicket(joined.token);
    expect(cancelled.ok).toBe(true);
    const after = await getTicketView(joined.token);
    expect(after?.entry.status).toBe("cancelled");
  });

  it("recalls a called guest and bumps the call count", async () => {
    const branchId = await primaryBranchId();
    await q("update branches set hold_enabled = true where id = $1", [branchId]);
    const joined = await joinQueue(branchId, { guestName: "Recall Guest", partySize: 2 });
    const view = await getTicketView(joined.token);
    await callEntry(branchId, view!.entry.id, "Host Blok M");
    const before = await getTicketView(joined.token);
    const result = await recallEntry(branchId, view!.entry.id, "Host Blok M");
    expect(result.ok).toBe(true);
    const after = await getTicketView(joined.token);
    expect(after?.entry.calledCount).toBe((before?.entry.calledCount ?? 0) + 1);
    expect(after?.entry.acknowledged).toBe(false);
  });

  it("re-enters a no-show guest at the back of the queue", async () => {
    const branchId = await primaryBranchId();
    const joined = await joinQueue(branchId, { guestName: "No Show Return", partySize: 3 });
    const view = await getTicketView(joined.token);
    await callEntry(branchId, view!.entry.id, "Host Blok M");
    const noShow = await markNoShow(branchId, view!.entry.id, "Host Blok M");
    expect(noShow.ok).toBe(true);

    const state = await getHostState(branchId);
    expect(state.noShow.some((entry) => entry.id === view!.entry.id)).toBe(true);

    const result = await requeueEntry(branchId, view!.entry.id, "Host Blok M");
    expect(result.ok).toBe(true);
    const after = await getTicketView(joined.token);
    expect(after?.entry.status).toBe("waiting");
    expect(after?.entry.code).not.toBe(view!.entry.code);
  });

  it("stores a guest rating and exposes it to owner analysis", async () => {
    const branchId = await primaryBranchId();
    const joined = await joinQueue(branchId, { guestName: "Rating Guest", partySize: 2 });
    const view = await getTicketView(joined.token);
    await callEntry(branchId, view!.entry.id, "Host Blok M");
    const seated = await seatEntry(branchId, view!.entry.id, null, "Host Blok M", 2, null);
    expect(seated.ok).toBe(true);

    const rated = await rateTicket(joined.token, 5, "Cepat dan ramah");
    expect(rated.ok).toBe(true);
    const after = await getTicketView(joined.token);
    expect(after?.entry.rating).toBe(5);
    expect(after?.entry.ratingNote).toBe("Cepat dan ramah");

    const overview = await getOwnerOverview(branchId, 7);
    expect(overview.ratings.count).toBeGreaterThanOrEqual(1);
    expect(overview.ratings.distribution[4]).toBeGreaterThanOrEqual(1);

    const analysis = await getRatingAnalysis([branchId], 7);
    expect(analysis[0]?.count).toBeGreaterThanOrEqual(1);
    expect(analysis[0]?.recent[0]?.note).toBe("Cepat dan ramah");

    const records = await getRatingRecords([branchId], 7);
    expect(records[0]?.rating).toBe(5);
    expect(records[0]?.note).toBe("Cepat dan ramah");
  });

  it("lets a waiting guest rate and buckets ratings by hour", async () => {
    const branchId = await primaryBranchId();
    const joined = await joinQueue(branchId, { guestName: "Waiting Rating", partySize: 2 });
    const rated = await rateTicket(joined.token, 4, "Cukup cepat");
    expect(rated.ok).toBe(true);
    const view = await getTicketView(joined.token);
    expect(view?.entry.rating).toBe(4);

    const overview = await getOwnerOverview(branchId, 7);
    expect(overview.ratings.slots.length).toBeGreaterThanOrEqual(1);
    expect(overview.ratings.slots.reduce((sum, slot) => sum + slot.count, 0)).toBeGreaterThanOrEqual(1);

    const analysis = await getRatingAnalysis([branchId], 7);
    expect(analysis[0]?.slots.length).toBeGreaterThanOrEqual(1);
  });

  it("calls the next fitting party and starts the hold", async () => {    const branchId = await primaryBranchId();
    await q("update branches set hold_enabled = true where id = $1", [branchId]);
    const before = await getHostState(branchId);
    const result = await callNext(branchId, "Wuri");
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
    const called = await callNext(branchId, "Wuri");
    expect(called.ok).toBe(true);
    const state = await getHostState(branchId);
    const entry = state.called.find((item) => item.code === "A-001");
    expect(entry).toBeTruthy();

    const table = state.tables
      .filter((item) => item.status === "available" && item.capacity >= entry!.partySize)
      .sort((a, b) => a.capacity - b.capacity)[0];
    expect(table).toBeTruthy();

    const seated = await seatEntry(branchId, entry!.id, table.id, "Wuri", 2, 2);
    expect(seated.ok).toBe(true);

    const after = await getHostState(branchId);
    expect(after.called.find((item) => item.code === "A-001")).toBeUndefined();
    const seatedEntry = after.seated.find((item) => item.code === "A-001");
    expect(seatedEntry).toBeTruthy();
    expect(seatedEntry!.seatNumber).toBe(2);
    expect(seatedEntry!.openedBy).toBe("Wuri");
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
    const result = await seatEntry(branchId, big.id, rows[0].id, "Wuri", null);
    expect(result.ok).toBe(false);
    expect(result.message).toContain("seats 2");
  });

  it("marks a no-show and can undo a call back to the line", async () => {
    const branchId = await primaryBranchId();
    const called = await callNext(branchId, "Wuri");
    expect(called.ok).toBe(true);
    let state = await getHostState(branchId);
    const entry = state.called.find((item) => item.code === "A-001")!;

    const undone = await undoCall(branchId, entry.id, "Wuri");
    expect(undone.ok).toBe(true);
    state = await getHostState(branchId);
    expect(state.waiting.some((item) => item.code === "A-001")).toBe(true);

    const calledAgain = await callNext(branchId, "Wuri");
    expect(calledAgain.ok).toBe(true);
    state = await getHostState(branchId);
    const entryAgain = state.called.find((item) => item.code === "A-001")!;
    const noShow = await markNoShow(branchId, entryAgain.id, "Wuri");
    expect(noShow.ok).toBe(true);
    state = await getHostState(branchId);
    expect(state.recent.some((item) => item.code === "A-001" && item.status === "no_show")).toBe(true);
  });

  it("acknowledges a called guest once and pauses the countdown", async () => {
    const branchId = await primaryBranchId();
    await q("update branches set hold_enabled = true, acknowledge_enabled = true where id = $1", [branchId]);
    const joined = await joinQueue(branchId, { guestName: "Ack Guest", partySize: 2 });
    const view = await getTicketView(joined.token);
    const called = await callEntry(branchId, view!.entry.id, "Wuri");
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

  it("keeps the Saya hadir button off until the branch enables it", async () => {
    const branchId = await primaryBranchId();
    const joined = await joinQueue(branchId, { guestName: "Optional Ack", partySize: 2 });
    const view = await getTicketView(joined.token);
    const called = await callEntry(branchId, view!.entry.id, "Wuri");
    expect(called.ok).toBe(true);

    const disabled = await acknowledgeTicket(joined.token);
    expect(disabled.ok).toBe(false);
    expect(disabled.message).toContain("not enabled");

    await q("update branches set acknowledge_enabled = true, hold_enabled = true where id = $1", [branchId]);
    const enabled = await acknowledgeTicket(joined.token);
    expect(enabled.ok).toBe(true);
  });

  it("keeps the time-to-table countdown off by default", async () => {
    const branchId = await primaryBranchId();
    const called = await callNext(branchId, "Wuri");
    expect(called.ok).toBe(true);
    let state = await getHostState(branchId);
    const entry = state.called.find((item) => item.code === "A-001")!;
    expect(entry.holdSecondsLeft).toBe(0);
    expect(entry.holdExpiresAt).toBeNull();

    // Even a stale expiry must not auto-release while the countdown is disabled.
    await q("update queue_entries set hold_expires_at = now() - interval '1 minute' where code = 'A-001'");
    state = await getHostState(branchId);
    expect(state.called.some((item) => item.code === "A-001")).toBe(true);
    expect(state.recent.some((item) => item.code === "A-001" && item.status === "no_show")).toBe(false);
  });

  it("auto-releases a hold that has expired", async () => {
    const branchId = await primaryBranchId();
    await q("update branches set hold_enabled = true where id = $1", [branchId]);
    const called = await callNext(branchId, "Wuri");
    expect(called.ok).toBe(true);
    await q("update queue_entries set hold_expires_at = now() - interval '1 minute' where code = 'A-001'");
    const state = await getHostState(branchId);
    expect(state.called.some((item) => item.code === "A-001")).toBe(false);
    expect(state.recent.some((item) => item.code === "A-001" && item.status === "no_show")).toBe(true);
  });

  it("pausing blocks new joins but walk-ins can still be added", async () => {
    const branchId = await primaryBranchId();
    await setWaitlistStatus(branchId, "paused", "Kitchen catching up", "Iwanna");
    await expect(
      joinQueue(branchId, { guestName: "Blocked Guest", partySize: 2 }),
    ).rejects.toBeInstanceOf(AppError);

    const walkIn = await joinQueue(
      branchId,
      { guestName: "Walk-in Guest", partySize: 2, source: "walkin", actor: "Wuri" },
      true,
    );
    expect(walkIn.code).toMatch(/^A-/);
    await setWaitlistStatus(branchId, "open", null, "Iwanna");
    const joined = await joinQueue(branchId, { guestName: "Allowed Guest", partySize: 2 });
    expect(joined.token).toBeTruthy();
  });

  it("lets a seated guest reset the device and join again", async () => {
    const branchId = await primaryBranchId();
    const phone = "081299990050";
    const first = await joinQueue(branchId, { guestName: "Seated Reset", partySize: 2, phone });
    const view = await getTicketView(first.token);
    const seated = await seatEntry(branchId, view!.entry.id, null, "Wuri", 2, null);
    expect(seated.ok).toBe(true);

    await expect(
      joinQueue(branchId, { guestName: "Still Seated", partySize: 2, phone }),
    ).rejects.toBeInstanceOf(AppError);

    const reset = await resetGuestDevice(first.token);
    expect(reset.ok).toBe(true);
    const after = await getTicketView(first.token);
    expect(after?.entry.status).toBe("completed");

    const next = await joinQueue(branchId, { guestName: "New Queue", partySize: 2, phone });
    expect(next.token).toBeTruthy();
  });

  it("seats manually without a table or seat number", async () => {
    const branchId = await primaryBranchId();
    const joined = await joinQueue(branchId, { guestName: "Manual Guest", partySize: 2 });
    const view = await getTicketView(joined.token);
    const seated = await seatEntry(branchId, view!.entry.id, null, "Wuri", 2, null);
    expect(seated.ok).toBe(true);
    const after = await getTicketView(joined.token);
    expect(after?.entry.status).toBe("seated");
    expect(after?.entry.tableId).toBeNull();
    expect(after?.entry.seatNumber).toBeNull();
  });

  it("can extend the countdown instead of pausing when the guest says I'm here", async () => {
    const branchId = await primaryBranchId();
    await q("update branches set acknowledge_action='extend', acknowledge_minutes=5, acknowledge_enabled=true, hold_enabled=true where id=$1", [branchId]);
    const joined = await joinQueue(branchId, { guestName: "Extend Guest", partySize: 2 });
    const view = await getTicketView(joined.token);
    const called = await callEntry(branchId, view!.entry.id, "Wuri");
    expect(called.ok).toBe(true);

    const ack = await acknowledgeTicket(joined.token);
    expect(ack.ok).toBe(true);
    const after = await getTicketView(joined.token);
    expect(after?.entry.acknowledged).toBe(true);
    expect(after?.entry.countdownPaused).toBe(false);
    expect(after?.entry.holdSecondsLeft).toBeGreaterThan(250);
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

  it("saves and reads brand logo and menu assets", async () => {
    const branchId = await primaryBranchId();
    const branch = await getBranchBySlugs("nikumaru", "blok-m");
    expect(branch).toBeTruthy();
    const brandId = branch!.brand.id;

    const logo = new Uint8Array(Buffer.from("<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>"));
    await setBrandAsset(brandId, "logo", logo, "image/svg+xml", null, "Iwanna");
    const savedLogo = await getBrandAsset(brandId, "logo");
    expect(savedLogo?.mime).toBe("image/svg+xml");
    expect(savedLogo?.data.byteLength).toBe(logo.byteLength);

    const menu = new Uint8Array(Buffer.from("%PDF-1.4 test"));
    await setBrandAsset(brandId, "menu", menu, "application/pdf", "menu.pdf", "Iwanna");
    const savedMenu = await getBrandAsset(brandId, "menu");
    expect(savedMenu?.mime).toBe("application/pdf");
    expect(savedMenu?.filename).toBe("menu.pdf");
    expect(branchId).toBeGreaterThan(0);
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
