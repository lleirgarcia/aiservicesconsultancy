export type EstadoLead = "nuevo" | "contactado" | "calificado" | "propuesta" | "ganado" | "perdido";
export type CanalLead = "web" | "email" | "telefono" | "whatsapp" | "referido";

export interface Comercial {
  id: string;
  nombre: string;
  iniciales: string;
  capacidad: number; // leads/semana
}

export interface EventoLead {
  id: string;
  tipo: "creacion" | "asignacion" | "contacto" | "alerta" | "estado";
  texto: string;
  hace: string;
}

export interface Lead {
  id: string;
  nombre: string;
  empresa: string;
  contacto: string;
  canal: CanalLead;
  asunto: string;
  importeEstimado: number;
  estado: EstadoLead;
  comercialId?: string;
  fechaCreacion: string;
  ultimaInteraccion: string;
  proximoSeguimiento?: string;
  alerta?: "sin_asignar" | "sla_24h" | "sin_actividad_72h" | "ninguna";
  historial: EventoLead[];
}

export const COMERCIALES: Comercial[] = [
  { id: "marc", nombre: "Marc Puig", iniciales: "MP", capacidad: 12 },
  { id: "anna", nombre: "Anna Soler", iniciales: "AS", capacidad: 10 },
  { id: "joan", nombre: "Joan Vidal", iniciales: "JV", capacidad: 8 },
];

const ahora = Date.now();
const haceHrs = (h: number) => new Date(ahora - h * 3_600_000).toISOString();

export const LEADS_INICIALES: Lead[] = [
  {
    id: "L-2026-0142",
    nombre: "Lluís Farré",
    empresa: "Industriales Vic SLU",
    contacto: "lluis.farre@industrialesvic.cat",
    canal: "web",
    asunto: "Cotización 2 líneas envasado automático",
    importeEstimado: 78000,
    estado: "nuevo",
    fechaCreacion: haceHrs(0.3),
    ultimaInteraccion: haceHrs(0.3),
    alerta: "sin_asignar",
    historial: [
      { id: "h1", tipo: "creacion", texto: "Lead creado desde formulario web", hace: "hace 18 min" },
    ],
  },
  {
    id: "L-2026-0141",
    nombre: "Núria Bosch",
    empresa: "Bosch Consultores",
    contacto: "nuria@boschconsultores.cat",
    canal: "email",
    asunto: "Plan mantenimiento nave 800 m²",
    importeEstimado: 14400,
    estado: "contactado",
    comercialId: "anna",
    fechaCreacion: haceHrs(8),
    ultimaInteraccion: haceHrs(2),
    proximoSeguimiento: "mañana 10:00",
    alerta: "ninguna",
    historial: [
      { id: "h1", tipo: "creacion", texto: "Lead recibido por email", hace: "hace 8 h" },
      { id: "h2", tipo: "asignacion", texto: "Asignado a Anna Soler", hace: "hace 7 h 50 min" },
      { id: "h3", tipo: "contacto", texto: "Anna respondió por email con dossier", hace: "hace 2 h" },
    ],
  },
  {
    id: "L-2026-0140",
    nombre: "Restaurant La Plaça",
    empresa: "—",
    contacto: "+34 938 12 33 45",
    canal: "whatsapp",
    asunto: "Reforma cocina industrial",
    importeEstimado: 28000,
    estado: "calificado",
    comercialId: "marc",
    fechaCreacion: haceHrs(28),
    ultimaInteraccion: haceHrs(20),
    proximoSeguimiento: "visita el viernes",
    alerta: "ninguna",
    historial: [
      { id: "h1", tipo: "creacion", texto: "Lead recibido por WhatsApp Business", hace: "hace 28 h" },
      { id: "h2", tipo: "asignacion", texto: "Asignado a Marc Puig", hace: "hace 27 h 50 min" },
      { id: "h3", tipo: "contacto", texto: "Marc llamó y concretó visita", hace: "hace 24 h" },
      { id: "h4", tipo: "estado", texto: "Pasa a calificado tras visita técnica preliminar", hace: "hace 20 h" },
    ],
  },
  {
    id: "L-2026-0139",
    nombre: "Maria Camps",
    empresa: "Constructora Roca",
    contacto: "maria@constructoraroca.cat",
    canal: "email",
    asunto: "Avería bomba calor — cliente recurrente",
    importeEstimado: 4800,
    estado: "ganado",
    comercialId: "joan",
    fechaCreacion: haceHrs(48),
    ultimaInteraccion: haceHrs(4),
    alerta: "ninguna",
    historial: [
      { id: "h1", tipo: "creacion", texto: "Email entrante de cliente recurrente", hace: "hace 48 h" },
      { id: "h2", tipo: "asignacion", texto: "Asignado a Joan Vidal", hace: "hace 47 h 50 min" },
      { id: "h3", tipo: "contacto", texto: "Intervención técnica el mismo día", hace: "hace 30 h" },
      { id: "h4", tipo: "estado", texto: "Cerrado como ganado · 4.800€", hace: "hace 4 h" },
    ],
  },
  {
    id: "L-2026-0138",
    nombre: "Albert Mas",
    empresa: "Mas Distribució",
    contacto: "albert@masdistribucio.cat",
    canal: "telefono",
    asunto: "Renovación flota carretillas",
    importeEstimado: 32000,
    estado: "propuesta",
    comercialId: "marc",
    fechaCreacion: haceHrs(72),
    ultimaInteraccion: haceHrs(40),
    proximoSeguimiento: "esperando respuesta",
    alerta: "sla_24h",
    historial: [
      { id: "h1", tipo: "creacion", texto: "Lead por llamada entrante", hace: "hace 72 h" },
      { id: "h2", tipo: "asignacion", texto: "Asignado a Marc Puig", hace: "hace 71 h 50 min" },
      { id: "h3", tipo: "contacto", texto: "Marc envió propuesta económica", hace: "hace 40 h" },
      { id: "h4", tipo: "alerta", texto: "Sin respuesta del cliente — SLA superado", hace: "hace 16 h" },
    ],
  },
  {
    id: "L-2026-0137",
    nombre: "Jordi Pla",
    empresa: "Tallers Pla SL",
    contacto: "jordi@tallerspla.com",
    canal: "referido",
    asunto: "Diagnosis OBD flota furgonetas",
    importeEstimado: 2400,
    estado: "calificado",
    comercialId: "anna",
    fechaCreacion: haceHrs(96),
    ultimaInteraccion: haceHrs(80),
    alerta: "sin_actividad_72h",
    historial: [
      { id: "h1", tipo: "creacion", texto: "Recomendación de cliente actual", hace: "hace 96 h" },
      { id: "h2", tipo: "asignacion", texto: "Asignado a Anna Soler", hace: "hace 95 h" },
      { id: "h3", tipo: "alerta", texto: "Sin actividad desde hace más de 72 h", hace: "hace 4 h" },
    ],
  },
];
