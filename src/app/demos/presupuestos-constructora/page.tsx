import type { Metadata } from "next";
import { PresupuestoEditor } from "./PresupuestoEditor";

export const metadata: Metadata = {
  title: "Demo · Presupuestos para constructora — Kroomix",
  description:
    "Ejemplo interactivo: editor de presupuestos con cálculo automático de márgenes y totales.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PresupuestoEditor />;
}
