import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { Role } from "./types";

export const SESSION_COOKIE = "antriq_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

export interface Session {
  staffId: number;
  name: string;
  role: Role;
  initials: string | null;
  brandId: number | null;
  branchId: number | null;
  exp: number;
}

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
      console.warn("[antriq] AUTH_SECRET is not set — using the development secret. Set AUTH_SECRET in production.");
    }
    return "antriq-development-secret-change-me";
  }
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function encodeSession(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(token: string | undefined): Session | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Session;
    if (!parsed || typeof parsed.staffId !== "number" || typeof parsed.exp !== "number") return null;
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    if (parsed.role !== "owner" && parsed.role !== "greeter" && parsed.role !== "cashier") return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return decodeSession(store.get(SESSION_COOKIE)?.value);
}

export async function setSession(session: Omit<Session, "exp">): Promise<void> {
  const store = await cookies();
  const full: Session = { ...session, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
  store.set(SESSION_COOKIE, encodeSession(full), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/* Small in-process throttle. Serverless instances each keep their own window. */
const failures = new Map<number, number[]>();
const WINDOW_MS = 5 * 60_000;
const MAX_FAILURES = 6;

export function loginAllowed(staffId: number): boolean {
  const now = Date.now();
  const recent = (failures.get(staffId) ?? []).filter((at) => now - at < WINDOW_MS);
  failures.set(staffId, recent);
  return recent.length < MAX_FAILURES;
}

export function noteLoginFailure(staffId: number): void {
  const now = Date.now();
  const recent = (failures.get(staffId) ?? []).filter((at) => now - at < WINDOW_MS);
  recent.push(now);
  failures.set(staffId, recent);
}

export function clearLoginFailures(staffId: number): void {
  failures.delete(staffId);
}
