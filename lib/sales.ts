import type { Lang } from "./i18n";

export const SALES_PHONE = "6281281948180";
export const SALES_PRICE = "Rp65.000";

export interface SalesPlan {
  id: string;
  idName: string;
  enName: string;
  monthly: string;
  annual: string;
  annualYear: string;
  idLimit: string;
  enLimit: string;
  idFeatures: string[];
  enFeatures: string[];
  popular?: boolean;
}

export const SALES_PLANS: SalesPlan[] = [
  {
    id: "free",
    idName: "Free",
    enName: "Free",
    monthly: "Rp0",
    annual: "Rp0",
    annualYear: "Rp0",
    idLimit: "30 antrian / hari",
    enLimit: "30 queues / day",
    idFeatures: ["1 counter / loket", "Web QR check-in", "Live browser tracking", "AntriQ watermark"],
    enFeatures: ["1 counter", "Web QR check-in", "Live browser tracking", "AntriQ watermark"],
  },
  {
    id: "starter",
    idName: "Starter",
    enName: "Starter",
    monthly: "Rp79.000",
    annual: "Rp65.000",
    annualYear: "Rp780rb",
    idLimit: "Antrian tanpa batas",
    enLimit: "Unlimited queues",
    idFeatures: ["Hapus batas 30/hari", "Hingga 2 counter", "Browser sound / chime", "Ringkasan harian"],
    enFeatures: ["Removes the 30/day cap", "Up to 2 counters", "Browser sound / chime", "Daily summary"],
  },
  {
    id: "pro",
    idName: "Pro",
    enName: "Pro",
    monthly: "Rp149.000",
    annual: "Rp119.000",
    annualYear: "Rp1,42jt",
    idLimit: "Antrian tanpa batas",
    enLimit: "Unlimited queues",
    idFeatures: [
      "TV Display Mode",
      "Counter & kategori tanpa batas",
      "Anti-Joki dynamic QR",
      "CSV customer export",
    ],
    enFeatures: ["TV Display Mode", "Unlimited counters & categories", "Anti-Joki dynamic QR", "CSV customer export"],
    popular: true,
  },
  {
    id: "business",
    idName: "Business / Chain",
    enName: "Business / Chain",
    monthly: "Rp249.000",
    annual: "Rp199.000",
    annualYear: "Rp2,38jt",
    idLimit: "Antrian tanpa batas",
    enLimit: "Unlimited queues",
    idFeatures: [
      "Multi-cabang HQ dashboard",
      "Custom logo / white-label",
      "Staff role permissions",
      "Webhook / POS integration",
    ],
    enFeatures: ["Multi-branch HQ dashboard", "Custom logo / white-label", "Staff role permissions", "Webhook / POS integration"],
  },
];


export interface SalesType {
  id: string;
  idLabel: string;
  enLabel: string;
  idNote: string;
  enNote: string;
}

export const SALES_TYPES: SalesType[] = [
  {
    id: "restaurant",
    idLabel: "Restoran & kafe",
    enLabel: "Restaurants & cafés",
    idNote: "Antrean meja, walk-in, dan daftar tunggu.",
    enNote: "Table queues, walk-ins and waitlists.",
  },
  {
    id: "clinic",
    idLabel: "Klinik & dokter gigi",
    enLabel: "Clinics & dental",
    idNote: "Pasien menunggu tanpa berdesakan di depan.",
    enNote: "Patients wait without crowding the front desk.",
  },
  {
    id: "salon",
    idLabel: "Salon & barbershop",
    enLabel: "Salons & barbershops",
    idNote: "Kursi siap, pelanggan datang tepat waktu.",
    enNote: "Chairs ready, clients arrive on time.",
  },
  {
    id: "automotive",
    idLabel: "Bengkel & cuci mobil",
    enLabel: "Garages & car wash",
    idNote: "Servis dan antrean kendaraan lebih rapi.",
    enNote: "Cleaner service and vehicle queues.",
  },
  {
    id: "laundry",
    idLabel: "Laundry",
    enLabel: "Laundry",
    idNote: "Antrean cuci, setrika, dan ambil.",
    enNote: "Drop-off, ironing and pickup queues.",
  },
  {
    id: "public",
    idLabel: "Bank & layanan publik",
    enLabel: "Banks & public services",
    idNote: "Nomor antrean digital untuk loket.",
    enNote: "Digital numbers for service counters.",
  },
  {
    id: "retail",
    idLabel: "Toko & service center",
    enLabel: "Retail & service centers",
    idNote: "Antrean servis, konsultasi, dan kasir.",
    enNote: "Service, consultation and checkout queues.",
  },
  {
    id: "events",
    idLabel: "Event & pameran",
    enLabel: "Events & exhibitions",
    idNote: "Booth, registrasi, dan sesi foto.",
    enNote: "Booths, registration and photo sessions.",
  },
];

