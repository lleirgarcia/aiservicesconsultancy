import type { Metadata } from "next";
import { CierreMes } from "./CierreMes";

export const metadata: Metadata = {
  title: "Demo · Facturación automática a fin de mes — Kroomix",
  description:
    "Cierre mensual automatizado: trabajos del mes agrupados por cliente, factura generada y enviada.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CierreMes />;
}
