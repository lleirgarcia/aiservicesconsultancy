"use client";

import type { DatosPresupuesto } from "./data";
import { formatoEuro } from "./calculos";
import type { calcularTotales } from "./calculos";

type Totales = ReturnType<typeof calcularTotales>;

interface Props {
  data: DatosPresupuesto;
  totales: Totales;
  fechaFormato: string;
}

export function PresupuestoPreview({ data, totales, fechaFormato }: Props) {
  return (
    <div
      className="mx-auto"
      style={{
        maxWidth: 860,
        background: "var(--bg-soft)",
        color: "var(--fg)",
        padding: "48px 56px",
        border: "1px solid var(--border)",
        boxShadow: "0 4px 32px rgba(0,0,0,0.5)",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        fontSize: 12.5,
        lineHeight: 1.6,
      }}
    >
      <div
        className="flex items-start justify-between mb-12 pb-6"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div>
          <div
            className="label-accent"
            style={{ marginBottom: 12 }}
          >
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--muted)",
                fontWeight: 500,
              }}
            >
              Presupuesto
            </span>
          </div>
          <div
            className="font-headline"
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--fg)",
            }}
          >
            {data.numero}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
            Emitido el {fechaFormato} · Válido durante {data.validezDias} días
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            className="font-headline"
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--fg)",
              letterSpacing: "-0.01em",
            }}
          >
            Constructora demo
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.55, marginTop: 4 }}>
            B66000000
            <br />
            Carrer Industrial 8
            <br />
            08570 Torelló (Barcelona)
            <br />
            obras@constructora-demo.cat
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-10">
        <BloqueDatos titulo="Cliente">
          <strong style={{ color: "var(--fg)" }}>{data.cliente.nombre}</strong>
          <br />
          {data.cliente.nif}
          <br />
          {data.cliente.direccion}
        </BloqueDatos>
        <BloqueDatos titulo="Obra">
          <strong style={{ color: "var(--fg)" }}>{data.obra.titulo}</strong>
          <br />
          {data.obra.direccion}
        </BloqueDatos>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: 24,
        }}
      >
        <thead>
          <tr>
            <Th style={{ width: 30 }}>#</Th>
            <Th>Descripción</Th>
            <Th style={{ width: 60, textAlign: "right" }}>Cant.</Th>
            <Th style={{ width: 50, textAlign: "right" }}>Ud.</Th>
            <Th style={{ width: 100, textAlign: "right" }}>P. unitario</Th>
            <Th style={{ width: 110, textAlign: "right" }}>Importe</Th>
          </tr>
        </thead>
        <tbody>
          {totales.lineasCalc.map((lc, idx) => (
            <tr key={lc.linea.id}>
              <Td style={{ color: "var(--muted)" }}>
                {String(idx + 1).padStart(2, "0")}
              </Td>
              <Td>
                <span style={{ color: "var(--fg)" }}>
                  {lc.partida?.descripcion ?? "—"}
                </span>
                {lc.linea.descuento > 0 && (
                  <span style={{ color: "var(--muted)", fontStyle: "italic" }}>
                    {" "}
                    (descuento {lc.linea.descuento}%)
                  </span>
                )}
              </Td>
              <Td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {lc.linea.cantidad}
              </Td>
              <Td style={{ textAlign: "right", color: "var(--muted)" }}>
                {lc.partida?.unidad ?? "—"}
              </Td>
              <Td
                style={{
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: 11.5,
                }}
              >
                {formatoEuro(lc.precioVenta)}
              </Td>
              <Td
                style={{
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                  fontFamily: "var(--font-geist-mono)",
                  fontWeight: 600,
                  color: "var(--fg)",
                }}
              >
                {formatoEuro(lc.totalLinea)}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-12">
        <table style={{ minWidth: 300, borderCollapse: "collapse" }}>
          <tbody>
            <FilaTotal
              etiqueta="Base imponible"
              valor={formatoEuro(totales.baseImponible)}
            />
            <FilaTotal etiqueta={`IVA ${data.iva}%`} valor={formatoEuro(totales.iva)} />
            <tr>
              <td
                className="font-headline"
                style={{
                  padding: "14px 0 4px",
                  borderTop: "1px solid var(--accent)",
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--fg)",
                }}
              >
                Total
              </td>
              <td
                style={{
                  padding: "14px 0 4px",
                  borderTop: "1px solid var(--accent)",
                  textAlign: "right",
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: 22,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--accent)",
                }}
              >
                {formatoEuro(totales.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {data.notas && (
        <div
          className="label-accent"
          style={{
            paddingLeft: 16,
            marginBottom: 32,
            color: "var(--muted-hi)",
            fontSize: 11.5,
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--muted)",
              marginBottom: 8,
              fontWeight: 600,
            }}
          >
            Notas y condiciones
          </div>
          {data.notas}
        </div>
      )}

      <div
        className="grid grid-cols-2 gap-12 pt-8"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <Firma label="Por la empresa" />
        <Firma label="Aceptación del cliente" />
      </div>
    </div>
  );
}

function BloqueDatos({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 9.5,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: 8,
          fontWeight: 600,
        }}
      >
        {titulo}
      </div>
      <div style={{ fontSize: 12, color: "var(--muted-hi)", lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

function Th({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <th
      style={{
        padding: "10px 8px",
        borderBottom: "1px solid var(--accent)",
        fontSize: 9.5,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "var(--muted-hi)",
        fontWeight: 600,
        textAlign: "left",
        ...style,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <td
      style={{
        padding: "9px 8px",
        borderBottom: "1px solid var(--border)",
        fontSize: 11.5,
        color: "var(--muted-hi)",
        verticalAlign: "top",
        ...style,
      }}
    >
      {children}
    </td>
  );
}

function FilaTotal({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <tr>
      <td style={{ padding: "4px 16px 4px 0", color: "var(--muted)", fontSize: 11.5 }}>
        {etiqueta}
      </td>
      <td
        style={{
          padding: "4px 0",
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
          fontFamily: "var(--font-geist-mono)",
          fontSize: 12.5,
          color: "var(--muted-hi)",
          fontWeight: 500,
        }}
      >
        {valor}
      </td>
    </tr>
  );
}

function Firma({ label }: { label: string }) {
  return (
    <div>
      <div
        style={{
          height: 56,
          borderBottom: "1px dashed var(--border)",
        }}
      />
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginTop: 8,
          fontWeight: 500,
        }}
      >
        {label}
      </div>
    </div>
  );
}
