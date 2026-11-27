import { NextResponse } from "next/server";
import { COOKIE_DEMO, DURACION_SESION_S, crearSesion } from "@/lib/demoAuth";

// Inicio de sesión de las demos. Los usuarios (uno por cliente) viven en el backend de agentes, que además registra
// su actividad: aquí solo se le pasa la contraseña, y si la acepta se emiten las dos cookies (la de la web y la del backend).
// Ver src/lib/demoAuth.ts y docs/API.md.
const COOKIE_AGENTES = "kroomix_session";

const agentesUrl = () => process.env.AGENTES_URL ?? `http://127.0.0.1:${Number(process.env.BASE_PORT ?? 5520) + 1}`;

export async function POST(req: Request) {
  const cuerpo = await req.json().catch(() => null);
  const usuario = typeof cuerpo?.usuario === "string" ? cuerpo.usuario.trim() : "";
  const contrasena = typeof cuerpo?.contrasena === "string" ? cuerpo.contrasena.trim() : "";
  if (!usuario || !contrasena) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": req.headers.get("user-agent") ?? "",
  };
  const ip = (req.headers.get("x-vercel-forwarded-for") ?? req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  if (ip) headers["X-Forwarded-For"] = ip; // el backend registra la IP real del cliente, no la de Vercel
  if (process.env.AGENTES_SECRET) headers["x-agentes-key"] = process.env.AGENTES_SECRET;

  let respuesta: Response;
  try {
    respuesta = await fetch(`${agentesUrl()}/api/auth/login`, {
      method: "POST",
      headers,
      body: JSON.stringify({ username: usuario, password: contrasena }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return NextResponse.json({ error: "No se ha podido conectar con el servidor de la demo. Inténtalo en un minuto." }, { status: 502 });
  }

  if (respuesta.status === 429) {
    return NextResponse.json({ error: "Demasiados intentos. Espera unos minutos." }, { status: 429 });
  }
  const token = respuesta.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .find((c) => c.startsWith(`${COOKIE_AGENTES}=`))
    ?.slice(COOKIE_AGENTES.length + 1);
  if (!respuesta.ok || !token) {
    await new Promise((r) => setTimeout(r, 800)); // frena la fuerza bruta
    const credenciales = respuesta.status === 401 && !token;
    return NextResponse.json(
      { error: credenciales ? "Usuario o contraseña incorrectos." : "No se ha podido iniciar sesión." },
      { status: credenciales ? 401 : 502 },
    );
  }

  const opciones = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: DURACION_SESION_S };
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_DEMO, await crearSesion(), opciones);
  res.cookies.set(COOKIE_AGENTES, token, opciones);
  return res;
}
