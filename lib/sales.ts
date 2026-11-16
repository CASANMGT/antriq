import type { Lang } from "./i18n";

export const SALES_PHONE = "6281281948180";
export const SALES_PRICE = "Rp49.000";

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
  included: string[];
  formKicker: string;
  formTitle: string;
  formSub: string;
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
    metaTitle: "AntriQ untuk bisnis — Rp49.000/bulan",
    metaDescription:
      "Antrean digital untuk restoran, klinik, salon, bengkel, dan bisnis lain. Mulai Rp49.000/bulan. Tamu cukup scan QR, tanpa aplikasi.",
    kicker: "ANTRIQ UNTUK BISNIS",
    titleLead: "Antrean rapi.",
    titleAccent: "Tamu tenang.",
    subtitle:
      "Ganti buku antrean dan panggilan manual dengan tiket digital, papan host live, dan laporan harian. Tamu cukup scan QR — tanpa aplikasi.",
    pricePrefix: "Mulai dari",
    price: SALES_PRICE,
    priceSuffix: "/ bulan",
    priceNote: "Satu harga sederhana untuk satu cabang. Hubungi kami untuk multi-cabang.",
    ctaChat: "Chat tim via WhatsApp",
    ctaSee: "Lihat yang Anda dapat",
    bullets: ["Tanpa aplikasi untuk tamu", "Langsung jalan di browser", "Dibantu setup oleh tim"],
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
    pricingKicker: "HARGA SEDERHANA",
    pricingTitle: "Rp49.000/bulan",
    pricingSub: "Mulai dari satu cabang. Tanpa biaya tersembunyi.",
    included: [
      "Antrean A/B & panggilan",
      "Tiket tamu + poster QR",
      "Papan host & selesai massal",
      "Rating & laporan owner",
      "Multi-cabang",
      "Dukungan onboarding",
    ],
    formKicker: "MULAI",
    formTitle: "Ceritakan bisnis Anda",
    formSub: "Isi tiga hal ini, lalu kami lanjutkan di WhatsApp.",
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
      "Halo tim AntriQ, saya {name} dari {business} ({type}). Saya tertarik dengan AntriQ Rp49.000/bulan. Boleh dibantu info dan onboarding-nya?",
    waMessageGeneric:
      "Halo tim AntriQ, saya tertarik dengan AntriQ Rp49.000/bulan. Boleh dibantu info dan onboarding-nya?",
  },
  en: {
    metaTitle: "AntriQ for business — Rp49,000/month",
    metaDescription:
      "Digital queues for restaurants, clinics, salons, garages and more. From Rp49,000/month. Guests scan a QR — no app needed.",
    kicker: "ANTRIQ FOR BUSINESS",
    titleLead: "Calm queues.",
    titleAccent: "Happy guests.",
    subtitle:
      "Replace paper lists and manual calls with digital tickets, a live host board and daily reports. Guests just scan a QR — no app needed.",
    pricePrefix: "From",
    price: SALES_PRICE,
    priceSuffix: "/ month",
    priceNote: "One simple price for one branch. Talk to us for multi-branch.",
    ctaChat: "Chat our team on WhatsApp",
    ctaSee: "See what you get",
    bullets: ["No app for guests", "Runs in the browser", "Set up with our team"],
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
    pricingKicker: "SIMPLE PRICING",
    pricingTitle: "Rp49,000/month",
    pricingSub: "Starting from one branch. No hidden fees.",
    included: [
      "A/B queues & calls",
      "Guest tickets + QR poster",
      "Host board & bulk checkout",
      "Ratings & owner reports",
      "Multi-branch",
      "Onboarding support",
    ],
    formKicker: "GET STARTED",
    formTitle: "Tell us about your business",
    formSub: "Fill these three things in and we'll continue on WhatsApp.",
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
      "Hi AntriQ team, I'm {name} from {business} ({type}). I'm interested in AntriQ at Rp49,000/month. Could you help with info and onboarding?",
    waMessageGeneric:
      "Hi AntriQ team, I'm interested in AntriQ at Rp49,000/month. Could you help with info and onboarding?",
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
  lang = "id",
}: {
  name?: string;
  business?: string;
  type?: string;
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
      : copy.waMessageGeneric;
  return `https://api.whatsapp.com/send?phone=${SALES_PHONE}&text=${encodeURIComponent(message)}`;
}
