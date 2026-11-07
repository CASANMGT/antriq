"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Building2,
  ChevronDown,
  DoorOpen,
  ExternalLink,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  QrCode,
  Settings,
  Store,
  Users,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLang } from "@/components/LanguageProvider";
import { logoutAction } from "@/app/actions/auth";
import type { BranchSummary, Role } from "@/lib/types";
import { APP_VERSION } from "@/lib/version";

function withBranch(href: string, branchId: number): string {
  return `${href}${href.includes("?") ? "&" : "?"}branch=${branchId}`;
}

export function OwnerShell({
  children,
  branches,
  session,
}: {
  children: React.ReactNode;
  branches: BranchSummary[];
  session: { name: string; initials: string | null; role: Role };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useLang();
  const isOwner = session.role === "owner";

  const requested = Number(params.get("branch") ?? "");
  const active = branches.find((branch) => branch.id === requested) ?? branches[0];

  const sections = [
    {
      label: t.owner.navService,
      items: [
        { href: withBranch("/dashboard", active.id), base: "/dashboard", label: t.owner.overview, icon: LayoutDashboard },
        { href: withBranch("/host", active.id), base: "/host", label: t.owner.liveFloor, icon: DoorOpen, external: true },
        { href: withBranch("/dashboard/reports", active.id), base: "/dashboard/reports", label: t.owner.reports, icon: BarChart3 },
      ],
    },
    {
      label: t.owner.navManage,
      items: [
        { href: withBranch("/dashboard/tables", active.id), base: "/dashboard/tables", label: t.owner.tables, icon: LayoutGrid },
        { href: withBranch("/dashboard/customers", active.id), base: "/dashboard/customers", label: t.owner.customers, icon: Users },
        { href: withBranch("/dashboard/team", active.id), base: "/dashboard/team", label: t.owner.team, icon: Users },
        { href: withBranch("/dashboard/settings", active.id), base: "/dashboard/settings", label: t.owner.settings, icon: Settings },
        { href: withBranch("/dashboard/qr", active.id), base: "/dashboard/qr", label: t.owner.qr, icon: QrCode },
      ].filter((item) =>
        isOwner || !["/dashboard/tables", "/dashboard/team", "/dashboard/settings"].includes(item.base),
      ),
    },
    {
      label: t.owner.navBusiness,
      items: isOwner
        ? [
            { href: withBranch("/dashboard/brands", active.id), base: "/dashboard/brands", label: t.owner.brands, icon: Store },
            { href: withBranch("/dashboard/branches", active.id), base: "/dashboard/branches", label: t.owner.branches, icon: Building2 },
          ]
        : [],
    },
  ].filter((section) => section.items.length > 0);

  function switchBranch(branchId: number) {
    router.push(withBranch(pathname, branchId));
  }

  return (
    <div className="min-h-[100dvh] bg-paper lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-[100dvh] flex-col border-r-2 border-ink bg-cream px-4 py-5 lg:flex">
        <div className="flex items-center justify-between px-1">
          <Logo href={withBranch("/dashboard", active.id)} />
          <LanguageToggle compact />
        </div>

        <div className="mt-6 rounded-2xl border-2 border-ink bg-white p-3.5 shadow-[3px_3px_0_#262321]">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-tomato text-sm font-extrabold text-white">
              {active.brandName.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.625rem] font-extrabold uppercase tracking-[0.12em] text-ink/45">
                {active.brandName}
              </p>
              <p className="truncate text-[0.8125rem] font-extrabold text-ink">{active.name}</p>
            </div>
          </div>

          {branches.length > 1 && (
            <div className="relative mt-3">
              <label className="sr-only" htmlFor="owner-branch">
                {t.common.branch}
              </label>
              <select
                id="owner-branch"
                className="input h-9 appearance-none bg-cream py-0 pr-7 text-xs font-extrabold"
                value={active.id}
                onChange={(event) => switchBranch(Number(event.target.value))}
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.brandName} · {branch.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
            </div>
          )}

          <div className="mt-3 flex items-center justify-between border-t-2 border-dashed border-ink/15 pt-2.5 text-[0.625rem] font-bold text-muted">
            <span className="truncate">{active.address ?? active.timezone}</span>
            <Link href={`/b/${active.brandSlug}/${active.slug}`} className="inline-flex shrink-0 items-center gap-1 hover:text-tomato">
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
                    const activeItem = pathname === item.base;
                    return (
                      <Link
                        key={item.base}
                        href={item.href}
                        className={`group flex items-center gap-2.5 rounded-xl border-2 px-3 py-2 text-[0.8125rem] font-extrabold transition ${
                          activeItem
                            ? "border-ink bg-tomato text-white shadow-[2px_2px_0_#262321]"
                            : "border-transparent text-ink/65 hover:border-ink/15 hover:bg-white/70 hover:text-ink"
                        }`}
                      >
                        <item.icon className={`size-4 ${activeItem ? "text-white" : "text-ink/45 group-hover:text-tomato"}`} />
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
              <p className="text-[0.625rem] font-semibold text-muted">{isOwner ? t.owner.owner : t.login.managerRole}</p>
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
          <Link href="/changelog" className="mt-1 inline-flex px-1 text-[0.625rem] font-bold text-muted hover:text-tomato">
            v{APP_VERSION} · {t.changelog.title}
          </Link>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 border-b-2 border-ink bg-cream/95 backdrop-blur-md lg:hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-2.5">
            <Logo href={withBranch("/dashboard", active.id)} />
            <div className="flex items-center gap-1.5">
              <LanguageToggle compact />
              <Link href={withBranch("/host", active.id)} className="btn btn-soft btn-sm">
                <DoorOpen className="size-3.5" /> <span className="hidden sm:inline">{t.owner.liveFloor}</span>
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="btn btn-ghost btn-icon" aria-label={t.common.logout}>
                  <LogOut className="size-4" />
                </button>
              </form>
            </div>
          </div>
          {branches.length > 1 && (
            <div className="px-3 pb-2">
              <div className="relative">
                <label className="sr-only" htmlFor="owner-branch-mobile">
                  {t.common.branch}
                </label>
                <select
                  id="owner-branch-mobile"
                  className="input h-9 w-full appearance-none bg-white py-0 pr-7 text-xs font-extrabold"
                  value={active.id}
                  onChange={(event) => switchBranch(Number(event.target.value))}
                >
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.brandName} · {branch.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
              </div>
            </div>
          )}
          <div className="flex gap-1 overflow-x-auto px-3 pb-2">
            {sections.flatMap((section) => section.items).map((item) => {
              const activeItem = pathname === item.base;
              return (
                <Link
                  key={item.base}
                  href={item.href}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-extrabold ${
                    activeItem ? "border-ink bg-ink text-paper" : "border-transparent text-ink/60 hover:bg-white"
                  }`}
                >
                  <item.icon className="size-3.5" />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/changelog"
              className="inline-flex shrink-0 items-center rounded-full border-2 border-transparent px-3 py-1.5 text-[0.625rem] font-extrabold text-muted hover:bg-white"
            >
              v{APP_VERSION}
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1280px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
