"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import AreaSelector from "./AreaSelector";
import Results from "./Results";
import Button from "@/components/ui/Button";
import VentasForm from "@/components/forms/VentasForm";
import StockForm from "@/components/forms/StockForm";
import AdminForm from "@/components/forms/AdminForm";
import LogisticaForm from "@/components/forms/LogisticaForm";
import ComercialForm from "@/components/forms/ComercialForm";
import {
  calcularVentas,
  calcularStock,
  calcularAdmin,
  calcularLogistica,
  calcularComercial,
} from "@/lib/calculators";
import type { AreaId } from "@/lib/constants";
import type {
  ResultadoCalculo,
  VentasInputs,
  StockInputs,
  AdminInputs,
  LogisticaInputs,
  ComercialInputs,
} from "@/lib/types";

interface Props {
  onContactClick: () => void;
}

const AREA_TITLES: Record<AreaId, string> = {
  ventas: "Ventas / Pedidos",
  stock: "Stock",
  admin: "Administración",
  logistica: "Logística",
  comercial: "Comercial",
};

export default function Simulator({ onContactClick }: Props) {
  const [selectedArea, setSelectedArea] = useState<AreaId | null>(null);
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);
  const pendingCalc = useRef<(() => ResultadoCalculo) | null>(null);

  useEffect(() => {
    pendingCalc.current = null;
    setResultado(null);
  }, [selectedArea]);

  const handleVentas = useCallback((inputs: VentasInputs) => {
    pendingCalc.current = () => calcularVentas(inputs);
  }, []);
  const handleStock = useCallback((inputs: StockInputs) => {
    pendingCalc.current = () => calcularStock(inputs);
  }, []);
  const handleAdmin = useCallback((inputs: AdminInputs) => {
    pendingCalc.current = () => calcularAdmin(inputs);
  }, []);
  const handleLogistica = useCallback((inputs: LogisticaInputs) => {
    pendingCalc.current = () => calcularLogistica(inputs);
  }, []);
  const handleComercial = useCallback((inputs: ComercialInputs) => {
    pendingCalc.current = () => calcularComercial(inputs);
  }, []);

  const handleProcesar = () => {
    if (pendingCalc.current) setResultado(pendingCalc.current());
  };

  return (
    <section id="simulador" className="px-6 py-16 max-w-4xl mx-auto">
      <hr className="section-rule mb-16" />

      <p className="text-xs font-medium uppercase tracking-widest mb-6" style={{ color: "var(--muted)" }}>
        Calculadora
      </p>
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
        Calcula tu coste oculto
      </h2>
      <p className="mb-10" style={{ color: "var(--muted)" }}>
        Selecciona un área, ajusta los valores a tu realidad y pulsa Procesar.
      </p>

      {/* Selector de área */}
      <AreaSelector selected={selectedArea} onSelect={setSelectedArea} />

      {/* Formulario */}
      {selectedArea && (
        <div className="mt-10 flex flex-col gap-8">
          <div>
            <p className="text-xs uppercase tracking-widest font-medium mb-6" style={{ color: "var(--muted)" }}>
              {AREA_TITLES[selectedArea]} — datos del proceso
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              {selectedArea === "ventas" && <VentasForm onChange={handleVentas} />}
              {selectedArea === "stock" && <StockForm onChange={handleStock} />}
              {selectedArea === "admin" && <AdminForm onChange={handleAdmin} />}
              {selectedArea === "logistica" && <LogisticaForm onChange={handleLogistica} />}
              {selectedArea === "comercial" && <ComercialForm onChange={handleComercial} />}
            </div>
          </div>

          {/* Acción */}
          <div className="flex items-center gap-4">
            <Button onClick={handleProcesar}>
              Procesar →
            </Button>
            {resultado && (
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                Modifica los valores y vuelve a procesar para actualizar.
              </span>
            )}
          </div>

          {/* Resultados */}
          {resultado && (
            <Results resultado={resultado} onContactClick={onContactClick} />
          )}
        </div>
      )}
    </section>
  );
}
