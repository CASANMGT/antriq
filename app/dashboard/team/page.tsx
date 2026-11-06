import type { Metadata } from "next";
import { TeamManager } from "@/components/owner/TeamManager";
import { listBrands, listStaff } from "@/lib/store";
import { resolveOwnerScope } from "@/lib/scope";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tim",
  robots: { index: false, follow: false },
};

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const params = await searchParams;
  const { session, branches, active } = await resolveOwnerScope(params.branch);

  const allBrands = await listBrands();
  const brands = session.brandId
    ? allBrands.filter((brand) => brand.id === session.brandId)
    : session.branchId
      ? allBrands.filter((brand) => brand.id === active.brandId)
      : allBrands;

  const all = await listStaff();
  const staff = session.branchId
    ? all.filter((person) => person.branchId === session.branchId)
    : session.brandId
      ? all.filter((person) => person.brandId === session.brandId)
      : all;

  return (
    <TeamManager
      staff={staff}
      brands={brands.map((brand) => ({ id: brand.id, name: brand.name }))}
      branches={branches}
      defaultBranchId={active.id}
      scope={{ role: session.role, brandId: session.brandId, branchId: session.branchId }}
    />
  );
}
