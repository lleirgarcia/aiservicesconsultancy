"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CLIENTES,
  MENSAJES_INICIALES,
  type LineaExtraida,
  type MensajeWhatsApp,
} from "./data";
import {
  extraerPedido,
  formatoEuro,
  formatoHora,
  tiempoRelativo,
  type PasoExtraccion,
  type ResultadoExtraccion,
  type ResultadoTipo,
} from "./extractor";

type EstadoMensaje = "pendiente" | "procesando" | "procesado";

interface MensajeEnEjecucion {
  mensaje: MensajeWhatsApp;
  estado: EstadoMensaje;
  resultado?: ResultadoExtraccion;
  pasosVistos: PasoExtraccion[];
}

interface FilaERP {
  id: string;
  numero: string;
  clienteNombre: string;
  lineas: LineaExtraida[];
  total: number;
  tipo: ResultadoTipo;
  fechaEntrega?: string;
  estado: "pendiente_validacion" | "incidencia" | "consulta";
  esUrgente: boolean;
  hayAmbiguedad: boolean;
  confianza: number;
  insertadoEn: string;
}

const cardBase: React.CSSProperties = {
  background: "var(--bg-soft)",
  border: "1px solid var(--border)",
};

let nextNumeroPedido = 4231;

export function PedidosWhatsApp() {
  const [mensajes, setMensajes] = useState<MensajeEnEjecucion[]>(() =>
    MENSAJES_INICIALES.map((m) => ({ mensaje: m, estado: "pendiente", pasosVistos: [] })),
  );
  const [erp, setErp] = useState<FilaERP[]>([]);
  const [enFoco, setEnFoco] = useState<string | null>(null);
  const [auto, setAuto] = useState(false);
  const [velocidad, setVelocidad] = useState<"normal" | "rapido">("normal");
  const procesandoRef = useRef<Set<string>>(new Set());

  const factor = velocidad === "rapido" ? 0.35 : 1;

  const procesarMensaje = async (id: string) => {
    if (procesandoRef.current.has(id)) return;
    procesandoRef.current.add(id);
    const target = mensajes.find((m) => m.mensaje.id === id);
    if (!target || target.estado !== "pendiente") {
      procesandoRef.current.delete(id);
      return;
    }
    const resultado = extraerPedido(target.mensaje);
    setEnFoco(id);
    setMensajes((prev) =>
      prev.map((m) =>
        m.mensaje.id === id
          ? { ...m, estado: "procesando", resultado, pasosVistos: [] }
          : m,
      ),
    );

    for (const paso of resultado.pasos) {
      await new Promise((r) => setTimeout(r, paso.duracionMs * factor));
      setMensajes((prev) =>
        prev.map((m) =>
          m.mensaje.id === id ? { ...m, pasosVistos: [...m.pasosVistos, paso] } : m,
        ),
      );
    }

    await new Promise((r) => setTimeout(r, 240 * factor));

    setMensajes((prev) =>
      prev.map((m) => (m.mensaje.id === id ? { ...m, estado: "procesado" } : m)),
    );

    if (resultado.tipo === "pedido") {
      const numero = `PED-2026-${String(nextNumeroPedido++).padStart(5, "0")}`;
      setErp((prev) => [
        {
          id: `${id}-${numero}`,
          numero,
          clienteNombre: resultado.clienteNombre,
          lineas: resultado.lineas,
          total: resultado.total,
          tipo: resultado.tipo,
          fechaEntrega: resultado.fechaEntrega,
          estado: "pendiente_validacion",
          esUrgente: resultado.esUrgente,
          hayAmbiguedad: resultado.hayAmbiguedad,
          confianza: resultado.confianzaGlobal,
          insertadoEn: new Date().toISOString(),
        },
        ...prev,
      ]);
    } else {
      const prefijo = resultado.tipo === "incidencia" ? "INC" : "CON";
      setErp((prev) => [
        {
          id: `${id}-${prefijo}`,
          numero: `${prefijo}-${String(nextNumeroPedido++).padStart(5, "0")}`,
          clienteNombre: resultado.clienteNombre,
          lineas: [],
          total: 0,
          tipo: resultado.tipo,
          estado: resultado.tipo === "incidencia" ? "incidencia" : "consulta",
          esUrgente: false,
          hayAmbiguedad: false,
          confianza: resultado.confianzaGlobal,
          insertadoEn: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
    procesandoRef.current.delete(id);
  };

  useEffect(() => {
    if (!auto) return;
    let cancelado = false;
    (async () => {
      for (const m of mensajes) {
        if (cancelado) return;
        if (m.estado === "pendiente") {
          await procesarMensaje(m.mensaje.id);
          if (cancelado) return;
          await new Promise((r) => setTimeout(r, 260 * factor));
        }
      }
    })();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  const reiniciar = () => {
    procesandoRef.current.clear();
    setAuto(false);
    setErp([]);
    setEnFoco(null);
    setMensajes(
      MENSAJES_INICIALES.map((m) => ({ mensaje: m, estado: "pendiente", pasosVistos: [] })),
    );
  };

  const ejecucionEnFoco = useMemo(
    () => mensajes.find((m) => m.mensaje.id === enFoco) ?? null,
    [mensajes, enFoco],
  );

  const stats = useMemo(() => {
    const total = mensajes.length;
    const procesados = mensajes.filter((m) => m.estado === "procesado").length;
    const pedidos = erp.filter((f) => f.tipo === "pedido");
    const facturable = pedidos.reduce((acc, f) => acc + f.total, 0);
    const minutosAhorrados = procesados * 6;
    return {
      total,
      procesados,
      pendientes: mensajes.filter((m) => m.estado === "pendiente").length,
      pedidosCreados: pedidos.length,
      facturable,
      minutosAhorrados,
    };
  }, [mensajes, erp]);

  return (
    <div className="px-5 sm:px-8 py-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <div className="label-accent mb-3">
          <span className="text-xs font-medium uppercase tracking-widest">
            Demo · Pedidos por WhatsApp
          </span>
        </div>
        <h1
          className="font-headline text-2xl sm:text-3xl"
          style={{ color: "var(--fg)", letterSpacing: "-0.02em" }}
        >
          La IA lee los pedidos por WhatsApp y los inserta solos en tu ERP.
        </h1>
        <p className="text-sm mt-2 max-w-3xl" style={{ color: "var(--muted)" }}>
          El cliente escribe como habla. La IA identifica el cliente por el teléfono, mapea cada
          producto a su SKU del catálogo, resuelve cantidades ambiguas con histórico y crea el
          pedido en el ERP. Las consultas e incidencias se separan automáticamente.
        </p>
      </header>

      <div
        className="flex flex-wrap items-center gap-3 mb-6 p-4"
        style={{ ...cardBase }}
      >
        <button
          onClick={() => setAuto(true)}
          disabled={auto || stats.pendientes === 0}
          className="text-xs font-medium uppercase tracking-widest px-4 py-2"
          style={{
            border: "1px solid var(--accent)",
            background: auto ? "var(--bg-elevated)" : "var(--accent-dim)",
            color: auto ? "var(--muted)" : "var(--accent)",
            cursor: auto || stats.pendientes === 0 ? "default" : "pointer",
          }}
        >
          {auto ? "Procesando…" : "▶ Procesar todo"}
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
          ↺ Reiniciar
        </button>
        <div style={{ width: 1, height: 24, background: "var(--border)" }} />
        <label className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
          Velocidad
          <select
            value={velocidad}
            onChange={(e) => setVelocidad(e.target.value as "normal" | "rapido")}
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--fg)",
              fontSize: 12,
              padding: "4px 8px",
            }}
          >
            <option value="normal">Normal</option>
            <option value="rapido">Rápido</option>
          </select>
        </label>
        <div style={{ flex: 1 }} />
        <Stat label="Pendientes" valor={String(stats.pendientes)} />
        <Stat label="Pedidos creados" valor={String(stats.pedidosCreados)} acento />
        <Stat label="Facturable" valor={formatoEuro(stats.facturable)} />
        <Stat label="Tiempo ahorrado" valor={`${stats.minutosAhorrados} min`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)_minmax(0,400px)] gap-4">
        {/* Chat WhatsApp */}
        <section style={cardBase} className="flex flex-col min-h-0">
          <Encabezado
            titulo="WhatsApp Business"
            sub={`${stats.pendientes} sin procesar`}
          />
          <div
            style={{
              padding: "12px 12px",
              maxHeight: 640,
              overflowY: "auto",
              background:
                "repeating-linear-gradient(0deg, var(--bg-soft), var(--bg-soft) 24px, rgba(255,255,255,0.01) 24px, rgba(255,255,255,0.01) 25px)",
            }}
          >
            {mensajes.map((m) => (
              <BurbujaMensaje
                key={m.mensaje.id}
                mensaje={m}
                seleccionado={enFoco === m.mensaje.id}
                onClick={() => {
                  setEnFoco(m.mensaje.id);
                  if (m.estado === "pendiente") procesarMensaje(m.mensaje.id);
                }}
              />
            ))}
          </div>
        </section>

        {/* Razonamiento */}
        <section style={cardBase} className="flex flex-col min-h-0">
          <Encabezado
            titulo="Extractor IA"
            sub={ejecucionEnFoco ? "Razonamiento en vivo" : "Selecciona un mensaje"}
          />
          <div style={{ padding: 20, flex: 1, minHeight: 320 }}>
            {!ejecucionEnFoco ? <EstadoVacio /> : <RazonamientoVivo ejecucion={ejecucionEnFoco} />}
          </div>
        </section>

        {/* ERP */}
        <section style={cardBase} className="flex flex-col min-h-0">
          <Encabezado titulo="ERP — Pedidos creados" sub={`${erp.length} entradas`} />
          <div style={{ padding: 12, maxHeight: 640, overflowY: "auto" }}>
            {erp.length === 0 && (
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
                El ERP está vacío. A medida que la IA procese mensajes, los pedidos aparecerán
                aquí.
              </div>
            )}
            <div className="space-y-3">
              {erp.map((fila) => (
                <FilaErp key={fila.id} fila={fila} />
              ))}
            </div>
          </div>
        </section>
      </div>

      <CTAKroomix />
    </div>
  );
}

function Stat({ label, valor, acento }: { label: string; valor: string; acento?: boolean }) {
  return (
    <div className="flex flex-col items-end">
      <span
        className="text-[9.5px] font-medium uppercase tracking-widest"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-geist-mono)",
          fontSize: 14,
          fontWeight: 700,
          color: acento ? "var(--accent)" : "var(--fg)",
        }}
      >
        {valor}
      </span>
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

function BurbujaMensaje({
  mensaje,
  seleccionado,
  onClick,
}: {
  mensaje: MensajeEnEjecucion;
  seleccionado: boolean;
  onClick: () => void;
}) {
  const cliente = CLIENTES.find((c) => c.id === mensaje.mensaje.clienteId);
  const procesado = mensaje.estado === "procesado";
  const procesando = mensaje.estado === "procesando";

  return (
    <button
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: "8px 4px",
        opacity: procesado ? 0.7 : 1,
        transition: "opacity 0.3s",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "var(--muted)",
          marginBottom: 4,
          letterSpacing: "0.04em",
        }}
      >
        {cliente?.nombre} ·{" "}
        <span style={{ fontFamily: "var(--font-geist-mono)" }}>{cliente?.telefono}</span>
      </div>
      <div
        style={{
          background: seleccionado ? "var(--bg-elevated)" : "var(--bg)",
          border: seleccionado ? "1px solid var(--accent)" : "1px solid var(--border)",
          padding: "10px 12px",
          borderRadius: "0 12px 12px 12px",
          color: "var(--muted-hi)",
          fontSize: 12.5,
          lineHeight: 1.55,
          position: "relative",
        }}
      >
        {mensaje.mensaje.texto}
        <div
          className="flex items-center justify-between"
          style={{ marginTop: 6, gap: 8 }}
        >
          <span
            className="text-[9.5px] uppercase tracking-widest"
            style={{
              color: procesado
                ? "var(--accent)"
                : procesando
                  ? "var(--fg)"
                  : "var(--muted)",
              fontWeight: 600,
            }}
          >
            {procesado ? "✓ procesado" : procesando ? "● procesando" : "○ pendiente"}
            {procesando && (
              <span
                className="blinking-cursor"
                style={{
                  marginLeft: 4,
                  background: "var(--fg)",
                  width: 1.5,
                  height: "0.85em",
                  display: "inline-block",
                }}
              />
            )}
          </span>
          <span className="text-[10px]" style={{ color: "var(--muted)" }}>
            {formatoHora(mensaje.mensaje.recibidoEn)} · {tiempoRelativo(mensaje.mensaje.recibidoEn)}
          </span>
        </div>
      </div>
    </button>
  );
}

