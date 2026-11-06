"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  BellRing,
  Check,
  ChevronDown,
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
import { LanguageToggle } from "@/components/LanguageToggle";
import { Modal } from "@/components/Modal";
import { Notice, type NoticeState } from "@/components/Notice";
import { NotificationPrompt } from "@/components/Notifications";
import { EmptyBoard, QueueCard, StatsStrip, TableCard } from "@/components/host/cards";
import { useLang } from "@/components/LanguageProvider";
import { logoutAction } from "@/app/actions/auth";
import { postJson } from "@/lib/client-api";
import { notify } from "@/lib/notify";
import { dayInTz, formatDayLong } from "@/lib/time";
import { format } from "@/lib/i18n";
import { zoneLabel } from "@/lib/labels";
import type { ActionResult, BranchSummary, DiningTable, HostState, QueueEntry, Role } from "@/lib/types";

type Tab = "queue" | "called" | "tables";

export function HostBoard({
  initial,
  staff,
  branches,
  activeBranchId,
}: {
  initial: HostState;
  staff: { name: string; role: Role; initials: string | null };
  branches: BranchSummary[];
  activeBranchId: number;
}) {
  const router = useRouter();
  const { lang, t } = useLang();
  const locale = lang === "id" ? "id-ID" : "en-GB";
  const [state, setState] = useState<HostState>(initial);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [tab, setTab] = useState<Tab>("queue");
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInParty, setWalkInParty] = useState(2);
  const [walkInError, setWalkInError] = useState<string | null>(null);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState("");
  const [seatTarget, setSeatTarget] = useState<QueueEntry | null>(null);
  const [seatTableId, setSeatTableId] = useState<number | null>(null);
  const [seatNumber, setSeatNumber] = useState<number | null>(null);
  const [noShowTarget, setNoShowTarget] = useState<QueueEntry | null>(null);
  const [releaseTarget, setReleaseTarget] = useState<DiningTable | null>(null);
  const [query, setQuery] = useState("");
  const [muted, setMuted] = useState(false);
  const [pending, startTransition] = useTransition();

  const { branch, brand, stats } = state;

  const hostAction = useCallback(
    (type: string, extra: Record<string, unknown> = {}) =>
      postJson("/api/host/action", { type, branchId: activeBranchId, ...extra }),
    [activeBranchId],
  );

  const show = useCallback((message: string, tone: NoticeState["tone"]) => {
    setNotice({ message, tone });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/host/state?branch=${activeBranchId}`, { cache: "no-store" });
      if (response.status === 401) {
        router.push("/login?next=/host");
        return;
      }
      if (!response.ok) return;
      setState((await response.json()) as HostState);
    } catch {
      // Keep the last board on a transient network blip.
    }
  }, [activeBranchId, router]);

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
    const added = state.called.filter((entry) => !previousCalled.current.has(entry.id));
    previousCalled.current = current;
    if (added.length === 0) return;
    if (!muted) {
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
    }
    if (document.hidden) {
      const entry = added[added.length - 1];
      void notify(t.host.notificationTitle, `${entry.code} · ${entry.guestName}`, `/host?branch=${activeBranchId}`);
    }
  }, [activeBranchId, muted, state.called, t.host.notificationTitle]);

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

  const seatTable = useMemo(
    () => seatOptions.find((table) => table.id === seatTableId) ?? null,
    [seatOptions, seatTableId],
  );

  function resetSeatDialog() {
    setSeatTarget(null);
    setSeatTableId(null);
    setSeatNumber(null);
  }

  const status = branch.waitlistStatus;
  const statusLabel =
    status === "open" ? t.host.waitlistOpen : status === "paused" ? t.host.waitlistPaused : t.host.waitlistClosed;
  const statusTone = status === "open" ? "status-seated" : status === "paused" ? "status-waiting" : "status-muted";

  function submitWalkIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setWalkInError(null);
    startTransition(async () => {
      const result = await postJson<{ code: string }>("/api/host/action", {
        branchId: activeBranchId,
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

  function openSeat(entry: QueueEntry) {
    const table = state.tables
      .filter((item) => item.status === "available" && item.capacity >= entry.partySize)
      .sort((a, b) => a.capacity - b.capacity || a.sortOrder - b.sortOrder)[0];
    if (!table) {
      show(format(t.host.noFit, { count: entry.partySize }), "error");
      return;
    }
    run(() =>
      hostAction("seat", {
        entryId: entry.id,
        tableId: table.id,
        seatNumber: null,
      }),
    );
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
        run(() => hostAction("callNext"));
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
  }, [hostAction, noShowTarget, pauseOpen, run, seatTarget, walkInOpen]);

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
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 px-3 py-2.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo compact href={`/host?branch=${activeBranchId}`} />
            <div className="min-w-0">
              <p className="eyebrow text-tomato">{brand?.name ?? branch.brandName ?? t.host.hostStand}</p>
              <div className="flex items-center gap-2">
                <h1 className="truncate font-display text-[1.2rem] font-semibold leading-tight">{branch.name}</h1>
                <span className={`pill ${statusTone}`}>{statusLabel}</span>
                <span className="pill status-muted hidden sm:inline-flex">
                  {staff.role === "cashier"
                    ? t.login.cashierRole
                    : staff.role === "owner"
                      ? t.login.ownerRole
                      : t.login.greeterRole}
                </span>
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
            {branches.length > 1 && (
              <div className="relative">
                <label className="sr-only" htmlFor="host-branch">
                  {t.common.branch}
                </label>
                <select
                  id="host-branch"
                  className="input h-9 max-w-[10.5rem] appearance-none bg-white py-0 pr-7 text-xs font-extrabold"
                  value={activeBranchId}
                  onChange={(event) => router.push(`/host?branch=${event.target.value}`)}
                >
                  {branches.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.brandName} · {item.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
              </div>
            )}
            <div className="hidden items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-1.5 text-xs font-bold text-ink sm:flex">
              <span className="live-dot" />
              <LiveClock timezone={branch.timezone} />
            </div>
            <LanguageToggle compact />
            <NotificationPrompt compact />
            <button
              type="button"
              onClick={toggleMuted}
              className="btn btn-ghost btn-icon"
              aria-label={muted ? t.host.unmute : t.host.mute}
              title={muted ? t.host.unmute : t.host.mute}
            >
              {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>
            {staff.role === "owner" && (
              <Link
                href={`/dashboard?branch=${activeBranchId}`}
                className="btn btn-ghost btn-icon hidden sm:inline-flex"
                aria-label={t.common.ownerDashboard}
                title={t.common.ownerDashboard}
              >
                <LayoutDashboard className="size-4" />
              </Link>
            )}
            <button
              type="button"
              className="btn btn-soft btn-sm"
              onClick={() => setPauseOpen(true)}
              aria-label={status === "open" ? t.host.pauseWaitlist : t.host.openWaitlist}
              title={status === "open" ? t.host.pauseWaitlist : t.host.openWaitlist}
            >
              {status === "open" ? <PauseCircle className="size-3.5" /> : <PlayCircle className="size-3.5" />}
              <span className="hidden md:inline">{status === "open" ? t.host.pauseAction : t.host.open}</span>
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setWalkInOpen(true)}
              aria-label={t.host.addWalkIn}
              title={t.host.addWalkIn}
            >
              <Plus className="size-3.5" /> <span className="hidden sm:inline">{t.host.walkIn}</span>
            </button>
            <form action={logoutAction}>
              <button type="submit" className="btn btn-ghost btn-icon" aria-label={t.host.signOut} title={t.host.signOut}>
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
            <p className="eyebrow text-ink/45">{formatDayLong(dayInTz(new Date(), branch.timezone), locale)}</p>
            <h2 className="mt-0.5 font-display text-[2rem] font-semibold leading-none tracking-tight">
              {format(t.host.goodService, { name: staff.name.split(" ")[0] })}
            </h2>
            <p className="mt-1 hidden text-xs font-semibold text-muted md:block">
              {t.host.shortcuts} <kbd className="kbd">N</kbd> {t.host.callNextShort} · <kbd className="kbd">W</kbd>{" "}
              {t.host.walkInShort} · <kbd className="kbd">P</kbd> {t.host.pauseShort}
            </p>
            <p className="mt-1 text-xs font-semibold text-muted md:hidden">{t.host.liveBoard}</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-muted">
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-2.5 py-1">
              <span className="live-dot" /> {t.host.liveFloor}
            </span>
            <span>{format(t.host.tablesFree, { count: stats.availableTables })}</span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.12fr_0.94fr_1fr]">
          {/* Waiting */}
          <section className={tab === "queue" ? "block" : "hidden lg:block"}>
            <div className="mb-2.5 flex items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-[1.7rem] font-semibold leading-tight">{t.host.waitlistTitle}</h2>
                <p className="text-xs font-semibold text-muted">
                  {format(t.host.waitingSummary, { count: state.waiting.length })}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => run(() => hostAction("callNext"))}
                  disabled={pending || state.waiting.length === 0}
                >
                  {pending ? <Loader2 className="size-3.5 animate-spin" /> : <BellRing className="size-3.5" />}
                  {t.host.callNext}
                </button>
                {stats.availableTables === 0 && state.waiting.length > 0 && (
                  <button
                    type="button"
                    className="text-[0.625rem] font-bold text-muted underline decoration-dotted underline-offset-2 hover:text-tomato"
                    onClick={() => run(() => hostAction("callNext", { force: true }))}
                    disabled={pending}
                  >
                    {t.host.callAnyway}
                  </button>
                )}
              </div>
            </div>

            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
              <input
                className="input h-10 pl-9 text-sm"
                placeholder={t.host.searchPlaceholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label={t.host.findGuest}
              />
            </div>

            <div className="space-y-2.5">
              {filteredWaiting.length === 0 ? (
                <EmptyBoard
                  title={query ? t.host.noMatch : t.host.emptyLine}
                  note={query ? t.host.noMatchNote : t.host.emptyLineNote}
                />
              ) : (
                filteredWaiting.map((entry, index) => (
                  <QueueCard
                    key={entry.id}
                    entry={entry}
                    position={index + 1}
                    next={index === 0 && !query}
                    busy={pending}
                    onCall={() => run(() => hostAction("callEntry", { entryId: entry.id }))}
                    onSeat={() => {
                      setSeatTarget(entry);
                      setSeatTableId(null);
                      setSeatNumber(null);
                    }}
                    onOpenSeat={() => openSeat(entry)}
                    onNoShow={() => setNoShowTarget(entry)}
                    onUndo={() => run(() => hostAction("undoCall", { entryId: entry.id }))}
                  />
                ))
              )}
            </div>
          </section>

          {/* Called */}
          <section className={tab === "called" ? "block" : "hidden lg:block"}>
            <div className="mb-2.5 flex items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-[1.7rem] font-semibold leading-tight">{t.host.atDoorTitle}</h2>
                <p className="text-xs font-semibold text-muted">
                  {format(t.host.atDoorSummary, { count: state.called.length })}
                </p>
              </div>
              <span className="pill status-called">{state.called.length}</span>
            </div>

            <div className="space-y-2.5">
              {filteredCalled.length === 0 ? (
                <EmptyBoard title={t.host.noDoor} note={t.host.noDoorNote} />
              ) : (
                filteredCalled.map((entry, index) => (
                  <QueueCard
                    key={entry.id}
                    entry={entry}
                    position={index + 1}
                    next={false}
                    busy={pending}
                    onCall={() => run(() => hostAction("callEntry", { entryId: entry.id }))}
                    onSeat={() => {
                      setSeatTarget(entry);
                      setSeatTableId(null);
                      setSeatNumber(null);
                    }}
                    onOpenSeat={() => openSeat(entry)}
                    onNoShow={() => setNoShowTarget(entry)}
                    onUndo={() => run(() => hostAction("undoCall", { entryId: entry.id }))}
                  />
                ))
              )}
            </div>

            <div className="mt-4 rounded-2xl border-2 border-ink bg-cream p-4 shadow-[3px_3px_0_#262321]">
              <p className="eyebrow text-ink/45">{t.host.seatedToday}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="stat-number text-4xl">{state.stats.seatedToday}</span>
                <span className="text-xs font-bold text-muted">{t.host.partiesUnit}</span>
              </div>
              <p className="mt-1.5 text-xs font-semibold leading-relaxed text-muted">
                {format(t.host.atTables, { count: state.stats.seated })}
              </p>
            </div>
          </section>

          {/* Tables */}
          <section className={tab === "tables" ? "block" : "hidden lg:block"}>
            <div className="mb-2.5 flex items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-[1.7rem] font-semibold leading-tight">{t.host.floorTitle}</h2>
                <p className="text-xs font-semibold text-muted">
                  {format(t.host.floorSummary, {
                    free: stats.availableTables,
                    seated: stats.seated,
                    dirty: stats.dirtyTables,
                  })}
                </p>
              </div>
              <span className="pill status-seated">{stats.availableTables}/{stats.totalTables}</span>
            </div>

            <div className="space-y-4">
              {zones.map(([zone, tables]) => (
                <div key={zone}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <h3 className="text-[0.6875rem] font-extrabold uppercase tracking-[0.14em] text-ink/45">
                      {zoneLabel(zone, lang)}
                    </h3>
                    <span className="text-[0.625rem] font-bold text-muted-soft">
                      {tables.filter((table) => table.status === "available").length} {t.host.openShort}
                    </span>
                  </div>
                  <div className="table-grid">
                    {tables.map((table) => (
                      <TableCard
                        key={table.id}
                        table={table}
                        entry={table.id ? seatedByTable.get(table.id) ?? null : null}
                        busy={pending}
                        onClear={() => setReleaseTarget(table)}
                        onReady={() => run(() => hostAction("tableStatus", { tableId: table.id, status: "available" }))}
                        onBlock={() => run(() => hostAction("tableStatus", { tableId: table.id, status: "blocked" }))}
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
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-ink bg-cream px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
        <div className="mx-auto flex max-w-md gap-1.5">
          {(
            [
              { id: "queue" as const, label: t.host.waitlistTitle, count: state.waiting.length },
              { id: "called" as const, label: t.host.atDoorTitle, count: state.called.length },
              { id: "tables" as const, label: t.host.floorTitle, count: stats.availableTables },
            ]
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full border-2 px-2.5 py-2 text-xs font-extrabold transition ${
                tab === item.id ? "border-ink bg-ink text-paper" : "border-transparent text-ink/60 hover:bg-white"
              }`}
              aria-pressed={tab === item.id}
            >
              {item.label}
              <span
                className={`num rounded-full px-1.5 py-0.5 text-[0.625rem] ${
                  tab === item.id ? "bg-white/20 text-paper" : "bg-white text-ink/70"
                }`}
              >
                {item.count}
              </span>
            </button>
          ))}
          {staff.role === "owner" && (
            <Link
              href={`/dashboard?branch=${activeBranchId}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-2 text-xs font-extrabold text-ink/60 transition hover:bg-white"
            >
              <LayoutDashboard className="size-3.5" />
              {t.owner.owner}
            </Link>
          )}
        </div>
      </nav>

      {/* Seat dialog */}
      <Modal
        open={Boolean(seatTarget)}
        onClose={resetSeatDialog}
        title={seatTarget ? format(t.host.seatTitle, { code: seatTarget.code }) : t.host.seat}
        description={
          seatTarget
            ? format(t.host.seatDesc, {
                name: seatTarget.guestName,
                count: seatTarget.partySize,
              })
            : undefined
        }
        footer={
          seatTarget ? (
            <>
              <button type="button" className="btn btn-ghost" onClick={resetSeatDialog}>
                {t.common.cancel}
              </button>
              <button
                type="button"
                className="btn btn-sage"
                disabled={!seatTableId || pending}
                onClick={() => {
                  const target = seatTarget;
                  const tableId = seatTableId;
                  if (!target || !tableId) return;
                  run(
                    () =>
                      hostAction("seat", {
                        entryId: target.id,
                        tableId,
                        seatNumber,
                      }),
                    resetSeatDialog,
                  );
                }}
              >
                {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                {t.host.seatGuest}
              </button>
            </>
          ) : undefined
        }
      >
        {seatTarget && seatOptions.length === 0 ? (
          <div className="rounded-xl border-2 border-ink bg-cream px-4 py-4 text-sm font-semibold leading-relaxed text-ink/70">
            {format(t.host.noFit, { count: seatTarget.partySize })}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-2">
              {seatOptions.map((table, index) => {
                const active = table.id === seatTableId;
                return (
                  <button
                    key={table.id}
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setSeatTableId(table.id);
                      setSeatNumber(null);
                    }}
                    className={`flex items-center justify-between rounded-xl border-2 border-ink p-3 text-left shadow-[2px_2px_0_#262321] transition hover:-translate-y-0.5 ${
                      active ? "bg-leaf-soft" : index === 0 ? "bg-white" : "bg-white/80"
                    }`}
                    aria-pressed={active}
                  >
                    <span className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-lg border-2 border-ink bg-ink font-display text-sm font-semibold text-paper">
                        {table.label}
                      </span>
                      <span>
                        <span className="block text-sm font-extrabold">{format(t.host.seatAt, { table: table.label })}</span>
                        <span className="block text-xs font-semibold text-muted">
                          {format(t.host.seats, { count: table.capacity })} · {zoneLabel(table.zone, lang)}
                        </span>
                      </span>
                    </span>
                    {active ? (
                      <Check className="size-4 text-leaf-dark" />
                    ) : index === 0 ? (
                      <span className="pill status-seated">{t.host.bestFit}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {seatTable && (
              <div className="rounded-xl border-2 border-dashed border-ink/25 bg-cream/60 p-3">
                <p className="label mb-1.5">{t.host.seatNumber}</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSeatNumber(null)}
                    className={`rounded-lg border-2 border-ink px-2.5 py-1.5 text-xs font-extrabold transition ${
                      seatNumber === null ? "bg-ink text-paper" : "bg-white hover:bg-pink"
                    }`}
                    aria-pressed={seatNumber === null}
                  >
                    {t.host.letHostDecide}
                  </button>
                  {Array.from({ length: seatTable.capacity }, (_, index) => index + 1).map((seat) => (
                    <button
                      key={seat}
                      type="button"
                      onClick={() => setSeatNumber(seat)}
                      className={`num size-8 rounded-lg border-2 border-ink text-xs font-extrabold transition ${
                        seatNumber === seat ? "bg-ink text-paper" : "bg-white hover:bg-pink"
                      }`}
                      aria-pressed={seatNumber === seat}
                    >
                      {seat}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[0.625rem] font-semibold leading-relaxed text-muted">{t.host.seatNumberHint}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Release seat confirm */}
      <Modal
        open={Boolean(releaseTarget)}
        onClose={() => setReleaseTarget(null)}
        title={t.host.releaseSeatTitle}
        description={t.host.releaseSeatDesc}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setReleaseTarget(null)}>
              {t.common.cancel}
            </button>
            <button
              type="button"
              className="btn btn-sage"
              disabled={pending}
              onClick={() => {
                const table = releaseTarget;
                setReleaseTarget(null);
                if (table) {
                  run(() =>
                    hostAction("releaseSeat", {
                      tableId: table.id,
                      reason: staff.role === "cashier" ? t.host.paymentSettled : t.host.releasedByHost,
                    }),
                  );
                }
              }}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              {t.host.releaseSeatConfirm}
            </button>
          </>
        }
      >
        {releaseTarget && (
          <div className="space-y-2 rounded-xl border-2 border-ink bg-cream px-4 py-3">
            <p className="font-display text-lg font-semibold">{releaseTarget.label}</p>
            {seatedByTable.get(releaseTarget.id) && (
              <p className="text-sm font-bold">
                {seatedByTable.get(releaseTarget.id)!.code} · {seatedByTable.get(releaseTarget.id)!.guestName}
              </p>
            )}
            <p className="text-xs font-semibold leading-relaxed text-muted">
              {staff.role === "cashier" ? t.host.cashierReleaseNote : t.host.hostReleaseNote}
            </p>
          </div>
        )}
      </Modal>

      {/* No-show confirm */}
      <Modal
        open={Boolean(noShowTarget)}
        onClose={() => setNoShowTarget(null)}
        title={t.host.noShowTitle}
        description={t.host.noShowDesc}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setNoShowTarget(null)}>
              {t.host.keepWaiting}
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={pending}
              onClick={() => {
                const target = noShowTarget;
                setNoShowTarget(null);
                if (target) run(() => hostAction("noShow", { entryId: target.id }));
              }}
            >
              {t.host.markNoShow}
            </button>
          </>
        }
      >
        {noShowTarget && (
          <div className="rounded-xl border-2 border-ink bg-cream px-4 py-3">
            <p className="num font-display text-lg font-semibold">{noShowTarget.code}</p>
            <p className="mt-0.5 text-sm font-bold">{noShowTarget.guestName}</p>
            <p className="text-xs font-semibold text-muted">
              {noShowTarget.partySize} {t.guest.guestUnit}
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
        title={t.host.walkInTitle}
        description={format(t.host.walkInDesc, { name: branch.name })}
      >
        <form onSubmit={submitWalkIn} className="space-y-4">
          <div>
            <span className="label">{t.host.partySize}</span>
            <div className="flex items-center justify-between rounded-2xl border-2 border-ink bg-cream p-1.5 shadow-[3px_3px_0_#262321]">
              <button
                type="button"
                className="grid size-10 place-items-center rounded-xl border-2 border-ink bg-white font-bold transition hover:bg-pink disabled:opacity-40"
                onClick={() => setWalkInParty((size) => Math.max(1, size - 1))}
                disabled={walkInParty <= 1}
                aria-label={lang === "id" ? "Kurangi satu tamu" : "One guest fewer"}
              >
                −
              </button>
              <span className="num font-display text-2xl font-semibold">{walkInParty}</span>
              <button
                type="button"
                className="grid size-10 place-items-center rounded-xl border-2 border-ink bg-white font-bold transition hover:bg-pink disabled:opacity-40"
                onClick={() => setWalkInParty((size) => Math.min(branch.maxPartySize, size + 1))}
                disabled={walkInParty >= branch.maxPartySize}
                aria-label={lang === "id" ? "Tambah satu tamu" : "One guest more"}
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="walkin-name">{t.host.guestName}</label>
            <input id="walkin-name" name="guestName" className="input" placeholder={t.host.guestNamePlaceholder} required minLength={2} maxLength={60} autoComplete="off" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="walkin-phone">{t.host.phone}</label>
              <input id="walkin-phone" name="phone" className="input" placeholder="0812…" inputMode="tel" maxLength={32} />
            </div>
            <div>
              <label className="label" htmlFor="walkin-notes">{t.host.note}</label>
              <input id="walkin-notes" name="notes" className="input" placeholder={t.host.notePlaceholder} maxLength={200} />
            </div>
          </div>

          {walkInError && (
            <p role="alert" className="rounded-xl border-2 border-ink bg-pink px-3 py-2 text-sm font-semibold text-tomato-dark">
              {walkInError}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" className="btn btn-ghost flex-1" onClick={() => setWalkInOpen(false)}>
              {t.host.cancel}
            </button>
            <button type="submit" className="btn btn-primary flex-1" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} {t.host.addToLine}
            </button>
          </div>
        </form>
      </Modal>

      {/* Waitlist dialog */}
      <Modal
        open={pauseOpen}
        onClose={() => setPauseOpen(false)}
        title={t.host.waitlistControl}
        description={t.host.waitlistControlDesc}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border-2 border-ink bg-cream px-4 py-3">
            <div>
              <p className="text-sm font-extrabold">{t.host.currentState}</p>
              <p className="text-xs font-semibold text-muted">
                {status === "open" ? t.host.accepting : status === "paused" ? t.host.notAccepting : t.host.closedToday}
              </p>
            </div>
            <span className={`pill ${statusTone}`}>{statusLabel}</span>
          </div>

          {status === "open" ? (
            <>
              <div>
                <label className="label" htmlFor="pause-reason">{t.host.reason}</label>
                <input
                  id="pause-reason"
                  className="input"
                  placeholder={t.host.reasonPlaceholder}
                  value={pauseReason}
                  onChange={(event) => setPauseReason(event.target.value)}
                  maxLength={120}
                />
              </div>
              <button
                type="button"
                className="btn btn-primary w-full"
                disabled={pending}
                onClick={() =>
                  run(
                    () => hostAction("waitlist", { status: "paused", reason: pauseReason || null }),
                    () => {
                      setPauseOpen(false);
                      setPauseReason("");
                    },
                  )
                }
              >
                <PauseCircle className="size-4" /> {t.host.pauseJoins}
              </button>
              <button
                type="button"
                className="btn btn-danger w-full"
                disabled={pending}
                onClick={() =>
                  run(
                    () => hostAction("waitlist", { status: "closed", reason: pauseReason || null }),
                    () => {
                      setPauseOpen(false);
                      setPauseReason("");
                    },
                  )
                }
              >
                {t.host.closeToday}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-sage w-full"
              disabled={pending}
              onClick={() =>
                run(
                  () => hostAction("waitlist", { status: "open" }),
                  () => setPauseOpen(false),
                )
              }
            >
              <PlayCircle className="size-4" /> {t.host.reopen}
            </button>
          )}

          <p className="text-center text-[0.6875rem] font-semibold leading-relaxed text-muted">
            {t.host.keepPlace}
          </p>
        </div>
      </Modal>

      <Notice notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
