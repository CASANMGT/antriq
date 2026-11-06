"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { getDict, LANG_COOKIE, type Lang, type Messages } from "@/lib/i18n";

interface LanguageContextValue {
  lang: Lang;
  t: Messages;
  setLang: (lang: Lang) => void;
  toggle: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  initialLang,
  children,
}: {
  initialLang: Lang;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback(
    (next: Lang) => {
      if (next === lang) return;
      setLangState(next);
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      // A full reload guarantees the server-rendered copy changes even when an
      // RSC refresh is served from a warm cache at the edge.
      window.location.reload();
    },
    [lang],
  );

  const value = useMemo(
    () => ({
      lang,
      t: getDict(lang),
      setLang,
      toggle: () => setLang(lang === "id" ? "en" : "id"),
    }),
    [lang, setLang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang(): LanguageContextValue {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error("useLang must be used inside LanguageProvider");
  }
  return value;
}
