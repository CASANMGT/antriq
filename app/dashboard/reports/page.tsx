import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download, Star, TrendingUp } from "lucide-react";
import { AutoRefresh } from "@/components/AutoRefresh";
import { WeekBars } from "@/components/owner/charts";
import { Mascot } from "@/components/Mascot";
import { getOwnerOverview, getOwnerWeekForBranches, getRatingAnalysis } from "@/lib/store";
import { resolveOwnerScope } from "@/lib/scope";
import { formatDayLong } from "@/lib/time";
import { getLang } from "@/lib/lang";
import { format, getDict } from "@/lib/i18n";
import type { DayPoint } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Laporan",
  robots: { index: false, follow: false },
};

const RANGES = [7, 30, 90] as const;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; branch?: string }>;
}) {
  const params = await searchParams;
  const requested = Number(params.days ?? "7");
  const days = RANGES.includes(requested as (typeof RANGES)[number]) ? requested : 7;
  const { branches, active } = await resolveOwnerScope(params.branch === "all" ? undefined : params.branch);
  const canSeeAll = branches.length > 1;
  const showAll = canSeeAll && params.branch === "all";
  const [week, ratings, lang] = await Promise.all([
    showAll
      ? getOwnerWeekForBranches(branches.map((branch) => branch.id), days)
      : getOwnerOverview(active.id, days).then((overview) => overview.week),
    getRatingAnalysis(showAll ? branches.map((branch) => branch.id) : [active.id], days),
    getLang(),
  ]);
  const t = getDict(lang);
  const locale = lang === "id" ? "id-ID" : "en-GB";
  const weekly = days > 14;
  const trend = weekly ? aggregateWeeks(week) : week;

  const totals = week.reduce(
    (sum, day) => ({
      joined: sum.joined + day.joined,
      seated: sum.seated + day.seated,
      noShow: sum.noShow + day.noShow,
      cancelled: sum.cancelled + day.cancelled,
    }),
    { joined: 0, seated: 0, noShow: 0, cancelled: 0 },
  );

  const attendance = totals.seated + totals.noShow;
  const noShowRate = attendance ? Math.round((totals.noShow / attendance) * 100) : 0;
  const showRate = attendance ? Math.round((totals.seated / attendance) * 100) : 0;
  const bestDay = [...week].sort((a, b) => b.joined - a.joined)[0];

  return (
    <div className="space-y-5">
      <AutoRefresh seconds={45} />

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={`/dashboard?branch=${active.id}`} className="inline-flex items-center gap-1.5 text-xs font-extrabold text-muted hover:text-ink">
            <ArrowLeft className="size-3.5" /> {t.owner.overview}
          </Link>
          <p className="eyebrow mt-3 text-tomato">{t.owner.reportsKicker}</p>
          <h1 className="mt-1 font-display text-[2.5rem] font-semibold leading-none tracking-tight">{t.owner.reportsTitle}</h1>
          <p className="mt-2 text-sm font-semibold text-muted">
            {showAll
              ? format(t.owner.reportsAllSub, {
                  count: branches.length,
                  from: formatDayLong(week[0]?.day ?? "", locale),
                  to: formatDayLong(week[week.length - 1]?.day ?? "", locale),
                  days,
                })
              : `${active.brandName} · ${active.name} · ${format(t.owner.reportsSub, {
                  from: formatDayLong(week[0]?.day ?? "", locale),
                  to: formatDayLong(week[week.length - 1]?.day ?? "", locale),
                  days,
                })}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canSeeAll && (
            <Link
              href={`/dashboard/reports?days=${days}&branch=all`}
              className={`btn btn-sm ${showAll ? "btn-primary" : "btn-soft"}`}
            >
              {t.owner.allBranches}
            </Link>
          )}
          <div className="flex rounded-full border-2 border-ink bg-white p-1">
            {RANGES.map((range) => (
              <Link
                key={range}
                href={`/dashboard/reports?days=${range}&branch=${showAll ? "all" : active.id}`}
                className={`rounded-full px-3 py-1.5 text-xs font-extrabold transition ${
                  range === days ? "bg-ink text-paper" : "text-muted hover:text-ink"
                }`}
              >
                {range}d
              </Link>
            ))}
          </div>
          <a href={`/api/owner/export?days=${days}&branch=${showAll ? "all" : active.id}`} className="btn btn-soft btn-sm" download>
            <Download className="size-3.5" /> {t.owner.exportCsv}
          </a>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label={t.owner.guestsJoined} value={totals.joined} hint={`${totals.cancelled} ${t.owner.cancelled.toLowerCase()}`} tone="bg-pink" />
        <Metric label={t.owner.partiesSeated} value={totals.seated} hint={format(t.owner.showRate, { count: showRate })} tone="bg-leaf-soft" />
        <Metric label={t.owner.attendance} value={`${showRate}%`} hint={t.owner.partiesSeated} tone="bg-cream" />
        <Metric label={t.owner.noShowRateShort} value={`${noShowRate}%`} hint={format(t.owner.missedHolds, { count: totals.noShow })} tone="bg-white" />
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <section className="card min-w-0 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-[1.6rem] font-semibold leading-tight">{t.owner.dailyFlow}</h2>
              <p className="mt-0.5 text-xs font-semibold text-muted">
                {weekly ? t.owner.dailyFlowSubWeekly : t.owner.dailyFlowSub}
              </p>
            </div>
            <span className="pill status-muted">{days}d</span>
          </div>
          <div className="mt-5">
            <WeekBars days={trend} weekly={weekly} />
          </div>
        </section>

        <section className="card min-w-0 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[1.6rem] font-semibold leading-tight">{t.owner.insights}</h2>
            <Mascot mood="happy" className="w-14" />
          </div>
          <div className="mt-4 space-y-3">
            <Insight
              title={format(t.owner.busiest, { count: bestDay?.joined ?? 0 })}
              body={bestDay ? format(t.owner.bestDayBody, { day: formatDayLong(bestDay.day, locale) }) : t.owner.quiet}
            />
            <Insight
              title={format(t.owner.showRate, { count: showRate })}
              body={format(t.owner.attendanceBody, { rate: showRate })}
            />
            <Insight
              title={`${noShowRate}% ${t.owner.noShowRateShort.toLowerCase()}`}
              body={format(t.owner.missedHolds, { count: totals.noShow })}
            />
          </div>
        </section>
      </div>

      <section className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-[1.6rem] font-semibold leading-tight">{t.owner.ratingByBranch}</h2>
            <p className="mt-0.5 text-xs font-semibold text-muted">{t.owner.ratingByBranchSub}</p>
          </div>
          <span className="pill status-muted">{days}d</span>
        </div>
        {ratings.every((item) => item.count === 0) ? (
          <p className="mt-4 rounded-xl border-2 border-dashed border-ink/20 bg-cream/60 px-4 py-6 text-center text-xs font-semibold text-muted">
            {t.owner.ratingNoRatings}
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {ratings.map((item) => (
              <div key={item.branchId} className="rounded-2xl border-2 border-ink bg-cream/50 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-extrabold">{item.branchName}</p>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border-2 border-ink bg-white px-2 py-0.5 text-xs font-extrabold">
                    <Star className="size-3 text-gold" fill="currentColor" />
                    {item.count ? item.average.toFixed(1) : "—"}
                  </span>
                </div>
                <p className="mt-0.5 text-[0.625rem] font-semibold text-muted">
                  {format(t.owner.ratingCount, { count: item.count })}
                </p>
                <div className="mt-2 space-y-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = item.distribution[star - 1] ?? 0;
                    const pct = item.count ? Math.round((count / item.count) * 100) : 0;
                    return (
                      <div key={star} className="flex items-center gap-1.5 text-[0.625rem] font-bold">
                        <span className="w-4 text-right text-muted">{star}</span>
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white">
                          <span className="block h-1.5 rounded-full bg-gold" style={{ width: `${pct}%` }} />
                        </span>
                        <span className="num w-5 text-right text-muted">{count}</span>
                      </div>
                    );
                  })}
                </div>
                {item.slots.length > 0 && (
                  <div className="mt-2 border-t-2 border-dashed border-ink/10 pt-2">
                    <p className="text-[0.5625rem] font-extrabold uppercase tracking-[0.12em] text-ink/40">
                      {t.owner.ratingTimeslots}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.slots.map((slot) => (
                        <span
                          key={slot.hour}
                          className="rounded-full border-2 border-ink/15 bg-white px-1.5 py-0.5 text-[0.625rem] font-bold"
                        >
                          {String(slot.hour).padStart(2, "0")}:00–{String((slot.hour + 1) % 24).padStart(2, "0")}:00 ·{" "}
                          {slot.average.toFixed(1)} ({slot.count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {item.recent.length > 0 && (
                  <div className="mt-2 border-t-2 border-dashed border-ink/10 pt-2">
                    <p className="text-[0.5625rem] font-extrabold uppercase tracking-[0.12em] text-ink/40">
                      {t.owner.ratingRecent}
                    </p>
                    <div className="mt-1 space-y-1">
                      {item.recent.map((review) => (
                        <div key={`${review.code}-${review.ratedAt}`}>
                          <p className="truncate text-[0.625rem] font-bold text-ink/70">
                            {review.code} · {review.guestName} · {review.rating}/5
                          </p>
                          {review.note && (
                            <p className="text-[0.625rem] font-medium italic text-muted">“{review.note}”</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b-2 border-ink px-4 py-3 sm:px-5">
          <div>
            <h2 className="font-display text-[1.6rem] font-semibold leading-tight">{t.owner.dayByDay}</h2>
            <p className="text-xs font-semibold text-muted">{t.owner.dayByDaySub}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-leaf-dark">
            <TrendingUp className="size-3.5" /> {t.owner.live}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b-2 border-ink/15 bg-cream/60 text-left text-[0.625rem] uppercase tracking-[0.12em] text-ink/50">
                <th className="px-4 py-2.5 font-extrabold sm:px-5">{t.owner.day}</th>
                <th className="px-3 py-2.5 font-extrabold text-right">{t.owner.joined}</th>
                <th className="px-3 py-2.5 font-extrabold text-right">{t.owner.seated}</th>
                <th className="px-3 py-2.5 font-extrabold text-right">{t.owner.noShowsCol}</th>
                <th className="px-4 py-2.5 font-extrabold text-right sm:px-5">{t.owner.cancelledCol}</th>
              </tr>
            </thead>
            <tbody>
              {[...week].reverse().map((day) => (
                <tr key={day.day} className="border-b-2 border-dashed border-ink/10 last:border-0 hover:bg-cream/30">
                  <td className="px-4 py-2.5 font-extrabold sm:px-5">{formatDayLong(day.day, locale)}</td>
                  <td className="num px-3 py-2.5 text-right font-semibold">{day.joined}</td>
                  <td className="num px-3 py-2.5 text-right font-semibold">{day.seated}</td>
                  <td className="num px-3 py-2.5 text-right font-semibold text-tomato-dark">{day.noShow}</td>
                  <td className="num px-4 py-2.5 text-right font-semibold text-muted sm:px-5">{day.cancelled}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="px-1 text-[0.6875rem] font-semibold leading-relaxed text-muted">{t.owner.csvNote}</p>
    </div>
  );
}

function aggregateWeeks(days: DayPoint[]): DayPoint[] {
  const buckets: DayPoint[] = [];
  for (let index = 0; index < days.length; index += 7) {
    const chunk = days.slice(index, index + 7);
    const joined = chunk.reduce((sum, day) => sum + day.joined, 0);
    const seated = chunk.reduce((sum, day) => sum + day.seated, 0);
    const waitWeighted = chunk.reduce((sum, day) => sum + day.avgWaitMinutes * day.seated, 0);
    const turnWeighted = chunk.reduce((sum, day) => sum + day.avgTurnMinutes * day.seated, 0);
    buckets.push({
      day: chunk[0].day,
      joined,
      seated,
      noShow: chunk.reduce((sum, day) => sum + day.noShow, 0),
      cancelled: chunk.reduce((sum, day) => sum + day.cancelled, 0),
      avgWaitMinutes: seated ? Math.round(waitWeighted / seated) : 0,
      avgTurnMinutes: seated ? Math.round(turnWeighted / seated) : 0,
    });
  }
  return buckets;
}

function Metric({ label, value, hint, tone }: { label: string; value: string | number; hint: string; tone: string }) {  return (
    <div className={`rounded-2xl border-2 border-ink p-4 shadow-[3px_3px_0_#262321] ${tone}`}>
      <p className="text-[0.625rem] font-extrabold uppercase tracking-[0.12em] text-ink/55">{label}</p>
      <p className="stat-number mt-3 text-[2.6rem]">{value}</p>
      <p className="mt-2 text-[0.6875rem] font-semibold text-ink/55">{hint}</p>
    </div>
  );
}

function Insight({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border-2 border-ink bg-cream px-3 py-2.5">
      <p className="text-sm font-extrabold">{title}</p>
      <p className="mt-0.5 text-xs font-semibold leading-relaxed text-muted">{body}</p>
    </div>
  );
}
