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
  contactData?: {
    nombre?: string;
    empresa?: string;
    tamano?: string;
    email?: string;
    telefono?: string;
  };
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

function extractContactData(messages: MessagePayload[]): Partial<ChatRequest['contactData']> {
  const combinedText = messages.map(m => m.content).join('\n').toLowerCase();
  
  const data: Partial<ChatRequest['contactData']> = {};
  
  const emailMatch = combinedText.match(/[\w\.-]+@[\w\.-]+\.\w+/);
  if (emailMatch) data.email = emailMatch[0];
  
  const phoneMatch = combinedText.match(/(\+34|0034|34)?[\s-]?[679]\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}/);
  if (phoneMatch) data.telefono = phoneMatch[0].replace(/[\s-]/g, '');
  
  return data;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, leadId, contactData = {} } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un historial de mensajes' },
        { status: 400 }
      );
    }

    let finalLeadId = leadId;
    const extractedData = extractContactData(messages);
    const mergedData = { ...extractedData, ...contactData };

    if (!finalLeadId && mergedData.email && mergedData.nombre && mergedData.empresa && mergedData.tamano) {
      try {
        const lead = await createLead({
          nombre: mergedData.nombre,
          empresa: mergedData.empresa,
          tamano: mergedData.tamano,
          email: mergedData.email,
          telefono: mergedData.telefono,
          messages: messages.map((msg) => ({
            ...msg,
            timestamp: new Date().toISOString(),
          })),
        });
        finalLeadId = lead.id;
      } catch (err) {
        console.warn('No se pudo crear lead:', err);
      }
    }

    const knowledgeBase = await loadKnowledgeBase();

    const encoder = new TextEncoder();
    let buffer = '';
    let isFirstChunk = true;

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
              
              if (isFirstChunk) {
                isFirstChunk = false;
              }
              
              controller.enqueue(encoder.encode(text));
            }
          }

          if (finalLeadId && buffer.length > 0) {
            const updatedMessages = [
              ...messages,
              {
                role: 'assistant' as const,
                content: buffer,
                timestamp: new Date().toISOString(),
              },
            ];
            try {
              await updateLeadMessages(finalLeadId, updatedMessages);
            } catch (err) {
              console.warn('No se pudo actualizar lead:', err);
            }
          }

          if (!finalLeadId && mergedData.email && mergedData.nombre && mergedData.empresa && mergedData.tamano) {
            const lead = await createLead({
              nombre: mergedData.nombre,
              empresa: mergedData.empresa,
              tamano: mergedData.tamano,
              email: mergedData.email,
              telefono: mergedData.telefono,
              messages: [...messages, { role: 'assistant', content: buffer, timestamp: new Date().toISOString() }],
            });
            finalLeadId = lead.id;
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
