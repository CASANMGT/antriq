"use client";

import { useState } from "react";
import { Check, Copy, Printer } from "lucide-react";
import { useLang } from "@/components/LanguageProvider";

export function PrintButton() {
  const { t } = useLang();
  return (
    <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
      <Printer className="size-3.5" /> {t.owner.printPoster}
    </button>
  );
}

export function CopyLinkButton({ url }: { url: string }) {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="btn btn-soft btn-sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? t.common.copied : t.owner.copyLink}
    </button>
  );
}
