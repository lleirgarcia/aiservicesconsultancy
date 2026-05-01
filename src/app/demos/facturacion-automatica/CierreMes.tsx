"use client";

import { createContext, useContext, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { CLIENTES, TRABAJOS_MES, type ClienteFact, type TrabajoMes } from "./data";
import { LogoUploader } from "./LogoUploader";

const BotonDescargaPDF = dynamic(
  () => import("./BotonDescargaPDF").then((m) => m.BotonDescargaPDF),
  { ssr: false, loading: () => <span style={{ fontSize: 10, color: "var(--muted)" }}>…</span> },
);

const LogoContext = createContext<string | null>(null);

interface FacturaGenerada {
  id: string;
  numero: string;
  cliente: ClienteFact;
  trabajos: TrabajoMes[];
  baseImponible: number;
  iva: number;
  total: number;
  generadaEn: string;
  enviadaEn?: string;
  vencimiento: string;
}

const cardBase: React.CSSProperties = {
  background: "var(--bg-soft)",
  border: "1px solid var(--border)",
};

let nextNum = 4087;

function formatoEuro(v: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(v);
}

function calcularVencimiento(diaPago: number): string {
  const d = new Date();
  d.setDate(d.getDate() + diaPago);
  return d.toISOString().slice(0, 10);
}

export function CierreMes() {
  const [facturas, setFacturas] = useState<FacturaGenerada[]>([]);
  const [proceso, setProceso] = useState<"idle" | "validando" | "generando" | "enviando" | "completo">("idle");
  const [clienteEnProceso, setClienteEnProceso] = useState<string | null>(null);
  const [logEventos, setLogEventos] = useState<string[]>([]);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const cancelRef = useRef(false);

  const trabajosPorCliente = useMemo(() => {
    const map = new Map<string, TrabajoMes[]>();
    for (const c of CLIENTES) map.set(c.id, []);
    for (const t of TRABAJOS_MES) map.get(t.clienteId)?.push(t);
    return map;
  }, []);

  const totalesPrev = useMemo(() => {
    let totalBase = 0;
    let totalTrabajos = 0;
    let pendientesValidacion = 0;
    for (const t of TRABAJOS_MES) {
      totalBase += t.importe;
      totalTrabajos += 1;
      if (!t.validado) pendientesValidacion += 1;
    }
    return { totalBase, totalTrabajos, pendientesValidacion };
  }, []);

  const log = (msg: string) =>
    setLogEventos((prev) => [`${new Date().toLocaleTimeString("es-ES")} · ${msg}`, ...prev]);

  const reiniciar = () => {
    cancelRef.current = true;
    setTimeout(() => {
      cancelRef.current = false;
    }, 100);
    setFacturas([]);
    setProceso("idle");
    setClienteEnProceso(null);
    setLogEventos([]);
  };

  const ejecutarCierre = async () => {
    cancelRef.current = false;
    setFacturas([]);
    setLogEventos([]);
    setProceso("validando");
    log("Inicio del cierre mensual — abril 2026");
    await sleep(700);

    log(`Validación de ${TRABAJOS_MES.length} trabajos del mes`);
    await sleep(600);
    if (totalesPrev.pendientesValidacion > 0) {
      log(`⚠ ${totalesPrev.pendientesValidacion} trabajos sin validar — se incluyen en facturación`);
      await sleep(500);
    }

    setProceso("generando");
    for (const cliente of CLIENTES) {
      if (cancelRef.current) return;
      const trabajos = trabajosPorCliente.get(cliente.id) ?? [];
      if (trabajos.length === 0) continue;
      setClienteEnProceso(cliente.id);
      log(`Generando factura para ${cliente.nombre}`);
      await sleep(420);
      const baseImponible = trabajos.reduce((a, t) => a + t.importe, 0);
      const iva = baseImponible * 0.21;
      const total = baseImponible + iva;
      const factura: FacturaGenerada = {
        id: `fact-${cliente.id}`,
        numero: `2026/${String(nextNum++).padStart(4, "0")}`,
        cliente,
        trabajos,
        baseImponible,
        iva,
        total,
        generadaEn: new Date().toISOString(),
        vencimiento: calcularVencimiento(cliente.diaPago),
      };
      setFacturas((prev) => [factura, ...prev]);
      await sleep(300);
    }
    setClienteEnProceso(null);

    if (cancelRef.current) return;
    setProceso("enviando");
    log("Envío masivo por email a clientes");
    await sleep(500);
    for (const cliente of CLIENTES) {
      if (cancelRef.current) return;
      const trabajos = trabajosPorCliente.get(cliente.id) ?? [];
      if (trabajos.length === 0) continue;
      setFacturas((prev) =>
        prev.map((f) =>
          f.cliente.id === cliente.id
            ? { ...f, enviadaEn: new Date().toISOString() }
            : f,
        ),
      );
      log(`✓ Enviada a ${cliente.email}`);
      await sleep(280);
    }

    setProceso("completo");
    log("Cierre mensual completado · 0 errores");
  };

  const stats = useMemo(() => {
    const totalFacturado = facturas.reduce((a, f) => a + f.total, 0);
    return {
      totalFacturado,
      facturasGeneradas: facturas.length,
      facturasEnviadas: facturas.filter((f) => f.enviadaEn).length,
    };
  }, [facturas]);

  return (
    <LogoContext.Provider value={logoDataUrl}>
    <div className="px-5 sm:px-8 py-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <div className="label-accent mb-3">
          <span className="text-xs font-medium uppercase tracking-widest">
            Demo · Cierre mensual automático
          </span>
        </div>
        <h1
          className="font-headline text-2xl sm:text-3xl"
          style={{ color: "var(--fg)", letterSpacing: "-0.02em" }}
        >
          Genera y envía todas las facturas del mes con un solo clic.
        </h1>
        <p className="text-sm mt-2 max-w-3xl" style={{ color: "var(--muted)" }}>
          Cada trabajo cerrado durante el mes queda registrado. Al llegar la fecha de cierre, el
          sistema agrupa los trabajos por cliente, calcula totales, genera las facturas con
          numeración correlativa y las envía. Sin olvidos, sin errores, sin retrasos.
        </p>
      </header>

      <div className="mb-6">
        <LogoUploader logo={logoDataUrl} onChange={setLogoDataUrl} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] gap-4 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPI label="Trabajos del mes" valor={String(totalesPrev.totalTrabajos)} />
          <KPI
            label="Base imponible"
            valor={formatoEuro(totalesPrev.totalBase)}
            mono
          />
          <KPI
            label="Sin validar"
            valor={String(totalesPrev.pendientesValidacion)}
            color={totalesPrev.pendientesValidacion > 0 ? "var(--accent)" : undefined}
          />
          <KPI
            label="Total con IVA"
            valor={formatoEuro(totalesPrev.totalBase * 1.21)}
            mono
            acento
          />
        </div>
        <div style={cardBase} className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span
              className="text-[10px] font-medium uppercase tracking-widest"
              style={{ color: "var(--muted)" }}
            >
              Estado del proceso
            </span>
            <BadgeProceso proceso={proceso} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={ejecutarCierre}
              disabled={proceso !== "idle" && proceso !== "completo"}
              className="text-xs font-medium uppercase tracking-widest px-4 py-2 flex-1"
              style={{
                border: "1px solid var(--accent)",
                background: "var(--accent-dim)",
                color: "var(--accent)",
                cursor: proceso !== "idle" && proceso !== "completo" ? "default" : "pointer",
              }}
            >
              ▶ Ejecutar cierre
            </button>
            <button
              onClick={reiniciar}
              className="text-xs font-medium uppercase tracking-widest px-4 py-2"
              style={{
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--muted-hi)",
                cursor: "pointer",
              }}
            >
              ↺
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] gap-4">
        <section style={cardBase} className="flex flex-col min-h-0">
          <Encabezado
            titulo="Trabajos acumulados por cliente"
            sub={`${CLIENTES.length} clientes · abril 2026`}
          />
          <div style={{ padding: 16, maxHeight: 640, overflowY: "auto" }}>
            <div className="space-y-3">
              {CLIENTES.map((c) => {
                const trabajos = trabajosPorCliente.get(c.id) ?? [];
                const subtotal = trabajos.reduce((a, t) => a + t.importe, 0);
                const enProceso = clienteEnProceso === c.id;
                const facturada = facturas.some((f) => f.cliente.id === c.id);
                return (
                  <ClienteAcordeon
                    key={c.id}
                    cliente={c}
                    trabajos={trabajos}
                    subtotal={subtotal}
                    enProceso={enProceso}
                    facturada={facturada}
                  />
                );
              })}
            </div>
          </div>
        </section>

        <section style={cardBase} className="flex flex-col min-h-0">
          <Encabezado
            titulo="Facturas generadas"
            sub={`${stats.facturasGeneradas} · enviadas ${stats.facturasEnviadas}`}
          />
          <div style={{ padding: 16, maxHeight: 480, overflowY: "auto" }}>
            {facturas.length === 0 ? (
              <div
                style={{
                  padding: 20,
                  border: "1px dashed var(--border)",
                  background: "var(--bg)",
                  fontSize: 12,
                  color: "var(--muted)",
                  textAlign: "center",
                }}
              >
                Sin facturas todavía. Pulsa «Ejecutar cierre».
              </div>
            ) : (
              <div className="space-y-3">
                {facturas.map((f) => (
                  <FilaFactura key={f.id} factura={f} />
                ))}
              </div>
            )}
          </div>
          <div
            style={{
              padding: 14,
              borderTop: "1px solid var(--border)",
              background: "var(--bg)",
            }}
          >
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                Total facturado
              </span>
              <span className="big-number" style={{ color: "var(--accent)" }}>
                {formatoEuro(stats.totalFacturado)}
              </span>
            </div>
          </div>
        </section>
      </div>

      <section style={cardBase} className="mt-4">
        <Encabezado titulo="Log de ejecución" sub={`${logEventos.length} eventos`} />
        <div
          style={{
            padding: 14,
            maxHeight: 240,
            overflowY: "auto",
            fontFamily: "var(--font-geist-mono)",
            fontSize: 11.5,
            lineHeight: 1.7,
            color: "var(--muted-hi)",
          }}
        >
          {logEventos.length === 0 ? (
            <span style={{ color: "var(--muted)" }}>Sin eventos. Inicia el cierre para ver el log.</span>
          ) : (
            logEventos.map((l, i) => <div key={i}>{l}</div>)
          )}
        </div>
      </section>

      <CTAKroomix />
    </div>
    </LogoContext.Provider>
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function KPI({
  label,
  valor,
  mono,
  acento,
  color,
}: {
  label: string;
  valor: string;
  mono?: boolean;
  acento?: boolean;
  color?: string;
}) {
  return (
    <div style={{ ...cardBase, padding: 14 }}>
      <div
        className="text-[9.5px] font-medium uppercase tracking-widest"
        style={{ color: "var(--muted)", marginBottom: 6 }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 18,
          fontFamily: mono ? "var(--font-geist-mono)" : "inherit",
          fontWeight: 700,
          color: color ?? (acento ? "var(--accent)" : "var(--fg)"),
          letterSpacing: "-0.01em",
        }}
      >
        {valor}
      </div>
    </div>
  );
}

