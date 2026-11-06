import type { DayPoint, HourPoint } from "@/lib/types";

export function HourlyBars({ points }: { points: HourPoint[] }) {
  const max = Math.max(1, ...points.map((point) => Math.max(point.joined, point.seated)));

  return (
    <div>
      <div className="flex h-44 items-end gap-1 sm:gap-1.5">
        {points.map((point) => (
          <div key={point.hour} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <div className="flex h-full w-full items-end justify-center gap-[3px]">
              <div
                className="w-[42%] max-w-[14px] rounded-t-[3px] bg-clay/85 transition group-hover:bg-clay"
                style={{ height: `${(point.joined / max) * 100}%`, minHeight: point.joined ? 3 : 0 }}
                title={`${point.joined} joined at ${point.hour}:00`}
              />
              <div
                className="w-[42%] max-w-[14px] rounded-t-[3px] bg-sage/80 transition group-hover:bg-sage"
                style={{ height: `${(point.seated / max) * 100}%`, minHeight: point.seated ? 3 : 0 }}
                title={`${point.seated} seated at ${point.hour}:00`}
              />
            </div>
            <span className="num text-[0.5625rem] font-semibold text-muted-soft">
              {String(point.hour).padStart(2, "0")}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[0.6875rem] font-medium text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-clay" /> Joined
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-sage" /> Seated
        </span>
      </div>
    </div>
  );
}

export function WeekBars({ days }: { days: DayPoint[] }) {
  const max = Math.max(1, ...days.map((day) => Math.max(day.joined, day.seated)));

  return (
    <div className="flex h-36 items-end gap-2">
      {days.map((day) => (
        <div key={day.day} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
          <div className="flex h-full w-full items-end justify-center gap-[3px]">
            <div
              className="w-[40%] max-w-[18px] rounded-t-[4px] bg-clay/80"
              style={{ height: `${(day.joined / max) * 100}%`, minHeight: day.joined ? 3 : 0 }}
              title={`${day.joined} joined`}
            />
            <div
              className="w-[40%] max-w-[18px] rounded-t-[4px] bg-sage/80"
              style={{ height: `${(day.seated / max) * 100}%`, minHeight: day.seated ? 3 : 0 }}
              title={`${day.seated} seated`}
            />
          </div>
          <span className="truncate text-[0.5625rem] font-semibold text-muted">
            {new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" }).format(
              new Date(`${day.day}T12:00:00Z`),
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
