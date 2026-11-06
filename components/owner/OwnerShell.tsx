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
import { logoutAction } from "@/app/actions/auth";
import type { Restaurant } from "@/lib/types";

const sections = [
  {
    label: "Service",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/host", label: "Live floor", icon: DoorOpen, external: true },
      { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    label: "Manage",
    items: [
      { href: "/dashboard/tables", label: "Tables", icon: LayoutGrid },
      { href: "/dashboard/team", label: "Team", icon: Users },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
      { href: "/dashboard/qr", label: "QR poster", icon: QrCode },
    ],
  },
];

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

  const nav = (
    <nav className="flex flex-col gap-5">
      {sections.map((section) => (
        <div key={section.label}>
          <p className="mb-1.5 px-3 text-[0.625rem] font-bold uppercase tracking-[0.16em] text-paper/35">
            {section.label}
          </p>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-2.5 rounded-xl px-3 py-2 text-[0.8125rem] font-semibold transition ${
                    active ? "bg-paper text-ink" : "text-paper/65 hover:bg-white/8 hover:text-paper"
                  }`}
                >
                  <item.icon className={`size-4 ${active ? "text-clay" : "text-paper/40 group-hover:text-paper/70"}`} />
                  {item.label}
                  {item.external && <ExternalLink className="ml-auto size-3 opacity-40" />}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-[100dvh] bg-paper lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-[100dvh] flex-col border-r border-white/5 bg-ink px-4 py-5 lg:flex">
        <div className="px-1">
          <Logo tone="light" href="/dashboard" />
        </div>

        <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
          <div className="flex items-center gap-2.5">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: restaurant.accent }} />
            <div className="min-w-0">
              <p className="truncate text-[0.8125rem] font-bold text-paper">{restaurant.name}</p>
              <p className="truncate text-[0.625rem] text-paper/40">{restaurant.tagline}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5 text-[0.625rem] text-paper/40">
            <span>{restaurant.openTime}–{restaurant.closeTime}</span>
            <Link href="/" className="inline-flex items-center gap-1 hover:text-paper">
              Guest view <ExternalLink className="size-2.5" />
            </Link>
          </div>
        </div>

        <div className="mt-6 flex-1 overflow-y-auto">{nav}</div>

        <div className="mt-4 border-t border-white/10 pt-3">
          <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
            <span className="grid size-8 place-items-center rounded-full bg-clay text-[0.6875rem] font-extrabold text-white">
              {session.initials ?? session.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-paper">{session.name}</p>
              <p className="text-[0.625rem] text-paper/40">Owner</p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg p-1.5 text-paper/40 transition hover:bg-white/10 hover:text-paper"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 border-b border-line bg-paper/92 backdrop-blur-md lg:hidden">
          <div className="flex items-center justify-between px-4 py-2.5">
            <Logo href="/dashboard" />
            <div className="flex items-center gap-2">
              <Link href="/host" className="btn btn-soft btn-sm">
                <DoorOpen className="size-3.5" /> Floor
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="btn btn-ghost btn-icon" aria-label="Sign out">
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
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    active ? "bg-ink text-paper" : "text-muted hover:bg-cream"
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
