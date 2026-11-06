"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Ticket, X } from "lucide-react";

interface StoredTicket {
  token: string;
  code: string;
  at: number;
}

export function MyTicketBanner() {
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

  return (
    <div className="mb-5 flex items-center gap-3 rounded-2xl border border-sage/25 bg-sage-soft px-3.5 py-3 animate-rise">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/70 text-sage-dark">
        <Ticket className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-sage-dark/70">Your open ticket</p>
        <p className="truncate text-sm font-bold text-sage-dark">
          {ticket.code} · tap to see your place
        </p>
      </div>
      <Link href={`/t/${ticket.token}`} className="btn btn-sage btn-sm">
        View <ArrowRight className="size-3.5" />
      </Link>
      <button
        type="button"
        className="rounded-full p-1.5 text-sage-dark/60 hover:bg-white/60 hover:text-sage-dark"
        aria-label="Dismiss saved ticket"
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
