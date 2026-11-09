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
  statsFrom,
} from "./queue";
import { addDaysToDay, dayInTz, elapsedMinutes, isOpenAt, parseTimeToMinutes } from "./time";
import { isDemoAutoReset, isDemoMode, seedDatabase } from "./seed";
import { PRIMARY_BRANCH_ID } from "./schema";
import type {
  ActionResult,
  AcknowledgeAction,
  ActivityItem,
  Brand,
  Branch,
  BranchSummary,
  DayPoint,
  DiningTable,
  EntryStatus,
  HostState,
  OwnerOverview,
  PublicSnapshot,
  PublicStaff,
  QueueCategory,
  QueueEntry,
  QueueMode,
  QueueSource,
  Role,
  SeatingMode,
  TableStatus,
  TicketView,
  WaitlistStatus,
} from "./types";
import {
  AppError,
  cleanText,
  clampInt,
  normalizePhone,
  validateAccent,
  validateGuestName,
  validateNotes,
  validatePartySize,
  validatePin,
  validateTableLabel,
  validateTime,
  validateZone,
} from "./validation";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const ENTRY_COLUMNS = `
  qe.id, qe.branch_id, qe.token, qe.code, to_char(qe.day, 'YYYY-MM-DD') as day_text, qe.seq,
  qe.category, qe.guest_name, qe.phone, qe.party_size, qe.notes, qe.source, qe.status,
  qe.table_id, qe.seat_number, qe.opened_by, qe.opened_by_staff_id,
  qe.released_by, qe.released_by_staff_id,
  qe.called_count, qe.acknowledged, qe.joined_at, qe.called_at,
  qe.hold_expires_at, qe.seated_at, qe.closed_at, qe.cancelled_by,
  t.label as table_label
`;

const BRAND_COLUMNS = `b.id, b.name, b.slug, b.instagram, b.description, b.accent,
  (b.logo_data is not null) as has_logo, (b.menu_data is not null) as has_menu,
  b.menu_filename, b.created_at`;

