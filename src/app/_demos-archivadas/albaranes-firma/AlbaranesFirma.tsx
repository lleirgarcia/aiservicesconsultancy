"use client";

import { useMemo, useRef, useState } from "react";
import {
  CONDUCTORES,
  ENTREGAS_INICIALES,
  type Entrega,
  type EstadoEntrega,
} from "./data";

const cardBase: React.CSSProperties = {
  background: "var(--bg-soft)",
  border: "1px solid var(--border)",
};

export function AlbaranesFirma() {
  const [entregas, setEntregas] = useState<Entrega[]>(ENTREGAS_INICIALES);
  const [vistaMovil, setVistaMovil] = useState<string | null>(entregas[0]?.id ?? null);
  const [conductorActivo, setConductorActivo] = useState<string>("Jordi Riera");

  const cambiarEstado = (id: string, nuevo: EstadoEntrega) => {
    setEntregas((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, estado: nuevo, horaReal: nuevo === "entregado" ? horaActual() : e.horaReal } : e,
      ),
    );
  };

  const guardarFirma = (id: string, firmante: string, svgPath: string, notas?: string) => {
    setEntregas((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              estado: "entregado",
              horaReal: horaActual(),
              firmaName: firmante,
              firmaSvgPath: svgPath,
              notas,
            }
          : e,
      ),
    );
  };

  const reportarIncidencia = (id: string, motivo: string) => {
    setEntregas((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, estado: "incidencia", horaReal: horaActual(), notas: motivo }
          : e,
      ),
    );
  };

  const reiniciar = () => setEntregas(ENTREGAS_INICIALES);

  const entregasConductor = useMemo(
    () => entregas.filter((e) => e.conductor === conductorActivo),
    [entregas, conductorActivo],
  );

  const stats = useMemo(() => {
    const total = entregas.length;
    const entregadas = entregas.filter((e) => e.estado === "entregado").length;
    const incidencias = entregas.filter((e) => e.estado === "incidencia").length;
    return { total, entregadas, incidencias, pct: Math.round((entregadas / total) * 100) };
  }, [entregas]);

  const entregaSeleccionada = useMemo(
    () => entregasConductor.find((e) => e.id === vistaMovil) ?? entregasConductor[0],
    [entregasConductor, vistaMovil],
  );

  return (
    <div className="px-5 sm:px-8 py-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <div className="label-accent mb-3">
          <span className="text-xs font-medium uppercase tracking-widest">
            Demo · Albaranes con firma móvil
          </span>
        </div>
        <h1
          className="font-headline text-2xl sm:text-3xl"
          style={{ color: "var(--fg)", letterSpacing: "-0.02em" }}
        >
          Adiós a los albaranes en papel.
        </h1>
        <p className="text-sm mt-2 max-w-3xl" style={{ color: "var(--muted)" }}>
          El conductor confirma cada entrega desde el móvil: el cliente firma en pantalla y la
          oficina lo ve al instante. Sin esperar al final del día, sin papeles ilegibles.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-4 p-3" style={cardBase}>
        <span
          className="text-[10px] font-medium uppercase tracking-widest"
          style={{ color: "var(--muted)" }}
        >
          Móvil del conductor:
        </span>
        {CONDUCTORES.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setConductorActivo(c.nombre);
              const primera = entregas.find((e) => e.conductor === c.nombre);
              if (primera) setVistaMovil(primera.id);
            }}
            className="text-[10.5px] uppercase tracking-widest px-3 py-1.5 flex items-center gap-2"
            style={{
              border: conductorActivo === c.nombre ? "1px solid var(--accent)" : "1px solid var(--border)",
              background: conductorActivo === c.nombre ? "var(--accent-dim)" : "transparent",
              color: conductorActivo === c.nombre ? "var(--accent)" : "var(--muted-hi)",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            <span style={{ fontFamily: "var(--font-geist-mono)" }}>{c.iniciales}</span>
            {c.nombre}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <Stat label="Entregadas" valor={`${stats.entregadas}/${stats.total}`} acento />
        <Stat label="Incidencias" valor={String(stats.incidencias)} />
        <Stat label="% completado" valor={`${stats.pct}%`} mono />
        <button
          onClick={reiniciar}
          className="text-[10px] uppercase tracking-widest px-3 py-1.5"
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

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] gap-4">
        <section className="flex justify-center">
          <MovilConductor
            entrega={entregaSeleccionada}
            entregas={entregasConductor}
            seleccionado={entregaSeleccionada?.id ?? null}
            onSeleccionar={setVistaMovil}
            onCambiarEstado={cambiarEstado}
            onGuardarFirma={guardarFirma}
            onIncidencia={reportarIncidencia}
            conductorActivo={conductorActivo}
          />
        </section>

        <section style={cardBase} className="flex flex-col min-h-0">
          <Encabezado
            titulo="Vista de oficina"
            sub="Tiempo real · todas las rutas"
          />
          <div style={{ padding: 14, maxHeight: 640, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
              <thead>
                <tr>
                  <Th>Albarán</Th>
                  <Th>Cliente</Th>
                  <Th>Conductor</Th>
                  <Th>Estado</Th>
                  <Th>Hora</Th>
                </tr>
              </thead>
              <tbody>
                {entregas.map((e) => (
                  <tr key={e.id}>
                    <Td mono>{e.numeroAlbaran}</Td>
                    <Td>
                      <div style={{ color: "var(--fg)", fontWeight: 500 }}>{e.cliente}</div>
                      <div className="text-[10px]" style={{ color: "var(--muted)" }}>
                        {e.bultos} bultos · {e.peso}
                      </div>
                    </Td>
                    <Td>{e.conductor}</Td>
                    <Td>
                      <BadgeEstado estado={e.estado} />
                    </Td>
                    <Td mono>
                      {e.horaReal ? (
                        <span style={{ color: "var(--accent)" }}>{e.horaReal}</span>
                      ) : (
                        <span style={{ color: "var(--muted)" }}>{e.horaPrevista}</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-6">
              <div
                className="text-[10px] font-medium uppercase tracking-widest mb-2"
                style={{ color: "var(--muted)" }}
              >
                Firmas recibidas
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {entregas
                  .filter((e) => e.firmaSvgPath)
                  .map((e) => (
                    <div
                      key={e.id}
                      style={{
                        padding: 10,
                        background: "var(--bg)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div className="text-[10px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                        {e.numeroAlbaran} · {e.cliente}
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          height: 60,
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border)",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <svg width="100%" height="100%" viewBox="0 0 240 60" preserveAspectRatio="xMidYMid meet">
                          <path
                            d={e.firmaSvgPath}
                            stroke="var(--accent)"
                            strokeWidth="1.5"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div className="text-[10px] mt-1" style={{ color: "var(--muted-hi)" }}>
                        Firmado por {e.firmaName} · {e.horaReal}
                      </div>
                    </div>
                  ))}
                {entregas.every((e) => !e.firmaSvgPath) && (
                  <div
                    style={{
                      padding: 16,
                      border: "1px dashed var(--border)",
                      background: "var(--bg)",
                      fontSize: 11,
                      color: "var(--muted)",
                      textAlign: "center",
                      gridColumn: "1 / -1",
                    }}
                  >
                    Las firmas aparecerán aquí cuando los conductores las recojan.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <CTAKroomix />
    </div>
  );
}

function horaActual() {
  return new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function Stat({
  label,
  valor,
  acento,
  mono,
}: {
  label: string;
  valor: string;
  acento?: boolean;
  mono?: boolean;
}) {
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
          fontFamily: mono ? "var(--font-geist-mono)" : "inherit",
          fontSize: 13,
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

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        padding: "8px 8px",
        borderBottom: "1px solid var(--border)",
        fontSize: 9.5,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "var(--muted)",
        fontWeight: 600,
        textAlign: "left",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td
      style={{
        padding: "8px 8px",
        borderBottom: "1px solid var(--border)",
        fontFamily: mono ? "var(--font-geist-mono)" : "inherit",
        color: "var(--muted-hi)",
        fontSize: 11.5,
        verticalAlign: "top",
      }}
    >
      {children}
    </td>
  );
}

function BadgeEstado({ estado }: { estado: EstadoEntrega }) {
  const map: Record<EstadoEntrega, { color: string; label: string }> = {
    pendiente: { color: "var(--muted)", label: "○ Pendiente" },
    en_ruta: { color: "var(--muted-hi)", label: "● En ruta" },
    entregado: { color: "var(--accent)", label: "✓ Entregado" },
    incidencia: { color: "#ff9b6a", label: "⚠ Incidencia" },
  };
  const { color, label } = map[estado];
  return (
    <span
      className="text-[10px] uppercase tracking-widest"
      style={{ color, fontWeight: 600 }}
    >
      {label}
    </span>
  );
}

function MovilConductor({
  entrega,
  entregas,
  seleccionado,
  onSeleccionar,
  onCambiarEstado,
  onGuardarFirma,
  onIncidencia,
  conductorActivo,
}: {
  entrega: Entrega | undefined;
  entregas: Entrega[];
  seleccionado: string | null;
  onSeleccionar: (id: string) => void;
  onCambiarEstado: (id: string, estado: EstadoEntrega) => void;
  onGuardarFirma: (id: string, firmante: string, svg: string, notas?: string) => void;
  onIncidencia: (id: string, motivo: string) => void;
  conductorActivo: string;
}) {
  const [modo, setModo] = useState<"lista" | "firma" | "incidencia">("lista");

  return (
    <div
      style={{
        width: 340,
        background: "var(--bg-elevated)",
        borderRadius: 36,
        padding: 8,
        border: "1px solid var(--border)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <div
        style={{
          background: "var(--bg)",
          borderRadius: 28,
          overflow: "hidden",
          minHeight: 600,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "14px 16px 12px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-soft)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                Reparto · {conductorActivo}
              </div>
              <div style={{ fontSize: 14, color: "var(--fg)", fontWeight: 600 }}>
                {entregas.length} entregas hoy
              </div>
            </div>
            <span
              className="text-[10px] uppercase tracking-widest"
              style={{ color: "var(--accent)" }}
            >
              ● online
            </span>
          </div>
        </div>

        {modo === "lista" && (
          <div style={{ padding: 10, flex: 1, overflowY: "auto" }}>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }} className="space-y-2">
              {entregas.map((e) => {
                const sel = seleccionado === e.id;
                return (
                  <li key={e.id}>
                    <button
                      onClick={() => onSeleccionar(e.id)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: 10,
                        background: sel ? "var(--bg-elevated)" : "var(--bg)",
                        border: sel ? "1px solid var(--accent)" : "1px solid var(--border)",
                        cursor: "pointer",
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-[10px] uppercase tracking-widest"
                          style={{ color: "var(--muted)", fontFamily: "var(--font-geist-mono)" }}
                        >
                          {e.numeroAlbaran}
                        </span>
                        <BadgeEstado estado={e.estado} />
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--fg)", fontWeight: 500 }}>
                        {e.cliente}
                      </div>
                      <div className="text-[10px]" style={{ color: "var(--muted)", lineHeight: 1.4 }}>
                        {e.direccion}
                      </div>
                      <div className="text-[10px] mt-1" style={{ color: "var(--muted)" }}>
                        {e.bultos} bultos · {e.peso} · prevista {e.horaPrevista}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            {entrega && entrega.estado !== "entregado" && entrega.estado !== "incidencia" && (
              <div className="mt-3 space-y-2">
                {entrega.estado === "pendiente" && (
                  <button
                    onClick={() => onCambiarEstado(entrega.id, "en_ruta")}
                    className="w-full text-[11px] uppercase tracking-widest px-3 py-2.5"
                    style={{
                      border: "1px solid var(--border)",
                      background: "var(--bg)",
                      color: "var(--fg)",
                      cursor: "pointer",
                    }}
                  >
                    → Iniciar ruta a {entrega.cliente}
                  </button>
                )}
                {entrega.estado === "en_ruta" && (
                  <>
                    <button
                      onClick={() => setModo("firma")}
                      className="w-full text-[11px] uppercase tracking-widest px-3 py-2.5"
                      style={{
                        border: "1px solid var(--accent)",
                        background: "var(--accent-dim)",
                        color: "var(--accent)",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      ✓ Confirmar entrega y firmar
                    </button>
                    <button
                      onClick={() => setModo("incidencia")}
                      className="w-full text-[11px] uppercase tracking-widest px-3 py-2.5"
                      style={{
                        border: "1px solid var(--border)",
                        background: "transparent",
                        color: "var(--muted-hi)",
                        cursor: "pointer",
                      }}
                    >
                      ⚠ Reportar incidencia
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {modo === "firma" && entrega && (
          <PantallaFirma
            entrega={entrega}
            onCancelar={() => setModo("lista")}
            onConfirmar={(firmante, svg, notas) => {
              onGuardarFirma(entrega.id, firmante, svg, notas);
              setModo("lista");
            }}
          />
        )}

        {modo === "incidencia" && entrega && (
          <PantallaIncidencia
            entrega={entrega}
            onCancelar={() => setModo("lista")}
            onConfirmar={(motivo) => {
              onIncidencia(entrega.id, motivo);
              setModo("lista");
            }}
          />
        )}
      </div>
    </div>
  );
}

function PantallaFirma({
  entrega,
  onCancelar,
  onConfirmar,
}: {
  entrega: Entrega;
  onCancelar: () => void;
  onConfirmar: (firmante: string, svg: string, notas?: string) => void;
}) {
  const [firmante, setFirmante] = useState("");
  const [notas, setNotas] = useState("");
  const [path, setPath] = useState("");
  const dibujandoRef = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const obtenerPunto = (e: React.PointerEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = ((e.clientX - rect.left) / rect.width) * 240;
    const y = ((e.clientY - rect.top) / rect.height) * 110;
    return { x, y };
  };

  return (
    <div style={{ padding: 14, flex: 1, overflowY: "auto" }}>
      <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
        Confirmar entrega · {entrega.numeroAlbaran}
      </div>
      <div style={{ fontSize: 13, color: "var(--fg)", fontWeight: 500, marginBottom: 12 }}>
        {entrega.cliente}
      </div>

      <label
        className="text-[10px] font-medium uppercase tracking-widest"
        style={{ color: "var(--muted)", display: "block", marginBottom: 4 }}
      >
        Nombre de quien recibe
      </label>
      <input
        value={firmante}
        onChange={(e) => setFirmante(e.target.value)}
        placeholder="Ej. Maria Camps"
        style={{
          width: "100%",
          background: "var(--bg-soft)",
          border: "1px solid var(--border)",
          color: "var(--fg)",
          fontSize: 12,
          padding: "8px 10px",
          marginBottom: 12,
        }}
      />

      <label
        className="text-[10px] font-medium uppercase tracking-widest"
        style={{ color: "var(--muted)", display: "block", marginBottom: 4 }}
      >
        Firma del cliente
      </label>
      <div
        style={{
          background: "var(--bg-soft)",
          border: "1px dashed var(--border)",
          height: 130,
          touchAction: "none",
          marginBottom: 6,
        }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 240 110"
          width="100%"
          height="100%"
          onPointerDown={(e) => {
            dibujandoRef.current = true;
            const p = obtenerPunto(e);
            if (!p) return;
            setPath((prev) => (prev ? `${prev} M${p.x.toFixed(1)} ${p.y.toFixed(1)}` : `M${p.x.toFixed(1)} ${p.y.toFixed(1)}`));
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!dibujandoRef.current) return;
            const p = obtenerPunto(e);
            if (!p) return;
            setPath((prev) => `${prev} L${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
          }}
          onPointerUp={() => {
            dibujandoRef.current = false;
          }}
        >
          <path
            d={path}
            stroke="var(--accent)"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {!path && (
            <text
              x="120"
              y="60"
              textAnchor="middle"
              fontSize="11"
              fill="var(--muted)"
              fontFamily="var(--font-inter)"
            >
              Firma aquí con el dedo
            </text>
          )}
        </svg>
      </div>
      <button
        onClick={() => setPath("")}
        className="text-[10px] uppercase tracking-widest mb-3"
        style={{
          color: "var(--muted)",
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        Limpiar firma
      </button>

      <textarea
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
        rows={2}
        placeholder="Notas opcionales (estado del paquete, etc.)"
        style={{
          width: "100%",
          background: "var(--bg-soft)",
          border: "1px solid var(--border)",
          color: "var(--fg)",
          fontSize: 11.5,
          padding: "8px 10px",
          marginBottom: 12,
          resize: "vertical",
        }}
      />

      <div className="flex gap-2">
        <button
          onClick={onCancelar}
          className="flex-1 text-[11px] uppercase tracking-widest px-3 py-2.5"
          style={{
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--muted-hi)",
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
        <button
          onClick={() => {
            if (!firmante.trim() || !path) return;
            onConfirmar(firmante.trim(), path, notas.trim() || undefined);
          }}
          disabled={!firmante.trim() || !path}
          className="flex-1 text-[11px] uppercase tracking-widest px-3 py-2.5"
          style={{
            border: "1px solid var(--accent)",
            background: !firmante.trim() || !path ? "var(--bg-soft)" : "var(--accent-dim)",
            color: !firmante.trim() || !path ? "var(--muted)" : "var(--accent)",
            cursor: !firmante.trim() || !path ? "default" : "pointer",
            fontWeight: 600,
          }}
        >
          ✓ Confirmar
        </button>
      </div>
    </div>
  );
}

function PantallaIncidencia({
  entrega,
  onCancelar,
  onConfirmar,
}: {
  entrega: Entrega;
  onCancelar: () => void;
  onConfirmar: (motivo: string) => void;
}) {
  const [motivo, setMotivo] = useState("");
  return (
    <div style={{ padding: 14, flex: 1 }}>
      <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "var(--accent)" }}>
        ⚠ Reportar incidencia · {entrega.numeroAlbaran}
      </div>
      <div style={{ fontSize: 13, color: "var(--fg)", fontWeight: 500, marginBottom: 12 }}>
        {entrega.cliente}
      </div>
      <label
        className="text-[10px] font-medium uppercase tracking-widest"
        style={{ color: "var(--muted)", display: "block", marginBottom: 4 }}
      >
        Motivo
      </label>
      <textarea
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        rows={4}
        placeholder="Cliente cerrado, dirección errónea, paquete dañado…"
        style={{
          width: "100%",
          background: "var(--bg-soft)",
          border: "1px solid var(--border)",
          color: "var(--fg)",
          fontSize: 12,
          padding: "8px 10px",
          marginBottom: 12,
          resize: "vertical",
        }}
      />
      <div className="flex gap-2">
        <button
          onClick={onCancelar}
          className="flex-1 text-[11px] uppercase tracking-widest px-3 py-2.5"
          style={{
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--muted-hi)",
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
        <button
          onClick={() => motivo.trim() && onConfirmar(motivo.trim())}
          disabled={!motivo.trim()}
          className="flex-1 text-[11px] uppercase tracking-widest px-3 py-2.5"
          style={{
            border: "1px solid var(--accent)",
            background: !motivo.trim() ? "var(--bg-soft)" : "var(--accent-dim)",
            color: !motivo.trim() ? "var(--muted)" : "var(--accent)",
            cursor: !motivo.trim() ? "default" : "pointer",
            fontWeight: 600,
          }}
        >
          Reportar
        </button>
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
        ¿Sigues dependiendo de papeles que se pierden?
      </div>
      <p
        className="text-sm mb-4"
        style={{ color: "var(--muted-hi)", lineHeight: 1.6, maxWidth: 720 }}
      >
        Kroomix monta una app móvil para tus conductores que se sincroniza con tu sistema de
        gestión. Firma del cliente, foto del paquete, geolocalización y estado en tiempo real para
        toda la oficina.
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
