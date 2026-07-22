import type { Metadata } from "next";
import KroomixLinks from "./KroomixLinks";

export const metadata: Metadata = {
  title: "Kroomix — Contacto",
  description:
    "Llámanos, escríbenos por WhatsApp o habla con nuestro asistente virtual.",
  robots: { index: false },
};

export default function KroomixLinksPage() {
  return <KroomixLinks />;
}