function toIso(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function mapBrand(row: Row): Brand {
  return {
    id: toNumber(row.id),
    name: String(row.name),
    slug: String(row.slug),
    instagram: row.instagram ?? null,
    description: row.description ?? null,
    accent: String(row.accent ?? "#F24B3F"),
    hasLogo: Boolean(row.has_logo),
    hasMenu: Boolean(row.has_menu),
    menuFilename: row.menu_filename ?? null,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
  };
}

function mapBranch(row: Row): Branch {
  return {
    id: toNumber(row.id),
    brandId: toNumber(row.brand_id),
    brandName: row.brand_name ?? undefined,
    brandSlug: row.brand_slug ?? undefined,
    name: String(row.name),
    slug: String(row.slug),
    tagline: row.tagline ?? null,
    address: row.address ?? null,
    phone: row.phone ?? null,
    instagram: row.instagram ?? row.brand_instagram ?? null,
    latitude:
      row.latitude === null || row.latitude === undefined ? null : Number(row.latitude),
    longitude:
      row.longitude === null || row.longitude === undefined ? null : Number(row.longitude),
    timezone: String(row.timezone ?? "Asia/Jakarta"),
    openTime: String(row.open_time ?? "11:00"),
    closeTime: String(row.close_time ?? "23:30"),
    accent: String(row.accent ?? row.brand_accent ?? "#F24B3F"),
    announcement: row.announcement ?? null,
    waitlistStatus: (row.waitlist_status ?? "open") as WaitlistStatus,
    pauseReason: row.pause_reason ?? null,
    seatingMode: (row.seating_mode ?? "queue") as SeatingMode,
    queueMode: (row.queue_mode === "split" ? "split" : "single") as QueueMode,
    avgTurnMinutes: toNumber(row.avg_turn_minutes, 55),
    holdMinutes: toNumber(row.hold_minutes, 3),
    acknowledgeAction: (row.acknowledge_action === "extend" ? "extend" : "pause") as AcknowledgeAction,
    acknowledgeMinutes: toNumber(row.acknowledge_minutes, 3),
    acknowledgeEnabled: Boolean(row.acknowledge_enabled),
    maxPartySize: toNumber(row.max_party_size, 12),
    maxQueueSize: toNumber(row.max_queue_size, 40),
    autoNoShow: Boolean(row.auto_no_show),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString(),
  };
}

function mapTable(row: Row): DiningTable {
  return {
    id: toNumber(row.id),
    branchId: toNumber(row.branch_id),
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
  const waitUntil = calledAt ?? seatedAt ?? closedAt ?? now.toISOString();

  return {
    id: toNumber(row.id),
    branchId: toNumber(row.branch_id),
    code: String(row.code),
    day: String(row.day_text ?? row.day ?? "").slice(0, 10),
    seq: toNumber(row.seq),
    category: (row.category === "B" ? "B" : "A") as QueueCategory,
    guestName: String(row.guest_name),
    phone: row.phone ?? null,
    partySize: toNumber(row.party_size),
    notes: row.notes ?? null,
    source: (row.source ?? "qr") as QueueSource,
    status: (row.status ?? "waiting") as EntryStatus,
    tableId,
    tableLabel: row.table_label ?? (tableId ? tablesById.get(tableId) ?? null : null),
    seatNumber: row.seat_number === null || row.seat_number === undefined ? null : toNumber(row.seat_number),
    openedBy: row.opened_by ?? null,
    openedByStaffId: row.opened_by_staff_id ? toNumber(row.opened_by_staff_id) : null,
    releasedBy: row.released_by ?? null,
    releasedByStaffId: row.released_by_staff_id ? toNumber(row.released_by_staff_id) : null,
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
    countdownPaused: row.status === "called" && Boolean(row.acknowledged) && holdExpiresAt === null,
  };
}

function mapStaff(row: Row): PublicStaff {
  return {
    id: toNumber(row.id),
    name: String(row.name),
    role: (row.role ?? "greeter") as Role,
    initials: row.initials ?? null,
    brandId: row.brand_id === null || row.brand_id === undefined ? null : toNumber(row.brand_id),
    branchId: row.branch_id === null || row.branch_id === undefined ? null : toNumber(row.branch_id),
    brandName: row.brand_name ?? null,
    branchName: row.branch_name ?? null,
  };
}

function tablesByIdMap(tables: DiningTable[]): Map<number, string> {
  return new Map(tables.map((table) => [table.id, table.label]));
}

async function logActivity(
  db: Queryable | null,
  branchId: number | null,
  type: string,
  actor: string | null,
  payload: {
    entryId?: number | null;
    tableId?: number | null;
    code?: string | null;
    name?: string | null;
    partySize?: number | null;
    tableLabel?: string | null;
    seatNumber?: number | null;
    note?: string | null;
  },
  at?: string,
): Promise<void> {
  const runner: Queryable = db ?? { query: q };
  await runner.query(
    `insert into activity (branch_id, type, entry_id, table_id, actor, detail, created_at)
     values ($1,$2,$3,$4,$5,$6::jsonb, coalesce($7::timestamptz, now()))`,
    [
      branchId,
      type,
      payload.entryId ?? null,
      payload.tableId ?? null,
      actor,
      JSON.stringify({
        code: payload.code ?? null,
        name: payload.name ?? null,
        partySize: payload.partySize ?? null,
        tableLabel: payload.tableLabel ?? null,
        seatNumber: payload.seatNumber ?? null,
        note: payload.note ?? null,
      }),
      at ?? null,
    ],
  );
}

/* ------------------------------- brands --------------------------------- */

export async function listBrands(): Promise<Brand[]> {
  const rows = await q<Row>(`select ${BRAND_COLUMNS} from brands b order by b.name asc`);
  return rows.map(mapBrand);
}

export async function getBrand(id: number): Promise<Brand | null> {
  const rows = await q<Row>(`select ${BRAND_COLUMNS} from brands b where b.id = $1`, [id]);
  return rows[0] ? mapBrand(rows[0]) : null;
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  const rows = await q<Row>(`select ${BRAND_COLUMNS} from brands b where b.slug = $1`, [slug]);
  return rows[0] ? mapBrand(rows[0]) : null;
}

export interface BrandPatch {
  name?: string;
  slug?: string;
  instagram?: string | null;
  description?: string | null;
  accent?: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function createBrand(input: BrandPatch, actor: string): Promise<Brand> {
  const name = cleanText(input.name, 80);
  if (!name) throw new AppError("Brand name is required.");
  const slug = slugify(input.slug || name);
  if (!slug) throw new AppError("Brand slug is required.");
  try {
    const rows = await q<Row>(
      `insert into brands (name, slug, instagram, description, accent)
       values ($1,$2,$3,$4,$5) returning *`,
      [
        name,
        slug,
        input.instagram ? cleanText(input.instagram, 60) : null,
        input.description ? cleanText(input.description, 300) : null,
        validateAccent(input.accent ?? "#F24B3F"),
      ],
    );
    await logActivity(null, null, "brand_added", actor, { note: `${name} added` });
    return mapBrand({ ...rows[0], has_logo: false, has_menu: false });
  } catch (error) {
    if (String(error).includes("duplicate key")) throw new AppError("That brand slug is already used.");
    throw error;
  }
}

export async function updateBrand(id: number, input: BrandPatch, actor: string): Promise<Brand> {
  const current = await getBrand(id);
  if (!current) throw new AppError("Brand not found.");
  const name = input.name !== undefined ? cleanText(input.name, 80) : current.name;
  const slug = input.slug !== undefined ? slugify(input.slug) : current.slug;
  if (!name || !slug) throw new AppError("Brand name and slug are required.");
  try {
    const rows = await q<Row>(
      `update brands set name=$2, slug=$3, instagram=$4, description=$5, accent=$6, updated_at=now()
       where id=$1 returning *`,
      [
        id,
        name,
        slug,
        input.instagram !== undefined ? cleanText(input.instagram, 60) || null : current.instagram,
        input.description !== undefined ? cleanText(input.description, 300) || null : current.description,
        input.accent !== undefined ? validateAccent(input.accent) : current.accent,
      ],
    );
    await logActivity(null, null, "brand_updated", actor, { note: `${name} updated` });
    return mapBrand({
      ...rows[0],
      has_logo: current.hasLogo,
      has_menu: current.hasMenu,
    });
  } catch (error) {
    if (String(error).includes("duplicate key")) throw new AppError("That brand slug is already used.");
    throw error;
  }
}

export async function setBrandAsset(
  id: number,
  kind: "logo" | "menu",
  data: Uint8Array,
  mime: string,
  filename: string | null,
  actor: string,
): Promise<void> {
  const brand = await getBrand(id);
  if (!brand) throw new AppError("Brand not found.");
  if (kind === "logo") {
    await q("update brands set logo_data=$2, logo_mime=$3, updated_at=now() where id=$1", [id, Buffer.from(data), mime]);
  } else {
    await q(
      "update brands set menu_data=$2, menu_mime=$3, menu_filename=$4, updated_at=now() where id=$1",
      [id, Buffer.from(data), mime, filename],
    );
  }
  await logActivity(null, null, "brand_asset", actor, { note: `${kind} uploaded for ${brand.name}` });
}

export async function getBrandAsset(
  id: number,
  kind: "logo" | "menu",
): Promise<{ data: Uint8Array; mime: string; filename: string | null } | null> {
  const rows = await q<Row>(
    kind === "logo"
      ? "select logo_data as data, logo_mime as mime, null as filename from brands where id=$1 and logo_data is not null"
      : "select menu_data as data, menu_mime as mime, menu_filename as filename from brands where id=$1 and menu_data is not null",
    [id],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    data: row.data as Uint8Array,
    mime: String(row.mime ?? "application/octet-stream"),
    filename: row.filename ?? null,
  };
}

/* ------------------------------ branches -------------------------------- */

const BRANCH_SELECT = `br.*, b.name as brand_name, b.slug as brand_slug, b.instagram as brand_instagram,
  b.accent as brand_accent, b.description as brand_description`;

export async function getBranch(id: number): Promise<Branch> {
  const rows = await q<Row>(
    `select ${BRANCH_SELECT} from branches br join brands b on b.id = br.brand_id where br.id = $1`,
    [id],
  );
  if (!rows[0]) throw new Error("Branch not found");
  return mapBranch(rows[0]);
}

/** @deprecated use getBranch */
export async function getRestaurant(branchId = PRIMARY_BRANCH_ID): Promise<Branch> {
  return getBranch(branchId);
}

export async function getPrimaryBranch(): Promise<{ branch: Branch; brand: Brand }> {
  const rows = await q<Row>(
    `select br.id from branches br order by br.id asc limit 1`,
  );
  if (!rows[0]) throw new Error("No branch configured");
  const branch = await getBranch(toNumber(rows[0].id));
  const brand = await getBrand(branch.brandId);
  if (!brand) throw new Error("Brand not configured");
  return { branch, brand };
}

export async function getBranchBySlugs(
  brandSlug: string,
  branchSlug: string,
): Promise<{ branch: Branch; brand: Brand } | null> {
  const rows = await q<Row>(
    `select br.id
     from branches br join brands b on b.id = br.brand_id
     where b.slug = $1 and br.slug = $2`,
    [brandSlug, branchSlug],
  );
  if (!rows[0]) return null;
  const branch = await getBranch(toNumber(rows[0].id));
  const brand = await getBrand(branch.brandId);
  if (!brand) return null;
  return { branch, brand };
}

export async function listBranches(brandId?: number): Promise<BranchSummary[]> {
  const rows = await q<Row>(
    `select br.id, br.name, br.slug, br.brand_id, b.name as brand_name, b.slug as brand_slug,
            br.tagline, br.address, br.phone, br.timezone, br.open_time, br.close_time,
            coalesce(br.accent, b.accent) as accent, br.announcement, br.waitlist_status, br.seating_mode,
            br.queue_mode, br.hold_minutes, br.acknowledge_action, br.acknowledge_minutes,
            br.acknowledge_enabled, br.latitude, br.longitude
     from branches br join brands b on b.id = br.brand_id
     ${brandId ? "where br.brand_id = $1" : ""}
     order by b.name asc, br.name asc`,
    brandId ? [brandId] : [],
  );
  return rows.map((row) => ({
    id: toNumber(row.id),
    name: String(row.name),
    slug: String(row.slug),
    brandId: toNumber(row.brand_id),
    brandName: String(row.brand_name),
    brandSlug: String(row.brand_slug),
    tagline: row.tagline ?? null,
    address: row.address ?? null,
    phone: row.phone ?? null,
    timezone: String(row.timezone ?? "Asia/Jakarta"),
    openTime: String(row.open_time ?? "11:00"),
    closeTime: String(row.close_time ?? "23:30"),
    accent: String(row.accent ?? "#F24B3F"),
    announcement: row.announcement ?? null,
    waitlistStatus: (row.waitlist_status ?? "open") as WaitlistStatus,
    seatingMode: (row.seating_mode ?? "queue") as SeatingMode,
    queueMode: (row.queue_mode === "split" ? "split" : "single") as QueueMode,
    holdMinutes: toNumber(row.hold_minutes, 3),
    acknowledgeAction: (row.acknowledge_action === "extend" ? "extend" : "pause") as AcknowledgeAction,
    acknowledgeMinutes: toNumber(row.acknowledge_minutes, 3),
    acknowledgeEnabled: Boolean(row.acknowledge_enabled),
    latitude: row.latitude === null || row.latitude === undefined ? null : Number(row.latitude),
    longitude: row.longitude === null || row.longitude === undefined ? null : Number(row.longitude),
  }));
}

export async function listBranchesForStaff(staff: {
  role: Role;
  brandId: number | null;
  branchId: number | null;
}): Promise<BranchSummary[]> {
  const all = await listBranches();
  const elevated = staff.role === "owner" || staff.role === "manager";
  if (elevated && !staff.brandId && !staff.branchId) return all;
  if (elevated && staff.brandId && !staff.branchId) {
    return all.filter((branch) => branch.brandId === staff.brandId);
  }
  if (staff.branchId) return all.filter((branch) => branch.id === staff.branchId);
  return [];
}

export async function canManageBranch(
  staff: { role: Role; brandId: number | null; branchId: number | null },
  branchId: number,
): Promise<boolean> {
  if (staff.role !== "owner") return false;
  if (!staff.brandId && !staff.branchId) return true;
  const branches = await listBranchesForStaff(staff);
  return branches.some((branch) => branch.id === branchId);
}

export async function canManageBrand(
  staff: { role: Role; brandId: number | null; branchId: number | null },
  brandId: number,
): Promise<boolean> {
  if (staff.role !== "owner") return false;
  if (!staff.brandId && !staff.branchId) return true;
  if (staff.brandId === brandId) return true;
  if (staff.branchId) {
    const branch = await getBranch(staff.branchId);
    return branch.brandId === brandId;
  }
  return false;
}

export async function canOperateBranch(
  staff: { role: Role; brandId: number | null; branchId: number | null },
  branchId: number,
): Promise<boolean> {
  if (staff.role === "owner" || staff.role === "manager") {
    const branches = await listBranchesForStaff(staff);
    return branches.some((branch) => branch.id === branchId);
  }
  if (!staff.branchId) return false;
  return staff.branchId === branchId;
}

export interface BranchPatch {
  name?: string;
  slug?: string;
  tagline?: string | null;
  address?: string | null;
  phone?: string | null;
  timezone?: string;
  openTime?: string;
  closeTime?: string;
  accent?: string | null;
  announcement?: string | null;
  seatingMode?: SeatingMode;
  queueMode?: QueueMode;
  avgTurnMinutes?: number;
  latitude?: number | null;
  longitude?: number | null;
  holdMinutes?: number;
  acknowledgeAction?: AcknowledgeAction;
  acknowledgeMinutes?: number;
  acknowledgeEnabled?: boolean;
  maxPartySize?: number;
  maxQueueSize?: number;
  autoNoShow?: boolean;
}

export async function createBranch(brandId: number, input: BranchPatch, actor: string): Promise<Branch> {
  const brand = await getBrand(brandId);
  if (!brand) throw new AppError("Brand not found.");
  const name = cleanText(input.name, 80);
  if (!name) throw new AppError("Branch name is required.");
  const slug = slugify(input.slug || name);
  const timezone = input.timezone ? cleanText(input.timezone, 60) : "Asia/Jakarta";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
  } catch {
    throw new AppError("That timezone isn't recognised.");
  }
  const latitude = input.latitude === null || input.latitude === undefined ? null : Number(input.latitude);
  const longitude = input.longitude === null || input.longitude === undefined ? null : Number(input.longitude);
  if (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
    throw new AppError("Latitude must be between -90 and 90.");
  }
  if (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
    throw new AppError("Longitude must be between -180 and 180.");
  }
  try {
    const rows = await q<Row>(
      `insert into branches
        (brand_id, name, slug, tagline, address, phone, latitude, longitude, timezone, open_time, close_time, accent, announcement,
         seating_mode, queue_mode, avg_turn_minutes, hold_minutes, acknowledge_action, acknowledge_minutes, acknowledge_enabled,
         max_party_size, max_queue_size, auto_no_show)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
       returning *`,
      [
        brandId,
        name,
        slug,
        input.tagline ? cleanText(input.tagline, 120) : null,
        input.address ? cleanText(input.address, 200) : null,
        input.phone ? cleanText(input.phone, 40) : null,
        latitude,
        longitude,
        timezone,
        input.openTime ? validateTime(input.openTime, "Opening time") : "11:00",
        input.closeTime ? validateTime(input.closeTime, "Closing time") : "23:30",
        input.accent ? validateAccent(input.accent) : null,
        input.announcement ? cleanText(input.announcement, 300) : null,
        input.seatingMode === "plan" ? "plan" : input.seatingMode === "manual" ? "manual" : "queue",
        input.queueMode === "split" ? "split" : "single",
        clampInt(input.avgTurnMinutes ?? 55, 10, 240, 55),
        clampInt(input.holdMinutes ?? 3, 2, 30, 3),
        input.acknowledgeAction === "extend" ? "extend" : "pause",
        clampInt(input.acknowledgeMinutes ?? 3, 1, 30, 3),
        input.acknowledgeEnabled ?? false,
        clampInt(input.maxPartySize ?? 12, 1, 40, 12),
        clampInt(input.maxQueueSize ?? 40, 1, 500, 40),
        input.autoNoShow ?? true,
      ],
    );
    await logActivity(null, toNumber(rows[0].id), "branch_added", actor, { note: `${name} added` });
    return getBranch(toNumber(rows[0].id));
  } catch (error) {
    if (String(error).includes("duplicate key")) throw new AppError("That branch slug is already used for this brand.");
    throw error;
  }
}

export async function updateBranch(
  branchId: number,
  patch: BranchPatch,
  actor: string,
): Promise<Branch> {
  const current = await getBranch(branchId);
  const next = {
    name: patch.name !== undefined ? cleanText(patch.name, 80) : current.name,
    slug: patch.slug !== undefined ? slugify(patch.slug) : current.slug,
    tagline: patch.tagline !== undefined ? cleanText(patch.tagline, 120) || null : current.tagline,
    address: patch.address !== undefined ? cleanText(patch.address, 200) || null : current.address,
    phone: patch.phone !== undefined ? cleanText(patch.phone, 40) || null : current.phone,
    timezone: patch.timezone ? cleanText(patch.timezone, 60) : current.timezone,
    openTime: patch.openTime !== undefined ? validateTime(patch.openTime, "Opening time") : current.openTime,
    closeTime: patch.closeTime !== undefined ? validateTime(patch.closeTime, "Closing time") : current.closeTime,
    accent: patch.accent !== undefined ? (patch.accent ? validateAccent(patch.accent) : null) : current.accent,
    announcement:
      patch.announcement !== undefined ? cleanText(patch.announcement, 300) || null : current.announcement,
    latitude: (() => {
      if (patch.latitude === undefined) return current.latitude;
      if (patch.latitude === null) return null;
      const value = Number(patch.latitude);
      if (!Number.isFinite(value) || value < -90 || value > 90) {
        throw new AppError("Latitude must be between -90 and 90.");
      }
      return value;
    })(),
    longitude: (() => {
      if (patch.longitude === undefined) return current.longitude;
      if (patch.longitude === null) return null;
      const value = Number(patch.longitude);
      if (!Number.isFinite(value) || value < -180 || value > 180) {
        throw new AppError("Longitude must be between -180 and 180.");
      }
      return value;
    })(),
    seatingMode:
      patch.seatingMode === "plan"
        ? "plan"
        : patch.seatingMode === "manual"
          ? "manual"
          : patch.seatingMode === "queue"
            ? "queue"
            : current.seatingMode,
    queueMode:
      patch.queueMode === "split" ? "split" : patch.queueMode === "single" ? "single" : current.queueMode,
    avgTurnMinutes: clampInt(patch.avgTurnMinutes ?? current.avgTurnMinutes, 10, 240, current.avgTurnMinutes),
    holdMinutes: clampInt(patch.holdMinutes ?? current.holdMinutes, 2, 30, current.holdMinutes),
    acknowledgeAction:
      patch.acknowledgeAction === "extend"
        ? "extend"
        : patch.acknowledgeAction === "pause"
          ? "pause"
          : current.acknowledgeAction,
    acknowledgeMinutes: clampInt(
      patch.acknowledgeMinutes ?? current.acknowledgeMinutes,
      1,
      30,
      current.acknowledgeMinutes,
    ),
    acknowledgeEnabled: patch.acknowledgeEnabled ?? current.acknowledgeEnabled,
    maxPartySize: clampInt(patch.maxPartySize ?? current.maxPartySize, 1, 40, current.maxPartySize),
    maxQueueSize: clampInt(patch.maxQueueSize ?? current.maxQueueSize, 1, 500, current.maxQueueSize),
    autoNoShow: patch.autoNoShow ?? current.autoNoShow,
  };
  if (!next.name || !next.slug) throw new AppError("Branch name and slug are required.");
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: next.timezone });
  } catch {
    throw new AppError("That timezone isn't recognised.");
  }
  if (parseTimeToMinutes(next.openTime) === parseTimeToMinutes(next.closeTime)) {
    throw new AppError("Opening and closing times cannot be the same.");
  }
  try {
    await q<Row>(
      `update branches set name=$2, slug=$3, tagline=$4, address=$5, phone=$6, timezone=$7,
        open_time=$8, close_time=$9, accent=$10, announcement=$11, seating_mode=$12, avg_turn_minutes=$13,
        hold_minutes=$14, acknowledge_action=$15, acknowledge_minutes=$16,
        max_party_size=$17, max_queue_size=$18, auto_no_show=$19, queue_mode=$20,
        latitude=$21, longitude=$22, acknowledge_enabled=$23, updated_at=now()
       where id=$1 returning *`,
      [
        branchId,
        next.name,
        next.slug,
        next.tagline,
        next.address,
        next.phone,
        next.timezone,
        next.openTime,
        next.closeTime,
        next.accent,
        next.announcement,
        next.seatingMode,
        next.avgTurnMinutes,
        next.holdMinutes,
        next.acknowledgeAction,
        next.acknowledgeMinutes,
        next.maxPartySize,
        next.maxQueueSize,
        next.autoNoShow,
        next.queueMode,
        next.latitude,
        next.longitude,
        next.acknowledgeEnabled,
      ],
    );
    await logActivity(null, branchId, "settings", actor, { note: "Branch settings updated" });
    return getBranch(branchId);
  } catch (error) {
    if (String(error).includes("duplicate key")) throw new AppError("That branch slug is already used for this brand.");
    throw error;
  }
}

