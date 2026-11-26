import type { Metadata } from "next";
import { PanelFinanciero } from "./PanelFinanciero";

export const metadata: Metadata = {
  title: "Demo · Panel financiero en tiempo real — Kroomix",
  description: "Ingresos, costes y rentabilidad por cliente sin esperar al cierre del mes.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PanelFinanciero />;
}
