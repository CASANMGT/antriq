"use client";

import {
  BellRing,
  Check,
  ChevronRight,
  Clock3,
  CornerUpLeft,
  Phone,
  RotateCcw,
  Sparkles,
  UserRound,
  Utensils,
} from "lucide-react";
import { Countdown } from "@/components/Countdown";
import { TablePill } from "@/components/Pills";
import { humanizeMinutes } from "@/lib/time";
import type { DiningTable, HostStats, QueueEntry } from "@/lib/types";

const sourceLabel: Record<string, string> = {
  qr: "QR",
  online: "Online",
  walkin: "Walk-in",
};

export function StatsStrip({ stats }: { stats: HostStats }) {
  const items = [
    { label: "Waiting", value: stats.waiting, tone: "text-gold" },
    { label: "At the door", value: stats.called, tone: "text-clay" },
    { label: "Seated", value: stats.seated, tone: "text-sage" },
    { label: "Tables free", value: `${stats.availableTables}/${stats.totalTables}`, tone: "text-ink" },
    { label: "Avg wait", value: stats.avgWaitMinutes ? `${stats.avgWaitMinutes}m` : "—", tone: "text-ink" },
    { label: "Longest wait", value: stats.longestWaitMinutes ? `${stats.longestWaitMinutes}m` : "—", tone: stats.longestWaitMinutes > 25 ? "text-clay" : "text-ink" },
  ];

  return (
    <div className="grid grid-cols-3 border-t border-line bg-white/60 sm:grid-cols-6">
      {items.map((item) => (
        <div key={item.label} className="border-b border-r border-line px-3 py-2.5 last:border-r-0 sm:border-b-0">
          <p className={`num text-lg font-extrabold leading-none ${item.tone}`}>{item.value}</p>
          <p className="mt-1 text-[0.5625rem] font-bold uppercase tracking-[0.12em] text-muted">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

export function QueueCard({
  entry,
  next,
  busy,
  onCall,
  onSeat,
  onExtend,
  onNoShow,
  onUndo,
}: {
  entry: QueueEntry;
  next: boolean;
  busy: boolean;
  onCall: () => void;
  onSeat: () => void;
  onExtend: () => void;
  onNoShow: () => void;
  onUndo: () => void;
}) {
  const called = entry.status === "called";
  const urgent = called && entry.holdSecondsLeft <= 120;

  return (
    <article
      className={`rounded-2xl border bg-white p-3.5 transition ${
        called
          ? urgent
            ? "border-clay/50 shadow-[0_0_0_3px_rgba(200,69,43,0.08)]"
            : "border-clay/30"
          : next
            ? "border-clay/30 shadow-soft"
            : "border-line hover:border-sand"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="num rounded-md bg-ink px-1.5 py-0.5 text-[0.6875rem] font-bold tracking-wide text-paper">
              {entry.code}
            </span>
            <span className="pill status-muted">{sourceLabel[entry.source] ?? entry.source}</span>
            {next && !called && <span className="eyebrow text-clay">Next up</span>}
            {called && entry.acknowledged && (
              <span className="pill status-seated">
                <Check className="size-3" /> On the way
              </span>
            )}
          </div>
          <h3 className="mt-2 truncate font-display text-[1.35rem] leading-tight tracking-tight">
            {entry.guestName}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="font-semibold text-ink/75">
              {entry.partySize} {entry.partySize === 1 ? "guest" : "guests"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="size-3" />
              {called
                ? `called ${humanizeMinutes(entry.calledMinutesAgo ?? 0)} ago`
                : `waited ${humanizeMinutes(entry.waitMinutes)}`}
            </span>
            {entry.phone && (
              <a href={`tel:${entry.phone}`} className="inline-flex items-center gap-1 hover:text-ink">
                <Phone className="size-3" />
                {entry.phone}
              </a>
            )}
          </div>
          {entry.notes && (
            <p className="mt-2 rounded-lg bg-cream/60 px-2 py-1.5 text-xs leading-relaxed text-ink/70">
              {entry.notes}
            </p>
          )}
        </div>
        {called ? (
          <div className="shrink-0 rounded-xl border border-clay/20 bg-clay-soft px-2.5 py-2 text-center">
            <p className="text-[0.5625rem] font-bold uppercase tracking-[0.1em] text-clay-dark/60">Hold</p>
            <p className="mt-0.5 text-sm text-clay-dark">
              <Countdown seconds={entry.holdSecondsLeft} />
            </p>
          </div>
        ) : (
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-cream text-ink/60">
            <UserRound className="size-4" />
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line/70 pt-2.5">
        {!called && (
          <>
            <button type="button" className="btn btn-clay btn-sm" onClick={onCall} disabled={busy}>
              <BellRing className="size-3.5" /> Call
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={onSeat} disabled={busy}>
              <Utensils className="size-3.5" /> Seat
            </button>
          </>
        )}
        {called && (
          <>
            <button type="button" className="btn btn-sage btn-sm" onClick={onSeat} disabled={busy}>
              <Utensils className="size-3.5" /> Seat
            </button>
            <button type="button" className="btn btn-soft btn-sm" onClick={onExtend} disabled={busy}>
              +5 min
            </button>
            <button type="button" className="btn btn-ghost btn-sm text-muted" onClick={onNoShow} disabled={busy}>
              No-show
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm ml-auto text-muted"
              onClick={onUndo}
              disabled={busy}
              title="Return to the waitlist"
            >
              <CornerUpLeft className="size-3.5" /> Undo
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
  const tint =
    table.status === "seated"
      ? "border-clay/25 bg-[#FFFBF7]"
      : table.status === "dirty"
        ? "border-gold/30 bg-gold-soft/40"
        : table.status === "blocked"
          ? "border-line bg-cream/50"
          : "border-line bg-white";

  return (
    <div className={`rounded-xl border p-2.5 ${tint}`}>
      <div className="flex items-start justify-between gap-1">
        <span className="num text-sm font-extrabold">{table.label}</span>
        <TablePill status={table.status} />
      </div>
      <p className="mt-0.5 text-[0.625rem] text-muted">
        {table.capacity} {table.capacity === 1 ? "seat" : "seats"}
      </p>
      {entry ? (
        <div className="mt-1.5 min-w-0">
          <p className="truncate text-xs font-bold">{entry.guestName}</p>
          <p className="text-[0.625rem] text-muted">
            {entry.code} · {humanizeMinutes(entry.waitMinutes)}
          </p>
        </div>
      ) : (
        <p className="mt-1.5 text-[0.625rem] text-muted/70">
          {table.status === "available" ? "Ready for guests" : table.status === "dirty" ? "Needs resetting" : "Out of service"}
        </p>
      )}
      <div className="mt-2 flex gap-1">
        {table.status === "seated" && (
          <button type="button" className="btn btn-soft btn-sm h-7 flex-1 px-2 text-[0.6875rem]" onClick={onClear} disabled={busy}>
            <RotateCcw className="size-3" /> Clear
          </button>
        )}
        {table.status === "dirty" && (
          <button type="button" className="btn btn-sage btn-sm h-7 flex-1 px-2 text-[0.6875rem]" onClick={onReady} disabled={busy}>
            <Sparkles className="size-3" /> Ready
          </button>
        )}
        {table.status === "available" && (
          <button type="button" className="btn btn-ghost btn-sm h-7 flex-1 px-2 text-[0.6875rem] text-muted" onClick={onBlock} disabled={busy}>
            Block
          </button>
        )}
        {table.status === "blocked" && (
          <button type="button" className="btn btn-ghost btn-sm h-7 flex-1 px-2 text-[0.6875rem] text-muted" onClick={onReady} disabled={busy}>
            <ChevronRight className="size-3" /> Unblock
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyBoard({ title, note }: { title: string; note: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white/50 px-4 py-8 text-center">
      <p className="font-display text-lg">{title}</p>
      <p className="mx-auto mt-1 max-w-[16rem] text-xs leading-relaxed text-muted">{note}</p>
    </div>
  );
}
