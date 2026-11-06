import { redirect } from "next/navigation";
import { OwnerShell } from "@/components/owner/OwnerShell";
import { getSession } from "@/lib/auth";
import { getRestaurant } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");
  if (session.role !== "owner") redirect("/host");

  const restaurant = await getRestaurant();
  return (
    <OwnerShell restaurant={restaurant} session={{ name: session.name, initials: session.initials }}>
      {children}
    </OwnerShell>
  );
}
