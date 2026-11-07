import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/owner/SettingsForm";
import { getBranch } from "@/lib/store";
import { resolveOwnerScope } from "@/lib/scope";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pengaturan",
  robots: { index: false, follow: false },
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const params = await searchParams;
  const { session, active } = await resolveOwnerScope(params.branch);
  if (session.role !== "owner") redirect("/dashboard");
  const branch = await getBranch(active.id);
  return <SettingsForm branch={branch} />;
}
