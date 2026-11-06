import type { Metadata } from "next";
import { TablesManager } from "@/components/owner/TablesManager";
import { listTables } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Meja",
  robots: { index: false, follow: false },
};

export default async function TablesPage() {
  const tables = await listTables();
  return <TablesManager tables={tables} />;
}
