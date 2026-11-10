import { hashPin } from "./pin";
import type { Queryable } from "./db";
import { dayInTz } from "./time";
import { codeFor } from "./queue";

export const DEMO_BRANDS = [
  {
    name: "Nikumaru",
    slug: "nikumaru",
    instagram: "@nikumaru.id",
    description:
      "Japanese beef hamburg & niku rice. No pork, no lard, no mirin. Blok M and Tebet, Jakarta.",
    accent: "#F24B3F",
  },
  {
    name: "Tenka",
    slug: "tenka",
    instagram: "@tenka.idn",
    description:
      "Halal-certified tempura & katsu house. AEON Mall Tanjung Barat, Bintaro Xchange Mall 2, and KAMAJA Social Space.",
    accent: "#E3A02D",
  },
];

export const DEMO_BRANCHES = [
  {
    brandSlug: "nikumaru",
    name: "Nikumaru Blok M",
    slug: "blok-m",
    tagline: "Japanese Hamburg & Niku Rice · Blok M",
    address:
      "Jl. Sunan Kalijaga No. 1, RT.1/RW.1, Melawai, Kebayoran Baru, Jakarta Selatan 12160 (seberang Taman Literasi, samping M Bloc Space)",
    phone: "+62 811 9000 212",
    latitude: -6.2423253,
    longitude: 106.7997002,
    timezone: "Asia/Jakarta",
    openTime: "10:00",
    closeTime: "22:00",
    accent: "#F24B3F",
    announcement:
      "Selamat datang di Nikumaru Blok M. Ambil nomor antrean dari ponselmu — kami panggil saat meja siap.",
  },
  {
    brandSlug: "nikumaru",
    name: "Nikumaru Tebet",
    slug: "tebet",
    tagline: "Japanese Hamburg & Niku Rice · Tebet",
    address: "Jl. Tebet Raya, Tebet Barat, Tebet, Jakarta Selatan 12810",
    phone: "+62 811 9000 313",
    latitude: -6.2301344,
    longitude: 106.8522128,
    timezone: "Asia/Jakarta",
    openTime: "10:00",
    closeTime: "22:00",
    accent: "#F24B3F",
    announcement:
      "Nikumaru Tebet menerima walk-in dan reservasi hari ini. Ambil antrean dan tunggu panggilan host.",
  },
  {
    brandSlug: "tenka",
    name: "Tenka AEON Tanjung Barat",
    slug: "aeon-tanjung-barat",
    tagline: "Tempura & Katsu · AEON Mall Tanjung Barat",
    address:
      "AEON Mall Tanjung Barat, Jl. Lenteng Agung Raya No. 163, RT.1/RW.1, Tanjung Barat, Jagakarsa, Jakarta Selatan 12530",
    phone: "+62 811 9000 414",
    latitude: -6.3061495,
    longitude: 106.8403831,
    timezone: "Asia/Jakarta",
    openTime: "10:00",
    closeTime: "22:00",
    accent: "#E3A02D",
    announcement:
      "Tenka AEON Tanjung Barat buka setiap hari. Ambil antrean dan kami panggil saat meja siap.",
  },
  {
    brandSlug: "tenka",
    name: "Tenka Bintaro Xchange",
    slug: "bintaro-xchange",
    tagline: "Tempura & Katsu · Bintaro Xchange Mall 2",
    address:
      "Bintaro Jaya Xchange Mall 2, Lantai FF Unit FF-F-09, Jl. Boulevard Bintaro Jaya No. 2, Pondok Jaya, Pondok Aren, Tangerang Selatan 15227",
    phone: "+62 811 9000 515",
    latitude: -6.2840882,
    longitude: 106.7273494,
    timezone: "Asia/Jakarta",
    openTime: "10:00",
    closeTime: "22:00",
    accent: "#E3A02D",
    announcement:
      "Tenka Bintaro Xchange menerima walk-in. Ambil antrean dari ponsel dan tunggu panggilan host.",
  },
  {
    brandSlug: "tenka",
    name: "Tenka KAMAJA",
    slug: "kamaja",
    tagline: "Tempura & Katsu · KAMAJA Social Space",
    address:
      "KAMAJA Social Space, Jl. Kyai Maja No. 70, Kramat Pela, Kebayoran Baru, Jakarta Selatan 12120",
    phone: "+62 811 9000 616",
    latitude: -6.2415471,
    longitude: 106.7918167,
    timezone: "Asia/Jakarta",
    openTime: "10:00",
    closeTime: "22:00",
    accent: "#E3A02D",
    announcement:
      "Tenka KAMAJA buka di Kebayoran Baru. Ambil antrean, nikmati tempura & katsu, dan kami panggil saat meja siap.",
  },
];

