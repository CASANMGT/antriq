import { redirect } from "next/navigation";
import { getPrimaryBranch } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * Clean demo shortcut. In a production/demo split, point the demo deployment
 * at a database with DEMO_MODE=1 and this redirects to its seeded branch.
 */
export default async function DemoPage() {
  const { branch, brand } = await getPrimaryBranch();
  redirect(`/b/${brand.slug}/${branch.slug}`);
}