export interface SalesCopy {
  metaTitle: string;
  metaDescription: string;
  kicker: string;
  titleLead: string;
  titleAccent: string;
  subtitle: string;
  pricePrefix: string;
  price: string;
  priceSuffix: string;
  priceNote: string;
  ctaChat: string;
  ctaFree: string;
  ctaSee: string;
  bullets: string[];
  typesKicker: string;
  typesTitle: string;
  typesSub: string;
  featuresKicker: string;
  featuresTitle: string;
  featuresSub: string;
  features: { title: string; body: string }[];
  pricingKicker: string;
  pricingTitle: string;
  pricingSub: string;
  billingMonthly: string;
  billingAnnual: string;
  perMonth: string;
  perYear: string;
  save: string;
  popular: string;
  planCta: string;
  freeCta: string;
  freeNote: string;
  noWaBlast: string;
  trialKicker: string;
  trialTitle: string;
  trialBody: string;
  formKicker: string;
  formTitle: string;
  formSub: string;
  planLabel: string;
  nameLabel: string;
  namePlaceholder: string;
  businessLabel: string;
  businessPlaceholder: string;
  typeLabel: string;
  typePlaceholder: string;
  customTypeLabel: string;
  customTypePlaceholder: string;
  otherType: string;
  submit: string;
  sent: string;
  formNote: string;
  directChat: string;
  backHome: string;
  footer: string;
  waMessage: string;
  waMessageGeneric: string;
}

