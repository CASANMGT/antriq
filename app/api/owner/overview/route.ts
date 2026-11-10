import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getOwnerOverview, listBranchesForStaff } from "@/lib/store";
import { PRIMARY_BRANCH_ID } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const url = new URL(request.url);
  const requested = Number(url.searchParams.get("branch") ?? "");
  const branches = await listBranchesForStaff(session);
  const branchId = Number.isInteger(requested) && requested > 0 ? requested : session.branchId ?? branches[0]?.id ?? PRIMARY_BRANCH_ID;

  if (!branches.some((branch) => branch.id === branchId)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const days = Number(url.searchParams.get("days") ?? "7");
  const overview = await getOwnerOverview(branchId, Number.isFinite(days) ? days : 7);
  return NextResponse.json(overview, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
