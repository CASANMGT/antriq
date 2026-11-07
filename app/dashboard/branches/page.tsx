import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BranchManager } from "@/components/owner/BranchManager";
import { getSession } from "@/lib/auth";
import { getBranch, listBrands, listBranchesForStaff } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cabang",
  robots: { index: false, follow: false },
};

export default async function BranchesPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");
  if (session.role !== "owner") redirect(session.role === "manager" ? "/dashboard" : "/host");

  const [allBrands, branches] = await Promise.all([listBrands(), listBranchesForStaff(session)]);
  let brands = allBrands;
  if (session.brandId) brands = allBrands.filter((brand) => brand.id === session.brandId);
  if (session.branchId) {
    const branch = await getBranch(session.branchId);
    brands = allBrands.filter((brand) => brand.id === branch.brandId);
  }

  const platform = !session.brandId && !session.branchId;
  const editableIds = platform
    ? branches.map((branch) => branch.id)
    : session.brandId
      ? branches.map((branch) => branch.id)
      : session.branchId
        ? [session.branchId]
        : [];

  return (
    <BranchManager
      branches={branches}
      brands={brands.map((brand) => ({ id: brand.id, name: brand.name }))}
      canCreate={!session.branchId}
      editableIds={editableIds}
    />
  );
}
