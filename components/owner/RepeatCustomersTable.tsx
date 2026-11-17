"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Clock3, History, Loader2, MapPin, Star } from "lucide-react";
import { Modal } from "@/components/Modal";
import { useLang } from "@/components/LanguageProvider";
import { postJson } from "@/lib/client-api";
import { format } from "@/lib/i18n";
import { phoneKey } from "@/lib/guest";
import { clockInTz, dayInTz, formatDayLong } from "@/lib/time";
import type { CustomerHistoryItem, CustomerProfile, EntryStatus } from "@/lib/types";

const PAGE_SIZE = 10;
type Scope = "branch" | "brand" | "all";

function statusKey(status: EntryStatus): "waiting" | "called" | "seated" | "completed" | "noShow" | "cancelled" {
  return status === "no_show" ? "noShow" : status;
}

function statusTone(status: EntryStatus): string {
  if (status === "waiting") return "status-waiting";
  if (status === "called") return "status-called";
  if (status === "seated") return "status-seated";
  return "status-muted";
}

function countFor(profile: CustomerProfile, scope: Scope): number {
  if (scope === "branch") return profile.branchVisits;
  if (scope === "brand") return profile.brandVisits;
  return profile.allVisits;
}

export function RepeatCustomersTable({
  profiles,
  starredPhones,
  branchId,
  branchName,
  brandName,
  timezone,
  locale,
  days,
}: {
  profiles: CustomerProfile[];
  starredPhones: string[];
  branchId: number;
  branchName: string;
  brandName: string;
  timezone: string;
  locale: string;
  days: number;
}) {
  const { t } = useLang();
  const [scope, setScope] = useState<Scope>("branch");
  const [repeatOnly, setRepeatOnly] = useState(true);
  const [page, setPage] = useState(1);
  const [starred, setStarred] = useState<Set<string>>(() => new Set(starredPhones));
  const [history, setHistory] = useState<{
    profile: CustomerProfile;
    items: CustomerHistoryItem[];
    loading: boolean;
    error: boolean;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const rows = profiles
      .filter((profile) => !repeatOnly || countFor(profile, scope) >= 2)
      .sort(
        (a, b) =>
          countFor(b, scope) - countFor(a, scope) ||
          b.allVisits - a.allVisits ||
          new Date(b.lastVisitAt).getTime() - new Date(a.lastVisitAt).getTime(),
      );
    return rows;
  }, [profiles, repeatOnly, scope]);

  const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, maxPage);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  function chooseScope(next: Scope) {
    setScope(next);
    setPage(1);
  }

  function toggleStar(profile: CustomerProfile) {
    const key = phoneKey(profile.phone);
    if (!key) return;
    const next = !starred.has(key);
    setStarred((currentSet) => {
      const copy = new Set(currentSet);
      if (next) copy.add(key);
      else copy.delete(key);
      return copy;
    });
    startTransition(async () => {
      const result = await postJson("/api/owner/action", { type: "starPhone", phone: profile.phone, starred: next });
      if (!result.ok) {
        setStarred((currentSet) => {
          const copy = new Set(currentSet);
          if (next) copy.delete(key);
          else copy.add(key);
          return copy;
        });
      }
    });
  }

  function openHistory(profile: CustomerProfile) {
    setHistory({ profile, items: [], loading: true, error: false });
    startTransition(async () => {
      try {
        const params = new URLSearchParams({
          branch: String(branchId),
          phone: profile.phone,
          name: profile.name,
        });
        const response = await fetch(`/api/owner/customer-history?${params.toString()}`, { cache: "no-store" });
        if (!response.ok) throw new Error("history");
        const data = (await response.json()) as { items?: CustomerHistoryItem[] };
        setHistory({ profile, items: data.items ?? [], loading: false, error: false });
      } catch {
        setHistory({ profile, items: [], loading: false, error: true });
      }
    });
  }

  const hadirVisits =
    history?.items.filter((item) => item.status === "seated" || item.status === "completed").length ?? 0;
  const shortBranch = branchName.startsWith(brandName)
    ? branchName.slice(brandName.length).trim() || branchName
    : branchName;

  const scopeOptions: { id: Scope; label: string }[] = [
    { id: "branch", label: t.owner.repeatScopeBranch },
    { id: "brand", label: t.owner.repeatScopeBrand },
    { id: "all", label: t.owner.repeatScopeAll },
  ];

  return (
    <>
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink bg-cream/70 px-4 py-3 sm:px-5">
          <div>
            <h2 className="font-display text-[1.5rem] font-semibold leading-tight">{t.owner.customersViewProfiles}</h2>
            <p className="text-xs font-semibold text-muted">{format(t.owner.repeatNote, { days })}</p>
          </div>
          <span className="pill status-muted">{filtered.length}</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b-2 border-dashed border-ink/15 px-4 py-3 sm:px-5">
          <span className="text-[0.625rem] font-extrabold uppercase tracking-[0.12em] text-ink/45">
            {t.owner.repeatScope}
          </span>
          <div className="flex rounded-full border-2 border-ink bg-white p-1">
            {scopeOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => chooseScope(option.id)}
                aria-pressed={scope === option.id}
                className={`rounded-full px-2.5 py-1 text-[0.6875rem] font-extrabold transition ${
                  scope === option.id ? "bg-ink text-paper" : "text-muted hover:text-ink"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <label className="inline-flex items-center gap-1.5 text-xs font-bold">
            <input
              type="checkbox"
              checked={repeatOnly}
              onChange={(event) => {
                setRepeatOnly(event.target.checked);
                setPage(1);
              }}
              className="size-4 accent-[#F24B3F]"
            />
            {t.owner.repeatOnly}
          </label>
          <span className="text-[0.6875rem] font-semibold text-muted">
            {branchName} · {brandName}
          </span>
        </div>

        {visible.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm font-semibold text-muted">{t.owner.repeatEmpty}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b-2 border-ink/15 bg-cream/40 text-left text-[0.625rem] uppercase tracking-[0.12em] text-ink/50">
                  <th className="px-4 py-2.5 font-extrabold sm:px-5">{t.owner.customer}</th>
                  <th className="px-3 py-2.5 font-extrabold">{t.owner.repeatVisits}</th>
                  <th className="px-3 py-2.5 font-extrabold">{t.owner.repeatLastVisit}</th>
                  <th className="px-3 py-2.5 font-extrabold">{t.owner.repeatBranches}</th>
                  <th className="px-4 py-2.5 font-extrabold sm:px-5">{t.owner.viewHistory}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((profile) => {
                  const count = countFor(profile, scope);
                  const repeated = count >= 2;
                  const key = phoneKey(profile.phone);
                  const isStarred = key ? starred.has(key) : false;
                  return (
                    <tr
                      key={profile.key}
                      className={`border-b-2 border-dashed border-ink/10 last:border-0 ${
                        repeated ? "bg-butter/40" : "hover:bg-cream/30"
                      }`}
                    >
                      <td className="px-4 py-2.5 sm:px-5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="font-extrabold">{profile.name}</p>
                          {repeated && <span className="pill bg-tomato text-white">{t.owner.repeatHighlight}</span>}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <p className="num text-[0.6875rem] font-bold text-muted">{profile.phone}</p>
                          <button
                            type="button"
                            onClick={() => toggleStar(profile)}
                            className="rounded-full p-0.5 text-ink/30 transition hover:bg-cream hover:text-gold"
                            aria-label={isStarred ? t.owner.unstarPhone : t.owner.starPhone}
                            title={isStarred ? t.owner.unstarPhone : t.owner.starPhone}
                            disabled={pending}
                          >
                            <Star className={`size-3.5 ${isStarred ? "text-gold" : ""}`} fill={isStarred ? "currentColor" : "none"} />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          <span className={`pill ${scope === "branch" ? "status-called" : "status-muted"}`}>
                            {format(t.owner.repeatCountLabel, { count: profile.branchVisits, name: shortBranch })}
                          </span>
                          <span className={`pill ${scope === "brand" ? "status-called" : "status-muted"}`}>
                            {format(t.owner.repeatCountLabel, { count: profile.brandVisits, name: brandName })}
                          </span>
                          <span className={`pill ${scope === "all" ? "status-called" : "status-muted"}`}>
                            {format(t.owner.repeatCountLabel, { count: profile.allVisits, name: t.owner.repeatAllShort })}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs font-semibold text-muted">
                        <p>{formatDayLong(dayInTz(profile.lastVisitAt, timezone), locale)}</p>
                        <p className="num">{clockInTz(profile.lastVisitAt, timezone)}</p>
                        <p className="text-[0.625rem]">{profile.lastBranchName}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex max-w-[13rem] flex-wrap gap-1">
                          {profile.branches.map((name) => (
                            <span key={name} className="pill status-muted">
                              {name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 sm:px-5">
                        <button
                          type="button"
                          onClick={() => openHistory(profile)}
                          className="inline-flex items-center gap-1 text-[0.6875rem] font-bold text-tomato hover:underline"
                        >
                          <History className="size-3" /> {t.owner.viewHistory}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t-2 border-dashed border-ink/15 px-4 py-2.5 sm:px-5">
            <span className="text-[0.6875rem] font-semibold text-muted">
              {format(t.owner.repeatShowing, {
                from: (current - 1) * PAGE_SIZE + 1,
                to: Math.min(current * PAGE_SIZE, filtered.length),
                count: filtered.length,
              })}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={current <= 1}
                className="grid size-7 place-items-center rounded-full border-2 border-ink/20 bg-white text-ink/60 transition hover:border-ink disabled:opacity-30"
                aria-label={t.owner.repeatPrev}
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <span className="min-w-10 text-center text-[0.625rem] font-extrabold text-muted">
                {current}/{maxPage}
              </span>
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(maxPage, value + 1))}
                disabled={current >= maxPage}
                className="grid size-7 place-items-center rounded-full border-2 border-ink/20 bg-white text-ink/60 transition hover:border-ink disabled:opacity-30"
                aria-label={t.owner.repeatNext}
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      <Modal
        open={Boolean(history)}
        onClose={() => setHistory(null)}
        title={history ? format(t.owner.historyTitle, { name: history.profile.name }) : ""}
        description={t.owner.historySub}
      >
        {history && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-ink bg-cream px-3.5 py-2.5">
              <div>
                <p className="text-xs font-bold text-muted">{history.profile.phone}</p>
                <p className="text-sm font-extrabold">{format(t.owner.historyHadirVisits, { count: hadirVisits })}</p>
              </div>
              <span className="pill status-muted">
                {format(t.owner.repeatBranchCount, { count: history.profile.branches.length })}
              </span>
            </div>

            {history.loading ? (
              <p className="flex items-center justify-center gap-2 py-8 text-xs font-semibold text-muted">
                <Loader2 className="size-4 animate-spin" /> {t.owner.historyLoading}
              </p>
            ) : history.error ? (
              <p className="py-8 text-center text-xs font-semibold text-tomato-dark">{t.owner.historyError}</p>
            ) : history.items.length === 0 ? (
              <p className="py-8 text-center text-xs font-semibold text-muted">{t.owner.historyEmpty}</p>
            ) : (
              <div className="mt-3 max-h-[55vh] space-y-2 overflow-y-auto pr-1">
                {history.items.map((item) => (
                  <div key={item.id} className="rounded-xl border-2 border-ink/10 bg-cream/50 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-extrabold">
                        {item.code} · {item.partySize} {t.guest.guestUnit}
                      </p>
                      <span className={`pill ${statusTone(item.status)}`}>{t.status[statusKey(item.status)]}</span>
                    </div>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-muted">
                      <MapPin className="size-3" /> {item.branchName}
                    </p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-muted">
                      <Clock3 className="size-3" />
                      {formatDayLong(dayInTz(item.joinedAt, timezone), locale)} · {clockInTz(item.joinedAt, timezone)}
                    </p>
                    {item.seatedAt && (
                      <p className="mt-0.5 text-[0.6875rem] font-bold text-leaf-dark">
                        {t.ticket.seated}: {clockInTz(item.seatedAt, timezone)}
                      </p>
                    )}
                    {item.tableLabel && <p className="mt-0.5 text-[0.6875rem] font-semibold text-muted">{item.tableLabel}</p>}
                    {item.noShowReason && (
                      <p className="mt-0.5 text-[0.6875rem] font-bold text-tomato-dark">
                        {format(t.host.noShowReasonLabel, { reason: item.noShowReason })}
                      </p>
                    )}
                    {item.notes && <p className="mt-0.5 text-[0.6875rem] font-medium italic text-ink/65">“{item.notes}”</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
