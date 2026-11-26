"use client";

import { useMemo, useState } from "react";
import {
  COMERCIALES,
  LEADS_INICIALES,
  type CanalLead,
  type EstadoLead,
  type Lead,
} from "./data";

const cardBase: React.CSSProperties = {
  background: "var(--bg-soft)",
  border: "1px solid var(--border)",
};

const ICONOS_CANAL: Record<CanalLead, string> = {
  email: "✉",
  whatsapp: "◉",
  telefono: "☏",
  web: "◐",
  referido: "★",
};

const COLUMNAS: { estado: EstadoLead; titulo: string }[] = [
  { estado: "nuevo", titulo: "Nuevos" },
  { estado: "contactado", titulo: "Contactados" },
  { estado: "calificado", titulo: "Calificados" },
  { estado: "propuesta", titulo: "Propuesta" },
  { estado: "ganado", titulo: "Ganados" },
];

function formatoEuro(v: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

let asignacionContador = 0;

export function CrmLeads() {
  const [leads, setLeads] = useState<Lead[]>(LEADS_INICIALES);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  const asignarAuto = (id: string) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const ordenado = [...COMERCIALES].sort((a, b) => {
          const cargaA = prev.filter((x) => x.comercialId === a.id && x.estado !== "ganado").length;
          const cargaB = prev.filter((x) => x.comercialId === b.id && x.estado !== "ganado").length;
          return cargaA - cargaB;
        });
        const elegido = ordenado[asignacionContador++ % ordenado.length];
        return {
          ...l,
          comercialId: elegido.id,
          estado: "contactado",
          alerta: "ninguna",
          ultimaInteraccion: new Date().toISOString(),
          historial: [
            {
              id: `h-${Date.now()}`,
              tipo: "asignacion",
              texto: `Asignado automáticamente a ${elegido.nombre} (carga balanceada)`,
              hace: "ahora",
            },
            ...l.historial,
          ],
        };
      }),
    );
  };

  const avanzarEstado = (id: string) => {
    const orden: EstadoLead[] = ["nuevo", "contactado", "calificado", "propuesta", "ganado"];
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const idx = orden.indexOf(l.estado);
        const siguiente = orden[Math.min(idx + 1, orden.length - 1)];
        if (siguiente === l.estado) return l;
        return {
          ...l,
          estado: siguiente,
          alerta: "ninguna",
          ultimaInteraccion: new Date().toISOString(),
          historial: [
            {
              id: `h-${Date.now()}`,
              tipo: "estado",
              texto: `Avanzado a ${siguiente}`,
              hace: "ahora",
            },
            ...l.historial,
          ],
        };
      }),
    );
  };

  const reiniciar = () => setLeads(LEADS_INICIALES);

  const stats = useMemo(() => {
    const sinAsignar = leads.filter((l) => !l.comercialId).length;
    const conAlerta = leads.filter(
      (l) => l.alerta && l.alerta !== "ninguna",
    ).length;
    const ganadoMes = leads
      .filter((l) => l.estado === "ganado")
      .reduce((a, l) => a + l.importeEstimado, 0);
    const pipeline = leads
      .filter((l) => l.estado !== "ganado" && l.estado !== "perdido")
      .reduce((a, l) => a + l.importeEstimado, 0);
    return { sinAsignar, conAlerta, ganadoMes, pipeline };
  }, [leads]);

  const leadSeleccionado = useMemo(
    () => leads.find((l) => l.id === seleccionado) ?? null,
    [leads, seleccionado],
  );

  return (
    <div className="px-5 sm:px-8 py-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <div className="label-accent mb-3">
          <span className="text-xs font-medium uppercase tracking-widest">
            Demo · CRM con asignación automática
          </span>
        </div>
        <h1
          className="font-headline text-2xl sm:text-3xl"
          style={{ color: "var(--fg)", letterSpacing: "-0.02em" }}
        >
          Cada lead tiene un dueño desde el segundo cero.
        </h1>
        <p className="text-sm mt-2 max-w-3xl" style={{ color: "var(--muted)" }}>
          Los contactos entran de cualquier canal y se asignan automáticamente al comercial con
          menos carga. Si no hay respuesta en 24 h salta una alerta. Si el comercial se va, el
          historial queda con la empresa.
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <KPI label="Sin asignar" valor={String(stats.sinAsignar)} acento={stats.sinAsignar > 0} />
        <KPI label="Con alerta" valor={String(stats.conAlerta)} acento={stats.conAlerta > 0} />
        <KPI label="Ganado este mes" valor={formatoEuro(stats.ganadoMes)} mono />
        <KPI label="Pipeline activo" valor={formatoEuro(stats.pipeline)} mono />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4 p-3" style={cardBase}>
        <span
          className="text-[10px] font-medium uppercase tracking-widest"
          style={{ color: "var(--muted)" }}
        >
          Comerciales:
        </span>
        {COMERCIALES.map((c) => {
          const carga = leads.filter(
            (l) => l.comercialId === c.id && l.estado !== "ganado",
          ).length;
          return (
            <div
              key={c.id}
              className="flex items-center gap-2 px-3 py-1.5"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "var(--accent-dim)",
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontFamily: "var(--font-geist-mono)",
                  fontWeight: 700,
                }}
              >
                {c.iniciales}
              </span>
              <span style={{ fontSize: 11.5, color: "var(--fg)" }}>{c.nombre}</span>
              <span className="text-[10px]" style={{ color: "var(--muted)" }}>
                {carga}/{c.capacidad}
              </span>
            </div>
          );
        })}
        <div style={{ flex: 1 }} />
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
          ↺ Reiniciar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] gap-4">
        <section style={cardBase} className="flex flex-col min-h-0">
          <Encabezado titulo="Pipeline" sub={`${leads.length} leads`} />
          <div style={{ padding: 12, overflowX: "auto" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${COLUMNAS.length}, minmax(180px, 1fr))`,
                gap: 8,
              }}
            >
              {COLUMNAS.map((col) => {
                const enColumna = leads.filter((l) => l.estado === col.estado);
                return (
                  <div key={col.estado} className="min-w-0">
                    <div
                      className="text-[10px] font-medium uppercase tracking-widest mb-2 px-1"
                      style={{ color: "var(--muted)" }}
                    >
                      {col.titulo} · {enColumna.length}
                    </div>
                    <div className="space-y-2">
                      {enColumna.map((l) => (
                        <Tarjeta
                          key={l.id}
                          lead={l}
                          seleccionado={seleccionado === l.id}
                          onClick={() => setSeleccionado(l.id)}
                        />
                      ))}
                      {enColumna.length === 0 && (
                        <div
                          style={{
                            padding: 12,
                            border: "1px dashed var(--border)",
                            background: "var(--bg)",
                            fontSize: 10,
                            color: "var(--muted)",
                            textAlign: "center",
                          }}
                        >
                          —
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section style={cardBase} className="flex flex-col min-h-0">
          <Encabezado titulo="Detalle del lead" sub={leadSeleccionado?.id} />
          <div style={{ padding: 16 }}>
            {!leadSeleccionado ? (
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  fontSize: 12,
                  color: "var(--muted)",
                }}
              >
                Selecciona un lead para ver el historial completo y las acciones disponibles.
              </div>
            ) : (
              <DetalleLead
                lead={leadSeleccionado}
                onAsignar={asignarAuto}
                onAvanzar={avanzarEstado}
              />
            )}
          </div>
        </section>
      </div>

      <CTAKroomix />
    </div>
  );
}

function KPI({
  label,
  valor,
  mono,
  acento,
}: {
  label: string;
  valor: string;
  mono?: boolean;
  acento?: boolean;
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
          color: acento ? "var(--accent)" : "var(--fg)",
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
        <span
          className="text-[10px] uppercase tracking-widest"
          style={{ color: "var(--muted)", fontFamily: "var(--font-geist-mono)" }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

function Tarjeta({
  lead,
  seleccionado,
  onClick,
}: {
  lead: Lead;
  seleccionado: boolean;
  onClick: () => void;
}) {
  const comercial = COMERCIALES.find((c) => c.id === lead.comercialId);
  const tieneAlerta = lead.alerta && lead.alerta !== "ninguna";
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: 10,
        background: seleccionado ? "var(--bg-elevated)" : "var(--bg)",
        border: tieneAlerta
          ? "1px solid var(--accent)"
          : seleccionado
            ? "1px solid var(--accent)"
            : "1px solid var(--border)",
        cursor: "pointer",
        display: "block",
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-[9.5px] uppercase tracking-widest"
          style={{ color: "var(--muted)" }}
        >
          <span style={{ color: "var(--accent)", marginRight: 4 }}>
            {ICONOS_CANAL[lead.canal]}
          </span>
          {lead.canal}
        </span>
        {tieneAlerta && (
          <span
            className="text-[9px] uppercase tracking-widest"
            style={{ color: "var(--accent)", fontWeight: 600 }}
          >
            ⚠
          </span>
        )}
      </div>
      <div style={{ fontSize: 12, color: "var(--fg)", fontWeight: 500, lineHeight: 1.35 }}>
        {lead.empresa === "—" ? lead.nombre : lead.empresa}
      </div>
      <div className="text-[10px] mt-0.5" style={{ color: "var(--muted)", lineHeight: 1.35 }}>
        {lead.asunto}
      </div>
      <div className="flex items-center justify-between mt-2">
        <span
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 11,
            color: "var(--accent)",
            fontWeight: 600,
          }}
        >
          {formatoEuro(lead.importeEstimado)}
        </span>
        {comercial ? (
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "var(--accent-dim)",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontFamily: "var(--font-geist-mono)",
              fontWeight: 700,
            }}
          >
            {comercial.iniciales}
          </span>
        ) : (
          <span
            className="text-[9px] uppercase tracking-widest"
            style={{ color: "var(--accent)", fontWeight: 600 }}
          >
            sin asignar
          </span>
        )}
      </div>
    </button>
  );
}

function DetalleLead({
  lead,
  onAsignar,
  onAvanzar,
}: {
  lead: Lead;
  onAsignar: (id: string) => void;
  onAvanzar: (id: string) => void;
}) {
  const comercial = COMERCIALES.find((c) => c.id === lead.comercialId);
  const alertaTexto: Record<string, string> = {
    sin_asignar: "Sin asignar — asignación automática pendiente",
    sla_24h: "Sin respuesta del cliente — SLA superado",
    sin_actividad_72h: "Sin actividad desde hace más de 72 h",
  };
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 2 }}>
          {lead.empresa === "—" ? lead.nombre : lead.empresa}
        </div>
        <div className="text-[11px]" style={{ color: "var(--muted)" }}>
          {lead.contacto}
        </div>
      </div>

      {lead.alerta && lead.alerta !== "ninguna" && (
        <div
          style={{
            padding: 10,
            background: "var(--accent-dim)",
            borderLeft: "2px solid var(--accent)",
            fontSize: 11.5,
            color: "var(--accent)",
            fontWeight: 600,
          }}
        >
          ⚠ {alertaTexto[lead.alerta]}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Dato label="Asunto" valor={lead.asunto} />
        <Dato label="Importe est." valor={formatoEuro(lead.importeEstimado)} mono />
        <Dato label="Estado" valor={lead.estado} />
        <Dato
          label="Comercial"
          valor={comercial ? `${comercial.nombre}` : "Sin asignar"}
        />
        {lead.proximoSeguimiento && (
          <Dato label="Próximo seguimiento" valor={lead.proximoSeguimiento} />
        )}
      </div>

      <div className="flex gap-2">
        {!lead.comercialId && (
          <button
            onClick={() => onAsignar(lead.id)}
            className="flex-1 text-[11px] uppercase tracking-widest px-3 py-2"
            style={{
              border: "1px solid var(--accent)",
              background: "var(--accent-dim)",
              color: "var(--accent)",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            ▶ Asignar automáticamente
          </button>
        )}
        {lead.comercialId && lead.estado !== "ganado" && (
          <button
            onClick={() => onAvanzar(lead.id)}
            className="flex-1 text-[11px] uppercase tracking-widest px-3 py-2"
            style={{
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--fg)",
              cursor: "pointer",
            }}
          >
            → Avanzar etapa
          </button>
        )}
      </div>

      <div>
        <div
          className="text-[10px] font-medium uppercase tracking-widest mb-2"
          style={{ color: "var(--muted)" }}
        >
          Historial completo · queda con la empresa
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {lead.historial.map((ev) => (
            <li
              key={ev.id}
              style={{
                padding: "8px 0",
                borderLeft: "1px solid var(--border)",
                paddingLeft: 12,
                fontSize: 11.5,
                color: "var(--muted-hi)",
                position: "relative",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: -3,
                  top: 12,
                  width: 5,
                  height: 5,
                  background:
                    ev.tipo === "alerta"
                      ? "var(--accent)"
                      : ev.tipo === "estado"
                        ? "var(--accent)"
                        : "var(--muted)",
                  borderRadius: "50%",
                }}
              />
              <div>{ev.texto}</div>
              <div className="text-[10px]" style={{ color: "var(--muted)" }}>
                {ev.hace}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Dato({ label, valor, mono }: { label: string; valor: string; mono?: boolean }) {
  return (
    <div
      style={{
        padding: 8,
        background: "var(--bg)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        className="text-[9px] font-medium uppercase tracking-widest"
        style={{ color: "var(--muted)", marginBottom: 2 }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 11.5,
          color: "var(--fg)",
          fontFamily: mono ? "var(--font-geist-mono)" : "inherit",
          textTransform: mono ? undefined : "capitalize",
          lineHeight: 1.4,
        }}
      >
        {valor}
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
        ¿Cuántas oportunidades pierdes por contestar tarde?
      </div>
      <p
        className="text-sm mb-4"
        style={{ color: "var(--muted-hi)", lineHeight: 1.6, maxWidth: 720 }}
      >
        Kroomix conecta tu web, WhatsApp, email y centralita con un CRM (Pipedrive, HubSpot,
        Holded, Odoo) configurado a tu medida. Asignación automática, alertas SLA y historial
        completo para que ningún contacto se enfríe.
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
