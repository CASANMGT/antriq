import type { Metadata } from "next";
import { OverviewBoard } from "@/components/owner/OverviewBoard";
import { getOwnerOverview } from "@/lib/store";
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
  const { session, active } = await resolveOwnerScope(params.branch);
  const overview = await getOwnerOverview(active.id, 7);
  return <OverviewBoard initial={overview} role={session.role} />;
}
