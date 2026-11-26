export interface MesData {
  mes: string;
  ingresos: number;
  costes: number;
  margen: number;
}

export interface ClienteRentabilidad {
  id: string;
  nombre: string;
  ingresos: number;
  costes: number;
  margen: number;
  trabajosActivos: number;
  estado: "rentable" | "ajustado" | "perdidas";
}

export interface ProyectoActivo {
  id: string;
  nombre: string;
  cliente: string;
  presupuestado: number;
  costeReal: number;
  avance: number;
  alerta: "ninguna" | "atencion" | "critica";
}

export const HISTORICO_12M: MesData[] = [
  { mes: "May 25", ingresos: 84200, costes: 62100, margen: 22100 },
  { mes: "Jun 25", ingresos: 91500, costes: 68800, margen: 22700 },
  { mes: "Jul 25", ingresos: 78400, costes: 58300, margen: 20100 },
  { mes: "Ago 25", ingresos: 62100, costes: 48200, margen: 13900 },
  { mes: "Sep 25", ingresos: 102300, costes: 71400, margen: 30900 },
  { mes: "Oct 25", ingresos: 118500, costes: 82200, margen: 36300 },
  { mes: "Nov 25", ingresos: 124200, costes: 87100, margen: 37100 },
  { mes: "Dic 25", ingresos: 109800, costes: 79400, margen: 30400 },
  { mes: "Ene 26", ingresos: 96500, costes: 71800, margen: 24700 },
  { mes: "Feb 26", ingresos: 105400, costes: 75200, margen: 30200 },
  { mes: "Mar 26", ingresos: 132100, costes: 91800, margen: 40300 },
  { mes: "Abr 26", ingresos: 128400, costes: 88600, margen: 39800 },
];

export const RENTABILIDAD: ClienteRentabilidad[] = [
  { id: "c1", nombre: "Industrial Gurb SL", ingresos: 24800, costes: 14200, margen: 10600, trabajosActivos: 8, estado: "rentable" },
  { id: "c2", nombre: "Logística Plana", ingresos: 18200, costes: 12800, margen: 5400, trabajosActivos: 5, estado: "rentable" },
  { id: "c3", nombre: "Mecanitzats Vilalleons", ingresos: 14600, costes: 9200, margen: 5400, trabajosActivos: 4, estado: "rentable" },
  { id: "c4", nombre: "Distribucions Osona", ingresos: 9800, costes: 11400, margen: -1600, trabajosActivos: 3, estado: "perdidas" },
  { id: "c5", nombre: "Tallers Roca", ingresos: 12600, costes: 8400, margen: 4200, trabajosActivos: 6, estado: "rentable" },
  { id: "c6", nombre: "Promocions Vall del Ges", ingresos: 22400, costes: 21100, margen: 1300, trabajosActivos: 2, estado: "ajustado" },
  { id: "c7", nombre: "Cooperativa Agrària", ingresos: 8200, costes: 5800, margen: 2400, trabajosActivos: 3, estado: "rentable" },
  { id: "c8", nombre: "Hotel Plaça", ingresos: 7600, costes: 8200, margen: -600, trabajosActivos: 2, estado: "perdidas" },
  { id: "c9", nombre: "Forn Pa de Pagès", ingresos: 6400, costes: 4100, margen: 2300, trabajosActivos: 4, estado: "rentable" },
  { id: "c10", nombre: "Restaurant La Taula", ingresos: 3800, costes: 3200, margen: 600, trabajosActivos: 2, estado: "ajustado" },
];

export const PROYECTOS: ProyectoActivo[] = [
  {
    id: "p1",
    nombre: "Reforma cocina industrial — fase 2",
    cliente: "Restaurant La Plaça",
    presupuestado: 28500,
    costeReal: 31200,
    avance: 78,
    alerta: "critica",
  },
  {
    id: "p2",
    nombre: "Ampliación cámara frigorífica",
    cliente: "Distribucions Osona",
    presupuestado: 14200,
    costeReal: 14600,
    avance: 92,
    alerta: "atencion",
  },
  {
    id: "p3",
    nombre: "Mantenimiento anual línea 1",
    cliente: "Industrial Gurb SL",
    presupuestado: 18000,
    costeReal: 11200,
    avance: 65,
    alerta: "ninguna",
  },
  {
    id: "p4",
    nombre: "Programación CNC nueva referencia",
    cliente: "Mecanitzats Vilalleons",
    presupuestado: 6500,
    costeReal: 4800,
    avance: 80,
    alerta: "ninguna",
  },
  {
    id: "p5",
    nombre: "Renovación flota carretillas",
    cliente: "Logística Plana",
    presupuestado: 12000,
    costeReal: 13800,
    avance: 100,
    alerta: "atencion",
  },
];
