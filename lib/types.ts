export type Role = "owner" | "greeter" | "cashier";
export type WaitlistStatus = "open" | "paused" | "closed";
export type SeatingMode = "queue" | "manual" | "plan";
export type QueueCategory = "A" | "B";
export type EntryStatus =
  | "waiting"
  | "called"
  | "seated"
  | "completed"
  | "no_show"
  | "cancelled";
export type TableStatus = "available" | "seated" | "dirty" | "blocked";
export type QueueSource = "qr" | "online" | "walkin";

export interface Brand {
  id: number;
  name: string;
  slug: string;
  instagram: string | null;
  description: string | null;
  accent: string;
  hasLogo: boolean;
  hasMenu: boolean;
  menuFilename: string | null;
  createdAt: string;
}

export interface Branch {
  id: number;
  brandId: number;
  brandName?: string;
  brandSlug?: string;
  name: string;
  slug: string;
  tagline: string | null;
  address: string | null;
  phone: string | null;
  instagram: string | null;
  timezone: string;
  openTime: string;
  closeTime: string;
  accent: string;
  announcement: string | null;
  waitlistStatus: WaitlistStatus;
  pauseReason: string | null;
  seatingMode: SeatingMode;
  avgTurnMinutes: number;
  holdMinutes: number;
  maxPartySize: number;
  maxQueueSize: number;
  autoNoShow: boolean;
  updatedAt: string;
}

/** @deprecated use Branch — kept for existing component props. */
export type Restaurant = Branch;

export interface DiningTable {
  id: number;
  branchId: number;
  label: string;
  capacity: number;
  zone: string;
  status: TableStatus;
  statusChangedAt: string;
  sortOrder: number;
}

export interface QueueEntry {
  id: number;
  branchId: number;
  code: string;
  day: string;
  seq: number;
  category: QueueCategory;
  guestName: string;
  phone: string | null;
  partySize: number;
  notes: string | null;
  source: QueueSource;
  status: EntryStatus;
  tableId: number | null;
  tableLabel: string | null;
  seatNumber: number | null;
  openedBy: string | null;
  openedByStaffId: number | null;
  releasedBy: string | null;
  releasedByStaffId: number | null;
  calledCount: number;
  acknowledged: boolean;
  joinedAt: string;
  calledAt: string | null;
  holdExpiresAt: string | null;
  seatedAt: string | null;
  closedAt: string | null;
  cancelledBy: string | null;
  waitMinutes: number;
  calledMinutesAgo: number | null;
  holdSecondsLeft: number;
  countdownPaused: boolean;
}

export interface PublicStaff {
  id: number;
  name: string;
  role: Role;
  initials: string | null;
  brandId: number | null;
  branchId: number | null;
  brandName?: string | null;
  branchName?: string | null;
}

export interface HostStats {
  waiting: number;
  called: number;
  seated: number;
  availableTables: number;
  dirtyTables: number;
  blockedTables: number;
  totalTables: number;
  joinedToday: number;
  seatedToday: number;
  noShowToday: number;
  avgWaitMinutes: number;
  longestWaitMinutes: number;
}

export interface HostState {
  branch: Branch;
  brand: Brand | null;
  tables: DiningTable[];
  waiting: QueueEntry[];
  called: QueueEntry[];
  seated: QueueEntry[];
  recent: QueueEntry[];
  stats: HostStats;
  serverNow: string;
  canSeat: boolean;
}

export interface PublicSnapshot {
  branch: Branch;
  brand: Brand | null;
  waiting: number;
  waitingA: number;
  waitingB: number;
  availableTables: number;
  lastCalledCode: string | null;
  isOpenNow: boolean;
  typicalWaitMinutes: number | null;
  serverNow: string;
}

export interface TicketView {
  branch: Branch;
  brand: Brand | null;
  entry: QueueEntry;
  position: number | null;
  peopleAhead: number | null;
  etaMinutes: number | null;
  lastCalledCode: string | null;
  waitingCount: number;
  availableTables: number;
  serverNow: string;
  isOpenNow: boolean;
}

export interface ActivityItem {
  id: number;
  type: string;
  actor: string | null;
  createdAt: string;
  code: string | null;
  name: string | null;
  partySize: number | null;
  tableLabel: string | null;
  seatNumber: number | null;
}

export interface DayPoint {
  day: string;
  joined: number;
  seated: number;
  noShow: number;
  cancelled: number;
  avgWaitMinutes: number;
  avgTurnMinutes: number;
}

export interface HourPoint {
  hour: number;
  joined: number;
  seated: number;
}

export interface OwnerOverview {
  branch: Branch;
  brand: Brand | null;
  stats: HostStats;
  today: {
    avgWaitMinutes: number;
    avgTurnMinutes: number;
    noShowRate: number;
    completed: number;
    cancelled: number;
    utilization: number;
    walkIns: number;
    remote: number;
  };
  hourly: HourPoint[];
  week: DayPoint[];
  activity: ActivityItem[];
  tables: DiningTable[];
  waiting: QueueEntry[];
  called: QueueEntry[];
  serverNow: string;
}

export interface ActionResult<T = unknown> {
  ok: boolean;
  message?: string;
  data?: T;
}

export interface BranchSummary {
  id: number;
  name: string;
  slug: string;
  brandId: number;
  brandName: string;
  brandSlug: string;
  tagline: string | null;
  address: string | null;
  phone: string | null;
  timezone: string;
  openTime: string;
  closeTime: string;
  accent: string;
  announcement: string | null;
  waitlistStatus: WaitlistStatus;
  seatingMode: SeatingMode;
}
