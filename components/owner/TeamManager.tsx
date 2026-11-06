"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Plus, Shield, UserRound, Users } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Notice, type NoticeState } from "@/components/Notice";
import { useLang } from "@/components/LanguageProvider";
import { postJson } from "@/lib/client-api";
import { format } from "@/lib/i18n";
import type { PublicStaff, Role } from "@/lib/types";

interface StaffRow extends PublicStaff {
  active: boolean;
  createdAt: string;
}

export function TeamManager({ staff }: { staff: StaffRow[] }) {
  const router = useRouter();
  const { t } = useLang();
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [pending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [resetting, setResetting] = useState<StaffRow | null>(null);
  const [pin, setPin] = useState("");
  const [draft, setDraft] = useState<{ name: string; role: Role; pin: string }>({
    name: "",
    role: "greeter",
    pin: "",
  });

  const active = staff.filter((person) => person.active);
  const owners = staff.filter((person) => person.role === "owner");
  const greeters = staff.filter((person) => person.role === "greeter");

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

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-tomato">{t.owner.teamKicker}</p>
          <h1 className="mt-1 font-display text-[2.5rem] font-semibold leading-none tracking-tight">{t.owner.teamTitle}</h1>
          <p className="mt-2 text-sm font-semibold text-muted">
            {format(t.owner.teamSub, { active: active.length, owners: owners.length, greeters: greeters.length })}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => {
            setDraft({ name: "", role: "greeter", pin: "" });
            setAddOpen(true);
          }}
        >
          <Plus className="size-3.5" /> {t.owner.addMember}
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={Users} label={t.owner.activeAccess} value={active.length} tone="bg-pink" />
        <Stat icon={Shield} label={t.owner.owners} value={owners.length} hint={t.owner.ownerAccess} tone="bg-cream" />
        <Stat icon={UserRound} label={t.owner.greeters} value={greeters.length} hint={t.owner.greeterAccess} tone="bg-leaf-soft" />
      </div>

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
                    {person.role === "owner" ? t.owner.owners.replace(/s$/i, "") : t.owner.greeters.replace(/s$/i, "")}
                  </span>
                  {!person.active && <span className="pill status-muted">{t.owner.paused}</span>}
                </div>
                <p className="mt-0.5 text-xs font-semibold text-muted">
                  {person.role === "owner" ? t.owner.ownerAccess : t.owner.greeterAccess} · {t.owner.pinProtected}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="btn btn-soft btn-sm"
                  onClick={() => {
                    setResetting(person);
                    setPin("");
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

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={t.owner.addMemberTitle} description={t.owner.addMemberDesc}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            run(
              () => postJson("/api/owner/action", { type: "staffCreate", ...draft }),
              () => {
                setAddOpen(false);
                setDraft({ name: "", role: "greeter", pin: "" });
              },
            );
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
              placeholder="Ayu Lestari"
              maxLength={60}
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="staff-role">{t.owner.role}</label>
              <select
                id="staff-role"
                className="input bg-white"
                value={draft.role}
                onChange={(event) => setDraft({ ...draft, role: event.target.value as Role })}
              >
                <option value="greeter">{t.login.greeterRole}</option>
                <option value="owner">{t.login.ownerRole}</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="staff-pin">{t.owner.clearPin}</label>
              <input
                id="staff-pin"
                className="input num tracking-[0.25em]"
                inputMode="numeric"
                pattern="\d{4,8}"
                maxLength={8}
                value={draft.pin}
                onChange={(event) => setDraft({ ...draft, pin: event.target.value.replace(/\D/g, "").slice(0, 8) })}
                placeholder="••••"
                required
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" className="btn btn-ghost flex-1" onClick={() => setAddOpen(false)}>
              {t.common.cancel}
            </button>
            <button type="submit" className="btn btn-primary flex-1" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} {t.owner.addMemberBtn}
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
                  setPin("");
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
