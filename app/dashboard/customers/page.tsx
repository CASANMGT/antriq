import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { CustomerTable } from "@/components/owner/CustomerTable";
import { RepeatCustomersTable } from "@/components/owner/RepeatCustomersTable";
import { getCustomerList, getCustomerProfiles, listStarredPhones } from "@/lib/store";
import { resolveOwnerScope } from "@/lib/scope";
import { getLang } from "@/lib/lang";
import { format, getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tamu",
  robots: { index: false, follow: false },
};

const RANGES = [1, 7, 30] as const;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; branch?: string; view?: string }>;
}) {
  const params = await searchParams;
  const requested = Number(params.days ?? "1");
  const days = RANGES.includes(requested as (typeof RANGES)[number]) ? requested : 1;
  const view = params.view === "customers" ? "customers" : "entries";
  const { branches, active } = await resolveOwnerScope(params.branch);
  const customers = view === "entries" ? await getCustomerList(active.id, days) : [];
  const profiles =
    view === "customers"
      ? await getCustomerProfiles(
          branches.map((branch) => branch.id),
          days,
          active.id,
          active.brandId,
        )
      : [];
  const [starredPhones, lang] = await Promise.all([listStarredPhones(), getLang()]);
  const t = getDict(lang);
  const locale = lang === "id" ? "id-ID" : "en-GB";

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href={`/dashboard?branch=${active.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-muted hover:text-ink"
          >
            <ArrowLeft className="size-3.5" /> {t.owner.overview}
          </Link>
          <p className="eyebrow mt-3 text-tomato">{t.owner.customersKicker}</p>
          <h1 className="mt-1 font-display text-[2.5rem] font-semibold leading-none tracking-tight">
            {t.owner.customersTitle}
          </h1>
          <p className="mt-2 text-sm font-semibold text-muted">
            {active.brandName} · {active.name} ·{" "}
            {view === "customers"
              ? `${profiles.length} ${t.owner.customersViewProfiles.toLowerCase()}`
              : format(t.owner.customersSub, { count: customers.length })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border-2 border-ink bg-white p-1">
            <Link
              href={`/dashboard/customers?days=${days}&branch=${active.id}&view=entries`}
              className={`rounded-full px-3 py-1.5 text-xs font-extrabold transition ${
                view === "entries" ? "bg-ink text-paper" : "text-muted hover:text-ink"
              }`}
            >
              {t.owner.customersViewEntries}
            </Link>
            <Link
              href={`/dashboard/customers?days=${days}&branch=${active.id}&view=customers`}
              className={`rounded-full px-3 py-1.5 text-xs font-extrabold transition ${
                view === "customers" ? "bg-ink text-paper" : "text-muted hover:text-ink"
              }`}
            >
              {t.owner.customersViewProfiles}
            </Link>
          </div>
          <div className="flex rounded-full border-2 border-ink bg-white p-1">
            {RANGES.map((range) => (
              <Link
                key={range}
                href={`/dashboard/customers?days=${range}&branch=${active.id}&view=${view}`}
                className={`rounded-full px-3 py-1.5 text-xs font-extrabold transition ${
                  range === days ? "bg-ink text-paper" : "text-muted hover:text-ink"
                }`}
              >
                {range === 1 ? t.common.today : `${range}d`}
              </Link>
            ))}
          </div>
          <a href={`/api/owner/export?days=${days}&branch=${active.id}`} className="btn btn-soft btn-sm" download>
            <Download className="size-3.5" /> {t.owner.exportCsv}
          </a>
        </div>
      </header>

      {view === "customers" ? (
        <RepeatCustomersTable
          profiles={profiles}
          starredPhones={starredPhones}
          branchId={active.id}
          branchName={active.name}
          brandName={active.brandName ?? "AntriQ"}
          timezone={active.timezone}
          locale={locale}
          days={days}
        />
      ) : (
        <CustomerTable
          customers={customers}
          starredPhones={starredPhones}
          branchId={active.id}
          timezone={active.timezone}
          locale={locale}
        />
      )}
    </div>
  );
}
