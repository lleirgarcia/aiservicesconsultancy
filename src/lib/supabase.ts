import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(url, key);

export interface Lead {
  id?: string;
  nombre: string;
  empresa: string;
  tamano: string;
  email: string;
  telefono?: string;
  messages?: string[];
  created_at?: string;
  updated_at?: string;
}

export async function createLead(lead: Lead) {
  const { data, error } = await supabase.from('leads').insert([lead]).select();
  if (error) throw error;
  return data?.[0];
}

export async function updateLeadMessages(
  leadId: string,
  messages: string[]
) {
  const { data, error } = await supabase
    .from('leads')
    .update({ messages, updated_at: new Date().toISOString() })
    .eq('id', leadId)
    .select();
  if (error) throw error;
  return data?.[0];
}
