import { getSession } from "@/lib/auth";
import { canManageBranch, getReportCsv, listBranchesForStaff } from "@/lib/store";
import { PRIMARY_BRANCH_ID } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return new Response("Unauthorised", { status: 401 });
  }

  const url = new URL(request.url);
  const requested = Number(url.searchParams.get("branch") ?? "");
  const branches = await listBranchesForStaff(session);
  const branchId = Number.isInteger(requested) && requested > 0 ? requested : session.branchId ?? branches[0]?.id ?? PRIMARY_BRANCH_ID;
  if (!(await canManageBranch(session, branchId))) {
    return new Response("Forbidden", { status: 403 });
  }

  const days = Math.min(90, Math.max(1, Number(url.searchParams.get("days") ?? "30") || 30));
  const csv = await getReportCsv(branchId, days);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="antriq-report-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
