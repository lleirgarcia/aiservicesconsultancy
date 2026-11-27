import { NextResponse } from "next/server";
import { COOKIE_DEMO } from "@/lib/demoAuth";

// Cierra la sesión de las demos: borra las dos cookies y vuelve al formulario. La plataforma de agentes llama aquí al pulsar «Salir».
export function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/demos/login", req.url));
  res.cookies.delete(COOKIE_DEMO);
  res.cookies.delete("kroomix_session");
  return res;
}
