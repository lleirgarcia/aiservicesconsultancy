import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Blog desactivado: Google lo tenía indexado y fallaba. Devolvemos 410 (Gone)
// para que lo retire del índice. Para reactivarlo, poner a false.
const BLOG_DISABLED = true;

// Basic Auth (DEMO_USER/DEMO_PASSWORD) para rutas protegidas; hoy ninguna: las demos antiguas están archivadas.
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

  // Demo de agentes: reenvía al backend (VPS) añadiendo la clave compartida. Ver agentes/README.md.
  if (path.startsWith("/agentes-app/")) {
    const destino = process.env.AGENTES_URL;
    const clave = process.env.AGENTES_SECRET;
    if (!destino) return NextResponse.next(); // local: lo resuelve el rewrite de next.config.ts
    const headers = new Headers(req.headers);
    if (clave) headers.set("x-agentes-key", clave);
    return NextResponse.rewrite(new URL(path.slice("/agentes-app".length) + req.nextUrl.search, destino), {
      request: { headers },
    });
  }

  const user = process.env.DEMO_USER ?? "";
  const pass = process.env.DEMO_PASSWORD ?? "";
  if (!pass) return NextResponse.next();

  const auth = req.headers.get("authorization") ?? "";
  if (auth.startsWith("Basic ")) {
    try {
      const decodificado = atob(auth.slice(6));
      const sep = decodificado.indexOf(":");
      const u = decodificado.slice(0, sep);
      const p = decodificado.slice(sep + 1);
      if (sep > -1 && u === user && p === pass) return NextResponse.next();
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
    "/agentes-app/:path*",
  ],
};
