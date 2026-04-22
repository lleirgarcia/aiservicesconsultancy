"use client";

import { useState, useEffect } from "react";
import InputField from "@/components/ui/InputField";
import type { VentasInputs } from "@/lib/types";

const DEFAULT: VentasInputs = {
  pedidosDia: 30,
  minutosPorPedido: 8,
  personas: 2,
  costeHora: 18,
  erroresMes: 15,
  costePorError: 25,
};

interface Props {
  onChange: (inputs: VentasInputs) => void;
}

export default function VentasForm({ onChange }: Props) {
  const [values, setValues] = useState<VentasInputs>(DEFAULT);

  useEffect(() => {
    onChange(values);
  }, [values, onChange]);

  const set = (key: keyof VentasInputs) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <InputField
        label="Pedidos por día"
        value={values.pedidosDia}
        onChange={set("pedidosDia")}
        hint="Número medio de pedidos diarios"
        suffix="uds"
      />
      <InputField
        label="Minutos por pedido"
        value={values.minutosPorPedido}
        onChange={set("minutosPorPedido")}
        hint="Tiempo medio de gestión manual"
        suffix="min"
      />
      <InputField
        label="Personas implicadas"
        value={values.personas}
        onChange={set("personas")}
        hint="Personas que tocan cada pedido"
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
        label="Errores o incidencias al mes"
        value={values.erroresMes}
        onChange={set("erroresMes")}
        hint="Pedidos con error, duplicados o reclamaciones"
        suffix="uds"
      />
      <InputField
        label="Coste estimado por error"
        value={values.costePorError}
        onChange={set("costePorError")}
        hint="Tiempo + devoluciones + impacto cliente"
        suffix="€"
      />
    </div>
  );
}
