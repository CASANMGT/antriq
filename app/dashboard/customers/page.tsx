import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download, Phone, Users } from "lucide-react";
import { getCustomerList } from "@/lib/store";
import { resolveOwnerScope } from "@/lib/scope";
import { clockInTz, formatDayLong } from "@/lib/time";
import { getLang } from "@/lib/lang";
import { format, getDict } from "@/lib/i18n";
import type { EntryStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tamu",
  robots: { index: false, follow: false },
};

const RANGES = [1, 7, 30] as const;

function statusKey(status: EntryStatus): "waiting" | "called" | "seated" | "completed" | "noShow" | "cancelled" {
  return status === "no_show" ? "noShow" : status;
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; branch?: string }>;
}) {
  const params = await searchParams;
  const requested = Number(params.days ?? "1");
  const days = RANGES.includes(requested as (typeof RANGES)[number]) ? requested : 1;
  const { active } = await resolveOwnerScope(params.branch);
  const [customers, lang] = await Promise.all([getCustomerList(active.id, days), getLang()]);
  const t = getDict(lang);
  const locale = lang === "id" ? "id-ID" : "en-GB";
  const visible = customers.slice(0, 250);

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
            {active.brandName} · {active.name} · {format(t.owner.customersSub, { count: customers.length })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border-2 border-ink bg-white p-1">
            {RANGES.map((range) => (
              <Link
                key={range}
                href={`/dashboard/customers?days=${range}&branch=${active.id}`}
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

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b-2 border-ink bg-cream/70 px-4 py-3 sm:px-5">
          <div>
            <h2 className="font-display text-[1.5rem] font-semibold leading-tight">{t.owner.customersList}</h2>
            <p className="text-xs font-semibold text-muted">{t.owner.customersListSub}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-ink/55">
            <Users className="size-3.5" /> {customers.length}
          </span>
        </div>

        {visible.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm font-semibold text-muted">{t.owner.customersEmpty}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b-2 border-ink/15 bg-cream/40 text-left text-[0.625rem] uppercase tracking-[0.12em] text-ink/50">
                  <th className="px-4 py-2.5 font-extrabold sm:px-5">{t.owner.customer}</th>
                  <th className="px-3 py-2.5 font-extrabold">{t.owner.contact}</th>
                  <th className="px-3 py-2.5 font-extrabold text-right">{t.common.paxShort}</th>
                  <th className="px-3 py-2.5 font-extrabold">{t.owner.status}</th>
                  <th className="px-3 py-2.5 font-extrabold">{t.owner.tableSeat}</th>
                  <th className="px-3 py-2.5 font-extrabold">{t.owner.picOpened}</th>
                  <th className="px-3 py-2.5 font-extrabold">{t.owner.picReleased}</th>
                  <th className="px-4 py-2.5 font-extrabold sm:px-5">{t.owner.joinedAt}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((entry) => (
                  <tr key={entry.id} className="border-b-2 border-dashed border-ink/10 last:border-0 hover:bg-cream/30">
                    <td className="px-4 py-2.5 sm:px-5">
                      <p className="font-extrabold">{entry.guestName}</p>
                      <p className="num text-[0.6875rem] font-bold text-muted">{entry.code}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      {entry.phone ? (
                        <a href={`tel:${entry.phone}`} className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink">
                          <Phone className="size-3" /> {entry.phone}
                        </a>
                      ) : (
                        <span className="text-xs font-semibold text-muted-soft">{t.common.none}</span>
                      )}
                    </td>
                    <td className="num px-3 py-2.5 text-right font-semibold">{entry.partySize}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`pill ${
                          entry.status === "waiting"
                            ? "status-waiting"
                            : entry.status === "called"
                              ? "status-called"
                              : entry.status === "seated"
                                ? "status-seated"
                                : entry.status === "completed"
                                  ? "status-muted"
                                  : "status-muted"
                        }`}
                      >
                        {t.status[statusKey(entry.status)]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs font-semibold">
                      {entry.tableLabel ? (
                        <span>
                          {entry.tableLabel}
                          {entry.seatNumber !== null ? ` · ${format(t.host.seatValue, { seat: entry.seatNumber })}` : ""}
                        </span>
                      ) : (
                        <span className="text-muted-soft">{t.common.none}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-semibold">{entry.openedBy ?? t.common.none}</td>
                    <td className="px-3 py-2.5 text-xs font-semibold">{entry.releasedBy ?? t.common.none}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-muted sm:px-5">
                      <p>{formatDayLong(entry.day, locale)}</p>
                      <p className="num">{clockInTz(entry.joinedAt, active.timezone)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
