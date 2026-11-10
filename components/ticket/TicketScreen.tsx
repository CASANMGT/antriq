"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Copy,
  MapPin,
  Phone,
  Star,
  Ticket,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Mascot } from "@/components/Mascot";
import { LanguageToggle } from "@/components/LanguageToggle";
import { NotificationPrompt } from "@/components/Notifications";
import { HoldRing } from "@/components/Countdown";
import { Notice, type NoticeState } from "@/components/Notice";
import { Modal } from "@/components/Modal";
import { useLang } from "@/components/LanguageProvider";
import { postJson } from "@/lib/client-api";
import { notify } from "@/lib/notify";
import { formatDayLong } from "@/lib/time";
import { format } from "@/lib/i18n";import { APP_VERSION } from "@/lib/version";
import type { TicketView } from "@/lib/types";

const FINAL_STATUSES = new Set(["completed", "no_show", "cancelled"]);
const RATEABLE_STATUSES = new Set(["seated", "completed", "cancelled", "no_show"]);

export function TicketScreen({ token, initial }: { token: string; initial: TicketView }) {
  const router = useRouter();
  const { lang, t } = useLang();
  const [view, setView] = useState(initial);
  const [gone, setGone] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(initial.entry.rating ?? 0);
  const [ratingNote, setRatingNote] = useState(initial.entry.ratingNote ?? "");
  const [pending, startTransition] = useTransition();
  const previousStatus = useRef(initial.entry.status);
  const previousCallCount = useRef(initial.entry.calledCount);

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
    const callCount = view.entry.calledCount;
    const recalled = status === "called" && callCount > previousCallCount.current;
    if (status === "called" && (previousStatus.current !== "called" || recalled)) {
      try {
        navigator.vibrate?.([180, 90, 180]);
      } catch {
        // Vibration is a bonus, never a requirement.
      }
      if (document.hidden) {
        void notify(
          t.ticket.calledTitle,
          format(t.ticket.calledBody, { code: view.entry.code }),
          typeof window !== "undefined" ? window.location.href : "/",
        );
      } else if (recalled) {
        show(t.ticket.recalledToast, "info");
      }
    }
    previousStatus.current = status;
    previousCallCount.current = callCount;

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
  }, [show, t.ticket.calledBody, t.ticket.calledTitle, t.ticket.recalledToast, token, view.entry.calledCount, view.entry.code, view.entry.status]);

  useEffect(() => {
    if (view.entry.rating && selectedRating === 0) setSelectedRating(view.entry.rating);
  }, [selectedRating, view.entry.rating]);

  function onCancel() {
    setConfirmOpen(false);
    startTransition(async () => {
      const result = await postJson(`/api/ticket/${token}/action`, { action: "cancel" });
      if (result.ok) {
        show(t.ticket.toastReleased, "success");
        try {
          window.localStorage.removeItem("antriq:ticket");
        } catch {
          // Ignore.
        }
        await refresh();
      } else {
        show(t.ticket.toastReleaseError, "error");
      }
    });
  }

  function onAcknowledge() {
    startTransition(async () => {
      const result = await postJson(`/api/ticket/${token}/action`, { action: "acknowledge" });
      show(result.ok ? t.ticket.toastAck : t.ticket.toastAckError, result.ok ? "success" : "error");
      await refresh();
    });
  }

  function onResetDevice() {
    setResetOpen(false);
    startTransition(async () => {
      const result = await postJson(`/api/ticket/${token}/action`, { action: "resetDevice" });
      if (!result.ok) {
        show(t.ticket.resetDeviceError, "error");
        return;
      }
      try {
        window.localStorage.removeItem("antriq:ticket");
      } catch {
        // Ignore storage failures.
      }
      router.push("/");
    });
  }

  function onRate() {
    if (!selectedRating) return;
    startTransition(async () => {
      const result = await postJson(`/api/ticket/${token}/action`, {
        action: "rate",
        rating: selectedRating,
        note: ratingNote.trim(),
      });
      show(result.ok ? t.ticket.ratingThanks : t.ticket.ratingError, result.ok ? "success" : "error");
      await refresh();
    });
  }

  if (gone) {
    return (
      <main className="paper grain grid min-h-[100dvh] place-items-center px-5">
        <div className="w-full max-w-sm text-center">
          <Logo />
          <Mascot mood="sleep" className="mx-auto mt-6 w-40" />
          <h1 className="mt-4 font-display text-4xl">{t.ticket.notFoundTitle}</h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-muted">{t.ticket.notFoundBody}</p>
          <Link href="/" className="btn btn-primary mt-6">
            {t.ticket.backRestaurant} <ArrowRight className="size-4" />
          </Link>
        </div>
      </main>
    );
  }

  const { branch, brand, entry } = view;
  const homeHref = brand ? `/b/${brand.slug}/${branch.slug}` : "/";
  const meta = headerMeta(entry.status, t);
  const locale = lang === "id" ? "id-ID" : "en-GB";
  const mapsHref = branch.address
    ? `https://maps.google.com/?q=${encodeURIComponent(branch.address)}`
    : null;

  const progress =
    view.position && view.waitingCount > 0
      ? Math.min(100, Math.max(10, Math.round(((view.waitingCount - view.position + 1) / view.waitingCount) * 100)))
      : 0;

  return (
    <main className="paper grain min-h-[100dvh] px-4 pb-10 pt-4 sm:px-5 sm:pt-6">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-2">
        <Logo href={homeHref} />
        <div className="flex items-center gap-1.5">
          <LanguageToggle compact />
          <Link href={homeHref} className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink">
            <ArrowLeft className="size-3.5" /> {t.ticket.back}
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-6 w-full max-w-md px-1">
        <div className="mb-3 flex items-center justify-between px-1">
          <p className="eyebrow text-tomato">{t.ticket.kicker}</p>
          <span className="inline-flex items-center gap-1.5 text-[0.6875rem] font-bold text-muted">
            <span className="live-dot" /> {t.ticket.liveUpdates}
          </span>
        </div>

        <div className="ticket overflow-hidden animate-rise">
          <div className={`${meta.header} px-6 pb-7 pt-6 text-white`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                {brand?.hasLogo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/brands/${brand.id}/logo`}
                    alt={`${brand.name} logo`}
                    className="size-20 shrink-0 rounded-full border-2 border-white/70 bg-paper object-contain"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-[0.6875rem] font-extrabold uppercase tracking-[0.16em] text-white/65">
                    {branch.name}
                  </p>
                  <p className="mt-1 text-sm font-bold text-white/90">{meta.kicker}</p>
                </div>
              </div>
              <span className="pill shrink-0 bg-white/20 text-white">{meta.label}</span>
            </div>

            <div className="mt-6 flex items-end justify-between gap-4">
              <p className="display text-[4.6rem] leading-[0.8] tracking-[-0.04em]">{entry.code}</p>
              <div className="pb-1 text-right text-xs font-semibold leading-relaxed text-white/75">
                <p className="font-extrabold text-white">
                  {entry.partySize} {t.guest.guestUnit}
                </p>
                <p>{formatDayLong(entry.day, locale)}</p>
              </div>
            </div>
          </div>

          <div className="relative h-7 bg-[#FFFDF7]">
            <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-ink/25" />
            <div className="absolute -left-3 top-1/2 size-6 -translate-y-1/2 rounded-full border-2 border-ink bg-paper" />
            <div className="absolute -right-3 top-1/2 size-6 -translate-y-1/2 rounded-full border-2 border-ink bg-paper" />
          </div>

          <div className="bg-[#FFFDF7] px-6 pb-7 pt-3" aria-live="polite">
            <div className="mb-4 grid grid-cols-2 gap-2">
              <div className="min-w-0 rounded-xl border-2 border-ink/15 bg-white px-3 py-2.5">
                <p className="text-[0.5625rem] font-extrabold uppercase tracking-[0.12em] text-ink/45">
                  {t.ticket.guestNameLabel}
                </p>
                <p className="mt-0.5 break-words text-sm font-extrabold">{entry.guestName}</p>
              </div>
              <div className="min-w-0 rounded-xl border-2 border-ink/15 bg-white px-3 py-2.5">
                <p className="text-[0.5625rem] font-extrabold uppercase tracking-[0.12em] text-ink/45">
                  {t.ticket.phoneLabel}
                </p>
                <p className="num mt-0.5 break-all text-sm font-extrabold">{entry.phone ?? "—"}</p>
              </div>
            </div>

            {entry.status === "waiting" && (
              <div>
                <p className="eyebrow text-ink/50">{t.ticket.placeLabel}</p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <div className="flex items-end gap-3">
                    <span className="stat-number text-[5.7rem] text-tomato">#{view.position ?? "—"}</span>
                    <span className="mb-3 text-sm font-bold text-muted">
                      {format(t.ticket.ofParties, { count: view.waitingCount })}
                    </span>
                  </div>
                  <Mascot mood="ticket" className="w-24 shrink-0" title="AntriQ ticket mascot" />
                </div>

                <p className="mt-4 text-sm font-semibold leading-relaxed text-ink/75">
                  {view.peopleAhead === 0
                    ? t.ticket.youAreNext
                    : view.peopleAhead === 1
                      ? t.ticket.aheadSingular
                      : format(t.ticket.aheadPlural, { count: view.peopleAhead ?? 0 })}
                </p>

                <div className="mt-4 h-3 overflow-hidden rounded-full border-2 border-ink bg-cream">
                  <div
                    className="h-full rounded-full bg-tomato transition-[width] duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border-2 border-ink bg-cream px-3 py-3">
                    <p className="text-[0.625rem] font-extrabold uppercase tracking-[0.12em] text-ink/55">
                      {t.ticket.nowServing}
                    </p>
                    <p className="num mt-1 font-display text-2xl font-semibold">{view.lastCalledCode ?? "—"}</p>
                  </div>
                  <div className="rounded-xl border-2 border-ink bg-white px-3 py-3">
                    <p className="text-[0.625rem] font-extrabold uppercase tracking-[0.12em] text-ink/55">
                      {t.ticket.yourQueue}
                    </p>
                    <p className="num mt-1 font-display text-2xl font-semibold">
                      {branch.queueMode === "single" ? "1" : entry.category}
                    </p>
                    <p className="text-[0.625rem] font-bold text-muted">
                      {branch.queueMode === "single"
                        ? t.guest.queueSingleShort
                        : entry.category === "A"
                          ? t.ticket.queueA
                          : t.ticket.queueB}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-2.5 rounded-xl border-2 border-ink/15 bg-pink-soft px-3.5 py-3 text-xs font-semibold leading-relaxed text-ink/70">
                  <Ticket className="mt-0.5 size-3.5 shrink-0 text-tomato" />
                  <span>{t.ticket.queueKeepOpen}</span>
                </div>

                <NotificationPrompt variant="banner" />

                <div className="mt-5 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-muted hover:text-tomato-dark"
                    onClick={() => setConfirmOpen(true)}
                    disabled={pending}
                  >
                    {t.ticket.release}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-muted"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(`${window.location.origin}/t/${token}`);
                        show(t.ticket.copied, "success");
                      } catch {
                        show(t.ticket.copyHint, "info");
                      }
                    }}
                  >
                    <Copy className="size-3.5" /> {t.ticket.copyLink}
                  </button>
                </div>
              </div>
            )}

            {entry.status === "called" && (
              <div>
                <div className="flex items-center gap-3">
                  <Mascot mood="celebrate" className="w-28 shrink-0" />
                  <div>
                    <p className="eyebrow text-tomato">{t.ticket.calledKicker}</p>
                    <h1 className="mt-1 font-display text-[2.5rem] leading-[0.9] tracking-tight">
                      {t.ticket.calledTitle}
                    </h1>
                  </div>
                </div>

                <p className="mt-4 text-sm font-semibold leading-relaxed text-ink/75">
                  {format(t.ticket.calledBody, { code: entry.code })}
                </p>

                {branch.holdEnabled && (
                  <div
                    className={`mt-4 flex items-center gap-3 rounded-xl border-2 border-ink px-4 py-3 ${
                      entry.countdownPaused ? "bg-leaf-soft" : "bg-cream"
                    }`}
                  >
                    {entry.countdownPaused ? (
                      <span className="grid size-16 shrink-0 place-items-center rounded-full border-2 border-ink bg-white text-leaf-dark">
                        <Check className="size-6" />
                      </span>
                    ) : (
                      <HoldRing seconds={entry.holdSecondsLeft} total={Math.max(1, branch.holdMinutes * 60)} />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-ink/55">
                        {entry.countdownPaused
                          ? t.ticket.countdownPausedTitle
                          : entry.acknowledged
                            ? t.ticket.countdownExtendedTitle
                            : t.ticket.countdownTitle}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold leading-relaxed text-ink/75">
                        {entry.countdownPaused
                          ? t.ticket.countdownPausedBody
                          : entry.acknowledged
                            ? format(t.ticket.countdownExtendedBody, { minutes: branch.acknowledgeMinutes })
                            : branch.acknowledgeEnabled
                              ? format(t.ticket.countdownBody, { minutes: branch.holdMinutes })
                              : format(t.ticket.countdownBodyDisabled, { minutes: branch.holdMinutes })}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted">{t.ticket.notifyHint}</span>
                  <NotificationPrompt />
                </div>

                <div className="mt-4 rounded-xl border-2 border-ink bg-pink px-4 py-3">
                  <p className="text-xs font-bold leading-relaxed text-tomato-dark">
                    {entry.acknowledged ? t.ticket.acknowledged : t.ticket.calledNote}
                  </p>
                </div>

                {!entry.acknowledged && branch.holdEnabled && branch.acknowledgeEnabled && (
                  <button type="button" className="btn btn-sage btn-lg mt-4 w-full" onClick={onAcknowledge} disabled={pending}>
                    <Check className="size-4" /> {t.ticket.onMyWay}
                  </button>
                )}

                {mapsHref && (
                  <a href={mapsHref} target="_blank" rel="noreferrer" className="btn btn-outline mt-2 w-full">
                    <MapPin className="size-4" /> {t.ticket.directions}
                  </a>
                )}

                <div className="mt-5 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-muted hover:text-tomato-dark"
                    onClick={() => setConfirmOpen(true)}
                    disabled={pending}
                  >
                    {t.ticket.releaseTable}
                  </button>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
                    <span className="live-dot" /> {t.ticket.waitingForYou}
                  </span>
                </div>
              </div>
            )}

            {entry.status === "seated" && (
              <div className="text-center">
                <Mascot mood="happy" className="mx-auto w-36" />
                <p className="eyebrow mt-2 text-leaf-dark">{t.ticket.seated}</p>
                <h1 className="mt-1 font-display text-4xl">
                  {entry.tableLabel
                    ? entry.seatNumber !== null
                      ? format(t.ticket.seatedAtSeat, { table: entry.tableLabel, seat: entry.seatNumber })
                      : format(t.ticket.seatedAt, { table: entry.tableLabel })
                    : t.ticket.seatedTitle}
                </h1>
                <p className="mx-auto mt-3 max-w-xs text-sm font-medium leading-relaxed text-muted">
                  {t.ticket.seatedBody}
                </p>
                <button type="button" className="btn btn-outline mt-5" onClick={() => setResetOpen(true)} disabled={pending}>
                  {t.ticket.resetDevice} <ArrowRight className="size-4" />
                </button>
              </div>
            )}

            {entry.status === "completed" && (
              <div className="text-center">
                <Mascot mood="happy" className="mx-auto w-36" />
                <p className="eyebrow mt-2 text-ink/50">{t.ticket.completed}</p>
                <h1 className="mt-1 font-display text-4xl">{t.ticket.completedTitle}</h1>
                <p className="mx-auto mt-3 max-w-xs text-sm font-medium leading-relaxed text-muted">
                  {t.ticket.completedBody}
                </p>
                <Link href={homeHref} className="btn btn-outline mt-5">
                  {t.ticket.backRestaurant}
                </Link>
              </div>
            )}

            {entry.status === "no_show" && (
              <div className="text-center">
                <Mascot mood="sleep" className="mx-auto w-36" />
                <p className="eyebrow mt-2 text-ink/50">{t.ticket.noShow}</p>
                <h1 className="mt-1 font-display text-4xl">{t.ticket.noShowTitle}</h1>
                <p className="mx-auto mt-3 max-w-xs text-sm font-medium leading-relaxed text-muted">
                  {t.ticket.noShowBody}
                </p>
                <Link href={homeHref} className="btn btn-primary mt-5">
                  {t.ticket.rejoin} <ArrowRight className="size-4" />
                </Link>
              </div>
            )}

            {entry.status === "cancelled" && (
              <div className="text-center">
                <Mascot mood="calm" className="mx-auto w-36" />
                <p className="eyebrow mt-2 text-ink/50">{t.ticket.cancelled}</p>
                <h1 className="mt-1 font-display text-4xl">{t.ticket.cancelledTitle}</h1>
                <p className="mx-auto mt-3 max-w-xs text-sm font-medium leading-relaxed text-muted">
                  {t.ticket.cancelledBody}
                </p>
                <Link href={homeHref} className="btn btn-primary mt-5">
                  {t.ticket.rejoin} <ArrowRight className="size-4" />
                </Link>
              </div>
            )}

            {RATEABLE_STATUSES.has(entry.status) && (
              <div className="mt-5 rounded-xl border-2 border-ink bg-cream px-4 py-4 text-center">
                <p className="eyebrow text-tomato">{t.ticket.ratingTitle}</p>
                <p className="mx-auto mt-1 max-w-xs text-xs font-semibold leading-relaxed text-muted">
                  {entry.rating ? format(t.ticket.ratingAlready, { rating: entry.rating }) : t.ticket.ratingBody}
                </p>
                <div className="mt-3 flex items-center justify-center gap-1.5" role="radiogroup" aria-label={t.ticket.ratingTitle}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      role="radio"
                      aria-checked={selectedRating === star}
                      aria-label={t.ticket.ratingStars[star - 1]}
                      onClick={() => setSelectedRating(star)}
                      className="rounded-lg p-0.5 transition hover:scale-110"
                    >
                      <Star
                        className={`size-7 ${star <= selectedRating ? "text-gold" : "text-ink/25"}`}
                        fill={star <= selectedRating ? "currentColor" : "none"}
                      />
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[0.6875rem] font-extrabold uppercase tracking-[0.12em] text-ink/55">
                  {selectedRating ? t.ticket.ratingStars[selectedRating - 1] : " "}
                </p>
                <input
                  className="input mt-3 text-left text-sm"
                  value={ratingNote}
                  onChange={(event) => setRatingNote(event.target.value.slice(0, 300))}
                  placeholder={t.ticket.ratingNotePlaceholder}
                  maxLength={300}
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm mt-2 w-full"
                  onClick={onRate}
                  disabled={!selectedRating || pending}
                >
                  {t.ticket.ratingSubmit}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 px-1 text-xs font-semibold text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="size-3.5" /> {branch.openTime}–{branch.closeTime}
          </span>
          {branch.phone ? (
            <a href={`tel:${branch.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-ink">
              <Phone className="size-3.5" /> {branch.phone}
            </a>
          ) : (
            <span>{branch.name}</span>
          )}
        </div>

        <p className="mt-6 text-center text-[0.6875rem] font-semibold leading-relaxed text-muted-soft">
          {t.ticket.footerNote} ·{" "}
          <Link href="/changelog" className="underline decoration-dotted underline-offset-2 hover:text-muted">
            v{APP_VERSION}
          </Link>
        </p>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t.ticket.releaseTitle}
        description={entry.status === "called" ? t.ticket.releaseCalledDesc : t.ticket.releaseWaitingDesc}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmOpen(false)}>
              {t.ticket.keepTicket}
            </button>
            <button type="button" className="btn btn-danger" onClick={onCancel} disabled={pending}>
              {pending ? t.ticket.releasing : t.ticket.releaseConfirm}
            </button>
          </>
        }
      >
        <div className="rounded-xl border-2 border-ink bg-cream px-4 py-3">
          <p className="text-xs font-bold text-muted">{t.ticket.ticketLabel}</p>
          <p className="num mt-0.5 text-lg font-extrabold">
            {entry.code} · {entry.partySize} {t.guest.guestUnit}
          </p>
        </div>
      </Modal>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title={t.ticket.resetDeviceTitle}
        description={t.ticket.resetDeviceBody}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setResetOpen(false)}>
              {t.ticket.keepTicket}
            </button>
            <button type="button" className="btn btn-danger" onClick={onResetDevice} disabled={pending}>
              {pending ? t.ticket.releasing : t.ticket.resetDeviceConfirm}
            </button>
          </>
        }
      >
        <div className="rounded-xl border-2 border-ink bg-cream px-4 py-3">
          <p className="text-xs font-bold text-muted">{t.ticket.ticketLabel}</p>
          <p className="num mt-0.5 text-lg font-extrabold">
            {entry.code} · {entry.partySize} {t.guest.guestUnit}
          </p>
        </div>
      </Modal>

      <Notice notice={notice} onClose={() => setNotice(null)} />
    </main>
  );
}

function headerMeta(status: TicketView["entry"]["status"], t: ReturnType<typeof useLang>["t"]) {
  switch (status) {
    case "called":
      return { label: t.ticket.called, kicker: t.ticket.calledKicker, header: "bg-tomato" };
    case "seated":
      return { label: t.ticket.seated, kicker: t.ticket.seated, header: "bg-leaf" };
    case "completed":
      return { label: t.ticket.completed, kicker: t.ticket.completed, header: "bg-ink" };
    case "no_show":
      return { label: t.ticket.noShow, kicker: t.ticket.noShow, header: "bg-ink-soft" };
    case "cancelled":
      return { label: t.ticket.cancelled, kicker: t.ticket.cancelled, header: "bg-ink-soft" };
    default:
      return { label: t.ticket.waiting, kicker: t.ticket.waitingKicker, header: "bg-ink" };
  }
}
