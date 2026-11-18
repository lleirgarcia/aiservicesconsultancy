import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Blog desactivado: Google lo tenía indexado y fallaba. Devolvemos 410 (Gone)
// para que lo retire del índice. Para reactivarlo, poner a false.
const BLOG_DISABLED = true;

// Protege la demo de asesoría (páginas y API) con Basic Auth.
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
    "/demos/asesoria-emails/:path*",
    "/api/demos/asesoria-emails/:path*",
  ],
};
