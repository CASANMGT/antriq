import Link from "next/link";
import { ArrowRight, SearchX } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="paper grain grid min-h-[100dvh] place-items-center px-5">
      <div className="w-full max-w-md text-center">
        <Logo />
        <span className="mx-auto mt-10 grid size-14 place-items-center rounded-full bg-cream text-ink">
          <SearchX className="size-6" />
        </span>
        <p className="eyebrow mt-6 text-clay">404 · ticket lost</p>
        <h1 className="mt-2 font-display text-4xl leading-tight">We can&apos;t find that page</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
          The link may have expired, or the table might have already been cleared. Head back to the
          restaurant to see the live wait.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/" className="btn btn-primary">
            Back to the restaurant <ArrowRight className="size-4" />
          </Link>
          <Link href="/login" className="btn btn-ghost">
            Staff sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
