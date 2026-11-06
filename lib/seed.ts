import { hashPin } from "./pin";
import type { Queryable } from "./db";
import { dayInTz } from "./time";

export const DEMO_BRANDS = [
  {
    name: "Nikumaru",
    slug: "nikumaru",
    instagram: "@nikumaru.id",
    description: "Ramen, izakaya plates, and late evenings in Senopati.",
    accent: "#F24B3F",
  },
  {
    name: "Tenka",
    slug: "tenka",
    instagram: "@tenka.id",
    description: "A quiet izakaya counter for skewers, sake, and conversation.",
    accent: "#E3A02D",
  },
];

export const DEMO_BRANCHES = [
  {
    brandSlug: "nikumaru",
    name: "Nikumaru Senopati",
    slug: "senopati",
    tagline: "Ramen & Izakaya · Senopati",
    address: "Jl. Senopati No. 21, Kebayoran Baru, Jakarta",
    phone: "+62 811 9000 212",
    timezone: "Asia/Jakarta",
    openTime: "11:00",
    closeTime: "23:30",
    accent: "#F24B3F",
    announcement:
      "Selamat datang di Nikumaru Senopati. Ambil nomor antrean dari ponselmu — kami panggil saat meja siap.",
  },
  {
    brandSlug: "nikumaru",
    name: "Nikumaru Kemang",
    slug: "kemang",
    tagline: "Ramen & Izakaya · Kemang",
    address: "Jl. Kemang Raya No. 8, Bangka, Jakarta Selatan",
    phone: "+62 811 9000 313",
    timezone: "Asia/Jakarta",
    openTime: "11:00",
    closeTime: "23:00",
    accent: "#F24B3F",
    announcement:
      "Nikumaru Kemang menerima walk-in dan reservasi hari ini. Ambil antrean dan tunggu panggilan host.",
  },
  {
    brandSlug: "tenka",
    name: "Tenka Senopati",
    slug: "senopati",
    tagline: "Izakaya & Sake Bar · Senopati",
    address: "Jl. Senopati No. 45, Kebayoran Baru, Jakarta",
    phone: "+62 811 9000 414",
    timezone: "Asia/Jakarta",
    openTime: "17:00",
    closeTime: "01:00",
    accent: "#E3A02D",
    announcement:
      "Tenka buka dari sore. Ambil antrean, nikmati minuman di lounge, dan kami panggil saat kursi bar siap.",
  },
];

const TABLES_BY_BRANCH: Record<string, { label: string; capacity: number; zone: string }[]> = {
  "nikumaru/senopati": [
    { label: "T1", capacity: 2, zone: "Main dining" },
    { label: "T2", capacity: 2, zone: "Main dining" },
    { label: "T3", capacity: 4, zone: "Main dining" },
    { label: "T4", capacity: 4, zone: "Main dining" },
    { label: "T5", capacity: 4, zone: "Main dining" },
    { label: "T6", capacity: 6, zone: "Main dining" },
    { label: "T7", capacity: 6, zone: "Main dining" },
    { label: "T8", capacity: 8, zone: "Main dining" },
    { label: "P1", capacity: 2, zone: "Terrace" },
    { label: "P2", capacity: 4, zone: "Terrace" },
    { label: "P3", capacity: 4, zone: "Terrace" },
    { label: "P4", capacity: 6, zone: "Terrace" },
    { label: "C1", capacity: 1, zone: "Counter" },
    { label: "C2", capacity: 1, zone: "Counter" },
  ],
  "nikumaru/kemang": [
    { label: "T1", capacity: 2, zone: "Main dining" },
    { label: "T2", capacity: 2, zone: "Main dining" },
    { label: "T3", capacity: 4, zone: "Main dining" },
    { label: "T4", capacity: 4, zone: "Main dining" },
    { label: "T5", capacity: 6, zone: "Main dining" },
    { label: "T6", capacity: 6, zone: "Main dining" },
    { label: "T7", capacity: 8, zone: "Main dining" },
    { label: "P1", capacity: 4, zone: "Teras" },
    { label: "P2", capacity: 6, zone: "Teras" },
    { label: "B1", capacity: 2, zone: "Bar" },
  ],
  "tenka/senopati": [
    { label: "T1", capacity: 2, zone: "Ruang utama" },
    { label: "T2", capacity: 2, zone: "Ruang utama" },
    { label: "T3", capacity: 4, zone: "Ruang utama" },
    { label: "T4", capacity: 4, zone: "Ruang utama" },
    { label: "T5", capacity: 6, zone: "Ruang utama" },
    { label: "T6", capacity: 8, zone: "Ruang utama" },
    { label: "B1", capacity: 1, zone: "Bar" },
    { label: "B2", capacity: 1, zone: "Bar" },
  ],
};

