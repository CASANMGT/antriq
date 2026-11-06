"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, PauseCircle, PlayCircle, Save } from "lucide-react";
import { Notice, type NoticeState } from "@/components/Notice";
import { postJson } from "@/lib/client-api";
import type { Restaurant } from "@/lib/types";

const TIMEZONES = [
  { value: "Asia/Jakarta", label: "Jakarta · WIB (UTC+7)" },
  { value: "Asia/Makassar", label: "Makassar · WITA (UTC+8)" },
  { value: "Asia/Jayapura", label: "Jayapura · WIT (UTC+9)" },
  { value: "Asia/Singapore", label: "Singapore (UTC+8)" },
  { value: "Asia/Bangkok", label: "Bangkok (UTC+7)" },
  { value: "Asia/Kuala_Lumpur", label: "Kuala Lumpur (UTC+8)" },
  { value: "Asia/Manila", label: "Manila (UTC+8)" },
  { value: "Australia/Sydney", label: "Sydney" },
  { value: "Europe/London", label: "London" },
  { value: "America/New_York", label: "New York" },
];

export function SettingsForm({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter();
  const [state, setState] = useState<{ ok?: boolean; message?: string }>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [waitlistPending, startTransition] = useTransition();
  const status = restaurant.waitlistStatus;

  function toggleWaitlist() {
    startTransition(async () => {
      const next = status === "open" ? "paused" : "open";
      const result = await postJson("/api/owner/action", {
        type: "waitlist",
        status: next,
        reason: next === "paused" ? "Paused from dashboard" : null,
      });
      setNotice({
        message: result.message ?? (result.ok ? "Waitlist updated." : "Could not update the waitlist."),
        tone: result.ok ? "success" : "error",
      });
      if (result.ok) router.refresh();
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setState({});
    const result = await postJson("/api/owner/action", {
      type: "settings",
      name: String(form.get("name") ?? ""),
      tagline: String(form.get("tagline") ?? ""),
      address: String(form.get("address") ?? ""),
      phone: String(form.get("phone") ?? ""),
      instagram: String(form.get("instagram") ?? ""),
      openTime: String(form.get("openTime") ?? ""),
      closeTime: String(form.get("closeTime") ?? ""),
      accent: String(form.get("accent") ?? ""),
      announcement: String(form.get("announcement") ?? ""),
      timezone: String(form.get("timezone") ?? ""),
      avgTurnMinutes: Number(form.get("avgTurnMinutes")),
      holdMinutes: Number(form.get("holdMinutes")),
      maxPartySize: Number(form.get("maxPartySize")),
      maxQueueSize: Number(form.get("maxQueueSize")),
      autoNoShow: form.get("autoNoShow") === "on",
    });
    setSaving(false);
    setState({ ok: result.ok, message: result.message });
    if (result.ok) router.refresh();
  }

  const zoneOptions = TIMEZONES.some((zone) => zone.value === restaurant.timezone)
    ? TIMEZONES
    : [{ value: restaurant.timezone, label: restaurant.timezone }, ...TIMEZONES];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-clay">Restaurant</p>
          <h1 className="mt-1 font-display text-[2.3rem] leading-none tracking-tight">Settings</h1>
          <p className="mt-2 text-sm text-muted">
            Guest-facing details, the hold policy, and how the floor calculates waits.
          </p>
        </div>
        <span className={`pill ${status === "open" ? "status-seated" : status === "paused" ? "status-waiting" : "status-muted"}`}>
          Waitlist {status}
        </span>
      </header>

      <section className="card flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
        <div>
          <h2 className="font-display text-xl leading-tight">Waitlist control</h2>
          <p className="mt-0.5 max-w-lg text-xs leading-relaxed text-muted">
            Pausing stops new joins but keeps every existing ticket alive. Reopening is instant — the guest
            page and host stand update on their next refresh.
          </p>
        </div>
        <button type="button" className={`btn btn-sm ${status === "open" ? "btn-soft" : "btn-sage"}`} onClick={toggleWaitlist} disabled={waitlistPending}>
          {waitlistPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : status === "open" ? (
            <PauseCircle className="size-3.5" />
          ) : (
            <PlayCircle className="size-3.5" />
          )}
          {status === "open" ? "Pause new joins" : "Reopen waitlist"}
        </button>
      </section>

      <form onSubmit={onSubmit} className="space-y-5">
        <section className="card p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="font-display text-xl leading-tight">Identity</h2>
            <p className="text-xs text-muted">How the restaurant shows up on the guest page and ticket.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">Restaurant name</label>
              <input id="name" name="name" className="input" defaultValue={restaurant.name} required maxLength={80} />
            </div>
            <div>
              <label className="label" htmlFor="tagline">Tagline</label>
              <input id="tagline" name="tagline" className="input" defaultValue={restaurant.tagline ?? ""} maxLength={120} placeholder="Wood-fired bistro · Senopati" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="address">Address</label>
              <input id="address" name="address" className="input" defaultValue={restaurant.address ?? ""} maxLength={200} />
            </div>
            <div>
              <label className="label" htmlFor="phone">Phone</label>
              <input id="phone" name="phone" className="input" defaultValue={restaurant.phone ?? ""} maxLength={40} />
            </div>
            <div>
              <label className="label" htmlFor="instagram">Instagram</label>
              <input id="instagram" name="instagram" className="input" defaultValue={restaurant.instagram ?? ""} maxLength={60} placeholder="@restaurant" />
            </div>
            <div>
              <label className="label" htmlFor="accent">Accent colour</label>
              <div className="flex items-center gap-2">
                <input
                  id="accent"
                  name="accent"
                  type="color"
                  defaultValue={restaurant.accent}
                  className="h-11 w-14 cursor-pointer rounded-xl border border-line bg-white p-1"
                />
                <span className="text-xs text-muted">Used on the ticket band and highlights.</span>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="timezone">Timezone</label>
              <select id="timezone" name="timezone" className="input bg-white" defaultValue={restaurant.timezone}>
                {zoneOptions.map((zone) => (
                  <option key={zone.value} value={zone.value}>
                    {zone.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="card p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="font-display text-xl leading-tight">Service window &amp; policy</h2>
            <p className="text-xs text-muted">Times are shown to guests in the restaurant timezone.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="label" htmlFor="openTime">Opens</label>
              <input id="openTime" name="openTime" type="time" className="input num" defaultValue={restaurant.openTime} required />
            </div>
            <div>
              <label className="label" htmlFor="closeTime">Closes</label>
              <input id="closeTime" name="closeTime" type="time" className="input num" defaultValue={restaurant.closeTime} required />
            </div>
            <div>
              <label className="label" htmlFor="avgTurnMinutes">Avg table turn (min)</label>
              <input id="avgTurnMinutes" name="avgTurnMinutes" type="number" min={10} max={240} className="input num" defaultValue={restaurant.avgTurnMinutes} />
            </div>
            <div>
              <label className="label" htmlFor="holdMinutes">Hold when called (min)</label>
              <input id="holdMinutes" name="holdMinutes" type="number" min={2} max={30} className="input num" defaultValue={restaurant.holdMinutes} />
            </div>
            <div>
              <label className="label" htmlFor="maxPartySize">Largest party</label>
              <input id="maxPartySize" name="maxPartySize" type="number" min={1} max={40} className="input num" defaultValue={restaurant.maxPartySize} />
            </div>
            <div>
              <label className="label" htmlFor="maxQueueSize">Waitlist cap</label>
              <input id="maxQueueSize" name="maxQueueSize" type="number" min={1} max={500} className="input num" defaultValue={restaurant.maxQueueSize} />
            </div>
          </div>

          <label className="mt-4 flex items-start gap-3 rounded-xl border border-line bg-white px-3.5 py-3">
            <input
              type="checkbox"
              name="autoNoShow"
              defaultChecked={restaurant.autoNoShow}
              className="mt-0.5 size-4 accent-[#C8452B]"
            />
            <span>
              <span className="block text-sm font-bold">Auto-release expired holds</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                If a called guest doesn&apos;t answer within the hold window, the ticket becomes a no-show and
                the table can go to the next party. Turn off to handle every no-show manually.
              </span>
            </span>
          </label>
        </section>

        <section className="card p-4 sm:p-5">
          <div className="mb-3">
            <h2 className="font-display text-xl leading-tight">Guest announcement</h2>
            <p className="text-xs text-muted">A short note on the join card — house rules, tonight&apos;s menu, anything useful.</p>
          </div>
          <textarea
            name="announcement"
            className="input min-h-24 resize-y"
            defaultValue={restaurant.announcement ?? ""}
            maxLength={300}
            placeholder="Welcome! Join the waitlist and we'll let you know the moment your table is ready."
          />
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3">
          <div className="text-xs text-muted">
            Last saved{" "}
            {new Intl.DateTimeFormat("en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: restaurant.timezone,
            }).format(new Date(restaurant.updatedAt))}
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save settings
          </button>
        </div>

        {state.message && (
          <div
            role="status"
            className={`flex items-start gap-2 rounded-xl border px-3.5 py-3 text-sm ${
              state.ok
                ? "border-sage/25 bg-sage-soft text-sage-dark"
                : "border-clay/25 bg-clay-soft text-clay-dark"
            }`}
          >
            {state.ok && <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
            <span>{state.message}</span>
          </div>
        )}
      </form>

      <Notice notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
