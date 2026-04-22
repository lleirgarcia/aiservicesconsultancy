import ResultCard from "@/components/ui/ResultCard";
import Button from "@/components/ui/Button";
import type { ResultadoCalculo } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/calculators";
import { PORCENTAJE_AHORRO_DEFAULT } from "@/lib/constants";

interface Props {
  resultado: ResultadoCalculo;
  onContactClick: () => void;
}

export default function Results({ resultado, onContactClick }: Props) {
  const { horasMes, costeMes, costeAnio, ahorroPotencialAnio, porcentajeAhorro } = resultado;

  return (
    <div className="mt-10 flex flex-col gap-8">
      <hr className="section-rule" />

      {/* Cuatro métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <ResultCard
          label="Horas perdidas / mes"
          value={`${formatNumber(horasMes)}h`}
          sublabel="Gestión manual"
        />
        <ResultCard
          label="Coste mensual"
          value={formatCurrency(costeMes)}
          sublabel="Tiempo + incidencias"
        />
        <ResultCard
          label="Coste anual"
          value={formatCurrency(costeAnio)}
          sublabel="Proyección ×12"
        />
        <ResultCard
          label={`Ahorro potencial / año`}
          value={formatCurrency(ahorroPotencialAnio)}
          sublabel={`Con mejora del ${Math.round(porcentajeAhorro * 100)}%`}
          highlight
        />
      </div>

      <p className="text-xs" style={{ color: "var(--muted)" }}>
        Estimación basada en {22} días laborables/mes · Supuesto de mejora del {Math.round(PORCENTAJE_AHORRO_DEFAULT * 100)}% sobre el proceso actual. No es una promesa, es un orden de magnitud.
      </p>

      <hr className="section-rule" />

      {/* CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold mb-1">¿Quieres saber qué se puede mejorar en tu caso concreto?</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Te explico dónde y cómo, sin vender humo.
          </p>
        </div>
        <Button onClick={onContactClick}>
          Hablemos →
        </Button>
      </div>
    </div>
  );
}
