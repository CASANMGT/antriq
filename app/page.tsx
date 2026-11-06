import { redirect } from "next/navigation";
import { getPrimaryBranch } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { branch, brand } = await getPrimaryBranch();
  redirect(`/b/${brand.slug}/${branch.slug}`);
}
