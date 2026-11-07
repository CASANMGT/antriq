import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowUpRight,
  AtSign,
  BellRing,
  Clock3,
  FileText,
  ListOrdered,
  MapPin,
  Phone,
  Smartphone,
  Store,
  Ticket,
  Users,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Mascot } from "@/components/Mascot";
import { LanguageToggle } from "@/components/LanguageToggle";
import { JoinForm } from "@/components/diner/JoinForm";
import { MyTicketBanner } from "@/components/diner/MyTicketBanner";
import { NotificationPrompt } from "@/components/Notifications";
import { Scribble, Sparks } from "@/components/Doodles";
import { getBranchBySlugs, getPublicSnapshot } from "@/lib/store";
import { dayInTz, formatDayLong } from "@/lib/time";
import { getLang } from "@/lib/lang";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Params = Promise<{ brand: string; branch: string }>;

const LEGACY_BRANCHES: Record<string, Record<string, string>> = {
  nikumaru: { senopati: "blok-m", kemang: "tebet" },
  tenka: { senopati: "kamaja" },
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { brand, branch } = await params;
  const legacy = LEGACY_BRANCHES[brand]?.[branch];
  if (legacy) return { title: "Redirecting…" };
  const [found, lang] = await Promise.all([getBranchBySlugs(brand, branch), getLang()]);
  if (!found) return { title: "Not found" };
  const t = getDict(lang);
  return {
    title: `${found.branch.name} · ${t.guest.cardTitle}`,
    description: found.branch.tagline ?? t.guest.heroBody,
  };
}

