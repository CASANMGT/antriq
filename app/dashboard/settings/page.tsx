import type { Metadata } from "next";
import { SettingsForm } from "@/components/owner/SettingsForm";
import { getRestaurant } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const restaurant = await getRestaurant();
  return <SettingsForm restaurant={restaurant} />;
}