const STAFF_SEED = [
  { name: "Rani Wijaya", role: "owner", pin: "2468", initials: "RW", brand: null, branch: null },
  { name: "Ayu Lestari", role: "greeter", pin: "1357", initials: "AL", brand: "nikumaru", branch: "nikumaru/senopati" },
  { name: "Bima Pratama", role: "greeter", pin: "1122", initials: "BP", brand: "nikumaru", branch: "nikumaru/senopati" },
  { name: "Sari Kasir", role: "cashier", pin: "4321", initials: "SK", brand: "nikumaru", branch: "nikumaru/senopati" },
  { name: "Dewi Larasati", role: "greeter", pin: "2244", initials: "DL", brand: "nikumaru", branch: "nikumaru/kemang" },
  { name: "Kenji Sato", role: "owner", pin: "8765", initials: "KS", brand: "tenka", branch: null },
  { name: "Akira Tanaka", role: "cashier", pin: "3344", initials: "AT", brand: "tenka", branch: "tenka/senopati" },
];

interface DemoEntry {
  seq: number;
  code: string;
  name: string;
  party: number;
  phone: string;
  source: "qr" | "online" | "walkin";
  status: "waiting" | "called" | "seated" | "completed" | "no_show" | "cancelled";
  joined: number;
  notes?: string | null;
  called?: number;
  seated?: number;
  closed?: number;
  table?: string | null;
  seat?: number | null;
  openedBy?: string | null;
}

