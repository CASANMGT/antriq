import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEYLEN = 64;

/** Hash a numeric staff PIN with scrypt. Format: scrypt:<salt>:<hash>. */
export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, KEYLEN).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

/** Constant-time PIN verification. Never throws on malformed hashes. */
export function verifyPin(pin: string, stored: string): boolean {
  try {
    const [scheme, salt, hash] = stored.split(":");
    if (scheme !== "scrypt" || !salt || !hash) return false;
    const expected = Buffer.from(hash, "hex");
    const actual = scryptSync(pin, salt, expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function isPinFormat(pin: string): boolean {
  return /^\d{4,8}$/.test(pin);
}
