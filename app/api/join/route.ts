import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { actionError, actionStatus, rateLimit } from "@/lib/action";
import { GUEST_TICKET_COOKIE, GUEST_TICKET_MAX_AGE } from "@/lib/guest";
import { joinQueue } from "@/lib/store";
import { cleanText } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

export const dynamic = "force-dynamic";

const COOKIE_NAME = GUEST_TICKET_COOKIE;
const COOKIE_MAX_AGE = GUEST_TICKET_MAX_AGE;

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  if (!rateLimit(`join:${ip}`, 10, 60_000)) {
    return NextResponse.json<ActionResult>(
      { ok: false, message: "That's a lot of joins at once. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (body.website) {
      return NextResponse.json<ActionResult>(
        { ok: false, message: "We couldn't add you to the queue. Please see the host." },
        { status: 400 },
      );
    }
    const branchId = Number(body.branchId);
    if (!Number.isInteger(branchId) || branchId <= 0) {
      return NextResponse.json<ActionResult>({ ok: false, message: "Branch is required." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(COOKIE_NAME)?.value;
    const bodyToken = cleanText(body.existingToken, 64) || null;
    const guestToken = bodyToken ?? cookieToken ?? undefined;

    const result = await joinQueue(branchId, {
      guestName: String(body.guestName ?? ""),
      phone: body.phone ? String(body.phone) : undefined,
      partySize: Number(body.partySize),
      notes: body.notes ? String(body.notes) : undefined,
      source: "qr",
      actor: "Guest",
      guestToken,
    });

    const response = NextResponse.json<ActionResult>(
      { ok: true, data: result },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(COOKIE_NAME, result.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
    return response;
  } catch (error) {
    return NextResponse.json(actionError(error), { status: actionStatus(error) });
  }
}
