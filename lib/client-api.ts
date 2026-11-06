import type { ActionResult } from "./types";

export async function postJson<T = unknown>(
  url: string,
  body: unknown,
): Promise<ActionResult<T>> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    let payload: ActionResult<T> | null = null;
    try {
      payload = (await response.json()) as ActionResult<T>;
    } catch {
      payload = null;
    }

    if (!response.ok) {
      if (response.status === 401) {
        return { ok: false, message: "Your session expired. Sign in again." };
      }
      return { ok: false, message: payload?.message ?? "That didn't work. Please try again." };
    }
    return payload ?? { ok: false, message: "Empty response from the server." };
  } catch {
    return { ok: false, message: "Network hiccup — check your connection and try again." };
  }
}
