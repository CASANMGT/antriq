import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, AtSign, Clock3, FileText, MapPin, Store } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Mascot } from "@/components/Mascot";
import { LanguageToggle } from "@/components/LanguageToggle";
import { getBrandBySlug, listBranches } from "@/lib/store";
import { getLang } from "@/lib/lang";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Params = Promise<{ brand: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { brand: slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) return { title: "Not found" };
  return {
    title: `${brand.name} · AntriQ`,
    description: brand.description ?? `Choose a ${brand.name} branch and join the queue.`,
  };
}

export default async function BrandPage({ params }: { params: Params }) {
  const { brand: slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();

  const [branches, lang] = await Promise.all([listBranches(brand.id), getLang()]);
  const t = getDict(lang);
  const instagram = brand.instagram?.replace(/^@/, "");
  const logoUrl = brand.hasLogo ? `/api/brands/${brand.id}/logo` : null;

  return (
    <main className="paper grain min-h-[100dvh] px-5 py-5 sm:px-8">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <Logo />
        <div className="flex items-center gap-2">
          <Link href="/" className="btn btn-ghost btn-sm hidden sm:inline-flex text-muted">
            <Store className="size-3.5" /> {t.picker.kicker}
          </Link>
          <Link href="/" className="btn btn-ghost btn-icon sm:hidden" aria-label={t.picker.kicker} title={t.picker.kicker}>
            <Store className="size-4" />
          </Link>
          <LanguageToggle />
        </div>
      </header>

      <section className="mx-auto mt-10 max-w-5xl">
        <div className="flex flex-wrap items-center gap-5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={`${brand.name} logo`}
              className="size-32 rounded-full border-2 border-ink bg-white object-contain shadow-[4px_4px_0_#262321]"
            />
          ) : (
            <span className="grid size-24 place-items-center rounded-3xl border-2 border-ink bg-white shadow-[4px_4px_0_#262321]">
              <Store className="size-10 text-tomato" />
            </span>
          )}
          <div className="min-w-0">
            <p className="eyebrow text-tomato">{t.brand.kicker}</p>
            <h1 className="mt-1 break-words font-display text-[clamp(2.8rem,8vw,4.6rem)] leading-[0.9] tracking-tight">{brand.name}</h1>
            {brand.description && (
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-muted">{brand.description}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-bold">
          {instagram && (
            <a
              href={`https://instagram.com/${instagram}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-soft btn-sm"
            >
              <AtSign className="size-3.5" /> @{instagram}
            </a>
          )}
          {brand.hasMenu && (
            <a href={`/api/brands/${brand.id}/menu`} target="_blank" rel="noreferrer" className="btn btn-soft btn-sm">
              <FileText className="size-3.5" /> {t.brand.menu}
            </a>
          )}
        </div>

        <div className="mt-10 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-tomato">{t.brand.branches}</p>
            <h2 className="mt-1 font-display text-3xl tracking-tight">{t.brand.chooseBranch}</h2>
          </div>
          <Mascot mood="calm" className="hidden w-20 sm:block" />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Link
              key={branch.id}
              href={`/b/${brand.slug}/${branch.slug}`}
              className="group rounded-3xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_#262321] transition hover:-translate-y-0.5 hover:bg-cream"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="pill status-muted">{branch.brandName}</span>
                <span
                  className={`pill ${
                    branch.waitlistStatus === "open"
                      ? "status-seated"
                      : branch.waitlistStatus === "paused"
                        ? "status-waiting"
                        : "status-muted"
                  }`}
                >
                  {branch.waitlistStatus === "open"
                    ? t.guest.openNow
                    : branch.waitlistStatus === "paused"
                      ? t.guest.paused
                      : t.guest.closed}
                </span>
              </div>
              <h3 className="mt-3 font-display text-2xl leading-tight">{branch.name}</h3>
              {branch.address && (
                <p className="mt-2 flex items-start gap-2 text-xs font-semibold leading-relaxed text-muted">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-tomato" /> {branch.address}
                </p>
              )}
              <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-muted">
                <Clock3 className="size-3.5 text-tomato" /> {branch.timezone}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-extrabold text-tomato">
                {t.brand.openBranch} <ArrowUpRight className="size-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="mx-auto mt-14 flex max-w-5xl flex-col gap-2 border-t-2 border-dashed border-ink/20 pt-5 text-xs font-semibold text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>{t.guest.footerTagline}</span>
        <Link href="/login" className="w-fit text-muted-soft hover:text-muted">
          {t.guest.staff}
        </Link>
      </footer>
    </main>
  );
}
