import type { DatosPresupuesto, LineaPresupuesto, PartidaCatalogo } from "./data";

export interface LineaCalculada {
  linea: LineaPresupuesto;
  partida: PartidaCatalogo | undefined;
  precioCoste: number;
  precioVenta: number;
  subtotal: number;
  totalLinea: number;
}

export function calcularLinea(
  linea: LineaPresupuesto,
  catalogo: PartidaCatalogo[],
): LineaCalculada {
  const partida = catalogo.find((p) => p.id === linea.partidaId);
  if (!partida) {
    return {
      linea,
      partida: undefined,
      precioCoste: 0,
      precioVenta: 0,
      subtotal: 0,
      totalLinea: 0,
    };
  }
  const precioCoste = partida.precioMaterial + partida.precioManoObra;
  const precioVenta = precioCoste * (1 + linea.margen / 100);
  const subtotal = precioVenta * linea.cantidad;
  const totalLinea = subtotal * (1 - linea.descuento / 100);
  return { linea, partida, precioCoste, precioVenta, subtotal, totalLinea };
}

export function calcularTotales(presupuesto: DatosPresupuesto, catalogo: PartidaCatalogo[]) {
  const lineasCalc = presupuesto.lineas.map((l) => calcularLinea(l, catalogo));
  const baseImponible = lineasCalc.reduce((acc, l) => acc + l.totalLinea, 0);
  const costeTotal = lineasCalc.reduce(
    (acc, l) => acc + (l.partida ? l.precioCoste * l.linea.cantidad : 0),
    0,
  );
  const beneficio = baseImponible - costeTotal;
  const margenGlobal = baseImponible > 0 ? (beneficio / baseImponible) * 100 : 0;
  const iva = baseImponible * (presupuesto.iva / 100);
  const total = baseImponible + iva;
  return {
    lineasCalc,
    costeTotal,
    baseImponible,
    iva,
    total,
    beneficio,
    margenGlobal,
  };
}

export function formatoEuro(valor: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(valor);
}

export function formatoFecha(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}
