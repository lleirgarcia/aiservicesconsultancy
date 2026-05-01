import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  BLOG_ADMIN_COOKIE,
  buildSessionCookieHeader,
  buildSessionToken,
  verifySession,
  VerifyResult,
} from "./adminAuth";
import { env } from "@/lib/env";

export interface AdminSessionInfo {
  authenticated: boolean;
  expiresAt?: Date;
  shouldRenew?: boolean;
}

export async function readAdminSession(): Promise<AdminSessionInfo> {
  let secret: string;
  try {
    secret = env.blogAdminSessionSecret();
  } catch {
    return { authenticated: false };
  }
  let token: string | undefined;
  try {
    const store = await cookies();
    token = store.get(BLOG_ADMIN_COOKIE)?.value;
  } catch {
    return { authenticated: false };
  }
  const result: VerifyResult = verifySession(token, secret);
  if (!result.valid) return { authenticated: false };
  return {
    authenticated: true,
    expiresAt: result.expiresAt,
    shouldRenew: result.shouldRenew,
  };
}

export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await readAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

export function buildRenewedCookieHeader(secure: boolean): string {
  const secret = env.blogAdminSessionSecret();
  const { token } = buildSessionToken(secret);
  return buildSessionCookieHeader(token, { secure });
}
