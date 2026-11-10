"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Phone, Star } from "lucide-react";
import { useLang } from "@/components/LanguageProvider";
import { format } from "@/lib/i18n";
import { clockInTz, dayInTz, formatDayShort } from "@/lib/time";
import type { RatingRecord } from "@/lib/types";

const PAGE_SIZE = 10;

export function RatingList({ records }: { records: RatingRecord[] }) {
  const { lang, t } = useLang();
  const [filter, setFilter] = useState<number | null>(null);
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const locale = lang === "id" ? "id-ID" : "en-GB";

  const dates = useMemo(
    () => Array.from(new Set(records.map((record) => dayInTz(record.ratedAt, record.branchTimezone)))).sort().reverse(),
    [records],
  );
  const dateFiltered = useMemo(
    () =>
      dateFilter
        ? records.filter((record) => dayInTz(record.ratedAt, record.branchTimezone) === dateFilter)
        : records,
    [dateFilter, records],
  );
  const counts = useMemo(
    () => [5, 4, 3, 2, 1].map((star) => dateFiltered.filter((record) => record.rating === star).length),
    [dateFiltered],
  );
  const filtered = filter === null ? dateFiltered : dateFiltered.filter((record) => record.rating === filter);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filter, dateFilter]);

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-ink px-4 py-3 sm:px-5">
        <div>
          <h2 className="font-display text-[1.6rem] font-semibold leading-tight">{t.owner.ratingAllRecords}</h2>
          <p className="text-xs font-semibold text-muted">{t.owner.ratingAllRecordsSub}</p>
        </div>
        <span className="pill status-muted">{records.length}</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-b-2 border-dashed border-ink/10 px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={() => setFilter(null)}
          aria-pressed={filter === null}
          className={`rounded-full border-2 px-2.5 py-1 text-[0.6875rem] font-extrabold transition ${
            filter === null ? "border-ink bg-ink text-paper" : "border-ink/20 bg-white text-ink/65 hover:border-ink"
          }`}
        >
          {t.owner.ratingFilterAll} ({dateFiltered.length})
        </button>
        {[5, 4, 3, 2, 1].map((star, index) => (
          <button
            key={star}
            type="button"
            onClick={() => setFilter(star)}
            aria-pressed={filter === star}
            className={`inline-flex items-center gap-1 rounded-full border-2 px-2.5 py-1 text-[0.6875rem] font-extrabold transition ${
              filter === star ? "border-ink bg-ink text-paper" : "border-ink/20 bg-white text-ink/65 hover:border-ink"
            }`}
          >
            <Star className="size-3 text-gold" fill="currentColor" />
            {star} ({counts[index]})
          </button>
        ))}
        <select
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
          aria-label={t.owner.ratingAllDates}
          className="input ml-auto h-8 w-auto rounded-full border-2 border-ink/20 bg-white px-2.5 py-1 text-[0.6875rem] font-extrabold"
        >
          <option value="">{t.owner.ratingAllDates}</option>
          {dates.map((day) => (
            <option key={day} value={day}>
              {formatDayShort(day, locale)}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="px-4 py-10 text-center text-xs font-semibold text-muted sm:px-5">
          {records.length === 0 || (filter === null && dateFiltered.length === 0)
            ? t.owner.ratingNoRecords
            : t.owner.ratingFilterEmpty}
        </p>
      ) : (
        <div className="divide-y-2 divide-dashed divide-ink/10">
          {visible.map((record) => (
            <div key={`${record.branchId}-${record.code}-${record.ratedAt}`} className="flex flex-wrap items-start gap-3 px-4 py-3 sm:px-5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-sm font-extrabold">{record.guestName}</p>
                  <span className="pill status-muted">{record.code}</span>
                  <span className="pill status-muted">{record.branchName}</span>
                  {record.visitNumber > 1 && (
                    <span className="pill status-waiting">
                      {format(t.common.visitNumber, { count: record.visitNumber })}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] font-semibold text-muted">
                  <span>
                    {t.owner.ratingTime}: {formatDayShort(dayInTz(record.ratedAt, record.branchTimezone), locale)} ·{" "}
                    {clockInTz(record.ratedAt, record.branchTimezone)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Phone className="size-3" />
                    {record.phone ? (
                      <a href={`tel:${record.phone}`} className="hover:text-ink">
                        {record.phone}
                      </a>
                    ) : (
                      t.owner.ratingNoPhone
                    )}
                  </span>
                </div>
                {record.note && <p className="mt-1 text-xs font-medium italic text-ink/65">“{record.note}”</p>}
              </div>
              <div className="flex shrink-0 items-center gap-0.5 text-gold">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="size-3.5" fill={star <= record.rating ? "currentColor" : "none"} />
                ))}
                <span className="ml-1 text-xs font-extrabold text-ink/60">{record.rating}/5</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between border-t-2 border-dashed border-ink/10 px-4 py-3 sm:px-5">
          <span className="text-[0.625rem] font-extrabold uppercase tracking-[0.1em] text-muted">
            {currentPage} / {pageCount} · {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="grid size-7 place-items-center rounded-full border-2 border-ink/20 bg-white text-ink/60 transition hover:border-ink disabled:opacity-30"
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              aria-label={t.owner.previousPage}
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              className="grid size-7 place-items-center rounded-full border-2 border-ink/20 bg-white text-ink/60 transition hover:border-ink disabled:opacity-30"
              onClick={() => setPage(Math.min(pageCount, currentPage + 1))}
              disabled={currentPage >= pageCount}
              aria-label={t.owner.nextPage}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
