import type { Metadata } from "next";
import { Emisor } from "./Emisor";

export const metadata: Metadata = {
  title: "Demo · Asesoría con IA — Emisor de emails — Kroomix",
  description:
    "Envía los emails del cliente ficticio a la bandeja real de la demo de asesoría con IA.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Emisor />;
}
