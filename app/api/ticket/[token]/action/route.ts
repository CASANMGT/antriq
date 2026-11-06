import { NextResponse } from "next/server";
import { actionError, rateLimit } from "@/lib/action";
import { acknowledgeTicket, cancelTicket } from "@/lib/store";
import type { ActionResult } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  if (!rateLimit(`ticket:${ip}`, 12, 60_000)) {
    return NextResponse.json<ActionResult>(
      { ok: false, message: "Please wait a moment before trying again." },
      { status: 429 },
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { action?: string };
    const action = String(body.action ?? "");
    if (action === "cancel") {
      return NextResponse.json(await cancelTicket(token), { headers: { "Cache-Control": "no-store" } });
    }
    if (action === "acknowledge") {
      return NextResponse.json(await acknowledgeTicket(token), {
        headers: { "Cache-Control": "no-store" },
      });
    }
    return NextResponse.json<ActionResult>({ ok: false, message: "Unknown action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(actionError(error), { status: 400 });
  }
}
