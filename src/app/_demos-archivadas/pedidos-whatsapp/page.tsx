import type { Metadata } from "next";
import { PedidosWhatsApp } from "./PedidosWhatsApp";

export const metadata: Metadata = {
  title: "Demo · Pedidos por WhatsApp → ERP — Kroomix",
  description:
    "La IA convierte mensajes de WhatsApp en líneas de ERP automáticamente.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PedidosWhatsApp />;
}
