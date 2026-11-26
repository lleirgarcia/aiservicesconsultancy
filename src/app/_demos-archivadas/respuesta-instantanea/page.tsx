import type { Metadata } from "next";
import { RespuestaInstantanea } from "./RespuestaInstantanea";

export const metadata: Metadata = {
  title: "Demo · Respuesta multicanal con IA — Kroomix",
  description: "IA que responde al instante en email, WhatsApp, web y llamadas perdidas.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <RespuestaInstantanea />;
}
