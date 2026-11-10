import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCustomerHistory, listBranchesForStaff } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const url = new URL(request.url);
  const branchId = Number(url.searchParams.get("branch"));
  const phone = url.searchParams.get("phone");
  const name = url.searchParams.get("name");
  const branches = await listBranchesForStaff(session);
  const branch = branches.find((item) => item.id === branchId) ?? branches[0];
  if (!branch) return NextResponse.json({ error: "branch_not_found" }, { status: 403 });

  // Owners can see every queue attempt across the branches in their scope.
  const items = await getCustomerHistory(
    branches.map((item) => item.id),
    { phone, name },
  );
  return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
}
