"use client";

import { useActionState, useState } from "react";
import { AlertCircle, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { loginAction, type LoginState } from "@/app/login/actions";
import type { PublicStaff } from "@/lib/types";

export function LoginForm({
  staff,
  next,
  demo,
}: {
  staff: PublicStaff[];
  next: string;
  demo: boolean;
}) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const [staffId, setStaffId] = useState<string>(staff[0] ? String(staff[0].id) : "");
  const [pin, setPin] = useState("");
  const [touched, setTouched] = useState(false);

  const selected = staff.find((person) => String(person.id) === staffId);
  const owner = staff.find((person) => person.role === "owner");
  const greeter = staff.find((person) => person.role === "greeter");

  function quickFill(person: PublicStaff | undefined, demoPin: string) {
    if (!person) return;
    setStaffId(String(person.id));
    setPin(demoPin);
    setTouched(true);
  }

  return (
    <div>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="staffId" value={staffId} />
        <input type="hidden" name="next" value={next} />

        <div>
          <label className="label" htmlFor="staff">
            Who&apos;s on shift?
          </label>
          <select
            id="staff"
            className="input appearance-none bg-white pr-9"
            value={staffId}
            onChange={(event) => setStaffId(event.target.value)}
            required
          >
            {staff.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name} — {person.role === "owner" ? "Owner" : "Greeter"}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-muted">
            {selected?.role === "owner"
              ? "Owner access includes the floor and the dashboard."
              : "Greeter access opens the live host stand."}
          </p>
        </div>

        <div>
          <label className="label" htmlFor="pin">
            Staff PIN
          </label>
          <input
            id="pin"
            name="pin"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            pattern="[0-9]*"
            maxLength={8}
            placeholder="••••"
            className="input num tracking-[0.4em]"
            value={pin}
            onChange={(event) => {
              setPin(event.target.value.replace(/\D/g, "").slice(0, 8));
              setTouched(true);
            }}
            required
          />
        </div>

        {state.error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-clay/25 bg-clay-soft px-3 py-2.5 text-sm font-medium text-clay-dark"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {state.error}
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Signing in…
            </>
          ) : (
            <>
              Open the floor <ArrowRight className="size-4" />
            </>
          )}
        </button>

        <p className="flex items-center justify-center gap-1.5 text-center text-[0.6875rem] text-muted">
          <ShieldCheck className="size-3.5" /> Staff-only. Sessions expire after 12 hours.
        </p>
      </form>

      {demo && (owner || greeter) && (
        <div className="mt-6 rounded-2xl border border-line bg-white/60 p-4">
          <p className="eyebrow text-muted">Demo access</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            This is a seeded demo restaurant. Use a shortcut, or type the PIN shown.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {owner && (
              <button
                type="button"
                onClick={() => quickFill(owner, "2468")}
                className="btn btn-soft btn-sm justify-between text-left"
              >
                <span>{owner.name.split(" ")[0]} · Owner</span>
                <span className="num font-bold">2468</span>
              </button>
            )}
            {greeter && (
              <button
                type="button"
                onClick={() => quickFill(greeter, "1357")}
                className="btn btn-soft btn-sm justify-between text-left"
              >
                <span>{greeter.name.split(" ")[0]} · Host</span>
                <span className="num font-bold">1357</span>
              </button>
            )}
          </div>
          {touched && (
            <p className="mt-2.5 text-[0.6875rem] text-muted">
              Filled the PIN — press <span className="font-bold text-ink">Open the floor</span>.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
