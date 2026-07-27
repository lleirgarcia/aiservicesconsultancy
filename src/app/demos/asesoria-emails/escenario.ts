import { CLIENTES } from "./data";
import { EMAILS_PREDEFINIDOS, type EmailPredefinido } from "./emisor/data";

// Un escenario define el mundo de la demo: qué empresa ficticia recibe los
// emails, cómo archiva y qué 5 emails de ejemplo se pueden enviar.
export interface Escenario {
  // Nombre corto del escenario, normalmente el de la empresa prospecto.
  nombre: string;
  // Qué hace la empresa y qué tipo de correo recibe. Alimenta el system
  // prompt del clasificador.
  contextoNegocio: string;
  // Titular y subtítulo de la bandeja inteligente.
  titular: string;
  subtitulo: string;
  // Etiqueta del panel de carpetas ("Carpetas de cliente", "Carpetas de proveedor"…).
  carpetasLabel: string;
  // Entidades por las que se archiva (clientes, proveedores, obras…).
  clientes: { slug: string; nombre: string }[];
  // Tipos de documento válidos y su carpeta destino.
  tipos: { tipo: string; carpeta: string }[];
  // Los 5 emails predefinidos del emisor.
  emails: EmailPredefinido[];
}

export const ESCENARIO_DEFECTO: Escenario = {
  nombre: "Asesoría contable (por defecto)",
  contextoNegocio:
    "Una asesoría contable española que recibe cada día documentación de sus empresas cliente: facturas de suministros, nóminas, modelos tributarios presentados (303, 111), contratos para revisar y justificantes bancarios.",
  titular: "La IA lee los emails entrantes y archiva sola los documentos.",
  subtitulo:
    "Pulsa Procesar todo y observa cómo cada email se identifica (factura, nómina, modelo 303…), se renombra y se archiva en la carpeta del cliente que toca. Sin abrir nada a mano.",
  carpetasLabel: "Carpetas de cliente",
  clientes: CLIENTES,
  tipos: [
    { tipo: "Factura", carpeta: "01_Facturas" },
    { tipo: "Nómina", carpeta: "02_Nóminas" },
    { tipo: "Modelo 303", carpeta: "03_Modelos/303" },
    { tipo: "Modelo 111", carpeta: "03_Modelos/111" },
    { tipo: "Contrato", carpeta: "04_Contratos" },
    { tipo: "Justificante bancario", carpeta: "05_Bancos" },
    { tipo: "Otros", carpeta: "99_Otros" },
  ],
  emails: EMAILS_PREDEFINIDOS,
};

// Valida el shape mínimo de un escenario recibido de fuera (chat IA o PUT).
export function esEscenarioValido(e: unknown): e is Escenario {
  if (!e || typeof e !== "object") return false;
  const x = e as Record<string, unknown>;
  return (
    typeof x.nombre === "string" &&
    typeof x.contextoNegocio === "string" &&
    typeof x.titular === "string" &&
    typeof x.subtitulo === "string" &&
    typeof x.carpetasLabel === "string" &&
    Array.isArray(x.clientes) &&
    x.clientes.length > 0 &&
    x.clientes.every(
      (c) => c && typeof (c as { slug?: unknown }).slug === "string" && typeof (c as { nombre?: unknown }).nombre === "string",
    ) &&
    Array.isArray(x.tipos) &&
    x.tipos.length > 0 &&
    x.tipos.every(
      (t) => t && typeof (t as { tipo?: unknown }).tipo === "string" && typeof (t as { carpeta?: unknown }).carpeta === "string",
    ) &&
    Array.isArray(x.emails) &&
    x.emails.length > 0 &&
    x.emails.every((m) => {
      const em = m as Record<string, unknown>;
      return (
        typeof em.id === "string" &&
        typeof em.etiqueta === "string" &&
        typeof em.remitenteNombre === "string" &&
        typeof em.remitenteAlias === "string" &&
        typeof em.asunto === "string" &&
        typeof em.cuerpo === "string" &&
        Array.isArray(em.adjuntos)
      );
    })
  );
}
