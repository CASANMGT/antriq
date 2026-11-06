import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Mascot } from "@/components/Mascot";
import { getLang } from "@/lib/lang";
import { getDict } from "@/lib/i18n";

export default async function NotFound() {
  const t = getDict(await getLang());
  return (
    <main className="paper grain grid min-h-[100dvh] place-items-center px-5">
      <div className="w-full max-w-md text-center">
        <Logo />
        <Mascot mood="sleep" className="mx-auto mt-6 w-40" />
        <p className="eyebrow mt-4 text-tomato">{t.common.notFoundKicker}</p>
        <h1 className="mt-2 font-display text-4xl leading-tight">{t.common.notFoundTitle}</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm font-semibold leading-relaxed text-muted">
          {t.common.notFoundBody}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/" className="btn btn-primary">
            {t.common.backHome} <ArrowRight className="size-4" />
          </Link>
          <Link href="/login" className="btn btn-ghost">
            {t.guest.staff}
          </Link>
        </div>
      </div>
    </main>
  );
}
