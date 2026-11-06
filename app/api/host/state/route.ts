import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canOperateBranch, getHostState } from "@/lib/store";
import { PRIMARY_BRANCH_ID } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  const url = new URL(request.url);
  const branchId = Number(url.searchParams.get("branch") ?? PRIMARY_BRANCH_ID);
  if (!(await canOperateBranch(session, branchId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const state = await getHostState(branchId);
  return NextResponse.json(state, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
