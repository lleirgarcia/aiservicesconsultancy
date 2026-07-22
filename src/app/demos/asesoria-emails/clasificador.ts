import type { EmailEntrada, TipoDocumento } from "./data";

export interface PasoRazonamiento {
  etiqueta: string;
  texto: string;
  duracionMs: number;
}

export interface ResultadoClasificacion {
  tipo: TipoDocumento;
  clienteSlug: string;
  clienteNombre: string;
  fechaDocumento?: string;
  confianza: number;
  razon: string;
  nombreFinal: string;
  destino: string;
  esUrgente: boolean;
  pasos: PasoRazonamiento[];
}

export async function clasificarEmail(email: EmailEntrada): Promise<ResultadoClasificacion> {
  const res = await fetch("/api/demos/asesoria-emails/clasificar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(email),
  });
  if (!res.ok) throw new Error("Error al clasificar el email");
  return res.json();
}

export function formatoHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function tiempoRelativo(iso: string): string {
  const ahora = Date.now();
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const diffMin = Math.max(1, Math.round((ahora - t) / 60_000));
  if (diffMin < 60) return `hace ${diffMin} min`;
  const horas = Math.round(diffMin / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.round(horas / 24);
  return `hace ${dias} d`;
}
