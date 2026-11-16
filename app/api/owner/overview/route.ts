import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getOwnerOverview, getOwnerOverviewForBranches, listBranchesForStaff } from "@/lib/store";
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
  const days = Number(url.searchParams.get("days") ?? "7");
  const windowDays = Number.isFinite(days) ? days : 7;

  if (url.searchParams.get("branch") === "all" && branches.length > 1) {
    const overview = await getOwnerOverviewForBranches(
      branches.map((branch) => branch.id),
      windowDays,
    );
    return NextResponse.json(overview, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }

  const branchId = Number.isInteger(requested) && requested > 0 ? requested : session.branchId ?? branches[0]?.id ?? PRIMARY_BRANCH_ID;

  if (!branches.some((branch) => branch.id === branchId)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const overview = await getOwnerOverview(branchId, windowDays);
  return NextResponse.json(overview, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