/* -------------------------------- staff --------------------------------- */

export async function listStaffPublic(): Promise<PublicStaff[]> {
  const rows = await q<Row>(
    `select s.id, s.name, s.role, s.initials, s.brand_id, s.branch_id,
            b.name as brand_name, br.name as branch_name
     from staff s
     left join brands b on b.id = s.brand_id
     left join branches br on br.id = s.branch_id
     where s.active = true
     order by s.role desc, s.name asc`,
  );
  return rows.map(mapStaff);
}

export async function countStaffWithPin(pin: string, ids?: number[]): Promise<number> {
  const rows = await q<Row>("select id, pin_hash from staff where active = true");
  const wanted = ids ? new Set(ids) : null;
  const { verifyPin } = await import("./pin");
  return rows.filter((row) => (!wanted || wanted.has(toNumber(row.id))) && verifyPin(pin, String(row.pin_hash))).length;
}

export async function listStaff(): Promise<(PublicStaff & { active: boolean; createdAt: string })[]> {
  const rows = await q<Row>(
    `select s.id, s.name, s.role, s.initials, s.brand_id, s.branch_id, s.active, s.created_at,
            b.name as brand_name, br.name as branch_name
     from staff s
     left join brands b on b.id = s.brand_id
     left join branches br on br.id = s.branch_id
     order by s.role desc, s.name asc`,
  );
  return rows.map((row) => ({
    ...mapStaff(row),
    active: Boolean(row.active),
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
  }));
}

