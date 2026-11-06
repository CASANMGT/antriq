import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandManager } from "@/components/owner/BrandManager";
import { getSession } from "@/lib/auth";
import { getBranch, listBrands, listBranchesForStaff } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Brand",
  robots: { index: false, follow: false },
};

export default async function BrandsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");
  if (session.role !== "owner") redirect("/host");

  const [allBrands, branches] = await Promise.all([listBrands(), listBranchesForStaff(session)]);
  let brands = allBrands;
  if (session.brandId) brands = allBrands.filter((brand) => brand.id === session.brandId);
  if (session.branchId) {
    const branch = await getBranch(session.branchId);
    brands = allBrands.filter((brand) => brand.id === branch.brandId);
  }

  const platform = !session.brandId && !session.branchId;
  const editableIds = platform
    ? brands.map((brand) => brand.id)
    : session.brandId
      ? [session.brandId]
      : [];

  return (
    <BrandManager
      brands={brands}
      branches={branches}
      canCreate={platform}
      editableIds={editableIds}
    />
  );
}
