import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TicketScreen } from "@/components/ticket/TicketScreen";
import { getTicketView } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const view = await getTicketView(token);
  if (!view) return { title: "Ticket not found" };
  return {
    title: `${view.entry.code} · ${view.branch.name}`,
    description: `Your live waitlist ticket at ${view.branch.name}.`,
    robots: { index: false, follow: false },
  };
}

export default async function TicketPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const view = await getTicketView(token);
  if (!view) notFound();
  return <TicketScreen token={token} initial={view} />;
}
