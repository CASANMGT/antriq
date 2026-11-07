import type { Metadata } from "next";
import Link from "next/link";
import { Store, Users, UtensilsCrossed } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Mascot } from "@/components/Mascot";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Scribble } from "@/components/Doodles";
import { BranchDirectory, type DirectoryBrand } from "@/components/guest/BranchDirectory";
import { getPublicSnapshot, listBrands, listBranches } from "@/lib/store";
import { getLang } from "@/lib/lang";
import { getDict } from "@/lib/i18n";
import { APP_VERSION } from "@/lib/version";
import type { BranchSummary, PublicSnapshot } from "@/lib/types";

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
  const directory: DirectoryBrand[] = visibleBrands.map((brand) => ({
    brand,
    branches: grouped.get(brand.id) ?? [],
  }));

  return (
    <main className="paper grain relative min-h-[100dvh] overflow-x-clip">
      <div className="pointer-events-none absolute -right-28 -top-32 size-[26rem] rounded-full bg-pink/80 blur-[1px]" />
      <div className="pointer-events-none absolute -left-24 top-[34rem] size-64 rounded-full bg-cream" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <LanguageToggle />
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

          <BranchDirectory brands={directory} />
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
          <Link href="/changelog" className="text-muted-soft hover:text-muted">
            v{APP_VERSION}
          </Link>
          <Link href="/login" className="text-muted-soft hover:text-muted">
            {t.guest.staff}
          </Link>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </main>
  );
}
