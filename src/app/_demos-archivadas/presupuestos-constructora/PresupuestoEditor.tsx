"use client";

import { useMemo, useState } from "react";
import {
  CATALOGO,
  PRESUPUESTO_INICIAL,
  type DatosPresupuesto,
  type LineaPresupuesto,
} from "./data";
import { calcularTotales, formatoEuro, formatoFecha } from "./calculos";
import { PresupuestoPreview } from "./PresupuestoPreview";

const inputBase: React.CSSProperties = {
  background: "var(--bg)",
  border: "1px solid var(--border)",
  color: "var(--fg)",
  fontSize: "13px",
  padding: "6px 8px",
  width: "100%",
  borderRadius: 4,
  outline: "none",
};

const cellBase: React.CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid var(--border)",
  verticalAlign: "top",
};

const headerCell: React.CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid var(--border)",
  fontSize: "10px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--muted)",
  fontWeight: 600,
  textAlign: "left",
  background: "var(--bg-soft)",
};

let nextLineId = 100;
const generarId = () => `l${++nextLineId}`;

export function PresupuestoEditor() {
  const [data, setData] = useState<DatosPresupuesto>(PRESUPUESTO_INICIAL);
  const [vista, setVista] = useState<"editor" | "preview">("editor");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("");

  const totales = useMemo(() => calcularTotales(data, CATALOGO), [data]);

  const updateLinea = (id: string, patch: Partial<LineaPresupuesto>) => {
    setData((d) => ({
      ...d,
      lineas: d.lineas.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
  };

  const eliminarLinea = (id: string) => {
    setData((d) => ({ ...d, lineas: d.lineas.filter((l) => l.id !== id) }));
  };

  const duplicarLinea = (id: string) => {
    setData((d) => {
      const idx = d.lineas.findIndex((l) => l.id === id);
      if (idx < 0) return d;
      const copia: LineaPresupuesto = { ...d.lineas[idx], id: generarId() };
      const nuevas = [...d.lineas];
      nuevas.splice(idx + 1, 0, copia);
      return { ...d, lineas: nuevas };
    });
  };

  const moverLinea = (id: string, delta: number) => {
    setData((d) => {
      const idx = d.lineas.findIndex((l) => l.id === id);
      const nuevoIdx = idx + delta;
      if (idx < 0 || nuevoIdx < 0 || nuevoIdx >= d.lineas.length) return d;
      const nuevas = [...d.lineas];
      const [item] = nuevas.splice(idx, 1);
      nuevas.splice(nuevoIdx, 0, item);
      return { ...d, lineas: nuevas };
    });
  };

  const añadirPartida = (partidaId: string) => {
    if (!partidaId) return;
    setData((d) => ({
      ...d,
      lineas: [
        ...d.lineas,
        { id: generarId(), partidaId, cantidad: 1, margen: 18, descuento: 0 },
      ],
    }));
  };

  const categorias = useMemo(
    () => Array.from(new Set(CATALOGO.map((p) => p.categoria))),
    [],
  );

  const partidasFiltradas = filtroCategoria
    ? CATALOGO.filter((p) => p.categoria === filtroCategoria)
    : CATALOGO;

  return (
    <div className="px-5 sm:px-8 py-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="label-accent mb-3">
            <span className="text-xs font-medium uppercase tracking-widest">
              Demo · Presupuestos
            </span>
          </div>
          <h1
            className="font-headline text-2xl sm:text-3xl"
            style={{ color: "var(--fg)", letterSpacing: "-0.02em" }}
          >
            Editor de presupuestos para constructora
          </h1>
          <p className="text-sm mt-2 max-w-2xl" style={{ color: "var(--muted)" }}>
            Selecciona partidas del catálogo, ajusta cantidades y márgenes, y genera el documento
            listo para enviar al cliente. Sin Word, sin calculadora, sin errores arrastrados.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setVista("editor")}
            className="text-xs font-medium uppercase tracking-widest px-4 py-2"
            style={{
              border: "1px solid var(--border)",
              background: vista === "editor" ? "var(--bg-elevated)" : "transparent",
              color: vista === "editor" ? "var(--fg)" : "var(--muted)",
              cursor: "pointer",
            }}
          >
            Editor
          </button>
          <button
            onClick={() => setVista("preview")}
            className="text-xs font-medium uppercase tracking-widest px-4 py-2"
            style={{
              border: "1px solid var(--border)",
              background: vista === "preview" ? "var(--bg-elevated)" : "transparent",
              color: vista === "preview" ? "var(--fg)" : "var(--muted)",
              cursor: "pointer",
            }}
          >
            Vista cliente
          </button>
        </div>
      </div>

      {vista === "editor" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <div className="space-y-8 min-w-0">
            <Seccion titulo="Cliente y obra">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Campo label="Cliente">
                  <input
                    style={inputBase}
                    value={data.cliente.nombre}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        cliente: { ...d.cliente, nombre: e.target.value },
                      }))
                    }
                  />
                </Campo>
                <Campo label="NIF / CIF">
                  <input
                    style={inputBase}
                    value={data.cliente.nif}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        cliente: { ...d.cliente, nif: e.target.value },
                      }))
                    }
                  />
                </Campo>
                <Campo label="Dirección fiscal">
                  <input
                    style={inputBase}
                    value={data.cliente.direccion}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        cliente: { ...d.cliente, direccion: e.target.value },
                      }))
                    }
                  />
                </Campo>
                <Campo label="Título de la obra">
                  <input
                    style={inputBase}
                    value={data.obra.titulo}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        obra: { ...d.obra, titulo: e.target.value },
                      }))
                    }
                  />
                </Campo>
                <Campo label="Dirección de la obra">
                  <input
                    style={inputBase}
                    value={data.obra.direccion}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        obra: { ...d.obra, direccion: e.target.value },
                      }))
                    }
                  />
                </Campo>
                <Campo label="Validez (días)">
                  <input
                    type="number"
                    min={1}
                    style={inputBase}
                    value={data.validezDias}
                    onChange={(e) =>
                      setData((d) => ({ ...d, validezDias: Number(e.target.value) || 0 }))
                    }
                  />
                </Campo>
              </div>
            </Seccion>

            <Seccion titulo={`Partidas (${data.lineas.length})`}>
              <div className="overflow-x-auto">
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
                  <thead>
                    <tr>
                      <th style={{ ...headerCell, width: 40 }}>#</th>
                      <th style={headerCell}>Partida</th>
                      <th style={{ ...headerCell, width: 80 }}>Cant.</th>
                      <th style={{ ...headerCell, width: 80 }}>Margen %</th>
                      <th style={{ ...headerCell, width: 80 }}>Dto. %</th>
                      <th style={{ ...headerCell, width: 110, textAlign: "right" }}>Total</th>
                      <th style={{ ...headerCell, width: 110 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {totales.lineasCalc.map((lc, idx) => (
                      <tr key={lc.linea.id}>
                        <td
                          style={{
                            ...cellBase,
                            color: "var(--muted)",
                            fontFamily: "var(--font-geist-mono)",
                            fontSize: 11,
                          }}
                        >
                          {String(idx + 1).padStart(2, "0")}
                        </td>
                        <td style={cellBase}>
                          {lc.partida ? (
                            <div>
                              <div style={{ fontSize: 12, color: "var(--fg)", fontWeight: 500 }}>
                                {lc.partida.descripcion}
                              </div>
                              <div
                                style={{
                                  fontSize: 10,
                                  color: "var(--muted)",
                                  marginTop: 2,
                                  letterSpacing: "0.04em",
                                  textTransform: "uppercase",
                                }}
                              >
                                {lc.partida.categoria} · {lc.partida.unidad} ·{" "}
                                {formatoEuro(lc.precioCoste)} coste →{" "}
                                {formatoEuro(lc.precioVenta)} venta
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: "var(--muted)" }}>Partida no encontrada</span>
                          )}
                        </td>
                        <td style={cellBase}>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            style={{ ...inputBase, padding: "4px 6px" }}
                            value={lc.linea.cantidad}
                            onChange={(e) =>
                              updateLinea(lc.linea.id, {
                                cantidad: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                          />
                        </td>
                        <td style={cellBase}>
                          <input
                            type="number"
                            min={0}
                            step="1"
                            style={{ ...inputBase, padding: "4px 6px" }}
                            value={lc.linea.margen}
                            onChange={(e) =>
                              updateLinea(lc.linea.id, {
                                margen: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                          />
                        </td>
                        <td style={cellBase}>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="1"
                            style={{ ...inputBase, padding: "4px 6px" }}
                            value={lc.linea.descuento}
                            onChange={(e) =>
                              updateLinea(lc.linea.id, {
                                descuento: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                              })
                            }
                          />
                        </td>
                        <td
                          style={{
                            ...cellBase,
                            textAlign: "right",
                            fontFamily: "var(--font-geist-mono)",
                            fontSize: 13,
                            color: "var(--fg)",
                            fontWeight: 600,
                          }}
                        >
                          {formatoEuro(lc.totalLinea)}
                        </td>
                        <td style={cellBase}>
                          <div style={{ display: "flex", gap: 4 }}>
                            <BotonIcono
                              label="Subir"
                              onClick={() => moverLinea(lc.linea.id, -1)}
                              disabled={idx === 0}
                            >
                              ↑
                            </BotonIcono>
                            <BotonIcono
                              label="Bajar"
                              onClick={() => moverLinea(lc.linea.id, 1)}
                              disabled={idx === totales.lineasCalc.length - 1}
                            >
                              ↓
                            </BotonIcono>
                            <BotonIcono
                              label="Duplicar"
                              onClick={() => duplicarLinea(lc.linea.id)}
                            >
                              ⧉
                            </BotonIcono>
                            <BotonIcono
                              label="Eliminar"
                              onClick={() => eliminarLinea(lc.linea.id)}
                            >
                              ×
                            </BotonIcono>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                className="mt-4 p-4"
                style={{
                  background: "var(--bg-soft)",
                  border: "1px dashed var(--border)",
                }}
              >
                <div
                  className="text-[10px] font-medium uppercase tracking-widest mb-2"
                  style={{ color: "var(--muted)" }}
                >
                  Añadir partida del catálogo
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    style={{ ...inputBase, maxWidth: 200 }}
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                  >
                    <option value="">Todas las categorías</option>
                    {categorias.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <select
                    style={inputBase}
                    value=""
                    onChange={(e) => añadirPartida(e.target.value)}
                  >
                    <option value="">Selecciona una partida…</option>
                    {partidasFiltradas.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.categoria}] {p.descripcion} ({formatoEuro(
                          p.precioMaterial + p.precioManoObra,
                        )}/{p.unidad})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Seccion>

            <Seccion titulo="Notas y condiciones">
              <textarea
                rows={5}
                style={{ ...inputBase, fontSize: 13, lineHeight: 1.5 }}
                value={data.notas}
                onChange={(e) => setData((d) => ({ ...d, notas: e.target.value }))}
              />
            </Seccion>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div
              className="p-5"
              style={{
                background: "var(--bg-soft)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="text-[10px] font-medium uppercase tracking-widest mb-3"
                style={{ color: "var(--muted)" }}
              >
                Resumen económico
              </div>
              <Fila etiqueta="Coste material + mano de obra" valor={totales.costeTotal} />
              <Fila
                etiqueta={`Base imponible`}
                valor={totales.baseImponible}
                strong
              />
              <Fila etiqueta={`IVA ${data.iva}%`} valor={totales.iva} />
              <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: "12px 0" }} />
              <div className="flex items-baseline justify-between">
                <span className="text-sm" style={{ color: "var(--muted)" }}>
                  Total cliente
                </span>
                <span
                  className="big-number"
                  style={{ color: "var(--accent)" }}
                >
                  {formatoEuro(totales.total)}
                </span>
              </div>
            </div>

            <div
              className="p-5"
              style={{
                background: "var(--bg-soft)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="text-[10px] font-medium uppercase tracking-widest mb-3"
                style={{ color: "var(--muted)" }}
              >
                Análisis interno
              </div>
              <Fila etiqueta="Beneficio bruto" valor={totales.beneficio} />
              <Fila
                etiqueta="Margen global"
                valor={totales.margenGlobal}
                sufijo="%"
              />
              <Fila etiqueta="Líneas" valor={data.lineas.length} crudo />
            </div>

            <div
              className="p-5"
              style={{
                background: "var(--bg-soft)",
                border: "1px solid var(--accent)",
              }}
            >
              <div
                className="text-[10px] font-medium uppercase tracking-widest mb-2"
                style={{ color: "var(--accent)" }}
              >
                ¿Esto es lo que necesitas?
              </div>
              <p className="text-xs mb-4" style={{ color: "var(--muted-hi)", lineHeight: 1.5 }}>
                Kroomix integra esto con tu catálogo real, tu CRM y la firma del cliente. El
                presupuesto se genera, se envía y se acepta sin pasar por Word.
              </p>
              <a
                href="/?seccion=contacto"
                className="text-xs font-medium uppercase tracking-widest"
                style={{ color: "var(--fg)", textDecoration: "underline" }}
              >
                Hablar con Kroomix →
              </a>
            </div>
          </aside>
        </div>
      )}

      {vista === "preview" && (
        <PresupuestoPreview data={data} totales={totales} fechaFormato={formatoFecha(data.fecha)} />
      )}
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        className="text-xs font-medium uppercase tracking-widest mb-3"
        style={{ color: "var(--muted)" }}
      >
        {titulo}
      </h2>
      <div
        style={{
          background: "var(--bg-soft)",
          border: "1px solid var(--border)",
          padding: "20px",
        }}
      >
        {children}
      </div>
    </section>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span
        className="text-[10px] font-medium uppercase tracking-widest mb-1.5 block"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function Fila({
  etiqueta,
  valor,
  strong,
  crudo,
  sufijo,
}: {
  etiqueta: string;
  valor: number;
  strong?: boolean;
  crudo?: boolean;
  sufijo?: string;
}) {
  const formato = crudo
    ? String(valor)
    : sufijo === "%"
      ? `${valor.toFixed(1)} %`
      : formatoEuro(valor);
  return (
    <div className="flex items-baseline justify-between py-1">
      <span className="text-xs" style={{ color: "var(--muted)" }}>
        {etiqueta}
      </span>
      <span
        style={{
          fontFamily: "var(--font-geist-mono)",
          fontSize: 13,
          color: strong ? "var(--fg)" : "var(--muted-hi)",
          fontWeight: strong ? 700 : 500,
        }}
      >
        {formato}
      </span>
    </div>
  );
}

function BotonIcono({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      style={{
        width: 24,
        height: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid var(--border)",
        background: "transparent",
        color: disabled ? "var(--border)" : "var(--muted-hi)",
        cursor: disabled ? "default" : "pointer",
        fontSize: 13,
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}
