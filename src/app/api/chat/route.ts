import { NextRequest, NextResponse } from 'next/server';
import { createLead, updateLeadMessages } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

const client = new Anthropic();

interface MessagePayload {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: MessagePayload[];
  leadId?: string;
  isManualSave?: boolean;
}

async function loadKnowledgeBase() {
  const files = [
    'services.md',
    'ideal-clients.md',
    'pain-points.md',
    'case-studies.md',
    'faq.md',
    'limitations.md',
  ];

  const knowledge: Record<string, string> = {};
  const knowledgeDir = join(process.cwd(), 'src', 'knowledge');

  for (const file of files) {
    try {
      const content = readFileSync(join(knowledgeDir, file), 'utf-8');
      knowledge[file] = content;
    } catch {
      console.warn(`No se pudo cargar ${file}`);
    }
  }

  return Object.values(knowledge).join('\n\n---\n\n');
}

function messagesToTexts(messages: MessagePayload[]): string[] {
  return messages.map(msg => msg.content);
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, leadId, isManualSave } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un historial de mensajes' },
        { status: 400 }
      );
    }

    // Si es solo para guardar (isManualSave), guarda y retorna
    if (isManualSave) {
      try {
        const texts = messagesToTexts(messages);
        if (leadId) {
          await updateLeadMessages(leadId, texts);
        } else {
          const newLead = await createLead({
            nombre: 'Anónimo',
            empresa: 'Por especificar',
            tamano: 'Por especificar',
            email: 'sin-email@example.com',
            messages: texts,
          });
          return NextResponse.json({ leadId: newLead.id });
        }
        return NextResponse.json({ leadId });
      } catch (err) {
        console.warn('Error guardando chat:', err);
        return NextResponse.json({ leadId });
      }
    }

    // Si no es solo para guardar, generar respuesta del agente
    let finalLeadId = leadId;

    const knowledgeBase = await loadKnowledgeBase();

    const encoder = new TextEncoder();
    let buffer = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await client.messages.create({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 1024,
            stream: true,
            system: `Eres Kromi, el asistente de Kroomix. Tu objetivo es entender el negocio del usuario y proponer soluciones que mejoren su eficiencia operativa en 2 minutos.

${knowledgeBase}

Sé empático, haz preguntas específicas sobre su operativa actual, e identifica oportunidades de mejora. Mantén el tono profesional y enfocado en valor. Si tienes suficiente información para hacer una propuesta, cierra la conversación con "<<CONV_END>>" al final.`,
            messages: messages,
          });

          for await (const event of response) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const text = event.delta.text;
              buffer += text;
              controller.enqueue(encoder.encode(text));
            }
          }

          // Guardar en BD después de recibir respuesta
          const finalMessages = [
            ...messages,
            {
              role: 'assistant' as const,
              content: buffer,
            },
          ];

          try {
            const texts = messagesToTexts(finalMessages);
            if (finalLeadId) {
              await updateLeadMessages(finalLeadId, texts);
            } else {
              const newLead = await createLead({
                nombre: 'Anónimo',
                empresa: 'Por especificar',
                tamano: 'Por especificar',
                email: 'sin-email@example.com',
                messages: texts,
              });
              finalLeadId = newLead.id;
            }
          } catch (err) {
            console.warn('Error guardando en BD:', err);
          }

          controller.close();
        } catch (error) {
          console.error('Error en API chat:', error);
          const errorMsg = error instanceof Error ? error.message : 'Error interno';
          controller.enqueue(encoder.encode(`\n\nError: ${errorMsg}`));
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error en API chat:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
