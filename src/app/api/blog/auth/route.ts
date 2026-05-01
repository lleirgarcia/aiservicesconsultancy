import { NextRequest, NextResponse } from "next/server";
import {
  buildClearCookieHeader,
  buildSessionCookieHeader,
  buildSessionToken,
  compareTimingSafe,
} from "@/lib/blog/adminAuth";
import { env, readOptional } from "@/lib/env";
import { readAdminSession } from "@/lib/blog/requireAdmin";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;
const attempts = new Map<string, number[]>();

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  if (recent.length >= RATE_LIMIT_MAX) {
    attempts.set(ip, recent);
    return true;
  }
  recent.push(now);
  attempts.set(ip, recent);
  return false;
}

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

export async function POST(req: NextRequest) {
  let configuredPassword: string;
  let secret: string;
  try {
    configuredPassword = env.blogAdminPassword();
    secret = env.blogAdminSessionSecret();
  } catch {
    return NextResponse.json(
      { error: "admin_not_configured" },
      { status: 500 },
    );
  }

  const ip = getClientIp(req);
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "too_many_attempts" },
      { status: 429 },
    );
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "missing_password" },
      { status: 400 },
    );
  }
  if (!body.password || typeof body.password !== "string") {
    return NextResponse.json(
      { error: "missing_password" },
      { status: 400 },
    );
  }

  if (!compareTimingSafe(body.password, configuredPassword)) {
    return NextResponse.json({ error: "invalid_password" }, { status: 401 });
  }

  const { token, expiresAt } = buildSessionToken(secret);
  const cookieHeader = buildSessionCookieHeader(token, { secure: isProd() });

  const res = NextResponse.json({
    ok: true,
    expiresAt: expiresAt.toISOString(),
  });
  res.headers.set("Set-Cookie", cookieHeader);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", buildClearCookieHeader(isProd()));
  return res;
}

export async function GET() {
  const configured = !!readOptional("BLOG_ADMIN_PASSWORD");
  if (!configured) {
    return NextResponse.json({ authenticated: false });
  }
  const session = await readAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({
    authenticated: true,
    expiresAt: session.expiresAt?.toISOString(),
  });
}
