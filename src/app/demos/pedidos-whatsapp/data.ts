export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  ciudad: string;
}

export interface ProductoCatalogo {
  sku: string;
  nombre: string;
  formato: string;
  precio: number;
  stock: number;
}

export interface LineaExtraida {
  sku: string;
  productoNombre: string;
  formato: string;
  cantidad: number;
  precioUnitario: number;
  importe: number;
  notaIA?: string;
}

export interface MensajeWhatsApp {
  id: string;
  clienteId: string;
  texto: string;
  recibidoEn: string;
  pista: {
    lineas: LineaExtraida[];
    fechaEntrega?: string;
    notaCliente?: string;
    confianzaGlobal: number;
    razon: string;
    hayAmbiguedad: boolean;
  };
}

export const CLIENTES: Cliente[] = [
  { id: "c1", nombre: "Bar Casal de Vic", telefono: "+34 938 12 33 45", ciudad: "Vic" },
  { id: "c2", nombre: "Restaurant La Taula", telefono: "+34 932 78 91 22", ciudad: "Manlleu" },
  { id: "c3", nombre: "Forn Pa de Pagès", telefono: "+34 938 88 12 09", ciudad: "Torelló" },
  { id: "c4", nombre: "Cervesa & Co.", telefono: "+34 937 41 56 78", ciudad: "Roda de Ter" },
  { id: "c5", nombre: "Hotel Plaça", telefono: "+34 938 02 14 56", ciudad: "Vic" },
];

export const CATALOGO: ProductoCatalogo[] = [
  { sku: "CRV-EST-33", nombre: "Cervesa Estrella Damm", formato: "Caixa 24×33cl", precio: 18.5, stock: 142 },
  { sku: "CRV-MZN-50", nombre: "Cervesa Moritz", formato: "Barril 50L", precio: 145, stock: 12 },
  { sku: "CCL-ZER-1L", nombre: "Coca-Cola Zero", formato: "Caja 12×1L", precio: 22, stock: 88 },
  { sku: "AGU-MIN-15", nombre: "Aigua Font Vella", formato: "Caja 6×1.5L", precio: 6.4, stock: 210 },
  { sku: "VIN-NEG-CAS", nombre: "Vi Negre Crianza Penedès", formato: "Caja 6 botellas", precio: 48, stock: 34 },
  { sku: "VIN-BLA-VER", nombre: "Vi Blanc Verdejo", formato: "Caja 6 botellas", precio: 36, stock: 41 },
  { sku: "CAV-BRU-NAT", nombre: "Cava Brut Nature", formato: "Caja 6 botellas", precio: 54, stock: 28 },
  { sku: "PA-TRA-1KG", nombre: "Pa de pagès tradicional", formato: "Unitat 1kg", precio: 4.2, stock: 60 },
  { sku: "FAR-ESP-25", nombre: "Farina d'espelta integral", formato: "Sac 25kg", precio: 38, stock: 18 },
  { sku: "OLI-VIR-5L", nombre: "Oli d'oliva verge extra", formato: "Garrafa 5L", precio: 42, stock: 24 },
];

const ahora = Date.now();
const haceMin = (m: number) => new Date(ahora - m * 60_000).toISOString();

