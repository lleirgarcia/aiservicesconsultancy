import { NextResponse } from "next/server";
import { guardarBandeja } from "@/lib/escenario-store";

// Persiste el estado procesado de la bandeja del escenario activo.
// Body: { bandeja: {...} | null } — null borra el estado guardado.
export async function PUT(req: Request) {
  const body = await req.json();
  if (!("bandeja" in body)) {
    return NextResponse.json({ error: "Falta el campo bandeja" }, { status: 400 });
  }
  try {
    await guardarBandeja(body.bandeja ?? null);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error guardando bandeja:", err);
    return NextResponse.json({ error: "No se pudo guardar la bandeja" }, { status: 500 });
  }
}
