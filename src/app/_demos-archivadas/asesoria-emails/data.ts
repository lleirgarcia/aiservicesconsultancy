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
  },
  {
    id: "e6",
    remitenteNombre: "Movistar Empresas",
    remitenteEmail: "facturas@movistar.es",
    asunto: "Tu factura de abril — Bistró Mercè (línea 938XXXXXX)",
    cuerpo: "Adjuntamos factura del mes de abril 2026. Importe total 87,42 €.",
    fechaRecibido: haceMin(55),
    adjuntos: [{ nombre: "MOV-FRA-2026-04-A4421.pdf", tamano: "112 KB" }],
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
  },
  {
    id: "e8",
    remitenteNombre: "Aigua Vic",
    remitenteEmail: "facturacio@aiguavic.cat",
    asunto: "Factura abril — Fusteria Vidal",
    cuerpo: "Factura del subministrament d'aigua del taller corresponent al mes d'abril.",
    fechaRecibido: haceMin(96),
    adjuntos: [{ nombre: "aiguavic-fact-04-2026.pdf", tamano: "78 KB" }],
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
  },
  {
    id: "e10",
    remitenteNombre: "Naturgy Iberia",
    remitenteEmail: "facturas@naturgy.com",
    asunto: "Factura mensual — Constructora Roca (oficina)",
    cuerpo: "Adjuntamos factura del suministro de gas de la oficina central correspondiente al mes de abril.",
    fechaRecibido: haceMin(140),
    adjuntos: [{ nombre: "NAT-FAC-04-2026-15523.pdf", tamano: "146 KB" }],
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
  },
];
