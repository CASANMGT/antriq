import { NextResponse } from "next/server";
import { actionError, rateLimit } from "@/lib/action";
import { joinQueue } from "@/lib/store";
import type { ActionResult } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  if (!rateLimit(`join:${ip}`, 8, 60_000)) {
    return NextResponse.json<ActionResult>(
      { ok: false, message: "That's a lot of joins at once. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (body.website) {
      return NextResponse.json<ActionResult>(
        { ok: false, message: "We couldn't add you to the waitlist. Please see the host." },
        { status: 400 },
      );
    }
    const result = await joinQueue({
      guestName: String(body.guestName ?? ""),
      phone: body.phone ? String(body.phone) : undefined,
      partySize: Number(body.partySize),
      notes: body.notes ? String(body.notes) : undefined,
      source: "qr",
      actor: "Guest",
    });
    return NextResponse.json<ActionResult>(
      { ok: true, data: result },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const result = actionError(error);
    return NextResponse.json(result, { status: 400 });
  }
}
