"use client";

import { useEffect, useMemo, useState } from "react";
import { HISTORICO_12M, PROYECTOS, RENTABILIDAD } from "./data";

const cardBase: React.CSSProperties = {
  background: "var(--bg-soft)",
  border: "1px solid var(--border)",
};

function formatoEuroCompacto(v: number) {
  if (Math.abs(v) >= 1000)
    return `${(v / 1000).toFixed(1).replace(".", ",")} k€`;
  return `${v.toFixed(0)} €`;
}

function formatoEuro(v: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

export function PanelFinanciero() {
  const [tick, setTick] = useState(0);
  const [conectandoFuente, setConectandoFuente] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  // Simulación de "actualización en vivo" — pequeño jitter en último mes
  const ultimo = HISTORICO_12M[HISTORICO_12M.length - 1];
  const ultimoVivo = useMemo(() => {
    const seed = (tick * 137) % 100;
    const ajuste = (seed - 50) * 18;
    return {
      ...ultimo,
      ingresos: ultimo.ingresos + ajuste,
      margen: ultimo.margen + ajuste * 0.7,
    };
  }, [tick, ultimo]);

  const stats = useMemo(() => {
    const mesAnterior = HISTORICO_12M[HISTORICO_12M.length - 2];
    const variacion =
      ((ultimoVivo.ingresos - mesAnterior.ingresos) / mesAnterior.ingresos) * 100;
    const margenPct = (ultimoVivo.margen / ultimoVivo.ingresos) * 100;
    const totalAnio = HISTORICO_12M.reduce((a, m) => a + m.ingresos, 0);
    const totalMargen = HISTORICO_12M.reduce((a, m) => a + m.margen, 0);
    const proyectosCriticos = PROYECTOS.filter((p) => p.alerta === "critica").length;
    const clientesPerdidas = RENTABILIDAD.filter((c) => c.estado === "perdidas").length;
    return {
      ingresoMes: ultimoVivo.ingresos,
      variacion,
      margenPct,
      totalAnio,
      totalMargen,
      proyectosCriticos,
      clientesPerdidas,
    };
  }, [ultimoVivo]);

  const simularFuente = (nombre: string) => {
    setConectandoFuente(nombre);
    setTimeout(() => setConectandoFuente(null), 1400);
  };

  return (
    <div className="px-5 sm:px-8 py-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <div className="label-accent mb-3">
          <span className="text-xs font-medium uppercase tracking-widest">
            Demo · Panel financiero en vivo
          </span>
        </div>
        <h1
          className="font-headline text-2xl sm:text-3xl"
          style={{ color: "var(--fg)", letterSpacing: "-0.02em" }}
        >
          Sabes cómo va el mes sin llamar al contable.
        </h1>
        <p className="text-sm mt-2 max-w-3xl" style={{ color: "var(--muted)" }}>
          Tu programa de facturación, tu sistema de partes de trabajo y tu hoja de costes
          conectados a un único panel. Ingresos del mes, margen por cliente, proyectos en
          pérdidas — todo en tiempo real.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2 mb-6 p-3" style={cardBase}>
        <span
          className="text-[10px] font-medium uppercase tracking-widest mr-2"
          style={{ color: "var(--muted)" }}
        >
          Fuentes conectadas:
        </span>
        {[
          { nombre: "Holded", desc: "Facturación" },
          { nombre: "ERP interno", desc: "Partes de trabajo" },
          { nombre: "Hoja costes", desc: "Google Sheets" },
        ].map((f) => (
          <button
            key={f.nombre}
            onClick={() => simularFuente(f.nombre)}
            className="text-[10px] uppercase tracking-widest px-3 py-1.5"
            style={{
              border: "1px solid var(--border)",
              background: conectandoFuente === f.nombre ? "var(--accent-dim)" : "var(--bg)",
              color: conectandoFuente === f.nombre ? "var(--accent)" : "var(--muted-hi)",
              cursor: "pointer",
            }}
          >
            <span style={{ color: "var(--accent)", marginRight: 4 }}>●</span>
            {f.nombre}
            <span style={{ color: "var(--muted)", marginLeft: 6 }}>· {f.desc}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span
          className="text-[10px] uppercase tracking-widest"
          style={{ color: "var(--accent)" }}
        >
          ● en directo · refresca cada 5s
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KPI
          label="Ingresos abril"
          valor={formatoEuro(stats.ingresoMes)}
          variacion={stats.variacion}
          live
        />
        <KPI label="Margen mes" valor={`${stats.margenPct.toFixed(1)}%`} acento />
        <KPI label="Acumulado 12 meses" valor={formatoEuro(stats.totalAnio)} />
        <KPI label="Margen 12 meses" valor={formatoEuro(stats.totalMargen)} acento />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] gap-4 mb-4">
        <section style={cardBase}>
          <Encabezado
            titulo="Ingresos vs costes — últimos 12 meses"
            sub="Histórico mensual"
          />
          <div style={{ padding: 20 }}>
            <GraficoBarras data={HISTORICO_12M} />
          </div>
        </section>

        <section style={cardBase}>
          <Encabezado titulo="Alertas activas" sub={`${stats.proyectosCriticos + stats.clientesPerdidas} pendientes`} />
          <div style={{ padding: 16 }} className="space-y-3">
            {stats.proyectosCriticos > 0 && (
              <Alerta
                color="var(--accent)"
                titulo={`${stats.proyectosCriticos} proyecto(s) en pérdidas`}
                cuerpo="El coste real ha superado lo presupuestado. Revisar antes de seguir facturando horas."
              />
            )}
            {stats.clientesPerdidas > 0 && (
              <Alerta
                color="var(--accent)"
                titulo={`${stats.clientesPerdidas} cliente(s) no rentable(s)`}
                cuerpo="Estos clientes generan más coste que ingreso este mes. Considerar revisar tarifas."
              />
            )}
            {stats.margenPct < 25 && (
              <Alerta
                color="var(--muted-hi)"
                titulo="Margen por debajo del objetivo"
                cuerpo={`Objetivo 25% — actual ${stats.margenPct.toFixed(1)}%. El mes que viene a vigilar.`}
              />
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section style={cardBase}>
          <Encabezado
            titulo="Rentabilidad por cliente"
            sub={`${RENTABILIDAD.length} clientes · este mes`}
          />
          <div style={{ padding: 14, maxHeight: 480, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
              <thead>
                <tr>
                  <Th>Cliente</Th>
                  <Th alRight>Ingresos</Th>
                  <Th alRight>Margen</Th>
                  <Th>Estado</Th>
                </tr>
              </thead>
              <tbody>
                {[...RENTABILIDAD]
                  .sort((a, b) => b.ingresos - a.ingresos)
                  .map((c) => (
                    <tr key={c.id}>
                      <Td>
                        <div style={{ fontSize: 12, color: "var(--fg)", fontWeight: 500 }}>
                          {c.nombre}
                        </div>
                        <div className="text-[10px]" style={{ color: "var(--muted)" }}>
                          {c.trabajosActivos} trabajos activos
                        </div>
                      </Td>
                      <Td alRight mono>{formatoEuro(c.ingresos)}</Td>
                      <Td
                        alRight
                        mono
                        color={
                          c.margen < 0
                            ? "var(--accent)"
                            : c.estado === "ajustado"
                              ? "var(--muted-hi)"
                              : "var(--fg)"
                        }
                      >
                        {formatoEuro(c.margen)}
                      </Td>
                      <Td>
                        <BadgeEstado estado={c.estado} />
                      </Td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={cardBase}>
          <Encabezado
            titulo="Proyectos activos"
            sub={`${PROYECTOS.length} en curso`}
          />
          <div style={{ padding: 14, maxHeight: 480, overflowY: "auto" }}>
            <div className="space-y-3">
              {PROYECTOS.map((p) => (
                <FilaProyecto key={p.id} proyecto={p} />
              ))}
            </div>
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
  variacion,
  acento,
  live,
}: {
  label: string;
  valor: string;
  variacion?: number;
  acento?: boolean;
  live?: boolean;
}) {
  return (
    <div style={{ ...cardBase, padding: 16 }}>
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[9.5px] font-medium uppercase tracking-widest"
          style={{ color: "var(--muted)" }}
        >
          {label}
        </span>
        {live && (
          <span
            className="blinking-cursor"
            style={{
              background: "var(--accent)",
              width: 6,
              height: 6,
              borderRadius: "50%",
              display: "inline-block",
              marginLeft: 4,
            }}
          />
        )}
      </div>
      <div
        className="big-number"
        style={{
          color: acento ? "var(--accent)" : "var(--fg)",
        }}
      >
        {valor}
      </div>
      {variacion !== undefined && (
        <div
          className="text-[11px] mt-1"
          style={{
            color: variacion >= 0 ? "var(--accent)" : "var(--muted-hi)",
            fontFamily: "var(--font-geist-mono)",
          }}
        >
          {variacion >= 0 ? "▲" : "▼"} {Math.abs(variacion).toFixed(1)}% vs mes anterior
        </div>
      )}
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

function GraficoBarras({ data }: { data: typeof HISTORICO_12M }) {
  const maxIngreso = Math.max(...data.map((d) => d.ingresos));
  const altura = 200;
  const anchoBarraDoble = 100 / data.length;
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          height: altura,
          gap: 2,
          paddingBottom: 8,
          borderBottom: "1px solid var(--border)",
          position: "relative",
        }}
      >
        {data.map((d) => {
          const altIngreso = (d.ingresos / maxIngreso) * altura;
          const altCoste = (d.costes / maxIngreso) * altura;
          return (
            <div
              key={d.mes}
              style={{
                flex: 1,
                display: "flex",
                gap: 1,
                alignItems: "flex-end",
                justifyContent: "center",
                height: "100%",
                position: "relative",
              }}
              title={`${d.mes} · Ing ${formatoEuroCompacto(d.ingresos)} · Cost ${formatoEuroCompacto(d.costes)}`}
            >
              <div
                style={{
                  width: `${anchoBarraDoble * 0.36}%`,
                  minWidth: 6,
                  height: altIngreso,
                  background: "var(--accent)",
                  transition: "height 0.5s",
                }}
              />
              <div
                style={{
                  width: `${anchoBarraDoble * 0.36}%`,
                  minWidth: 6,
                  height: altCoste,
                  background: "var(--border)",
                  transition: "height 0.5s",
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", marginTop: 8 }}>
        {data.map((d) => (
          <div
            key={d.mes}
            style={{
              flex: 1,
              fontSize: 9.5,
              textAlign: "center",
              color: "var(--muted)",
              fontFamily: "var(--font-geist-mono)",
              letterSpacing: "0.04em",
            }}
          >
            {d.mes.split(" ")[0]}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[10px]" style={{ color: "var(--muted)" }}>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 10, height: 10, background: "var(--accent)" }} />
          Ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 10, height: 10, background: "var(--border)" }} />
          Costes
        </span>
      </div>
    </div>
  );
}

function Alerta({
  color,
  titulo,
  cuerpo,
}: {
  color: string;
  titulo: string;
  cuerpo: string;
}) {
  return (
    <div
      style={{
        padding: 12,
        background: "var(--bg)",
        borderLeft: `2px solid ${color}`,
      }}
    >
      <div
        className="text-[11px] font-medium uppercase tracking-widest"
        style={{ color, marginBottom: 4 }}
      >
        ⚠ {titulo}
      </div>
      <div style={{ fontSize: 11.5, color: "var(--muted-hi)", lineHeight: 1.5 }}>{cuerpo}</div>
    </div>
  );
}

function Th({ children, alRight }: { children: React.ReactNode; alRight?: boolean }) {
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
  color,
}: {
  children: React.ReactNode;
  alRight?: boolean;
  mono?: boolean;
  color?: string;
}) {
  return (
    <td
      style={{
        padding: "8px 8px",
        borderBottom: "1px solid var(--border)",
        textAlign: alRight ? "right" : "left",
        fontFamily: mono ? "var(--font-geist-mono)" : "inherit",
        color: color ?? "var(--muted-hi)",
        fontSize: 11.5,
        verticalAlign: "top",
      }}
    >
      {children}
    </td>
  );
}

function BadgeEstado({ estado }: { estado: "rentable" | "ajustado" | "perdidas" }) {
  const map = {
    rentable: { color: "var(--accent)", label: "OK" },
    ajustado: { color: "var(--muted-hi)", label: "Ajustado" },
    perdidas: { color: "var(--accent)", label: "⚠ Pérdidas" },
  };
  const { color, label } = map[estado];
  return (
    <span
      className="text-[10px] uppercase tracking-widest"
      style={{
        color,
        fontWeight: 600,
        padding: "2px 6px",
        border: `1px solid ${estado === "perdidas" ? "var(--accent)" : "var(--border)"}`,
      }}
    >
      {label}
    </span>
  );
}

function FilaProyecto({ proyecto }: { proyecto: (typeof PROYECTOS)[number] }) {
  const desviacion = proyecto.costeReal - proyecto.presupuestado;
  const desvPct = (desviacion / proyecto.presupuestado) * 100;
  const colorAlerta =
    proyecto.alerta === "critica"
      ? "var(--accent)"
      : proyecto.alerta === "atencion"
        ? "var(--muted-hi)"
        : "var(--muted)";
  return (
    <div
      style={{
        padding: 12,
        background: "var(--bg)",
        border: `1px solid ${proyecto.alerta === "critica" ? "var(--accent)" : "var(--border)"}`,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div style={{ fontSize: 12.5, color: "var(--fg)", fontWeight: 500, lineHeight: 1.35 }}>
            {proyecto.nombre}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>
            {proyecto.cliente}
          </div>
        </div>
        <span
          className="text-[10px] uppercase tracking-widest flex-shrink-0"
          style={{ color: colorAlerta, fontWeight: 600 }}
        >
          {proyecto.alerta === "critica"
            ? "⚠ Crítico"
            : proyecto.alerta === "atencion"
              ? "● Atención"
              : "○ OK"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[10.5px]" style={{ color: "var(--muted)" }}>
        <div>
          <div className="text-[9px] uppercase tracking-widest">Presup.</div>
          <div style={{ color: "var(--muted-hi)", fontFamily: "var(--font-geist-mono)" }}>
            {formatoEuro(proyecto.presupuestado)}
          </div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-widest">Real</div>
          <div style={{ color: "var(--muted-hi)", fontFamily: "var(--font-geist-mono)" }}>
            {formatoEuro(proyecto.costeReal)}
          </div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-widest">Desviación</div>
          <div
            style={{
              color: desvPct > 0 ? "var(--accent)" : "var(--muted-hi)",
              fontFamily: "var(--font-geist-mono)",
              fontWeight: 600,
            }}
          >
            {desvPct >= 0 ? "+" : ""}
            {desvPct.toFixed(1)}%
          </div>
        </div>
      </div>
      <div className="mt-2.5">
        <div
          style={{
            height: 4,
            background: "var(--border)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${proyecto.avance}%`,
              background: "var(--accent)",
              transition: "width 0.4s",
            }}
          />
        </div>
        <div className="text-[9px] mt-1" style={{ color: "var(--muted)" }}>
          Avance {proyecto.avance}%
        </div>
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
        ¿Cuántas hojas de cálculo abres para saber si el mes va bien?
      </div>
      <p
        className="text-sm mb-4"
        style={{ color: "var(--muted-hi)", lineHeight: 1.6, maxWidth: 720 }}
      >
        Kroomix integra tu programa de facturación, tu ERP y tus hojas de costes en un único panel
        que se actualiza solo. Decisiones con datos reales, sin esperar al cierre.
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
