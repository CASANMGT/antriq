export class AppError extends Error {
  code: string;
  status: number;
  data?: unknown;

  constructor(message: string, code = "bad_request", status = 400, data?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.data = data;
  }
}

export function cleanText(value: unknown, max = 200): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function validateGuestName(value: unknown): string {
  const name = cleanText(value, 60);
  if (name.length < 2) throw new AppError("Please enter a name with at least 2 characters.");
  if (name.length > 60) throw new AppError("That name is a little too long.");
  return name;
}

export function normalizePhone(value: unknown): string | null {
  const raw = cleanText(value, 32);
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length < 7 || digits.length > 16) {
    throw new AppError("Please enter a valid phone number, or leave it blank.");
  }
  return raw.startsWith("+") ? `+${digits}` : digits;
}

export function validateNotes(value: unknown): string | null {
  const notes = cleanText(value, 200);
  return notes.length ? notes : null;
}

export function validatePartySize(value: unknown, max: number): number {
  const party = Number(value);
  if (!Number.isInteger(party) || party < 1) throw new AppError("Choose how many guests are in your party.");
  if (party > max) throw new AppError(`Parties larger than ${max} need to call the restaurant directly.`);
  return party;
}

export function validatePin(value: unknown): string {
  const pin = String(value ?? "").trim();
  if (!/^\d{4,8}$/.test(pin)) throw new AppError("PIN must be 4–8 digits.");
  return pin;
}

export function validateTime(value: unknown, label: string): string {
  const time = String(value ?? "").trim();
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new AppError(`${label} must be a time like 11:00.`);
  return time;
}

export function validateAccent(value: unknown): string {
  const color = String(value ?? "").trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) throw new AppError("Accent colour must be a hex value like #C8452B.");
  return color.toUpperCase();
}

export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function validateTableLabel(value: unknown): string {
  const label = cleanText(value, 16).toUpperCase();
  if (label.length < 1) throw new AppError("Give the table a name, like T1 or Patio 3.");
  return label;
}

export function validateZone(value: unknown): string {
  const zone = cleanText(value, 40);
  return zone.length ? zone : "Main dining";
}
