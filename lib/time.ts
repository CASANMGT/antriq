import type { Restaurant } from "./types";

const dayFormatters = new Map<string, Intl.DateTimeFormat>();
const clockFormatters = new Map<string, Intl.DateTimeFormat>();
const fullDateFormatters = new Map<string, Intl.DateTimeFormat>();

function dayFormatter(tz: string) {
  let f = dayFormatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    dayFormatters.set(tz, f);
  }
  return f;
}

function clockFormatter(tz: string) {
  let f = clockFormatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    clockFormatters.set(tz, f);
  }
  return f;
}

/** YYYY-MM-DD in the restaurant's timezone. */
export function dayInTz(date: Date | string, tz: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const parts = dayFormatter(tz).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Minutes since midnight in the restaurant's timezone. */
export function minutesInTz(date: Date | string, tz: string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  const [h, m] = clockFormatter(tz).format(d).split(":").map(Number);
  return h * 60 + m;
}

export function clockInTz(date: Date | string, tz: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return clockFormatter(tz).format(d);
}

function fullDateFormatter(tz: string, locale: string) {
  const key = `${tz}|${locale}`;
  let f = fullDateFormatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, {
      timeZone: tz,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    fullDateFormatters.set(key, f);
  }
  return f;
}

/** "Senin, 10 November 2026" in the restaurant's timezone. */
export function formatFullDateInTz(date: Date | string, tz: string, locale = "en-GB"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return fullDateFormatter(tz, locale).format(d);
}

export function parseTimeToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

export function isOpenAt(
  restaurant: Pick<Restaurant, "openTime" | "closeTime" | "timezone">,
  now: Date = new Date(),
): boolean {
  const open = parseTimeToMinutes(restaurant.openTime);
  const close = parseTimeToMinutes(restaurant.closeTime);
  const current = minutesInTz(now, restaurant.timezone);
  if (open === close) return true;
  if (close > open) return current >= open && current < close;
  return current >= open || current < close;
}

/** When the next service window starts, in the branch timezone. */
export function nextOpening(
  restaurant: Pick<Restaurant, "openTime" | "closeTime" | "timezone">,
  now: Date = new Date(),
): { day: "today" | "tomorrow"; time: string } {
  const open = parseTimeToMinutes(restaurant.openTime);
  const close = parseTimeToMinutes(restaurant.closeTime);
  const current = minutesInTz(now, restaurant.timezone);
  const opensToday = open === close || current < open || close < open;
  return { day: opensToday ? "today" : "tomorrow", time: restaurant.openTime };
}

export function elapsedMinutes(from: string | Date, to: string | Date = new Date()): number {
  const a = typeof from === "string" ? new Date(from) : from;
  const b = typeof to === "string" ? new Date(to) : to;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60_000));
}

export function secondsBetween(from: string | Date, to: string | Date = new Date()): number {
  const a = typeof from === "string" ? new Date(from) : from;
  const b = typeof to === "string" ? new Date(to) : to;
  return Math.round((b.getTime() - a.getTime()) / 1000);
}

export function humanizeMinutes(mins: number): string {
  const m = Math.max(0, Math.round(mins));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${h}h` : `${h}h ${rest}m`;
}

export function formatDayLong(day: string, locale = "en-GB"): string {
  const d = new Date(`${day}T12:00:00Z`);
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
}

export function formatDayShort(day: string, locale = "en-GB"): string {
  const d = new Date(`${day}T12:00:00Z`);
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  }).format(d);
}

export function addDaysToDay(day: string, delta: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function relativeTime(value: string | Date, now: Date = new Date(), lang: "id" | "en" = "en"): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const seconds = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000));
  const id = lang === "id";
  if (seconds < 45) return id ? "baru saja" : "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return id ? `${minutes} mnt lalu` : `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return id ? `${hours} jam lalu` : `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return id ? "kemarin" : "yesterday";
  return id ? `${days} hr lalu` : `${days}d ago`;
}

