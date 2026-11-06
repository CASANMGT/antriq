"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  BellRing,
  LayoutDashboard,
  Loader2,
  LogOut,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { LiveClock } from "@/components/LiveClock";
import { Modal } from "@/components/Modal";
import { Notice, type NoticeState } from "@/components/Notice";
import { EmptyBoard, QueueCard, StatsStrip, TableCard } from "@/components/host/cards";
import { logoutAction } from "@/app/actions/auth";
import { postJson } from "@/lib/client-api";
import { dayInTz, formatDayLong, humanizeMinutes } from "@/lib/time";
import type { ActionResult, DiningTable, HostState, QueueEntry } from "@/lib/types";

type Tab = "queue" | "called" | "tables";

export function HostBoard({
  initial,
  staff,
}: {
  initial: HostState;
  staff: { name: string; role: "owner" | "greeter"; initials: string | null };
}) {
  const router = useRouter();
  const [state, setState] = useState<HostState>(initial);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [tab, setTab] = useState<Tab>("queue");
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInParty, setWalkInParty] = useState(2);
  const [walkInError, setWalkInError] = useState<string | null>(null);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState("");
  const [seatTarget, setSeatTarget] = useState<QueueEntry | null>(null);
  const [noShowTarget, setNoShowTarget] = useState<QueueEntry | null>(null);
  const [query, setQuery] = useState("");
  const [muted, setMuted] = useState(false);
  const [pending, startTransition] = useTransition();

  const { restaurant, stats } = state;

  const show = useCallback((message: string, tone: NoticeState["tone"]) => {
    setNotice({ message, tone });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/host/state", { cache: "no-store" });
      if (response.status === 401) {
        router.push("/login?next=/host");
        return;
      }
      if (!response.ok) return;
      setState((await response.json()) as HostState);
    } catch {
      // Keep the last board on a transient network blip.
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!document.hidden) refresh();
    }, 4000);
    const onVisible = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [refresh]);

  useEffect(() => {
    try {
      setMuted(window.localStorage.getItem("antriq:muted") === "1");
    } catch {
      // Ignore storage.
    }
  }, []);

  /* Chime when a guest has just been called from another device. */
  const previousCalled = useRef<Set<number>>(new Set(initial.called.map((entry) => entry.id)));
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const current = new Set(state.called.map((entry) => entry.id));
    const added = [...current].some((id) => !previousCalled.current.has(id));
    previousCalled.current = current;
    if (!added || muted) return;
    try {
      const context = audioRef.current ?? new AudioContext();
      audioRef.current = context;
      if (context.state === "suspended") void context.resume();
      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, now);
      oscillator.frequency.setValueAtTime(1174, now + 0.14);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.6);
    } catch {
      // Sound is a bonus, never a requirement.
    }
  }, [state.called, muted]);

  const run = useCallback(
    (action: () => Promise<ActionResult>, onSuccess?: () => void) => {
      startTransition(async () => {
        const result = await action();
        if (result.message) show(result.message, result.ok ? "success" : "error");
        if (result.ok) {
          onSuccess?.();
          await refresh();
        }
      });
    },
    [refresh, show],
  );

  const filteredWaiting = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return state.waiting;
    return state.waiting.filter((entry) =>
      [entry.guestName, entry.code, entry.phone ?? ""].some((value) => value.toLowerCase().includes(needle)),
    );
  }, [query, state.waiting]);

  const filteredCalled = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return state.called;
    return state.called.filter((entry) =>
      [entry.guestName, entry.code, entry.phone ?? ""].some((value) => value.toLowerCase().includes(needle)),
    );
  }, [query, state.called]);

  const zones = useMemo(() => {
    const map = new Map<string, DiningTable[]>();
    for (const table of state.tables) {
      const list = map.get(table.zone) ?? [];
      list.push(table);
      map.set(table.zone, list);
    }
    return [...map.entries()];
  }, [state.tables]);

  const seatedByTable = useMemo(() => {
    const map = new Map<number, QueueEntry>();
    for (const entry of state.seated) {
      if (entry.tableId) map.set(entry.tableId, entry);
    }
    return map;
  }, [state.seated]);

  const seatOptions = useMemo(() => {
    if (!seatTarget) return [];
    return state.tables
      .filter((table) => table.status === "available" && table.capacity >= seatTarget.partySize)
      .sort((a, b) => a.capacity - b.capacity || a.sortOrder - b.sortOrder);
  }, [seatTarget, state.tables]);

  const status = restaurant.waitlistStatus;
  const statusLabel = status === "open" ? "Waitlist open" : status === "paused" ? "Paused" : "Closed";
  const statusTone = status === "open" ? "status-seated" : status === "paused" ? "status-waiting" : "status-muted";

  function submitWalkIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setWalkInError(null);
    startTransition(async () => {
      const result = await postJson<{ code: string }>("/api/host/action", {
        type: "walkin",
        guestName: String(form.get("guestName") ?? ""),
        phone: String(form.get("phone") ?? ""),
        notes: String(form.get("notes") ?? ""),
        partySize: walkInParty,
      });
      if (!result.ok) {
        setWalkInError(result.message ?? "Could not add this guest.");
        return;
      }
      show(result.message ?? "Walk-in added.", "success");
      setWalkInOpen(false);
      setWalkInParty(2);
      await refresh();
    });
  }

  /* Keyboard shortcuts: N = call next, W = walk-in, P = pause. */
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (walkInOpen || pauseOpen || seatTarget || noShowTarget) return;
      const key = event.key.toLowerCase();
      if (key === "n") {
        event.preventDefault();
        run(() => postJson("/api/host/action", { type: "callNext" }));
      } else if (key === "w") {
        event.preventDefault();
        setWalkInOpen(true);
      } else if (key === "p") {
        event.preventDefault();
        setPauseOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [noShowTarget, pauseOpen, run, seatTarget, walkInOpen]);

  function toggleMuted() {
    setMuted((value) => {
      const next = !value;
      try {
        window.localStorage.setItem("antriq:muted", next ? "1" : "0");
      } catch {
        // Ignore storage.
      }
      return next;
    });
  }

  return (
    <div className="min-h-[100dvh] bg-paper">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 px-3 py-2.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo compact href="/host" />
            <div className="min-w-0">
              <p className="eyebrow text-muted-soft">Host stand</p>
              <div className="flex items-center gap-2">
                <h1 className="truncate font-display text-[1.15rem] leading-tight">{restaurant.name}</h1>
                <span className={`pill ${statusTone}`}>{statusLabel}</span>
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
            <div className="hidden items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs text-muted sm:flex">
              <span className="live-dot" />
              <LiveClock timezone={restaurant.timezone} />
            </div>
            <button
              type="button"
              onClick={toggleMuted}
              className="btn btn-ghost btn-icon"
              aria-label={muted ? "Unmute call chime" : "Mute call chime"}
              title={muted ? "Unmute chime" : "Mute chime"}
            >
              {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>
            {staff.role === "owner" && (
              <Link href="/dashboard" className="btn btn-ghost btn-icon hidden sm:inline-flex" aria-label="Owner dashboard">
                <LayoutDashboard className="size-4" />
              </Link>
            )}
            <button
              type="button"
              className="btn btn-soft btn-sm"
              onClick={() => setPauseOpen(true)}
              aria-label={status === "open" ? "Pause waitlist" : "Open waitlist"}
              title={status === "open" ? "Pause waitlist" : "Open waitlist"}
            >
              {status === "open" ? <PauseCircle className="size-3.5" /> : <PlayCircle className="size-3.5" />}
              <span className="hidden md:inline">{status === "open" ? "Pause" : "Open"}</span>
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setWalkInOpen(true)}
              aria-label="Add walk-in"
              title="Add walk-in"
            >
              <Plus className="size-3.5" /> <span className="hidden sm:inline">Walk-in</span>
            </button>
            <form action={logoutAction}>
              <button type="submit" className="btn btn-ghost btn-icon" aria-label="Sign out" title="Sign out">
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
        <StatsStrip stats={stats} />
      </header>

      <main className="mx-auto max-w-[1500px] px-3 pb-28 pt-4 sm:px-5 lg:pb-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow text-muted">{formatDayLong(dayInTz(new Date(), restaurant.timezone))}</p>
            <h2 className="mt-0.5 font-display text-2xl tracking-tight">
              Good service, {staff.name.split(" ")[0]}.
            </h2>
            <p className="mt-0.5 hidden text-xs text-muted md:block">
              The board refreshes itself every 4 seconds. Shortcuts:{" "}
              <kbd className="kbd">N</kbd> call next · <kbd className="kbd">W</kbd> walk-in ·{" "}
              <kbd className="kbd">P</kbd> pause.
            </p>
            <p className="mt-0.5 text-xs text-muted md:hidden">Live board · updates every 4 seconds</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1">
              <span className="live-dot" /> Live floor
            </span>
            <span>{stats.availableTables} tables free</span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.12fr_0.94fr_1fr]">
          {/* Waiting */}
          <section className={tab === "queue" ? "block" : "hidden lg:block"}>
            <div className="mb-2.5 flex items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-xl leading-tight">Waitlist</h2>
                <p className="text-xs text-muted">
                  {state.waiting.length} waiting · avg {humanizeMinutes(stats.avgWaitMinutes)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  className="btn btn-clay btn-sm"
                  onClick={() => run(() => postJson("/api/host/action", { type: "callNext" }))}
                  disabled={pending || state.waiting.length === 0}
                >
                  {pending ? <Loader2 className="size-3.5 animate-spin" /> : <BellRing className="size-3.5" />}
                  Call next
                </button>
                {stats.availableTables === 0 && state.waiting.length > 0 && (
                  <button
                    type="button"
                    className="text-[0.625rem] font-semibold text-muted underline decoration-dotted underline-offset-2 hover:text-clay"
                    onClick={() => run(() => postJson("/api/host/action", { type: "callNext", force: true }))}
                    disabled={pending}
                  >
                    No table free — call anyway
                  </button>
                )}
              </div>
            </div>

            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
              <input
                className="input h-9 pl-9 text-sm"
                placeholder="Find a guest, code or number…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search the waitlist"
              />
            </div>

            <div className="space-y-2.5">
              {filteredWaiting.length === 0 ? (
                <EmptyBoard
                  title={query ? "No matching guests" : "The line is clear"}
                  note={
                    query
                      ? "Try another name, ticket code, or phone number."
                      : "New guests appear here as soon as they join from their phone."
                  }
                />
              ) : (
                filteredWaiting.map((entry, index) => (
                  <QueueCard
                    key={entry.id}
                    entry={entry}
                    next={index === 0 && !query}
                    busy={pending}
                    onCall={() => run(() => postJson("/api/host/action", { type: "callEntry", entryId: entry.id }))}
                    onSeat={() => setSeatTarget(entry)}
                    onExtend={() => run(() => postJson("/api/host/action", { type: "extend", entryId: entry.id, minutes: 5 }))}
                    onNoShow={() => setNoShowTarget(entry)}
                    onUndo={() => run(() => postJson("/api/host/action", { type: "undoCall", entryId: entry.id }))}
                  />
                ))
              )}
            </div>
          </section>

          {/* Called */}
          <section className={tab === "called" ? "block" : "hidden lg:block"}>
            <div className="mb-2.5 flex items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-xl leading-tight">At the door</h2>
                <p className="text-xs text-muted">{state.called.length} on hold · {restaurant.holdMinutes} min holds</p>
              </div>
              <span className="pill status-called">{state.called.length}</span>
            </div>

            <div className="space-y-2.5">
              {filteredCalled.length === 0 ? (
                <EmptyBoard
                  title="No one at the door"
                  note="Called guests land here with a hold timer. Seat them or return them to the line."
                />
              ) : (
                filteredCalled.map((entry) => (
                  <QueueCard
                    key={entry.id}
                    entry={entry}
                    next={false}
                    busy={pending}
                    onCall={() => run(() => postJson("/api/host/action", { type: "callEntry", entryId: entry.id }))}
                    onSeat={() => setSeatTarget(entry)}
                    onExtend={() => run(() => postJson("/api/host/action", { type: "extend", entryId: entry.id, minutes: 5 }))}
                    onNoShow={() => setNoShowTarget(entry)}
                    onUndo={() => run(() => postJson("/api/host/action", { type: "undoCall", entryId: entry.id }))}
                  />
                ))
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-line bg-white/60 p-3.5">
              <p className="eyebrow text-muted">Seated today</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="stat-number text-4xl">{state.stats.seatedToday}</span>
                <span className="text-xs text-muted">parties</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                {state.stats.seated} currently at tables · avg turn{" "}
                {humanizeMinutes(restaurant.avgTurnMinutes)}
              </p>
            </div>
          </section>

          {/* Tables */}
          <section className={tab === "tables" ? "block" : "hidden lg:block"}>
            <div className="mb-2.5 flex items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-xl leading-tight">Floor</h2>
                <p className="text-xs text-muted">
                  {stats.availableTables} open · {stats.seated} seated · {stats.dirtyTables} to reset
                </p>
              </div>
              <span className="pill status-seated">{stats.availableTables}/{stats.totalTables}</span>
            </div>

            <div className="space-y-4">
              {zones.map(([zone, tables]) => (
                <div key={zone}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <h3 className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-muted">{zone}</h3>
                    <span className="text-[0.625rem] text-muted-soft">
                      {tables.filter((table) => table.status === "available").length} open
                    </span>
                  </div>
                  <div className="table-grid">
                    {tables.map((table) => (
                      <TableCard
                        key={table.id}
                        table={table}
                        entry={table.id ? seatedByTable.get(table.id) ?? null : null}
                        busy={pending}
                        onClear={() => run(() => postJson("/api/host/action", { type: "clearTable", tableId: table.id }))}
                        onReady={() => run(() => postJson("/api/host/action", { type: "tableStatus", tableId: table.id, status: "available" }))}
                        onBlock={() => run(() => postJson("/api/host/action", { type: "tableStatus", tableId: table.id, status: "blocked" }))}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Mobile tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-paper/95 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-md gap-1.5">
          {(
            [
              { id: "queue" as const, label: "Waitlist", count: state.waiting.length },
              { id: "called" as const, label: "At door", count: state.called.length },
              { id: "tables" as const, label: "Floor", count: stats.availableTables },
            ]
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition ${
                tab === item.id ? "bg-ink text-paper" : "text-muted hover:bg-cream"
              }`}
              aria-pressed={tab === item.id}
            >
              {item.label}
              <span
                className={`num rounded-full px-1.5 py-0.5 text-[0.625rem] ${
                  tab === item.id ? "bg-white/15 text-paper" : "bg-cream text-ink/70"
                }`}
              >
                {item.count}
              </span>
            </button>
          ))}
          {staff.role === "owner" && (
            <Link
              href="/dashboard"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-2 text-xs font-bold text-muted transition hover:bg-cream"
            >
              <LayoutDashboard className="size-3.5" />
              Owner
            </Link>
          )}
        </div>
      </nav>

      {/* Seat dialog */}
      <Modal
        open={Boolean(seatTarget)}
        onClose={() => setSeatTarget(null)}
        title={seatTarget ? `Seat ${seatTarget.code}` : "Seat guest"}
        description={
          seatTarget
            ? `${seatTarget.guestName} · ${seatTarget.partySize} ${seatTarget.partySize === 1 ? "guest" : "guests"}. Pick the table they're walking to.`
            : undefined
        }
      >
        {seatTarget && seatOptions.length === 0 ? (
          <div className="rounded-xl border border-line bg-cream/60 px-4 py-4 text-sm leading-relaxed text-muted">
            No free table seats {seatTarget.partySize}. Clear a larger table or return the guest to the line.
          </div>
        ) : (
          <div className="grid gap-2">
            {seatOptions.map((table, index) => (
              <button
                key={table.id}
                type="button"
                disabled={pending}
                onClick={() =>
                  run(
                    () => postJson("/api/host/action", { type: "seat", entryId: seatTarget!.id, tableId: table.id }),
                    () => setSeatTarget(null),
                  )
                }
                className={`flex items-center justify-between rounded-xl border p-3 text-left transition hover:border-sage/50 hover:bg-sage-soft/40 ${
                  index === 0 ? "border-sage/40 bg-sage-soft/30" : "border-line bg-white"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-ink text-sm font-extrabold text-paper">
                    {table.label}
                  </span>
                  <span>
                    <span className="block text-sm font-bold">Seat at {table.label}</span>
                    <span className="block text-xs text-muted">
                      {table.capacity} seats · {table.zone}
                    </span>
                  </span>
                </span>
                {index === 0 && <span className="pill status-seated">Best fit</span>}
              </button>
            ))}
          </div>
        )}
      </Modal>

      {/* No-show confirm */}
      <Modal
        open={Boolean(noShowTarget)}
        onClose={() => setNoShowTarget(null)}
        title="Mark as no-show?"
        description="This closes the ticket and frees the hold. It also shows up in the owner's no-show rate."
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setNoShowTarget(null)}>
              Keep waiting
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={pending}
              onClick={() => {
                const target = noShowTarget;
                setNoShowTarget(null);
                if (target) run(() => postJson("/api/host/action", { type: "noShow", entryId: target.id }));
              }}
            >
              Mark no-show
            </button>
          </>
        }
      >
        {noShowTarget && (
          <div className="rounded-xl border border-line bg-white px-4 py-3">
            <p className="num text-sm font-bold">{noShowTarget.code}</p>
            <p className="mt-0.5 text-sm">{noShowTarget.guestName}</p>
            <p className="text-xs text-muted">
              {noShowTarget.partySize} guests · called {humanizeMinutes(noShowTarget.waitMinutes)} ago
            </p>
          </div>
        )}
      </Modal>

      {/* Walk-in dialog */}
      <Modal
        open={walkInOpen}
        onClose={() => {
          setWalkInOpen(false);
          setWalkInError(null);
        }}
        title="Add a walk-in"
        description={`${restaurant.name} · puts the guest straight into today's line.`}
      >
        <form onSubmit={submitWalkIn} className="space-y-4">
          <div>
            <span className="label">Party size</span>
            <div className="flex items-center justify-between rounded-2xl border border-line bg-cream/50 p-1.5">
              <button
                type="button"
                className="grid size-10 place-items-center rounded-xl bg-white shadow-sm disabled:opacity-40"
                onClick={() => setWalkInParty((size) => Math.max(1, size - 1))}
                disabled={walkInParty <= 1}
                aria-label="One guest fewer"
              >
                −
              </button>
              <span className="num text-2xl font-extrabold">{walkInParty}</span>
              <button
                type="button"
                className="grid size-10 place-items-center rounded-xl bg-white shadow-sm disabled:opacity-40"
                onClick={() => setWalkInParty((size) => Math.min(restaurant.maxPartySize, size + 1))}
                disabled={walkInParty >= restaurant.maxPartySize}
                aria-label="One guest more"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="walkin-name">Guest name</label>
            <input id="walkin-name" name="guestName" className="input" placeholder="e.g. Jordan Lee" required minLength={2} maxLength={60} autoComplete="off" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="walkin-phone">Phone (optional)</label>
              <input id="walkin-phone" name="phone" className="input" placeholder="0812…" inputMode="tel" maxLength={32} />
            </div>
            <div>
              <label className="label" htmlFor="walkin-notes">Note (optional)</label>
              <input id="walkin-notes" name="notes" className="input" placeholder="High chair…" maxLength={200} />
            </div>
          </div>

          {walkInError && (
            <p role="alert" className="rounded-xl border border-clay/25 bg-clay-soft px-3 py-2 text-sm text-clay-dark">
              {walkInError}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" className="btn btn-ghost flex-1" onClick={() => setWalkInOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Add to line
            </button>
          </div>
        </form>
      </Modal>

      {/* Waitlist dialog */}
      <Modal
        open={pauseOpen}
        onClose={() => setPauseOpen(false)}
        title="Waitlist control"
        description="Pausing keeps everyone already in line, but stops new guests from joining."
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3">
            <div>
              <p className="text-sm font-bold">Current state</p>
              <p className="text-xs text-muted">
                {status === "open" ? "Accepting new guests" : status === "paused" ? "Not accepting new guests" : "Closed for today"}
              </p>
            </div>
            <span className={`pill ${statusTone}`}>{statusLabel}</span>
          </div>

          {status === "open" ? (
            <>
              <div>
                <label className="label" htmlFor="pause-reason">Reason (optional)</label>
                <input
                  id="pause-reason"
                  className="input"
                  placeholder="Kitchen catching up…"
                  value={pauseReason}
                  onChange={(event) => setPauseReason(event.target.value)}
                  maxLength={120}
                />
              </div>
              <button
                type="button"
                className="btn btn-clay w-full"
                disabled={pending}
                onClick={() =>
                  run(
                    () => postJson("/api/host/action", { type: "waitlist", status: "paused", reason: pauseReason || null }),
                    () => {
                      setPauseOpen(false);
                      setPauseReason("");
                    },
                  )
                }
              >
                <PauseCircle className="size-4" /> Pause new joins
              </button>
              <button
                type="button"
                className="btn btn-danger w-full"
                disabled={pending}
                onClick={() =>
                  run(
                    () => postJson("/api/host/action", { type: "waitlist", status: "closed", reason: pauseReason || null }),
                    () => {
                      setPauseOpen(false);
                      setPauseReason("");
                    },
                  )
                }
              >
                Close for today
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-sage w-full"
              disabled={pending}
              onClick={() =>
                run(
                  () => postJson("/api/host/action", { type: "waitlist", status: "open" }),
                  () => setPauseOpen(false),
                )
              }
            >
              <PlayCircle className="size-4" /> Reopen the waitlist
            </button>
          )}

          <p className="text-center text-[0.6875rem] leading-relaxed text-muted">
            Guests already waiting keep their place and their ticket updates automatically.
          </p>
        </div>
      </Modal>

      <Notice notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
