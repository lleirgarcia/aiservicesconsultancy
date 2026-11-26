import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
  const ruta = req.nextUrl.pathname.slice("/agentes-app".length);
  return NextResponse.rewrite(new URL(ruta + req.nextUrl.search, destino), { request: { headers } });
}

// Basic Auth (DEMO_USER/DEMO_PASSWORD) para /demos y /agentes-app (la API de la demo de agentes incluida).
// Si DEMO_PASSWORD no está definida, no se protege nada (desarrollo local).
export function proxy(req: NextRequest) {
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

  const user = process.env.DEMO_USER ?? "";
  const pass = process.env.DEMO_PASSWORD ?? "";
  if (!pass) return path.startsWith("/agentes-app/") ? reenviarAgentes(req) : NextResponse.next();

  const auth = req.headers.get("authorization") ?? "";
  if (auth.startsWith("Basic ")) {
    try {
      const decodificado = atob(auth.slice(6));
      const sep = decodificado.indexOf(":");
      const u = decodificado.slice(0, sep);
      const p = decodificado.slice(sep + 1);
      if (sep > -1 && u === user && p === pass) {
        return path.startsWith("/agentes-app/") ? reenviarAgentes(req) : NextResponse.next();
      }
    } catch {
      // Cabecera malformada: cae al 401.
    }
  }

  return new NextResponse("Autenticación requerida", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Demo Kroomix", charset="UTF-8"' },
  });
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
