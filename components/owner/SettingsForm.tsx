"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, PauseCircle, PlayCircle, Save, Store } from "lucide-react";
import { Notice, type NoticeState } from "@/components/Notice";
import { useLang } from "@/components/LanguageProvider";
import { postJson } from "@/lib/client-api";
import { format } from "@/lib/i18n";
import type { Branch } from "@/lib/types";

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

export function SettingsForm({ branch }: { branch: Branch }) {
  const router = useRouter();
  const { lang, t } = useLang();
  const [state, setState] = useState<{ ok?: boolean; message?: string }>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [waitlistPending, startTransition] = useTransition();
  const status = branch.waitlistStatus;

  function toggleWaitlist() {
    startTransition(async () => {
      const next = status === "open" ? "paused" : "open";
      const result = await postJson("/api/owner/action", {
        type: "waitlist",
        branchId: branch.id,
        status: next,
        reason: next === "paused" ? "Paused from dashboard" : null,
      });
      setNotice({
        message: result.message ?? (result.ok ? t.owner.saved : t.owner.quiet),
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
      branchId: branch.id,
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
      avgTurnMinutes: branch.avgTurnMinutes,
      holdMinutes: branch.holdMinutes,
      maxPartySize: Number(form.get("maxPartySize")),
      maxQueueSize: Number(form.get("maxQueueSize")),
      autoNoShow: form.get("autoNoShow") === "on",
    });
    setSaving(false);
    setState({ ok: result.ok, message: result.ok ? t.owner.saved : result.message });
    if (result.ok) router.refresh();
  }

  const zoneOptions = TIMEZONES.some((zone) => zone.value === branch.timezone)
    ? TIMEZONES
    : [{ value: branch.timezone, label: branch.timezone }, ...TIMEZONES];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-tomato">{t.owner.settingsKicker}</p>
          <h1 className="mt-1 font-display text-[2.5rem] font-semibold leading-none tracking-tight">{t.owner.settingsTitle}</h1>
          <p className="mt-2 text-sm font-semibold text-muted">{t.owner.settingsSub}</p>
        </div>
        <span
          className={`pill ${
            status === "open" ? "status-seated" : status === "paused" ? "status-waiting" : "status-muted"
          }`}
        >
          {status === "open" ? t.owner.waitlistOpen : status === "paused" ? t.owner.waitlistPaused : t.owner.waitlistClosed}
        </span>
      </header>

      <section className="card flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
        <div>
          <h2 className="font-display text-[1.5rem] font-semibold leading-tight">{t.owner.waitlistControl}</h2>
          <p className="mt-0.5 max-w-lg text-xs font-semibold leading-relaxed text-muted">{t.owner.waitlistControlSub}</p>
        </div>
        <button
          type="button"
          className={`btn btn-sm ${status === "open" ? "btn-soft" : "btn-sage"}`}
          onClick={toggleWaitlist}
          disabled={waitlistPending}
        >
          {waitlistPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : status === "open" ? (
            <PauseCircle className="size-3.5" />
          ) : (
            <PlayCircle className="size-3.5" />
          )}
          {status === "open" ? t.owner.pauseJoins : t.owner.reopen}
        </button>
      </section>

      <form onSubmit={onSubmit} className="space-y-5">
        <section className="card p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="font-display text-[1.5rem] font-semibold leading-tight">{t.owner.identity}</h2>
            <p className="text-xs font-semibold text-muted">{t.owner.identitySub}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">{t.owner.restaurantName}</label>
              <input id="name" name="name" className="input" defaultValue={branch.name} required maxLength={80} />
            </div>
            <div>
              <label className="label" htmlFor="tagline">{t.owner.tagline}</label>
              <input id="tagline" name="tagline" className="input" defaultValue={branch.tagline ?? ""} maxLength={120} placeholder="Ramen & Izakaya · Senopati" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="address">{t.owner.address}</label>
              <input id="address" name="address" className="input" defaultValue={branch.address ?? ""} maxLength={200} />
            </div>
            <div>
              <label className="label" htmlFor="phone">{t.owner.phone}</label>
              <input id="phone" name="phone" className="input" defaultValue={branch.phone ?? ""} maxLength={40} />
            </div>
            <div className="flex items-end">
              <Link href="/dashboard/brands" className="btn btn-soft btn-sm w-full justify-center">
                <Store className="size-3.5" /> {t.owner.manageBrand}
              </Link>
            </div>
            <div>
              <label className="label" htmlFor="accent">{t.owner.accent}</label>
              <div className="flex items-center gap-2">
                <input
                  id="accent"
                  name="accent"
                  type="color"
                  defaultValue={branch.accent}
                  className="h-11 w-14 cursor-pointer rounded-xl border-2 border-ink bg-white p-1"
                />
                <span className="text-xs font-semibold text-muted">{t.owner.accentHint}</span>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="timezone">{t.owner.timezone}</label>
              <select id="timezone" name="timezone" className="input bg-white" defaultValue={branch.timezone}>
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
            <h2 className="font-display text-[1.5rem] font-semibold leading-tight">{t.owner.serviceWindow}</h2>
            <p className="text-xs font-semibold text-muted">{t.owner.serviceWindowSub}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label" htmlFor="openTime">{t.owner.opens}</label>
              <input id="openTime" name="openTime" type="time" className="input num" defaultValue={branch.openTime} required />
            </div>
            <div>
              <label className="label" htmlFor="closeTime">{t.owner.closes}</label>
              <input id="closeTime" name="closeTime" type="time" className="input num" defaultValue={branch.closeTime} required />
            </div>
            <div>
              <label className="label" htmlFor="maxPartySize">{t.owner.maxParty}</label>
              <input id="maxPartySize" name="maxPartySize" type="number" min={1} max={40} className="input num" defaultValue={branch.maxPartySize} />
            </div>
            <div>
              <label className="label" htmlFor="maxQueueSize">{t.owner.queueCap}</label>
              <input id="maxQueueSize" name="maxQueueSize" type="number" min={1} max={500} className="input num" defaultValue={branch.maxQueueSize} />
            </div>
          </div>

          <label className="mt-4 flex items-start gap-3 rounded-xl border-2 border-ink bg-cream px-3.5 py-3">
            <input
              type="checkbox"
              name="autoNoShow"
              defaultChecked={branch.autoNoShow}
              className="mt-0.5 size-4 accent-[#F24B3F]"
            />
            <span>
              <span className="block text-sm font-extrabold">{t.owner.autoNoShow}</span>
              <span className="mt-0.5 block text-xs font-semibold leading-relaxed text-muted">{t.owner.autoNoShowBody}</span>
            </span>
          </label>
        </section>

        <section className="card p-4 sm:p-5">
          <div className="mb-3">
            <h2 className="font-display text-[1.5rem] font-semibold leading-tight">{t.owner.announcement}</h2>
            <p className="text-xs font-semibold text-muted">{t.owner.announcementSub}</p>
          </div>
          <textarea
            name="announcement"
            className="input min-h-24 resize-y"
            defaultValue={branch.announcement ?? ""}
            maxLength={300}
            placeholder={t.owner.announcementPlaceholder}
          />
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-white px-4 py-3 shadow-[3px_3px_0_#262321]">
          <div className="text-xs font-semibold text-muted">
            {format(t.owner.lastSaved, {
              time: new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-GB", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: branch.timezone,
              }).format(new Date(branch.updatedAt)),
            })}
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} {t.owner.saveSettings}
          </button>
        </div>

        {state.message && (
          <div
            role="status"
            className={`flex items-start gap-2 rounded-xl border-2 border-ink px-3.5 py-3 text-sm font-semibold ${
              state.ok ? "bg-leaf-soft text-leaf-dark" : "bg-pink text-tomato-dark"
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
