export interface ResultadoCalculo {
  horasMes: number;
  costeMes: number;
  costeAnio: number;
  ahorroPotencialAnio: number;
  porcentajeAhorro: number;
}

export interface VentasInputs {
  pedidosDia: number;
  minutosPorPedido: number;
  personas: number;
  costeHora: number;
  erroresMes: number;
  costePorError: number;
}

export interface StockInputs {
  referenciasActivas: number;
  incidenciasMes: number;
  minutosIncidencia: number;
  personas: number;
  costeHora: number;
  costeRotura: number;
}

export interface AdminInputs {
  documentosMes: number;
  minutosPorDocumento: number;
  personas: number;
  costeHora: number;
  retrabajosMes: number;
  costePorRetrabajo: number;
}

export interface LogisticaInputs {
  enviosDia: number;
  minutosPorEnvio: number;
  personas: number;
  costeHora: number;
  incidenciasMes: number;
  costePorIncidencia: number;
}

export interface ComercialInputs {
  clientesActivos: number;
  oportunidadesPerdidasMes: number;
  horasSeguimientoSemana: number;
  personas: number;
  costeHora: number;
  valorOportunidadPerdida: number;
}
