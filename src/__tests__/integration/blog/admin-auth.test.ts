/**
 * @jest-environment node
 */
import { POST, DELETE, GET } from "@/app/api/blog/auth/route";
import { NextRequest } from "next/server";

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = {
    ...ORIGINAL_ENV,
    BLOG_ADMIN_PASSWORD: "test-password",
    BLOG_ADMIN_SESSION_SECRET: "a".repeat(64),
    NODE_ENV: "test",
  };
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

function makeRequest(body: unknown, ip = "127.0.0.1") {
  return new NextRequest("http://localhost/api/blog/auth", {
    method: "POST",
    headers: { "x-forwarded-for": ip, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/blog/auth", () => {
  it("acepta password correcta y devuelve cookie + expiresAt", async () => {
    const res = await POST(makeRequest({ password: "test-password" }, "10.0.0.1"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.expiresAt).toEqual(expect.any(String));
    expect(res.headers.get("set-cookie")).toMatch(/blog_admin_session=/);
    expect(res.headers.get("set-cookie")).toMatch(/HttpOnly/);
  });

  it("rechaza password incorrecta con 401", async () => {
    const res = await POST(makeRequest({ password: "nope" }, "10.0.0.2"));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("invalid_password");
  });

  it("rechaza body sin password con 400", async () => {
    const res = await POST(makeRequest({}, "10.0.0.3"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("missing_password");
  });

  it("rate limita a la 6ª llamada por IP", async () => {
    const ip = "10.0.0.99";
    let lastStatus = 0;
    for (let i = 0; i < 6; i++) {
      const res = await POST(makeRequest({ password: "wrong" }, ip));
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });

  it("DELETE limpia la cookie", async () => {
    const res = await DELETE();
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toMatch(/Max-Age=0/);
  });

  it("GET devuelve authenticated:false sin cookie", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.authenticated).toBe(false);
  });
});
