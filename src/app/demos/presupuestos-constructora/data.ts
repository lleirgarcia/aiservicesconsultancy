export type CategoriaPartida =
  | "Demolición"
  | "Albañilería"
  | "Estructura"
  | "Cubiertas"
  | "Instalaciones"
  | "Acabados"
  | "Carpintería";

export interface PartidaCatalogo {
  id: string;
  categoria: CategoriaPartida;
  descripcion: string;
  unidad: "m²" | "m³" | "ml" | "ud" | "h";
  precioMaterial: number;
  precioManoObra: number;
}

export const CATALOGO: PartidaCatalogo[] = [
  {
    id: "dem-001",
    categoria: "Demolición",
    descripcion: "Demolición de tabique de ladrillo hueco doble, con retirada de escombros.",
    unidad: "m²",
    precioMaterial: 0.8,
    precioManoObra: 14.5,
  },
  {
    id: "dem-002",
    categoria: "Demolición",
    descripcion: "Picado de alicatado en paramento vertical hasta dejar el soporte limpio.",
    unidad: "m²",
    precioMaterial: 0.5,
    precioManoObra: 12,
  },
  {
    id: "alb-001",
    categoria: "Albañilería",
    descripcion: "Tabique de placa de yeso laminado 13+48+13 con aislamiento de lana mineral.",
    unidad: "m²",
    precioMaterial: 18,
    precioManoObra: 22,
  },
  {
    id: "alb-002",
    categoria: "Albañilería",
    descripcion: "Recibido de premarcos de carpintería interior con yeso.",
    unidad: "ud",
    precioMaterial: 4,
    precioManoObra: 18,
  },
  {
    id: "est-001",
    categoria: "Estructura",
    descripcion: "Refuerzo de viga metálica IPN-200 incluyendo soldadura y protección antifuego.",
    unidad: "ml",
    precioMaterial: 95,
    precioManoObra: 65,
  },
  {
    id: "cub-001",
    categoria: "Cubiertas",
    descripcion: "Impermeabilización con lámina asfáltica bicapa sobre solera existente.",
    unidad: "m²",
    precioMaterial: 18,
    precioManoObra: 16,
  },
  {
    id: "ins-001",
    categoria: "Instalaciones",
    descripcion: "Punto de luz en techo con caja de derivación y mecanismo legrand valena.",
    unidad: "ud",
    precioMaterial: 22,
    precioManoObra: 28,
  },
  {
    id: "ins-002",
    categoria: "Instalaciones",
    descripcion: "Toma de agua fría/caliente en multicapa pe-x con llave de corte.",
    unidad: "ud",
    precioMaterial: 35,
    precioManoObra: 45,
  },
  {
    id: "ins-003",
    categoria: "Instalaciones",
    descripcion: "Radiador aluminio de 6 elementos con valvulería termostática.",
    unidad: "ud",
    precioMaterial: 145,
    precioManoObra: 75,
  },
  {
    id: "aca-001",
    categoria: "Acabados",
    descripcion: "Alicatado de baño con gres porcelánico 30x60 colocado a hueso.",
    unidad: "m²",
    precioMaterial: 28,
    precioManoObra: 32,
  },
  {
    id: "aca-002",
    categoria: "Acabados",
    descripcion: "Pavimento laminado AC4 con base aislante acústica y rodapié 8 cm.",
    unidad: "m²",
    precioMaterial: 22,
    precioManoObra: 14,
  },
  {
    id: "aca-003",
    categoria: "Acabados",
    descripcion: "Pintura plástica lisa lavable, dos manos sobre paramento liso.",
    unidad: "m²",
    precioMaterial: 1.8,
    precioManoObra: 5.5,
  },
  {
    id: "car-001",
    categoria: "Carpintería",
    descripcion: "Puerta interior lacada blanca de 82,5 con marco, tapajuntas y manilla.",
    unidad: "ud",
    precioMaterial: 220,
    precioManoObra: 75,
  },
  {
    id: "car-002",
    categoria: "Carpintería",
    descripcion: "Ventana de aluminio RPT con doble acristalamiento bajo emisivo.",
    unidad: "m²",
    precioMaterial: 285,
    precioManoObra: 55,
  },
];

export interface LineaPresupuesto {
  id: string;
  partidaId: string;
  cantidad: number;
  margen: number;
  descuento: number;
}

export interface DatosPresupuesto {
  numero: string;
  fecha: string;
  validezDias: number;
  cliente: {
    nombre: string;
    nif: string;
    direccion: string;
  };
  obra: {
    titulo: string;
    direccion: string;
  };
  lineas: LineaPresupuesto[];
  iva: number;
  notas: string;
}

export const PRESUPUESTO_INICIAL: DatosPresupuesto = {
  numero: "PRES-2026-0042",
  fecha: new Date().toISOString().slice(0, 10),
  validezDias: 30,
  cliente: {
    nombre: "Promociones Vall del Ges, S.L.",
    nif: "B66123456",
    direccion: "Carrer Major 12, 08560 Manlleu (Barcelona)",
  },
  obra: {
    titulo: "Reforma integral de vivienda — 78 m²",
    direccion: "Carrer del Pont 4, 2-1, 08500 Vic",
  },
  lineas: [
    { id: "l1", partidaId: "dem-001", cantidad: 24, margen: 18, descuento: 0 },
    { id: "l2", partidaId: "alb-001", cantidad: 32, margen: 18, descuento: 0 },
    { id: "l3", partidaId: "ins-001", cantidad: 12, margen: 22, descuento: 0 },
    { id: "l4", partidaId: "ins-002", cantidad: 6, margen: 22, descuento: 0 },
    { id: "l5", partidaId: "aca-001", cantidad: 18, margen: 20, descuento: 0 },
    { id: "l6", partidaId: "aca-003", cantidad: 145, margen: 20, descuento: 5 },
    { id: "l7", partidaId: "car-001", cantidad: 5, margen: 25, descuento: 0 },
  ],
  iva: 21,
  notas:
    "Plazo de ejecución estimado: 6 semanas desde la firma. Forma de pago: 30% al inicio, 40% a mitad de obra, 30% a la entrega. Materiales sujetos a disponibilidad del proveedor.",
};
