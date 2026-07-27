export interface EmailPredefinido {
  id: string;
  etiqueta: string;
  remitenteNombre: string;
  remitenteAlias: string;
  asunto: string;
  cuerpo: string;
  // contenido: texto breve que se imprime dentro del PDF de relleno.
  adjuntos: { nombre: string; contenido?: string }[];
}

export const EMAILS_PREDEFINIDOS: EmailPredefinido[] = [
  {
    id: "p1",
    etiqueta: "Factura de suministro",
    remitenteNombre: "Endesa Energía",
    remitenteAlias: "endesa",
    asunto: "Factura abril 2026 — Garatge Puig SL",
    cuerpo:
      "Estimado cliente, adjuntamos la factura del suministro eléctrico correspondiente al período del 01/04/2026 al 30/04/2026. Importe: 412,67 €. Vencimiento: 15/05/2026.",
    adjuntos: [{ nombre: "ENDE-2026-04-G7821.pdf" }],
  },
  {
    id: "p2",
    etiqueta: "Nóminas de un cliente",
    remitenteNombre: "Núria Soler",
    remitenteAlias: "bistromerce",
    asunto: "Nóminas abril — Bistró Mercè",
    cuerpo:
      "Hola, te paso las nóminas del mes de abril del equipo del bistró. Son 6 personas. Si necesitas algo más, dime.",
    adjuntos: [{ nombre: "nominas_abril_2026.pdf" }],
  },
  {
    id: "p3",
    etiqueta: "Modelo 303 presentado",
    remitenteNombre: "Agencia Tributaria",
    remitenteAlias: "aeat",
    asunto: "Modelo 303 1T 2026 — Confirmación de presentación — Fusteria Vidal",
    cuerpo:
      "Se confirma la presentación del modelo 303 correspondiente al primer trimestre de 2026. CSV: ABC1234567890. Resultado: a ingresar 2.184,30 €.",
    adjuntos: [{ nombre: "303-1T2026-confirmacion.pdf" }],
  },
  {
    id: "p4",
    etiqueta: "Contrato para revisar",
    remitenteNombre: "Mas i Vila advocats",
    remitenteAlias: "masivila",
    asunto: "Contrato laboral nuevo — Oliveres del Vall (revisión)",
    cuerpo:
      "Bon dia, us adjunto el contracte laboral del nou treballador d'Oliveres del Vall per a la vostra revisió. Comença l'1 de juny.",
    adjuntos: [{ nombre: "contracte-oliveres-vall-jcm.pdf" }],
  },
  {
    id: "p5",
    etiqueta: "Justificante bancario urgente",
    remitenteNombre: "BBVA Empresas",
    remitenteAlias: "bbva",
    asunto: "URGENTE — Justificante de transferencia — Constructora Roca",
    cuerpo:
      "Le confirmamos la transferencia emitida desde su cuenta. Importe: 14.250,00 €. Concepto: pago factura proveedor cementera marzo. Vencimiento del pago asociado: hoy.",
    adjuntos: [{ nombre: "transferencia-bbva-20260428.pdf" }],
  },
];
