import { createHmac, timingSafeEqual } from "node:crypto";

export const BLOG_ADMIN_COOKIE = "blog_admin_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
export const SESSION_RENEW_THRESHOLD_SECONDS = 60 * 60 * 24 * 7;

export interface SessionPayload {
  exp: number;
}

export interface VerifyResult {
  valid: boolean;
  expiresAt?: Date;
  shouldRenew?: boolean;
}

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + "=".repeat(padLen), "base64");
}

function hmac(payload: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(payload).digest();
}

export function signSession(payload: SessionPayload, secret: string): string {
  const json = JSON.stringify(payload);
  const encoded = base64UrlEncode(json);
  const signature = base64UrlEncode(hmac(encoded, secret));
  return `${encoded}.${signature}`;
}

export function verifySession(
  token: string | undefined | null,
  secret: string,
): VerifyResult {
  if (!token || typeof token !== "string") return { valid: false };
  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false };
  const [encoded, signature] = parts;

  const expected = base64UrlEncode(hmac(encoded, secret));
  const aBuf = Buffer.from(signature);
  const bBuf = Buffer.from(expected);
  if (aBuf.length !== bBuf.length) return { valid: false };
  if (!timingSafeEqual(aBuf, bBuf)) return { valid: false };

  let payload: SessionPayload;
  try {
    payload = JSON.parse(base64UrlDecode(encoded).toString("utf-8"));
  } catch {
    return { valid: false };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp <= nowSec) {
    return { valid: false };
  }

  const expiresAt = new Date(payload.exp * 1000);
  const shouldRenew = payload.exp - nowSec < SESSION_RENEW_THRESHOLD_SECONDS;
  return { valid: true, expiresAt, shouldRenew };
}

export function buildSessionToken(secret: string, ttlSeconds = SESSION_TTL_SECONDS): {
  token: string;
  expiresAt: Date;
} {
  const expSec = Math.floor(Date.now() / 1000) + ttlSeconds;
  const token = signSession({ exp: expSec }, secret);
  return { token, expiresAt: new Date(expSec * 1000) };
}

export interface CookieAttributes {
  maxAgeSeconds?: number;
  secure?: boolean;
}

export function buildSessionCookieHeader(
  value: string,
  { maxAgeSeconds = SESSION_TTL_SECONDS, secure = true }: CookieAttributes = {},
): string {
  const parts = [
    `${BLOG_ADMIN_COOKIE}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function buildClearCookieHeader(secure = true): string {
  return buildSessionCookieHeader("", { maxAgeSeconds: 0, secure });
}

export function compareTimingSafe(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}
