import type { Metadata } from "next";
import { CrmLeads } from "./CrmLeads";

export const metadata: Metadata = {
  title: "Demo · CRM con asignación automática — Kroomix",
  description: "Pipeline de leads multicanal con asignación automática y alertas SLA.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CrmLeads />;
}
