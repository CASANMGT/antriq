import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { ArrowLeft, ExternalLink, ScanLine, Smartphone, Timer, UtensilsCrossed } from "lucide-react";
import { CopyLinkButton, PrintButton } from "@/components/owner/QrActions";
import { Logo } from "@/components/Logo";
import { Mascot } from "@/components/Mascot";
import { getRestaurant } from "@/lib/store";
import { getLang } from "@/lib/lang";
import { format, getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Poster QR",
  robots: { index: false, follow: false },
};

export default async function QrPage() {
  const [restaurant, lang] = await Promise.all([getRestaurant(), getLang()]);
  const t = getDict(lang);
  const headerStore = await headers();
  const host = headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  const base = (process.env.NEXT_PUBLIC_APP_URL || (host ? `${proto}://${host}` : "http://localhost:3000")).replace(/\/$/, "");
  const url = `${base}/`;

  const qr = await QRCode.toDataURL(url, {
    width: 760,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#262321", light: "#FFFDF7" },
  });

  return (
    <div className="space-y-5">
      <header className="no-print flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-extrabold text-muted hover:text-ink">
            <ArrowLeft className="size-3.5" /> {t.owner.overview}
          </Link>
          <p className="eyebrow mt-3 text-tomato">{t.owner.qrKicker}</p>
          <h1 className="mt-1 font-display text-[2.5rem] font-semibold leading-none tracking-tight">{t.owner.qrTitle}</h1>
          <p className="mt-2 max-w-xl text-sm font-semibold text-muted">{t.owner.qrSub}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyLinkButton url={url} />
          <a href={url} target="_blank" rel="noreferrer" className="btn btn-soft btn-sm">
            <ExternalLink className="size-3.5" /> {t.owner.openGuest}
          </a>
          <PrintButton />
        </div>
      </header>

      <div className="no-print rounded-2xl border-2 border-ink bg-cream px-4 py-3 text-xs font-semibold leading-relaxed text-ink/70">
        {format(t.owner.printTip, { url })}
      </div>

      <div className="flex justify-center">
        <article className="poster w-full max-w-[640px] overflow-hidden rounded-[2rem] border-2 border-ink bg-paper shadow-[8px_8px_0_#262321] print:max-w-none">
          <div className="relative bg-tomato px-8 py-6 text-white sm:px-10">
            <div className="flex items-center justify-between">
              <Logo tone="light" href="/" />
              <span className="rounded-full border-2 border-white/50 px-2.5 py-1 text-[0.625rem] font-extrabold uppercase tracking-[0.16em] text-white/85">
                AntriQ
              </span>
            </div>
            <p className="mt-7 text-[0.6875rem] font-extrabold uppercase tracking-[0.2em] text-white/70">
              {restaurant.name}
            </p>
            <h2 className="mt-2 font-display text-[3.2rem] font-semibold leading-[0.88] tracking-tight sm:text-[3.9rem]">
              {t.owner.posterHeadline1}
              <br />
              <span className="text-butter">{t.owner.posterHeadline2}</span>
            </h2>
            <p className="mt-4 max-w-[64%] text-sm font-semibold leading-relaxed text-white/80">
              {t.owner.posterBody}
            </p>
            <Mascot mood="happy" className="absolute -bottom-8 right-5 w-24 sm:right-8 sm:w-32" />
          </div>

          <div className="relative h-7 bg-paper">
            <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-ink/25" />
            <div className="absolute -left-3 top-1/2 size-6 -translate-y-1/2 rounded-full border-2 border-ink bg-cream" />
            <div className="absolute -right-3 top-1/2 size-6 -translate-y-1/2 rounded-full border-2 border-ink bg-cream" />
          </div>

          <div className="bg-paper px-8 pb-8 pt-5 sm:px-10">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="order-2 flex-1 sm:order-1">
                <p className="eyebrow text-tomato">{t.owner.howItWorks}</p>
                <div className="mt-4 space-y-3.5">
                  {[
                    { icon: ScanLine, text: t.owner.scanStep },
                    { icon: Smartphone, text: t.owner.watchStep },
                    { icon: UtensilsCrossed, text: t.owner.calledStep },
                  ].map((item, index) => (
                    <div key={item.text} className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-white text-tomato">
                        <item.icon className="size-4" />
                      </span>
                      <span className="text-sm font-bold leading-snug">
                        <span className="mr-1.5 text-ink/35">0{index + 1}</span>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-5 flex items-center gap-2 text-xs font-semibold leading-relaxed text-muted">
                  <Timer className="size-3.5 text-tomato" />
                  {t.guest.queueNote}
                </p>
              </div>

              <div className="order-1 shrink-0 sm:order-2">
                <div className="rounded-2xl border-2 border-ink bg-white p-3 shadow-[3px_3px_0_#262321]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr} alt={`QR code to join the ${restaurant.name} queue`} className="size-48 sm:size-52" />
                </div>
                <p className="mt-2 text-center text-[0.5625rem] font-extrabold uppercase tracking-[0.14em] text-ink/45">
                  {t.owner.scanCamera}
                </p>
              </div>
            </div>

            <div className="mt-7 flex items-center justify-between border-t-2 border-dashed border-ink/20 pt-4 text-[0.625rem] font-semibold text-muted">
              <span className="font-bold">{url.replace(/^https?:\/\//, "")}</span>
              <span>{t.owner.poweredBy}</span>
            </div>
          </div>
        </article>
      </div>

      <div className="no-print flex justify-center pb-4">
        <a href={qr} download="antriq-qr.png" className="btn btn-ghost btn-sm text-muted">
          {t.owner.downloadQr}
        </a>
      </div>
    </div>
  );
}