const DEMO_ENTRIES: Record<string, DemoEntry[]> = {
  "nikumaru/senopati": [
    { seq: 1, code: "A-001", name: "Joaquin Reyes", party: 2, phone: "+62 812 1111 0101", source: "qr", status: "waiting", joined: 34, notes: "Dekat jendela kalau bisa" },
    { seq: 2, code: "A-002", name: "Mira Santoso", party: 4, phone: "+62 812 1111 0102", source: "online", status: "waiting", joined: 27 },
    { seq: 3, code: "A-003", name: "Daniel Park", party: 2, phone: "+62 812 1111 0103", source: "qr", status: "waiting", joined: 19 },
    { seq: 4, code: "A-004", name: "The Oka Family", party: 6, phone: "+62 812 1111 0104", source: "qr", status: "waiting", joined: 11, notes: "Butuh satu kursi bayi" },
    { seq: 5, code: "A-005", name: "Clara Nguyen", party: 3, phone: "+62 812 1111 0105", source: "online", status: "called", joined: 22, notes: "Merayakan ulang tahun", called: 2 },
    { seq: 6, code: "A-006", name: "Ben Hartono", party: 2, phone: "+62 812 1111 0106", source: "qr", status: "seated", joined: 55, seated: 38, table: "T4", seat: 2, openedBy: "Ayu Lestari" },
    { seq: 7, code: "A-007", name: "Sari & Dimas", party: 4, phone: "+62 812 1111 0107", source: "qr", status: "seated", joined: 48, notes: "Anniversary", seated: 31, table: "P2", seat: 1, openedBy: "Sari Kasir" },
    { seq: 8, code: "A-008", name: "Noah Lim", party: 6, phone: "+62 812 1111 0108", source: "online", status: "seated", joined: 70, seated: 50, table: "T7", seat: 3, openedBy: "Ayu Lestari" },
    { seq: 9, code: "A-009", name: "Emma Wijaya", party: 2, phone: "+62 812 1111 0109", source: "qr", status: "completed", joined: 120, seated: 95, closed: 50, table: "T2", seat: 1, openedBy: "Bima Pratama" },
    { seq: 10, code: "A-010", name: "Arif Setiawan", party: 8, phone: "+62 812 1111 0110", source: "online", status: "no_show", joined: 90, called: 80, closed: 72 },
    { seq: 11, code: "A-011", name: "Nadia Kusuma", party: 2, phone: "+62 812 1111 0111", source: "qr", status: "cancelled", joined: 100, closed: 88 },
    { seq: 12, code: "A-012", name: "Priya Nair", party: 2, phone: "+62 812 1111 0112", source: "qr", status: "waiting", joined: 7 },
    { seq: 13, code: "A-013", name: "Tom Bakker", party: 3, phone: "+62 812 1111 0113", source: "online", status: "waiting", joined: 3, notes: "Boleh di bar" },
    { seq: 14, code: "A-014", name: "Luca Moretti", party: 4, phone: "+62 812 1111 0114", source: "qr", status: "seated", joined: 47, seated: 22, table: "T3", seat: 4, openedBy: "Ayu Lestari" },
    { seq: 15, code: "A-015", name: "Nina Halim", party: 3, phone: "+62 812 1111 0115", source: "qr", status: "seated", joined: 62, notes: "Alergi kerang", seated: 18, table: "T5", seat: 2, openedBy: "Sari Kasir" },
    { seq: 16, code: "A-016", name: "Omar Haddad", party: 4, phone: "+62 812 1111 0116", source: "online", status: "seated", joined: 44, seated: 12, table: "P3", seat: 1, openedBy: "Bima Pratama" },
    { seq: 17, code: "A-017", name: "Grace Tan", party: 6, phone: "+62 812 1111 0117", source: "qr", status: "seated", joined: 58, notes: "Kue ulang tahun di kulkas", seated: 8, table: "P4", seat: 6, openedBy: "Ayu Lestari" },
    { seq: 18, code: "A-018", name: "Sam Rivera", party: 1, phone: "+62 812 1111 0118", source: "walkin", status: "seated", joined: 30, seated: 5, table: "C1", seat: 1, openedBy: "Sari Kasir" },
    { seq: 19, code: "A-019", name: "Theo Lim", party: 2, phone: "+62 812 1111 0119", source: "qr", status: "completed", joined: 150, seated: 120, closed: 78, table: "T1", seat: 1, openedBy: "Ayu Lestari" },
    { seq: 20, code: "A-020", name: "Iris Chen", party: 2, phone: "+62 812 1111 0120", source: "online", status: "completed", joined: 160, seated: 135, closed: 95, table: "P1", seat: 2, openedBy: "Bima Pratama" },
    { seq: 21, code: "A-021", name: "Will Tan", party: 2, phone: "+62 812 1111 0121", source: "qr", status: "seated", joined: 40, seated: 20, table: "T1", seat: 2, openedBy: "Ayu Lestari" },
    { seq: 22, code: "A-022", name: "Zoe Park", party: 2, phone: "+62 812 1111 0122", source: "qr", status: "seated", joined: 36, seated: 16, table: "P1", seat: 1, openedBy: "Sari Kasir" },
    { seq: 23, code: "A-023", name: "Hana Sato", party: 2, phone: "+62 812 1111 0123", source: "qr", status: "completed", joined: 180, seated: 140, closed: 110, table: "T6", seat: 1, openedBy: "Bima Pratama" },
    { seq: 24, code: "A-024", name: "Ravi Menon", party: 4, phone: "+62 812 1111 0124", source: "online", status: "completed", joined: 200, seated: 165, closed: 125, table: "T5", seat: 3, openedBy: "Ayu Lestari" },
    { seq: 25, code: "A-025", name: "Elena Rossi", party: 6, phone: "+62 812 1111 0125", source: "qr", status: "completed", joined: 210, seated: 175, closed: 130, table: "P4", seat: 4, openedBy: "Sari Kasir" },
  ],
  "nikumaru/kemang": [
    { seq: 1, code: "A-001", name: "Adrian Tan", party: 2, phone: "+62 813 2222 0101", source: "qr", status: "waiting", joined: 18 },
    { seq: 2, code: "A-002", name: "Maya Kusuma", party: 4, phone: "+62 813 2222 0102", source: "online", status: "waiting", joined: 12, notes: "Meja dekat jendela" },
    { seq: 3, code: "A-003", name: "Rafi Putra", party: 2, phone: "+62 813 2222 0103", source: "qr", status: "called", joined: 22, called: 1 },
    { seq: 4, code: "A-004", name: "Keluarga Wibowo", party: 4, phone: "+62 813 2222 0104", source: "qr", status: "seated", joined: 40, seated: 24, table: "T2", seat: 1, openedBy: "Dewi Larasati" },
    { seq: 5, code: "A-005", name: "Nadia & Joel", party: 6, phone: "+62 813 2222 0105", source: "online", status: "seated", joined: 35, seated: 15, table: "T5", seat: 2, openedBy: "Dewi Larasati" },
    { seq: 6, code: "A-006", name: "Clara Wijaya", party: 4, phone: "+62 813 2222 0106", source: "qr", status: "seated", joined: 28, seated: 8, table: "P1", seat: 3, openedBy: "Dewi Larasati" },
    { seq: 7, code: "A-007", name: "Bima Santoso", party: 2, phone: "+62 813 2222 0107", source: "qr", status: "completed", joined: 120, seated: 90, closed: 55, table: "T7", seat: 1, openedBy: "Dewi Larasati" },
    { seq: 8, code: "A-008", name: "Ivan Chen", party: 4, phone: "+62 813 2222 0108", source: "online", status: "no_show", joined: 80, called: 70, closed: 62 },
    { seq: 9, code: "A-009", name: "Sinta Dewi", party: 3, phone: "+62 813 2222 0109", source: "qr", status: "waiting", joined: 6 },
    { seq: 10, code: "A-010", name: "Kevin Halim", party: 2, phone: "+62 813 2222 0110", source: "qr", status: "cancelled", joined: 100, closed: 90 },
  ],
  "tenka/senopati": [
    { seq: 1, code: "A-001", name: "Haruto Mori", party: 2, phone: "+62 815 3333 0101", source: "qr", status: "waiting", joined: 20 },
    { seq: 2, code: "A-002", name: "Ayu & Raka", party: 4, phone: "+62 815 3333 0102", source: "online", status: "waiting", joined: 14, notes: "Bar kalau bisa" },
    { seq: 3, code: "A-003", name: "Kenji Watanabe", party: 2, phone: "+62 815 3333 0103", source: "qr", status: "called", joined: 24, called: 2 },
    { seq: 4, code: "A-004", name: "Nina Tanaka", party: 4, phone: "+62 815 3333 0104", source: "qr", status: "seated", joined: 45, seated: 30, table: "T3", seat: 2, openedBy: "Akira Tanaka" },
    { seq: 5, code: "A-005", name: "Rudi Hartono", party: 6, phone: "+62 815 3333 0105", source: "online", status: "seated", joined: 38, seated: 20, table: "T5", seat: 4, openedBy: "Kenji Sato" },
    { seq: 6, code: "A-006", name: "Sakura & Friends", party: 4, phone: "+62 815 3333 0106", source: "qr", status: "completed", joined: 100, seated: 70, closed: 40, table: "T2", seat: 1, openedBy: "Akira Tanaka" },
    { seq: 7, code: "A-007", name: "Bagas Pratama", party: 1, phone: "+62 815 3333 0107", source: "walkin", status: "waiting", joined: 5 },
    { seq: 8, code: "A-008", name: "Yuki Sato", party: 2, phone: "+62 815 3333 0108", source: "online", status: "no_show", joined: 70, called: 60, closed: 52 },
  ],
};

