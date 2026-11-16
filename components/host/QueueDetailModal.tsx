"use client";

import { MessageCircle, Phone, Star } from "lucide-react";
import { Modal } from "@/components/Modal";
import { useLang } from "@/components/LanguageProvider";
import { whatsappHref } from "@/components/host/cards";
import { format } from "@/lib/i18n";
import { clockInTz, dayInTz, elapsedMinutes, formatDayLong, formatFullDateInTz } from "@/lib/time";
import type { EntryStatus, QueueEntry } from "@/lib/types";

function statusKey(status: EntryStatus): "waiting" | "called" | "seated" | "completed" | "noShow" | "cancelled" {
  return status === "no_show" ? "noShow" : status;
}

function statusTone(status: EntryStatus): string {
  if (status === "waiting") return "status-waiting";
  if (status === "called") return "status-called";
  if (status === "seated") return "status-seated";
  return "status-muted";
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[0.5625rem] font-extrabold uppercase tracking-[0.12em] text-ink/45">{label}</p>
      <p className="mt-0.5 break-words text-sm font-semibold text-ink/80">{value}</p>
    </div>
  );
}

export function QueueDetailModal({
  target,
  onClose,
  timezone,
  locale,
  branchName,
}: {
  target: { entry: QueueEntry; position: number } | null;
  onClose: () => void;
  timezone: string;
  locale: string;
  branchName: string;
}) {
  const { t } = useLang();
  const entry = target?.entry;

  if (!entry) return null;

  const source = entry.source === "walkin" ? t.host.walkIn : entry.source === "online" ? "Online" : "QR";
  const firstCall = entry.firstCalledAt ?? entry.calledAt;
  const waitMinutes = firstCall ? elapsedMinutes(entry.joinedAt, firstCall) : entry.waitMinutes;
  const readyAt = entry.calledAt ?? new Date().toISOString();
  const waMessage =
    entry.status === "called"
      ? format(t.host.waCallMessage, {
          name: entry.guestName,
          code: entry.code,
          count: entry.partySize,
          branch: branchName,
          day: formatFullDateInTz(readyAt, timezone, locale),
          time: clockInTz(readyAt, timezone),
        })
      : entry.status === "waiting"
        ? format(t.host.waQueueMessage, {
            name: entry.guestName,
            code: entry.code,
            count: entry.partySize,
            branch: branchName,
          })
        : format(t.host.waContactMessage, {
            name: entry.guestName,
            code: entry.code,
            branch: branchName,
          });

  return (
    <Modal
      open
      onClose={onClose}
      title={entry.guestName}
      description={`${entry.code} · ${entry.partySize} ${t.guest.guestUnit}`}
      footer={
        <button type="button" className="btn btn-soft" onClick={onClose}>
          {t.host.detailClose}
        </button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`pill ${statusTone(entry.status)}`}>{t.status[statusKey(entry.status)]}</span>
          <span className="pill status-muted">
            {t.host.detailPosition} #{target.position}
          </span>
          <span className="pill status-muted">{source}</span>
          {entry.visitNumber > 1 && (
            <span className="pill status-waiting">{format(t.common.visitNumber, { count: entry.visitNumber })}</span>
          )}
        </div>

        <div className="rounded-xl border-2 border-ink bg-cream px-4 py-3">
          <p className="eyebrow text-tomato">{t.host.detailKicker}</p>
          <p className="mt-1 break-words font-display text-2xl font-semibold leading-tight">{entry.guestName}</p>
          {entry.phone ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="num text-sm font-bold text-muted">{entry.phone}</span>
              <a href={`tel:${entry.phone.replace(/\s/g, "")}`} className="btn btn-soft btn-sm">
                <Phone className="size-3.5" /> {t.host.detailCall}
              </a>
              <a
                href={whatsappHref(entry.phone, waMessage)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sage btn-sm"
                title={waMessage}
              >
                <MessageCircle className="size-3.5" /> WhatsApp
              </a>
            </div>
          ) : (
            <p className="mt-1 text-sm font-semibold text-muted-soft">{t.owner.ratingNoPhone}</p>
          )}
        </div>

        {entry.status === "called" && firstCall && (
          <div className="rounded-xl border-2 border-tomato/25 bg-pink-soft px-3.5 py-3">
            <p className="text-[0.5625rem] font-extrabold uppercase tracking-[0.12em] text-tomato-dark/70">
              {t.host.atDoorTitle}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
              <Detail label={t.host.detailFirstCall} value={clockInTz(firstCall, timezone)} />
              <Detail
                label={t.host.detailLastCall}
                value={entry.calledAt ? clockInTz(entry.calledAt, timezone) : "—"}
              />
              <Detail label={t.host.detailCalls} value={`${entry.calledCount}x`} />
              <Detail
                label={t.host.detailWaiting}
                value={format(t.host.detailMinutes, { count: Math.max(1, waitMinutes) })}
              />
            </div>
          </div>
        )}

        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <Detail
            label={t.host.detailStarted}
            value={`${formatDayLong(dayInTz(entry.joinedAt, timezone), locale)} · ${clockInTz(entry.joinedAt, timezone)}`}
          />
          {entry.status !== "called" && (
            <Detail label={t.host.detailWaiting} value={format(t.host.detailMinutes, { count: Math.max(1, waitMinutes) })} />
          )}
          {entry.status !== "called" && firstCall && (
            <Detail label={t.host.detailFirstCall} value={clockInTz(firstCall, timezone)} />
          )}
          {entry.status !== "called" && entry.calledCount > 0 && (
            <Detail label={t.host.detailCalls} value={`${entry.calledCount}x`} />
          )}
          {entry.seatedAt && <Detail label={t.host.detailSeated} value={clockInTz(entry.seatedAt, timezone)} />}
          {entry.tableLabel && (
            <Detail
              label={t.host.detailTable}
              value={
                entry.seatNumber !== null
                  ? `${entry.tableLabel} · ${format(t.host.seatValue, { seat: entry.seatNumber })}`
                  : entry.tableLabel
              }
            />
          )}
          {entry.closedAt && <Detail label={t.host.detailClosed} value={clockInTz(entry.closedAt, timezone)} />}
          {entry.openedBy && <Detail label={t.host.detailOpenedBy} value={entry.openedBy} />}
          {entry.releasedBy && <Detail label={t.host.detailReleasedBy} value={entry.releasedBy} />}
          {entry.rating !== null && (
            <Detail
              label={t.host.detailRating}
              value={
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-0.5 text-gold">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="size-3" fill={star <= (entry.rating ?? 0) ? "currentColor" : "none"} />
                    ))}
                  </span>
                  {entry.rating}/5
                </span>
              }
            />
          )}
        </div>

        {entry.notes && (
          <div className="rounded-xl border-2 border-ink/10 bg-cream/60 px-3.5 py-3">
            <p className="text-[0.5625rem] font-extrabold uppercase tracking-[0.12em] text-ink/45">{t.host.detailNotes}</p>
            <p className="mt-1 break-words text-sm font-medium leading-relaxed text-ink/75">{entry.notes}</p>
          </div>
        )}

        {entry.noShowReason && (
          <div className="rounded-xl border-2 border-tomato/25 bg-pink-soft px-3.5 py-3">
            <p className="text-[0.5625rem] font-extrabold uppercase tracking-[0.12em] text-tomato-dark/70">
              {t.host.detailNoShowReason}
            </p>
            <p className="mt-1 break-words text-sm font-semibold text-tomato-dark">{entry.noShowReason}</p>
          </div>
        )}

        {entry.ratingNote && (
          <div className="rounded-xl border-2 border-ink/10 bg-white px-3.5 py-3">
            <p className="text-[0.5625rem] font-extrabold uppercase tracking-[0.12em] text-ink/45">
              {t.host.detailNotes}
            </p>
            <p className="mt-1 break-words text-sm font-medium italic leading-relaxed text-ink/70">
              “{entry.ratingNote}”
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
