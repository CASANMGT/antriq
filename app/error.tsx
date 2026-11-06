"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[antriq] page error", error);
  }, [error]);

  return (
    <main className="paper grain grid min-h-[100dvh] place-items-center px-5">
      <div className="w-full max-w-md text-center">
        <Logo />
        <p className="eyebrow mt-10 text-clay">Something went sideways</p>
        <h1 className="mt-2 font-display text-4xl leading-tight">The floor is still here</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
          We hit an unexpected error loading this screen. Try again — your tickets and tables are safe.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button type="button" className="btn btn-primary" onClick={() => reset()}>
            <RotateCcw className="size-4" /> Try again
          </button>
          <Link href="/" className="btn btn-ghost">
            Guest page
          </Link>
        </div>
        {error.digest && <p className="mt-5 text-[0.625rem] text-muted-soft">Error {error.digest}</p>}
      </div>
    </main>
  );
}
