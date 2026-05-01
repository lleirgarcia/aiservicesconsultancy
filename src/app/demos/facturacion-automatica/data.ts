export interface ClienteFact {
  id: string;
  nombre: string;
  nif: string;
  email: string;
  iban: string;
  formaPago: "transferencia" | "domiciliacion" | "tarjeta";
  diaPago: number;
}

export interface TrabajoMes {
  id: string;
  clienteId: string;
  fecha: string;
  descripcion: string;
  horas: number;
  tarifaHora: number;
  importe: number;
  validado: boolean;
}

export const CLIENTES: ClienteFact[] = [
  {
    id: "c1",
    nombre: "Industrial Gurb SL",
    nif: "B66012345",
    email: "facturas@gurbindustrial.cat",
    iban: "ES21 1234 5678 9012 3456 7890",
    formaPago: "transferencia",
    diaPago: 30,
  },
  {
    id: "c2",
    nombre: "Logística Plana",
    nif: "B66054321",
    email: "compras@logistica-plana.com",
    iban: "ES44 0081 0123 4567 8901 2345",
    formaPago: "domiciliacion",
    diaPago: 60,
  },
  {
    id: "c3",
    nombre: "Mecanitzats Vilalleons",
    nif: "B66099887",
    email: "admin@mecanitzats.cat",
    iban: "ES60 2100 5544 3322 1100 9988",
    formaPago: "transferencia",
    diaPago: 30,
  },
  {
    id: "c4",
    nombre: "Distribucions Osona",
    nif: "B66077665",
    email: "comptabilitat@distrib-osona.cat",
    iban: "ES85 0049 8877 6655 4433 2211",
    formaPago: "domiciliacion",
    diaPago: 30,
  },
  {
    id: "c5",
    nombre: "Tallers Roca",
    nif: "B66033221",
    email: "factures@tallersroca.cat",
    iban: "ES12 1465 0001 2233 4455 6677",
    formaPago: "transferencia",
    diaPago: 45,
  },
];

const fecha = (dia: number) => `2026-04-${String(dia).padStart(2, "0")}`;

export const TRABAJOS_MES: TrabajoMes[] = [
  // c1 — Industrial Gurb (8 trabajos)
  { id: "t1", clienteId: "c1", fecha: fecha(2), descripcion: "Mantenimiento preventivo línea 1", horas: 4, tarifaHora: 65, importe: 260, validado: true },
  { id: "t2", clienteId: "c1", fecha: fecha(7), descripcion: "Sustitución sensor presión bomba 3", horas: 2.5, tarifaHora: 65, importe: 162.5, validado: true },
  { id: "t3", clienteId: "c1", fecha: fecha(11), descripcion: "Diagnóstico fallo cinta transportadora", horas: 3, tarifaHora: 65, importe: 195, validado: true },
  { id: "t4", clienteId: "c1", fecha: fecha(15), descripcion: "Mantenimiento preventivo línea 2", horas: 4, tarifaHora: 65, importe: 260, validado: true },
  { id: "t5", clienteId: "c1", fecha: fecha(18), descripcion: "Calibración variador frecuencia", horas: 1.5, tarifaHora: 65, importe: 97.5, validado: true },
  { id: "t6", clienteId: "c1", fecha: fecha(22), descripcion: "Reparación urgencia eléctrica nocturna", horas: 3.5, tarifaHora: 95, importe: 332.5, validado: true },
  { id: "t7", clienteId: "c1", fecha: fecha(25), descripcion: "Mantenimiento preventivo línea 3", horas: 4, tarifaHora: 65, importe: 260, validado: true },
  { id: "t8", clienteId: "c1", fecha: fecha(28), descripcion: "Auditoría final mes — informe", horas: 2, tarifaHora: 65, importe: 130, validado: true },
  // c2 — Logística Plana (5)
  { id: "t9", clienteId: "c2", fecha: fecha(3), descripcion: "Mantenimiento muelle carga", horas: 3, tarifaHora: 58, importe: 174, validado: true },
  { id: "t10", clienteId: "c2", fecha: fecha(9), descripcion: "Reparación carretilla frontal #4", horas: 5, tarifaHora: 58, importe: 290, validado: true },
  { id: "t11", clienteId: "c2", fecha: fecha(14), descripcion: "Revisión flota — 8 carretillas", horas: 8, tarifaHora: 58, importe: 464, validado: true },
  { id: "t12", clienteId: "c2", fecha: fecha(19), descripcion: "Sustitución batería transpaleta eléctrica", horas: 1.5, tarifaHora: 58, importe: 87, validado: true },
  { id: "t13", clienteId: "c2", fecha: fecha(26), descripcion: "Inspección puentes grúa", horas: 4, tarifaHora: 58, importe: 232, validado: false },
  // c3 — Mecanitzats (4)
  { id: "t14", clienteId: "c3", fecha: fecha(5), descripcion: "Programación CNC pieza ref. M-4421", horas: 6, tarifaHora: 72, importe: 432, validado: true },
  { id: "t15", clienteId: "c3", fecha: fecha(12), descripcion: "Mantenimiento torno paralelo", horas: 3, tarifaHora: 72, importe: 216, validado: true },
  { id: "t16", clienteId: "c3", fecha: fecha(20), descripcion: "Calibración fresadora 3 ejes", horas: 2.5, tarifaHora: 72, importe: 180, validado: true },
  { id: "t17", clienteId: "c3", fecha: fecha(27), descripcion: "Diagnóstico vibración husillo", horas: 1, tarifaHora: 72, importe: 72, validado: true },
  // c4 — Distribucions Osona (3)
  { id: "t18", clienteId: "c4", fecha: fecha(8), descripcion: "Revisión cámara frigorífica grande", horas: 3, tarifaHora: 62, importe: 186, validado: true },
  { id: "t19", clienteId: "c4", fecha: fecha(17), descripcion: "Sustitución compresor cámara 2", horas: 6, tarifaHora: 62, importe: 372, validado: true },
  { id: "t20", clienteId: "c4", fecha: fecha(24), descripcion: "Mantenimiento mensual instalación frío", horas: 4, tarifaHora: 62, importe: 248, validado: true },
  // c5 — Tallers Roca (6)
  { id: "t21", clienteId: "c5", fecha: fecha(4), descripcion: "Reparación elevador 4 columnas", horas: 4, tarifaHora: 60, importe: 240, validado: true },
  { id: "t22", clienteId: "c5", fecha: fecha(10), descripcion: "Diagnosis OBD flota furgonetas", horas: 2, tarifaHora: 60, importe: 120, validado: true },
  { id: "t23", clienteId: "c5", fecha: fecha(13), descripcion: "Cambio de aceite + filtros — 5 vehículos", horas: 4, tarifaHora: 60, importe: 240, validado: true },
  { id: "t24", clienteId: "c5", fecha: fecha(21), descripcion: "Programación llave electrónica vehículo cliente", horas: 1.5, tarifaHora: 60, importe: 90, validado: true },
  { id: "t25", clienteId: "c5", fecha: fecha(23), descripcion: "Reparación dirección asistida", horas: 3, tarifaHora: 60, importe: 180, validado: true },
  { id: "t26", clienteId: "c5", fecha: fecha(29), descripcion: "ITV preparación — 3 vehículos", horas: 3, tarifaHora: 60, importe: 180, validado: false },
];
