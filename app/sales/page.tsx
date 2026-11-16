import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Car,
  Check,
  Landmark,
  MessageCircle,
  Scissors,
  Sparkles,
  Stethoscope,
  Store,
  Ticket,
  UtensilsCrossed,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Mascot } from "@/components/Mascot";
import { LanguageToggle } from "@/components/LanguageToggle";
import { SalesForm } from "@/components/sales/SalesForm";
import { PricingGrid } from "@/components/sales/PricingGrid";
import { getLang } from "@/lib/lang";
import { SALES_COPY, SALES_PLANS, SALES_TYPES, salesTypeLabel, salesTypeNote, salesWhatsAppHref } from "@/lib/sales";

export const metadata: Metadata = {
  title: SALES_COPY.id.metaTitle,
  description: SALES_COPY.id.metaDescription,
  openGraph: {
    title: SALES_COPY.id.metaTitle,
    description: SALES_COPY.id.metaDescription,
    type: "website",
  },
};

const TYPE_ICONS = [UtensilsCrossed, Stethoscope, Scissors, Car, Sparkles, Landmark, Store, Ticket];

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const params = await searchParams;
  const lang = await getLang();
  const copy = SALES_COPY[lang];
  const direct = salesWhatsAppHref({ lang });
  const initialPlan = SALES_PLANS.some((plan) => plan.id === params.plan) ? params.plan : "starter";

  return (
    <main className="paper grain min-h-[100dvh]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: "AntriQ",
            description: copy.metaDescription,
            offers: {
              "@type": "Offer",
              price: "49000",
              priceCurrency: "IDR",
              availability: "https://schema.org/InStock",
            },
          }),
        }}
      />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
        <Logo href="/" />
        <div className="flex items-center gap-2">
          <LanguageToggle compact />
          <a href={direct} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
            <MessageCircle className="size-3.5" /> {copy.ctaChat}
          </a>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 pb-10 pt-6 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:pb-16">
        <div>
          <p className="eyebrow text-tomato">{copy.kicker}</p>
          <h1 className="mt-3 font-display text-[2.9rem] font-semibold leading-[0.92] tracking-tight sm:text-[4.4rem]">
            {copy.titleLead}
            <br />
            <span className="text-tomato">{copy.titleAccent}</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm font-semibold leading-relaxed text-muted sm:text-base">{copy.subtitle}</p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <a href="/sales?plan=free#start" className="btn btn-primary">
              {copy.ctaFree} <ArrowRight className="size-4" />
            </a>
            <a href={direct} target="_blank" rel="noreferrer" className="btn btn-soft">
              <MessageCircle className="size-4" /> {copy.ctaChat}
            </a>
            <a href="#pricing" className="btn btn-ghost text-muted">
              {copy.ctaSee}
            </a>
          </div>
          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-ink/65">
            {copy.bullets.map((bullet) => (
              <li key={bullet} className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-leaf-dark" /> {bullet}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <Mascot mood="happy" className="absolute -top-10 right-4 w-24 rotate-3 sm:w-28" />
          <div className="rounded-[2rem] border-2 border-ink bg-white p-5 shadow-[6px_6px_0_#262321]">
            <p className="text-[0.625rem] font-extrabold uppercase tracking-[0.16em] text-ink/45">{copy.pricePrefix}</p>
            <p className="num mt-1 font-display text-[3.4rem] font-semibold leading-none tracking-tight">
              {copy.price}
            </p>
            <p className="mt-1 text-sm font-extrabold text-muted">{copy.priceSuffix}</p>
            <p className="mt-3 rounded-xl bg-cream px-3 py-2 text-xs font-semibold leading-relaxed text-ink/70">
              {copy.priceNote}
            </p>
            <div className="mt-4 space-y-2 border-t-2 border-dashed border-ink/15 pt-4">
              {copy.bullets.map((item) => (
                <p key={item} className="flex items-start gap-2 text-xs font-bold">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-leaf-dark" /> {item}
                </p>
              ))}
            </div>
            <a href="/sales?plan=free#start" className="btn btn-primary mt-4 w-full">
              {copy.ctaFree} <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <p className="eyebrow text-tomato">{copy.typesKicker}</p>
        <h2 className="mt-2 font-display text-[2.1rem] font-semibold leading-tight tracking-tight sm:text-[2.6rem]">
          {copy.typesTitle}
        </h2>
        <p className="mt-1 max-w-2xl text-sm font-semibold leading-relaxed text-muted">{copy.typesSub}</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SALES_TYPES.map((type, index) => {
            const Icon = TYPE_ICONS[index] ?? Ticket;
            return (
              <article key={type.id} className="rounded-2xl border-2 border-ink bg-white p-4 shadow-[3px_3px_0_#262321]">
                <span className="grid size-9 place-items-center rounded-xl border-2 border-ink bg-cream text-tomato">
                  <Icon className="size-4" />
                </span>
                <h3 className="mt-3 font-display text-lg font-semibold leading-tight">{salesTypeLabel(type, lang)}</h3>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-muted">{salesTypeNote(type, lang)}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <p className="eyebrow text-tomato">{copy.featuresKicker}</p>
        <h2 className="mt-2 font-display text-[2.1rem] font-semibold leading-tight tracking-tight sm:text-[2.6rem]">
          {copy.featuresTitle}
        </h2>
        <p className="mt-1 max-w-2xl text-sm font-semibold leading-relaxed text-muted">{copy.featuresSub}</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {copy.features.map((feature) => (
            <article key={feature.title} className="rounded-2xl border-2 border-ink bg-cream/70 p-4">
              <BellRing className="size-4 text-tomato" />
              <h3 className="mt-2 font-display text-lg font-semibold leading-tight">{feature.title}</h3>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-muted">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <p className="eyebrow text-tomato">{copy.pricingKicker}</p>
        <h2 className="mt-2 font-display text-[2.1rem] font-semibold leading-tight tracking-tight sm:text-[2.6rem]">
          {copy.pricingTitle}
        </h2>
        <p className="mt-1 max-w-2xl text-sm font-semibold leading-relaxed text-muted">{copy.pricingSub}</p>
        <p className="mt-2 text-xs font-bold text-ink/55">{copy.noWaBlast}</p>

        <PricingGrid lang={lang} />

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <a href="/sales?plan=free#start" className="btn btn-primary">
            {copy.ctaFree} <ArrowRight className="size-4" />
          </a>
          <a href={direct} target="_blank" rel="noreferrer" className="btn btn-soft">
            <MessageCircle className="size-4" /> {copy.ctaChat}
          </a>
          <span className="text-xs font-bold text-muted">{copy.perBranchNote}</span>
        </div>
      </section>

      <section id="start" className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="eyebrow text-tomato">{copy.trialKicker}</p>
          <h2 className="mt-2 font-display text-[2.1rem] font-semibold leading-tight tracking-tight">{copy.trialTitle}</h2>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-muted">{copy.trialBody}</p>
          <div className="mt-5 rounded-2xl border-2 border-ink bg-white p-4 shadow-[3px_3px_0_#262321]">
            <p className="text-[0.625rem] font-extrabold uppercase tracking-[0.14em] text-ink/45">{copy.pricePrefix}</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              <span className="num font-display text-4xl font-semibold leading-none">{copy.price}</span>
              <span className="text-xs font-extrabold text-muted">{copy.priceSuffix}</span>
            </div>
            <p className="mt-2 text-xs font-semibold leading-relaxed text-muted">{copy.priceNote}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="pill status-seated">Free · 30/hari</span>
              <span className="pill status-waiting">QR</span>
              <span className="pill status-called">A/B</span>
              <span className="pill status-muted">CSV</span>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border-2 border-ink bg-white p-5 shadow-[5px_5px_0_#262321] sm:p-6">
          <p className="eyebrow text-tomato">{copy.formKicker}</p>
          <h2 className="mt-2 font-display text-[1.9rem] font-semibold leading-tight">{copy.formTitle}</h2>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-muted">{copy.formSub}</p>
          <SalesForm lang={lang} initialPlan={initialPlan} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-ink bg-cream/70 p-5 shadow-[3px_3px_0_#262321] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow text-tomato">{copy.currentKicker}</p>
            <h2 className="mt-1 font-display text-xl font-semibold leading-tight">{copy.currentTitle}</h2>
            <p className="mt-1 max-w-2xl text-xs font-semibold leading-relaxed text-muted">{copy.currentBody}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/login" className="btn btn-primary btn-sm">
              {copy.currentCta}
            </Link>
            <a href={direct} target="_blank" rel="noreferrer" className="btn btn-soft btn-sm">
              <MessageCircle className="size-3.5" /> {copy.currentChat}
            </a>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 border-t-2 border-ink/10 px-4 py-6 text-xs font-semibold text-muted sm:px-6">
        <span>{copy.footer}</span>
        <Link href="/" className="underline decoration-dotted underline-offset-2 hover:text-tomato">
          {copy.backHome}
        </Link>
      </footer>
    </main>
  );
}
