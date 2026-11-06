"use server";

import { redirect } from "next/navigation";
import {
  clearLoginFailures,
  loginAllowed,
  noteLoginFailure,
  setSession,
} from "@/lib/auth";
import { verifyStaffPin } from "@/lib/store";

export interface LoginState {
  error?: string;
  code?: "choose" | "pin" | "throttle" | "wrong";
}

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const staffId = Number(formData.get("staffId"));
  const pin = String(formData.get("pin") ?? "").trim();
  const next = String(formData.get("next") ?? "");

  if (!Number.isInteger(staffId) || staffId <= 0) {
    return { error: "Choose your name to sign in.", code: "choose" };
  }
  if (!/^\d{4,8}$/.test(pin)) {
    return { error: "Enter your 4–8 digit PIN.", code: "pin" };
  }
  if (!loginAllowed(staffId)) {
    return { error: "Too many tries. Please wait five minutes and try again.", code: "throttle" };
  }

  const staff = await verifyStaffPin(staffId, pin);
  if (!staff) {
    noteLoginFailure(staffId);
    return { error: "That PIN doesn't match. Try again.", code: "wrong" };
  }

  clearLoginFailures(staffId);
  await setSession({
    staffId: staff.id,
    name: staff.name,
    role: staff.role,
    initials: staff.initials,
  });

  if (next === "/host") redirect("/host");
  if (next === "/dashboard" && staff.role === "owner") redirect("/dashboard");
  redirect(staff.role === "owner" ? "/dashboard" : "/host");
}
