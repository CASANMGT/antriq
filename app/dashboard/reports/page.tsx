import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download, TrendingUp } from "lucide-react";
import { AutoRefresh } from "@/components/AutoRefresh";
import { WeekBars } from "@/components/owner/charts";
import { getOwnerOverview } from "@/lib/store";
import { formatDayLong, formatDayShort, humanizeMinutes } from "@/lib/time";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reports",
  robots: { index: false, follow: false },
};

const RANGES = [7, 30, 90] as const;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const params = await searchParams;
  const requested = Number(params.days ?? "7");
  const days = RANGES.includes(requested as (typeof RANGES)[number]) ? requested : 7;
  const overview = await getOwnerOverview(days);
  const { week, restaurant } = overview;

  const totals = week.reduce(
    (sum, day) => ({
      joined: sum.joined + day.joined,
      seated: sum.seated + day.seated,
      noShow: sum.noShow + day.noShow,
      cancelled: sum.cancelled + day.cancelled,
    }),
    { joined: 0, seated: 0, noShow: 0, cancelled: 0 },
  );

  const activeDays = week.filter((day) => day.seated > 0);
  const avgWait = activeDays.length
    ? Math.round(activeDays.reduce((sum, day) => sum + day.avgWaitMinutes, 0) / activeDays.length)
    : 0;
  const activeTurnDays = week.filter((day) => day.avgTurnMinutes > 0);
  const avgTurn = activeTurnDays.length
    ? Math.round(activeTurnDays.reduce((sum, day) => sum + day.avgTurnMinutes, 0) / activeTurnDays.length)
    : restaurant.avgTurnMinutes;
  const attendance = totals.seated + totals.noShow;
  const noShowRate = attendance ? Math.round((totals.noShow / attendance) * 100) : 0;
  const bestDay = [...week].sort((a, b) => b.joined - a.joined)[0];

  return (
    <div className="space-y-5">
      <AutoRefresh seconds={45} />

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink">
            <ArrowLeft className="size-3.5" /> Overview
          </Link>
          <h1 className="mt-2 font-display text-[2.3rem] leading-none tracking-tight">Reports</h1>
          <p className="mt-2 text-sm text-muted">
            {formatDayLong(week[0]?.day ?? "")} – {formatDayLong(week[week.length - 1]?.day ?? "")} ·{" "}
            {days} days
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-line bg-white p-1">
            {RANGES.map((range) => (
              <Link
                key={range}
                href={`/dashboard/reports?days=${range}`}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  range === days ? "bg-ink text-paper" : "text-muted hover:text-ink"
                }`}
              >
                {range}d
              </Link>
            ))}
          </div>
          <a href={`/api/owner/export?days=${days}`} className="btn btn-soft btn-sm" download>
            <Download className="size-3.5" /> Export CSV
          </a>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Guests joined" value={totals.joined} hint={`${totals.cancelled} cancelled`} />
        <Metric label="Parties seated" value={totals.seated} hint={`${attendance ? Math.round((totals.seated / attendance) * 100) : 0}% show rate`} />
        <Metric label="Average wait" value={`${avgWait}m`} hint="from join to seat" />
        <Metric label="No-show rate" value={`${noShowRate}%`} hint={`${totals.noShow} missed holds`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <section className="card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl leading-tight">Daily flow</h2>
              <p className="mt-0.5 text-xs text-muted">Joined vs seated, per day</p>
            </div>
            <span className="pill status-muted">{days} days</span>
          </div>
          <div className="mt-5">
            <WeekBars days={week} />
          </div>
        </section>

        <section className="card p-4 sm:p-5">
          <h2 className="font-display text-xl leading-tight">What stood out</h2>
          <div className="mt-4 space-y-3 text-sm">
            <Insight
              title={`${bestDay?.joined ?? 0} joins on the busiest day`}
              body={
                bestDay
                  ? `${formatDayShort(bestDay.day)} was the fullest room. Average wait that day was ${bestDay.avgWaitMinutes}m.`
                  : "No joins in this window yet."
              }
            />
            <Insight
              title={`${avgTurn}m average turn`}
              body={`Your configured target is ${restaurant.avgTurnMinutes}m. Hold time is ${restaurant.holdMinutes}m.`}
            />
            <Insight
              title={`${noShowRate}% no-show rate`}
              body={
                noShowRate > 12
                  ? "Above 12% — consider a shorter hold or a quick confirmation nudge."
                  : "Healthy. The hold window is doing its job."
              }
            />
          </div>
        </section>
      </div>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div>
            <h2 className="font-display text-xl leading-tight">Day by day</h2>
            <p className="text-xs text-muted">Every closed visit is counted once</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sage-dark">
            <TrendingUp className="size-3.5" /> Live data
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[0.625rem] uppercase tracking-[0.12em] text-muted">
                <th className="px-4 py-2.5 font-bold sm:px-5">Day</th>
                <th className="px-3 py-2.5 font-bold text-right">Joined</th>
                <th className="px-3 py-2.5 font-bold text-right">Seated</th>
                <th className="px-3 py-2.5 font-bold text-right">No-shows</th>
                <th className="px-3 py-2.5 font-bold text-right">Cancelled</th>
                <th className="px-3 py-2.5 font-bold text-right">Avg wait</th>
                <th className="px-4 py-2.5 font-bold text-right sm:px-5">Avg turn</th>
              </tr>
            </thead>
            <tbody>
              {[...week].reverse().map((day) => (
                <tr key={day.day} className="border-b border-line/60 last:border-0 hover:bg-cream/30">
                  <td className="px-4 py-2.5 font-semibold sm:px-5">{formatDayLong(day.day)}</td>
                  <td className="num px-3 py-2.5 text-right">{day.joined}</td>
                  <td className="num px-3 py-2.5 text-right">{day.seated}</td>
                  <td className="num px-3 py-2.5 text-right text-clay-dark">{day.noShow}</td>
                  <td className="num px-3 py-2.5 text-right text-muted">{day.cancelled}</td>
                  <td className="num px-3 py-2.5 text-right">{day.avgWaitMinutes ? `${day.avgWaitMinutes}m` : "—"}</td>
                  <td className="num px-4 py-2.5 text-right sm:px-5">
                    {day.seated ? humanizeMinutes(day.avgTurnMinutes) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="px-1 text-[0.6875rem] leading-relaxed text-muted">
        CSV export includes every ticket with timestamps, wait and turn minutes for the selected window.
      </p>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <div className="card p-4">
      <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="stat-number mt-3 text-4xl">{value}</p>
      <p className="mt-2 text-[0.6875rem] text-muted">{hint}</p>
    </div>
  );
}

function Insight({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2.5">
      <p className="font-bold">{title}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-muted">{body}</p>
    </div>
  );
}
