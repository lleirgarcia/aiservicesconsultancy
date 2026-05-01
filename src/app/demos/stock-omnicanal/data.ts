export interface Producto {
  sku: string;
  nombre: string;
  precio: number;
  stockInicial: number;
  stockMinimo: number;
}

export const PRODUCTOS_INICIAL: Producto[] = [
  { sku: "ZAP-RUN-42", nombre: "Zapatilla running unisex (T.42)", precio: 89, stockInicial: 18, stockMinimo: 4 },
  { sku: "JER-LAN-M", nombre: "Jersey lana merino (M)", precio: 64, stockInicial: 12, stockMinimo: 3 },
  { sku: "BOL-CUE-NE", nombre: "Bolso cuero nappa (negro)", precio: 145, stockInicial: 6, stockMinimo: 2 },
  { sku: "CAM-ALG-L", nombre: "Camiseta algodón orgánico (L)", precio: 28, stockInicial: 24, stockMinimo: 6 },
  { sku: "PAN-VAQ-40", nombre: "Pantalón vaquero recto (40)", precio: 79, stockInicial: 9, stockMinimo: 3 },
  { sku: "GOR-LAN-UN", nombre: "Gorra lana invierno (única)", precio: 22, stockInicial: 16, stockMinimo: 4 },
];

export type CanalVenta = "tienda" | "online";
