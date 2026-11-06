import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { ArrowLeft, ExternalLink, Smartphone, Timer, UtensilsCrossed } from "lucide-react";
import { CopyLinkButton, PrintButton } from "@/components/owner/QrActions";
import { Logo } from "@/components/Logo";
import { getRestaurant } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "QR poster",
  robots: { index: false, follow: false },
};

export default async function QrPage() {
  const restaurant = await getRestaurant();
  const headerStore = await headers();
  const host = headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  const base = (process.env.NEXT_PUBLIC_APP_URL || (host ? `${proto}://${host}` : "http://localhost:3000")).replace(/\/$/, "");
  const url = `${base}/`;

  const qr = await QRCode.toDataURL(url, {
    width: 760,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#1A1512", light: "#FFFDF8" },
  });

  return (
    <div className="space-y-5">
      <header className="no-print flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink">
            <ArrowLeft className="size-3.5" /> Overview
          </Link>
          <h1 className="mt-2 font-display text-[2.3rem] leading-none tracking-tight">QR poster</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Print it for the door, the window, or table tents. Guests scan, join the line from their phone,
            and their ticket stays live.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyLinkButton url={url} />
          <a href={url} target="_blank" rel="noreferrer" className="btn btn-soft btn-sm">
            <ExternalLink className="size-3.5" /> Open guest page
          </a>
          <PrintButton />
        </div>
      </header>

      <div className="no-print rounded-2xl border border-line bg-white px-4 py-3 text-xs leading-relaxed text-muted">
        <span className="font-bold text-ink">Print tip:</span> A4, portrait, 100% scale, no headers or
        footers. The QR opens <span className="font-semibold text-ink">{url}</span>.
      </div>

      <div className="flex justify-center">
        <article className="poster w-full max-w-[640px] overflow-hidden rounded-[1.75rem] border border-line bg-[#FFFDF8] shadow-lift print:max-w-none">
          <div className="bg-ink px-8 py-6 text-paper sm:px-10">
            <div className="flex items-center justify-between">
              <Logo tone="light" href="/" />
              <span className="text-[0.625rem] font-bold uppercase tracking-[0.18em] text-paper/40">
                Walk-in waitlist
              </span>
            </div>
            <p className="mt-7 text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-clay">
              {restaurant.name}
            </p>
            <h2 className="mt-2 font-display text-[3.1rem] leading-[0.92] tracking-tight sm:text-[3.7rem]">
              Skip the line.
              <br />
              Keep the evening.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-paper/60">
              Scan the code, add your name, and watch your place from your phone. No app, no account.
            </p>
          </div>

          <div className="relative h-6 bg-[#FFFDF8]">
            <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-line" />
            <div className="absolute -left-3 top-1/2 size-6 -translate-y-1/2 rounded-full border border-line bg-paper" />
            <div className="absolute -right-3 top-1/2 size-6 -translate-y-1/2 rounded-full border border-line bg-paper" />
          </div>

          <div className="px-8 pb-8 pt-3 sm:px-10">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="order-2 flex-1 sm:order-1">
                <p className="eyebrow text-clay">How it works</p>
                <div className="mt-4 space-y-3.5">
                  {[
                    { icon: Smartphone, text: "Scan to open the waitlist" },
                    { icon: Timer, text: "Watch your place and estimate" },
                    { icon: UtensilsCrossed, text: "We call you when the table is ready" },
                  ].map((item, index) => (
                    <div key={item.text} className="flex items-center gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line bg-white text-clay">
                        <item.icon className="size-4" />
                      </span>
                      <span className="text-sm font-medium leading-snug">
                        <span className="mr-1.5 text-muted-soft">0{index + 1}</span>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-xs leading-relaxed text-muted">
                  Hold time: {restaurant.holdMinutes} minutes · Open {restaurant.openTime}–{restaurant.closeTime}
                </p>
              </div>

              <div className="order-1 shrink-0 sm:order-2">
                <div className="rounded-2xl border border-line bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr} alt={`QR code to join the ${restaurant.name} waitlist`} className="size-48 sm:size-52" />
                </div>
                <p className="mt-2 text-center text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-muted">
                  Scan with your camera
                </p>
              </div>
            </div>

            <div className="mt-7 flex items-center justify-between border-t border-dashed border-line pt-4 text-[0.625rem] text-muted">
              <span className="font-semibold">{url.replace(/^https?:\/\//, "")}</span>
              <span>Powered by AntriQ</span>
            </div>
          </div>
        </article>
      </div>

      <div className="no-print flex justify-center pb-4">
        <a href={qr} download="antriq-qr.png" className="btn btn-ghost btn-sm text-muted">
          Download QR image
        </a>
      </div>
    </div>
  );
}
