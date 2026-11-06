import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "AntriQ — fewer waits, better tables",
    template: "%s · AntriQ",
  },
  description:
    "A calm restaurant waitlist for guests, hosts and owners. Join from your phone, seat the right party, and see the whole floor at a glance.",
  applicationName: "AntriQ",
  openGraph: {
    title: "AntriQ — fewer waits, better tables",
    description:
      "A calm restaurant waitlist for guests, hosts and owners. Join from your phone, seat the right party, and see the whole floor at a glance.",
    type: "website",
    url: appUrl,
    images: [
      {
        url: "/og.jpg",
        width: 1440,
        height: 1000,
        alt: "AntriQ guest page for Sage & Ember",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AntriQ — fewer waits, better tables",
    description: "Restaurant waitlist, table flow and floor analytics in one calm place.",
    images: ["/og.jpg"],
  },
  appleWebApp: {
    capable: true,
    title: "AntriQ",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#FBF6ED",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-[100dvh] bg-paper font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
