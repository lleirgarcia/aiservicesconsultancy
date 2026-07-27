import type { Metadata } from "next";
import { EscenarioChat } from "./EscenarioChat";

export const metadata: Metadata = {
  title: "Demo · Asesoría con IA — Generador de escenarios — Kroomix",
  description:
    "Describe la empresa prospecto y la IA genera un escenario a medida para la demo de bandeja inteligente.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <EscenarioChat />;
}
