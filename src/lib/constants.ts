export const DIAS_LABORABLES_MES = 22;
export const SEMANAS_MES = 4.33;
export const PORCENTAJE_AHORRO_DEFAULT = 0.30; // 30%

export const AREAS = [
  { id: "ventas", label: "Ventas / Pedidos", icon: "📦" },
  { id: "stock", label: "Stock", icon: "🏭" },
  { id: "admin", label: "Administración", icon: "📄" },
  { id: "logistica", label: "Logística", icon: "🚚" },
  { id: "comercial", label: "Comercial", icon: "🤝" },
] as const;

export type AreaId = (typeof AREAS)[number]["id"];