function logoNikumaru(): Uint8Array {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
    <rect width="128" height="128" rx="32" fill="#FFF1CA"/>
    <path d="M24 54h80c0 26-18 44-40 44S24 80 24 54Z" fill="#F24B3F" stroke="#262321" stroke-width="6"/>
    <path d="M18 54h92" stroke="#262321" stroke-width="7" stroke-linecap="round"/>
    <path d="M42 42c-3-9 8-12 4-21M64 40c-3-9 8-12 4-21M86 42c-3-9 8-12 4-21" stroke="#262321" stroke-width="4" stroke-linecap="round"/>
    <path d="M48 66c8 8 24 8 32 0" stroke="#FFF1CA" stroke-width="5" stroke-linecap="round"/>
    <path d="M92 28l10-8M96 38l13-2" stroke="#F24B3F" stroke-width="4" stroke-linecap="round"/>
  </svg>`;
  return new Uint8Array(Buffer.from(svg));
}

function logoTenka(): Uint8Array {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
    <rect width="128" height="128" rx="32" fill="#262321"/>
    <path d="M64 18v12M52 30h24M44 34h40l-4 52c-1 13-8 22-16 22s-15-9-16-22l-4-52Z" fill="#E3A02D" stroke="#FFF1CA" stroke-width="4"/>
    <path d="M52 58h24M50 76h28" stroke="#262321" stroke-width="5" stroke-linecap="round"/>
    <path d="M28 92c8-8 16-10 24-6M100 92c-8-8-16-10-24-6" stroke="#F24B3F" stroke-width="4" stroke-linecap="round"/>
  </svg>`;
  return new Uint8Array(Buffer.from(svg));
}

