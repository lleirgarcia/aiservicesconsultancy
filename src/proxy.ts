import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_DEMO, accesoActivo, sesionValida } from "@/lib/demoAuth";

// Blog desactivado: Google lo tenía indexado y fallaba. Devolvemos 410 (Gone)
// para que lo retire del índice. Para reactivarlo, poner a false.
const BLOG_DISABLED = true;

// Reenvío de /agentes-app/* al backend de agentes del VPS (en local lo resuelve el rewrite de next.config.ts).
function reenviarAgentes(req: NextRequest) {
  const destino = process.env.AGENTES_URL;
  if (!destino) return NextResponse.next();
  const headers = new Headers(req.headers);
  headers.delete("authorization"); // la contraseña de la demo no se la pasamos al backend
  const clave = process.env.AGENTES_SECRET;
  if (clave) headers.set("x-agentes-key", clave);
  // IP real del cliente para el registro de actividad del backend (en un rewrite, Vercel no conserva x-forwarded-for).
  const ip = (req.headers.get("x-vercel-forwarded-for") ?? req.headers.get("x-real-ip") ?? "").split(",")[0].trim();
  if (ip) {
    headers.set("x-forwarded-for", ip);
    headers.set("x-client-ip", ip);
  }
  const ruta = req.nextUrl.pathname.slice("/agentes-app".length);
  return NextResponse.rewrite(new URL(ruta + req.nextUrl.search, destino), { request: { headers } });
}

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path === "/blog" || path.startsWith("/blog/") || path.startsWith("/api/blog")) {
    if (BLOG_DISABLED) {
      return new NextResponse("Esta página ya no existe.", {
        status: 410,
        headers: { "X-Robots-Tag": "noindex", "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    return NextResponse.next();
  }

  // Demos: sesión por cookie (ver src/lib/demoAuth.ts). Sin DEMO_PASSWORD (local) queda abierto.
  const esApi = path.startsWith("/agentes-app/");
  const abierto = path === "/demos/login" || !accesoActivo();
  const ok = abierto || (await sesionValida(req.cookies.get(COOKIE_DEMO)?.value));
  if (ok) return esApi ? reenviarAgentes(req) : NextResponse.next();

  // Sin sesión: la API contesta 401 (sin diálogo del navegador) y las páginas llevan al formulario.
  if (esApi) {
    return NextResponse.json({ detail: { code: "unauthorized", message: "Sesión no iniciada." } }, { status: 401 });
  }
  const login = new URL("/demos/login", req.url);
  if (path !== "/demos" && path !== "/demos/") login.searchParams.set("next", path + req.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/blog",
    "/blog/:path*",
    "/api/blog/:path*",
    "/demos",
    "/demos/:path*",
    "/agentes-app/:path*",
  ],
};