function Encabezado({ titulo, sub }: { titulo: string; sub?: string }) {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span
        className="text-xs font-medium uppercase tracking-widest"
        style={{ color: "var(--fg)" }}
      >
        {titulo}
      </span>
      {sub && (
        <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          {sub}
        </span>
      )}
    </div>
  );
}

function BadgeProceso({ proceso }: { proceso: string }) {
  const map: Record<string, { label: string; color: string }> = {
    idle: { label: "○ En espera", color: "var(--muted)" },
    validando: { label: "● Validando trabajos", color: "var(--fg)" },
    generando: { label: "● Generando facturas", color: "var(--fg)" },
    enviando: { label: "● Enviando emails", color: "var(--fg)" },
    completo: { label: "✓ Completado", color: "var(--accent)" },
  };
  const { label, color } = map[proceso] ?? map.idle;
  return (
    <span
      className="text-[10px] uppercase tracking-widest"
      style={{ color, fontWeight: 600 }}
    >
      {label}
    </span>
  );
}

function ClienteAcordeon({
  cliente,
  trabajos,
  subtotal,
  enProceso,
  facturada,
}: {
  cliente: ClienteFact;
  trabajos: TrabajoMes[];
  subtotal: number;
  enProceso: boolean;
  facturada: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div
      style={{
        background: enProceso ? "var(--bg-elevated)" : "var(--bg)",
        border: enProceso ? "1px solid var(--accent)" : "1px solid var(--border)",
        transition: "background 0.2s",
      }}
    >
      <button
        onClick={() => setAbierto((a) => !a)}
        style={{
          width: "100%",
          padding: 14,
          background: "transparent",
          border: "none",
          textAlign: "left",
          cursor: "pointer",
          color: "var(--fg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span
            style={{
              width: 22,
              height: 22,
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              flexShrink: 0,
            }}
          >
            {abierto ? "−" : "+"}
          </span>
          <div className="min-w-0">
            <div style={{ fontSize: 13, fontWeight: 500 }}>{cliente.nombre}</div>
            <div className="text-[10px]" style={{ color: "var(--muted)" }}>
              {trabajos.length} trabajos · pago {cliente.diaPago} días · {cliente.formaPago}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {facturada && (
            <span
              className="text-[10px] uppercase tracking-widest"
              style={{ color: "var(--accent)", fontWeight: 600 }}
            >
              ✓ facturado
            </span>
          )}
          <span
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: 13,
              color: "var(--accent)",
              fontWeight: 600,
            }}
          >
            {formatoEuro(subtotal)}
          </span>
        </div>
      </button>
      {abierto && (
        <div
          style={{
            padding: "0 14px 14px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5, marginTop: 8 }}>
            <tbody>
              {trabajos.map((t) => (
                <tr key={t.id}>
                  <td
                    style={{
                      padding: "6px 6px 6px 0",
                      color: "var(--muted)",
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 10.5,
                      width: 70,
                    }}
                  >
                    {t.fecha}
                  </td>
                  <td style={{ padding: "6px 6px", color: "var(--muted-hi)", lineHeight: 1.4 }}>
                    {t.descripcion}
                    {!t.validado && (
                      <span style={{ marginLeft: 6, color: "var(--accent)", fontStyle: "italic" }}>
                        (sin validar)
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "6px 0 6px 6px",
                      textAlign: "right",
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 11,
                      color: "var(--fg)",
                      width: 80,
                    }}
                  >
                    {formatoEuro(t.importe)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilaFactura({ factura }: { factura: FacturaGenerada }) {
  const enviada = !!factura.enviadaEn;
  const logoDataUrl = useContext(LogoContext);
  return (
    <div
      style={{
        padding: 12,
        background: "var(--bg)",
        border: enviada ? "1px solid var(--accent)" : "1px solid var(--border)",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 12,
            color: "var(--muted-hi)",
            fontWeight: 600,
          }}
        >
          {factura.numero}
        </span>
        <span
          className="text-[9.5px] uppercase tracking-widest"
          style={{ color: enviada ? "var(--accent)" : "var(--muted)", fontWeight: 600 }}
        >
          {enviada ? "✓ Enviada" : "● Generada"}
        </span>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--fg)", fontWeight: 500, marginBottom: 4 }}>
        {factura.cliente.nombre}
      </div>
      <div className="flex items-center justify-between text-[10.5px]" style={{ color: "var(--muted)" }}>
        <span>{factura.trabajos.length} trabajos · venc. {factura.vencimiento}</span>
        <span
          style={{
            fontFamily: "var(--font-geist-mono)",
            color: "var(--accent)",
            fontWeight: 700,
            fontSize: 12.5,
          }}
        >
          {formatoEuro(factura.total)}
        </span>
      </div>
      <div
        className="mt-2 pt-2"
        style={{ borderTop: "1px dashed var(--border)" }}
      >
        <BotonDescargaPDF
          numero={factura.numero}
          fechaEmision={factura.generadaEn}
          vencimiento={factura.vencimiento}
          cliente={factura.cliente}
          trabajos={factura.trabajos}
          baseImponible={factura.baseImponible}
          iva={factura.iva}
          total={factura.total}
          logoDataUrl={logoDataUrl}
        />
      </div>
    </div>
  );
}

function CTAKroomix() {
  return (
    <div
      className="mt-8 p-6"
      style={{
        background: "var(--bg-soft)",
        border: "1px solid var(--accent)",
      }}
    >
      <div
        className="text-[10px] font-medium uppercase tracking-widest mb-2"
        style={{ color: "var(--accent)" }}
      >
        ¿Tu cierre mensual te lleva 2 días?
      </div>
      <p
        className="text-sm mb-4"
        style={{ color: "var(--muted-hi)", lineHeight: 1.6, maxWidth: 720 }}
      >
        Kroomix conecta tu sistema de partes de trabajo con tu programa de facturación (A3,
        Holded, Sage, Odoo, Contasimple…). Las facturas se generan, se envían y se cobran sin que
        nadie tenga que sentarse un viernes a la tarde.
      </p>
      <a
        href="/?seccion=contacto"
        className="text-xs font-medium uppercase tracking-widest"
        style={{ color: "var(--fg)", textDecoration: "underline" }}
      >
        Hablar con Kroomix →
      </a>
    </div>
  );
}
