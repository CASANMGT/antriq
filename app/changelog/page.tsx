import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { RELEASES } from "@/lib/changelog";
import { APP_VERSION } from "@/lib/version";
import { getLang } from "@/lib/lang";
import { format, getDict } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Changelog",
  robots: { index: false, follow: false },
};

export default async function ChangelogPage() {
  const lang = await getLang();
  const t = getDict(lang);

  return (
    <main className="paper grain min-h-[100dvh] px-5 py-5 sm:px-8">
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <Logo />
        <div className="flex items-center gap-2">
          <Link href="/" className="btn btn-ghost btn-sm text-muted">
            <ArrowLeft className="size-3.5" /> {t.changelog.back}
          </Link>
          <LanguageToggle />
        </div>
      </header>

      <section className="mx-auto mt-10 max-w-3xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow text-tomato">{t.changelog.kicker}</p>
            <h1 className="mt-2 font-display text-[clamp(2.6rem,8vw,4rem)] leading-[0.92] tracking-tight">
              {t.changelog.title}
            </h1>
            <p className="mt-3 max-w-xl text-sm font-semibold leading-relaxed text-muted">
              {format(t.changelog.sub, { version: APP_VERSION })}
            </p>
          </div>
          <span className="pill status-seated">
            <Sparkles className="size-3" /> v{APP_VERSION}
          </span>
        </div>

        <div className="mt-8 space-y-4">
          {RELEASES.map((release, index) => (
            <article
              key={release.version}
              className="rounded-3xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_#262321] sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="num text-[0.625rem] font-extrabold uppercase tracking-[0.16em] text-tomato">
                    v{release.version}
                  </p>
                  <h2 className="mt-1 font-display text-[1.7rem] leading-tight">{release.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="pill status-muted">{release.date}</span>
                  {index === 0 && <span className="pill status-seated">{t.changelog.latest}</span>}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {release.sections.map((section) => (
                  <div key={section.label}>
                    <p className="text-[0.625rem] font-extrabold uppercase tracking-[0.14em] text-ink/45">
                      {section.label}
                    </p>
                    <ul className="mt-1.5 space-y-1.5">
                      {section.items.map((item) => (
                        <li key={item} className="flex gap-2 text-sm font-medium leading-relaxed text-ink/75">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-tomato" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-between gap-2 border-t-2 border-dashed border-ink/20 pt-4 text-xs font-semibold text-muted">
        <span>{t.changelog.footer}</span>
        <Link href="/" className="text-muted-soft hover:text-muted">
          {t.changelog.backHome}
        </Link>
      </footer>
    </main>
  );
}
