import { NextResponse } from "next/server";
import { esEscenarioValido } from "@/app/demos/asesoria-emails/escenario";
import {
  desactivarEscenario,
  guardarEscenario,
  obtenerEscenario,
} from "@/lib/escenario-store";

export async function GET() {
  try {
    const activo = await obtenerEscenario();
    return NextResponse.json(activo);
  } catch (err) {
    console.error("Error leyendo escenario:", err);
    return NextResponse.json({ error: "No se pudo leer el escenario" }, { status: 500 });
  }
}

// Guarda el escenario en la biblioteca y lo activa. Body: el escenario;
// opcionalmente ?id=<uuid> para actualizar uno existente en vez de crear.
export async function PUT(req: Request) {
  const body = await req.json();
  if (!esEscenarioValido(body)) {
    return NextResponse.json({ error: "Escenario inválido" }, { status: 400 });
  }
  const id = new URL(req.url).searchParams.get("id") ?? undefined;
  try {
    const idGuardado = await guardarEscenario(body, id);
    return NextResponse.json({ ok: true, id: idGuardado });
  } catch (err) {
    console.error("Error guardando escenario:", err);
    return NextResponse.json({ error: "No se pudo guardar el escenario" }, { status: 500 });
  }
}

// Desactiva el escenario actual (vuelve al de defecto). No borra nada.
export async function DELETE() {
  try {
    await desactivarEscenario();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error desactivando escenario:", err);
    return NextResponse.json({ error: "No se pudo restaurar el escenario" }, { status: 500 });
  }
}
