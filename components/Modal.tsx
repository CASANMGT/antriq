"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the first field once when the dialog opens. Never refocus the
    // panel or fields after that: re-focusing on render is what made inputs
    // appear to accept only one character at a time.
    const timer = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      if (panel.contains(document.activeElement)) return;
      const field = panel.querySelector<HTMLElement>("input:not([type='hidden']), select, textarea");
      if (field) {
        field.focus({ preventScroll: true });
        return;
      }
      panel.focus({ preventScroll: true });
    }, 30);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
      window.clearTimeout(timer);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px] animate-fade"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-line bg-paper p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-lift animate-rise sm:rounded-3xl sm:p-6 ${
          wide ? "sm:max-w-2xl" : "sm:max-w-md"
        }`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-medium tracking-tight">{title}</h2>
            {description && <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon -mr-1 -mt-1 shrink-0"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
        {footer && <div className="mt-5 flex flex-wrap gap-2">{footer}</div>}
      </div>
    </div>
  );
}
