"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

export type NoticeTone = "success" | "error" | "info";

export interface NoticeState {
  message: string;
  tone: NoticeTone;
}

export function Notice({
  notice,
  onClose,
}: {
  notice: NoticeState | null;
  onClose: () => void;
}) {
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => closeRef.current(), notice.tone === "error" ? 6000 : 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  if (!notice) return null;

  const Icon = notice.tone === "success" ? CheckCircle2 : notice.tone === "error" ? TriangleAlert : Info;
  const tone =
    notice.tone === "success"
      ? "border-sage/30 bg-sage-soft text-sage-dark"
      : notice.tone === "error"
        ? "border-clay/30 bg-clay-soft text-clay-dark"
        : "border-line bg-white text-ink";

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[70] flex justify-center sm:bottom-5">
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto flex max-w-md items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm font-medium shadow-lift animate-rise ${tone}`}
      >
        <Icon className="mt-0.5 size-4 shrink-0" />
        <span className="leading-snug">{notice.message}</span>
        <button
          type="button"
          onClick={onClose}
          className="-mr-1 ml-1 rounded-full p-1 opacity-60 transition hover:opacity-100"
          aria-label="Dismiss"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
