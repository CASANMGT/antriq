import { AppError } from "./validation";
import type { ActionResult } from "./types";

export function actionError(error: unknown): ActionResult<never> {
  if (error instanceof AppError) {
    return { ok: false, message: error.message };
  }
  console.error("[antriq] action failed", error);
  return {
    ok: false,
    message: "Something went wrong on our side. Please try again in a moment.",
  };
}

const hits = new Map<string, number[]>();

/** Very small fixed-window limiter. Per serverless instance — good enough as a speed bump. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((at) => now - at < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}
