import type { Metadata, Viewport } from "next";
import { Fredoka, Plus_Jakarta_Sans } from "next/font/google";
import { LanguageProvider } from "@/components/LanguageProvider";
import { getLang } from "@/lib/lang";
import "./globals.css";

const display = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "AntriQ — Antrean restoran, lebih praktis",
    template: "%s · AntriQ",
  },
  description:
    "Antrean restoran yang jelas dan menyenangkan. Tamu memantau giliran dari ponsel, host mengatur meja, pemilik melihat layanan.",
  applicationName: "AntriQ",
  openGraph: {
    title: "AntriQ — Antrean restoran, lebih praktis",
    description:
      "Antrean restoran yang jelas dan menyenangkan. Tamu memantau giliran dari ponsel, host mengatur meja, pemilik melihat layanan.",
    type: "website",
    url: appUrl,
    images: [
      {
        url: "/og.jpg",
        width: 1440,
        height: 1000,
        alt: "AntriQ — antrean restoran yang lebih praktis",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AntriQ — Antrean restoran, lebih praktis",
    description: "Antrean restoran yang jelas dan menyenangkan.",
    images: ["/og.jpg"],
  },
  appleWebApp: {
    capable: true,
    title: "AntriQ",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFF1CA",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const lang = await getLang();
  return (
    <html lang={lang} className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-[100dvh] bg-paper font-sans text-ink antialiased">
        <LanguageProvider initialLang={lang}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
