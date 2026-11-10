"use client";

import { useMemo } from "react";
import { Star } from "lucide-react";
import { RatingList } from "@/components/owner/RatingList";
import { useLang } from "@/components/LanguageProvider";
import { format } from "@/lib/i18n";
import { dayInTz, formatDayShort, minutesInTz } from "@/lib/time";
import type { RatingRecord } from "@/lib/types";

export function RatingAnalytics({
  records,
  branches,
}: {
  records: RatingRecord[];
  branches: { id: number; name: string }[];
}) {
  const { lang, t } = useLang();
  const locale = lang === "id" ? "id-ID" : "en-GB";

  const summary = useMemo(() => {
    const total = records.reduce((sum, record) => sum + record.rating, 0);
    const distribution = [1, 2, 3, 4, 5].map(
      (star) => records.filter((record) => record.rating === star).length,
    );
    return {
      count: records.length,
      average: records.length ? Math.round((total / records.length) * 10) / 10 : 0,
      distribution,
    };
  }, [records]);

  const perBranch = useMemo(
    () =>
      branches
        .map((branch) => {
          const list = records.filter((record) => record.branchId === branch.id);
          const total = list.reduce((sum, record) => sum + record.rating, 0);
          return {
            id: branch.id,
            name: branch.name,
            count: list.length,
            average: list.length ? Math.round((total / list.length) * 10) / 10 : 0,
          };
        })
        .sort((a, b) => b.average - a.average || b.count - a.count),
    [branches, records],
  );

  const daily = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const record of records) {
      const day = dayInTz(record.ratedAt, record.branchTimezone);
      const slot = map.get(day) ?? { total: 0, count: 0 };
      slot.total += record.rating;
      slot.count += 1;
      map.set(day, slot);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, slot]) => ({ day, count: slot.count, average: Math.round((slot.total / slot.count) * 10) / 10 }));
  }, [records]);

  const hourly = useMemo(() => {
    const map = new Map<number, { total: number; count: number }>();
    for (const record of records) {
      const hour = Math.floor(minutesInTz(record.ratedAt, record.branchTimezone) / 60);
      const slot = map.get(hour) ?? { total: 0, count: 0 };
      slot.total += record.rating;
      slot.count += 1;
      map.set(hour, slot);
    }
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([hour, slot]) => ({ hour, count: slot.count, average: Math.round((slot.total / slot.count) * 10) / 10 }));
  }, [records]);

  return (
    <div className="space-y-4">
      <section className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow text-tomato">{t.owner.ratingAnalyticsTitle}</p>
            <h2 className="mt-1 font-display text-[1.7rem] font-semibold leading-tight">{t.owner.ratingTitle}</h2>
            <p className="mt-0.5 text-xs font-semibold text-muted">{t.owner.ratingAnalyticsSub}</p>
          </div>
          <div className="text-right">
            <p className="num font-display text-3xl font-semibold leading-none">
              {summary.count ? summary.average.toFixed(1) : "—"}
            </p>
            <p className="mt-1 text-[0.625rem] font-extrabold uppercase tracking-[0.1em] text-muted">
              {format(t.owner.ratingCount, { count: summary.count })}
            </p>
          </div>
        </div>

        <div className="mt-4 max-w-md space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary.distribution[star - 1] ?? 0;
            const pct = summary.count ? Math.round((count / summary.count) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs font-bold">
                <span className="inline-flex w-9 shrink-0 items-center gap-0.5">
                  <Star className="size-3 text-gold" fill="currentColor" /> {star}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-cream">
                  <span className="block h-2 rounded-full bg-gold" style={{ width: `${pct}%` }} />
                </span>
                <span className="num w-7 text-right text-muted">{count}</span>
              </div>
            );
          })}
        </div>
      </section>

      {records.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-2">
          <section className="card p-4 sm:p-5">
            <h3 className="font-display text-[1.4rem] font-semibold leading-tight">{t.owner.ratingByDate}</h3>
            <div className="mt-4 flex h-40 items-end gap-1.5 overflow-x-auto pb-1">
              {daily.map((point) => (
                <div key={point.day} className="flex min-w-[30px] flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[0.5625rem] font-bold text-muted">{point.average.toFixed(1)}</span>
                  <div
                    className="w-full rounded-t-md bg-gold"
                    style={{ height: `${Math.max(6, (point.average / 5) * 100)}%` }}
                    title={`${point.day}: ${point.average.toFixed(1)} (${point.count})`}
                  />
                  <span className="whitespace-nowrap text-[0.5rem] font-bold text-muted">
                    {formatDayShort(point.day, locale).replace(/,.*/, "")}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-4 sm:p-5">
            <h3 className="font-display text-[1.4rem] font-semibold leading-tight">{t.owner.ratingByHour}</h3>
            <div className="mt-4 flex h-40 items-end gap-1.5 overflow-x-auto pb-1">
              {hourly.map((point) => (
                <div key={point.hour} className="flex min-w-[34px] flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[0.5625rem] font-bold text-muted">{point.average.toFixed(1)}</span>
                  <div
                    className="w-full rounded-t-md bg-leaf"
                    style={{ height: `${Math.max(6, (point.average / 5) * 100)}%` }}
                    title={`${String(point.hour).padStart(2, "0")}:00: ${point.average.toFixed(1)} (${point.count})`}
                  />
                  <span className="text-[0.5rem] font-bold text-muted">{String(point.hour).padStart(2, "0")}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      <section className="card p-4 sm:p-5">
        <h3 className="font-display text-[1.4rem] font-semibold leading-tight">{t.owner.ratingByBranch}</h3>
        <p className="mt-0.5 text-xs font-semibold text-muted">{t.owner.ratingByBranchSub}</p>
        <div className="mt-3 space-y-2">
          {perBranch.map((branch) => (
            <div key={branch.id} className="flex items-center gap-3">
              <p className="w-36 shrink-0 truncate text-xs font-extrabold">{branch.name}</p>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-cream">
                <span
                  className="block h-2 rounded-full bg-gold"
                  style={{ width: `${branch.average ? (branch.average / 5) * 100 : 0}%` }}
                />
              </span>
              <span className="num w-8 text-right text-xs font-extrabold">
                {branch.count ? branch.average.toFixed(1) : "—"}
              </span>
              <span className="w-10 text-right text-[0.625rem] font-bold text-muted">({branch.count})</span>
            </div>
          ))}
        </div>
      </section>

      <RatingList records={records} />
    </div>
  );
}
