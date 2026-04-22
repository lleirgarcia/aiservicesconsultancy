"use client";

import { useState, useEffect } from "react";
import InputField from "@/components/ui/InputField";
import type { AdminInputs } from "@/lib/types";

const DEFAULT: AdminInputs = {
  documentosMes: 200,
  minutosPorDocumento: 12,
  personas: 2,
  costeHora: 18,
  retrabajosMes: 30,
  costePorRetrabajo: 20,
};

interface Props {
  onChange: (inputs: AdminInputs) => void;
}

export default function AdminForm({ onChange }: Props) {
  const [values, setValues] = useState<AdminInputs>(DEFAULT);

  useEffect(() => {
    onChange(values);
  }, [values, onChange]);

  const set = (key: keyof AdminInputs) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <InputField
        label="Documentos al mes"
        value={values.documentosMes}
        onChange={set("documentosMes")}
        hint="Facturas, albaranes, presupuestos, informes"
        suffix="docs"
      />
      <InputField
        label="Minutos por documento"
        value={values.minutosPorDocumento}
        onChange={set("minutosPorDocumento")}
        hint="Tiempo medio de procesado manual"
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
        label="Retrabajos o correcciones al mes"
        value={values.retrabajosMes}
        onChange={set("retrabajosMes")}
        hint="Documentos que hay que repetir o corregir"
        suffix="uds"
      />
      <InputField
        label="Coste estimado por retrabajo"
        value={values.costePorRetrabajo}
        onChange={set("costePorRetrabajo")}
        hint="Tiempo + impacto en proveedor o cliente"
        suffix="€"
      />
    </div>
  );
}
