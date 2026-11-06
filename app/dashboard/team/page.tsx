import type { Metadata } from "next";
import { TeamManager } from "@/components/owner/TeamManager";
import { listStaff } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tim",
  robots: { index: false, follow: false },
};

export default async function TeamPage() {
  const staff = await listStaff();
  return <TeamManager staff={staff} />;
}
