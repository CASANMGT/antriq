import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TablesManager } from "@/components/owner/TablesManager";
import { listTables } from "@/lib/store";
import { resolveOwnerScope } from "@/lib/scope";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Meja",
  robots: { index: false, follow: false },
};

export default async function TablesPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const params = await searchParams;
  const { session, active } = await resolveOwnerScope(params.branch);
  if (session.role !== "owner") redirect("/dashboard");
  const tables = await listTables(active.id);
  return <TablesManager tables={tables} branchId={active.id} />;
}
