"use client";

import { useState, useEffect } from "react";
import InputField from "@/components/ui/InputField";
import type { LogisticaInputs } from "@/lib/types";

const DEFAULT: LogisticaInputs = {
  enviosDia: 40,
  minutosPorEnvio: 10,
  personas: 2,
  costeHora: 18,
  incidenciasMes: 25,
  costePorIncidencia: 35,
};

interface Props {
  onChange: (inputs: LogisticaInputs) => void;
}

export default function LogisticaForm({ onChange }: Props) {
  const [values, setValues] = useState<LogisticaInputs>(DEFAULT);

  useEffect(() => {
    onChange(values);
  }, [values, onChange]);

  const set = (key: keyof LogisticaInputs) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <InputField
        label="Envíos o entregas al día"
        value={values.enviosDia}
        onChange={set("enviosDia")}
        hint="Número medio de expediciones diarias"
        suffix="uds"
      />
      <InputField
        label="Minutos de gestión por entrega"
        value={values.minutosPorEnvio}
        onChange={set("minutosPorEnvio")}
        hint="Preparación, etiquetado, comunicación"
        suffix="min"
      />
      <InputField
        label="Personas implicadas"
        value={values.personas}
        onChange={set("personas")}
        suffix="pers."
      />
      <InputField
        label="Coste medio por hora"
        value={values.costeHora}
        onChange={set("costeHora")}
        suffix="€/h"
      />
      <InputField
        label="Incidencias logísticas al mes"
        value={values.incidenciasMes}
        onChange={set("incidenciasMes")}
        hint="Retrasos, pérdidas, devoluciones, errores de ruta"
        suffix="uds"
      />
      <InputField
        label="Coste estimado por incidencia"
        value={values.costePorIncidencia}
        onChange={set("costePorIncidencia")}
        hint="Tiempo de gestión + impacto cliente"
        suffix="€"
      />
    </div>
  );
}
