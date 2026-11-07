import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Mascot } from "@/components/Mascot";
import { LanguageToggle } from "@/components/LanguageToggle";
import { LoginForm } from "@/components/login/LoginForm";
import { getSession } from "@/lib/auth";
import { getPublicSnapshot, getPrimaryBranch, listStaffPublic } from "@/lib/store";
import { isDemoMode } from "@/lib/seed";
import { getLang } from "@/lib/lang";
import { format, getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Akses staf",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();
  if (session) redirect(session.role === "owner" || session.role === "manager" ? "/dashboard" : "/host");

  const { next } = await searchParams;
  const primary = await getPrimaryBranch();
  const [staff, snapshot, lang] = await Promise.all([
    listStaffPublic(),
    getPublicSnapshot(primary.branch.id),
    getLang(),
  ]);
  const t = getDict(lang);
  const safeNext = next === "/host" || next === "/dashboard" ? next : "";
  const demoLogins = isDemoMode() && process.env.NODE_ENV !== "production";

  return (
    <main className="grid min-h-[100dvh] lg:grid-cols-[1.02fr_0.98fr]">
      <aside className="relative hidden overflow-hidden border-r-2 border-ink bg-tomato p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-28 -top-28 size-[30rem] rounded-full border-[3rem] border-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 size-[24rem] rounded-full border-[2.5rem] border-butter/20" />

        <div className="relative">
          <Logo tone="light" />
        </div>

        <div className="relative max-w-md">
          <p className="eyebrow text-white/60">{t.login.kicker}</p>
          <h1 className="mt-5 font-display text-[3.8rem] font-semibold leading-[0.92] tracking-tight text-butter">
            {t.guest.heroTitle1}
            <br />
            {t.guest.heroTitle2}
            <br />
            <span className="text-white">{t.guest.heroTitle3}</span>
          </h1>
          <p className="mt-6 max-w-sm text-sm font-semibold leading-relaxed text-white/75">{t.login.subtitle}</p>
          <Mascot mood="calm" className="mt-6 w-44" />
        </div>

        <div className="relative flex items-center gap-5 text-xs font-bold text-white/65">
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 px-3 py-1.5">
            <span className="live-dot" /> {format(t.host.tablesFree, { count: snapshot.availableTables })}
          </span>
          <Link href="/" className="inline-flex items-center gap-1 hover:text-white">
            {t.common.guestView} <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </aside>

      <section className="paper grain flex min-h-[100dvh] flex-col px-5 py-5 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between lg:hidden">
          <Logo />
          <div className="flex items-center gap-2">
            <LanguageToggle compact />
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink">
              <ArrowLeft className="size-3.5" /> {t.ticket.back}
            </Link>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[24rem] flex-1 flex-col justify-center py-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow text-tomato">{t.login.kicker}</p>
              <h2 className="mt-2 font-display text-[2.7rem] font-semibold leading-[0.92] tracking-tight">{t.login.title}</h2>
            </div>
            <div className="hidden lg:block">
              <LanguageToggle compact />
            </div>
          </div>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-muted">{t.login.subtitle}</p>

          <div className="mt-8">
            <LoginForm staff={staff} next={safeNext} demo={demoLogins} />
          </div>

          <div className="mt-8 flex items-center justify-between text-xs font-semibold text-muted">
            <Link href="/" className="inline-flex items-center gap-1.5 hover:text-ink">
              <ArrowLeft className="size-3.5" /> {t.login.back}
            </Link>
            <span className="hidden sm:inline">AntriQ · {t.common.staff}</span>
          </div>
        </div>
      </section>
    </main>
  );
}
