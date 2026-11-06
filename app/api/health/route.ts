import { NextResponse } from "next/server";
import { q } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await q("select 1 as ok");
    return NextResponse.json({ ok: true, service: "antriq", time: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      { ok: false, service: "antriq", error: error instanceof Error ? error.message : "database error" },
      { status: 503 },
    );
  }
}
