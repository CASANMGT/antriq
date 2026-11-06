"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Copy,
  MapPin,
  Phone,
  Timer,
  UtensilsCrossed,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Notice, type NoticeState } from "@/components/Notice";
import { Modal } from "@/components/Modal";
import { Countdown, HoldRing } from "@/components/Countdown";
import { postJson } from "@/lib/client-api";
import { clockInTz, formatDayLong } from "@/lib/time";
import type { TicketView } from "@/lib/types";

const FINAL_STATUSES = new Set(["completed", "no_show", "cancelled"]);

export function TicketScreen({ token, initial }: { token: string; initial: TicketView }) {
  const [view, setView] = useState(initial);
  const [gone, setGone] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const previousStatus = useRef(initial.entry.status);

  const show = useCallback((message: string, tone: NoticeState["tone"]) => {
    setNotice({ message, tone });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/ticket/${token}`, { cache: "no-store" });
      if (response.status === 404) {
        setGone(true);
        return;
      }
      if (!response.ok) return;
      const next = (await response.json()) as TicketView;
      setView(next);
    } catch {
      // Offline or transient network error: keep the last known ticket.
    }
  }, [token]);

  useEffect(() => {
    const timer = window.setInterval(refresh, 4000);
    const onVisible = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  useEffect(() => {
    const status = view.entry.status;
    if (status === "called" && previousStatus.current !== "called") {
      try {
        navigator.vibrate?.([180, 90, 180]);
      } catch {
        // Vibration is a bonus, never a requirement.
      }
    }
    previousStatus.current = status;

    if (FINAL_STATUSES.has(status)) {
      try {
        const raw = window.localStorage.getItem("antriq:ticket");
        if (raw) {
          const parsed = JSON.parse(raw) as { token?: string };
          if (parsed.token === token) window.localStorage.removeItem("antriq:ticket");
        }
      } catch {
        // Ignore storage failures.
      }
    }
  }, [token, view.entry.status]);

  function onCancel() {
    setConfirmOpen(false);
    startTransition(async () => {
      const result = await postJson(`/api/ticket/${token}/action`, { action: "cancel" });
      if (result.ok) {
        show(result.message ?? "Your place has been released.", "success");
        try {
          window.localStorage.removeItem("antriq:ticket");
        } catch {
          // Ignore.
        }
        await refresh();
      } else {
        show(result.message ?? "Could not release this ticket.", "error");
      }
    });
  }

  function onAcknowledge() {
    startTransition(async () => {
      const result = await postJson(`/api/ticket/${token}/action`, { action: "acknowledge" });
      show(
        result.message ?? (result.ok ? "We'll hold your table." : "Could not update your ticket."),
        result.ok ? "success" : "error",
      );
      await refresh();
    });
  }

  if (gone) {
    return (
      <main className="paper grain grid min-h-[100dvh] place-items-center px-5">
        <div className="w-full max-w-sm text-center">
          <Logo />
          <h1 className="mt-8 font-display text-4xl">Ticket not found</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            This link is no longer valid. If you&apos;re still waiting, please ask the host to check your name.
          </p>
          <Link href="/" className="btn btn-primary mt-6">
            Back to the restaurant <ArrowRight className="size-4" />
          </Link>
        </div>
      </main>
    );
  }

  const { restaurant, entry } = view;
  const meta = headerMeta(entry.status);
  const joined = clockInTz(entry.joinedAt, restaurant.timezone);
  const mapsHref = restaurant.address
    ? `https://maps.google.com/?q=${encodeURIComponent(restaurant.address)}`
    : null;

  const progress =
    view.position && view.waitingCount > 0
      ? Math.min(100, Math.max(8, Math.round(((view.waitingCount - view.position + 1) / view.waitingCount) * 100)))
      : 0;

  return (
    <main className="paper grain min-h-[100dvh] px-4 pb-10 pt-4 sm:px-5 sm:pt-6">
      <div className="mx-auto flex w-full max-w-md items-center justify-between">
        <Logo href="/" />
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink">
          <ArrowLeft className="size-3.5" /> Restaurant
        </Link>
      </div>

      <div className="mx-auto mt-7 w-full max-w-md px-1">
        <div className="mb-3 flex items-center justify-between px-1">
          <p className="eyebrow text-muted">Live waitlist ticket</p>
          <span className="inline-flex items-center gap-1.5 text-[0.6875rem] font-semibold text-muted">
            <span className="live-dot" /> updates live
          </span>
        </div>

        <div className="ticket overflow-hidden animate-rise">
          <div className={`${meta.header} px-6 pb-7 pt-6 text-white`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-white/60">
                  {restaurant.name}
                </p>
                <p className="mt-1 text-sm font-medium text-white/85">{meta.kicker}</p>
              </div>
              <span className="pill bg-white/15 text-white backdrop-blur-sm">{meta.label}</span>
            </div>

            <div className="mt-7 flex items-end justify-between gap-4">
              <p className="display text-[4.25rem] leading-[0.82] tracking-[-0.04em]">{entry.code}</p>
              <div className="pb-1 text-right text-xs leading-relaxed text-white/70">
                <p className="font-semibold text-white/90">
                  {entry.partySize} {entry.partySize === 1 ? "guest" : "guests"}
                </p>
                <p>{formatDayLong(entry.day)}</p>
                <p>joined {joined}</p>
              </div>
            </div>
          </div>

          <div className="relative h-7 bg-[#FFFDF8]">
            <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-line" />
            <div className="absolute -left-3 top-1/2 size-6 -translate-y-1/2 rounded-full border border-line bg-paper" />
            <div className="absolute -right-3 top-1/2 size-6 -translate-y-1/2 rounded-full border border-line bg-paper" />
          </div>

          <div className="bg-[#FFFDF8] px-6 pb-7 pt-2" aria-live="polite">
            {entry.status === "waiting" && (
              <div>
                <p className="eyebrow text-muted">Your place in line</p>
                <div className="mt-2 flex items-end gap-3">
                  <span className="stat-number text-[5.5rem] text-ink">#{view.position ?? "—"}</span>
                  <span className="mb-3 text-sm font-semibold text-muted">
                    of {view.waitingCount} {view.waitingCount === 1 ? "party" : "parties"}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-ink/75">
                  {view.peopleAhead === 0 ? (
                    <strong className="font-bold text-sage-dark">You&apos;re next. Stay close.</strong>
                  ) : (
                    <>
                      <strong className="font-bold text-ink">{view.peopleAhead}</strong>{" "}
                      {view.peopleAhead === 1 ? "party is" : "parties are"} ahead of you.
                    </>
                  )}{" "}
                  We estimate about <strong className="font-bold text-ink">{view.etaMinutes} min</strong>.
                </p>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-cream">
                  <div
                    className="h-full rounded-full bg-clay transition-[width] duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-line bg-white px-3 py-3">
                    <p className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted">Now serving</p>
                    <p className="num mt-1 text-lg font-extrabold">{view.lastCalledCode ?? "—"}</p>
                  </div>
                  <div className="rounded-xl border border-line bg-white px-3 py-3">
                    <p className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted">Tables free</p>
                    <p className="num mt-1 text-lg font-extrabold">{view.availableTables}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-cream/60 px-3.5 py-3 text-xs leading-relaxed text-muted">
                  <Timer className="mt-0.5 size-3.5 shrink-0 text-clay" />
                  <span>
                    Keep this page open. When we call you, we&apos;ll hold your table for{" "}
                    <strong className="text-ink">{restaurant.holdMinutes} minutes</strong>.
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-muted hover:text-clay-dark"
                    onClick={() => setConfirmOpen(true)}
                    disabled={pending}
                  >
                    Release my place
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-muted"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(`${window.location.origin}/t/${token}`);
                        show("Ticket link copied.", "success");
                      } catch {
                        show("Copy the address from your browser bar instead.", "info");
                      }
                    }}
                  >
                    <Copy className="size-3.5" /> Copy link
                  </button>
                </div>
              </div>
            )}

            {entry.status === "called" && (
              <div>
                <div className="flex items-center gap-4">
                  <HoldRing seconds={entry.holdSecondsLeft} total={restaurant.holdMinutes * 60} />
                  <div>
                    <p className="eyebrow text-clay">It&apos;s your turn</p>
                    <h1 className="mt-1 font-display text-[2.35rem] leading-[0.95] tracking-tight">
                      Your table is ready
                    </h1>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      Show <strong className="text-ink">{entry.code}</strong> to the host at the door.
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-clay/20 bg-clay-soft/60 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-clay-dark/70">Time left</p>
                  <p className="mt-1 text-2xl text-clay-dark">
                    <Countdown seconds={entry.holdSecondsLeft} />
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-clay-dark/80">
                    {entry.acknowledged
                      ? "We received your heads-up — the host will keep an eye out for you."
                      : "Running late? Tap below and we'll hold it a little longer."}
                  </p>
                </div>

                {!entry.acknowledged && (
                  <button
                    type="button"
                    className="btn btn-sage btn-lg mt-4 w-full"
                    onClick={onAcknowledge}
                    disabled={pending}
                  >
                    <Check className="size-4" /> I&apos;m on my way
                  </button>
                )}

                {mapsHref && (
                  <a href={mapsHref} target="_blank" rel="noreferrer" className="btn btn-outline mt-2 w-full">
                    <MapPin className="size-4" /> Get directions
                  </a>
                )}

                <div className="mt-5 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-muted hover:text-clay-dark"
                    onClick={() => setConfirmOpen(true)}
                    disabled={pending}
                  >
                    Release my table
                  </button>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                    <span className="live-dot" /> waiting for you
                  </span>
                </div>
              </div>
            )}

            {entry.status === "seated" && (
              <div className="text-center">
                <div className="mx-auto grid size-16 place-items-center rounded-full bg-sage-soft text-sage-dark">
                  <UtensilsCrossed className="size-7" />
                </div>
                <p className="eyebrow mt-4 text-sage">You&apos;re in</p>
                <h1 className="mt-1 font-display text-4xl">Seated at {entry.tableLabel ?? "your table"}</h1>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted">
                  Enjoy your evening. You waited {entry.waitMinutes} minutes — we&apos;ll take it from here.
                </p>
                {mapsHref && (
                  <a href={mapsHref} target="_blank" rel="noreferrer" className="btn btn-soft mt-5">
                    <MapPin className="size-4" /> Restaurant details
                  </a>
                )}
              </div>
            )}

            {entry.status === "completed" && (
              <div className="text-center">
                <div className="mx-auto grid size-16 place-items-center rounded-full bg-cream text-ink">
                  <Check className="size-7" />
                </div>
                <p className="eyebrow mt-4 text-muted">Visit complete</p>
                <h1 className="mt-1 font-display text-4xl">Thanks for dining with us</h1>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted">
                  We hope the evening was worth the wait. Come back soon — your next table is on us to earn.
                </p>
                <Link href="/" className="btn btn-outline mt-5">
                  Back to {restaurant.name}
                </Link>
              </div>
            )}

            {entry.status === "no_show" && (
              <div className="text-center">
                <p className="eyebrow text-muted">Hold expired</p>
                <h1 className="mt-2 font-display text-4xl">We missed you</h1>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted">
                  We held your table for {restaurant.holdMinutes} minutes, then had to pass it along. Still
                  hungry? You can rejoin the line.
                </p>
                <Link href="/" className="btn btn-clay mt-5">
                  Check the wait <ArrowRight className="size-4" />
                </Link>
              </div>
            )}

            {entry.status === "cancelled" && (
              <div className="text-center">
                <p className="eyebrow text-muted">Released</p>
                <h1 className="mt-2 font-display text-4xl">Your place was released</h1>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted">
                  No hard feelings. The line is still here whenever you&apos;re ready.
                </p>
                <Link href="/" className="btn btn-clay mt-5">
                  Join again <ArrowRight className="size-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 px-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="size-3.5" /> {restaurant.openTime}–{restaurant.closeTime}
          </span>
          {restaurant.phone ? (
            <a href={`tel:${restaurant.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-ink">
              <Phone className="size-3.5" /> {restaurant.phone}
            </a>
          ) : (
            <span>{restaurant.name}</span>
          )}
        </div>

        <p className="mt-6 text-center text-[0.6875rem] leading-relaxed text-muted-soft">
          This link is your ticket. Keep it handy and show it to the host if asked.
        </p>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Release your place?"
        description={
          entry.status === "called"
            ? "Your table is being held right now. Releasing it passes it to the next party."
            : "You'll lose your spot in line. You can rejoin whenever you like."
        }
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmOpen(false)}>
              Keep my ticket
            </button>
            <button type="button" className="btn btn-danger" onClick={onCancel} disabled={pending}>
              {pending ? "Releasing…" : "Release place"}
            </button>
          </>
        }
      >
        <div className="rounded-xl border border-line bg-white px-4 py-3">
          <p className="text-xs text-muted">Ticket</p>
          <p className="num mt-0.5 text-lg font-bold">
            {entry.code} · {entry.partySize} guests
          </p>
        </div>
      </Modal>

      <Notice notice={notice} onClose={() => setNotice(null)} />
    </main>
  );
}

function headerMeta(status: TicketView["entry"]["status"]) {
  switch (status) {
    case "called":
      return { label: "Table ready", kicker: "Your table is waiting", header: "bg-clay" };
    case "seated":
      return { label: "Seated", kicker: "Enjoy your evening", header: "bg-sage" };
    case "completed":
      return { label: "Complete", kicker: "Until next time", header: "bg-ink" };
    case "no_show":
      return { label: "Expired", kicker: "Hold released", header: "bg-ink-soft" };
    case "cancelled":
      return { label: "Cancelled", kicker: "Ticket closed", header: "bg-ink-soft" };
    default:
      return { label: "Waiting", kicker: "We'll call your name", header: "bg-ink" };
  }
}