export async function verifyStaffPin(id: number, pin: string): Promise<PublicStaff | null> {
  const rows = await q<Row>(
    `select s.id, s.name, s.role, s.initials, s.brand_id, s.branch_id, s.pin_hash, s.active,
            b.name as brand_name, br.name as branch_name
     from staff s
     left join brands b on b.id = s.brand_id
     left join branches br on br.id = s.branch_id
     where s.id = $1`,
    [id],
  );
  const row = rows[0];
  if (!row || !row.active) return null;
  const { verifyPin } = await import("./pin");
  if (!verifyPin(pin, String(row.pin_hash))) return null;
  return mapStaff(row);
}

export async function createStaff(
  input: { name: string; role: Role; pin: string; brandId: number | null; branchId: number | null },
  actor: string,
): Promise<ActionResult> {
  const name = validateGuestName(input.name);
  const pin = validatePin(input.pin);
  const role: Role =
    input.role === "owner"
      ? "owner"
      : input.role === "manager"
        ? "manager"
        : input.role === "cashier"
          ? "cashier"
          : "greeter";
  const frontLine = role === "greeter" || role === "cashier";
  if (frontLine && !input.branchId) {
    return { ok: false, message: "Greeters and cashiers need a branch." };
  }
  if ((role === "owner" || role === "manager") && !input.brandId && input.branchId) {
    return { ok: false, message: "A branch cannot exist without a brand." };
  }
  const { hashPin } = await import("./pin");
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  await q<Row>(
    "insert into staff (name, role, pin_hash, initials, brand_id, branch_id) values ($1,$2,$3,$4,$5,$6) returning id",
    [name, role, hashPin(pin), initials, input.brandId, input.branchId],
  );
  await logActivity(null, input.branchId, "staff_added", actor, {
    note: `${name} · ${role}`,
  });
  return { ok: true, message: `${name} can now sign in.` };
}

export async function updateStaff(
  id: number,
  input: { name?: string; role: Role; pin?: string; brandId: number | null; branchId: number | null },
  actor: string,
): Promise<ActionResult> {
  const rows = await q<Row>("select id, name, role, brand_id, branch_id from staff where id = $1", [id]);
  const current = rows[0];
  if (!current) return { ok: false, message: "Team member not found." };
  const name = input.name !== undefined ? validateGuestName(input.name) : String(current.name);
  const role: Role =
    input.role === "owner"
      ? "owner"
      : input.role === "manager"
        ? "manager"
        : input.role === "cashier"
          ? "cashier"
          : "greeter";
  const frontLine = role === "greeter" || role === "cashier";
  if (frontLine && !input.branchId) {
    return { ok: false, message: "Greeters and cashiers need a branch." };
  }
  if ((role === "owner" || role === "manager") && !input.brandId && input.branchId) {
    return { ok: false, message: "A branch cannot exist without a brand." };
  }
  if (current.role === "owner" && role !== "owner") {
    const owners = await q<Row>(
      "select count(*)::int as count from staff where role = 'owner' and active = true and brand_id is null and branch_id is null",
    );
    if (toNumber(owners[0]?.count) <= 1) {
      return { ok: false, message: "You need at least one platform owner." };
    }
  }
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  await q(
    `update staff set name=$2, role=$3, brand_id=$4, branch_id=$5, initials=$6
     where id=$1`,
    [id, name, role, input.brandId, input.branchId, initials],
  );
  if (input.pin) {
    const { hashPin } = await import("./pin");
    await q("update staff set pin_hash=$2 where id=$1", [id, hashPin(validatePin(input.pin))]);
  }
  await logActivity(null, input.branchId, "staff_status", actor, {
    note: `${name} · ${role}`,
  });
  return { ok: true, message: `${name} updated.` };
}

export async function setStaffPin(id: number, pin: string, actor: string): Promise<ActionResult> {
  const safePin = validatePin(pin);
  const { hashPin } = await import("./pin");
  const rows = await q<Row>("update staff set pin_hash = $2 where id = $1 returning name, branch_id", [
    id,
    hashPin(safePin),
  ]);
  if (!rows[0]) return { ok: false, message: "Team member not found." };
  await logActivity(null, rows[0].branch_id ?? null, "staff_pin", actor, {
    note: `PIN reset for ${rows[0].name}`,
  });
  return { ok: true, message: `PIN updated for ${rows[0].name}.` };
}

export async function setStaffActive(id: number, active: boolean, actor: string): Promise<ActionResult> {
  const target = await q<Row>("select id, name, role, active, brand_id, branch_id from staff where id = $1", [id]);
  if (!target[0]) return { ok: false, message: "Team member not found." };
  if (!active && target[0].role === "owner") {
    const owners = await q<Row>(
      "select count(*)::int as count from staff where role = 'owner' and active = true and brand_id is null and branch_id is null",
    );
    if (toNumber(owners[0]?.count) <= 1) {
      return { ok: false, message: "You need at least one platform owner." };
    }
  }
  await q("update staff set active = $2 where id = $1", [id, active]);
  await logActivity(null, target[0].branch_id ?? null, "staff_status", actor, {
    note: `${target[0].name} ${active ? "reactivated" : "deactivated"}`,
  });
  return { ok: true, message: `${target[0].name} ${active ? "is active" : "is paused"}.` };
}

/* ------------------------------- reads --------------------------------- */

async function ensureDemoDay(): Promise<void> {
  if (!isDemoMode() || !isDemoAutoReset()) return;
  const primary = await getPrimaryBranch();
  const today = dayInTz(new Date(), primary.branch.timezone);
  const rows = await q<Row>(
    "select count(*)::int as count from queue_entries where branch_id = $1 and day = $2::date",
    [primary.branch.id, today],
  );
  if (toNumber(rows[0]?.count) === 0) {
    await seedDatabase({ query: q });
  }
}

export async function listTables(branchId: number, db: Queryable | null = null): Promise<DiningTable[]> {
  const runner: Queryable = db ?? { query: q };
  const rows = await runner.query<Row>(
    "select * from dining_tables where branch_id = $1 order by zone, sort_order, label",
    [branchId],
  );
  return rows.map(mapTable);
}

/**
 * Heal the floor when a table and its seated entries disagree (for example,
 * after an interrupted action or imported demo data). Safe to run on read.
 */
async function reconcileFloor(branchId: number): Promise<void> {
  await q(
    `update dining_tables t
     set status = 'seated', status_changed_at = now()
     where t.branch_id = $1 and t.status <> 'seated'
       and exists (
         select 1 from queue_entries qe
         where qe.branch_id = $1 and qe.table_id = t.id and qe.status = 'seated'
       )`,
    [branchId],
  );
  await q(
    `update dining_tables t
     set status = 'dirty', status_changed_at = now()
     where t.branch_id = $1 and t.status = 'seated'
       and not exists (
         select 1 from queue_entries qe
         where qe.branch_id = $1 and qe.table_id = t.id and qe.status = 'seated'
       )`,
    [branchId],
  );
}

async function entriesForDay(
  branchId: number,
  day: string,
  db: Queryable | null = null,
): Promise<QueueEntry[]> {
  const runner: Queryable = db ?? { query: q };
  const rows = await runner.query<Row>(
    `select ${ENTRY_COLUMNS}
     from queue_entries qe
     left join dining_tables t on t.id = qe.table_id
     where qe.branch_id = $1 and qe.day = $2::date
     order by qe.joined_at asc`,
    [branchId, day],
  );
  const tables = await listTables(branchId, runner);
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
  return mapEntry(rows[0], tablesByIdMap(await listTables(toNumber(rows[0].branch_id))));
}

