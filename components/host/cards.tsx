"use client";

import {
  BellRing,
  Check,
  ChevronRight,
  ClipboardList,
  Clock3,
  CornerUpLeft,
  MessageCircle,
  Phone,
  RotateCcw,
  Sparkles,
  Star,
  UserRound,
  Utensils,
} from "lucide-react";
import { TablePill } from "@/components/Pills";
import { Countdown } from "@/components/Countdown";
import { useLang } from "@/components/LanguageProvider";
import { format } from "@/lib/i18n";
import { clockInTz } from "@/lib/time";
import type { DiningTable, HostStats, QueueEntry } from "@/lib/types";

const sourceLabel: Record<string, string> = {
  qr: "QR",
  online: "Online",
  walkin: "Walk-in",
};

export function whatsappHref(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  const base = `https://wa.me/${normalized}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function StatsStrip({ stats, showTables = true }: { stats: HostStats; showTables?: boolean }) {
  const { t } = useLang();
  const items = [
    { label: t.host.waiting, value: stats.waiting, tone: "text-gold" },
    { label: t.host.atDoor, value: stats.called, tone: "text-tomato" },
    { label: t.host.seated, value: stats.seated, tone: "text-leaf-dark" },
    ...(showTables
      ? [{ label: t.host.tablesFreeLabel, value: `${stats.availableTables}/${stats.totalTables}`, tone: "text-ink" }]
      : []),
    { label: t.host.seatedToday, value: stats.seatedToday, tone: "text-ink" },
    { label: t.owner.noShows, value: stats.noShowToday, tone: "text-tomato-dark" },
  ];

  return (
    <div className={`grid grid-cols-3 border-t-2 border-ink bg-cream ${showTables ? "sm:grid-cols-6" : "sm:grid-cols-5"}`}>
      {items.map((item) => (
        <div key={item.label} className="border-b border-r border-ink/15 px-3 py-2.5 last:border-r-0 sm:border-b-0">
          <p className={`num font-display text-xl font-semibold leading-none ${item.tone}`}>{item.value}</p>
          <p className="mt-1 text-[0.5625rem] font-extrabold uppercase tracking-[0.1em] text-ink/55">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

export function QueueCard({
  entry,
  position,
  next,
  busy,
  branchName,
  onCall,
  onRecall,
  onSeat,
  onOpenSeat,
  onNoShow,
  onUndo,
  manualMode = false,
  showCategory = true,
  showCountdown = true,
  groupTone = null,
}: {
  entry: QueueEntry;
  position: number;
  next: boolean;
  busy: boolean;
  branchName: string;
  onCall: () => void;
  onRecall: () => void;
  onSeat: () => void;
  onOpenSeat: () => void;
  onNoShow: () => void;
  onUndo: () => void;
  manualMode?: boolean;
  showCategory?: boolean;
  showCountdown?: boolean;
  groupTone?: "A" | "B" | null;
}) {
  const { t } = useLang();
  const called = entry.status === "called";
  const rating = entry.rating;
  const waMessage = format(t.host.waCallMessage, {
    name: entry.guestName,
    code: entry.code,
    count: entry.partySize,
    branch: branchName,
  });

  return (
    <article
      className={`min-w-0 rounded-2xl border-2 border-ink p-3.5 shadow-[3px_3px_0_#262321] transition ${
        called ? "bg-pink-soft" : next ? "bg-white" : "bg-white/85"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="num rounded-md border-2 border-ink bg-ink px-1.5 py-0.5 text-[0.6875rem] font-extrabold tracking-wide text-paper">
              {entry.code}
            </span>
            {showCategory && (
              <span
                className={`pill border-2 border-ink/15 ${
                  groupTone === "B" ? "bg-gold-soft text-ink" : "bg-pink text-tomato-dark"
                }`}
                title={entry.category === "A" ? t.guest.queueA : t.guest.queueB}
              >
                {entry.category}
              </span>
            )}
            <span className="pill status-muted">{sourceLabel[entry.source] ?? entry.source}</span>
            {entry.visitNumber > 1 && (
              <span className="pill status-waiting">
                {format(t.common.visitNumber, { count: entry.visitNumber })}
              </span>
            )}
            {next && !called && (
              <span className="pill bg-tomato text-white">
                <ClipboardList className="size-3" /> {t.host.nextUp}
              </span>
            )}
            {called && entry.acknowledged && (
              <span className="pill status-seated">
                <Check className="size-3" /> {t.host.onTheWay}
              </span>
            )}
          </div>
          <div className="mt-2 flex min-w-0 items-center gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-ink bg-cream font-display text-xs font-semibold">
              {position}
            </span>
            <h3 className="min-w-0 truncate font-display text-[1.45rem] leading-tight tracking-tight">
              {entry.guestName}
            </h3>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pl-9 text-xs font-semibold text-muted">
            <span className="text-ink/75">
              {entry.partySize} {t.guest.guestUnit}
            </span>
            <span className="inline-flex items-center gap-1 text-ink/70">
              <Clock3 className="size-3" />
              {format(t.host.waitingFor, { minutes: Math.max(1, entry.waitMinutes) })}
            </span>
            {entry.phone && (
              <>
                <a href={`tel:${entry.phone}`} className="inline-flex items-center gap-1 hover:text-ink">
                  <Phone className="size-3" />
                  {entry.phone}
                </a>
                {called && (
                  <a
                    href={whatsappHref(entry.phone, waMessage)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border-2 border-leaf/40 bg-leaf-soft px-2 py-0.5 font-extrabold text-leaf-dark hover:border-leaf"
                  >
                    <MessageCircle className="size-3" /> WA
                  </a>
                )}
              </>
            )}
          </div>
          {called && showCountdown && (
            <div
              className={`mt-2 flex items-center justify-between gap-2 rounded-lg border-2 px-2.5 py-1.5 text-xs font-bold ${
                entry.countdownPaused
                  ? "border-leaf/40 bg-leaf-soft text-leaf-dark"
                  : entry.holdSecondsLeft <= 60
                    ? "border-tomato/40 bg-pink text-tomato-dark"
                    : "border-ink/15 bg-cream text-ink/70"
              }`}
            >
              <span>{entry.countdownPaused ? t.host.countdownPaused : t.host.callCountdown}</span>
              {entry.countdownPaused ? (
                <span>{t.host.onTheWay}</span>
              ) : (
                <Countdown seconds={entry.holdSecondsLeft} />
              )}
            </div>
          )}
          {entry.notes && (
            <p className="mt-2 rounded-lg bg-cream px-2 py-1.5 text-xs font-medium leading-relaxed text-ink/70">
              {entry.notes}
            </p>
          )}
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-cream text-ink/60">
          <UserRound className="size-4" />
        </span>
      </div>

      {rating !== null && (
        <div className="mt-2 rounded-lg border-2 border-ink/10 bg-white/70 px-2 py-1.5">
          <div className="flex items-center gap-0.5 text-gold">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="size-3" fill={star <= rating ? "currentColor" : "none"} />
            ))}
            <span className="ml-1 text-[0.625rem] font-bold text-ink/60">{rating}/5</span>
          </div>
          {entry.ratingNote && (
            <p className="mt-0.5 text-[0.6875rem] font-medium italic text-muted">“{entry.ratingNote}”</p>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5 border-t-2 border-dashed border-ink/15 pt-2.5">
        {!called && (
          <>
            <button
              type="button"
              className={`btn btn-sm ${groupTone === "B" ? "btn-gold" : "btn-primary"}`}
              onClick={onCall}
              disabled={busy}
            >
              <BellRing className="size-3.5" /> {t.host.call}
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={onSeat} disabled={busy}>
              <Utensils className="size-3.5" /> {t.host.seat}
            </button>
            {!manualMode && (
              <button type="button" className="btn btn-ghost btn-sm text-muted" onClick={onOpenSeat} disabled={busy}>
                <Sparkles className="size-3.5" /> {t.host.openSeat}
              </button>
            )}
          </>
        )}
        {called && (
          <>
            <button
              type="button"
              className={`btn btn-sm ${groupTone === "B" ? "btn-gold" : "btn-soft"}`}
              onClick={onRecall}
              disabled={busy}
            >
              <BellRing className="size-3.5" /> {t.host.callAgain}
            </button>
            <button type="button" className="btn btn-sage btn-sm" onClick={onSeat} disabled={busy}>
              <Utensils className="size-3.5" /> {t.host.seat}
            </button>
            {!manualMode && (
              <button type="button" className="btn btn-soft btn-sm" onClick={onOpenSeat} disabled={busy}>
                <Sparkles className="size-3.5" /> {t.host.openSeat}
              </button>
            )}
            <button type="button" className="btn btn-ghost btn-sm text-muted" onClick={onNoShow} disabled={busy}>
              {t.host.noShow}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm ml-auto text-muted"
              onClick={onUndo}
              disabled={busy}
              title={t.host.undo}
            >
              <CornerUpLeft className="size-3.5" /> {t.host.undo}
            </button>
          </>
        )}
      </div>
    </article>
  );
}

export function TableCard({
  table,
  entry,
  busy,
  onClear,
  onReady,
  onBlock,
}: {
  table: DiningTable;
  entry: QueueEntry | null;
  busy: boolean;
  onClear: () => void;
  onReady: () => void;
  onBlock: () => void;
}) {
  const { t } = useLang();
  const tint =
    table.status === "seated"
      ? "bg-pink-soft"
      : table.status === "dirty"
        ? "bg-cream"
        : table.status === "blocked"
          ? "bg-[#EFE8DA]"
          : "bg-white";

  return (
    <div className={`rounded-xl border-2 border-ink p-2.5 shadow-[2px_2px_0_#262321] ${tint}`}>
      <div className="flex items-start justify-between gap-1">
        <span className="num font-display text-base font-semibold">{table.label}</span>
        <TablePill status={table.status} />
      </div>
      <p className="mt-0.5 text-[0.625rem] font-semibold text-ink/50">
        {table.capacity} {t.owner.seats}
      </p>
      {entry ? (
        <div className="mt-1.5 min-w-0">
          <p className="truncate text-xs font-extrabold">{entry.guestName}</p>
          <p className="text-[0.625rem] font-semibold text-muted">
            {entry.code} · {entry.partySize} {t.guest.guestUnit}
          </p>
          {entry.seatNumber !== null && (
            <p className="mt-0.5 text-[0.625rem] font-bold text-leaf-dark">
              {format(t.host.seatValue, { seat: entry.seatNumber })}
              {entry.openedBy ? ` · ${entry.openedBy}` : ""}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-1.5 text-[0.625rem] font-semibold text-ink/45">
          {table.status === "available"
            ? t.owner.openLegend
            : table.status === "dirty"
              ? t.owner.resetLegend
              : t.owner.blockedLegend}
        </p>
      )}
      <div className="mt-2 flex gap-1">
        {table.status === "seated" && (
          <button type="button" className="btn btn-soft btn-sm h-7 flex-1 px-2 text-[0.6875rem]" onClick={onClear} disabled={busy}>
            <Check className="size-3" /> {t.host.releaseSeat}
          </button>
        )}
        {table.status === "dirty" && (
          <button type="button" className="btn btn-sage btn-sm h-7 flex-1 px-2 text-[0.6875rem]" onClick={onReady} disabled={busy}>
            <Sparkles className="size-3" /> {t.host.ready}
          </button>
        )}
        {table.status === "available" && (
          <button type="button" className="btn btn-ghost btn-sm h-7 flex-1 px-2 text-[0.6875rem] text-muted" onClick={onBlock} disabled={busy}>
            {t.status.blocked}
          </button>
        )}
        {table.status === "blocked" && (
          <button type="button" className="btn btn-ghost btn-sm h-7 flex-1 px-2 text-[0.6875rem] text-muted" onClick={onReady} disabled={busy}>
            <ChevronRight className="size-3" /> {t.owner.openLegend}
          </button>
        )}
      </div>
    </div>
  );
}

export function SeatedCard({
  entry,
  busy,
  onRelease,
  showCategory = true,
  timezone,
}: {
  entry: QueueEntry;
  busy: boolean;
  onRelease: () => void;
  showCategory?: boolean;
  timezone: string;
}) {
  const { t } = useLang();
  const rating = entry.rating;
  return (
    <article className="min-w-0 rounded-2xl border-2 border-ink bg-leaf-soft/60 p-3.5 shadow-[3px_3px_0_#262321]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="num rounded-md border-2 border-ink bg-ink px-1.5 py-0.5 text-[0.6875rem] font-extrabold tracking-wide text-paper">
              {entry.code}
            </span>
            {showCategory && (
              <span className="pill status-muted" title={entry.category === "A" ? t.guest.queueA : t.guest.queueB}>
                {entry.category}
              </span>
            )}
            <span className="pill status-seated">{t.ticket.seated}</span>
            {entry.visitNumber > 1 && (
              <span className="pill status-waiting">
                {format(t.common.visitNumber, { count: entry.visitNumber })}
              </span>
            )}
          </div>
          <h3 className="mt-2 min-w-0 truncate font-display text-[1.4rem] leading-tight tracking-tight">{entry.guestName}</h3>
          <p className="mt-0.5 text-xs font-semibold text-muted">
            {entry.partySize} {t.guest.guestUnit}
            {entry.tableLabel
              ? ` · ${entry.tableLabel}${entry.seatNumber !== null ? ` / ${format(t.host.seatValue, { seat: entry.seatNumber })}` : ""}`
              : ` · ${t.host.manualSeat}`}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-muted">
            <Clock3 className="size-3" />
            {format(t.host.waitingFor, { minutes: Math.max(1, entry.waitMinutes) })}
          </p>
          {entry.seatedAt && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-leaf-dark">
              <Clock3 className="size-3" />
              {format(t.host.hadirAt, { time: clockInTz(entry.seatedAt, timezone) })}
            </p>
          )}
          {rating !== null && (
            <div className="mt-1.5 rounded-lg border-2 border-ink/10 bg-white/70 px-2 py-1.5">
              <div className="flex items-center gap-0.5 text-gold">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="size-3" fill={star <= rating ? "currentColor" : "none"} />
                ))}
                <span className="ml-1 text-[0.625rem] font-bold text-ink/60">{rating}/5</span>
              </div>
              {entry.ratingNote && (
                <p className="mt-0.5 text-[0.6875rem] font-medium italic text-muted">“{entry.ratingNote}”</p>
              )}
            </div>
          )}
          {entry.openedBy && (
            <p className="mt-1 text-[0.6875rem] font-bold text-leaf-dark">
              {format(t.host.openedBy, { name: entry.openedBy })}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 border-t-2 border-dashed border-ink/15 pt-2.5">
        <button type="button" className="btn btn-soft btn-sm w-full" onClick={onRelease} disabled={busy}>
          <Check className="size-3.5" /> {t.host.releaseSeat}
        </button>
      </div>
    </article>
  );
}

export function NoShowCard({
  entry,
  busy,
  onRequeue,
  timezone,
}: {
  entry: QueueEntry;
  busy: boolean;
  onRequeue: () => void;
  timezone: string;
}) {
  const { t } = useLang();
  const at = entry.closedAt ?? entry.calledAt ?? entry.joinedAt;
  const rating = entry.rating;
  return (
    <article className="min-w-0 rounded-2xl border-2 border-ink bg-cream p-3.5 shadow-[3px_3px_0_#262321]">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="num rounded-md border-2 border-ink bg-ink px-1.5 py-0.5 text-[0.6875rem] font-extrabold tracking-wide text-paper">
          {entry.code}
        </span>
        <span className="pill status-muted">{entry.partySize} {t.guest.guestUnit}</span>
        <span className="pill status-muted">{t.host.noShow}</span>
        {entry.visitNumber > 1 && (
          <span className="pill status-waiting">
            {format(t.common.visitNumber, { count: entry.visitNumber })}
          </span>
        )}
      </div>
      <h3 className="mt-2 min-w-0 truncate font-display text-[1.4rem] leading-tight tracking-tight">{entry.guestName}</h3>
      <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-muted">
        <Clock3 className="size-3" />
        {format(t.host.noShowAt, { time: clockInTz(at, timezone) })}
      </p>
      <p className="mt-0.5 inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-muted">
        <Clock3 className="size-3" />
        {format(t.host.startedAt, { time: clockInTz(entry.joinedAt, timezone) })} ·{" "}
        {format(t.host.waitingFor, { minutes: Math.max(1, entry.waitMinutes) })}
      </p>
      {entry.phone && (
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
          <a href={`tel:${entry.phone}`} className="inline-flex items-center gap-1 hover:text-ink">
            <Phone className="size-3" /> {entry.phone}
          </a>
        </div>
      )}
      {entry.notes && (
        <p className="mt-2 rounded-lg bg-white/70 px-2 py-1.5 text-xs font-medium leading-relaxed text-ink/70">
          {entry.notes}
        </p>
      )}
      {rating !== null && (
        <div className="mt-2 rounded-lg border-2 border-ink/10 bg-white/70 px-2 py-1.5">
          <div className="flex items-center gap-0.5 text-gold">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="size-3" fill={star <= rating ? "currentColor" : "none"} />
            ))}
            <span className="ml-1 text-[0.625rem] font-bold text-ink/60">{rating}/5</span>
          </div>
          {entry.ratingNote && (
            <p className="mt-0.5 text-[0.6875rem] font-medium italic text-muted">“{entry.ratingNote}”</p>
          )}
        </div>
      )}
      <button type="button" className="btn btn-primary btn-sm mt-3 w-full" onClick={onRequeue} disabled={busy}>
        <RotateCcw className="size-3.5" /> {t.host.requeue}
      </button>
    </article>
  );
}

export function EmptyBoard({ title, note }: { title: string; note: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-ink/35 bg-white/60 px-4 py-8 text-center">
      <p className="font-display text-lg">{title}</p>
      <p className="mx-auto mt-1 max-w-[16rem] text-xs font-medium leading-relaxed text-muted">{note}</p>
    </div>
  );
}
