import type { Metadata } from "next";
import { AlbaranesFirma } from "./AlbaranesFirma";

export const metadata: Metadata = {
  title: "Demo · Albaranes con firma móvil — Kroomix",
  description:
    "Conductor confirma entrega desde el móvil; el cliente firma; la oficina lo ve al instante.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AlbaranesFirma />;
}
