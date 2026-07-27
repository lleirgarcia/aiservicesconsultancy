import { NextResponse } from "next/server";
import { enviarEmailDemo, type EnvioDemo } from "@/lib/gmail-smtp";

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<EnvioDemo>;

  if (!body.remitenteNombre || !body.asunto || !body.cuerpo) {
    return NextResponse.json(
      { error: "Faltan campos: remitenteNombre, asunto y cuerpo son obligatorios" },
      { status: 400 },
    );
  }

  try {
    await enviarEmailDemo({
      remitenteNombre: body.remitenteNombre,
      remitenteAlias: body.remitenteAlias ?? "",
      asunto: body.asunto,
      cuerpo: body.cuerpo,
      adjuntos: body.adjuntos ?? [],
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error enviando email de demo:", err);
    return NextResponse.json({ error: "No se pudo enviar el email" }, { status: 500 });
  }
}
