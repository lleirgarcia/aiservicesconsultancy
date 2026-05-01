export type TipoDocumento =
  | "Factura"
  | "Nómina"
  | "Modelo 303"
  | "Modelo 111"
  | "Contrato"
  | "Justificante bancario"
  | "Otros";

export interface Adjunto {
  nombre: string;
  tamano: string;
}

export interface EmailEntrada {
  id: string;
  remitenteNombre: string;
  remitenteEmail: string;
  asunto: string;
  cuerpo: string;
  fechaRecibido: string;
  adjuntos: Adjunto[];
  /** Datos "ground truth" usados por el clasificador heurístico. */
  pista: {
    tipo: TipoDocumento;
    clienteSlug: string;
    clienteNombre: string;
    fechaDocumento?: string;
    confianza: number;
    razon: string;
    nombreFinal: string;
  };
}

export const CLIENTES = [
  { slug: "garatge-puig", nombre: "Garatge Puig SL" },
  { slug: "bistro-merce", nombre: "Bistró Mercè" },
  { slug: "fusteria-vidal", nombre: "Fusteria Vidal" },
  { slug: "oliveres-vall", nombre: "Oliveres del Vall SCP" },
  { slug: "consultora-mas", nombre: "Consultora Mas" },
  { slug: "constructora-roca", nombre: "Constructora Roca" },
];

export const TIPOS_DOCUMENTO: TipoDocumento[] = [
  "Factura",
  "Nómina",
  "Modelo 303",
  "Modelo 111",
  "Contrato",
  "Justificante bancario",
  "Otros",
];

const ahora = Date.now();
const haceMin = (m: number) => new Date(ahora - m * 60_000).toISOString();

