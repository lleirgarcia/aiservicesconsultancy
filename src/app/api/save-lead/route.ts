import { NextRequest, NextResponse } from 'next/server';
import { createLead } from '@/lib/supabase';

interface MessagePayload {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messages: MessagePayload[] = body.messages || [];

    if (!messages.length) {
      return NextResponse.json({ success: true });
    }

    const combinedText = messages.map(m => m.content).join('\n').toLowerCase();
    
    const emailMatch = combinedText.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    const email = emailMatch?.[0];

    if (email) {
      const nameMatch = messages.find(m => m.role === 'user' && m.content.length < 100);
      const nombre = nameMatch?.content.split('\n')[0].trim() || 'Sin nombre';
      
      try {
        await createLead({
          nombre,
          empresa: 'Por especificar',
          tamano: 'Por especificar',
          email,
          messages: messages.map((msg) => msg.content),
        });
      } catch (err) {
        console.warn('No se pudo crear lead:', err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en API save-lead:', error);
    return NextResponse.json({ success: true });
  }
}
