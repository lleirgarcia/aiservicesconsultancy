"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { FacturaPDF } from "./FacturaPDF";
import type { ClienteFact, TrabajoMes } from "./data";

interface Props {
  numero: string;
  fechaEmision: string;
  vencimiento: string;
  cliente: ClienteFact;
  trabajos: TrabajoMes[];
  baseImponible: number;
  iva: number;
  total: number;
  logoDataUrl?: string | null;
}

function hashCorto(s: string | null | undefined): string {
  if (!s) return "nologo";
  let h = 0;
  for (let i = 0; i < s.length; i += 17) h = (h * 31 + s.charCodeAt(i)) | 0;
  return String(h);
}

export function BotonDescargaPDF(props: Props) {
  const filename = `Factura_${props.numero.replace("/", "-")}_${props.cliente.nombre
    .replace(/[^a-zA-Z0-9]/g, "")}.pdf`;
  const cacheKey = `${props.numero}-${hashCorto(props.logoDataUrl)}`;

  return (
    <PDFDownloadLink
      key={cacheKey}
      document={<FacturaPDF {...props} />}
      fileName={filename}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 10.5,
        fontFamily: "inherit",
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        textDecoration: "none",
        color: "var(--accent)",
        padding: "5px 10px",
        border: "1px solid var(--accent)",
        background: "var(--accent-dim)",
      }}
    >
      {({ loading, error }) =>
        error
          ? "Error PDF"
          : loading
            ? "Preparando…"
            : "↓ Descargar PDF"
      }
    </PDFDownloadLink>
  );
}
