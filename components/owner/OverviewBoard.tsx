"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  ArrowUpRight,
  BellRing,
  CheckCircle2,
  CircleDot,
  DoorOpen,
  LayoutGrid,
  Loader2,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  Settings2,
  Sparkles,
  Star,
  UserPlus,
  UserX,
  Users,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";
import { HourlyBars, WeekBars } from "@/components/owner/charts";
import { Mascot } from "@/components/Mascot";
import { Notice, type NoticeState } from "@/components/Notice";
import { useLang } from "@/components/LanguageProvider";
import { dayInTz, formatDayLong, relativeTime } from "@/lib/time";
import { postJson } from "@/lib/client-api";
import { format } from "@/lib/i18n";
import { zoneLabel } from "@/lib/labels";
import type { ActivityItem, OwnerOverview } from "@/lib/types";

type ActivityKey = keyof ReturnType<typeof useLang>["t"]["owner"]["overviewActivity"];

export function OverviewBoard({ initial }: { initial: OwnerOverview }) {
  const router = useRouter();
  const { lang, t } = useLang();
  const [data, setData] = useState(initial);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [pending, startTransition] = useTransition();
  const branchId = initial.branch.id;

  useEffect(() => {
    const timer = window.setInterval(async () => {
      if (document.hidden) return;
      try {
        const response = await fetch(`/api/owner/overview?days=7&branch=${branchId}`, { cache: "no-store" });
        if (response.status === 401) {
          router.push("/login?next=/dashboard");
          return;
        }
        if (response.ok) setData((await response.json()) as OwnerOverview);
      } catch {
        // Keep the last snapshot.
      }
    }, 8000);
    return () => window.clearInterval(timer);
  }, [branchId, router]);

  const { branch, brand, stats, today, week, hourly, activity, tables, waiting } = data;
  const status = branch.waitlistStatus;
  const showFloor = branch.seatingMode === "plan";
  const locale = lang === "id" ? "id-ID" : "en-GB";
  const now = new Date(data.serverNow);
  const todayLabel = formatDayLong(dayInTz(now, branch.timezone), locale);
  const peak = [...hourly].sort((a, b) => b.joined - a.joined)[0];
  const weekTotals = week.reduce(
    (sum, day) => ({
      joined: sum.joined + day.joined,
      seated: sum.seated + day.seated,
      noShow: sum.noShow + day.noShow,
    }),
    { joined: 0, seated: 0, noShow: 0 },
  );

  function toggleQueue() {
    const next = status === "open" ? "paused" : "open";
    startTransition(async () => {
      const result = await postJson("/api/host/action", {
        type: "waitlist",
        branchId,
        status: next,
        reason: next === "paused" ? "Paused from dashboard" : null,
      });
      setNotice({
        message: result.message ?? (result.ok ? t.owner.saved : t.owner.quiet),
        tone: result.ok ? "success" : "error",
      });
      if (result.ok) {
        setData((current) => ({
          ...current,
          branch: { ...current.branch, waitlistStatus: next },
        }));
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-tomato">{t.owner.overviewKicker}</p>
          <h1 className="mt-1 font-display text-[2.5rem] font-semibold leading-none tracking-tight sm:text-[2.8rem]">
            {t.owner.overviewTitle}
          </h1>
          <p className="mt-2 text-sm font-semibold text-muted">
            {brand?.name ? `${brand.name} · ` : ""}
            {branch.name} · {format(t.owner.overviewSub, {
              date: todayLabel,
              open: branch.openTime,
              close: branch.closeTime,
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`pill ${
              status === "open" ? "status-seated" : status === "paused" ? "status-waiting" : "status-muted"
            }`}
          >
            {status === "open" && <span className="live-dot" />}
            {status === "open"
              ? t.owner.waitlistOpen
              : status === "paused"
                ? t.owner.waitlistPaused
                : t.owner.waitlistClosed}
          </span>
          <button
            type="button"
            onClick={toggleQueue}
            disabled={pending}
            className={`btn btn-sm ${status === "open" ? "btn-soft" : "btn-sage"}`}
          >
            {pending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : status === "open" ? (
              <PauseCircle className="size-3.5" />
            ) : (
              <PlayCircle className="size-3.5" />
            )}
            {status === "open" ? t.owner.pauseJoins : t.owner.reopen}
          </button>
          <Link href={`/host?branch=${branch.id}`} className="btn btn-primary btn-sm">
            <DoorOpen className="size-3.5" /> {t.owner.openHost}
          </Link>
        </div>
      </header>

      <div className={`grid gap-3 sm:grid-cols-2 ${showFloor ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
        <Kpi
          label={t.owner.waitingNow}
          value={stats.waiting}
          hint={format(t.owner.waitingHint, { called: stats.called })}
          icon={Users}
          tone="pink"
        />
        <Kpi
          label={t.owner.calledNow}
          value={stats.called}
          hint={format(t.owner.calledHint, { count: stats.called })}
          icon={BellRing}
          tone="butter"
        />
        <Kpi
          label={t.owner.seatedToday}
          value={stats.seatedToday}
          hint={format(t.owner.seatedHint, { joined: stats.joinedToday, seated: stats.seated })}
          icon={UtensilsCrossed}
          tone="leaf"
        />
        {showFloor && (
          <Kpi
            label={t.host.tablesFreeLabel}
            value={`${stats.availableTables}/${stats.totalTables}`}
            hint={format(t.owner.floorSummary, {
              free: stats.availableTables,
              seated: stats.seated,
              dirty: stats.dirtyTables,
            })}
            icon={LayoutGrid}
            tone="white"
          />
        )}
      </div>

      <div className={`grid gap-4 ${showFloor ? "xl:grid-cols-[1.55fr_1fr]" : ""}`}>
        <section className="card p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-[1.5rem] font-semibold leading-tight">{t.owner.servicePulse}</h2>
              <p className="mt-0.5 text-xs font-semibold text-muted">{t.owner.servicePulseSub}</p>
            </div>
            <div className="flex items-center gap-3 text-[0.6875rem] font-bold text-muted">
              <span>{format(t.owner.peak, { hour: String(peak?.hour ?? 0).padStart(2, "0") })}</span>
              <span className="rounded-full border-2 border-ink bg-butter px-2 py-1">{t.owner.today}</span>
            </div>
          </div>
          <div className="mt-5">
            <HourlyBars points={hourly} />
          </div>
          <div className="mt-4 grid grid-cols-3 divide-x-2 divide-ink/10 border-t-2 border-dashed border-ink/15 pt-3 text-center">
            <div>
              <p className="num font-display text-xl font-semibold">{stats.joinedToday}</p>
              <p className="text-[0.625rem] font-extrabold uppercase tracking-[0.12em] text-muted">{t.owner.joined}</p>
            </div>
            <div>
              <p className="num font-display text-xl font-semibold">{stats.seatedToday}</p>
              <p className="text-[0.625rem] font-extrabold uppercase tracking-[0.12em] text-muted">{t.owner.seated}</p>
            </div>
            <div>
              <p className="num font-display text-xl font-semibold">{today.walkIns}</p>
              <p className="text-[0.625rem] font-extrabold uppercase tracking-[0.12em] text-muted">{t.owner.walkIns}</p>
            </div>
          </div>
        </section>

        {showFloor && (
          <section className="card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-[1.5rem] font-semibold leading-tight">{t.owner.floorNow}</h2>
                <p className="mt-0.5 text-xs font-semibold text-muted">
                  {format(t.owner.floorSummary, {
                    free: stats.availableTables,
                    seated: stats.seated,
                    dirty: stats.dirtyTables,
                  })}
                </p>
              </div>
              <Link href={`/host?branch=${branch.id}`} className="btn btn-ghost btn-icon" aria-label={t.owner.openHost}>
                <ArrowUpRight className="size-4" />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {[...new Set(tables.map((table) => table.zone))].map((zone) => {
                const zoneTables = tables.filter((table) => table.zone === zone);
                return (
                  <div key={zone}>
                    <p className="mb-1 text-[0.5625rem] font-extrabold uppercase tracking-[0.14em] text-ink/40">
                      {zoneLabel(zone, lang)}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {zoneTables.map((table) => {
                        const color =
                          table.status === "available"
                            ? "bg-leaf"
                            : table.status === "seated"
                              ? "bg-tomato"
                              : table.status === "dirty"
                                ? "bg-gold"
                                : "bg-muted-soft";
                        return (
                          <div
                            key={table.id}
                            className="flex items-center gap-2 rounded-lg border-2 border-ink/15 bg-white px-2 py-1.5"
                            title={`${table.zone} · ${table.capacity} ${t.owner.seats}`}
                          >
                            <span className={`size-1.5 shrink-0 rounded-full ${color}`} />
                            <span className="num text-[0.6875rem] font-extrabold">{table.label}</span>
                            <span className="ml-auto text-[0.625rem] font-bold text-muted">
                              {table.capacity} {t.common.paxShort}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t-2 border-dashed border-ink/15 pt-3 text-[0.625rem] font-bold text-muted">
              <Legend className="bg-leaf" label={t.owner.openLegend} />
              <Legend className="bg-tomato" label={t.owner.seatedLegend} />
              <Legend className="bg-gold" label={t.owner.resetLegend} />
              <Legend className="bg-muted-soft" label={t.owner.blockedLegend} />
            </div>
          </section>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-[1.5rem] font-semibold leading-tight">{t.owner.inLine}</h2>
              <p className="mt-0.5 text-xs font-semibold text-muted">
                {format(t.owner.inLineSub, { count: waiting.length })}
              </p>
            </div>
            <Link href={`/host?branch=${branch.id}`} className="btn btn-soft btn-sm">
              {t.owner.workLine} <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="mt-3">
            {waiting.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-ink/30 bg-cream/60 px-4 py-7 text-center">
                <Mascot mood="calm" className="mx-auto w-24" />
                <p className="mt-1 font-display text-lg">{t.owner.nobodyWaiting}</p>
                <p className="mt-1 text-xs font-semibold text-muted">{t.owner.nobodyWaitingSub}</p>
              </div>
            ) : (
              <div className="divide-y-2 divide-dashed divide-ink/10">
                {waiting.slice(0, 6).map((entry, index) => (
                  <div key={entry.id} className="flex items-center gap-3 py-2.5">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-ink bg-cream font-display text-xs font-semibold">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold">{entry.guestName}</p>
                      <p className="text-[0.6875rem] font-semibold text-muted">
                        {entry.code} · {entry.partySize} {t.guest.guestUnit}
                      </p>
                    </div>
                    {index === 0 && <span className="pill status-waiting">{t.owner.next}</span>}
                    {entry.notes && (
                      <span className="hidden max-w-[9rem] truncate text-[0.625rem] font-medium text-muted sm:block" title={entry.notes}>
                        {entry.notes}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-[1.5rem] font-semibold leading-tight">{t.owner.activity}</h2>
              <p className="mt-0.5 text-xs font-semibold text-muted">{t.owner.activitySub}</p>
            </div>
            <span className="pill status-muted">{t.owner.live}</span>
          </div>

          <div className="mt-3 max-h-[21rem] space-y-3 overflow-y-auto pr-1">
            {activity.length === 0 ? (
              <p className="py-6 text-center text-xs font-semibold text-muted">{t.owner.quiet}</p>
            ) : (
              activity.map((item) => (
                <div key={item.id} className="flex gap-2.5">
                  <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 border-ink ${activityTone(item.type)}`}>
                    {activityIcon(item.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-snug text-ink/85">{activityText(item, t)}</p>
                    <p className="mt-0.5 text-[0.625rem] font-semibold text-muted">
                      {item.actor === "System" ? t.owner.system : item.actor === "Guest" ? t.owner.guest : item.actor ?? t.owner.system} ·{" "}
                      {relativeTime(item.createdAt, now, lang)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="card p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-[1.5rem] font-semibold leading-tight">{t.owner.last7}</h2>
              <p className="mt-0.5 text-xs font-semibold text-muted">
                {format(t.owner.last7Summary, { joined: weekTotals.joined, seated: weekTotals.seated })}
              </p>
            </div>
            <Link href={`/dashboard/reports?branch=${branch.id}`} className="btn btn-ghost btn-sm">
              {t.owner.fullReports} <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <div className="mt-4">
            <WeekBars days={week} />
          </div>
        </section>

        <section className="card p-4 sm:p-5">
          <h2 className="font-display text-[1.5rem] font-semibold leading-tight">{t.owner.pacing}</h2>
          <div className="mt-3 space-y-2.5">
            <Pacing label={t.owner.noShows} value={String(stats.noShowToday)} />
            {showFloor && <Pacing label={t.owner.floorOccupancy} value={`${today.utilization}%`} />}
            <Pacing label={t.owner.walkInsPacing} value={`${today.walkIns} / ${stats.joinedToday}`} />
            <Pacing label={t.owner.remoteJoins} value={String(today.remote)} />
            <Pacing label={t.owner.cancelled} value={String(today.cancelled)} />
          </div>
        </section>
      </div>

      <Notice notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: typeof Users;
  tone: "pink" | "butter" | "leaf" | "white";
}) {
  const tones = {
    pink: { bg: "bg-pink", icon: "bg-tomato text-white" },
    butter: { bg: "bg-cream", icon: "bg-white text-ink" },
    leaf: { bg: "bg-leaf-soft", icon: "bg-leaf text-white" },
    white: { bg: "bg-white", icon: "bg-cream text-ink" },
  }[tone];

  return (
    <div className={`rounded-2xl border-2 border-ink p-4 shadow-[3px_3px_0_#262321] ${tones.bg}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[0.625rem] font-extrabold uppercase leading-tight tracking-[0.12em] text-ink/55">{label}</p>
        <span className={`grid size-7 place-items-center rounded-full border-2 border-ink ${tones.icon}`}>
          <Icon className="size-3.5" />
        </span>
      </div>
      <p className="stat-number mt-3 text-[2.7rem]">{value}</p>
      <p className="mt-2 text-[0.6875rem] font-semibold leading-relaxed text-ink/55">{hint}</p>
    </div>
  );
}

function Pacing({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b-2 border-dashed border-ink/10 pb-2 text-xs font-semibold last:border-0 last:pb-0">
      <span className="text-muted">{label}</span>
      <span className="num font-extrabold">{value}</span>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-1.5 rounded-full ${className}`} /> {label}
    </span>
  );
}

function activityTone(type: string): string {
  if (type === "join" || type === "walkin" || type === "requeue") return "bg-butter text-gold";
  if (type === "call" || type === "extend" || type === "acknowledge" || type === "recall") return "bg-pink text-tomato-dark";
  if (type === "seat" || type === "complete" || type === "release" || type === "ready" || type === "rating") return "bg-leaf-soft text-leaf-dark";
  if (type === "no_show") return "bg-pink text-tomato-dark";
  if (type === "clear") return "bg-cream text-ink/70";
  return "bg-cream text-ink/60";
}

function activityIcon(type: string) {
  const className = "size-3.5";
  switch (type) {
    case "join":
    case "walkin":
      return <UserPlus className={className} />;
    case "call":
    case "recall":
      return <BellRing className={className} />;
    case "requeue":
      return <RotateCcw className={className} />;
    case "rating":
      return <Star className={className} />;
    case "seat":
      return <UtensilsCrossed className={className} />;
    case "complete":
    case "release":
      return <CheckCircle2 className={className} />;
    case "no_show":
      return <UserX className={className} />;
    case "cancel":
      return <XCircle className={className} />;
    case "clear":
    case "ready":
      return <Sparkles className={className} />;
    case "settings":
      return <Settings2 className={className} />;
    case "waitlist":
      return <PauseCircle className={className} />;
    default:
      return <CircleDot className={className} />;
  }
}

function activityText(item: ActivityItem, t: ReturnType<typeof useLang>["t"]): string {
  const map = t.owner.overviewActivity;
  const suffix = map[item.type as ActivityKey] ?? item.type.replace(/_/g, " ");
  if (item.name) {
    const where = item.tableLabel
      ? ` · ${item.tableLabel}${item.seatNumber ? ` / ${item.seatNumber}` : ""}`
      : "";
    return `${item.code ? `${item.code} · ` : ""}${item.name} ${suffix}${where}`;
  }
  if (item.tableLabel) return `${item.tableLabel}${item.seatNumber ? ` / ${item.seatNumber}` : ""} ${suffix}`;
  return suffix;
}
