import { CasoDeUso } from "@/data/casos-de-uso";

export default function CasoCard({ caso }: { caso: CasoDeUso }) {
  return (
    <div className="px-5 sm:px-8 py-8 sm:py-12 flex flex-col gap-8">

      {/* Título */}
      <div className="flex flex-col gap-3">
        <h3 className="text-lg sm:text-xl font-bold uppercase tracking-tight leading-tight">
          {caso.titulo}
        </h3>
      </div>

      {/* Problema + Solución */}
      <div
        className="grid md:grid-cols-2 gap-0"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div
          className="pt-6 pr-0 md:pr-8 flex flex-col gap-2 pb-6 md:pb-0"
          style={{ borderBottom: "1px solid var(--border)", borderRight: "none" }}
        >
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Problema
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {caso.problema}
          </p>
        </div>
        <div
          className="pt-6 md:pl-8 flex flex-col gap-2"
          style={{ borderTop: "1px solid var(--border)", borderLeft: "none" }}
        >
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Solución
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {caso.solucion}
          </p>
        </div>
      </div>

      {/* Métricas */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-px"
        style={{
          borderTop: "1px solid var(--border)",
          background: "var(--border)",
        }}
      >
        <div className="flex flex-col gap-1 pt-5 pb-2 pr-5" style={{ background: "var(--bg)" }}>
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Tiempo perdido
          </p>
          <p className="text-sm font-semibold">{caso.horasPerdidas}</p>
        </div>
        <div className="flex flex-col gap-1 pt-5 pb-2 px-5" style={{ background: "var(--bg)" }}>
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Inversión
          </p>
          <p className="text-sm font-semibold">{caso.inversion}</p>
        </div>
        <div className="flex flex-col gap-1 pt-5 pb-2 px-5" style={{ background: "var(--bg)" }}>
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Ahorro mensual
          </p>
          <p className="text-sm font-bold" style={{ color: "var(--accent)" }}>
            {caso.ahorro}
          </p>
        </div>
        <div className="flex flex-col gap-1 pt-5 pb-2 pl-5" style={{ background: "var(--bg)" }}>
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Recuperación
          </p>
          <p className="text-sm font-semibold">{caso.recuperacion}</p>
        </div>
      </div>

    </div>
  );
}
