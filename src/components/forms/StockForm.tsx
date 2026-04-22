"use client";

import { useState, useEffect } from "react";
import InputField from "@/components/ui/InputField";
import type { StockInputs } from "@/lib/types";

const DEFAULT: StockInputs = {
  referenciasActivas: 500,
  incidenciasMes: 20,
  minutosIncidencia: 45,
  personas: 2,
  costeHora: 18,
  costeRotura: 800,
};

interface Props {
  onChange: (inputs: StockInputs) => void;
}

export default function StockForm({ onChange }: Props) {
  const [values, setValues] = useState<StockInputs>(DEFAULT);

  useEffect(() => {
    onChange(values);
  }, [values, onChange]);

  const set = (key: keyof StockInputs) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <InputField
        label="Referencias activas"
        value={values.referenciasActivas}
        onChange={set("referenciasActivas")}
        hint="Número de referencias en catálogo activo"
        suffix="refs"
      />
      <InputField
        label="Incidencias de stock al mes"
        value={values.incidenciasMes}
        onChange={set("incidenciasMes")}
        hint="Roturas, excesos, recuentos urgentes"
        suffix="uds"
      />
      <InputField
        label="Tiempo por incidencia"
        value={values.minutosIncidencia}
        onChange={set("minutosIncidencia")}
        hint="Minutos medios para resolver cada una"
        suffix="min"
      />
      <InputField
        label="Personas implicadas"
        value={values.personas}
        onChange={set("personas")}
        hint="Media de personas por incidencia"
        suffix="pers."
      />
      <InputField
        label="Coste medio por hora"
        value={values.costeHora}
        onChange={set("costeHora")}
        hint="Coste total empresa por persona/hora"
        suffix="€/h"
      />
      <InputField
        label="Coste mensual por rotura o exceso"
        value={values.costeRotura}
        onChange={set("costeRotura")}
        hint="Ventas perdidas, urgencias, obsolescencia"
        suffix="€/mes"
      />
    </div>
  );
}
