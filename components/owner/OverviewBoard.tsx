"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BellRing,
  CheckCircle2,
  CircleDot,
  Clock3,
  DoorOpen,
  PauseCircle,
  Settings2,
  Sparkles,
  UserPlus,
  UserX,
  Users,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";
import { HourlyBars, WeekBars } from "@/components/owner/charts";
import { dayInTz, formatDayLong, humanizeMinutes, relativeTime } from "@/lib/time";
import type { ActivityItem, OwnerOverview } from "@/lib/types";

export function OverviewBoard({ initial }: { initial: OwnerOverview }) {
  const router = useRouter();
  const [data, setData] = useState(initial);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      if (document.hidden) return;
      try {
        const response = await fetch("/api/owner/overview?days=7", { cache: "no-store" });
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
  }, [router]);

  const { restaurant, stats, today, week, hourly, activity, tables, waiting } = data;
  const status = restaurant.waitlistStatus;
  const todayLabel = formatDayLong(dayInTz(new Date(), restaurant.timezone));
  const peak = [...hourly].sort((a, b) => b.joined - a.joined)[0];
  const weekTotals = week.reduce(
    (sum, day) => ({
      joined: sum.joined + day.joined,
      seated: sum.seated + day.seated,
      noShow: sum.noShow + day.noShow,
    }),
    { joined: 0, seated: 0, noShow: 0 },
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-clay">Owner dashboard</p>
          <h1 className="mt-1 font-display text-[2.3rem] leading-none tracking-tight sm:text-[2.6rem]">
            Service overview
          </h1>
          <p className="mt-2 text-sm text-muted">
            {todayLabel} · {restaurant.openTime}–{restaurant.closeTime} · updates every 8 seconds
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`pill ${status === "open" ? "status-seated" : status === "paused" ? "status-waiting" : "status-muted"}`}>
            {status === "open" && <span className="live-dot" />}
            Waitlist {status}
          </span>
          <Link href="/host" className="btn btn-primary btn-sm">
            <DoorOpen className="size-3.5" /> Open host stand
          </Link>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Waiting now"
          value={stats.waiting}
          hint={`${stats.called} at the door · ${stats.longestWaitMinutes ? `longest ${stats.longestWaitMinutes}m` : "line clear"}`}
          icon={Users}
          tone="gold"
        />
        <Kpi
          label="Average wait"
          value={`${today.avgWaitMinutes || 0}m`}
          hint={`${today.completed} visits completed today`}
          icon={Clock3}
          tone="clay"
        />
        <Kpi
          label="Seated today"
          value={stats.seatedToday}
          hint={`${stats.joinedToday} joined · ${stats.seated} at tables now`}
          icon={UtensilsCrossed}
          tone="sage"
        />
        <Kpi
          label="No-show rate"
          value={`${today.noShowRate}%`}
          hint={`${stats.noShowToday} no-shows · hold ${restaurant.holdMinutes}m`}
          icon={UserX}
          tone="ink"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <section className="card p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl leading-tight">Service pulse</h2>
              <p className="mt-0.5 text-xs text-muted">Guests joining vs parties seated, by hour</p>
            </div>
            <div className="flex items-center gap-3 text-[0.6875rem] text-muted">
              <span>Peak {String(peak?.hour ?? 0).padStart(2, "0")}:00</span>
              <span className="rounded-full border border-line px-2 py-1 font-semibold">Today</span>
            </div>
          </div>
          <div className="mt-5">
            <HourlyBars points={hourly} />
          </div>
          <div className="mt-4 grid grid-cols-3 divide-x divide-line border-t border-line pt-3 text-center">
            <div>
              <p className="num text-lg font-extrabold">{stats.joinedToday}</p>
              <p className="text-[0.625rem] uppercase tracking-[0.12em] text-muted">joined</p>
            </div>
            <div>
              <p className="num text-lg font-extrabold">{stats.seatedToday}</p>
              <p className="text-[0.625rem] uppercase tracking-[0.12em] text-muted">seated</p>
            </div>
            <div>
              <p className="num text-lg font-extrabold">{today.walkIns}</p>
              <p className="text-[0.625rem] uppercase tracking-[0.12em] text-muted">walk-ins</p>
            </div>
          </div>
        </section>

        <section className="card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-xl leading-tight">Floor right now</h2>
              <p className="mt-0.5 text-xs text-muted">
                {stats.availableTables} open · {stats.seated} seated · {stats.dirtyTables} to reset
              </p>
            </div>
            <Link href="/host" className="btn btn-ghost btn-icon" aria-label="Open host stand">
              <ArrowUpRight className="size-4" />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {[...new Set(tables.map((table) => table.zone))].map((zone) => {
              const zoneTables = tables.filter((table) => table.zone === zone);
              return (
                <div key={zone}>
                  <p className="mb-1 text-[0.5625rem] font-bold uppercase tracking-[0.14em] text-muted-soft">
                    {zone}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {zoneTables.map((table) => {
                      const color =
                        table.status === "available"
                          ? "bg-sage"
                          : table.status === "seated"
                            ? "bg-clay"
                            : table.status === "dirty"
                              ? "bg-gold"
                              : "bg-muted-soft";
                      return (
                        <div
                          key={table.id}
                          className="flex items-center gap-2 rounded-lg border border-line bg-white px-2 py-1.5"
                          title={`${table.zone} · seats ${table.capacity}`}
                        >
                          <span className={`size-1.5 shrink-0 rounded-full ${color}`} />
                          <span className="num text-[0.6875rem] font-bold">{table.label}</span>
                          <span className="ml-auto text-[0.625rem] text-muted">{table.capacity}p</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-line pt-3 text-[0.625rem] text-muted">
            <Legend className="bg-sage" label="Open" />
            <Legend className="bg-clay" label="Seated" />
            <Legend className="bg-gold" label="Reset" />
            <Legend className="bg-muted-soft" label="Blocked" />
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-xl leading-tight">In line right now</h2>
              <p className="mt-0.5 text-xs text-muted">
                {waiting.length} waiting · next call in order
              </p>
            </div>
            <Link href="/host" className="btn btn-soft btn-sm">
              Work the line <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="mt-3">
            {waiting.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-cream/40 px-4 py-8 text-center">
                <p className="font-display text-lg">Nobody waiting</p>
                <p className="mt-1 text-xs text-muted">The host stand is clear. A good time to reset the floor.</p>
              </div>
            ) : (
              <div className="divide-y divide-line">
                {waiting.slice(0, 6).map((entry, index) => (
                  <div key={entry.id} className="flex items-center gap-3 py-2.5">
                    <span className="num w-5 text-xs font-bold text-muted-soft">{String(index + 1).padStart(2, "0")}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{entry.guestName}</p>
                      <p className="text-[0.6875rem] text-muted">
                        {entry.code} · {entry.partySize} guests · waited {humanizeMinutes(entry.waitMinutes)}
                      </p>
                    </div>
                    {index === 0 && <span className="pill status-waiting">Next</span>}
                    {entry.notes && (
                      <span className="hidden max-w-[9rem] truncate text-[0.625rem] text-muted sm:block" title={entry.notes}>
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
              <h2 className="font-display text-xl leading-tight">Activity</h2>
              <p className="mt-0.5 text-xs text-muted">The last few moves on the floor</p>
            </div>
            <span className="pill status-muted">Live</span>
          </div>

          <div className="mt-3 max-h-[21rem] space-y-3 overflow-y-auto pr-1">
            {activity.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted">Quiet so far today.</p>
            ) : (
              activity.map((item) => (
                <div key={item.id} className="flex gap-2.5">
                  <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full ${activityTone(item.type)}`}>
                    {activityIcon(item.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-snug text-ink/85">{activityText(item)}</p>
                    <p className="mt-0.5 text-[0.625rem] text-muted">
                      {item.actor ?? "System"} · {relativeTime(item.createdAt)}
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
              <h2 className="font-display text-xl leading-tight">Last 7 days</h2>
              <p className="mt-0.5 text-xs text-muted">
                {weekTotals.joined} joined · {weekTotals.seated} seated
              </p>
            </div>
            <Link href="/dashboard/reports" className="btn btn-ghost btn-sm">
              Full reports <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <div className="mt-4">
            <WeekBars days={week} />
          </div>
        </section>

        <section className="card p-4 sm:p-5">
          <h2 className="font-display text-xl leading-tight">Today&apos;s pacing</h2>
          <div className="mt-3 space-y-2.5">
            <Pacing label="Average turn" value={humanizeMinutes(today.avgTurnMinutes)} />
            <Pacing label="Floor occupancy" value={`${today.utilization}%`} />
            <Pacing label="Walk-ins" value={`${today.walkIns} of ${stats.joinedToday}`} />
            <Pacing label="Remote joins" value={String(today.remote)} />
            <Pacing label="Cancelled" value={String(today.cancelled)} />
            <Pacing label="No-shows" value={String(stats.noShowToday)} />
          </div>
        </section>
      </div>
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
  tone: "clay" | "sage" | "gold" | "ink";
}) {
  const tones = {
    clay: { bar: "bg-clay", icon: "bg-clay-soft text-clay-dark" },
    sage: { bar: "bg-sage", icon: "bg-sage-soft text-sage-dark" },
    gold: { bar: "bg-gold", icon: "bg-gold-soft text-gold" },
    ink: { bar: "bg-ink", icon: "bg-cream text-ink" },
  }[tone];

  return (
    <div className="card relative overflow-hidden p-4">
      <span className={`absolute inset-x-0 top-0 h-1 ${tones.bar}`} />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
        <span className={`grid size-7 place-items-center rounded-full ${tones.icon}`}>
          <Icon className="size-3.5" />
        </span>
      </div>
      <p className="stat-number mt-3 text-4xl">{value}</p>
      <p className="mt-2 text-[0.6875rem] leading-relaxed text-muted">{hint}</p>
    </div>
  );
}

function Pacing({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line/70 pb-2 text-xs last:border-0 last:pb-0">
      <span className="text-muted">{label}</span>
      <span className="num font-bold">{value}</span>
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
  if (type === "join" || type === "walkin") return "bg-gold-soft text-gold";
  if (type === "call" || type === "extend" || type === "acknowledge") return "bg-clay-soft text-clay-dark";
  if (type === "seat" || type === "acknowledge") return "bg-sage-soft text-sage-dark";
  if (type === "complete" || type === "ready") return "bg-sage-soft text-sage-dark";
  if (type === "no_show") return "bg-clay-soft text-clay-dark";
  if (type === "clear") return "bg-cream text-ink/70";
  return "bg-cream text-ink/60";
}

function activityIcon(type: string) {
  const className = "size-3.5";
  switch (type) {
    case "join":
      return <UserPlus className={className} />;
    case "walkin":
      return <UserPlus className={className} />;
    case "call":
      return <BellRing className={className} />;
    case "seat":
      return <UtensilsCrossed className={className} />;
    case "complete":
      return <CheckCircle2 className={className} />;
    case "no_show":
      return <UserX className={className} />;
    case "cancel":
      return <XCircle className={className} />;
    case "clear":
      return <Sparkles className={className} />;
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

function activityText(item: ActivityItem): string {
  const verb: Record<string, string> = {
    join: "joined the waitlist",
    walkin: "was added as a walk-in",
    call: "was called",
    seat: "was seated",
    complete: "finished their visit",
    no_show: "was marked as a no-show",
    cancel: "cancelled their place",
    clear: "table was cleared",
    ready: "table is ready",
    settings: "restaurant settings updated",
    waitlist: "waitlist state changed",
    acknowledge: "confirmed they're on the way",
    extend: "hold was extended",
    undo_call: "was returned to the line",
    table_added: "table added",
    table_updated: "table updated",
    table_deleted: "table removed",
    staff_added: "team member added",
    staff_pin: "staff PIN reset",
    staff_status: "team access changed",
  };

  const suffix = verb[item.type] ?? item.type.replace(/_/g, " ");
  if (item.type === "call" && item.name) {
    return `${item.code ? `${item.code} · ` : ""}${item.name} was called${item.tableLabel ? ` for ${item.tableLabel}` : ""}`;
  }
  if (item.name) {
    const where = item.tableLabel ? ` at ${item.tableLabel}` : "";
    return `${item.code ? `${item.code} · ` : ""}${item.name} ${suffix}${where}`;
  }
  if (item.tableLabel) return `${item.tableLabel} ${suffix}`;
  return suffix.charAt(0).toUpperCase() + suffix.slice(1);
}
