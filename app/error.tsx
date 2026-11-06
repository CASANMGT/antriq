"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Mascot } from "@/components/Mascot";
import { useLang } from "@/components/LanguageProvider";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLang();

  useEffect(() => {
    console.error("[antriq] page error", error);
  }, [error]);

  return (
    <main className="paper grain grid min-h-[100dvh] place-items-center px-5">
      <div className="w-full max-w-md text-center">
        <Logo />
        <Mascot mood="calm" className="mx-auto mt-6 w-40" />
        <p className="eyebrow mt-4 text-tomato">{t.common.errorKicker}</p>
        <h1 className="mt-2 font-display text-4xl leading-tight">{t.common.errorTitle}</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm font-semibold leading-relaxed text-muted">
          {t.common.errorBody}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button type="button" className="btn btn-primary" onClick={() => reset()}>
            <RotateCcw className="size-4" /> {t.common.tryAgain}
          </button>
          <Link href="/" className="btn btn-ghost">
            {t.common.guestPage}
          </Link>
        </div>
        {error.digest && <p className="mt-5 text-[0.625rem] font-semibold text-muted-soft">Error {error.digest}</p>}
      </div>
    </main>
  );
}
