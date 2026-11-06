import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getOwnerOverview } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  const url = new URL(request.url);
  const days = Number(url.searchParams.get("days") ?? "7");
  const overview = await getOwnerOverview(Number.isFinite(days) ? days : 7);
  return NextResponse.json(overview, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