function EstadoVacio() {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: "var(--muted)",
        gap: 12,
        minHeight: 280,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          color: "var(--accent)",
        }}
      >
        ⌬
      </div>
      <p className="text-sm" style={{ maxWidth: 280, lineHeight: 1.55 }}>
        Pulsa un mensaje o «Procesar todo» para ver cómo la IA convierte un texto libre en una
        línea de ERP.
      </p>
    </div>
  );
}

function RazonamientoVivo({ ejecucion }: { ejecucion: MensajeEnEjecucion }) {
  const { mensaje, estado, resultado, pasosVistos } = ejecucion;
  const completo = estado === "procesado" && resultado;

  return (
    <div className="flex flex-col gap-5">
      <div
        style={{
          padding: 14,
          background: "var(--bg)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="text-[10px] font-medium uppercase tracking-widest mb-2"
          style={{ color: "var(--muted)" }}
        >
          Mensaje en análisis
        </div>
        <div style={{ fontSize: 12.5, color: "var(--muted-hi)", lineHeight: 1.55 }}>
          “{mensaje.texto}”
        </div>
      </div>

      <div>
        <div
          className="text-[10px] font-medium uppercase tracking-widest mb-3"
          style={{ color: "var(--muted)" }}
        >
          Cadena de razonamiento
        </div>
        <ol
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            listStyle: "none",
            padding: 0,
          }}
        >
          {(resultado?.pasos ?? []).map((paso, idx) => {
            const visto = pasosVistos.includes(paso);
            return (
              <li
                key={paso.etiqueta + idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: 12,
                  opacity: visto ? 1 : 0.25,
                  transition: "opacity 0.4s ease",
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    border: visto ? "1px solid var(--accent)" : "1px solid var(--border)",
                    background: visto ? "var(--accent-dim)" : "transparent",
                    color: visto ? "var(--accent)" : "var(--muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontFamily: "var(--font-geist-mono)",
                    flexShrink: 0,
                  }}
                >
                  {visto ? "✓" : idx + 1}
                </div>
                <div>
                  <div
                    className="text-[10px] font-medium uppercase tracking-widest"
                    style={{ color: "var(--muted)" }}
                  >
                    {paso.etiqueta}
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--muted-hi)", lineHeight: 1.5 }}>
                    {paso.texto}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {completo && resultado && (
        <ResumenResultado resultado={resultado} />
      )}
    </div>
  );
}

function ResumenResultado({ resultado }: { resultado: ResultadoExtraccion }) {
  const colorBorder = "var(--accent)";

  if (resultado.tipo !== "pedido") {
    return (
      <div
        style={{
          padding: 16,
          background: "var(--bg)",
          border: `1px solid ${colorBorder}`,
        }}
      >
        <div
          className="text-[10px] font-medium uppercase tracking-widest mb-2"
          style={{ color: "var(--accent)" }}
        >
          {resultado.tipo === "incidencia" ? "Incidencia detectada" : "Consulta detectada"} ·
          Confianza {Math.round(resultado.confianzaGlobal * 100)}%
        </div>
        <p style={{ fontSize: 12.5, color: "var(--muted-hi)", lineHeight: 1.55 }}>
          {resultado.razon}
        </p>
        {resultado.notaCliente && (
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
            Nota: {resultado.notaCliente}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 16,
        background: "var(--bg)",
        border: `1px solid ${colorBorder}`,
      }}
    >
      <div
        className="text-[10px] font-medium uppercase tracking-widest mb-3"
        style={{ color: "var(--accent)" }}
      >
        Pedido extraído · Confianza {Math.round(resultado.confianzaGlobal * 100)}%
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 text-xs" style={{ color: "var(--muted-hi)" }}>
        <Dato label="Cliente" valor={resultado.clienteNombre} />
        {resultado.fechaEntrega && <Dato label="Entrega" valor={resultado.fechaEntrega} />}
        <Dato
          label="Total"
          valor={formatoEuro(resultado.total)}
          mono
        />
        <Dato label="Líneas" valor={String(resultado.lineas.length)} mono />
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
        <thead>
          <tr>
            <Th>SKU</Th>
            <Th>Producto</Th>
            <Th alRight>Cant.</Th>
            <Th alRight>Importe</Th>
          </tr>
        </thead>
        <tbody>
          {resultado.lineas.map((l, i) => (
            <tr key={i}>
              <Td mono>{l.sku}</Td>
              <Td>
                <div>{l.productoNombre}</div>
                <div style={{ fontSize: 10, color: "var(--muted)" }}>{l.formato}</div>
                {l.notaIA && (
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--accent)",
                      marginTop: 2,
                      fontStyle: "italic",
                    }}
                  >
                    ⚠ {l.notaIA}
                  </div>
                )}
              </Td>
              <Td alRight mono>
                {l.cantidad === 0 ? "?" : l.cantidad}
              </Td>
              <Td alRight mono>
                {l.importe === 0 ? "—" : formatoEuro(l.importe)}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>

      {resultado.esUrgente && (
        <div
          style={{
            marginTop: 10,
            padding: "6px 10px",
            background: "var(--accent-dim)",
            color: "var(--accent)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          ⚠ Pedido urgente — notificar a almacén
        </div>
      )}
      {resultado.notaCliente && (
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--muted)", fontStyle: "italic" }}>
          Nota: {resultado.notaCliente}
        </div>
      )}
    </div>
  );
}

function Dato({ label, valor, mono }: { label: string; valor: string; mono?: boolean }) {
  return (
    <div>
      <div
        className="text-[9.5px] font-medium uppercase tracking-widest"
        style={{ color: "var(--muted)", marginBottom: 2 }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 12.5,
          color: "var(--fg)",
          fontWeight: 500,
          fontFamily: mono ? "var(--font-geist-mono)" : "inherit",
          lineHeight: 1.4,
        }}
      >
        {valor}
      </div>
    </div>
  );
}

function Th({ children, alRight }: { children: React.ReactNode; alRight?: boolean }) {
  return (
    <th
      style={{
        padding: "6px 6px",
        borderBottom: "1px solid var(--border)",
        fontSize: 9.5,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "var(--muted)",
        fontWeight: 600,
        textAlign: alRight ? "right" : "left",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  alRight,
  mono,
}: {
  children: React.ReactNode;
  alRight?: boolean;
  mono?: boolean;
}) {
  return (
    <td
      style={{
        padding: "6px 6px",
        borderBottom: "1px solid var(--border)",
        textAlign: alRight ? "right" : "left",
        fontFamily: mono ? "var(--font-geist-mono)" : "inherit",
        color: "var(--muted-hi)",
        verticalAlign: "top",
        fontSize: 11,
      }}
    >
      {children}
    </td>
  );
}

function FilaErp({ fila }: { fila: FilaERP }) {
  const colorEstado =
    fila.tipo === "pedido"
      ? "var(--accent)"
      : fila.tipo === "incidencia"
        ? "#ff9b6a"
        : "var(--muted-hi)";
  const labelEstado =
    fila.tipo === "pedido"
      ? "Pedido · pendiente validación"
      : fila.tipo === "incidencia"
        ? "Incidencia abierta"
        : "Consulta comercial";

  return (
    <div
      style={{
        padding: 12,
        background: "var(--bg)",
        border: `1px solid ${fila.esUrgente ? "var(--accent)" : "var(--border)"}`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 11,
            color: "var(--muted-hi)",
            fontWeight: 600,
          }}
        >
          {fila.numero}
        </span>
        <span
          className="text-[9.5px] uppercase tracking-widest"
          style={{ color: colorEstado, fontWeight: 600 }}
        >
          {labelEstado}
        </span>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--fg)", fontWeight: 500, marginBottom: 4 }}>
        {fila.clienteNombre}
      </div>
      {fila.tipo === "pedido" ? (
        <>
          <div className="flex items-center justify-between text-xs mb-2">
            <span style={{ color: "var(--muted)" }}>{fila.lineas.length} líneas</span>
            <span
              style={{
                fontFamily: "var(--font-geist-mono)",
                color: "var(--accent)",
                fontWeight: 600,
              }}
            >
              {formatoEuro(fila.total)}
            </span>
          </div>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {fila.lineas.map((l, i) => (
              <li
                key={i}
                style={{
                  fontSize: 10.5,
                  fontFamily: "var(--font-geist-mono)",
                  color: "var(--muted)",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span>
                  {l.cantidad || "?"}× {l.sku}
                </span>
                <span>{l.importe ? formatoEuro(l.importe) : "—"}</span>
              </li>
            ))}
          </ul>
          {fila.fechaEntrega && (
            <div
              style={{
                fontSize: 10,
                color: "var(--muted)",
                marginTop: 6,
                paddingTop: 6,
                borderTop: "1px dashed var(--border)",
              }}
            >
              Entrega: {fila.fechaEntrega}
            </div>
          )}
          {(fila.hayAmbiguedad || fila.confianza < 0.85) && (
            <div
              style={{
                marginTop: 6,
                fontSize: 10,
                color: "var(--accent)",
                fontStyle: "italic",
              }}
            >
              Requiere validación humana ({Math.round(fila.confianza * 100)}%)
            </div>
          )}
        </>
      ) : (
        <div className="text-xs" style={{ color: "var(--muted)", lineHeight: 1.5 }}>
          {fila.tipo === "incidencia"
            ? "Ticket abierto en atención al cliente."
            : "Notificación enviada al comercial."}
        </div>
      )}
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
        ¿Quieres esto en tu distribuidora?
      </div>
      <p className="text-sm mb-4" style={{ color: "var(--muted-hi)", lineHeight: 1.6, maxWidth: 720 }}>
        Kroomix conecta tu WhatsApp Business API con tu ERP (Odoo, SAP Business One, Holded,
        Sage…). Los pedidos entran solos, las consultas e incidencias se separan, y el almacén ve
        todo en tiempo real. Tus comerciales se centran en vender, no en copiar mensajes.
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
