import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, AtSign, Clock3, FileText, MapPin, Store, Users, UtensilsCrossed } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Mascot } from "@/components/Mascot";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Scribble } from "@/components/Doodles";
import { getPublicSnapshot, listBrands, listBranches } from "@/lib/store";
import { getLang } from "@/lib/lang";
import { getDict } from "@/lib/i18n";
import type { BranchSummary, Brand, PublicSnapshot } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const t = getDict(lang);
  return {
    title: `${t.picker.title1} ${t.picker.title2} ${t.picker.title3} · AntriQ`,
    description: t.picker.sub,
  };
}

interface BranchCard {
  branch: BranchSummary;
  snapshot: PublicSnapshot | null;
}

export default async function HomePage() {
  const [brands, branches, lang] = await Promise.all([listBrands(), listBranches(), getLang()]);
  const t = getDict(lang);

  const grouped = new Map<number, BranchCard[]>();
  await Promise.all(
    branches.map(async (branch) => {
      let snapshot: PublicSnapshot | null = null;
      try {
        snapshot = await getPublicSnapshot(branch.id);
      } catch {
        // A branch can be mid-setup; the card still links through.
      }
      const list = grouped.get(branch.brandId) ?? [];
      list.push({ branch, snapshot });
      grouped.set(branch.brandId, list);
    }),
  );

  const visibleBrands = brands.filter((brand) => (grouped.get(brand.id) ?? []).length > 0);

  return (
    <main className="paper grain relative min-h-[100dvh] overflow-x-clip">
      <div className="pointer-events-none absolute -right-28 -top-32 size-[26rem] rounded-full bg-pink/80 blur-[1px]" />
      <div className="pointer-events-none absolute -left-24 top-[34rem] size-64 rounded-full bg-cream" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Link href="/login" className="btn btn-outline btn-sm">
            {t.guest.staff}
          </Link>
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl px-5 pb-10 pt-6 sm:px-8 lg:pt-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-tomato">{t.picker.kicker}</p>
            <h1 className="mt-3 max-w-3xl font-display text-[clamp(2.8rem,8vw,5rem)] leading-[0.9] tracking-tight">
              {t.picker.title1}
              <br />
              {t.picker.title2}{" "}
              <span className="relative inline-block text-tomato">
                {t.picker.title3}
                <Scribble className="absolute -bottom-3 left-0 h-4 w-full" />
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base font-medium leading-relaxed text-ink/70">{t.picker.sub}</p>
          </div>
          <Mascot mood="happy" className="hidden w-44 lg:block" />
        </div>

        <div className="mt-10 flex flex-col gap-10">
          {visibleBrands.length === 0 && (
            <div className="rounded-3xl border-2 border-dashed border-ink/30 bg-white/70 p-8 text-center">
              <p className="font-display text-2xl">{t.picker.emptyTitle}</p>
              <p className="mt-2 text-sm font-semibold text-muted">{t.picker.emptyBody}</p>
            </div>
          )}

          {visibleBrands.map((brand) => {
            const branchesForBrand = grouped.get(brand.id) ?? [];
            return (
              <section key={brand.id} className="scroll-mt-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {brand.hasLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/brands/${brand.id}/logo`}
                        alt={`${brand.name} logo`}
                        className="size-14 shrink-0 rounded-2xl border-2 border-ink bg-white object-contain p-1 shadow-[2px_2px_0_#262321]"
                      />
                    ) : (
                      <span className="grid size-14 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-white shadow-[2px_2px_0_#262321]">
                        <Store className="size-6 text-tomato" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <h2 className="font-display text-[2rem] leading-none tracking-tight">{brand.name}</h2>
                      {brand.description && (
                        <p className="mt-1 line-clamp-2 max-w-2xl text-sm font-semibold leading-relaxed text-muted">
                          {brand.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {brand.instagram && (
                      <a
                        href={`https://instagram.com/${brand.instagram.replace(/^@/, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-ghost btn-sm text-muted"
                      >
                        <AtSign className="size-3.5" /> {brand.instagram}
                      </a>
                    )}
                    {brand.hasMenu && (
                      <a
                        href={`/api/brands/${brand.id}/menu`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-ghost btn-sm text-muted"
                      >
                        <FileText className="size-3.5" /> {t.brand.menu}
                      </a>
                    )}
                    <Link href={`/b/${brand.slug}`} className="btn btn-soft btn-sm">
                      {t.picker.brandPage} <ArrowUpRight className="size-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {branchesForBrand.map(({ branch, snapshot }) => (
                    <BranchCardView key={branch.id} branch={branch} snapshot={snapshot} brand={brand} t={t} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      <section className="relative border-y-2 border-ink bg-cream/70">
        <div className="mx-auto grid max-w-6xl gap-4 px-5 py-10 sm:grid-cols-3 sm:px-8">
          {[
            { icon: Store, title: t.picker.step1Title, body: t.picker.step1Body, tone: "bg-pink" },
            { icon: Users, title: t.picker.step2Title, body: t.picker.step2Body, tone: "bg-butter" },
            { icon: UtensilsCrossed, title: t.picker.step3Title, body: t.picker.step3Body, tone: "bg-leaf-soft" },
          ].map((item) => (
            <div key={item.title} className="rounded-3xl border-2 border-ink bg-white p-5 shadow-[3px_3px_0_#262321]">
              <span className={`grid size-10 place-items-center rounded-xl border-2 border-ink ${item.tone}`}>
                <item.icon className="size-4" />
              </span>
              <p className="mt-3 font-display text-xl">{item.title}</p>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-xs font-semibold text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-3">
          <Logo compact />
          <span>{t.guest.footerTagline}</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hover:text-ink">
            {t.guest.staff}
          </Link>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </main>
  );
}

function BranchCardView({
  branch,
  snapshot,
  brand,
  t,
}: {
  branch: BranchSummary;
  snapshot: PublicSnapshot | null;
  brand: Brand;
  t: ReturnType<typeof getDict>;
}) {
  const open = snapshot?.isOpenNow ?? branch.waitlistStatus === "open";
  const statusLabel =
    branch.waitlistStatus === "paused"
      ? t.guest.paused
      : branch.waitlistStatus === "closed"
        ? t.guest.closed
        : open
          ? t.guest.openNow
          : t.guest.outsideHours;
  const statusTone =
    branch.waitlistStatus === "paused"
      ? "status-waiting"
      : branch.waitlistStatus === "closed"
        ? "status-muted"
        : open
          ? "status-seated"
          : "status-muted";

  return (
    <Link
      href={`/b/${brand.slug}/${branch.slug}`}
      className="group flex flex-col rounded-3xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_#262321] transition hover:-translate-y-0.5 hover:bg-cream/60"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[0.625rem] font-extrabold uppercase tracking-[0.14em] text-ink/45">{brand.name}</p>
          <h3 className="mt-0.5 font-display text-2xl leading-tight">{branch.name}</h3>
        </div>
        <span className={`pill ${statusTone}`}>
          {statusTone === "status-seated" && <span className="live-dot" />}
          {statusLabel}
        </span>
      </div>

      {branch.address && (
        <p className="mt-3 flex items-start gap-2 text-xs font-semibold leading-relaxed text-muted">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-tomato" /> {branch.address}
        </p>
      )}
      <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-muted">
        <Clock3 className="size-3.5 text-tomato" /> {branch.openTime}–{branch.closeTime} · {branch.timezone}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-1.5">
        <div className="rounded-xl border-2 border-ink/15 bg-pink/60 px-2 py-2 text-center">
          <p className="num font-display text-xl font-semibold">{snapshot?.waiting ?? "—"}</p>
          <p className="text-[0.5625rem] font-extrabold uppercase tracking-[0.08em] text-ink/50">{t.guest.statsWaiting}</p>
        </div>
        <div className="rounded-xl border-2 border-ink/15 bg-cream px-2 py-2 text-center">
          <p className="num font-display text-xl font-semibold">{snapshot?.availableTables ?? "—"}</p>
          <p className="text-[0.5625rem] font-extrabold uppercase tracking-[0.08em] text-ink/50">{t.guest.statsTables}</p>
        </div>
        <div className="rounded-xl border-2 border-ink/15 bg-leaf-soft px-2 py-2 text-center">
          <p className="num font-display text-xl font-semibold">{snapshot?.lastCalledCode ?? "—"}</p>
          <p className="text-[0.5625rem] font-extrabold uppercase tracking-[0.08em] text-ink/50">{t.guest.statsServing}</p>
        </div>
      </div>

      <span className="mt-4 inline-flex items-center gap-1 text-xs font-extrabold text-tomato">
        {t.picker.joinBranch} <ArrowUpRight className="size-3.5" />
      </span>
    </Link>
  );
}
