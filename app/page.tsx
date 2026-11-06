import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  AtSign,
  Clock3,
  MapPin,
  Phone,
  Smartphone,
  Timer,
  UtensilsCrossed,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { MyTicketBanner } from "@/components/diner/MyTicketBanner";
import { JoinForm } from "@/components/diner/JoinForm";
import { TableArt } from "@/components/diner/TableArt";
import { getPublicSnapshot } from "@/lib/store";
import { formatDayLong, dayInTz } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const snapshot = await getPublicSnapshot();
  return {
    title: `${snapshot.restaurant.name} · Waitlist`,
    description: `Join the waitlist at ${snapshot.restaurant.name}. See the live wait, your place in line, and get seated without the guesswork.`,
  };
}

export default async function DinerPage() {
  const snapshot = await getPublicSnapshot();
  const { restaurant } = snapshot;
  const paused = restaurant.waitlistStatus === "paused";
  const closed = restaurant.waitlistStatus === "closed";
  const disabled = paused || closed;
  const today = formatDayLong(dayInTz(new Date(), restaurant.timezone));
  const instagram = restaurant.instagram?.replace(/^@/, "");
  const statusLabel = paused ? "Waitlist paused" : closed ? "Waitlist closed" : snapshot.isOpenNow ? "Open now" : "Closed now";
  const statusTone = paused
    ? "status-waiting"
    : closed
      ? "status-muted"
      : snapshot.isOpenNow
        ? "status-seated"
        : "status-muted";

  return (
    <main className="paper grain min-h-[100dvh] overflow-x-clip">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <span className={`pill ${statusTone} hidden sm:inline-flex`}>
            {statusTone === "status-seated" && <span className="live-dot" />}
            {statusLabel}
          </span>
          <Link href="/login" className="btn btn-ghost btn-sm">
            Staff sign in
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-14 pt-4 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:pt-10">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`pill ${statusTone} sm:hidden`}>
              {statusTone === "status-seated" && <span className="live-dot" />}
              {statusLabel}
            </span>
            <p className="eyebrow text-clay">{restaurant.tagline ?? "Neighbourhood dining"}</p>
          </div>

          <h1 className="display mt-4 text-[clamp(3.4rem,9vw,5.6rem)] text-ink">
            {restaurant.name}
          </h1>

          <p className="mt-6 max-w-lg text-[1.0625rem] leading-relaxed text-muted text-pretty">
            Seasonal plates and slow evenings in Senopati. Put your name down from your phone, keep your
            evening moving, and we&apos;ll call you when your table is ready.
          </p>

          <div className="mt-7 flex flex-col gap-2.5 text-sm text-ink/75">
            {restaurant.address && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(restaurant.address)}`}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex w-fit items-center gap-2.5 transition hover:text-clay"
              >
                <MapPin className="size-4 text-clay" />
                {restaurant.address}
                <ArrowUpRight className="size-3 opacity-0 transition group-hover:opacity-100" />
              </a>
            )}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="inline-flex items-center gap-2.5">
                <Clock3 className="size-4 text-clay" />
                {restaurant.openTime}–{restaurant.closeTime} · {today}
              </span>
              {restaurant.phone && (
                <a href={`tel:${restaurant.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2.5 hover:text-clay">
                  <Phone className="size-4 text-clay" />
                  {restaurant.phone}
                </a>
              )}
              {instagram && (
                <a
                  href={`https://instagram.com/${instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2.5 hover:text-clay"
                >
                  <AtSign className="size-4 text-clay" />
                  @{instagram}
                </a>
              )}
            </div>
          </div>

          <div className="mt-10 grid max-w-md grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-white/60 py-4 backdrop-blur-sm">
            <div className="px-4">
              <p className="stat-number text-4xl">{String(snapshot.waiting).padStart(2, "0")}</p>
              <p className="mt-2 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted">
                parties waiting
              </p>
            </div>
            <div className="px-4">
              <p className="stat-number text-4xl">{String(snapshot.availableTables).padStart(2, "0")}</p>
              <p className="mt-2 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted">
                tables free
              </p>
            </div>
            <div className="px-4">
              <p className="stat-number text-4xl">
                {snapshot.typicalWaitMinutes ? `${snapshot.typicalWaitMinutes}m` : "—"}
              </p>
              <p className="mt-2 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted">
                typical wait
              </p>
            </div>
          </div>

          <div className="mt-12 hidden max-w-xl lg:block">
            <TableArt />
          </div>
        </div>

        <div className="relative lg:pt-3">
          <div className="absolute inset-x-3 -top-2 h-20 rotate-[-1.4deg] rounded-3xl border border-line/70 bg-cream/70" aria-hidden="true" />
          <div className="relative rounded-[1.6rem] border border-line bg-white p-5 shadow-lift sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow text-clay">Walk-in waitlist</p>
                <h2 className="mt-1.5 font-display text-[2rem] leading-none tracking-tight">Get in line</h2>
              </div>
              <span className="pill status-muted whitespace-nowrap">{snapshot.lastCalledCode ? `Now serving ${snapshot.lastCalledCode}` : "Just opened"}</span>
            </div>

            {restaurant.announcement && (
              <div className="mt-4 rounded-xl border border-line/80 bg-cream/55 px-3.5 py-3 text-[0.8125rem] leading-relaxed text-ink/75">
                {restaurant.announcement}
              </div>
            )}

            <MyTicketBanner />

            <JoinForm
              maxPartySize={restaurant.maxPartySize}
              disabled={disabled}
              disabledTitle={paused ? "The waitlist is paused" : "The waitlist is closed"}
              disabledNote={
                paused
                  ? restaurant.pauseReason ?? "The host will reopen it shortly. Please see the host stand when you arrive."
                  : "We're not taking new parties right now. Please ask the host — we may still have room."
              }
              estimateMinutes={snapshot.typicalWaitMinutes}
            />

            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-dashed border-line pt-4 text-xs leading-relaxed text-muted">
              <div>
                <p className="font-bold text-ink">We hold for {restaurant.holdMinutes} min</p>
                <p className="mt-0.5">Once called, you can tap “I&apos;m on my way” to extend.</p>
              </div>
              <div>
                <p className="font-bold text-ink">Leave any time</p>
                <p className="mt-0.5">Changed your mind? Release your place from your ticket.</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-line bg-white/50 px-4 py-3.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-clay-soft text-clay">
              <Smartphone className="size-4" />
            </span>
            <p className="text-xs leading-relaxed text-muted">
              Keep this page open to watch your place in line. No app download, no account.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-line/80 bg-cream/45">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-3 sm:px-8">
          {[
            {
              icon: Smartphone,
              step: "01",
              title: "Put your name down",
              body: "Pick your party size, add a name, and you're in. Takes about twenty seconds.",
            },
            {
              icon: Timer,
              step: "02",
              title: "Watch the line move",
              body: "Your ticket updates live with your place, an honest wait estimate, and the number being called.",
            },
            {
              icon: UtensilsCrossed,
              step: "03",
              title: "Walk in when called",
              body: `We hold your table for ${restaurant.holdMinutes} minutes so you're not sprinting from the car park.`,
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-line bg-white text-clay">
                <item.icon className="size-5" />
              </span>
              <div>
                <p className="eyebrow text-muted-soft">Step {item.step}</p>
                <h3 className="mt-1 font-display text-xl">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-3">
          <Logo compact />
          <span>
            AntriQ — fewer waits, better tables. Demo restaurant: {restaurant.name}.
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hover:text-ink">Host stand</Link>
          <Link href="/login" className="hover:text-ink">Owner dashboard</Link>
          <span className="hidden sm:inline">© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </main>
  );
}
