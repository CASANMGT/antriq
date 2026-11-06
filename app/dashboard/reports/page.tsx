import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download, TrendingUp } from "lucide-react";
import { AutoRefresh } from "@/components/AutoRefresh";
import { WeekBars } from "@/components/owner/charts";
import { Mascot } from "@/components/Mascot";
import { getOwnerOverview } from "@/lib/store";
import { resolveOwnerScope } from "@/lib/scope";
import { formatDayLong } from "@/lib/time";
import { getLang } from "@/lib/lang";
import { format, getDict } from "@/lib/i18n";

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
  const { active } = await resolveOwnerScope(params.branch);
  const [overview, lang] = await Promise.all([getOwnerOverview(active.id, days), getLang()]);
  const t = getDict(lang);
  const locale = lang === "id" ? "id-ID" : "en-GB";
  const { week } = overview;

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
            {active.brandName} · {active.name} · {format(t.owner.reportsSub, {
              from: formatDayLong(week[0]?.day ?? "", locale),
              to: formatDayLong(week[week.length - 1]?.day ?? "", locale),
              days,
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border-2 border-ink bg-white p-1">
            {RANGES.map((range) => (
              <Link
                key={range}
                href={`/dashboard/reports?days=${range}&branch=${active.id}`}
                className={`rounded-full px-3 py-1.5 text-xs font-extrabold transition ${
                  range === days ? "bg-ink text-paper" : "text-muted hover:text-ink"
                }`}
              >
                {range}d
              </Link>
            ))}
          </div>
          <a href={`/api/owner/export?days=${days}&branch=${active.id}`} className="btn btn-soft btn-sm" download>
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

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <section className="card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-[1.6rem] font-semibold leading-tight">{t.owner.dailyFlow}</h2>
              <p className="mt-0.5 text-xs font-semibold text-muted">{t.owner.dailyFlowSub}</p>
            </div>
            <span className="pill status-muted">{days}d</span>
          </div>
          <div className="mt-5">
            <WeekBars days={week} />
          </div>
        </section>

        <section className="card p-4 sm:p-5">
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

function Metric({ label, value, hint, tone }: { label: string; value: string | number; hint: string; tone: string }) {
  return (
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
