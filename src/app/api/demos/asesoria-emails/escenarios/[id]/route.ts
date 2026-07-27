import { NextResponse } from "next/server";
import { activarEscenario, eliminarEscenario } from "@/lib/escenario-store";

interface Ctx {
  params: Promise<{ id: string }>;
}

// Activa este escenario guardado (desactiva el resto).
export async function PATCH(_req: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    await activarEscenario(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error activando escenario:", err);
    return NextResponse.json({ error: "No se pudo activar el escenario" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    await eliminarEscenario(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error eliminando escenario:", err);
    return NextResponse.json({ error: "No se pudo eliminar el escenario" }, { status: 500 });
  }
}
