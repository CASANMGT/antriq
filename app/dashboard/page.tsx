import type { Metadata } from "next";
import { OverviewBoard } from "@/components/owner/OverviewBoard";
import { getOwnerOverview } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const overview = await getOwnerOverview(7);
  return <OverviewBoard initial={overview} />;
}
