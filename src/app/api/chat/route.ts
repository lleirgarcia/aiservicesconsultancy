import { NextRequest, NextResponse } from 'next/server';
import { createLead, updateLeadMessages } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';
import { getChatSystemInstruction } from '@/i18n/loadChatSystem';

const client = new Anthropic();

// Log de diagnóstico al cargar el módulo
console.log('[CHAT API] ENV CHECK - SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL, '| SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY, '| ANTHROPIC_KEY:', !!process.env.ANTHROPIC_API_KEY);

interface MessagePayload {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: MessagePayload[];
  leadId?: string;
  isManualSave?: boolean;
  /** BCP-47 / app locale: es | en | ca — controls the assistant system prompt language */
  locale?: string;
}

function messagesToTexts(messages: MessagePayload[]): string[] {
  return messages.map(msg => msg.content);
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, leadId, isManualSave, locale: rawLocale } = body;

    console.log('[CHAT API] Inicio - isManualSave:', isManualSave, 'leadId:', leadId);

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un historial de mensajes' },
        { status: 400 }
      );
    }

    // Si es solo para guardar (isManualSave), guarda y retorna
    if (isManualSave) {
      console.log('[CHAT API] Guardando manualmente');
      try {
        const texts = messagesToTexts(messages);
        if (leadId) {
          console.log('[CHAT API] Actualizando lead existente:', leadId);
          await updateLeadMessages(leadId, texts);
          console.log('[CHAT API] Lead actualizado exitosamente');
        } else {
          console.log('[CHAT API] Creando nuevo lead anónimo');
          const newLead = await createLead({
            nombre: 'Anónimo',
            empresa: 'Por especificar',
            tamano: 'Por especificar',
            email: 'sin-email@example.com',
            messages: texts,
          });
          console.log('[CHAT API] Nuevo lead creado:', newLead.id);
          return NextResponse.json({ leadId: newLead.id });
        }
        return NextResponse.json({ leadId });
      } catch (err) {
        console.error('[CHAT API] Error guardando chat:', err);
        return NextResponse.json({ leadId });
      }
    }

    // Generar respuesta del agente
    let finalLeadId = leadId;
    console.log('[CHAT API] Generando respuesta del agente');

    const system = getChatSystemInstruction(rawLocale);

    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system,
        messages: messages,
      });

      const assistantMessage = response.content[0];
      if (assistantMessage.type !== 'text') {
        throw new Error('Respuesta inesperada de Claude');
      }

      console.log('[CHAT API] Respuesta recibida, intentando guardar en BD');

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
        console.log('[CHAT API] Textos a guardar:', texts.length, 'mensajes');
        
        if (finalLeadId) {
          console.log('[CHAT API] Actualizando lead:', finalLeadId);
          await updateLeadMessages(finalLeadId, texts);
          console.log('[CHAT API] Lead actualizado exitosamente');
        } else {
          console.log('[CHAT API] Creando nuevo lead anónimo');
          const newLead = await createLead({
            nombre: 'Anónimo',
            empresa: 'Por especificar',
            tamano: 'Por especificar',
            email: 'sin-email@example.com',
            messages: texts,
          });
          finalLeadId = newLead.id;
          console.log('[CHAT API] Nuevo lead creado:', finalLeadId);
        }
      } catch (err) {
        console.error('[CHAT API] Error al guardar en BD:', err);
      }

      console.log('[CHAT API] Retornando respuesta con leadId:', finalLeadId);
      return NextResponse.json({
        message: assistantMessage.text,
        leadId: finalLeadId,
      });
    } catch (error) {
      console.error('[CHAT API] Error generando respuesta:', error);
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : 'Error interno del servidor',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[CHAT API] Error general:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