export function isDemoMode(): boolean {
  return ["1", "true", "yes", "on"].includes((process.env.DEMO_MODE ?? "").toLowerCase());
}

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export async function seedDatabase(db: Queryable): Promise<void> {
  // Brands
  for (const brand of DEMO_BRANDS) {
    await db.query(
      `insert into brands (name, slug, instagram, description, accent, logo_data, logo_mime)
       values ($1,$2,$3,$4,$5,$6,'image/svg+xml')
       on conflict (slug) do nothing`,
      [
        brand.name,
        brand.slug,
        brand.instagram,
        brand.description,
        brand.accent,
        brand.slug === "nikumaru" ? logoNikumaru() : logoTenka(),
      ],
    );
  }

  const brandRows = await db.query<{ id: number; slug: string }>("select id, slug from brands");
  const brandIds = new Map(brandRows.map((row) => [row.slug, Number(row.id)]));

  // Branches
  for (const branch of DEMO_BRANCHES) {
    const brandId = brandIds.get(branch.brandSlug);
    if (!brandId) continue;
    await db.query(
      `insert into branches
        (brand_id, name, slug, tagline, address, phone, timezone, open_time, close_time, accent, announcement)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       on conflict (brand_id, slug) do nothing`,
      [
        brandId,
        branch.name,
        branch.slug,
        branch.tagline,
        branch.address,
        branch.phone,
        branch.timezone,
        branch.openTime,
        branch.closeTime,
        branch.accent,
        branch.announcement,
      ],
    );
  }

  const branchRows = await db.query<{ id: number; slug: string; brand_id: number }>(
    `select b.id, b.slug, b.brand_id from branches b`,
  );
  const branchKey = (brandSlug: string, branchSlug: string) => {
    const brandId = brandIds.get(brandSlug);
    const row = branchRows.find((item) => Number(item.brand_id) === brandId && item.slug === branchSlug);
    return row ? Number(row.id) : null;
  };

  // Staff (only on first boot; real operators manage staff afterwards)
  const staffCount = await db.query<{ count: string }>("select count(*)::text as count from staff");
  if (Number(staffCount[0]?.count ?? 0) === 0) {
    for (const person of STAFF_SEED) {
      const brandId = person.brand ? brandIds.get(person.brand) : null;
      const branchId = person.branch
        ? branchKey(person.branch.split("/")[0], person.branch.split("/")[1])
        : null;
      await db.query(
        `insert into staff (name, role, pin_hash, initials, brand_id, branch_id)
         values ($1,$2,$3,$4,$5,$6)`,
        [person.name, person.role, hashPin(person.pin), person.initials, brandId ?? null, branchId ?? null],
      );
    }
  }

  // Tables per branch
  for (const branch of DEMO_BRANCHES) {
    const branchId = branchKey(branch.brandSlug, branch.slug);
    if (!branchId) continue;
    const existing = await db.query<{ count: string }>(
      "select count(*)::text as count from dining_tables where branch_id = $1",
      [branchId],
    );
    if (Number(existing[0]?.count ?? 0) > 0) continue;
    const tables = TABLES_BY_BRANCH[`${branch.brandSlug}/${branch.slug}`] ?? [];
    for (const [index, table] of tables.entries()) {
      await db.query(
        `insert into dining_tables (branch_id, label, capacity, zone, sort_order)
         values ($1,$2,$3,$4,$5)`,
        [branchId, table.label, table.capacity, table.zone, index + 1],
      );
    }
  }

  if (!isDemoMode()) return;

  const primaryBranchId = branchKey("nikumaru", "senopati");
  if (!primaryBranchId) return;
  const primaryRow = await db.query<{ timezone: string }>(
    "select timezone from branches where id = $1",
    [primaryBranchId],
  );
  const timezone = primaryRow[0]?.timezone ?? "Asia/Jakarta";
  const today = dayInTz(new Date(), timezone);
  const todays = await db.query<{ count: string }>(
    "select count(*)::text as count from queue_entries where branch_id = $1 and day = $2::date",
    [primaryBranchId, today],
  );
  if (Number(todays[0]?.count ?? 0) > 0) return;

  // A new demo day: reset every branch's floor and rebuild the demo service.
  await db.query("delete from activity");
  await db.query("delete from queue_entries");
  await db.query("delete from queue_sequence");
  await db.query("update dining_tables set status = 'available', status_changed_at = now()");

  for (const branch of DEMO_BRANCHES) {
    const branchId = branchKey(branch.brandSlug, branch.slug);
    if (!branchId) continue;
    const key = `${branch.brandSlug}/${branch.slug}`;
    const entries = DEMO_ENTRIES[key] ?? [];
    const tableRows = await db.query<{ id: number; label: string }>(
      "select id, label from dining_tables where branch_id = $1",
      [branchId],
    );
    const tableId = (label: string) => tableRows.find((row) => row.label === label)?.id ?? null;

    for (const item of entries) {
      const joinedAt = isoMinutesAgo(item.joined);
      const calledAt = item.called ? isoMinutesAgo(item.called) : null;
      const seatedAt = item.seated ? isoMinutesAgo(item.seated) : null;
      const closedAt = item.closed ? isoMinutesAgo(item.closed) : null;
      await db.query(
        `insert into queue_entries
          (branch_id, token, code, day, seq, guest_name, phone, party_size, notes, source, status,
           table_id, seat_number, opened_by, called_count, acknowledged, joined_at, called_at,
           hold_expires_at, seated_at, closed_at, cancelled_by)
         values ($1,$2,$3,$4::date,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,
        [
          branchId,
          `demo-${branchId}-${item.seq}-${today}`,
          item.code,
          today,
          item.seq,
          item.name,
          item.phone,
          item.party,
          item.notes ?? null,
          item.source,
          item.status,
          item.table ? tableId(item.table) : null,
          item.seat ?? null,
          item.openedBy ?? null,
          item.status === "called" ? 1 : 0,
          false,
          joinedAt,
          calledAt,
          null,
          seatedAt,
          closedAt,
          item.status === "cancelled" ? "guest" : null,
        ],
      );

      if (item.status === "seated" && item.table) {
        await db.query(
          "update dining_tables set status = 'seated', status_changed_at = now() where branch_id = $1 and label = $2",
          [branchId, item.table],
        );
      }
      if (item.status === "completed" && item.table) {
        await db.query(
          "update dining_tables set status = 'dirty', status_changed_at = now() where branch_id = $1 and label = $2",
          [branchId, item.table],
        );
      }
    }

    const maxSeq = entries.reduce((max, item) => Math.max(max, item.seq), 0);
    await db.query(
      `insert into queue_sequence (branch_id, day, last_seq) values ($1, $2::date, $3)
       on conflict (branch_id, day) do update set last_seq = $3`,
      [branchId, today, maxSeq],
    );
  }

  // A small activity feed for the primary branch.
  const feed = [
    { type: "join", name: "The Oka Family", code: "A-004", party: 6, actor: "Tamu", minutes: 11, table: null },
    { type: "call", name: "Clara Nguyen", code: "A-005", party: 3, actor: "Ayu Lestari", minutes: 2, table: null },
    { type: "seat", name: "Ben Hartono", code: "A-006", party: 2, actor: "Ayu Lestari", minutes: 38, table: "T4" },
    { type: "complete", name: "Emma Wijaya", code: "A-009", party: 2, actor: "Bima Pratama", minutes: 50, table: "T2" },
    { type: "no_show", name: "Arif Setiawan", code: "A-010", party: 8, actor: "Ayu Lestari", minutes: 72, table: null },
    { type: "cancel", name: "Nadia Kusuma", code: "A-011", party: 2, actor: "Tamu", minutes: 88, table: null },
  ];
  for (const item of feed) {
    await db.query(
      `insert into activity (branch_id, type, actor, detail, created_at)
       values ($1,$2,$3,$4::jsonb,$5)`,
      [
        primaryBranchId,
        item.type,
        item.actor,
        JSON.stringify({
          code: item.code,
          name: item.name,
          partySize: item.party,
          tableLabel: item.table,
        }),
        isoMinutesAgo(item.minutes),
      ],
    );
  }
}
