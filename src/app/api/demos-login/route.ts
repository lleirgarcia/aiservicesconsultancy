import { NextResponse } from "next/server";
import { COOKIE_DEMO, DURACION_SESION_S, credencialesValidas, crearSesion } from "@/lib/demoAuth";

// Inicio de sesión de las demos. Ver src/lib/demoAuth.ts y docs/API.md.
export async function POST(req: Request) {
  const cuerpo = await req.json().catch(() => null);
  const usuario = typeof cuerpo?.usuario === "string" ? cuerpo.usuario : "";
  const contrasena = typeof cuerpo?.contrasena === "string" ? cuerpo.contrasena : "";

  if (!credencialesValidas(usuario, contrasena)) {
    await new Promise((r) => setTimeout(r, 800)); // frena la fuerza bruta
    return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_DEMO, await crearSesion(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SESION_S,
  });
  return res;
}
