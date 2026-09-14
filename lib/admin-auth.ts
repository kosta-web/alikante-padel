import crypto from "crypto";
import { cookies } from "next/headers";

/* ------------------------------------------------------------------
   Minimal password + signed-cookie session for /admin. No user table,
   no DB — a single shared password from .env.local (ADMIN_PASSWORD),
   and a session token HMAC-signed with ADMIN_SESSION_SECRET so it
   can't be forged without that secret.
------------------------------------------------------------------ */

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 дней

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not set (check .env.local)");
  }
  return secret;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !password) return false;
  return timingSafeEqual(password, expected);
}

export function createSessionToken(): string {
  const payload = String(Date.now() + SESSION_TTL_MS);
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if (!timingSafeEqual(signature, sign(payload))) return false;
  const expires = Number(payload);
  return Number.isFinite(expires) && Date.now() < expires;
}

/**
 * Re-checks the admin cookie session from inside a Server Action. The
 * dashboard layout already gates page rendering, but actions are callable
 * endpoints in their own right — this is defense in depth before any
 * service-role write or admin-scoped read.
 */
export async function requireAdminSession(): Promise<void> {
  const store = await cookies();
  if (!verifySessionToken(store.get("admin_session")?.value)) {
    throw new Error("Not authenticated");
  }
}
