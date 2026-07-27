import { supabase } from "./supabase";
import {
  ESCENARIO_DEFECTO,
  esEscenarioValido,
  type Escenario,
} from "@/app/demos/asesoria-emails/escenario";

// Estado serializado de la bandeja procesada de un escenario. El shape lo
// define el cliente (BandejaInteligente); aquí es JSON opaco.
export type BandejaGuardada = Record<string, unknown>;

export interface EscenarioActivo {
  id: string | null;
  escenario: Escenario;
  bandeja: BandejaGuardada | null;
  porDefecto: boolean;
}

export interface EscenarioResumen {
  id: string;
  nombre: string;
  activo: boolean;
  updated_at: string;
}

// Devuelve el escenario activo de la biblioteca, o el de defecto si no hay.
export async function obtenerEscenario(): Promise<EscenarioActivo> {
  const { data, error } = await supabase
    .from("demo_escenarios")
    .select("id, data, bandeja")
    .eq("activo", true)
    .maybeSingle();

  if (error || !data || !esEscenarioValido(data.data)) {
    return { id: null, escenario: ESCENARIO_DEFECTO, bandeja: null, porDefecto: true };
  }
  return {
    id: data.id,
    escenario: data.data,
    bandeja: (data.bandeja as BandejaGuardada) ?? null,
    porDefecto: false,
  };
}

export async function listarEscenarios(): Promise<EscenarioResumen[]> {
  const { data, error } = await supabase
    .from("demo_escenarios")
    .select("id, nombre, activo, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function desactivarTodos(): Promise<void> {
  const { error } = await supabase
    .from("demo_escenarios")
    .update({ activo: false })
    .eq("activo", true);
  if (error) throw error;
}

// Guarda un escenario (nuevo o actualización) y lo deja activo. Devuelve su id.
export async function guardarEscenario(escenario: Escenario, id?: string): Promise<string> {
  await desactivarTodos();
  const fila = {
    nombre: escenario.nombre,
    data: escenario,
    activo: true,
    updated_at: new Date().toISOString(),
  };
  const query = id
    ? supabase.from("demo_escenarios").update(fila).eq("id", id).select("id").single()
    : supabase.from("demo_escenarios").insert(fila).select("id").single();
  const { data, error } = await query;
  if (error) throw error;
  return data.id;
}

export async function activarEscenario(id: string): Promise<void> {
  await desactivarTodos();
  const { error } = await supabase
    .from("demo_escenarios")
    .update({ activo: true, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// Vuelve al escenario por defecto: ninguna fila activa.
export async function desactivarEscenario(): Promise<void> {
  await desactivarTodos();
}

export async function eliminarEscenario(id: string): Promise<void> {
  const { error } = await supabase.from("demo_escenarios").delete().eq("id", id);
  if (error) throw error;
}

// Persiste la bandeja procesada del escenario activo. Si el activo es el de
// defecto (sin fila), lo materializa como fila para poder guardar su estado.
export async function guardarBandeja(bandeja: BandejaGuardada | null): Promise<void> {
  const activo = await obtenerEscenario();
  if (activo.id) {
    const { error } = await supabase
      .from("demo_escenarios")
      .update({ bandeja, updated_at: new Date().toISOString() })
      .eq("id", activo.id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("demo_escenarios").insert({
    nombre: ESCENARIO_DEFECTO.nombre,
    data: ESCENARIO_DEFECTO,
    bandeja,
    activo: true,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
