import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Clock3 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LoginForm } from "@/components/login/LoginForm";
import { getSession } from "@/lib/auth";
import { getPublicSnapshot, listStaffPublic } from "@/lib/store";
import { isDemoMode } from "@/lib/seed";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Staff sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();
  if (session) redirect(session.role === "owner" ? "/dashboard" : "/host");

  const { next } = await searchParams;
  const [staff, snapshot] = await Promise.all([listStaffPublic(), getPublicSnapshot()]);
  const safeNext = next === "/host" || next === "/dashboard" ? next : "";

  return (
    <main className="grid min-h-[100dvh] lg:grid-cols-[1.02fr_0.98fr]">
      <aside className="relative hidden overflow-hidden bg-ink p-10 text-paper lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute -right-32 -top-32 size-[34rem] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(200,69,43,0.38), transparent 65%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-20 size-[28rem] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(184,130,48,0.2), transparent 65%)" }}
        />
        <div className="relative">
          <Logo tone="light" />
        </div>

        <div className="relative max-w-md">
          <p className="eyebrow text-paper/45">The host stand, simplified</p>
          <h1 className="display mt-5 text-[3.4rem] leading-[0.94] text-paper">
            Fewer waits.
            <br />
            Better tables.
            <br />
            <span className="text-clay">Calmer nights.</span>
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-paper/60">
            One live board for the door. One quiet dashboard for the owner. No shouting names across the
            room, no paper clipboards.
          </p>
        </div>

        <div className="relative">
          <div className="w-[19rem] rotate-[-2.5deg] rounded-2xl border border-white/10 bg-[#FFFDF8] p-5 text-ink shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-muted">Now serving</p>
                <p className="display mt-1 text-4xl leading-none">A-014</p>
              </div>
              <span className="pill status-called">Table ready</span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-dashed border-line pt-3 text-xs">
              <span className="font-semibold">Table T6 · 4 guests</span>
              <span className="inline-flex items-center gap-1.5 text-muted">
                <Clock3 className="size-3.5" /> 7:42 PM
              </span>
            </div>
          </div>

          <div className="mt-10 flex items-center gap-6 text-xs text-paper/50">
            <span className="inline-flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-sage" />
              {snapshot.waiting} waiting now
            </span>
            <span>{snapshot.availableTables} tables free</span>
            <Link href="/" className="inline-flex items-center gap-1 hover:text-paper">
              Guest view <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </div>
      </aside>

      <section className="paper grain flex min-h-[100dvh] flex-col px-5 py-5 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between lg:hidden">
          <Logo />
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink">
            <ArrowLeft className="size-3.5" /> Restaurant
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-[24rem] flex-1 flex-col justify-center py-10">
          <p className="eyebrow text-clay">Staff access</p>
          <h2 className="mt-2 font-display text-[2.6rem] leading-[0.95] tracking-tight">Welcome back</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {snapshot.restaurant.name} · sign in to open the floor, call guests, and keep service moving.
          </p>

          <div className="mt-8">
            <LoginForm staff={staff} next={safeNext} demo={isDemoMode()} />
          </div>

          <div className="mt-8 flex items-center justify-between text-xs text-muted">
            <Link href="/" className="inline-flex items-center gap-1.5 hover:text-ink">
              <ArrowLeft className="size-3.5" /> Back to restaurant
            </Link>
            <span className="hidden sm:inline">AntriQ · Staff</span>
          </div>
        </div>
      </section>
    </main>
  );
}
