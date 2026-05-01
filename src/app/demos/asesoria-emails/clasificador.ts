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

const PALABRAS_URGENTE = [
  "urgente",
  "vencimiento",
  "vence hoy",
  "embargo",
  "requerimiento",
  "sanción",
  "ultimo aviso",
  "último aviso",
];

export function clasificarEmail(email: EmailEntrada): ResultadoClasificacion {
  const textoCompleto = `${email.asunto} ${email.cuerpo}`.toLowerCase();
  const esUrgente = PALABRAS_URGENTE.some((p) => textoCompleto.includes(p));
  const carpetaTipo: Record<TipoDocumento, string> = {
    Factura: "01_Facturas",
    Nómina: "02_Nóminas",
    "Modelo 303": "03_Modelos/303",
    "Modelo 111": "03_Modelos/111",
    Contrato: "04_Contratos",
    "Justificante bancario": "05_Bancos",
    Otros: "99_Otros",
  };
  const destino = `/${email.pista.clienteSlug}/${carpetaTipo[email.pista.tipo]}/`;

  const pasos: PasoRazonamiento[] = [
    {
      etiqueta: "Lectura",
      texto: `Asunto: «${email.asunto}». Remitente: ${email.remitenteEmail}.`,
      duracionMs: 320,
    },
    {
      etiqueta: "Adjuntos",
      texto:
        email.adjuntos.length > 0
          ? `${email.adjuntos.length} adjunto${email.adjuntos.length > 1 ? "s" : ""}: ${email.adjuntos.map((a) => a.nombre).join(", ")}.`
          : "Sin adjuntos relevantes — cuerpo plano.",
      duracionMs: 280,
    },
    {
      etiqueta: "Tipo de documento",
      texto: `Identificado como «${email.pista.tipo}». ${email.pista.razon}.`,
      duracionMs: 380,
    },
    {
      etiqueta: "Cliente",
      texto: `Asociado a «${email.pista.clienteNombre}» (${email.pista.clienteSlug}).`,
      duracionMs: 260,
    },
    {
      etiqueta: "Renombrado",
      texto: `Nombre final: ${email.pista.nombreFinal}.`,
      duracionMs: 220,
    },
    {
      etiqueta: "Archivado",
      texto: `Movido a ${destino}${email.pista.nombreFinal}.`,
      duracionMs: 180,
    },
  ];

  return {
    tipo: email.pista.tipo,
    clienteSlug: email.pista.clienteSlug,
    clienteNombre: email.pista.clienteNombre,
    fechaDocumento: email.pista.fechaDocumento,
    confianza: email.pista.confianza,
    razon: email.pista.razon,
    nombreFinal: email.pista.nombreFinal,
    destino,
    esUrgente,
    pasos,
  };
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