async function expireHolds(branchId: number): Promise<void> {
  const rows = await q<Row>(
    `update queue_entries
     set status = 'no_show', closed_at = now(), hold_expires_at = null
     where branch_id = $1 and status = 'called' and hold_expires_at is not null and hold_expires_at < now()
     returning id, code, guest_name, party_size`,
    [branchId],
  );
  for (const row of rows) {
    await logActivity(null, branchId, "no_show", "System", {
      entryId: toNumber(row.id),
      code: String(row.code),
      name: String(row.guest_name),
      partySize: toNumber(row.party_size),
      note: "Call expired",
    });
  }
}

export async function getHostState(branchId: number): Promise<HostState> {
  await ensureDemoDay();
  const branch = await getBranch(branchId);
  const brand = await getBrand(branch.brandId);
  await expireHolds(branchId);
  await reconcileFloor(branchId);
  const now = new Date();
  const today = dayInTz(now, branch.timezone);
  const tables = await listTables(branchId);
  const entries = await entriesForDay(branchId, today);
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
    branch,
    brand,
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

export async function getPublicSnapshot(branchId: number): Promise<PublicSnapshot> {
  await ensureDemoDay();
  const branch = await getBranch(branchId);
  const brand = await getBrand(branch.brandId);
  await expireHolds(branchId);
  const now = new Date();
  const today = dayInTz(now, branch.timezone);
  const tables = await listTables(branchId);
  const entries = await entriesForDay(branchId, today);
  const waiting = orderWaiting(entries.filter((entry) => entry.status === "waiting"));
  const waitingA =
    branch.queueMode === "single" ? waiting.length : waiting.filter((entry) => entry.category === "A").length;
  const waitingB =
    branch.queueMode === "single" ? 0 : waiting.filter((entry) => entry.category === "B").length;
  const lastCalledRows = await q<Row>(
    `select code from queue_entries
     where branch_id = $1 and day = $2::date and status = 'called' and called_at is not null
     order by called_at desc limit 1`,
    [branchId, today],
  );
  const avgTurn = averageTurn(entries, branch.avgTurnMinutes);
  const fittable = tables.filter((table) => table.capacity >= 2);

  return {
    branch,
    brand,
    waiting: waiting.length,
    waitingA,
    waitingB,
    availableTables: tables.filter((table) => table.status === "available").length,
    lastCalledCode: lastCalledRows[0]?.code ?? null,
    isOpenNow: isOpenAt(branch, now),
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
  const initial = await entryByToken(token);
  if (!initial) return null;
  const branch = await getBranch(initial.branchId);
  const brand = await getBrand(branch.brandId);
  await expireHolds(branch.id);
  const entry = (await entryByToken(token)) ?? initial;
  const now = new Date();
  const today = dayInTz(now, branch.timezone);
  const tables = await listTables(branch.id);
  const entries = await entriesForDay(branch.id, today);
  const waiting = orderWaiting(entries.filter((item) => item.status === "waiting"));
  const waitingEntry = waiting.find((item) => item.id === entry.id) ?? null;
  const position = waitingEntry ? positionOf(waitingEntry.id, waiting) : null;
  const fittable = tables.filter((table) => table.capacity >= entry.partySize);
  const availableFittable = fittable.filter((table) => table.status === "available").length;
  const avgTurn = averageTurn(entries, branch.avgTurnMinutes);
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
     where branch_id = $1 and day = $2::date and status = 'called' and called_at is not null
     order by called_at desc limit 1`,
    [branch.id, today],
  );

  return {
    branch,
    brand,
    entry,
    position,
    peopleAhead: position === null ? null : Math.max(0, position - 1),
    etaMinutes: eta,
    lastCalledCode: lastCalledRows[0]?.code ?? null,
    waitingCount: waiting.length,
    availableTables: tables.filter((table) => table.status === "available").length,
    serverNow: now.toISOString(),
    isOpenNow: isOpenAt(branch, now),
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
  /** Existing ticket token from the guest device, used to block duplicates. */
  guestToken?: string;
}

export interface JoinResult {
  token: string;
  code: string;
  position: number;
  etaMinutes: number;
}

export async function joinQueue(branchId: number, input: JoinInput, allowPaused = false): Promise<JoinResult> {
  const branch = await getBranch(branchId);
  const name = validateGuestName(input.guestName);
  const partySize = validatePartySize(input.partySize, branch.maxPartySize);
  const phone = normalizePhone(input.phone);
  const notes = validateNotes(input.notes);
  const source: QueueSource = input.source === "walkin" ? "walkin" : input.source === "online" ? "online" : "qr";
  const now = new Date();

  if (!allowPaused && branch.waitlistStatus !== "open") {
    throw new AppError(
      branch.waitlistStatus === "paused"
        ? "The queue is paused right now. Please ask the host."
        : "The queue is closed for today.",
      "queue_closed",
      409,
    );
  }
  if (!allowPaused && !isOpenAt(branch, now)) {
    throw new AppError(
      `The queue is open ${branch.openTime}–${branch.closeTime} (${branch.timezone}). Please come back during opening hours.`,
      "queue_closed",
      409,
    );
  }

  return tx(async (db) => {
    const today = dayInTz(now, branch.timezone);

    if (!allowPaused) {
      const existing = await db.query<Row>(
        `select token, code from queue_entries
         where status in ('waiting','called','seated')
           and (token = $1 or ($2::text is not null and phone = $2::text))
         order by joined_at asc
         limit 1`,
        [input.guestToken ?? null, phone],
      );
      if (existing[0]) {
        throw new AppError(
          `You already have an active ticket ${existing[0].code}. Please use or release it before joining another queue.`,
          "duplicate_ticket",
          409,
          { token: existing[0].token, code: existing[0].code },
        );
      }
    }

    const counts = await db.query<Row>(
      `select count(*) filter (where status = 'waiting')::int as waiting
       from queue_entries where branch_id = $1 and day = $2::date`,
      [branchId, today],
    );
    if (toNumber(counts[0]?.waiting) >= branch.maxQueueSize) {
      throw new AppError(
        "The queue is full right now. Please see the host — we may still be able to seat you.",
        "queue_full",
        409,
      );
    }

    const seqRows = await db.query<Row>(
      `insert into queue_sequence (branch_id, day, last_seq)
       values ($1, $2::date, 1)
       on conflict (branch_id, day)
       do update set last_seq = queue_sequence.last_seq + 1
       returning last_seq`,
      [branchId, today],
    );
    const seq = toNumber(seqRows[0]?.last_seq, 1);
    const token = randomBytes(18).toString("base64url");
    const category: QueueCategory = branch.queueMode === "single" ? "A" : partySize <= 2 ? "A" : "B";
    const code = codeFor(seq, category);

    const inserted = await db.query<Row>(
      `insert into queue_entries
        (branch_id, token, code, day, seq, category, guest_name, phone, party_size, notes, source, status)
       values ($1,$2,$3,$4::date,$5,$6,$7,$8,$9,$10,$11,'waiting')
       returning id`,
      [branchId, token, code, today, seq, category, name, phone, partySize, notes, source],
    );
    const entryId = toNumber(inserted[0]?.id);

    await logActivity(db, branchId, source === "walkin" ? "walkin" : "join", input.actor ?? "Guest", {
      entryId,
      code,
      name,
      partySize,
      note: notes,
    });

    const all = await entriesForDay(branchId, today, db);
    const waitingList = orderWaiting(all.filter((entry) => entry.status === "waiting"));
    const position = positionOf(entryId, waitingList) ?? waitingList.length;
    const tables = await listTables(branchId, db);
    const fittable = tables.filter((table) => table.capacity >= partySize);
    const etaMinutes = estimateWaitMinutes({
      position,
      avgTurnMinutes: branch.avgTurnMinutes,
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
       returning id, branch_id, code, guest_name, party_size`,
      [token],
    );
    if (!rows[0]) return { ok: false, message: "This ticket can no longer be cancelled." };
    await logActivity(db, toNumber(rows[0].branch_id), "cancel", "Guest", {
      entryId: toNumber(rows[0].id),
      code: String(rows[0].code),
      name: String(rows[0].guest_name),
      partySize: toNumber(rows[0].party_size),
      note: "Cancelled from ticket",
    });
    return { ok: true, message: "Your place has been released." };
  });
}