export const EMAILS_INICIALES: EmailEntrada[] = [
  {
    id: "e1",
    remitenteNombre: "Endesa Energía",
    remitenteEmail: "facturacion@endesaclientes.com",
    asunto: "Factura abril 2026 — Garatge Puig SL",
    cuerpo:
      "Estimado cliente, adjuntamos la factura del suministro eléctrico correspondiente al período del 01/04/2026 al 30/04/2026. Importe: 412,67 €. Vencimiento: 15/05/2026.",
    fechaRecibido: haceMin(2),
    adjuntos: [{ nombre: "ENDE-2026-04-G7821.pdf", tamano: "184 KB" }],
    pista: {
      tipo: "Factura",
      clienteSlug: "garatge-puig",
      clienteNombre: "Garatge Puig SL",
      fechaDocumento: "2026-04-30",
      confianza: 0.97,
      razon: "asunto contiene «factura abril» + cliente «Garatge Puig» + adjunto PDF de proveedor energético",
      nombreFinal: "2026-04-30_Factura_Endesa_GaratgePuig.pdf",
    },
  },
  {
    id: "e2",
    remitenteNombre: "Núria Soler",
    remitenteEmail: "nuria.soler@bistromerce.cat",
    asunto: "Nóminas abril — Bistró Mercè",
    cuerpo:
      "Hola, te paso las nóminas del mes de abril del equipo del bistró. Son 6 personas. Si necesitas algo más, dime.",
    fechaRecibido: haceMin(8),
    adjuntos: [
      { nombre: "nominas_abril_2026.zip", tamano: "412 KB" },
      { nombre: "resumen-coste.xlsx", tamano: "22 KB" },
    ],
    pista: {
      tipo: "Nómina",
      clienteSlug: "bistro-merce",
      clienteNombre: "Bistró Mercè",
      fechaDocumento: "2026-04-30",
      confianza: 0.94,
      razon: "asunto «nóminas abril» + remitente del cliente + zip con nombre «nominas_abril_2026»",
      nombreFinal: "2026-04-30_Nóminas_Abril_BistróMercè.zip",
    },
  },
  {
    id: "e3",
    remitenteNombre: "Agencia Tributaria",
    remitenteEmail: "no-reply@agenciatributaria.gob.es",
    asunto: "Modelo 303 1T 2026 — Confirmación de presentación — Fusteria Vidal",
    cuerpo:
      "Se confirma la presentación del modelo 303 correspondiente al primer trimestre de 2026. CSV: ABC1234567890. Resultado: a ingresar 2.184,30 €.",
    fechaRecibido: haceMin(15),
    adjuntos: [{ nombre: "303-1T2026-confirmacion.pdf", tamano: "78 KB" }],
    pista: {
      tipo: "Modelo 303",
      clienteSlug: "fusteria-vidal",
      clienteNombre: "Fusteria Vidal",
      fechaDocumento: "2026-04-20",
      confianza: 0.99,
      razon: "remitente AEAT + asunto «modelo 303 1T» + cliente reconocido en cuerpo",
      nombreFinal: "2026-04-20_Modelo303_1T_FusteriaVidal.pdf",
    },
  },
  {
    id: "e4",
    remitenteNombre: "Mas i Vila advocats",
    remitenteEmail: "marc@masivila.cat",
    asunto: "Contrato laboral nuevo — Oliveres del Vall (revisión)",
    cuerpo:
      "Bon dia, us adjunto el contracte laboral del nou treballador d'Oliveres del Vall per a la vostra revisió. Comença l'1 de juny.",
    fechaRecibido: haceMin(28),
    adjuntos: [{ nombre: "contracte-oliveres-vall-jcm.docx", tamano: "92 KB" }],
    pista: {
      tipo: "Contrato",
      clienteSlug: "oliveres-vall",
      clienteNombre: "Oliveres del Vall SCP",
      fechaDocumento: "2026-06-01",
      confianza: 0.86,
      razon: "asunto «contrato laboral» + cliente identificado en asunto + adjunto .docx",
      nombreFinal: "2026-06-01_Contrato_Trabajador_OliveresVall.docx",
    },
  },
  {
    id: "e5",
    remitenteNombre: "BBVA Empresas",
    remitenteEmail: "extractos@bbva.es",
    asunto: "Justificante de transferencia — Constructora Roca",
    cuerpo:
      "Le confirmamos la transferencia emitida desde su cuenta. Importe: 14.250,00 €. Concepto: pago factura proveedor cementera marzo.",
    fechaRecibido: haceMin(41),
    adjuntos: [{ nombre: "transferencia-bbva-20260428.pdf", tamano: "56 KB" }],
    pista: {
      tipo: "Justificante bancario",
      clienteSlug: "constructora-roca",
      clienteNombre: "Constructora Roca",
      fechaDocumento: "2026-04-28",
      confianza: 0.92,
      razon: "remitente BBVA + asunto «justificante transferencia» + cliente en asunto",
      nombreFinal: "2026-04-28_Justificante_BBVA_ConstructoraRoca.pdf",
    },
  },
  {
    id: "e6",
    remitenteNombre: "Movistar Empresas",
    remitenteEmail: "facturas@movistar.es",
    asunto: "Tu factura de abril — Bistró Mercè (línea 938XXXXXX)",
    cuerpo: "Adjuntamos factura del mes de abril 2026. Importe total 87,42 €.",
    fechaRecibido: haceMin(55),
    adjuntos: [{ nombre: "MOV-FRA-2026-04-A4421.pdf", tamano: "112 KB" }],
    pista: {
      tipo: "Factura",
      clienteSlug: "bistro-merce",
      clienteNombre: "Bistró Mercè",
      fechaDocumento: "2026-04-30",
      confianza: 0.95,
      razon: "remitente Movistar + asunto «factura abril» + cliente reconocido",
      nombreFinal: "2026-04-30_Factura_Movistar_BistróMercè.pdf",
    },
  },
  {
    id: "e7",
    remitenteNombre: "Joan Pla",
    remitenteEmail: "joan@consultoramas.cat",
    asunto: "Modelo 111 1T2026",
    cuerpo:
      "Adjunto el justificante del modelo 111 del primer trimestre. Lo presenté ayer. Quedo atento por si hay que hacer algo más.",
    fechaRecibido: haceMin(72),
    adjuntos: [{ nombre: "111-1T2026.pdf", tamano: "64 KB" }],
    pista: {
      tipo: "Modelo 111",
      clienteSlug: "consultora-mas",
      clienteNombre: "Consultora Mas",
      fechaDocumento: "2026-04-19",
      confianza: 0.91,
      razon: "asunto «modelo 111 1T» + remitente del cliente + adjunto numérico coherente",
      nombreFinal: "2026-04-19_Modelo111_1T_ConsultoraMas.pdf",
    },
  },
  {
    id: "e8",
    remitenteNombre: "Aigua Vic",
    remitenteEmail: "facturacio@aiguavic.cat",
    asunto: "Factura abril — Fusteria Vidal",
    cuerpo: "Factura del subministrament d'aigua del taller corresponent al mes d'abril.",
    fechaRecibido: haceMin(96),
    adjuntos: [{ nombre: "aiguavic-fact-04-2026.pdf", tamano: "78 KB" }],
    pista: {
      tipo: "Factura",
      clienteSlug: "fusteria-vidal",
      clienteNombre: "Fusteria Vidal",
      fechaDocumento: "2026-04-30",
      confianza: 0.93,
      razon: "asunto «factura abril» + cliente identificado",
      nombreFinal: "2026-04-30_Factura_AiguaVic_FusteriaVidal.pdf",
    },
  },
  {
    id: "e9",
    remitenteNombre: "Asociación de Comerciantes",
    remitenteEmail: "info@comerciantsosona.cat",
    asunto: "Cena anual de socios — confirma asistencia",
    cuerpo:
      "Hola, te recordamos que el próximo 15 de mayo celebramos la cena anual. Confirma asistencia respondiendo a este correo.",
    fechaRecibido: haceMin(120),
    adjuntos: [],
    pista: {
      tipo: "Otros",
      clienteSlug: "consultora-mas",
      clienteNombre: "Consultora Mas",
      confianza: 0.42,
      razon: "no contiene palabras clave de documentación contable; sin adjuntos contables",
      nombreFinal: "Cena_anual_socios.eml",
    },
  },
  {
    id: "e10",
    remitenteNombre: "Naturgy Iberia",
    remitenteEmail: "facturas@naturgy.com",
    asunto: "Factura mensual — Constructora Roca (oficina)",
    cuerpo: "Adjuntamos factura del suministro de gas de la oficina central correspondiente al mes de abril.",
    fechaRecibido: haceMin(140),
    adjuntos: [{ nombre: "NAT-FAC-04-2026-15523.pdf", tamano: "146 KB" }],
    pista: {
      tipo: "Factura",
      clienteSlug: "constructora-roca",
      clienteNombre: "Constructora Roca",
      fechaDocumento: "2026-04-30",
      confianza: 0.96,
      razon: "remitente Naturgy + asunto «factura mensual» + cliente identificado",
      nombreFinal: "2026-04-30_Factura_Naturgy_ConstructoraRoca.pdf",
    },
  },
  {
    id: "e11",
    remitenteNombre: "Mar Garcia",
    remitenteEmail: "mar.garcia@oliveresdelvall.cat",
    asunto: "Nómina marzo — Oliveres del Vall",
    cuerpo:
      "Hola Anna, te paso la nómina del mes de marzo de la trabajadora que cobra fuera de plantilla. Avísame si lo recibes.",
    fechaRecibido: haceMin(165),
    adjuntos: [{ nombre: "nomina-marzo-2026.pdf", tamano: "62 KB" }],
    pista: {
      tipo: "Nómina",
      clienteSlug: "oliveres-vall",
      clienteNombre: "Oliveres del Vall SCP",
      fechaDocumento: "2026-03-31",
      confianza: 0.9,
      razon: "asunto «nómina marzo» + remitente del cliente + adjunto coherente",
      nombreFinal: "2026-03-31_Nómina_Marzo_OliveresVall.pdf",
    },
  },
  {
    id: "e12",
    remitenteNombre: "Llibreria Argus",
    remitenteEmail: "ventes@argus.cat",
    asunto: "Pressupost material oficina",
    cuerpo:
      "Bona tarda, us passem el pressupost del material d'oficina demanat. Si conformeu, ho preparem aquesta setmana.",
    fechaRecibido: haceMin(200),
    adjuntos: [{ nombre: "pressupost-material.pdf", tamano: "98 KB" }],
    pista: {
      tipo: "Otros",
      clienteSlug: "consultora-mas",
      clienteNombre: "Consultora Mas",
      confianza: 0.55,
      razon: "asunto «presupuesto material» — no es factura ni documento fiscal; clasificado como Otros",
      nombreFinal: "Pressupost_material_oficina.pdf",
    },
  },
];
