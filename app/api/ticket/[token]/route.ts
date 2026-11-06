import { NextResponse } from "next/server";
import { getTicketView } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const view = await getTicketView(token);
  if (!view) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(view, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
