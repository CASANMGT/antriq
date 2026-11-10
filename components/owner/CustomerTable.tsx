"use client";

import { useMemo, useState, useTransition } from "react";
import { Clock3, History, Loader2, Phone, Star, Users } from "lucide-react";
import { Modal } from "@/components/Modal";
import { useLang } from "@/components/LanguageProvider";
import { postJson } from "@/lib/client-api";
import { format } from "@/lib/i18n";
import { phoneKey } from "@/lib/guest";
import { clockInTz, dayInTz, formatDayLong } from "@/lib/time";
import type { CustomerHistoryItem, EntryStatus, QueueEntry } from "@/lib/types";

function statusKey(status: EntryStatus): "waiting" | "called" | "seated" | "completed" | "noShow" | "cancelled" {
  return status === "no_show" ? "noShow" : status;
}

function statusTone(status: EntryStatus): string {
  if (status === "waiting") return "status-waiting";
  if (status === "called") return "status-called";
  if (status === "seated") return "status-seated";
  return "status-muted";
}

export function CustomerTable({
  customers,
  starredPhones,
  branchId,
  timezone,
  locale,
}: {
  customers: QueueEntry[];
  starredPhones: string[];
  branchId: number;
  timezone: string;
  locale: string;
}) {
  const { t } = useLang();
  const [starred, setStarred] = useState<Set<string>>(() => new Set(starredPhones));
  const [history, setHistory] = useState<{
    entry: QueueEntry;
    items: CustomerHistoryItem[];
    loading: boolean;
    error: boolean;
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const visible = customers.slice(0, 250);
  const repeatCount = useMemo(
    () =>
      new Set(
        customers
          .filter((entry) => entry.phone && entry.visitNumber > 1)
          .map((entry) => phoneKey(entry.phone) as string),
      ).size,
    [customers],
  );

  function toggleStar(phone: string) {
    const key = phoneKey(phone);
    if (!key) return;
    const next = !starred.has(key);
    setStarred((current) => {
      const copy = new Set(current);
      if (next) copy.add(key);
      else copy.delete(key);
      return copy;
    });
    startTransition(async () => {
      const result = await postJson("/api/owner/action", { type: "starPhone", phone, starred: next });
      if (!result.ok) {
        setStarred((current) => {
          const copy = new Set(current);
          if (next) copy.delete(key);
          else copy.add(key);
          return copy;
        });
      }
    });
  }

  function openHistory(entry: QueueEntry) {
    setHistory({ entry, items: [], loading: true, error: false });
    startTransition(async () => {
      try {
        const params = new URLSearchParams({
          branch: String(branchId),
          phone: entry.phone ?? "",
          name: entry.guestName,
        });
        const response = await fetch(`/api/owner/customer-history?${params.toString()}`, { cache: "no-store" });
        if (!response.ok) throw new Error("history");
        const data = (await response.json()) as { items?: CustomerHistoryItem[] };
        setHistory({ entry, items: data.items ?? [], loading: false, error: false });
      } catch {
        setHistory({ entry, items: [], loading: false, error: true });
      }
    });
  }

  const hadirVisits = history?.items.filter((item) => item.status === "seated" || item.status === "completed").length ?? 0;

  return (
    <>
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink bg-cream/70 px-4 py-3 sm:px-5">
          <div>
            <h2 className="font-display text-[1.5rem] font-semibold leading-tight">{t.owner.customersList}</h2>
            <p className="text-xs font-semibold text-muted">{t.owner.customersListSub}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {repeatCount > 0 && (
              <span className="pill status-waiting">{format(t.owner.repeatGuests, { count: repeatCount })}</span>
            )}
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-ink/55">
              <Users className="size-3.5" /> {customers.length}
            </span>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm font-semibold text-muted">{t.owner.customersEmpty}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b-2 border-ink/15 bg-cream/40 text-left text-[0.625rem] uppercase tracking-[0.12em] text-ink/50">
                  <th className="px-4 py-2.5 font-extrabold sm:px-5">{t.owner.customer}</th>
                  <th className="px-3 py-2.5 font-extrabold">{t.owner.contact}</th>
                  <th className="px-3 py-2.5 font-extrabold text-right">{t.common.paxShort}</th>
                  <th className="px-3 py-2.5 font-extrabold">{t.owner.status}</th>
                  <th className="px-3 py-2.5 font-extrabold">{t.owner.tableSeat}</th>
                  <th className="px-3 py-2.5 font-extrabold">{t.owner.picOpened}</th>
                  <th className="px-3 py-2.5 font-extrabold">{t.owner.picReleased}</th>
                  <th className="px-4 py-2.5 font-extrabold sm:px-5">{t.owner.joinedAt}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((entry) => {
                  const key = phoneKey(entry.phone);
                  const isStarred = key ? starred.has(key) : false;
                  return (
                    <tr key={entry.id} className="border-b-2 border-dashed border-ink/10 last:border-0 hover:bg-cream/30">
                      <td className="px-4 py-2.5 sm:px-5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="font-extrabold">{entry.guestName}</p>
                          {entry.visitNumber > 1 && (
                            <span className="pill status-waiting">
                              {format(t.common.visitBadge, { count: entry.visitNumber })}
                            </span>
                          )}
                        </div>
                        <p className="num text-[0.6875rem] font-bold text-muted">{entry.code}</p>
                        <button
                          type="button"
                          onClick={() => openHistory(entry)}
                          className="mt-0.5 inline-flex items-center gap-1 text-[0.625rem] font-bold text-tomato hover:underline"
                        >
                          <History className="size-3" /> {t.owner.viewHistory}
                        </button>
                      </td>
                      <td className="px-3 py-2.5">
                        {entry.phone ? (
                          <div className="inline-flex items-center gap-1.5">
                            <a href={`tel:${entry.phone}`} className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink">
                              <Phone className="size-3" /> {entry.phone}
                            </a>
                            <button
                              type="button"
                              onClick={() => toggleStar(entry.phone as string)}
                              className="rounded-full p-0.5 text-ink/30 transition hover:bg-cream hover:text-gold"
                              aria-label={isStarred ? t.owner.unstarPhone : t.owner.starPhone}
                              title={isStarred ? t.owner.unstarPhone : t.owner.starPhone}
                              disabled={pending}
                            >
                              <Star className={`size-3.5 ${isStarred ? "text-gold" : ""}`} fill={isStarred ? "currentColor" : "none"} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-muted-soft">{t.common.none}</span>
                        )}
                      </td>
                      <td className="num px-3 py-2.5 text-right font-semibold">{entry.partySize}</td>
                      <td className="px-3 py-2.5">
                        <span className={`pill ${statusTone(entry.status)}`}>{t.status[statusKey(entry.status)]}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs font-semibold">
                        {entry.tableLabel ? (
                          <span>
                            {entry.tableLabel}
                            {entry.seatNumber !== null ? ` · ${format(t.host.seatValue, { seat: entry.seatNumber })}` : ""}
                          </span>
                        ) : (
                          <span className="text-muted-soft">{t.common.none}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs font-semibold">{entry.openedBy ?? t.common.none}</td>
                      <td className="px-3 py-2.5 text-xs font-semibold">{entry.releasedBy ?? t.common.none}</td>
                      <td className="px-4 py-2.5 text-xs font-semibold text-muted sm:px-5">
                        <p>{formatDayLong(entry.day, locale)}</p>
                        <p className="num">{clockInTz(entry.joinedAt, timezone)}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={Boolean(history)}
        onClose={() => setHistory(null)}
        title={history ? format(t.owner.historyTitle, { name: history.entry.guestName }) : ""}
        description={t.owner.historySub}
      >
        {history && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-ink bg-cream px-3.5 py-2.5">
              <div>
                <p className="text-xs font-bold text-muted">{history.entry.phone ?? t.owner.ratingNoPhone}</p>
                <p className="text-sm font-extrabold">{format(t.owner.historyHadirVisits, { count: hadirVisits })}</p>
              </div>
              <span className="pill status-seated">{history.entry.code}</span>
            </div>

            {history.loading ? (
              <p className="flex items-center justify-center gap-2 py-8 text-xs font-semibold text-muted">
                <Loader2 className="size-4 animate-spin" /> {t.owner.historyLoading}
              </p>
            ) : history.error ? (
              <p className="py-8 text-center text-xs font-semibold text-tomato-dark">{t.owner.historyError}</p>
            ) : history.items.length === 0 ? (
              <p className="py-8 text-center text-xs font-semibold text-muted">{t.owner.historyEmpty}</p>
            ) : (
              <div className="mt-3 max-h-[55vh] space-y-2 overflow-y-auto pr-1">
                {history.items.map((item) => (
                  <div key={item.id} className="rounded-xl border-2 border-ink/10 bg-cream/50 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-extrabold">
                        {item.code} · {item.partySize} {t.guest.guestUnit}
                      </p>
                      <span className={`pill ${statusTone(item.status)}`}>{t.status[statusKey(item.status)]}</span>
                    </div>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-muted">
                      <Clock3 className="size-3" />
                      {formatDayLong(dayInTz(item.joinedAt, timezone), locale)} · {clockInTz(item.joinedAt, timezone)}
                    </p>
                    {item.seatedAt && (
                      <p className="mt-0.5 text-[0.6875rem] font-bold text-leaf-dark">
                        {t.ticket.seated}: {clockInTz(item.seatedAt, timezone)}
                      </p>
                    )}
                    {item.tableLabel && <p className="mt-0.5 text-[0.6875rem] font-semibold text-muted">{item.tableLabel}</p>}
                    {(item.openedBy || item.releasedBy) && (
                      <p className="mt-0.5 text-[0.6875rem] font-semibold text-muted">
                        {item.openedBy ? `${t.owner.picOpened}: ${item.openedBy}` : ""}
                        {item.openedBy && item.releasedBy ? " · " : ""}
                        {item.releasedBy ? `${t.owner.picReleased}: ${item.releasedBy}` : ""}
                      </p>
                    )}
                    {item.notes && <p className="mt-0.5 text-[0.6875rem] font-medium italic text-ink/65">“{item.notes}”</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