export const MENSAJES_INICIALES: MensajeWhatsApp[] = [
  {
    id: "m1",
    clienteId: "c1",
    texto:
      "Bon dia! Per dijous em poseu 4 caixes d'estrella i 2 de coca-cola zero d'1 litre. Gràcies!",
    recibidoEn: haceMin(3),
    pista: {
      lineas: [
        {
          sku: "CRV-EST-33",
          productoNombre: "Cervesa Estrella Damm",
          formato: "Caixa 24×33cl",
          cantidad: 4,
          precioUnitario: 18.5,
          importe: 74,
        },
        {
          sku: "CCL-ZER-1L",
          productoNombre: "Coca-Cola Zero",
          formato: "Caja 12×1L",
          cantidad: 2,
          precioUnitario: 22,
          importe: 44,
        },
      ],
      fechaEntrega: "Dijous (próximo)",
      confianzaGlobal: 0.96,
      razon:
        "«estrella» → SKU CRV-EST-33 (cervesa Estrella Damm); «coca-cola zero d'1 litre» → CCL-ZER-1L; cantidades explícitas en numeral",
      hayAmbiguedad: false,
    },
  },
  {
    id: "m2",
    clienteId: "c2",
    texto:
      "Hola, em cal: 6 caixes vi negre crianza, 3 de blanc verdejo i un parell de cava per al cap de setmana. Si pot ser dimecres millor.",
    recibidoEn: haceMin(11),
    pista: {
      lineas: [
        {
          sku: "VIN-NEG-CAS",
          productoNombre: "Vi Negre Crianza Penedès",
          formato: "Caja 6 botellas",
          cantidad: 6,
          precioUnitario: 48,
          importe: 288,
        },
        {
          sku: "VIN-BLA-VER",
          productoNombre: "Vi Blanc Verdejo",
          formato: "Caja 6 botellas",
          cantidad: 3,
          precioUnitario: 36,
          importe: 108,
        },
        {
          sku: "CAV-BRU-NAT",
          productoNombre: "Cava Brut Nature",
          formato: "Caja 6 botellas",
          cantidad: 2,
          precioUnitario: 54,
          importe: 108,
          notaIA: "«un parell» se interpreta como 2 cajas — confirmar con el cliente",
        },
      ],
      fechaEntrega: "Dimecres (próximo)",
      confianzaGlobal: 0.84,
      razon:
        "tres productos identificados con cantidades; «un parell» → 2 con baja certeza, marcado para revisión humana",
      hayAmbiguedad: true,
    },
  },
  {
    id: "m3",
    clienteId: "c3",
    texto:
      "Necessito 2 sacs de farina d'espelta integral i 30 unitats de pa de pagès tradicional. Dimarts a primera hora.",
    recibidoEn: haceMin(22),
    pista: {
      lineas: [
        {
          sku: "FAR-ESP-25",
          productoNombre: "Farina d'espelta integral",
          formato: "Sac 25kg",
          cantidad: 2,
          precioUnitario: 38,
          importe: 76,
        },
        {
          sku: "PA-TRA-1KG",
          productoNombre: "Pa de pagès tradicional",
          formato: "Unitat 1kg",
          cantidad: 30,
          precioUnitario: 4.2,
          importe: 126,
        },
      ],
      fechaEntrega: "Dimarts a primera hora",
      confianzaGlobal: 0.94,
      razon: "ambos productos coinciden con SKU; cantidades numéricas claras; entrega temporal explícita",
      hayAmbiguedad: false,
    },
  },
  {
    id: "m4",
    clienteId: "c4",
    texto:
      "Hola Marc, urgent: avui mateix si pot ser, un barril de Moritz i 8 caixes d'estrella. Que ahir vam tenir un esdeveniment i vam quedar sense.",
    recibidoEn: haceMin(34),
    pista: {
      lineas: [
        {
          sku: "CRV-MZN-50",
          productoNombre: "Cervesa Moritz",
          formato: "Barril 50L",
          cantidad: 1,
          precioUnitario: 145,
          importe: 145,
        },
        {
          sku: "CRV-EST-33",
          productoNombre: "Cervesa Estrella Damm",
          formato: "Caixa 24×33cl",
          cantidad: 8,
          precioUnitario: 18.5,
          importe: 148,
        },
      ],
      fechaEntrega: "Hoy mismo (urgente)",
      notaCliente: "Cliente sin stock tras evento — prioridad alta",
      confianzaGlobal: 0.95,
      razon: "«barril Moritz» → CRV-MZN-50; «estrella» → CRV-EST-33; cantidades explícitas; marcador urgente detectado",
      hayAmbiguedad: false,
    },
  },
  {
    id: "m5",
    clienteId: "c5",
    texto:
      "Ens cal reposició de l'habitual. Aigua, vi blanc i una mica d'oli per a la cuina.",
    recibidoEn: haceMin(48),
    pista: {
      lineas: [
        {
          sku: "AGU-MIN-15",
          productoNombre: "Aigua Font Vella",
          formato: "Caja 6×1.5L",
          cantidad: 0,
          precioUnitario: 6.4,
          importe: 0,
          notaIA: "Cantidad no especificada — usar histórico (10 cajas/mes en abril)",
        },
        {
          sku: "VIN-BLA-VER",
          productoNombre: "Vi Blanc Verdejo",
          formato: "Caja 6 botellas",
          cantidad: 0,
          precioUnitario: 36,
          importe: 0,
          notaIA: "Cantidad no especificada — usar histórico (4 cajas/mes en abril)",
        },
        {
          sku: "OLI-VIR-5L",
          productoNombre: "Oli d'oliva verge extra",
          formato: "Garrafa 5L",
          cantidad: 0,
          precioUnitario: 42,
          importe: 0,
          notaIA: "«una mica» — pendiente de confirmación humana",
        },
      ],
      confianzaGlobal: 0.62,
      razon:
        "tres productos identificables pero sin cantidades concretas; el sistema propone usar el promedio histórico y dejar pendiente la oliva",
      hayAmbiguedad: true,
    },
  },
  {
    id: "m6",
    clienteId: "c1",
    texto:
      "Una pregunta, els barrils de Moritz quant valen ara? Ens en cal canviar el proveïdor.",
    recibidoEn: haceMin(72),
    pista: {
      lineas: [],
      confianzaGlobal: 0.32,
      razon:
        "el mensaje es una consulta de precio, no un pedido — no se crea pedido pero se notifica al comercial",
      hayAmbiguedad: false,
      notaCliente: "Consulta comercial, no pedido — escalada a Marc",
    },
  },
  {
    id: "m7",
    clienteId: "c4",
    texto:
      "Per la setmana vinent: 12 caixes d'estrella, 4 de cava brut nature i 6 d'aigua. Divendres a la tarda al magatzem nou.",
    recibidoEn: haceMin(95),
    pista: {
      lineas: [
        {
          sku: "CRV-EST-33",
          productoNombre: "Cervesa Estrella Damm",
          formato: "Caixa 24×33cl",
          cantidad: 12,
          precioUnitario: 18.5,
          importe: 222,
        },
        {
          sku: "CAV-BRU-NAT",
          productoNombre: "Cava Brut Nature",
          formato: "Caja 6 botellas",
          cantidad: 4,
          precioUnitario: 54,
          importe: 216,
        },
        {
          sku: "AGU-MIN-15",
          productoNombre: "Aigua Font Vella",
          formato: "Caja 6×1.5L",
          cantidad: 6,
          precioUnitario: 6.4,
          importe: 38.4,
        },
      ],
      fechaEntrega: "Viernes tarde — almacén nuevo",
      notaCliente: "Cambio de dirección de entrega: almacén nuevo",
      confianzaGlobal: 0.93,
      razon: "tres productos con cantidades numéricas; cambio de dirección detectado y registrado como nota",
      hayAmbiguedad: false,
    },
  },
  {
    id: "m8",
    clienteId: "c2",
    texto:
      "El pedido de hoy ha llegado bien pero faltaba 1 caja de coca-cola zero. Lo enviáis con el próximo o lo abonáis?",
    recibidoEn: haceMin(140),
    pista: {
      lineas: [],
      confianzaGlobal: 0.41,
      razon:
        "incidencia post-entrega, no es un pedido nuevo — se abre ticket de incidencia y se notifica a atención al cliente",
      hayAmbiguedad: false,
      notaCliente: "Incidencia: faltante 1 caja CCL-ZER-1L del pedido anterior",
    },
  },
];
