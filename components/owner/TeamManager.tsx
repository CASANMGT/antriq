"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Plus, Shield, UserRound, Users } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Notice, type NoticeState } from "@/components/Notice";
import { postJson } from "@/lib/client-api";
import type { PublicStaff, Role } from "@/lib/types";

interface StaffRow extends PublicStaff {
  active: boolean;
  createdAt: string;
}

export function TeamManager({ staff }: { staff: StaffRow[] }) {
  const router = useRouter();
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
          <p className="eyebrow text-clay">People</p>
          <h1 className="mt-1 font-display text-[2.3rem] leading-none tracking-tight">Team</h1>
          <p className="mt-2 text-sm text-muted">
            {active.length} active · {owners.length} owner{owners.length === 1 ? "" : "s"} · {greeters.length} greeter
            {greeters.length === 1 ? "" : "s"}
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
          <Plus className="size-3.5" /> Add team member
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={Users} label="Active access" value={active.length} />
        <Stat icon={Shield} label="Owners" value={owners.length} hint="Full dashboard + floor" />
        <Stat icon={UserRound} label="Greeters" value={greeters.length} hint="Host stand only" />
      </div>

      <section className="card overflow-hidden">
        <div className="border-b border-line px-4 py-3 sm:px-5">
          <h2 className="font-display text-xl leading-tight">Access list</h2>
          <p className="text-xs text-muted">PINs are stored hashed. Nobody can read them back — only reset.</p>
        </div>
        <div className="divide-y divide-line/70">
          {staff.map((person) => (
            <div key={person.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5">
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-full text-xs font-extrabold ${
                  person.active ? "bg-ink text-paper" : "bg-cream text-muted"
                }`}
              >
                {person.initials ?? person.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold">{person.name}</p>
                  <span className={`pill ${person.role === "owner" ? "status-called" : "status-muted"}`}>
                    {person.role === "owner" ? "Owner" : "Greeter"}
                  </span>
                  {!person.active && <span className="pill status-muted">Paused</span>}
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {person.role === "owner" ? "Dashboard + host stand" : "Host stand only"} · PIN protected
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
                  <KeyRound className="size-3.5" /> Reset PIN
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
                  {person.active ? "Pause" : "Restore"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-2xl border border-dashed border-line bg-cream/40 p-4 text-xs leading-relaxed text-muted">
        Owners can change settings, tables, reports and staff. Greeters only get the live floor. At least one
        owner must stay active, so you can never lock yourself out.
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add a team member"
        description="They can sign in right away at the host stand with this PIN."
      >
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
            <label className="label" htmlFor="staff-name">Full name</label>
            <input
              id="staff-name"
              className="input"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              placeholder="e.g. Ayu Lestari"
              maxLength={60}
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="staff-role">Role</label>
              <select
                id="staff-role"
                className="input bg-white"
                value={draft.role}
                onChange={(event) => setDraft({ ...draft, role: event.target.value as Role })}
              >
                <option value="greeter">Greeter</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="staff-pin">4–8 digit PIN</label>
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
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Add member
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(resetting)}
        onClose={() => setResetting(null)}
        title={resetting ? `Reset ${resetting.name}'s PIN` : "Reset PIN"}
        description="The old PIN stops working immediately. Share the new one in person."
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
              <label className="label" htmlFor="new-pin">New PIN</label>
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
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex-1" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />} Save PIN
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
}: {
  icon: typeof Users;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
        <Icon className="size-4 text-clay" />
      </div>
      <p className="stat-number mt-2 text-4xl">{value}</p>
      {hint && <p className="mt-1 text-[0.6875rem] text-muted">{hint}</p>}
    </div>
  );
}
