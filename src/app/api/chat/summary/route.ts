import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

interface MessagePayload {
  role: 'user' | 'assistant';
  content: string;
}

interface SummaryRequest {
  messages: MessagePayload[];
  /** BCP-47 / app locale: es | en | ca — idioma del resumen */
  locale?: string;
}

const LANG_NAME: Record<string, string> = {
  es: 'español',
  ca: 'catalán',
  en: 'inglés',
};

export async function POST(request: NextRequest) {
  try {
    const body: SummaryRequest = await request.json();
    const { messages, locale } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un historial de mensajes' },
        { status: 400 }
      );
    }

    const lang = LANG_NAME[locale ?? 'es'] ?? LANG_NAME.es;

    const transcript = messages
      .map((m) => `${m.role === 'user' ? 'Cliente' : 'Kromi'}: ${m.content}`)
      .join('\n');

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: `Resumes conversaciones entre un potencial cliente y Kromi, el asistente de la web de Kroomix, para que el cliente las envíe por WhatsApp a Kroomix.

Escribe en primera persona como si fueras el cliente (ej.: "Tengo una empresa de metales, entramos unos 30 pedidos al día a mano por WhatsApp y email…").
- Máximo 4-5 líneas, texto plano sin markdown ni emojis.
- Incluye solo lo relevante: a qué se dedica, el problema, datos concretos (volúmenes, herramientas) y qué solución se comentó, si se comentó.
- No inventes nada que no esté en la conversación.
- Escribe el resumen en ${lang}.
Devuelve SOLO el resumen, sin encabezados ni comillas.`,
      messages: [{ role: 'user', content: transcript }],
    });

    const block = response.content[0];
    if (block.type !== 'text') {
      throw new Error('Respuesta inesperada de Claude');
    }

    return NextResponse.json({ summary: block.text.trim() });
  } catch (err) {
    console.error('[CHAT SUMMARY API] Error:', err);
    return NextResponse.json(
      { error: 'No se pudo generar el resumen' },
      { status: 500 }
    );
  }
}