export async function acknowledgeTicket(token: string): Promise<ActionResult> {
  const target = await q<Row>(
    "select branch_id from queue_entries where token = $1 and status = 'called' and acknowledged = false",
    [token],
  );
  if (!target[0]) {
    const existing = await q<Row>("select status, acknowledged from queue_entries where token = $1", [token]);
    if (existing[0]?.status === "called" && existing[0]?.acknowledged) {
      return { ok: true, message: "We already have your confirmation. The host is expecting you." };
    }
    return { ok: false, message: "This ticket is not waiting for a table right now." };
  }

  const branchId = toNumber(target[0].branch_id);
  const config = await q<Row>(
    "select acknowledge_action, acknowledge_minutes, acknowledge_enabled from branches where id = $1",
    [branchId],
  );
  if (!config[0]?.acknowledge_enabled) {
    return { ok: false, message: "The “Saya hadir” button is not enabled for this branch." };
  }
  const extend = config[0]?.acknowledge_action === "extend";
  const minutes = clampInt(config[0]?.acknowledge_minutes ?? 3, 1, 30, 3);

  const rows = await q<Row>(
    extend
      ? `update queue_entries
         set acknowledged = true,
             hold_expires_at = now() + ($2 || ' minutes')::interval
         where token = $1 and status = 'called' and acknowledged = false
         returning id, branch_id, code, guest_name, party_size`
      : `update queue_entries
         set acknowledged = true,
             hold_expires_at = null
         where token = $1 and status = 'called' and acknowledged = false
         returning id, branch_id, code, guest_name, party_size`,
    extend ? [token, minutes] : [token],
  );
  if (!rows[0]) {
    return { ok: true, message: "We already have your confirmation. The host is expecting you." };
  }
  await logActivity(null, toNumber(rows[0].branch_id), "acknowledge", "Guest", {
    entryId: toNumber(rows[0].id),
    code: String(rows[0].code),
    name: String(rows[0].guest_name),
    partySize: toNumber(rows[0].party_size),
    note: extend ? `Guest confirmed - countdown extended ${minutes} min` : "Guest confirmed - countdown paused",
  });
  return {
    ok: true,
    message: extend
      ? `Countdown extended ${minutes} minutes. The host is expecting you.`
      : "Countdown paused. The host is expecting you.",
  };
}

async function updateEntryStatus(
  branchId: number,
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
    const assignments = columns.map((column, index) => `${column} = $${index + 3}`).join(", ");
    const params = [entryId, branchId, ...columns.map((column) => patch[column])];
    const rows = await db.query<Row>(
      `update queue_entries set ${assignments}
       where id = $1 and branch_id = $2 and status = any($${params.length + 1}::text[])
       returning id, code, guest_name, party_size, table_id`,
      [...params, from],
    );
    if (!rows[0]) {
      return { ok: false, message: "That guest was already handled. Refreshing the board…" };
    }
    await logActivity(db, branchId, type, actor, {
      entryId: toNumber(rows[0].id),
      code: String(rows[0].code),
      name: String(rows[0].guest_name),
      partySize: toNumber(rows[0].party_size),
      note,
    });
    return { ok: true, message: successMessage };
  });
}

export async function callEntry(
  branchId: number,
  entryId: number,
  actor: string,
): Promise<ActionResult> {
  const branch = await getBranch(branchId);
  return tx(async (db) => {
    const rows = await db.query<Row>(
      `update queue_entries
       set status = 'called', called_at = now(),
           hold_expires_at = now() + ($3 || ' minutes')::interval,
           called_count = called_count + 1, acknowledged = false
       where id = $1 and branch_id = $2 and status = 'waiting'
       returning id, code, guest_name, party_size`,
      [entryId, branchId, branch.holdMinutes],
    );
    if (!rows[0]) return { ok: false, message: "That guest was already handled." };
    await logActivity(db, branchId, "call", actor, {
      entryId,
      code: String(rows[0].code),
      name: String(rows[0].guest_name),
      partySize: toNumber(rows[0].party_size),
      note: "Table ready",
    });
    return { ok: true, message: `${rows[0].code} called.` };
  });
}

