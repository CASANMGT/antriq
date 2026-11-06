"use client";

import { useActionState, useState } from "react";
import { AlertCircle, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { loginAction, type LoginState } from "@/app/login/actions";
import { useLang } from "@/components/LanguageProvider";
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
  const { t } = useLang();
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const [staffId, setStaffId] = useState<string>(staff[0] ? String(staff[0].id) : "");
  const [pin, setPin] = useState("");
  const [touched, setTouched] = useState(false);

  const selected = staff.find((person) => String(person.id) === staffId);
  const owner = staff.find((person) => person.role === "owner");
  const greeter = staff.find((person) => person.role === "greeter");
  const error =
    state.code === "choose"
      ? t.login.chooseName
      : state.code === "pin"
        ? t.login.badPin
        : state.code === "throttle"
          ? t.login.tooMany
          : state.code === "wrong"
            ? t.login.wrongPin
            : state.error;

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
            {t.login.staffOnShift}
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
                {person.name} — {person.role === "owner" ? t.login.ownerRole : t.login.greeterRole}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs font-semibold text-muted">
            {selected?.role === "owner" ? t.login.ownerDesc : t.login.greeterDesc}
          </p>
        </div>

        <div>
          <label className="label" htmlFor="pin">
            {t.login.pin}
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
          <p className="mt-1.5 text-[0.6875rem] font-semibold text-muted">{t.login.pinHint}</p>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border-2 border-ink bg-pink px-3 py-2.5 text-sm font-semibold text-tomato-dark"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> {t.login.submitting}
            </>
          ) : (
            <>
              {t.login.submit} <ArrowRight className="size-4" />
            </>
          )}
        </button>

        <p className="flex items-center justify-center gap-1.5 text-center text-[0.6875rem] font-semibold text-muted">
          <ShieldCheck className="size-3.5" /> {t.login.sessionNote}
        </p>
      </form>

      {demo && (owner || greeter) && (
        <div className="mt-6 rounded-2xl border-2 border-ink bg-cream p-4 shadow-[3px_3px_0_#262321]">
          <p className="eyebrow text-tomato">{t.login.demoAccess}</p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-ink/65">{t.login.demoHint}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {owner && (
              <button
                type="button"
                onClick={() => quickFill(owner, "2468")}
                className="btn btn-soft btn-sm justify-between text-left"
              >
                <span className="truncate">{owner.name.split(" ")[0]} · {t.login.ownerDemo}</span>
                <span className="num font-extrabold">2468</span>
              </button>
            )}
            {greeter && (
              <button
                type="button"
                onClick={() => quickFill(greeter, "1357")}
                className="btn btn-soft btn-sm justify-between text-left"
              >
                <span className="truncate">{greeter.name.split(" ")[0]} · {t.login.hostDemo}</span>
                <span className="num font-extrabold">1357</span>
              </button>
            )}
          </div>
          {touched && (
            <p className="mt-2.5 text-[0.6875rem] font-semibold text-muted">
              {t.login.filledPin}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
