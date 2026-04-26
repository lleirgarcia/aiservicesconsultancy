import { NextRequest, NextResponse } from 'next/server';
import { createLead, updateLeadMessages } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

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

const KNOWLEDGE_BASE = `# Servicios de FixTheOps

Automatizamos procesos manuales que consumen tiempo, integramos sistemas dispersos y proporcionamos visibilidad en tiempo real de operaciones.

## Páginas web que venden (Kroomix)

**No realizamos páginas webs al uso.** No realizamos páginas webs de hace 5 años. Creamos páginas webs adaptadas a las nuevas formas de consumo de la sociedad, utilizando las últimas tecnologías del mercado para convertir la máxima cantidad de usuarios en ventas.

Nuestras páginas web:
- Están diseñadas para transformar visitantes en clientes
- Se adaptan específicamente a tu modelo de negocio y público objetivo
- Utilizan las últimas tecnologías del mercado
- Están enfocadas en maximizar conversiones de usuarios a ventas
- Si no tienes ventas online, tu página web actual no funciona — la arreglamos

### Modelos de página

#### Página Profesional: 2.500€ - 4.000€
- Múltiples secciones, galería, formularios avanzados
- Integración email/WhatsApp
- SEO básico
- Diseño responsive

#### Página E-commerce: 4.500€ - 8.000€
- Carrito de compra, pasarela de pagos (Stripe/PayPal)
- Gestión de productos y categorías
- Historial de pedidos para clientes
- Integración con inventario

### Extras (precio adicional)

#### Chatbot automático: +800€ - 1.500€
Un chatbot automático que trabaja 24/7 por ti. Beneficios:
- Responde consultas inmediatamente, sin esperar a que llegues a la oficina
- Cierra leads automáticamente mientras tú duermes o atiiendes otros clientes
- Vende productos/servicios fuera de tu horario laboral
- Aumenta tus ventas capturando oportunidades que antes se perdían
- Transmite profesionalidad y confianza a potenciales clientes
- Tus clientes actuales se sienten valorados con respuestas al instante
- Se entrena con información de tu negocio para responder como lo harías tú

#### Sistema de suscripciones: +1.200€ - 2.000€
- Membresías/planes recurrentes para usuarios
- Acceso a contenido exclusivo o servicios
- Gestión de renovaciones automáticas
- Portal de usuario para gestionar suscripción

### Mantenimiento anual
- Página Profesional: 600€ - 900€
- Página E-commerce: 1.000€ - 1.500€
- + Chatbot: +300€ - 500€
- + Suscripciones: +400€ - 600€
(Incluye: hosting, SSL, backups, seguridad, actualizaciones, soporte técnico, monitoreo)

## Clientes ideales
Empresas pequeñas y medianas (10-500 empleados) en: servicios profesionales, distribución, construcción, transporte, RRHH, manufactura.

## Problemas que resolvemos
- Pérdida de tiempo en tareas repetitivas
- Herramientas que no se comunican entre sí
- Errores por entrada manual de datos
- Falta de visibilidad sobre operaciones
- Costes elevados por ineficiencias

## Limitaciones importantes
- Si no generas ventas online, tu página web actual no funciona
- Requiere documentación clara de procesos actuales
- Algunos procesos pueden necesitar redefinición para automatizar bien`;

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

    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `Eres Kromi, el asistente de Kroomix. Tu objetivo es entender el negocio del usuario y proponer soluciones que mejoren su eficiencia operativa en 2 minutos.

${KNOWLEDGE_BASE}

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
