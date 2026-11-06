"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  DoorOpen,
  ExternalLink,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  QrCode,
  Settings,
  Users,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLang } from "@/components/LanguageProvider";
import { logoutAction } from "@/app/actions/auth";
import type { Restaurant } from "@/lib/types";

export function OwnerShell({
  children,
  restaurant,
  session,
}: {
  children: React.ReactNode;
  restaurant: Restaurant;
  session: { name: string; initials: string | null };
}) {
  const pathname = usePathname();
  const { t } = useLang();

  const sections = [
    {
      label: t.owner.navService,
      items: [
        { href: "/dashboard", label: t.owner.overview, icon: LayoutDashboard },
        { href: "/host", label: t.owner.liveFloor, icon: DoorOpen, external: true },
        { href: "/dashboard/reports", label: t.owner.reports, icon: BarChart3 },
      ],
    },
    {
      label: t.owner.navManage,
      items: [
        { href: "/dashboard/tables", label: t.owner.tables, icon: LayoutGrid },
        { href: "/dashboard/team", label: t.owner.team, icon: Users },
        { href: "/dashboard/settings", label: t.owner.settings, icon: Settings },
        { href: "/dashboard/qr", label: t.owner.qr, icon: QrCode },
      ],
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-paper lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-[100dvh] flex-col border-r-2 border-ink bg-cream px-4 py-5 lg:flex">
        <div className="flex items-center justify-between px-1">
          <Logo href="/dashboard" />
          <LanguageToggle compact />
        </div>

        <div className="mt-6 rounded-2xl border-2 border-ink bg-white p-3.5 shadow-[3px_3px_0_#262321]">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-tomato text-sm font-extrabold text-white">
              {restaurant.name.slice(0, 1)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[0.8125rem] font-extrabold text-ink">{restaurant.name}</p>
              <p className="truncate text-[0.625rem] font-semibold text-muted">{restaurant.tagline}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t-2 border-dashed border-ink/15 pt-2.5 text-[0.625rem] font-bold text-muted">
            <span>{restaurant.openTime}–{restaurant.closeTime}</span>
            <Link href="/" className="inline-flex items-center gap-1 hover:text-tomato">
              {t.common.guestView} <ExternalLink className="size-2.5" />
            </Link>
          </div>
        </div>

        <div className="mt-6 flex-1 overflow-y-auto">
          <nav className="flex flex-col gap-5">
            {sections.map((section) => (
              <div key={section.label}>
                <p className="mb-1.5 px-3 text-[0.625rem] font-extrabold uppercase tracking-[0.14em] text-ink/40">
                  {section.label}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`group flex items-center gap-2.5 rounded-xl border-2 px-3 py-2 text-[0.8125rem] font-extrabold transition ${
                          active
                            ? "border-ink bg-tomato text-white shadow-[2px_2px_0_#262321]"
                            : "border-transparent text-ink/65 hover:border-ink/15 hover:bg-white/70 hover:text-ink"
                        }`}
                      >
                        <item.icon className={`size-4 ${active ? "text-white" : "text-ink/45 group-hover:text-tomato"}`} />
                        {item.label}
                        {item.external && <ExternalLink className="ml-auto size-3 opacity-40" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-4 border-t-2 border-ink/15 pt-3">
          <div className="flex items-center gap-2.5 rounded-xl px-1 py-2">
            <span className="grid size-9 place-items-center rounded-full border-2 border-ink bg-tomato text-[0.6875rem] font-extrabold text-white">
              {session.initials ?? session.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-extrabold text-ink">{session.name}</p>
              <p className="text-[0.625rem] font-semibold text-muted">{t.owner.owner}</p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg p-1.5 text-ink/40 transition hover:bg-white hover:text-tomato"
                aria-label={t.common.logout}
                title={t.common.logout}
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 border-b-2 border-ink bg-cream/95 backdrop-blur-md lg:hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-2.5">
            <Logo href="/dashboard" />
            <div className="flex items-center gap-1.5">
              <LanguageToggle compact />
              <Link href="/host" className="btn btn-soft btn-sm">
                <DoorOpen className="size-3.5" /> <span className="hidden sm:inline">{t.owner.liveFloor}</span>
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="btn btn-ghost btn-icon" aria-label={t.common.logout}>
                  <LogOut className="size-4" />
                </button>
              </form>
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto px-3 pb-2">
            {sections.flatMap((section) => section.items).map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-extrabold ${
                    active ? "border-ink bg-ink text-paper" : "border-transparent text-ink/60 hover:bg-white"
                  }`}
                >
                  <item.icon className="size-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1280px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
