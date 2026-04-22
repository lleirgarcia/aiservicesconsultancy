/**
 * Recap de la narrativa de toda la página + deliverables genéricos
 * que recibe cualquier cliente. Se coloca justo antes del formulario
 * de contacto como cierre.
 */

type Item = { title: string; body: string };

const RECAP: Item[] = [
  {
    title: "El problema",
    body: "La mayoría de empresas de 10 a 200 personas funcionan con procesos manuales: pedidos por WhatsApp, facturas a mano, Excels que siempre van por detrás.",
  },
  {
    title: "El coste oculto",
    body: "Ese caos cuesta entre 5.000 y 17.500 € al mes en empresas de 10 a 200 personas. Casi nadie lo mide, pero existe.",
  },
  {
    title: "La causa real",
    body: "No es un problema de personas. Es un problema de sistemas que nadie ha cuestionado nunca.",
  },
  {
    title: "La oportunidad",
    body: "Hoy existe tecnología para eliminar el 60–80% de esas tareas repetitivas sin rehacer la empresa ni parar el día a día.",
  },
  {
    title: "El antes y el después",
    body: "De un flujo caótico e invisible a un sistema automatizado: tiempo recuperado, claridad total y más rentabilidad.",
  },
];

const DELIVERABLES: Item[] = [
  {
    title: "Diagnóstico de procesos",
    body: "Mapeo completo de cómo funciona hoy tu empresa y dónde se pierden horas, dinero y control.",
  },
  {
    title: "Plan priorizado",
    body: "Lista ordenada de qué automatizar primero según retorno real y esfuerzo de implementación.",
  },
  {
    title: "Implementación a medida",
    body: "Automatizaciones con herramientas existentes o software propio, integrado con lo que ya usas.",
  },
  {
    title: "Formación del equipo",
    body: "Tu gente aprende a usar y mantener el sistema sin depender de nosotros.",
  },
  {
    title: "Medición antes / después",
    body: "Horas, errores y euros cuantificados. Ahorro real, no promesas.",
  },
  {
    title: "Documentación completa",
    body: "Cada proceso queda explicado y trazable para cualquier persona nueva que entre en la empresa.",
  },
];

export default function Summary() {
  return (
    <section
      id="resumen"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      {/* Título de sección */}
      <div
        className="px-8 py-14"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-section)" }}
      >
        <h2 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight uppercase">
          En resumen.
          <span
            className="block font-bold"
            style={{ fontSize: "calc(1em - 5px)" }}
          >
            Qué has visto y qué recibes si trabajamos juntos
          </span>
        </h2>
      </div>

      {/* Dos columnas: recap narrativa + deliverables */}
      <div
        className="grid grid-cols-1 md:grid-cols-2"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {/* LEFT: Lo que has visto */}
        <div
          className="px-8 pt-8 pb-10 md:pt-10 md:pb-12"
          style={{ borderRight: "1px solid var(--border)" }}
        >
          <p className="label-accent text-xs font-medium uppercase tracking-widest mb-8">
            Lo que has visto
          </p>

          <ol className="flex flex-col gap-7">
            {RECAP.map((it, i) => (
              <li key={it.title} className="grid grid-cols-[auto_1fr] gap-4">
                <span
                  className="text-xs font-semibold pt-0.5"
                  style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    color: "var(--accent)",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-semibold">{it.title}</p>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--muted)" }}
                  >
                    {it.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* RIGHT: Lo que recibes */}
        <div className="px-8 pt-8 pb-10 md:pt-10 md:pb-12">
          <p className="label-accent text-xs font-medium uppercase tracking-widest mb-8">
            Lo que recibes
          </p>

          <ol className="flex flex-col gap-7">
            {DELIVERABLES.map((it, i) => (
              <li key={it.title} className="grid grid-cols-[auto_1fr] gap-4">
                <span
                  className="text-xs font-semibold pt-0.5"
                  style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    color: "var(--accent)",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-semibold">{it.title}</p>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--muted)" }}
                  >
                    {it.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
