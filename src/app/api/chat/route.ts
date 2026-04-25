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

    // Generar respuesta del agente
    let finalLeadId = leadId;
    const knowledgeBase = await loadKnowledgeBase();

    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `Eres Kromi, el asistente de Kroomix. Tu objetivo es entender el negocio del usuario y proponer soluciones que mejoren su eficiencia operativa en 2 minutos.

${knowledgeBase}

Sé empático, haz preguntas específicas sobre su operativa actual, e identifica oportunidades de mejora. Mantén el tono profesional y enfocado en valor. Si tienes suficiente información para hacer una propuesta, cierra la conversación con "<<CONV_END>>" al final.`,
        messages: messages,
      });

      const assistantMessage = response.content[0];
      if (assistantMessage.type !== 'text') {
        throw new Error('Respuesta inesperada de Claude');
      }

      // Guardar en BD
      const finalMessages = [
        ...messages,
        {
          role: 'assistant' as const,
          content: assistantMessage.text,
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

      return NextResponse.json({
        message: assistantMessage.text,
        leadId: finalLeadId,
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
