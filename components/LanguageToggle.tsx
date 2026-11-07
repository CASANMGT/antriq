"use client";

import { Languages } from "lucide-react";
import { useLang } from "@/components/LanguageProvider";

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useLang();

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full border-2 border-ink bg-white p-1"
      role="group"
      aria-label={t.lang.switch}
    >
      {!compact && <Languages className="ml-1 size-3.5 shrink-0 text-ink/60" aria-hidden="true" />}
      {(["id", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`min-w-8 rounded-full px-2 py-1.5 text-[0.625rem] font-extrabold uppercase tracking-wide transition ${
            lang === code ? "bg-tomato text-white" : "text-ink/60 hover:bg-cream hover:text-ink"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
