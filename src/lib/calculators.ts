import {
  DIAS_LABORABLES_MES,
  SEMANAS_MES,
  PORCENTAJE_AHORRO_DEFAULT,
} from "./constants";
import type {
  ResultadoCalculo,
  VentasInputs,
  StockInputs,
  AdminInputs,
  LogisticaInputs,
  ComercialInputs,
} from "./types";

function buildResultado(
  horasMes: number,
  costeOperativoMes: number,
  costeErroresMes: number,
  porcentajeAhorro = PORCENTAJE_AHORRO_DEFAULT
): ResultadoCalculo {
  const costeMes = costeOperativoMes + costeErroresMes;
  const costeAnio = costeMes * 12;
  const ahorroPotencialAnio = costeAnio * porcentajeAhorro;

  return {
    horasMes: Math.round(horasMes),
    costeMes: Math.round(costeMes),
    costeAnio: Math.round(costeAnio),
    ahorroPotencialAnio: Math.round(ahorroPotencialAnio),
    porcentajeAhorro,
  };
}

export function calcularVentas(inputs: VentasInputs): ResultadoCalculo {
  const { pedidosDia, minutosPorPedido, personas, costeHora, erroresMes, costePorError } = inputs;

  const minutosOperativosMes = pedidosDia * DIAS_LABORABLES_MES * minutosPorPedido * personas;
  const horasMes = minutosOperativosMes / 60;
  const costeOperativoMes = horasMes * costeHora;
  const costeErroresMes = erroresMes * costePorError;

  return buildResultado(horasMes, costeOperativoMes, costeErroresMes);
}

export function calcularStock(inputs: StockInputs): ResultadoCalculo {
  const { incidenciasMes, minutosIncidencia, personas, costeHora, costeRotura } = inputs;

  const minutosOperativosMes = incidenciasMes * minutosIncidencia * personas;
  const horasMes = minutosOperativosMes / 60;
  const costeOperativoMes = horasMes * costeHora;

  return buildResultado(horasMes, costeOperativoMes, costeRotura);
}

export function calcularAdmin(inputs: AdminInputs): ResultadoCalculo {
  const { documentosMes, minutosPorDocumento, personas, costeHora, retrabajosMes, costePorRetrabajo } = inputs;

  const minutosOperativosMes = documentosMes * minutosPorDocumento * personas;
  const horasMes = minutosOperativosMes / 60;
  const costeOperativoMes = horasMes * costeHora;
  const costeErroresMes = retrabajosMes * costePorRetrabajo;

  return buildResultado(horasMes, costeOperativoMes, costeErroresMes);
}

export function calcularLogistica(inputs: LogisticaInputs): ResultadoCalculo {
  const { enviosDia, minutosPorEnvio, personas, costeHora, incidenciasMes, costePorIncidencia } = inputs;

  const minutosOperativosMes = enviosDia * DIAS_LABORABLES_MES * minutosPorEnvio * personas;
  const horasMes = minutosOperativosMes / 60;
  const costeOperativoMes = horasMes * costeHora;
  const costeErroresMes = incidenciasMes * costePorIncidencia;

  return buildResultado(horasMes, costeOperativoMes, costeErroresMes);
}

export function calcularComercial(inputs: ComercialInputs): ResultadoCalculo {
  const { oportunidadesPerdidasMes, horasSeguimientoSemana, personas, costeHora, valorOportunidadPerdida } = inputs;

  const horasOperativasMes = horasSeguimientoSemana * SEMANAS_MES * personas;
  const costeOperativoMes = horasOperativasMes * costeHora;
  // Coste de oportunidades perdidas se trata como coste de "errores"
  const costeOportunidadesMes = oportunidadesPerdidasMes * valorOportunidadPerdida;

  return buildResultado(horasOperativasMes, costeOperativoMes, costeOportunidadesMes);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-ES").format(value);
}