export async function callNext(
  branchId: number,
  actor: string,
  force = false,
): Promise<ActionResult<{ code: string }>> {
  const branch = await getBranch(branchId);
  return tx(async (db) => {
    const today = dayInTz(new Date(), branch.timezone);
    const entries = await entriesForDay(branchId, today, db);
    const waiting = orderWaiting(entries.filter((entry) => entry.status === "waiting"));
    const tables = await listTables(branchId, db);
    const pick = pickNext(waiting, tables, force || branch.seatingMode !== "plan");
    if (!pick.ok) return { ok: false, message: pick.message };

    const hold = new Date(Date.now() + branch.holdMinutes * 60_000).toISOString();
    const updated = await db.query<Row>(
      `update queue_entries
       set status = 'called', called_at = now(), hold_expires_at = $3,
           called_count = called_count + 1, acknowledged = false
       where id = $1 and branch_id = $2 and status = 'waiting'
       returning id, code, guest_name, party_size`,
      [pick.entry.id, branchId, hold],
    );
    if (!updated[0]) {
      return { ok: false, message: "Another host just called that guest. Refreshing…" };
    }
    await logActivity(db, branchId, "call", actor, {
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

export async function seatEntry(
  branchId: number,
  entryId: number,
  tableId: number | null,
  actor: string,
  staffId: number | null,
  seatNumber: number | null = null,
): Promise<ActionResult> {
  return tx(async (db) => {
    const entryRows = await db.query<Row>(
      "select id, code, guest_name, party_size, status from queue_entries where id = $1 and branch_id = $2 for update",
      [entryId, branchId],
    );
    const entry = entryRows[0];
    if (!entry) return { ok: false, message: "That guest no longer exists." };
    if (!["waiting", "called"].includes(String(entry.status))) {
      return { ok: false, message: "That guest is not waiting for a table." };
    }

    if (tableId === null) {
      const branchRows = await db.query<Row>("select seating_mode from branches where id = $1", [branchId]);
      if (branchRows[0]?.seating_mode === "plan") {
        return { ok: false, message: "Choose a table from the seating plan." };
      }
      await db.query(
        `update queue_entries
         set status='seated', seated_at=now(), table_id=null, seat_number=null, opened_by=$3,
             opened_by_staff_id=$4, hold_expires_at=null
         where id=$1 and branch_id=$2`,
        [entryId, branchId, actor, staffId],
      );
      await logActivity(db, branchId, "seat", actor, {
        entryId,
        code: String(entry.code),
        name: String(entry.guest_name),
        partySize: toNumber(entry.party_size),
        note: "Seated manually (no table assigned)",
      });
      return { ok: true, message: `${entry.code} seated.` };
    }

    const tableRows = await db.query<Row>(
      "select id, label, capacity, status from dining_tables where id = $1 and branch_id = $2 for update",
      [tableId, branchId],
    );
    const table = tableRows[0];
    if (!table) return { ok: false, message: "That table no longer exists." };
    if (table.status !== "available") return { ok: false, message: `${table.label} is not free right now.` };
    if (toNumber(entry.party_size) > toNumber(table.capacity)) {
      return { ok: false, message: `${table.label} seats ${table.capacity}; this party is ${entry.party_size}.` };
    }
    const seat = seatNumber === null ? null : clampInt(seatNumber, 1, toNumber(table.capacity), 1);
    if (seat !== null && seat > toNumber(table.capacity)) {
      return { ok: false, message: `Seat ${seat} does not exist at ${table.label}.` };
    }

    await db.query(
      `update queue_entries
       set status='seated', seated_at=now(), table_id=$3, seat_number=$4, opened_by=$5,
           opened_by_staff_id=$6, hold_expires_at=null
       where id=$1 and branch_id=$2`,
      [entryId, branchId, tableId, seat, actor, staffId],
    );
    await db.query(
      "update dining_tables set status='seated', status_changed_at=now() where id=$1 and branch_id=$2",
      [tableId, branchId],
    );
    await logActivity(db, branchId, "seat", actor, {
      entryId,
      tableId,
      code: String(entry.code),
      name: String(entry.guest_name),
      partySize: toNumber(entry.party_size),
      tableLabel: String(table.label),
      seatNumber: seat,
      note: seat ? `Seated at ${table.label} · seat ${seat}` : `Seated at ${table.label}`,
    });
    return {
      ok: true,
      message: `${entry.code} seated at ${table.label}${seat ? ` · seat ${seat}` : ""}.`,
    };
  });
}

export async function markNoShow(branchId: number, entryId: number, actor: string): Promise<ActionResult> {
  return updateEntryStatus(
    branchId,
    entryId,
    ["called", "waiting"],
    { status: "no_show", closed_at: new Date().toISOString(), hold_expires_at: null },
    actor,
    "no_show",
    "Marked as no-show",
    "Guest marked as a no-show.",
  );
}

export async function undoCall(branchId: number, entryId: number, actor: string): Promise<ActionResult> {
  return updateEntryStatus(
    branchId,
    entryId,
    ["called"],
    { status: "waiting", called_at: null, hold_expires_at: null, acknowledged: false },
    actor,
    "undo_call",
    "Returned to queue",
    "Guest returned to the queue.",
  );
}

export async function extendHold(
  branchId: number,
  entryId: number,
  minutes: number,
  actor: string,
): Promise<ActionResult> {
  const extra = clampInt(minutes, 1, 15, 5);
  const rows = await q<Row>(
    `update queue_entries
     set hold_expires_at = greatest(coalesce(hold_expires_at, now()), now()) + ($3 || ' minutes')::interval,
         acknowledged = true
     where id = $1 and branch_id = $2 and status = 'called'
     returning id, code`,
    [entryId, branchId, extra],
  );
  if (!rows[0]) return { ok: false, message: "That guest is not on hold." };
  await logActivity(null, branchId, "extend", actor, {
    entryId,
    code: String(rows[0].code),
    note: `Call extended ${extra} min`,
  });
  return { ok: true, message: `Call extended by ${extra} minutes.` };
}

export async function clearTable(
  branchId: number,
  tableId: number,
  actor: string,
  staffId: number | null = null,
  reason: string | null = null,
): Promise<ActionResult> {
  return tx(async (db) => {
    const tableRows = await db.query<Row>(
      "select id, label, status from dining_tables where id = $1 and branch_id = $2 for update",
      [tableId, branchId],
    );
    const table = tableRows[0];
    if (!table) return { ok: false, message: "That table no longer exists." };
    if (table.status !== "seated") return { ok: false, message: `${table.label} is not marked as seated.` };

    const entryRows = await db.query<Row>(
      `select id, code, guest_name, party_size, seat_number from queue_entries
       where table_id = $1 and branch_id = $2 and status = 'seated' order by seated_at desc limit 1`,
      [tableId, branchId],
    );
    await db.query(
      "update dining_tables set status='dirty', status_changed_at=now() where id=$1 and branch_id=$2",
      [tableId, branchId],
    );
    if (entryRows[0]) {
      await db.query(
        `update queue_entries
         set status='completed', closed_at=now(), released_by=$3, released_by_staff_id=$4
         where id=$1 and branch_id=$2`,
        [toNumber(entryRows[0].id), branchId, actor, staffId],
      );
      await logActivity(db, branchId, "release", actor, {
        entryId: toNumber(entryRows[0].id),
        tableId,
        code: String(entryRows[0].code),
        name: String(entryRows[0].guest_name),
        partySize: toNumber(entryRows[0].party_size),
        tableLabel: String(table.label),
        seatNumber: entryRows[0].seat_number ? toNumber(entryRows[0].seat_number) : null,
        note: reason ? `Seat released · ${reason}` : "Seat released",
      });
    }
    await logActivity(db, branchId, "clear", actor, {
      tableId,
      tableLabel: String(table.label),
      note: "Table needs resetting",
    });
    return { ok: true, message: `${table.label} released. Mark it ready once reset.` };
  });
}

export async function releaseEntry(
  branchId: number,
  entryId: number,
  actor: string,
  staffId: number | null = null,
  reason: string | null = null,
): Promise<ActionResult> {
  return tx(async (db) => {
    const rows = await db.query<Row>(
      `select id, code, guest_name, party_size, table_id, seat_number
       from queue_entries where id = $1 and branch_id = $2 and status = 'seated' for update`,
      [entryId, branchId],
    );
    const entry = rows[0];
    if (!entry) return { ok: false, message: "That guest is not currently seated." };
    await db.query(
      `update queue_entries
       set status='completed', closed_at=now(), released_by=$3, released_by_staff_id=$4
       where id=$1 and branch_id=$2`,
      [entryId, branchId, actor, staffId],
    );
    if (entry.table_id) {
      await db.query(
        "update dining_tables set status='dirty', status_changed_at=now() where id=$1 and branch_id=$2",
        [toNumber(entry.table_id), branchId],
      );
    }
    await logActivity(db, branchId, "release", actor, {
      entryId,
      tableId: entry.table_id ? toNumber(entry.table_id) : null,
      code: String(entry.code),
      name: String(entry.guest_name),
      partySize: toNumber(entry.party_size),
      seatNumber: entry.seat_number ? toNumber(entry.seat_number) : null,
      note: reason ? `Seat released · ${reason}` : "Seat released",
    });
    return { ok: true, message: `${entry.code} released.` };
  });
}

export async function setTableStatus(
  branchId: number,
  tableId: number,
  status: TableStatus,
  actor: string,
): Promise<ActionResult> {
  if (!["available", "dirty", "blocked"].includes(status)) {
    return { ok: false, message: "That table status can't be set manually." };
  }
  const rows = await q<Row>(
    `update dining_tables set status=$3, status_changed_at=now()
     where id=$1 and branch_id=$2 and status <> 'seated'
     returning id, label, status`,
    [tableId, branchId, status],
  );
  if (!rows[0]) return { ok: false, message: "Clear the seated party first." };
  await logActivity(null, branchId, status === "available" ? "ready" : "table_status", actor, {
    tableId,
    tableLabel: String(rows[0].label),
    note: status === "blocked" ? "Blocked" : status === "dirty" ? "Marked dirty" : "Ready for guests",
  });
  return { ok: true, message: `${rows[0].label} is ${status}.` };
}

export async function clearQueueData(branchId: number, actor: string): Promise<ActionResult> {
  return tx(async (db) => {
    await db.query("delete from activity where branch_id = $1", [branchId]);
    await db.query("delete from queue_entries where branch_id = $1", [branchId]);
    await db.query("delete from queue_sequence where branch_id = $1", [branchId]);
    await db.query(
      "update dining_tables set status = 'available', status_changed_at = now() where branch_id = $1",
      [branchId],
    );
    await logActivity(db, branchId, "queue_cleared", actor, {
      note: "Queue and table state cleared",
    });
    return { ok: true, message: "Queue data cleared. Tables are ready for a fresh service." };
  });
}

export async function setWaitlistStatus(
  branchId: number,
  status: WaitlistStatus,
  reason: string | null,
  actor: string,
): Promise<ActionResult> {  if (!["open", "paused", "closed"].includes(status)) {
    return { ok: false, message: "Unknown queue state." };
  }
  const rows = await q<Row>(
    `update branches set waitlist_status=$2, pause_reason=$3, updated_at=now()
     where id=$1 returning waitlist_status`,
    [branchId, status, reason ? cleanText(reason, 120) : null],
  );
  if (!rows[0]) return { ok: false, message: "Could not update the queue." };
  await logActivity(null, branchId, "waitlist", actor, {
    note:
      status === "open"
        ? "Queue opened"
        : status === "paused"
          ? `Queue paused${reason ? `: ${reason}` : ""}`
          : "Queue closed",
  });
  return {
    ok: true,
    message:
      status === "open"
        ? "Queue is open — guests can join."
        : status === "paused"
          ? "Queue paused. Existing guests keep their place."
          : "Queue closed for new guests.",
  };
}

/* ------------------------------- tables --------------------------------- */

export async function createTable(
  branchId: number,
  input: { label: string; capacity: number; zone: string },
  actor: string,
): Promise<ActionResult> {
  const label = validateTableLabel(input.label);
  const capacity = clampInt(input.capacity, 1, 40, 2);
  const zone = validateZone(input.zone);
  try {
    const rows = await q<Row>(
      `insert into dining_tables (branch_id, label, capacity, zone, sort_order)
       values ($1,$2,$3,$4,(select coalesce(max(sort_order),0)+1 from dining_tables where branch_id=$1))
       returning id, label`,
      [branchId, label, capacity, zone],
    );
    await logActivity(null, branchId, "table_added", actor, {
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
  branchId: number,
  id: number,
  input: { label: string; capacity: number; zone: string },
  actor: string,
): Promise<ActionResult> {
  const label = validateTableLabel(input.label);
  const capacity = clampInt(input.capacity, 1, 40, 2);
  const zone = validateZone(input.zone);
  const current = await q<Row>(
    "select id, label, status from dining_tables where id=$1 and branch_id=$2",
    [id, branchId],
  );
  if (!current[0]) return { ok: false, message: "Table not found." };
  if (current[0].status === "seated") {
    const party = await q<Row>(
      "select party_size from queue_entries where table_id=$1 and branch_id=$2 and status='seated' order by seated_at desc limit 1",
      [id, branchId],
    );
    if (party[0] && toNumber(party[0].party_size) > capacity) {
      return { ok: false, message: `A party of ${party[0].party_size} is seated here — clear it first.` };
    }
  }
  try {
    await q<Row>(
      "update dining_tables set label=$3, capacity=$4, zone=$5 where id=$1 and branch_id=$2 returning id",
      [id, branchId, label, capacity, zone],
    );
    await logActivity(null, branchId, "table_updated", actor, {
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

export async function deleteTable(branchId: number, id: number, actor: string): Promise<ActionResult> {
  const rows = await q<Row>(
    "select id, label, status from dining_tables where id=$1 and branch_id=$2",
    [id, branchId],
  );
  const table = rows[0];
  if (!table) return { ok: false, message: "Table not found." };
  if (table.status === "seated") return { ok: false, message: `Clear ${table.label} before deleting it.` };
  await q("delete from dining_tables where id=$1 and branch_id=$2", [id, branchId]);
  await logActivity(null, branchId, "table_deleted", actor, {
    tableLabel: String(table.label),
    note: "Table removed",
  });
  return { ok: true, message: `${table.label} removed.` };
}

/* ------------------------------ reporting -------------------------------- */

/**
 * Combine the daily report for several branches. Used by the platform owner's
 * all-branch report; branch owners stay scoped to their own branches.
 */
export async function getOwnerWeekForBranches(branchIds: number[], days = 7): Promise<DayPoint[]> {
  const wanted = Array.from(new Set(branchIds.filter((id) => Number.isInteger(id) && id > 0)));
  if (wanted.length === 0) return [];

  const overviews = await Promise.all(wanted.map((id) => getOwnerOverview(id, days)));
  const byDay = new Map<string, DayPoint>();
  const waitWeight = new Map<string, { total: number; count: number }>();
  const turnWeight = new Map<string, { total: number; count: number }>();

  for (const overview of overviews) {
    for (const point of overview.week) {
      const current =
        byDay.get(point.day) ??
        ({ day: point.day, joined: 0, seated: 0, noShow: 0, cancelled: 0, avgWaitMinutes: 0, avgTurnMinutes: 0 } as DayPoint);
      current.joined += point.joined;
      current.seated += point.seated;
      current.noShow += point.noShow;
      current.cancelled += point.cancelled;
      byDay.set(point.day, current);

      const wait = waitWeight.get(point.day) ?? { total: 0, count: 0 };
      wait.total += point.avgWaitMinutes * point.seated;
      wait.count += point.seated;
      waitWeight.set(point.day, wait);

      const turn = turnWeight.get(point.day) ?? { total: 0, count: 0 };
      turn.total += point.avgTurnMinutes * point.seated;
      turn.count += point.seated;
      turnWeight.set(point.day, turn);
    }
  }

  return [...byDay.values()]
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((point) => {
      const wait = waitWeight.get(point.day);
      const turn = turnWeight.get(point.day);
      return {
        ...point,
        avgWaitMinutes: wait && wait.count ? Math.round(wait.total / wait.count) : 0,
        avgTurnMinutes: turn && turn.count ? Math.round(turn.total / turn.count) : 0,
      };
    });
}

export async function getOwnerOverview(branchId: number, days = 7): Promise<OwnerOverview> {  await ensureDemoDay();
  const branch = await getBranch(branchId);
  const brand = await getBrand(branch.brandId);
  await expireHolds(branchId);
  await reconcileFloor(branchId);
  const now = new Date();
  const today = dayInTz(now, branch.timezone);
  const windowDays = Math.min(90, Math.max(1, Math.round(days)));
  const startDay = addDaysToDay(today, -(windowDays - 1));
  const tables = await listTables(branchId);
  const rows = await q<Row>(
    `select ${ENTRY_COLUMNS}
     from queue_entries qe
     left join dining_tables t on t.id = qe.table_id
     where qe.branch_id = $1 and qe.day >= $2::date
     order by qe.joined_at asc`,
    [branchId, startDay],
  );
  const map = tablesByIdMap(tables);
  const all = rows.map((row) => mapEntry(row, map, now));
  const todayEntries = all.filter((entry) => entry.day === today);
  const stats = statsFrom(todayEntries, tables, now);
  const seatedToday = todayEntries.filter((entry) => entry.seatedAt && entry.status !== "cancelled");
  const completed = todayEntries.filter((entry) => entry.status === "completed");
  const avgWaitMinutes = average(seatedToday.map((entry) => minutesBetween(entry.joinedAt, entry.seatedAt as string)));
  const avgTurnMinutes = averageTurn(todayEntries, branch.avgTurnMinutes);
  const utilization = Math.min(100, Math.round((stats.seated / Math.max(1, tables.length)) * 100));

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
      avgTurnMinutes: averageTurn(dayEntries, branch.avgTurnMinutes),
    });
  }

  const activityRows = await q<Row>(
    "select id, type, actor, detail, created_at from activity where branch_id=$1 order by created_at desc limit 14",
    [branchId],
  );
  const activity: ActivityItem[] = activityRows.map((row) => {
    const detail = typeof row.detail === "string" ? safeJson(row.detail) : row.detail ?? {};
    return {
      id: toNumber(row.id),
      type: String(row.type),
      actor: row.actor ?? null,
      createdAt: toIso(row.created_at) ?? now.toISOString(),
      code: detail.code ?? null,
      name: detail.name ?? null,
      partySize: detail.partySize ?? null,
      tableLabel: detail.tableLabel ?? null,
      seatNumber: detail.seatNumber ?? null,
    };
  });

  return {
    branch,
    brand,
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
    hourly: buildHourly(todayEntries, branch.timezone, branch.openTime, branch.closeTime),
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

export async function getCustomerList(branchId: number, days = 1): Promise<QueueEntry[]> {
  const branch = await getBranch(branchId);
  const windowDays = Math.min(90, Math.max(1, Math.round(days)));
  const today = dayInTz(new Date(), branch.timezone);
  const startDay = addDaysToDay(today, -(windowDays - 1));
  const tables = await listTables(branchId);
  const map = tablesByIdMap(tables);
  const rows = await q<Row>(
    `select ${ENTRY_COLUMNS}
     from queue_entries qe
     left join dining_tables t on t.id = qe.table_id
     where qe.branch_id = $1 and qe.day >= $2::date
     order by qe.joined_at desc`,
    [branchId, startDay],
  );
  return rows.map((row) => mapEntry(row, map));
}

export async function getReportCsv(branchId: number, days = 30): Promise<string> {
  const windowDays = Math.min(90, Math.max(1, Math.round(days)));
  const branch = await getBranch(branchId);
  const today = dayInTz(new Date(), branch.timezone);
  const startDay = addDaysToDay(today, -(windowDays - 1));
  const rows = await q<Row>(
    `select qe.code, to_char(qe.day, 'YYYY-MM-DD') as day_text, qe.guest_name, qe.phone,
            qe.party_size, qe.source, qe.status, qe.seat_number, qe.opened_by,
            qe.released_by, qe.joined_at, qe.called_at, qe.seated_at, qe.closed_at, qe.notes, t.label as table_label
     from queue_entries qe
     left join dining_tables t on t.id = qe.table_id
     where qe.branch_id = $1 and qe.day >= $2::date
     order by qe.joined_at asc`,
    [branchId, startDay],
  );

  const header = [
    "code", "day", "guest", "phone", "party_size", "source", "status",
    "joined_at", "called_at", "seated_at", "closed_at", "table", "seat", "opened_by", "released_by",
    "wait_min", "turn_min", "notes",
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
        row.seat_number ?? "",
        row.opened_by ?? "",
        row.released_by ?? "",
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

export async function getReportCsvForBranches(branchIds: number[], days = 30): Promise<string> {
  const wanted = Array.from(new Set(branchIds.filter((id) => Number.isInteger(id) && id > 0)));
  if (wanted.length === 0) return "\uFEFF";
  const first = await getBranch(wanted[0]);
  const windowDays = Math.min(90, Math.max(1, Math.round(days)));
  const today = dayInTz(new Date(), first.timezone);
  const startDay = addDaysToDay(today, -(windowDays - 1));
  const rows = await q<Row>(
    `select qe.code, to_char(qe.day, 'YYYY-MM-DD') as day_text, br.name as branch_name, qe.guest_name, qe.phone,
            qe.party_size, qe.source, qe.status, qe.seat_number, qe.opened_by,
            qe.released_by, qe.joined_at, qe.called_at, qe.seated_at, qe.closed_at, qe.notes, t.label as table_label
     from queue_entries qe
     join branches br on br.id = qe.branch_id
     left join dining_tables t on t.id = qe.table_id
     where qe.branch_id = any($1::int[]) and qe.day >= $2::date
     order by qe.joined_at asc`,
    [wanted, startDay],
  );

  const header = [
    "branch", "code", "day", "guest", "phone", "party_size", "source", "status",
    "joined_at", "called_at", "seated_at", "closed_at", "table", "seat", "opened_by", "released_by",
    "wait_min", "turn_min", "notes",
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
        row.branch_name,
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
        row.seat_number ?? "",
        row.opened_by ?? "",
        row.released_by ?? "",
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
