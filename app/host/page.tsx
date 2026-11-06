import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HostBoard } from "@/components/host/HostBoard";
import { getSession } from "@/lib/auth";
import { canOperateBranch, getHostState, listBranchesForStaff } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Host stand",
  robots: { index: false, follow: false },
};

export default async function HostPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/host");

  const params = await searchParams;
  const branches = await listBranchesForStaff(session);
  if (branches.length === 0) redirect("/login?next=/host");

  const requested = Number(params.branch ?? "");
  const active =
    branches.find((branch) => branch.id === requested) ??
    branches.find((branch) => branch.id === session.branchId) ??
    branches[0];

  if (!(await canOperateBranch(session, active.id))) redirect("/login?next=/host");

  const state = await getHostState(active.id);

  return (
    <HostBoard
      initial={state}
      staff={{ name: session.name, role: session.role, initials: session.initials }}
      branches={branches}
      activeBranchId={active.id}
    />
  );
}
