import {
  signSession,
  verifySession,
  buildSessionToken,
  buildSessionCookieHeader,
  buildClearCookieHeader,
  BLOG_ADMIN_COOKIE,
  SESSION_RENEW_THRESHOLD_SECONDS,
} from "@/lib/blog/adminAuth";

const SECRET = "a".repeat(64);

describe("signSession + verifySession", () => {
  it("round-trip válido", () => {
    const exp = Math.floor(Date.now() / 1000) + 600;
    const token = signSession({ exp }, SECRET);
    const result = verifySession(token, SECRET);
    expect(result.valid).toBe(true);
    expect(result.expiresAt?.getTime()).toBe(exp * 1000);
  });

  it("rechaza token expirado", () => {
    const expPast = Math.floor(Date.now() / 1000) - 10;
    const token = signSession({ exp: expPast }, SECRET);
    expect(verifySession(token, SECRET).valid).toBe(false);
  });

  it("rechaza HMAC manipulado", () => {
    const exp = Math.floor(Date.now() / 1000) + 600;
    const token = signSession({ exp }, SECRET);
    const tampered = `${token.split(".")[0]}.AAAAAAAA`;
    expect(verifySession(tampered, SECRET).valid).toBe(false);
  });

  it("rechaza payload manipulado", () => {
    const exp = Math.floor(Date.now() / 1000) + 600;
    const token = signSession({ exp }, SECRET);
    const [, sig] = token.split(".");
    const fakePayload = Buffer.from(
      JSON.stringify({ exp: exp + 999999 }),
    )
      .toString("base64")
      .replace(/=+$/, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    expect(verifySession(`${fakePayload}.${sig}`, SECRET).valid).toBe(false);
  });

  it("rechaza con secret distinto", () => {
    const exp = Math.floor(Date.now() / 1000) + 600;
    const token = signSession({ exp }, SECRET);
    expect(verifySession(token, "b".repeat(64)).valid).toBe(false);
  });

  it("token sin punto o vacío es inválido", () => {
    expect(verifySession("", SECRET).valid).toBe(false);
    expect(verifySession(undefined, SECRET).valid).toBe(false);
    expect(verifySession("sinpunto", SECRET).valid).toBe(false);
  });

  it("marca shouldRenew si quedan menos de 7 días", () => {
    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 3;
    const token = signSession({ exp }, SECRET);
    const result = verifySession(token, SECRET);
    expect(result.valid).toBe(true);
    expect(result.shouldRenew).toBe(true);
  });

  it("no marca shouldRenew si quedan más de 7 días", () => {
    const exp =
      Math.floor(Date.now() / 1000) + SESSION_RENEW_THRESHOLD_SECONDS + 3600;
    const token = signSession({ exp }, SECRET);
    expect(verifySession(token, SECRET).shouldRenew).toBe(false);
  });
});

describe("buildSessionToken", () => {
  it("genera token verificable", () => {
    const { token, expiresAt } = buildSessionToken(SECRET, 60);
    const result = verifySession(token, SECRET);
    expect(result.valid).toBe(true);
    expect(result.expiresAt?.getTime()).toBe(expiresAt.getTime());
  });
});

describe("cookie headers", () => {
  it("buildSessionCookieHeader marca HttpOnly + Secure + SameSite", () => {
    const header = buildSessionCookieHeader("abc", { secure: true });
    expect(header).toContain(`${BLOG_ADMIN_COOKIE}=abc`);
    expect(header).toContain("HttpOnly");
    expect(header).toContain("Secure");
    expect(header).toContain("SameSite=Lax");
    expect(header).toContain("Path=/");
  });

  it("buildClearCookieHeader pone Max-Age=0", () => {
    const header = buildClearCookieHeader();
    expect(header).toContain("Max-Age=0");
  });
});
