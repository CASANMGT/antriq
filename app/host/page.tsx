import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HostBoard } from "@/components/host/HostBoard";
import { getSession } from "@/lib/auth";
import { getHostState } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Host stand",
  robots: { index: false, follow: false },
};

export default async function HostPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/host");
  const state = await getHostState();

  return <HostBoard initial={state} staff={{ name: session.name, role: session.role, initials: session.initials }} />;
}
