import { CLIENTES, type LineaExtraida, type MensajeWhatsApp } from "./data";

export interface PasoExtraccion {
  etiqueta: string;
  texto: string;
  duracionMs: number;
}

export type ResultadoTipo = "pedido" | "consulta" | "incidencia";

export interface ResultadoExtraccion {
  mensajeId: string;
  tipo: ResultadoTipo;
  clienteId: string;
  clienteNombre: string;
  lineas: LineaExtraida[];
  total: number;
  fechaEntrega?: string;
  notaCliente?: string;
  confianzaGlobal: number;
  razon: string;
  hayAmbiguedad: boolean;
  esUrgente: boolean;
  pasos: PasoExtraccion[];
}

const PALABRAS_URGENTE = ["urgent", "urgente", "avui mateix", "hoy mismo", "ya", "asap"];

function detectarTipo(mensaje: MensajeWhatsApp): ResultadoTipo {
  const texto = mensaje.texto.toLowerCase();
  if (mensaje.pista.lineas.length === 0) {
    if (
      texto.includes("falt") ||
      texto.includes("incidència") ||
      texto.includes("incidencia") ||
      texto.includes("reclam")
    ) {
      return "incidencia";
    }
    return "consulta";
  }
  return "pedido";
}

export function extraerPedido(mensaje: MensajeWhatsApp): ResultadoExtraccion {
  const cliente = CLIENTES.find((c) => c.id === mensaje.clienteId);
  const tipo = detectarTipo(mensaje);
  const total = mensaje.pista.lineas.reduce((acc, l) => acc + l.importe, 0);
  const esUrgente = PALABRAS_URGENTE.some((p) => mensaje.texto.toLowerCase().includes(p));

  const pasos: PasoExtraccion[] = [];

  pasos.push({
    etiqueta: "Identificar cliente",
    texto: `Teléfono ${cliente?.telefono} → ${cliente?.nombre} (${cliente?.ciudad}).`,
    duracionMs: 280,
  });

  if (tipo === "consulta") {
    pasos.push({
      etiqueta: "Clasificar intención",
      texto: "El mensaje es una consulta comercial, no un pedido. Se notifica al comercial responsable.",
      duracionMs: 360,
    });
  } else if (tipo === "incidencia") {
    pasos.push({
      etiqueta: "Clasificar intención",
      texto: "El mensaje describe una incidencia post-entrega. Se abre ticket en atención al cliente.",
      duracionMs: 360,
    });
  } else {
    pasos.push({
      etiqueta: "Detectar productos",
      texto: `Identificadas ${mensaje.pista.lineas.length} líneas: ${mensaje.pista.lineas
        .map((l) => `${l.cantidad || "?"}× ${l.productoNombre}`)
        .join(", ")}.`,
      duracionMs: 420,
    });
    pasos.push({
      etiqueta: "Mapear a SKU",
      texto: mensaje.pista.lineas
        .map((l) => `${l.productoNombre} → ${l.sku} (${l.formato})`)
        .join(" · "),
      duracionMs: 380,
    });
    pasos.push({
      etiqueta: "Resolver cantidades",
      texto:
        mensaje.pista.lineas.some((l) => l.notaIA) ||
        mensaje.pista.hayAmbiguedad
          ? "Hay cantidades ambiguas — se aplica histórico del cliente y se marca para revisión humana."
          : "Todas las cantidades son explícitas y numéricas.",
      duracionMs: 320,
    });
    pasos.push({
      etiqueta: "Calcular importe",
      texto: `Total estimado: ${total.toFixed(2)} €.`,
      duracionMs: 240,
    });
    if (mensaje.pista.fechaEntrega) {
      pasos.push({
        etiqueta: "Fecha entrega",
        texto: mensaje.pista.fechaEntrega,
        duracionMs: 220,
      });
    }
    if (esUrgente) {
      pasos.push({
        etiqueta: "Marcar urgencia",
        texto: "Detectado tono urgente — pedido prioritario, se notifica a almacén.",
        duracionMs: 240,
      });
    }
    pasos.push({
      etiqueta: "Crear en ERP",
      texto: "Pedido insertado en el ERP con estado «pendiente de validación».",
      duracionMs: 280,
    });
  }

  return {
    mensajeId: mensaje.id,
    tipo,
    clienteId: mensaje.clienteId,
    clienteNombre: cliente?.nombre ?? "Cliente desconocido",
    lineas: mensaje.pista.lineas,
    total,
    fechaEntrega: mensaje.pista.fechaEntrega,
    notaCliente: mensaje.pista.notaCliente,
    confianzaGlobal: mensaje.pista.confianzaGlobal,
    razon: mensaje.pista.razon,
    hayAmbiguedad: mensaje.pista.hayAmbiguedad,
    esUrgente,
    pasos,
  };
}

export function formatoEuro(valor: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(valor);
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
