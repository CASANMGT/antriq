"use client";

import { useLang } from "@/components/LanguageProvider";
import type { DayPoint, HourPoint } from "@/lib/types";

export function HourlyBars({ points }: { points: HourPoint[] }) {
  const { t } = useLang();
  const max = Math.max(1, ...points.map((point) => Math.max(point.joined, point.seated)));

  return (
    <div>
      <div className="flex h-44 min-w-0 items-end gap-1 sm:gap-1.5">
        {points.map((point) => (
          <div key={point.hour} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <div className="flex h-full w-full items-end justify-center gap-[3px]">
              <div
                className="w-[42%] max-w-[14px] rounded-t-[4px] bg-tomato transition group-hover:bg-tomato-dark"
                style={{ height: `${(point.joined / max) * 100}%`, minHeight: point.joined ? 3 : 0 }}
                title={`${point.joined} ${t.owner.joined} · ${point.hour}:00`}
              />
              <div
                className="w-[42%] max-w-[14px] rounded-t-[4px] bg-leaf transition group-hover:bg-leaf-dark"
                style={{ height: `${(point.seated / max) * 100}%`, minHeight: point.seated ? 3 : 0 }}
                title={`${point.seated} ${t.owner.seated} · ${point.hour}:00`}
              />
            </div>
            <span className="num text-[0.5625rem] font-extrabold text-ink/35">
              {String(point.hour).padStart(2, "0")}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[0.6875rem] font-bold text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-tomato" /> {t.owner.joined}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-leaf" /> {t.owner.seated}
        </span>
      </div>
    </div>
  );
}

export function WeekBars({ days, weekly = false }: { days: DayPoint[]; weekly?: boolean }) {
  const { lang, t } = useLang();
  const locale = lang === "id" ? "id-ID" : "en-GB";
  const max = Math.max(1, ...days.map((day) => Math.max(day.joined, day.seated)));
  const label = (day: string) =>
    weekly
      ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(
          new Date(`${day}T12:00:00Z`),
        )
      : new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(
          new Date(`${day}T12:00:00Z`),
        );

  return (
    <div className="flex h-36 min-w-0 items-end gap-2">
      {days.map((day) => (
        <div key={day.day} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
          <div className="flex h-full w-full items-end justify-center gap-[3px]">
            <div
              className="w-[40%] max-w-[18px] rounded-t-[4px] bg-tomato/85"
              style={{ height: `${(day.joined / max) * 100}%`, minHeight: day.joined ? 3 : 0 }}
              title={`${day.joined} ${t.owner.joined}`}
            />
            <div
              className="w-[40%] max-w-[18px] rounded-t-[4px] bg-leaf/85"
              style={{ height: `${(day.seated / max) * 100}%`, minHeight: day.seated ? 3 : 0 }}
              title={`${day.seated} ${t.owner.seated}`}
            />
          </div>
          <span className="w-full truncate text-center text-[0.5625rem] font-extrabold text-ink/40">
            {label(day.day)}
          </span>
        </div>
      ))}
    </div>
  );
}
