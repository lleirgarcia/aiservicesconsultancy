import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { EmailEntrada } from "../../../../demos/asesoria-emails/data";
import type { Escenario } from "../../../../demos/asesoria-emails/escenario";
import { obtenerEscenario } from "@/lib/escenario-store";

const client = new Anthropic();

const PASOS_ETIQUETAS = [
  "Lectura",
  "Adjuntos",
  "Tipo de documento",
  "Cliente",
  "Renombrado",
  "Archivado",
];

const PASOS_DURACION = [350, 280, 450, 300, 250, 200];

const PALABRAS_URGENTE = [
  "urgente", "vencimiento", "vence hoy", "embargo",
  "requerimiento", "sanción", "ultimo aviso", "último aviso",
];

function construirSystemPrompt(escenario: Escenario): string {
  const clientesStr = escenario.clientes.map((c) => `  - ${c.slug}: ${c.nombre}`).join("\n");
  const tiposStr = escenario.tipos.map((t) => t.tipo).join(", ");

  return `Eres el asistente de clasificación de documentos de "${escenario.nombre}". ${escenario.contextoNegocio}

Recibes emails entrantes, identificas el tipo de documento y la entidad a la que pertenecen, y propones cómo archivarlos.

Entidades registradas (usa exactamente estos slugs y nombres):
${clientesStr}

Tipos de documento válidos (usa exactamente estos valores): ${tiposStr}

Convención de nombres de archivo: YYYY-MM-DD_TipoDocumento_Remitente_Entidad.ext
Ejemplo: 2026-04-30_Factura_Endesa_GaratgePuig.pdf

Reglas:
- Si la entidad no está en la lista registrada, usa la más parecida y baja la confianza.
- Si el tipo no está claro, usa "Otros".
- La confianza refleja cuánto te fías de tu clasificación (0.0 = no sabes, 1.0 = certeza total).
- Los pasoTextos deben ser frases cortas (máx. 2 líneas), en presente, narrando qué observas o decides en ese paso. Sin tecnicismos, como si se lo explicaras al responsable de la empresa.

Responde ÚNICAMENTE con JSON válido, sin texto adicional ni bloques de código markdown:
{
  "tipo": "<tipo exacto de la lista>",
  "clienteSlug": "<slug exacto de la lista>",
  "clienteNombre": "<nombre exacto de la lista>",
  "fechaDocumento": "<YYYY-MM-DD si se puede inferir, sino null>",
  "confianza": <número entre 0.0 y 1.0>,
  "razon": "<una frase explicando la decisión principal>",
  "nombreFinal": "<nombre de archivo con extensión>",
  "pasoTextos": [
    "<Lectura: qué ves en el asunto y el remitente>",
    "<Adjuntos: qué archivos hay y qué indican, o que no hay adjuntos>",
    "<Tipo de documento: cómo llegas a identificarlo>",
    "<Cliente: cómo identificas a qué entidad pertenece>",
    "<Renombrado: cómo construyes el nombre final del archivo>",
    "<Archivado: en qué carpeta queda y por qué>"
  ]
}`;
}

export async function POST(req: Request) {
  const email: EmailEntrada = await req.json();

  const adjuntosStr =
    email.adjuntos.length > 0
      ? email.adjuntos.map((a) => `${a.nombre} (${a.tamano})`).join(", ")
      : "ninguno";

  const userPrompt = `Clasifica este email:

De: ${email.remitenteNombre} <${email.remitenteEmail}>
Asunto: ${email.asunto}
Recibido: ${email.fechaRecibido}
Adjuntos: ${adjuntosStr}

Cuerpo:
${email.cuerpo}`;

  try {
    const { escenario } = await obtenerEscenario();
    const carpetaPorTipo = new Map(escenario.tipos.map((t) => [t.tipo, t.carpeta]));

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: construirSystemPrompt(escenario),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    const json = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(json);

    const tipo = parsed.tipo as string;
    const clienteSlug = parsed.clienteSlug as string;
    const destino = `/${clienteSlug}/${carpetaPorTipo.get(tipo) ?? "99_Otros"}/`;

    const textoCompleto = `${email.asunto} ${email.cuerpo}`.toLowerCase();
    const esUrgente = PALABRAS_URGENTE.some((p) => textoCompleto.includes(p));

    const pasos = PASOS_ETIQUETAS.map((etiqueta, i) => ({
      etiqueta,
      texto: parsed.pasoTextos?.[i] ?? "",
      duracionMs: PASOS_DURACION[i],
    }));

    return NextResponse.json({
      tipo,
      clienteSlug,
      clienteNombre: parsed.clienteNombre,
      fechaDocumento: parsed.fechaDocumento && parsed.fechaDocumento !== "null"
        ? parsed.fechaDocumento
        : undefined,
      confianza: parsed.confianza,
      razon: parsed.razon,
      nombreFinal: parsed.nombreFinal,
      destino,
      esUrgente,
      pasos,
    });
  } catch (err) {
    console.error("Error clasificando email:", err);
    return NextResponse.json({ error: "Error al clasificar" }, { status: 500 });
  }
}
