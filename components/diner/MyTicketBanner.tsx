"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Ticket, X } from "lucide-react";
import { useLang } from "@/components/LanguageProvider";

interface StoredTicket {
  token: string;
  code: string;
  branchId?: number;
  at: number;
}

export function MyTicketBanner({ branchId }: { branchId?: number }) {
  const { t } = useLang();
  const [ticket, setTicket] = useState<StoredTicket | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("antriq:ticket");
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredTicket;
      if (parsed?.token && parsed?.code) setTicket(parsed);
    } catch {
      // Ignore malformed local state.
    }
  }, []);

  if (!ticket) return null;
  if (branchId && ticket.branchId && ticket.branchId !== branchId) return null;

  return (
    <div className="mb-5 flex items-center gap-3 rounded-2xl border-2 border-ink bg-leaf-soft px-3.5 py-3 shadow-[2px_2px_0_#262321] animate-rise">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl border-2 border-ink bg-white text-leaf-dark">
        <Ticket className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.625rem] font-extrabold uppercase tracking-[0.14em] text-leaf-dark/70">
          {t.guest.ticketBannerKicker}
        </p>
        <p className="truncate text-sm font-extrabold text-leaf-dark">
          {ticket.code} · {t.guest.ticketBannerBody}
        </p>
      </div>
      <Link href={`/t/${ticket.token}`} className="btn btn-sage btn-sm">
        {t.guest.viewTicket} <ArrowRight className="size-3.5" />
      </Link>
      <button
        type="button"
        className="rounded-full p-1.5 text-leaf-dark/60 hover:bg-white/60 hover:text-leaf-dark"
        aria-label={t.guest.myTicketDismiss}
        onClick={() => {
          window.localStorage.removeItem("antriq:ticket");
          setTicket(null);
        }}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