export const SALES_COPY: Record<Lang, SalesCopy> = {
  id: {
    metaTitle: "AntriQ untuk bisnis — mulai Rp65.000/bulan",
    metaDescription:
      "Antrean digital untuk restoran, klinik, salon, bengkel, dan bisnis lain. Mulai Rp65.000/bulan per cabang. Tamu cukup scan QR, tanpa aplikasi.",
    kicker: "ANTRIQ UNTUK BISNIS",
    titleLead: "Antrean rapi.",
    titleAccent: "Tamu tenang.",
    subtitle:
      "Ganti buku antrean dan panggilan manual dengan tiket digital, papan host live, dan laporan harian. Tamu cukup scan QR — tanpa aplikasi.",
    pricePrefix: "Mulai dari",
    price: SALES_PRICE,
    priceSuffix: "/bulan per cabang",
    priceNote: "Harga tahunan — hemat ~20%. Coba gratis dulu, upgrade saat siap.",
    ctaChat: "Chat tim via WhatsApp",
    ctaFree: "Coba gratis",
    ctaSee: "Lihat yang Anda dapat",
    bullets: ["Coba gratis 30 antrian/hari", "Mulai Rp65rb/bulan per cabang", "Pure SaaS — tanpa WA blast"],
    typesKicker: "COCOK UNTUK",
    typesTitle: "Bisnis yang punya antrean",
    typesSub: "Dari restoran sampai klinik — siapa pun yang melayani tamu satu per satu.",
    featuresKicker: "YANG ANDA DAPAT",
    featuresTitle: "Semua yang dibutuhkan host",
    featuresSub: "Satu alat untuk mengatur antrean dari pintu sampai meja.",
    features: [
      { title: "Tiket digital", body: "Tamu scan QR, ambil nomor, dan memantau posisi dari HP." },
      { title: "Panggilan terstruktur", body: "Panggil, panggil lagi, lalu tandai Hadir atau Tidak Hadir dengan alasan." },
      { title: "Papan host live", body: "Antrean A/B, tamu hadir, dan tidak hadir dalam satu layar." },
      { title: "Selesai massal", body: "Pilih beberapa tamu atau semua, lalu selesaikan sekali tekan." },
      { title: "Rating tamu", body: "Lihat pengalaman tamu per cabang, tanggal, dan jam." },
      { title: "Laporan owner", body: "Ringkasan harian, per cabang atau semua cabang, plus ekspor CSV." },
    ],
    pricingKicker: "PAKET",
    pricingTitle: "Harga per cabang",
    pricingSub: "Mulai gratis, upgrade saat antrean makin ramai. Harga tahunan lebih hemat ~20%.",
    billingMonthly: "Bulanan",
    billingAnnual: "Tahunan",
    perMonth: "/bln",
    perYear: "/tahun",
    save: "Hemat ~20%",
    popular: "Paling populer",
    planCta: "Pilih paket",
    freeCta: "Coba gratis",
    freeNote: "Gratis untuk mulai — 30 antrian/hari.",
    noWaBlast: "Pure SaaS — tanpa WA blast, tanpa biaya per pesan.",
    trialKicker: "COBA GRATIS",
    trialTitle: "Mulai dari Free, upgrade saat siap.",
    trialBody:
      "30 antrian/hari, 1 counter, QR check-in. Naik ke Starter Rp65rb/bulan (tahunan) untuk antrean tanpa batas.",
    formKicker: "MULAI",
    formTitle: "Ceritakan bisnis Anda",
    formSub: "Isi tiga hal ini, lalu kami lanjutkan di WhatsApp.",
    planLabel: "Paket",
    nameLabel: "Nama Anda",
    namePlaceholder: "Nama lengkap",
    businessLabel: "Nama bisnis",
    businessPlaceholder: "cth. Nikumaru Blok M",
    typeLabel: "Jenis bisnis",
    typePlaceholder: "Pilih jenis bisnis",
    customTypeLabel: "Jenis bisnis Anda",
    customTypePlaceholder: "cth. Klinik gigi",
    otherType: "Lainnya",
    submit: "Chat tim via WhatsApp",
    sent: "WhatsApp dibuka di tab baru.",
    formNote: "Kami hanya memakai data ini untuk membalas pertanyaan Anda.",
    directChat: "Atau langsung chat tanpa mengisi form",
    backHome: "Kembali ke AntriQ",
    footer: "AntriQ — antrean digital untuk bisnis yang sibuk.",
    waMessage:
      "Halo tim AntriQ, saya {name} dari {business} ({type}). Saya tertarik dengan paket {plan} AntriQ. Boleh dibantu info dan onboarding-nya?",
    waMessageGeneric:
      "Halo tim AntriQ, saya tertarik dengan AntriQ mulai Rp65.000/bulan per cabang. Boleh dibantu info dan onboarding-nya?",
  },
  en: {
    metaTitle: "AntriQ for business — from Rp65,000/month",
    metaDescription:
      "Digital queues for restaurants, clinics, salons, garages and more. From Rp65,000/month per branch. Guests scan a QR — no app needed.",
    kicker: "ANTRIQ FOR BUSINESS",
    titleLead: "Calm queues.",
    titleAccent: "Happy guests.",
    subtitle:
      "Replace paper lists and manual calls with digital tickets, a live host board and daily reports. Guests just scan a QR — no app needed.",
    pricePrefix: "From",
    price: SALES_PRICE,
    priceSuffix: "/month per branch",
    priceNote: "Annual pricing — save ~20%. Try free first, upgrade when ready.",
    ctaChat: "Chat our team on WhatsApp",
    ctaFree: "Try for free",
    ctaSee: "See what you get",
    bullets: ["Try free with 30 queues/day", "From Rp65k/month per branch", "Pure SaaS — no WA blast"],
    typesKicker: "BUILT FOR",
    typesTitle: "Businesses with a queue",
    typesSub: "From restaurants to clinics — anyone serving guests one at a time.",
    featuresKicker: "WHAT YOU GET",
    featuresTitle: "Everything the host needs",
    featuresSub: "One place to run the queue from the door to the table.",
    features: [
      { title: "Digital tickets", body: "Guests scan a QR, take a number and watch their place from their phone." },
      { title: "Structured calls", body: "Call, call again, then mark Here or No-show with a reason." },
      { title: "Live host board", body: "Queue A/B, guests here and no-shows on one screen." },
      { title: "Bulk checkout", body: "Select a few guests or everyone, then finish in one tap." },
      { title: "Guest ratings", body: "See the guest experience by branch, date and hour." },
      { title: "Owner reports", body: "Daily summaries per branch or all branches, plus CSV export." },
    ],
    pricingKicker: "PLANS",
    pricingTitle: "Pricing per branch",
    pricingSub: "Start free, upgrade when the queue gets busy. Annual billing saves ~20%.",
    billingMonthly: "Monthly",
    billingAnnual: "Annual",
    perMonth: "/mo",
    perYear: "/yr",
    save: "Save ~20%",
    popular: "Most popular",
    planCta: "Choose plan",
    freeCta: "Try for free",
    freeNote: "Free to start — 30 queues/day.",
    noWaBlast: "Pure SaaS — no WA blast, no per-message fees.",
    trialKicker: "TRY FOR FREE",
    trialTitle: "Start on Free, upgrade when ready.",
    trialBody:
      "30 queues/day, 1 counter, QR check-in. Move to Starter at Rp65k/month (annual) for unlimited queues.",
    formKicker: "GET STARTED",
    formTitle: "Tell us about your business",
    formSub: "Fill these three things in and we'll continue on WhatsApp.",
    planLabel: "Plan",
    nameLabel: "Your name",
    namePlaceholder: "Full name",
    businessLabel: "Business name",
    businessPlaceholder: "e.g. Nikumaru Blok M",
    typeLabel: "Business type",
    typePlaceholder: "Choose a business type",
    customTypeLabel: "Your business type",
    customTypePlaceholder: "e.g. Dental clinic",
    otherType: "Other",
    submit: "Chat our team on WhatsApp",
    sent: "WhatsApp opened in a new tab.",
    formNote: "We only use this to reply to your question.",
    directChat: "Or chat directly without the form",
    backHome: "Back to AntriQ",
    footer: "AntriQ — digital queues for busy businesses.",
    waMessage:
      "Hi AntriQ team, I'm {name} from {business} ({type}). I'm interested in the {plan} plan for AntriQ. Could you help with info and onboarding?",
    waMessageGeneric:
      "Hi AntriQ team, I'm interested in AntriQ from Rp65,000/month per branch. Could you help with info and onboarding?",
  },
};

export function salesTypeLabel(type: SalesType, lang: Lang): string {
  return lang === "id" ? type.idLabel : type.enLabel;
}

export function salesTypeNote(type: SalesType, lang: Lang): string {
  return lang === "id" ? type.idNote : type.enNote;
}

export function salesWhatsAppHref({
  name,
  business,
  type,
  plan,
  lang = "id",
}: {
  name?: string;
  business?: string;
  type?: string;
  plan?: string;
  lang?: Lang;
}): string {
  const copy = SALES_COPY[lang];
  const parts = [name?.trim(), business?.trim(), type?.trim()].filter(Boolean);
  const message =
    parts.length > 0
      ? copy.waMessage
          .replace("{name}", name?.trim() || "—")
          .replace("{business}", business?.trim() || "—")
          .replace("{type}", type?.trim() || "—")
          .replace("{plan}", plan?.trim() || "Starter")
      : copy.waMessageGeneric;
  return `https://api.whatsapp.com/send?phone=${SALES_PHONE}&text=${encodeURIComponent(message)}`;
}
