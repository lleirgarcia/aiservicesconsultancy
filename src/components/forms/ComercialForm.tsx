"use client";

import { useState, useEffect } from "react";
import InputField from "@/components/ui/InputField";
import type { ComercialInputs } from "@/lib/types";

const DEFAULT: ComercialInputs = {
  clientesActivos: 80,
  oportunidadesPerdidasMes: 5,
  horasSeguimientoSemana: 10,
  personas: 2,
  costeHora: 22,
  valorOportunidadPerdida: 2000,
};

interface Props {
  onChange: (inputs: ComercialInputs) => void;
}

export default function ComercialForm({ onChange }: Props) {
  const [values, setValues] = useState<ComercialInputs>(DEFAULT);

  useEffect(() => {
    onChange(values);
  }, [values, onChange]);

  const set = (key: keyof ComercialInputs) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <InputField
        label="Clientes activos"
        value={values.clientesActivos}
        onChange={set("clientesActivos")}
        hint="Cuentas con actividad en los últimos 6 meses"
        suffix="clts"
      />
      <InputField
        label="Oportunidades perdidas al mes"
        value={values.oportunidadesPerdidasMes}
        onChange={set("oportunidadesPerdidasMes")}
        hint="Ofertas sin respuesta, seguimientos fallidos"
        suffix="uds"
      />
      <InputField
        label="Horas en seguimiento comercial por semana"
        value={values.horasSeguimientoSemana}
        onChange={set("horasSeguimientoSemana")}
        hint="Emails, llamadas, actualizaciones manuales"
        suffix="h/sem"
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
        label="Valor medio por oportunidad perdida"
        value={values.valorOportunidadPerdida}
        onChange={set("valorOportunidadPerdida")}
        hint="Margen estimado por operación no cerrada"
        suffix="€"
      />
    </div>
  );
}
