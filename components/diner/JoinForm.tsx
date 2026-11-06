"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Loader2, Minus, Plus } from "lucide-react";
import { postJson } from "@/lib/client-api";

export function JoinForm({
  maxPartySize,
  disabled,
  disabledTitle,
  disabledNote,
  estimateMinutes,
}: {
  maxPartySize: number;
  disabled: boolean;
  disabledTitle: string;
  disabledNote: string;
  estimateMinutes: number | null;
}) {
  const router = useRouter();
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
        guestName: String(data.get("guestName") ?? ""),
        phone: String(data.get("phone") ?? ""),
        notes: String(data.get("notes") ?? ""),
        partySize,
        website: String(data.get("website") ?? ""),
      });

      if (!result.ok || !result.data?.token) {
        setError(result.message ?? "We couldn't add you to the waitlist. Please see the host.");
        return;
      }

      const ticket = result.data;
      try {
        window.localStorage.setItem(
          "antriq:ticket",
          JSON.stringify({ token: ticket.token, code: ticket.code, at: Date.now() }),
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
          <span className="label">How many guests?</span>
          <div className="flex items-center justify-between rounded-2xl border border-line bg-cream/50 p-1.5">
            <button
              type="button"
              onClick={() => setPartySize((size) => Math.max(1, size - 1))}
              className="grid size-12 place-items-center rounded-xl bg-white text-ink shadow-sm transition hover:bg-cream active:scale-95 disabled:opacity-40"
              aria-label="One guest fewer"
              disabled={partySize <= 1}
            >
              <Minus className="size-4" />
            </button>
            <div className="text-center">
              <p className="num text-3xl font-extrabold leading-none tracking-tight">{partySize}</p>
              <p className="mt-1 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
                {partySize === 1 ? "guest" : "guests"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPartySize((size) => Math.min(maxPartySize, size + 1))}
              className="grid size-12 place-items-center rounded-xl bg-white text-ink shadow-sm transition hover:bg-cream active:scale-95 disabled:opacity-40"
              aria-label="One guest more"
              disabled={partySize >= maxPartySize}
            >
              <Plus className="size-4" />
            </button>
          </div>
          {partySize >= maxPartySize && (
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Larger group? Call the restaurant and we&apos;ll arrange it with you.
            </p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="guestName">
            Your name
          </label>
          <input
            className="input"
            id="guestName"
            name="guestName"
            placeholder="e.g. Maya Putri"
            autoComplete="name"
            maxLength={60}
            required
            minLength={2}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="phone">
              Phone <span className="font-medium normal-case tracking-normal text-muted-soft">(optional)</span>
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
              Note <span className="font-medium normal-case tracking-normal text-muted-soft">(optional)</span>
            </label>
            <input
              className="input"
              id="notes"
              name="notes"
              placeholder="High chair, birthday…"
              maxLength={200}
            />
          </div>
        </div>

        {disabled && (
          <div className="rounded-2xl border border-line bg-cream/70 p-4">
            <p className="text-sm font-bold">{disabledTitle}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{disabledNote}</p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-2xl border border-clay/25 bg-clay-soft px-3.5 py-3 text-sm font-medium text-clay-dark"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="btn btn-clay btn-lg w-full" disabled={disabled}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Finding your place…
            </>
          ) : (
            <>
              Join the waitlist <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </fieldset>

      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="live-dot" />
          {estimateMinutes ? `Around ${estimateMinutes} min for a party of 2` : "No wait right now"}
        </span>
        <span>No app. No account.</span>
      </div>
    </form>
  );
}
