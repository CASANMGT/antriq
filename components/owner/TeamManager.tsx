"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Pencil, Plus, Shield, UserRound, Users } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Notice, type NoticeState } from "@/components/Notice";
import { useLang } from "@/components/LanguageProvider";
import { postJson } from "@/lib/client-api";
import { format } from "@/lib/i18n";
import type { BranchSummary, PublicStaff, Role } from "@/lib/types";

interface StaffRow extends PublicStaff {
  active: boolean;
  createdAt: string;
}

interface Draft {
  name: string;
  role: Role;
  pin: string;
  brandId: string;
  branchId: string;
}

export function TeamManager({
  staff,
  brands,
  branches,
  defaultBranchId,
  demoPinCount,
  scope,
}: {
  staff: StaffRow[];
  brands: { id: number; name: string }[];
  branches: BranchSummary[];
  defaultBranchId: number;
  demoPinCount: number;
  scope: { role: Role; brandId: number | null; branchId: number | null };
}) {
  const router = useRouter();
  const { t } = useLang();
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [pending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StaffRow | null>(null);
  const [resetting, setResetting] = useState<StaffRow | null>(null);
  const [pin, setPin] = useState("");
  const [draft, setDraft] = useState<Draft>({
    name: "Host",
    role: "host",
    pin: "1234",
    brandId: "",
    branchId: "",
  });

  const active = staff.filter((person) => person.active);
  const owners = staff.filter((person) => person.role === "owner");
  const hosts = staff.filter((person) => person.role === "host");

  const branchOptions = useMemo(() => {
    const brandId = Number(draft.brandId);
    return branches.filter((branch) => !brandId || branch.brandId === brandId);
  }, [branches, draft.brandId]);

  const lockedBrand = scope.brandId != null;
  const lockedBranch = scope.branchId != null;
  const canOwners = !lockedBranch;

  function show(message: string, tone: NoticeState["tone"]) {
    setNotice({ message, tone });
  }

  function run(action: () => Promise<{ ok: boolean; message?: string }>, onSuccess?: () => void) {
    startTransition(async () => {
      const result = await action();
      if (result.message) show(result.message, result.ok ? "success" : "error");
      if (result.ok) {
        onSuccess?.();
        router.refresh();
      }
    });
  }

  function openCreate() {
    const branch = branches.find((item) => item.id === defaultBranchId) ?? branches[0];
    setEditing(null);
    setDraft({
      name: "Host",
      role: "host",
      pin: "1234",
      brandId: String(scope.brandId ?? branch?.brandId ?? brands[0]?.id ?? ""),
      branchId: String(scope.branchId ?? branch?.id ?? ""),
    });
    setFormOpen(true);
  }

  function openEdit(person: StaffRow) {
    setEditing(person);
    setDraft({
      name: person.name,
      role: person.role,
      pin: "",
      brandId: person.brandId ? String(person.brandId) : "",
      branchId: person.branchId ? String(person.branchId) : "",
    });
    setFormOpen(true);
  }

  function submit() {
    const payload = {
      name: draft.name,
      role: draft.role,
      pin: draft.pin || undefined,
      brandId: draft.brandId ? Number(draft.brandId) : null,
      branchId: draft.branchId ? Number(draft.branchId) : null,
    };
    run(
      () =>
        editing
          ? postJson("/api/owner/action", { type: "staffUpdate", id: editing.id, ...payload })
          : postJson("/api/owner/action", { type: "staffCreate", ...payload }),
      () => {
        setFormOpen(false);
        setEditing(null);
      },
    );
  }

  function roleLabel(role: Role): string {
    return role === "owner" ? t.login.ownerRole : t.login.hostRole;
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-tomato">{t.owner.teamKicker}</p>
          <h1 className="mt-1 font-display text-[2.5rem] font-semibold leading-none tracking-tight">{t.owner.teamTitle}</h1>
          <p className="mt-2 text-sm font-semibold text-muted">
            {format(t.owner.teamSub, {
              active: active.length,
              owners: owners.length,
              hosts: hosts.length,
            })}
          </p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
          <Plus className="size-3.5" /> {t.owner.addMember}
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={Users} label={t.owner.activeAccess} value={active.length} tone="bg-pink" />
        <Stat icon={Shield} label={t.owner.owners} value={owners.length} hint={t.owner.ownerAccess} tone="bg-cream" />
        <Stat icon={UserRound} label={t.owner.hosts} value={hosts.length} hint={t.owner.hostAccess} tone="bg-leaf-soft" />
      </div>

      {demoPinCount > 0 && (
        <div className="rounded-2xl border-2 border-ink bg-butter px-4 py-3.5 shadow-[3px_3px_0_#262321]">
          <p className="font-display text-xl leading-tight">{t.owner.demoPinWarningTitle}</p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-ink/70">
            {format(t.owner.demoPinWarningBody, { count: demoPinCount })}
          </p>
        </div>
      )}

      <section className="card overflow-hidden">
        <div className="border-b-2 border-ink bg-cream/70 px-4 py-3 sm:px-5">
          <h2 className="font-display text-[1.5rem] font-semibold leading-tight">{t.owner.accessList}</h2>
          <p className="text-xs font-semibold text-muted">{t.owner.accessSub}</p>
        </div>
        <div className="divide-y-2 divide-dashed divide-ink/10">
          {staff.map((person) => (
            <div key={person.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5">
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-full border-2 border-ink text-xs font-extrabold ${
                  person.active ? "bg-ink text-paper" : "bg-[#EFE8DA] text-muted"
                }`}
              >
                {person.initials ?? person.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-extrabold">{person.name}</p>
                  <span className={`pill ${person.role === "owner" ? "status-called" : "status-muted"}`}>
                    {roleLabel(person.role)}
                  </span>
                  {!person.active && <span className="pill status-muted">{t.owner.paused}</span>}
                </div>
                <p className="mt-0.5 text-xs font-semibold text-muted">
                  {person.brandName ?? t.owner.allBrands}
                  {person.branchName ? ` · ${person.branchName}` : ""} · {t.owner.pinProtected}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button type="button" className="btn btn-ghost btn-icon" aria-label={t.owner.editMember} title={t.owner.editMember} onClick={() => openEdit(person)}>
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  className="btn btn-soft btn-sm"
                  onClick={() => {
                    setResetting(person);
                    setPin("1234");
                  }}
                >
                  <KeyRound className="size-3.5" /> {t.owner.resetPin}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-muted"
                  disabled={pending}
                  onClick={() =>
                    run(() =>
                      postJson("/api/owner/action", {
                        type: "staffToggle",
                        id: person.id,
                        active: !person.active,
                      }),
                    )
                  }
                >
                  {person.active ? t.owner.pause : t.owner.restore}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-2xl border-2 border-dashed border-ink/30 bg-cream/50 p-4 text-xs font-semibold leading-relaxed text-muted">
        {t.owner.teamNote}
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? format(t.owner.editMemberTitle, { name: editing.name }) : t.owner.addMemberTitle}
        description={editing ? t.owner.editMemberDesc : t.owner.addMemberDesc}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          className="space-y-4"
        >
          <div>
            <label className="label" htmlFor="staff-name">{t.owner.fullName}</label>
            <input
              id="staff-name"
              className="input"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              placeholder="Host"
              maxLength={60}
              required
            />
            <p className="mt-1.5 text-xs font-semibold leading-relaxed text-muted">{t.owner.staffNameHint}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="staff-role">{t.owner.role}</label>
              <select
                id="staff-role"
                className="input bg-white"
                value={draft.role}
                onChange={(event) => {
                  const role = event.target.value as Role;
                  setDraft({
                    ...draft,
                    role,
                    name:
                      draft.name === "Host" || draft.name === "Owner"
                        ? role === "owner"
                          ? "Owner"
                          : "Host"
                        : draft.name,
                    branchId: role === "host" ? draft.branchId || String(defaultBranchId) : draft.branchId,
                  });
                }}
              >
                <option value="host">{t.login.hostRole}</option>
                {canOwners && <option value="owner">{t.login.ownerRole}</option>}
                {!canOwners && draft.role === "owner" && <option value="owner">{t.login.ownerRole}</option>}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="staff-brand">{t.owner.brand}</label>
              <select
                id="staff-brand"
                className="input bg-white"
                value={draft.brandId}
                disabled={lockedBrand}
                onChange={(event) => {
                  const brandId = event.target.value;
                  const firstBranch = branches.find((branch) => String(branch.brandId) === brandId);
                  setDraft({
                    ...draft,
                    brandId,
                    branchId: draft.role === "host" ? (firstBranch ? String(firstBranch.id) : "") : draft.branchId,
                  });
                }}
              >
                {draft.role === "owner" && scope.brandId === null && (
                  <option value="">{t.owner.allBrands}</option>
                )}
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="staff-branch">
                {t.owner.branch}
                {draft.role === "host" && <span className="ml-1 text-tomato">*</span>}
              </label>
              <select
                id="staff-branch"
                className="input bg-white"
                value={draft.branchId}
                disabled={lockedBranch}
                required={draft.role === "host"}
                onChange={(event) => setDraft({ ...draft, branchId: event.target.value })}
              >
                {draft.role === "owner" && <option value="">{t.owner.allBranches}</option>}
                {!draft.branchId && draft.role === "host" && <option value="">{t.owner.chooseBranch}</option>}
                {branchOptions.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.brandName} · {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="staff-pin">
                {editing ? t.owner.newPinOptional : t.owner.clearPin}
              </label>
              <input
                id="staff-pin"
                className="input num tracking-[0.25em]"
                inputMode="numeric"
                pattern="\d{4,8}"
                maxLength={8}
                value={draft.pin}
                onChange={(event) => setDraft({ ...draft, pin: event.target.value.replace(/\D/g, "").slice(0, 8) })}
                placeholder="1234"
                required={!editing}
              />
            </div>
          </div>

          <p className="rounded-xl border-2 border-dashed border-ink/25 bg-cream/60 px-3 py-2 text-[0.6875rem] font-semibold leading-relaxed text-muted">
            {t.owner.staffScopeNote}
          </p>

          <div className="flex gap-2 pt-1">
            <button type="button" className="btn btn-ghost flex-1" onClick={() => setFormOpen(false)}>
              {t.common.cancel}
            </button>
            <button type="submit" className="btn btn-primary flex-1" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : editing ? <Pencil className="size-4" /> : <Plus className="size-4" />}
              {editing ? t.common.save : t.owner.addMemberBtn}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(resetting)}
        onClose={() => setResetting(null)}
        title={resetting ? format(t.owner.resetTitle, { name: resetting.name }) : t.owner.resetPin}
        description={t.owner.resetDesc}
      >
        {resetting && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              run(
                () => postJson("/api/owner/action", { type: "staffPin", id: resetting.id, pin }),
                () => {
                  setResetting(null);
                  setPin("1234");
                },
              );
            }}
            className="space-y-4"
          >
            <div>
              <label className="label" htmlFor="new-pin">{t.owner.newPin}</label>
              <input
                id="new-pin"
                className="input num tracking-[0.3em]"
                inputMode="numeric"
                pattern="\d{4,8}"
                maxLength={8}
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="••••"
                required
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn btn-ghost flex-1" onClick={() => setResetting(null)}>
                {t.common.cancel}
              </button>
              <button type="submit" className="btn btn-primary flex-1" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />} {t.owner.savePin}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Notice notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  hint?: string;
  tone: string;
}) {
  return (
    <div className={`rounded-2xl border-2 border-ink p-4 shadow-[3px_3px_0_#262321] ${tone}`}>
      <div className="flex items-center justify-between">
        <p className="text-[0.625rem] font-extrabold uppercase tracking-[0.12em] text-ink/55">{label}</p>
        <Icon className="size-4 text-ink/70" />
      </div>
      <p className="stat-number mt-2 text-[2.6rem]">{value}</p>
      {hint && <p className="mt-1 text-[0.6875rem] font-semibold text-ink/55">{hint}</p>}
    </div>
  );
}
