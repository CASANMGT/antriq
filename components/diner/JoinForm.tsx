"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Loader2, Minus, Plus, Ticket } from "lucide-react";
import { useLang } from "@/components/LanguageProvider";
import { postJson } from "@/lib/client-api";

export function JoinForm({
  branchId,
  maxPartySize,
  disabled,
  disabledTitle,
  disabledNote,
}: {
  branchId: number;
  maxPartySize: number;
  disabled: boolean;
  disabledTitle: string;
  disabledNote: string;
}) {
  const router = useRouter();
  const { t } = useLang();
  const [partySize, setPartySize] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setError(null);

    startTransition(async () => {
      const result = await postJson<{ token: string; code: string }>("/api/join", {
        branchId,
        guestName: String(data.get("guestName") ?? ""),
        phone: String(data.get("phone") ?? ""),
        notes: String(data.get("notes") ?? ""),
        partySize,
        website: String(data.get("website") ?? ""),
      });

      if (!result.ok || !result.data?.token) {
        setError(result.message ?? t.guest.formNameError);
        return;
      }

      const ticket = result.data;
      try {
        window.localStorage.setItem(
          "antriq:ticket",
          JSON.stringify({ token: ticket.token, code: ticket.code, branchId, at: Date.now() }),
        );
      } catch {
        // A private window can block storage; the ticket URL still works.
      }
      router.push(`/t/${ticket.token}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-5">
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <fieldset disabled={disabled || pending} className="space-y-4 disabled:opacity-60">
        <div>
          <span className="label">{t.guest.partySize}</span>
          <div className="flex items-center justify-between rounded-2xl border-2 border-ink bg-cream p-1.5 shadow-[3px_3px_0_#262321]">
            <button
              type="button"
              onClick={() => setPartySize((size) => Math.max(1, size - 1))}
              className="grid size-12 place-items-center rounded-xl border-2 border-ink bg-white text-ink transition hover:bg-pink active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-40"
              aria-label={t.common.add === "Tambah" ? "Kurangi satu tamu" : "One guest fewer"}
              disabled={partySize <= 1}
            >
              <Minus className="size-4" />
            </button>
            <div className="text-center">
              <p className="num font-display text-4xl font-semibold leading-none tracking-tight">{partySize}</p>
              <p className="mt-1 text-[0.6875rem] font-extrabold uppercase tracking-[0.14em] text-ink/55">
                {t.guest.guestUnit}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPartySize((size) => Math.min(maxPartySize, size + 1))}
              className="grid size-12 place-items-center rounded-xl border-2 border-ink bg-white text-ink transition hover:bg-pink active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-40"
              aria-label={t.common.add === "Tambah" ? "Tambah satu tamu" : "One guest more"}
              disabled={partySize >= maxPartySize}
            >
              <Plus className="size-4" />
            </button>
          </div>
          {partySize >= maxPartySize && (
            <p className="mt-2 text-xs leading-relaxed text-muted">{t.guest.closedNote}</p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="guestName">
            {t.guest.nameLabel}
          </label>
          <input
            className="input"
            id="guestName"
            name="guestName"
            placeholder={t.guest.namePlaceholder}
            autoComplete="name"
            maxLength={60}
            required
            minLength={2}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="phone">
              {t.guest.phoneLabel}{" "}
              <span className="font-semibold normal-case tracking-normal text-muted">({t.common.optional})</span>
            </label>
            <input
              className="input"
              id="phone"
              name="phone"
              placeholder="0812 3456 7890"
              inputMode="tel"
              autoComplete="tel"
              maxLength={32}
            />
          </div>
          <div>
            <label className="label" htmlFor="notes">
              {t.guest.noteLabel}{" "}
              <span className="font-semibold normal-case tracking-normal text-muted">({t.common.optional})</span>
            </label>
            <input
              className="input"
              id="notes"
              name="notes"
              placeholder={t.guest.notePlaceholder}
              maxLength={200}
            />
          </div>
        </div>

        {disabled && (
          <div className="rounded-2xl border-2 border-ink bg-pink-soft p-4">
            <p className="font-display text-lg">{disabledTitle}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink/70">{disabledNote}</p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-2xl border-2 border-ink bg-pink px-3.5 py-3 text-sm font-semibold text-tomato-dark"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={disabled}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> {t.guest.joining}
            </>
          ) : (
            <>
              {t.guest.join} <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </fieldset>

      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Ticket className="size-3.5 text-tomato" />
          {t.guest.queueNote}
        </span>
        <span>{t.guest.noApp}</span>
      </div>
    </form>
  );
}
