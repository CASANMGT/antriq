import { getSession } from "@/lib/auth";
import { getReportCsv, getReportCsvForBranches, listBranchesForStaff } from "@/lib/store";
import { PRIMARY_BRANCH_ID } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return new Response("Unauthorised", { status: 401 });
  }

  const url = new URL(request.url);
  const rawBranch = url.searchParams.get("branch");
  const branches = await listBranchesForStaff(session);
  const days = Math.min(90, Math.max(1, Number(url.searchParams.get("days") ?? "30") || 30));

  if (rawBranch === "all") {
    const csv = await getReportCsvForBranches(
      branches.map((branch) => branch.id),
      days,
    );
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="antriq-all-branches-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const requested = Number(rawBranch ?? "");
  const branchId =
    Number.isInteger(requested) && requested > 0 ? requested : session.branchId ?? branches[0]?.id ?? PRIMARY_BRANCH_ID;
  if (!branches.some((branch) => branch.id === branchId)) {
    return new Response("Forbidden", { status: 403 });
  }

  const csv = await getReportCsv(branchId, days);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="antriq-report-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
