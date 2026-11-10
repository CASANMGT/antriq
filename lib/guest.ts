/** Cookie that keeps the guest's active ticket on this device. */
export const GUEST_TICKET_COOKIE = "antriq_active_ticket";
export const GUEST_TICKET_MAX_AGE = 60 * 60 * 24 * 30;

/** Normalize a phone number to a stable key (Indonesian numbers become 62…). */
export function phoneKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}