const TABLES_BY_BRANCH: Record<string, { label: string; capacity: number; zone: string }[]> = {
  "nikumaru/blok-m": [
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
  "nikumaru/tebet": [
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
  "tenka/kamaja": [
    { label: "T1", capacity: 2, zone: "Ruang utama" },
    { label: "T2", capacity: 2, zone: "Ruang utama" },
    { label: "T3", capacity: 4, zone: "Ruang utama" },
    { label: "T4", capacity: 4, zone: "Ruang utama" },
    { label: "T5", capacity: 6, zone: "Ruang utama" },
    { label: "T6", capacity: 8, zone: "Ruang utama" },
    { label: "B1", capacity: 1, zone: "Bar" },
    { label: "B2", capacity: 1, zone: "Bar" },
  ],
  "tenka/aeon-tanjung-barat": [
    { label: "T1", capacity: 2, zone: "Dining" },
    { label: "T2", capacity: 2, zone: "Dining" },
    { label: "T3", capacity: 4, zone: "Dining" },
    { label: "T4", capacity: 4, zone: "Dining" },
    { label: "T5", capacity: 6, zone: "Dining" },
    { label: "T6", capacity: 6, zone: "Dining" },
    { label: "T7", capacity: 8, zone: "Dining" },
  ],
  "tenka/bintaro-xchange": [
    { label: "T1", capacity: 2, zone: "Dining" },
    { label: "T2", capacity: 2, zone: "Dining" },
    { label: "T3", capacity: 4, zone: "Dining" },
    { label: "T4", capacity: 4, zone: "Dining" },
    { label: "T5", capacity: 6, zone: "Dining" },
    { label: "T6", capacity: 6, zone: "Dining" },
    { label: "T7", capacity: 8, zone: "Dining" },
  ],
};

const STAFF_SEED = [
  { name: "Owner", role: "owner", pin: "1234", initials: "OW", brand: null, branch: null },
  { name: "Owner Nikumaru", role: "owner", pin: "1234", initials: "ON", brand: "nikumaru", branch: null },
  { name: "Host Blok M", role: "host", pin: "1234", initials: "HB", brand: "nikumaru", branch: "nikumaru/blok-m" },
  { name: "Host Blok M 2", role: "host", pin: "1234", initials: "H2", brand: "nikumaru", branch: "nikumaru/blok-m" },
  { name: "Host Blok M 3", role: "host", pin: "1234", initials: "H3", brand: "nikumaru", branch: "nikumaru/blok-m" },
  { name: "Host Tebet", role: "host", pin: "1234", initials: "HT", brand: "nikumaru", branch: "nikumaru/tebet" },
  { name: "Owner Tenka", role: "owner", pin: "1234", initials: "OT", brand: "tenka", branch: null },
  { name: "Host KAMAJA", role: "host", pin: "1234", initials: "HK", brand: "tenka", branch: "tenka/kamaja" },
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
  "nikumaru/blok-m": [
    { seq: 1, code: "A-001", name: "Joaquin Reyes", party: 2, phone: "+62 812 1111 0101", source: "qr", status: "waiting", joined: 34, notes: "Dekat jendela kalau bisa" },
    { seq: 2, code: "A-002", name: "Mira Santoso", party: 4, phone: "+62 812 1111 0102", source: "online", status: "waiting", joined: 27 },
    { seq: 3, code: "A-003", name: "Daniel Park", party: 2, phone: "+62 812 1111 0103", source: "qr", status: "waiting", joined: 19 },
    { seq: 4, code: "A-004", name: "The Oka Family", party: 6, phone: "+62 812 1111 0104", source: "qr", status: "waiting", joined: 11, notes: "Butuh satu kursi bayi" },
    { seq: 5, code: "A-005", name: "Clara Nguyen", party: 3, phone: "+62 812 1111 0105", source: "online", status: "called", joined: 22, notes: "Merayakan ulang tahun", called: 2 },
    { seq: 6, code: "A-006", name: "Ben Hartono", party: 2, phone: "+62 812 1111 0106", source: "qr", status: "seated", joined: 55, seated: 38, table: "T4", seat: 2, openedBy: "Wuri" },
    { seq: 7, code: "A-007", name: "Sari & Dimas", party: 4, phone: "+62 812 1111 0107", source: "qr", status: "seated", joined: 48, notes: "Anniversary", seated: 31, table: "P2", seat: 1, openedBy: "Sari Kasir" },
    { seq: 8, code: "A-008", name: "Noah Lim", party: 6, phone: "+62 812 1111 0108", source: "online", status: "seated", joined: 70, seated: 50, table: "T7", seat: 3, openedBy: "Wuri" },
    { seq: 9, code: "A-009", name: "Emma Wijaya", party: 2, phone: "+62 812 1111 0109", source: "qr", status: "completed", joined: 120, seated: 95, closed: 50, table: "T2", seat: 1, openedBy: "Bima Pratama" },
    { seq: 10, code: "A-010", name: "Arif Setiawan", party: 8, phone: "+62 812 1111 0110", source: "online", status: "no_show", joined: 90, called: 80, closed: 72 },
    { seq: 11, code: "A-011", name: "Nadia Kusuma", party: 2, phone: "+62 812 1111 0111", source: "qr", status: "cancelled", joined: 100, closed: 88 },
    { seq: 12, code: "A-012", name: "Priya Nair", party: 2, phone: "+62 812 1111 0112", source: "qr", status: "waiting", joined: 7 },
    { seq: 13, code: "A-013", name: "Tom Bakker", party: 3, phone: "+62 812 1111 0113", source: "online", status: "waiting", joined: 3, notes: "Boleh di bar" },
    { seq: 14, code: "A-014", name: "Luca Moretti", party: 4, phone: "+62 812 1111 0114", source: "qr", status: "seated", joined: 47, seated: 22, table: "T3", seat: 4, openedBy: "Wuri" },
    { seq: 15, code: "A-015", name: "Nina Halim", party: 3, phone: "+62 812 1111 0115", source: "qr", status: "seated", joined: 62, notes: "Alergi kerang", seated: 18, table: "T5", seat: 2, openedBy: "Sari Kasir" },
    { seq: 16, code: "A-016", name: "Omar Haddad", party: 4, phone: "+62 812 1111 0116", source: "online", status: "seated", joined: 44, seated: 12, table: "P3", seat: 1, openedBy: "Bima Pratama" },
    { seq: 17, code: "A-017", name: "Grace Tan", party: 6, phone: "+62 812 1111 0117", source: "qr", status: "seated", joined: 58, notes: "Kue ulang tahun di kulkas", seated: 8, table: "P4", seat: 6, openedBy: "Wuri" },
    { seq: 18, code: "A-018", name: "Sam Rivera", party: 1, phone: "+62 812 1111 0118", source: "walkin", status: "seated", joined: 30, seated: 5, table: "C1", seat: 1, openedBy: "Sari Kasir" },
    { seq: 19, code: "A-019", name: "Theo Lim", party: 2, phone: "+62 812 1111 0119", source: "qr", status: "completed", joined: 150, seated: 120, closed: 78, table: "T1", seat: 1, openedBy: "Wuri" },
    { seq: 20, code: "A-020", name: "Iris Chen", party: 2, phone: "+62 812 1111 0120", source: "online", status: "completed", joined: 160, seated: 135, closed: 95, table: "P1", seat: 2, openedBy: "Bima Pratama" },
    { seq: 21, code: "A-021", name: "Will Tan", party: 2, phone: "+62 812 1111 0121", source: "qr", status: "seated", joined: 40, seated: 20, table: "T1", seat: 2, openedBy: "Wuri" },
    { seq: 22, code: "A-022", name: "Zoe Park", party: 2, phone: "+62 812 1111 0122", source: "qr", status: "seated", joined: 36, seated: 16, table: "P1", seat: 1, openedBy: "Sari Kasir" },
    { seq: 23, code: "A-023", name: "Hana Sato", party: 2, phone: "+62 812 1111 0123", source: "qr", status: "completed", joined: 180, seated: 140, closed: 110, table: "T6", seat: 1, openedBy: "Bima Pratama" },
    { seq: 24, code: "A-024", name: "Ravi Menon", party: 4, phone: "+62 812 1111 0124", source: "online", status: "completed", joined: 200, seated: 165, closed: 125, table: "T5", seat: 3, openedBy: "Wuri" },
    { seq: 25, code: "A-025", name: "Elena Rossi", party: 6, phone: "+62 812 1111 0125", source: "qr", status: "completed", joined: 210, seated: 175, closed: 130, table: "P4", seat: 4, openedBy: "Sari Kasir" },
  ],
  "nikumaru/tebet": [
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
  "tenka/kamaja": [
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

export function logoNikumaru(): Uint8Array {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
    <circle cx="128" cy="128" r="124" fill="#FFF1CA"/>
    <circle cx="128" cy="105" r="56" fill="none" stroke="#262321" stroke-width="8"/>
    <circle cx="128" cy="105" r="34" fill="none" stroke="#262321" stroke-width="6"/>
    <circle cx="128" cy="105" r="18" fill="#262321"/>
    <path d="M119 91v28M128 87v36M137 92v26" stroke="#FFF1CA" stroke-width="3" stroke-linecap="round"/>
    <text x="128" y="194" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="25" font-weight="900" letter-spacing="2.5" fill="#262321">NIKUMARU</text>
    <text x="128" y="216" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="700" letter-spacing="3" fill="#262321">BEEFY EGGY HAPPY</text>
    <path d="M64 230h128" stroke="#F24B3F" stroke-width="4" stroke-linecap="round"/>
  </svg>`;
  return new Uint8Array(Buffer.from(svg));
}

export function logoTenka(): Uint8Array {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
    <circle cx="128" cy="128" r="124" fill="#FFF8E7"/>
    <circle cx="128" cy="128" r="118" fill="#1E5AA8"/>
    <g transform="translate(64 42)">
      <path d="M4 48h120c-3 42-27 70-60 70S7 90 4 48Z" fill="#1E5AA8" stroke="#FFF1CA" stroke-width="6"/>
      <path d="M-3 48h134" stroke="#FFF1CA" stroke-width="8" stroke-linecap="round"/>
      <path d="M24 40c8-16 26-24 42-19 14 5 25 18 29 31-24 11-51 8-71-12Z" fill="#F4C430" stroke="#FFF1CA" stroke-width="4"/>
      <path d="M39 33c5-8 13-12 21-9" stroke="#FFF8E7" stroke-width="4" stroke-linecap="round"/>
      <text x="64" y="92" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="22" font-weight="900" fill="#FFF1CA">天下</text>
    </g>
    <text x="128" y="192" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="39" font-weight="900" letter-spacing="2" fill="#F4C430" stroke="#FFF1CA" stroke-width="2" paint-order="stroke">TENKA</text>
    <text x="128" y="214" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="800" letter-spacing="3" fill="#FFF1CA">TEMPURA &amp; KATSU</text>
  </svg>`;
  return new Uint8Array(Buffer.from(svg));
}

export function isDemoMode(): boolean {
  return ["1", "true", "yes", "on"].includes((process.env.DEMO_MODE ?? "").toLowerCase());
}

/**
 * The daily "reseeding" demo behaviour is opt-in. Production can run with
 * DEMO_MODE=1 for the initial seed, clear its queues, and stay empty.
 */
export function isDemoAutoReset(): boolean {
  // Never auto-reseed a Vercel production deployment. Use a separate demo
  // deployment/database for a pre-populated daily demo.
  if (process.env.VERCEL_ENV === "production") return false;
  return ["1", "true", "yes", "on"].includes((process.env.DEMO_AUTO_RESET ?? "").toLowerCase());
}

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export async function seedDatabase(db: Queryable): Promise<void> {
  const existingBrands = await db.query<{ count: string }>("select count(*)::text as count from brands");
  const firstBoot = Number(existingBrands[0]?.count ?? 0) === 0;

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
        (brand_id, name, slug, tagline, address, phone, latitude, longitude, timezone, open_time, close_time, accent, announcement)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       on conflict (brand_id, slug) do nothing`,
      [
        brandId,
        branch.name,
        branch.slug,
        branch.tagline,
        branch.address,
        branch.phone,
        branch.latitude ?? null,
        branch.longitude ?? null,
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

  // Only seed the lived-in demo on first boot, or when daily reset is enabled.
  // This keeps a cleared production database empty across redeploys/cold starts.
  if (!firstBoot && !isDemoAutoReset()) return;

  const primaryBranchId = branchKey("nikumaru", "blok-m");
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
      const category = item.party <= 2 ? "A" : "B";
      await db.query(
        `insert into queue_entries
          (branch_id, token, code, day, seq, category, guest_name, phone, party_size, notes, source, status,
           table_id, seat_number, opened_by, called_count, acknowledged, joined_at, called_at,
           hold_expires_at, seated_at, closed_at, cancelled_by)
         values ($1,$2,$3,$4::date,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)`,
        [
          branchId,
          `demo-${branchId}-${item.seq}-${today}`,
          codeFor(item.seq, category),
          today,
          item.seq,
          category,
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
          item.status === "called",
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
    { type: "call", name: "Clara Nguyen", code: "A-005", party: 3, actor: "Wuri", minutes: 2, table: null },
    { type: "seat", name: "Ben Hartono", code: "A-006", party: 2, actor: "Wuri", minutes: 38, table: "T4" },
    { type: "complete", name: "Emma Wijaya", code: "A-009", party: 2, actor: "Bima Pratama", minutes: 50, table: "T2" },
    { type: "no_show", name: "Arif Setiawan", code: "A-010", party: 8, actor: "Wuri", minutes: 72, table: null },
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
