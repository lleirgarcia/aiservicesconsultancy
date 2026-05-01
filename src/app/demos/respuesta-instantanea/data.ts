export type Canal = "email" | "whatsapp" | "llamada" | "web";

export interface ContactoEntrante {
  id: string;
  canal: Canal;
  remitenteNombre: string;
  remitenteContacto: string;
  asunto: string;
  resumen: string;
  texto: string;
  recibidoEn: string;
  pista: {
    intencion: "presupuesto" | "soporte" | "comercial" | "informacion";
    urgencia: "alta" | "media" | "baja";
    palabrasClave: string[];
    respuestaIA: string;
    responsableAsignado: string;
    plantilla: string;
  };
}

const ahora = Date.now();
const haceMin = (m: number) => new Date(ahora - m * 60_000).toISOString();

export const RESPONSABLES = [
  { id: "marc", nombre: "Marc Puig", rol: "Comercial industrial" },
  { id: "anna", nombre: "Anna Soler", rol: "Comercial servicios" },
  { id: "joan", nombre: "Joan Vidal", rol: "Atención al cliente" },
];

export const CONTACTOS_INICIALES: ContactoEntrante[] = [
  {
    id: "k1",
    canal: "whatsapp",
    remitenteNombre: "Restaurant La Plaça",
    remitenteContacto: "+34 938 12 33 45",
    asunto: "Presupuesto reforma cocina industrial",
    resumen: "Solicita presupuesto para reforma de cocina industrial este verano.",
    texto:
      "Bona tarda, voldria un pressupost per a la reforma de la cuina del restaurant. Necessitem un canvi de campana, terra antilliscant i nova instal·lació elèctrica. Disponibilitat per visita aquesta setmana?",
    recibidoEn: haceMin(2),
    pista: {
      intencion: "presupuesto",
      urgencia: "alta",
      palabrasClave: ["pressupost", "reforma", "cuina", "visita"],
      respuestaIA:
        "Hola! Gràcies pel missatge. He registrat la vostra petició de pressupost per a la reforma de la cuina industrial (campana, terra i instal·lació elèctrica). En menys d'1 hora us trucarà en Marc per concretar la visita aquesta setmana.",
      responsableAsignado: "marc",
      plantilla: "presupuesto_obra",
    },
  },
  {
    id: "k2",
    canal: "email",
    remitenteNombre: "Núria Bosch",
    remitenteContacto: "nuria@boschconsultores.cat",
    asunto: "Información sobre vuestros servicios de mantenimiento",
    resumen: "Pide info general sobre planes de mantenimiento mensual.",
    texto:
      "Buenos días, nos han recomendado vuestros servicios. Tenemos una nave de 800 m² y querríamos saber qué planes de mantenimiento ofrecéis y vuestras tarifas mensuales. Gracias.",
    recibidoEn: haceMin(8),
    pista: {
      intencion: "informacion",
      urgencia: "media",
      palabrasClave: ["mantenimiento", "nave", "tarifas"],
      respuestaIA:
        "Hola Núria, gracias por escribirnos. He registrado tu consulta sobre planes de mantenimiento para nave industrial. Te respondemos hoy mismo con un dossier de tarifas y casos similares. Para acelerar, ¿podrías indicarnos el sector de actividad y el horario de operación?",
      responsableAsignado: "anna",
      plantilla: "info_mantenimiento",
    },
  },
  {
    id: "k3",
    canal: "llamada",
    remitenteNombre: "Llamada perdida",
    remitenteContacto: "+34 932 41 88 09",
    asunto: "Llamada no contestada",
    resumen: "Llamada perdida de 2:14. Número no registrado.",
    texto:
      "Llamada entrante no contestada. Duración: 14 segundos. Número no aparece en CRM. Geolocalización: Barcelona ciudad.",
    recibidoEn: haceMin(14),
    pista: {
      intencion: "comercial",
      urgencia: "alta",
      palabrasClave: ["llamada", "perdida", "no registrado"],
      respuestaIA:
        "Hola, hemos visto vuestra llamada perdida de hace unos minutos al 938 02 14 56. Soy el asistente de Kroomix. Si nos decís brevemente qué necesitáis (presupuesto, soporte, info comercial), os derivamos al instante con la persona adecuada. Si preferís que os llamemos, contestad con la palabra «llamadme» y un horario.",
      responsableAsignado: "marc",
      plantilla: "llamada_perdida_sms",
    },
  },
  {
    id: "k4",
    canal: "web",
    remitenteNombre: "Formulario web",
    remitenteContacto: "lluis.farre@industrialesvic.cat",
    asunto: "Cotización maquinaria de envasado",
    resumen: "Lead web de empresa industrial. Pide cotización urgente.",
    texto:
      "Empresa: Industriales Vic SLU. Necesitamos cotización para 2 líneas de envasado automático. Plazo: decisión antes del 15 de mayo. Volumen anual estimado: 1,8 M€.",
    recibidoEn: haceMin(22),
    pista: {
      intencion: "presupuesto",
      urgencia: "alta",
      palabrasClave: ["cotización", "envasado", "plazo", "volumen"],
      respuestaIA:
        "Buenos días, hemos recibido vuestra solicitud de cotización para 2 líneas de envasado. Dado el plazo (decisión antes del 15 de mayo) y el volumen, os asignamos a Marc, nuestro comercial industrial sénior. Os contacta hoy mismo con una propuesta inicial. Si necesitáis adelantar la conversación, este es su WhatsApp directo: +34 622 11 33 44.",
      responsableAsignado: "marc",
      plantilla: "lead_industrial_alto",
    },
  },
  {
    id: "k5",
    canal: "whatsapp",
    remitenteNombre: "Forn Pa de Pagès",
    remitenteContacto: "+34 938 88 12 09",
    asunto: "Consulta tarifa instalación cámara frío",
    resumen: "Cliente actual pregunta por tarifa adicional.",
    texto:
      "Hola Joan, em podríeu dir què valdria afegir una cambra de fred més al magatzem? Una de mida mitjana, sense pressa.",
    recibidoEn: haceMin(40),
    pista: {
      intencion: "comercial",
      urgencia: "baja",
      palabrasClave: ["tarifa", "cambra fred", "sense pressa"],
      respuestaIA:
        "Hola! Gràcies per escriure'ns. He registrat la consulta sobre la cambra de fred mitjana. Com és una ampliació, en Joan us prepara un pressupost orientatiu i us el envia abans d'acabar la setmana. Si voleu accelerar, podem fer una visita de 20 minuts dimecres o dijous matí.",
      responsableAsignado: "joan",
      plantilla: "cliente_actual_ampliacion",
    },
  },
  {
    id: "k6",
    canal: "email",
    remitenteNombre: "Maria Camps",
    remitenteContacto: "maria@constructoraroca.cat",
    asunto: "Avería bomba calor — urgente",
    resumen: "Cliente con incidencia activa, requiere intervención hoy.",
    texto:
      "Tenemos la bomba de calor de la oficina parada desde esta mañana. Hace 28 grados dentro. Necesitamos a alguien hoy mismo si es posible. Es urgente.",
    recibidoEn: haceMin(58),
    pista: {
      intencion: "soporte",
      urgencia: "alta",
      palabrasClave: ["avería", "urgente", "hoy mismo"],
      respuestaIA:
        "Hola Maria, recibido. He marcado el ticket como urgente y notificado a Joan, nuestro responsable de soporte técnico. Te llamamos en menos de 15 minutos para coordinar la intervención de hoy mismo. Mientras tanto, ¿podrías confirmarnos si la avería afecta a toda la planta o sólo una zona?",
      responsableAsignado: "joan",
      plantilla: "soporte_urgente",
    },
  },
];
