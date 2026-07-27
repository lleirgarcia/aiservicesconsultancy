import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { esEscenarioValido } from "@/app/demos/asesoria-emails/escenario";

const client = new Anthropic();

const SYSTEM_PROMPT = `Eres el asistente de Kroomix que prepara escenarios para una demo comercial de "bandeja de correo inteligente con IA". El comercial de Kroomix te describe una empresa prospecto (a quién le va a enseñar la demo) y tú generas un escenario a medida: la empresa ficticia, cómo archiva su documentación y 5 emails de ejemplo del día a día de ESA empresa.

Cómo trabajar:
- Si el comercial ya te ha dado suficiente información (nombre de la empresa y a qué se dedica), genera el escenario directamente. No hagas preguntas innecesarias.
- Si falta lo esencial, haz UNA sola pregunta corta y concreta.
- Cuando el comercial pida cambios sobre un escenario ya generado, devuelve el escenario COMPLETO corregido (no solo el cambio).
- Habla en español de España, tono directo y profesional.

Reglas del escenario:
- "clientes" son las entidades por las que la empresa archiva (sus clientes, proveedores, obras, tiendas… lo que tenga más sentido para ese negocio). Entre 4 y 6, con nombres verosímiles del sector, slugs en kebab-case.
- "carpetasLabel" acorde ("Carpetas de proveedor", "Carpetas de obra"…).
- "tipos": entre 5 y 7 tipos de documento propios del sector (pedido, albarán, oferta, reclamación, factura…), cada uno con carpeta estilo "01_Pedidos", "02_Albaranes"… La última debe ser siempre {"tipo":"Otros","carpeta":"99_Otros"}.
- "emails": exactamente 5, variados (distintos remitentes, distintos tipos de documento, uno de ellos con tono urgente). Cuerpos cortos y realistas, como los escribiría un proveedor o cliente real de ese sector, con importes, referencias y fechas creíbles. Cada email con 1 adjunto PDF de nombre verosímil y un "contenido" de 1-2 frases que resuma qué habría dentro del documento.
- "remitenteAlias": solo [a-z0-9-], corto, derivado del remitente.
- "contextoNegocio": 2-3 frases describiendo la empresa y qué correo recibe. Se usará como contexto del clasificador IA.
- "titular" y "subtitulo": textos para la cabecera de la demo, mencionando el nombre de la empresa. El subtítulo explica en 1-2 frases qué va a ver el cliente al pulsar "Procesar todo".
- ids de emails: "p1".."p5". "etiqueta": descripción de 2-4 palabras del email.

Responde SIEMPRE y ÚNICAMENTE con JSON válido, sin markdown ni texto fuera del JSON:
{
  "respuesta": "<mensaje breve para el comercial: qué has generado o qué necesitas saber>",
  "escenario": null | {
    "nombre": "<nombre de la empresa prospecto>",
    "contextoNegocio": "...",
    "titular": "...",
    "subtitulo": "...",
    "carpetasLabel": "...",
    "clientes": [{ "slug": "...", "nombre": "..." }],
    "tipos": [{ "tipo": "...", "carpeta": "..." }],
    "emails": [
      {
        "id": "p1",
        "etiqueta": "...",
        "remitenteNombre": "...",
        "remitenteAlias": "...",
        "asunto": "...",
        "cuerpo": "...",
        "adjuntos": [{ "nombre": "documento.pdf", "contenido": "..." }]
      }
    ]
  }
}

"escenario" es null solo cuando aún necesitas información. En cuanto puedas, genera.`;

interface MensajeChat {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: MensajeChat[] };

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Faltan mensajes" }, { status: 400 });
  }

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: [
        {
          type: "text",
          text: `${SYSTEM_PROMPT}\n\nFecha actual: ${new Date().toISOString().slice(0, 10)}. Las fechas, referencias e importes de los emails deben ser coherentes con esta fecha (días o semanas recientes).`,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    const json = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(json);

    const escenario = esEscenarioValido(parsed.escenario) ? parsed.escenario : null;

    return NextResponse.json({
      respuesta: typeof parsed.respuesta === "string" ? parsed.respuesta : "",
      escenario,
    });
  } catch (err) {
    console.error("Error generando escenario:", err);
    return NextResponse.json({ error: "Error al generar el escenario" }, { status: 500 });
  }
}
