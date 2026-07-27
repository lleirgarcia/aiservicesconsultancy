import { NextResponse } from "next/server";
import { listarEscenarios } from "@/lib/escenario-store";

export async function GET() {
  try {
    const escenarios = await listarEscenarios();
    return NextResponse.json(escenarios);
  } catch (err) {
    console.error("Error listando escenarios:", err);
    return NextResponse.json({ error: "No se pudieron listar los escenarios" }, { status: 500 });
  }
}
