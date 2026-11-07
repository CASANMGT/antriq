import { redirect } from "next/navigation";
import { getSession, type Session } from "./auth";
import { listBranchesForStaff } from "./store";
import type { BranchSummary } from "./types";

export interface OwnerScope {
  session: Session;
  branches: BranchSummary[];
  active: BranchSummary;
}

/**
 * Resolve the branch an owner is looking at, falling back to their assigned
 * branch (branch owners) or the first branch they can access.
 */
export async function resolveOwnerScope(rawBranch: string | undefined): Promise<OwnerScope> {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");
  if (session.role !== "owner" && session.role !== "manager") redirect("/host");

  const branches = await listBranchesForStaff(session);
  if (branches.length === 0) redirect("/login?next=/dashboard");

  const requested = Number(rawBranch ?? "");
  const active =
    branches.find((branch) => branch.id === requested) ??
    branches.find((branch) => branch.id === session.branchId) ??
    branches[0];

  return { session, branches, active };
}

export function branchHref(path: string, branchId: number): string {
  return `${path}${path.includes("?") ? "&" : "?"}branch=${branchId}`;
}