export default async function BranchGuestPage({ params }: { params: Params }) {
  const { brand: brandSlug, branch: branchSlug } = await params;
  const legacy = LEGACY_BRANCHES[brandSlug]?.[branchSlug];
  if (legacy) redirect(`/b/${brandSlug}/${legacy}`);
  const found = await getBranchBySlugs(brandSlug, branchSlug);
  if (!found) notFound();

  const [snapshot, lang] = await Promise.all([getPublicSnapshot(found.branch.id), getLang()]);
  const t = getDict(lang);
  const { branch, brand } = snapshot;
  const locale = lang === "id" ? "id-ID" : "en-GB";
  const paused = branch.waitlistStatus === "paused";
  const closed = branch.waitlistStatus === "closed";
  const disabled = paused || closed;
  const today = formatDayLong(dayInTz(new Date(), branch.timezone), locale);
  const instagram = (brand?.instagram ?? branch.instagram)?.replace(/^@/, "");
  const logoUrl = brand?.hasLogo ? `/api/brands/${brand.id}/logo` : null;
  const statusLabel = paused
    ? t.guest.paused
    : closed
      ? t.guest.closed
      : snapshot.isOpenNow
        ? t.guest.openNow
        : t.guest.outsideHours;
  const statusTone = paused
    ? "status-waiting"
    : closed
      ? "status-muted"
      : snapshot.isOpenNow
        ? "status-seated"
        : "status-muted";

  return (
    <main className="paper grain relative min-h-[100dvh] overflow-x-clip">
      <div className="pointer-events-none absolute -right-28 -top-32 size-[26rem] rounded-full bg-pink/80 blur-[1px]" />
      <div className="pointer-events-none absolute -left-24 top-[42rem] size-64 rounded-full bg-cream" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <span className={`pill ${statusTone} hidden md:inline-flex`}>
            {statusTone === "status-seated" && <span className="live-dot" />}
            {statusLabel}
          </span>
          <Link href="/" className="btn btn-ghost btn-sm hidden sm:inline-flex text-muted">
            <Store className="size-3.5" /> {t.picker.kicker}
          </Link>
          <Link href="/" className="btn btn-ghost btn-icon sm:hidden" aria-label={t.picker.kicker} title={t.picker.kicker}>
            <Store className="size-4" />
          </Link>
          <LanguageToggle />
        </div>
      </header>

      <section className="relative mx-auto grid max-w-6xl gap-10 px-5 pb-14 pt-3 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:pt-8">
        <div className="order-last min-w-0 lg:order-none">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`pill ${statusTone} md:hidden`}>
              {statusTone === "status-seated" && <span className="live-dot" />}
              {statusLabel}
            </span>
            <p className="eyebrow text-tomato">{branch.tagline ?? t.guest.heroKicker}</p>
          </div>

          <div className="mt-4 flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={`${brand?.name ?? branch.name} logo`}
                className="size-24 shrink-0 rounded-full border-2 border-ink bg-white object-contain shadow-[2px_2px_0_#262321]"
              />
            ) : null}
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-ink/45">{brand?.name ?? branch.name}</p>
              <h1 className="break-words font-display text-[clamp(2.6rem,7vw,4.6rem)] leading-[0.9] tracking-tight text-ink">
                {branch.name}
              </h1>
            </div>
          </div>

          <h2 className="display mt-6 text-[clamp(2.6rem,6vw,4.2rem)] leading-[0.95] text-ink">
            {t.guest.heroTitle1}
            <br />
            {t.guest.heroTitle2}{" "}
            <span className="relative inline-block text-tomato">
              {t.guest.heroTitle3}
              <Scribble className="absolute -bottom-3 left-0 h-4 w-full" />
            </span>
          </h2>

          <p className="mt-6 max-w-lg text-[1.0625rem] font-medium leading-relaxed text-ink/70 text-pretty">
            {t.guest.heroBody}
          </p>

          <div className="mt-7 flex flex-col gap-2.5 text-sm font-semibold text-ink/75">
            {branch.address && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(branch.address)}`}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex w-fit items-center gap-2.5 transition hover:text-tomato"
              >
                <MapPin className="size-4 text-tomato" />
                {branch.address}
                <ArrowUpRight className="size-3 opacity-0 transition group-hover:opacity-100" />
              </a>
            )}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="inline-flex items-center gap-2.5">
                <Clock3 className="size-4 text-tomato" />
                {branch.openTime}–{branch.closeTime} · {today}
              </span>
              {branch.phone && (
                <a href={`tel:${branch.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2.5 hover:text-tomato">
                  <Phone className="size-4 text-tomato" />
                  {branch.phone}
                </a>
              )}
              {instagram && (
                <a
                  href={`https://instagram.com/${instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2.5 hover:text-tomato"
                >
                  <AtSign className="size-4 text-tomato" />
                  @{instagram}
                </a>
              )}
              {brand?.hasMenu && (
                <a
                  href={`/api/brands/${brand.id}/menu`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2.5 hover:text-tomato"
                >
                  <FileText className="size-4 text-tomato" />
                  {t.guest.menu}
                </a>
              )}
            </div>
          </div>

          <div className={`mt-9 grid max-w-lg gap-2.5 ${branch.queueMode === "single" ? "grid-cols-2" : "grid-cols-3"}`}>
            {branch.queueMode === "single" ? (
              <>
                <div className="rounded-2xl border-2 border-ink bg-pink p-3 shadow-[3px_3px_0_#262321]">
                  <Users className="size-4 text-tomato-dark" />
                  <p className="stat-number mt-2 text-4xl">{String(snapshot.waiting).padStart(2, "0")}</p>
                  <p className="mt-1.5 text-[0.5625rem] font-extrabold uppercase leading-tight tracking-[0.1em] text-tomato-dark/70">
                    {t.guest.statsWaiting}
                  </p>
                </div>
                <div className="rounded-2xl border-2 border-ink bg-leaf-soft p-3 shadow-[3px_3px_0_#262321]">
                  <BellRing className="size-4 text-leaf-dark" />
                  <p className="stat-number mt-2 text-3xl">{snapshot.lastCalledCode ?? "—"}</p>
                  <p className="mt-1.5 text-[0.5625rem] font-extrabold uppercase leading-tight tracking-[0.1em] text-leaf-dark/70">
                    {t.guest.statsServing}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-2xl border-2 border-ink bg-pink p-3 shadow-[3px_3px_0_#262321]">
                  <Users className="size-4 text-tomato-dark" />
                  <p className="stat-number mt-2 text-4xl">{String(snapshot.waitingA).padStart(2, "0")}</p>
                  <p className="mt-1.5 text-[0.5625rem] font-extrabold uppercase leading-tight tracking-[0.1em] text-tomato-dark/70">
                    {t.guest.queueAShort}
                  </p>
                </div>
                <div className="rounded-2xl border-2 border-ink bg-cream p-3 shadow-[3px_3px_0_#262321]">
                  <Users className="size-4 text-ink/70" />
                  <p className="stat-number mt-2 text-4xl">{String(snapshot.waitingB).padStart(2, "0")}</p>
                  <p className="mt-1.5 text-[0.5625rem] font-extrabold uppercase leading-tight tracking-[0.1em] text-ink/55">
                    {t.guest.queueBShort}
                  </p>
                </div>
                <div className="rounded-2xl border-2 border-ink bg-leaf-soft p-3 shadow-[3px_3px_0_#262321]">
                  <BellRing className="size-4 text-leaf-dark" />
                  <p className="stat-number mt-2 text-3xl">{snapshot.lastCalledCode ?? "—"}</p>
                  <p className="mt-1.5 text-[0.5625rem] font-extrabold uppercase leading-tight tracking-[0.1em] text-leaf-dark/70">
                    {t.guest.statsServing}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="relative mt-10 hidden max-w-md lg:block">
            <div className="absolute inset-x-4 bottom-4 top-8 rotate-[-3deg] rounded-[3rem] border-2 border-ink bg-pink" />
            <div className="relative z-10 px-8 pt-4">
              <Mascot mood="happy" className="mx-auto w-[15rem]" title="AntriQ mascot" />
            </div>
            <div className="sticker absolute -left-1 top-5 rotate-[-5deg] px-3 py-2.5">
              <p className="text-[0.5625rem] font-extrabold uppercase tracking-[0.14em] text-tomato">
                {t.guest.statsServing}
              </p>
              <p className="font-display text-3xl leading-none">{snapshot.lastCalledCode ?? "—"}</p>
            </div>
            <div className="sticker absolute -right-3 top-6 rotate-[4deg] px-3 py-2">
              <p className="font-display text-base leading-tight">
                {snapshot.waiting} {t.guest.statsWaiting}
              </p>
            </div>
            <Sparks className="absolute -left-8 -top-4 w-16 spark" />
          </div>
        </div>

        <div className="relative order-first lg:order-none lg:pt-3">
          <div className="absolute inset-x-6 -top-2 h-7 rotate-[-1.2deg] rounded-full border-2 border-ink bg-tomato" aria-hidden="true" />
          <div className="relative rounded-[1.75rem] border-2 border-ink bg-white p-5 shadow-[6px_6px_0_#262321] sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow text-tomato">{t.guest.cardKicker}</p>
                <h2 className="mt-1 font-display text-[2.4rem] leading-[0.9] tracking-tight">{t.guest.cardTitle}</h2>
              </div>
              <Mascot mood="calm" className="hidden w-16 shrink-0 sm:block" />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="pill status-muted">{branch.name}</span>
              <span className="pill status-called">
                {t.guest.nowServing}: {snapshot.lastCalledCode ?? "—"}
              </span>
            </div>

            {branch.announcement && (
              <div className="mt-4 rounded-2xl border-2 border-ink/15 bg-cream/80 px-3.5 py-3 text-[0.8125rem] font-medium leading-relaxed text-ink/75">
                {branch.announcement}
              </div>
            )}

            <MyTicketBanner branchId={branch.id} />

            <JoinForm
              branchId={branch.id}
              maxPartySize={branch.maxPartySize}
              queueMode={branch.queueMode}
              disabled={disabled}
              disabledTitle={paused ? t.guest.pauseTitle : t.guest.closedTitle}
              disabledNote={paused ? t.guest.pauseNote : t.guest.closedNote}
            />

            <div className="mt-4">
              <NotificationPrompt variant="banner" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t-2 border-dashed border-ink/20 pt-4 text-xs leading-relaxed">
              <div>
                <p className="font-extrabold text-ink">{t.guest.leaveTitle}</p>
                <p className="mt-0.5 text-muted">{t.guest.leaveBody}</p>
              </div>
              <div>
                <p className="font-extrabold text-ink">{t.guest.stepsTitle}</p>
                <p className="mt-0.5 text-muted">{t.guest.step2Body}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-2xl border-2 border-ink bg-cream px-4 py-3.5 shadow-[3px_3px_0_#262321]">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl border-2 border-ink bg-white text-tomato">
              <Smartphone className="size-4" />
            </span>
            <p className="text-xs font-semibold leading-relaxed text-ink/70">{t.guest.keepOpen}</p>
          </div>
        </div>
      </section>

      <section className="relative border-y-2 border-ink bg-cream/70">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-tomato">{t.guest.stepsTitle}</p>
              <h2 className="mt-1 font-display text-3xl tracking-tight">{t.guest.cardTitle}, {t.guest.step2Title.toLowerCase()}.</h2>
            </div>
            <Sparks className="hidden w-16 sm:block" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Ticket,
                step: t.guest.step1Kicker,
                title: t.guest.step1Title,
                body: t.guest.step1Body,
                color: "bg-pink",
              },
              {
                icon: ListOrdered,
                step: t.guest.step2Kicker,
                title: t.guest.step2Title,
                body: t.guest.step2Body,
                color: "bg-butter",
              },
              {
                icon: BellRing,
                step: t.guest.step3Kicker,
                title: t.guest.step3Title,
                body: t.guest.step3Body,
                color: "bg-leaf-soft",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-3xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_#262321]"
              >
                <div className="flex items-center justify-between">
                  <span className={`grid size-11 place-items-center rounded-2xl border-2 border-ink ${item.color}`}>
                    <item.icon className="size-5" />
                  </span>
                  <span className="font-display text-2xl text-ink/20">{item.step.slice(-2)}</span>
                </div>
                <h3 className="mt-4 font-display text-xl">{item.title}</h3>
                <p className="mt-1.5 text-sm font-medium leading-relaxed text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-xs font-semibold text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-3">
          <Logo compact />
          <span>
            {t.guest.footerTagline} · {t.guest.footerDemo}: {branch.name}.
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="py-1 text-muted-soft hover:text-muted">{t.guest.staff}</Link>
          <span className="hidden sm:inline">© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </main>
  );
}
