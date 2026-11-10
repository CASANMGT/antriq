import { redirect } from "next/navigation";
import { OwnerShell } from "@/components/owner/OwnerShell";
import { getSession } from "@/lib/auth";
import { listBranchesForStaff } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");
  if (session.role !== "owner") redirect("/host");

  const branches = await listBranchesForStaff(session);
  if (branches.length === 0) redirect("/login?next=/dashboard");

  return (
    <OwnerShell
      branches={branches}
      session={{ name: session.name, initials: session.initials, role: session.role }}
    >
      {children}
    </OwnerShell>
  );
}
