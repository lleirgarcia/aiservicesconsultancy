import type { Metadata } from "next";
import { BandejaInteligente } from "./BandejaInteligente";

export const metadata: Metadata = {
  title: "Demo · Asesoría con IA — Kroomix",
  description:
    "La IA lee los emails entrantes, identifica el tipo de documento y lo archiva en la carpeta del cliente.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <BandejaInteligente />;
}
