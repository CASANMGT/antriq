import type { Metadata } from "next";
import { OverviewBoard } from "@/components/owner/OverviewBoard";
import { RatingAnalytics } from "@/components/owner/RatingAnalytics";
import { getOwnerOverview, getOwnerOverviewForBranches, getRatingRecords } from "@/lib/store";
import { resolveOwnerScope } from "@/lib/scope";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const params = await searchParams;
  const { branches, active } = await resolveOwnerScope(params.branch === "all" ? undefined : params.branch);
  const canSeeAll = branches.length > 1;
  const showAll = canSeeAll && params.branch === "all";
  const branchIds = branches.map((branch) => branch.id);
  const [overview, ratingRecords] = await Promise.all([
    showAll ? getOwnerOverviewForBranches(branchIds, 7) : getOwnerOverview(active.id, 7),
    getRatingRecords(showAll ? branchIds : [active.id], 30),
  ]);
  const branchNames = Object.fromEntries(branches.map((branch) => [branch.id, branch.name]));

  return (
    <div className="space-y-5">
      <OverviewBoard
        initial={overview}
        allBranches={showAll}
        activeBranchId={active.id}
        canSeeAll={canSeeAll}
        branchCount={branches.length}
        branchNames={showAll ? branchNames : undefined}
      />
      <RatingAnalytics
        records={ratingRecords}
        branches={showAll ? branches : [active]}
        allBranches={showAll}
        branchName={active.name}
        days={30}
      />
    </div>
  );
}
