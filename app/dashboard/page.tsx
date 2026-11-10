import type { Metadata } from "next";
import { OverviewBoard } from "@/components/owner/OverviewBoard";
import { RatingAnalytics } from "@/components/owner/RatingAnalytics";
import { getOwnerOverview, getRatingRecords } from "@/lib/store";
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
  const { branches, active } = await resolveOwnerScope(params.branch);
  const [overview, ratingRecords] = await Promise.all([
    getOwnerOverview(active.id, 7),
    getRatingRecords(branches.map((branch) => branch.id), 30),
  ]);
  return (
    <div className="space-y-5">
      <OverviewBoard initial={overview} />
      <RatingAnalytics records={ratingRecords} branches={branches} />
    </div>
  );
}
