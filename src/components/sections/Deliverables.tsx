/**
 * "Lo que recibirás" — ejemplos concretos de soluciones descritas en
 * lenguaje llano, en formato antes/después tipo testimonio. Sustituye
 * al anterior bloque <Summary /> que mezclaba narrativa y entregables.
 */

type Case = {
  tag: string;
  before: string;
  after: string;
};

const CASES: Case[] = [
  {
    tag: "Búsqueda de información",
    before:
      "Perdía horas buscando datos entre decenas de Excels diferentes cada vez que un cliente me preguntaba algo.",
    after:
      "Gracias a juntar todos los Excels en una herramienta y analizarlos con inteligencia artificial, ahora tardo 1 minuto en obtener datos que antes me llevaban más de 20.",
  },
  {
    tag: "Facturas y documentos",
    before:
      "Cada mes dos personas dedicaban días enteros a teclear a mano más de 300 facturas en PDF dentro del ERP.",
    after:
      "Gracias a un lector de facturas con inteligencia artificial conectado al ERP, lo que antes eran 3 días de trabajo de dos personas ahora se resuelve en un par de horas y sin tocar el teclado.",
  },
  {
    tag: "Respuestas a clientes",
    before:
      "Los emails se acumulaban durante días porque no teníamos manos suficientes para contestarlos todos a tiempo.",
    after:
      "Gracias a un asistente de correo con inteligencia artificial integrado en el Gmail del equipo, lo repetitivo se responde en segundos y yo solo dedico tiempo a los casos que requieren una decisión.",
  },
];

export default function Deliverables() {
  return (
    <section
      id="lo-que-recibiras"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      {/* Título de sección */}
      <div
        className="px-5 sm:px-8 py-10 sm:py-14 section-accent-left"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-section)" }}
      >
        <h2 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight uppercase">
          Lo que recibirás
        </h2>
        <p
          className="text-xs font-medium uppercase tracking-widest mt-3"
          style={{ color: "var(--muted)" }}
        >
          Ejemplos reales contados en un idioma que se entiende
        </p>
      </div>

      {/* Grid de tarjetas */}
      <div data-collapsible style={{ ["--collapse-delay" as string]: "500ms" }}>
        <div>
        <div className="grid grid-cols-1 md:grid-cols-3">
          {CASES.map((c, i) => (
            <article
              key={c.tag}
              className={`px-5 sm:px-8 pt-7 pb-8 md:pt-10 md:pb-12 flex flex-col gap-5 sm:gap-6 relative ${
                i < CASES.length - 1
                  ? "border-b md:border-b-0 md:border-r"
                  : ""
              }`}
              style={{ borderColor: "var(--border)" }}
            >
              {/* Header: índice + categoría */}
              <header className="flex items-baseline gap-4">
                <span
                  className="text-xs font-semibold"
                  style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    color: "var(--accent)",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-xs font-semibold uppercase tracking-wide">
                  {c.tag}
                </p>
              </header>

              {/* ANTES */}
              <div className="flex flex-col gap-2">
                <p
                  className="text-[10px] font-medium uppercase tracking-widest"
                  style={{ color: "var(--muted)" }}
                >
                  Antes
                </p>
                <p
                  className="text-sm leading-relaxed italic"
                  style={{ color: "var(--muted)" }}
                >
                  <span
                    aria-hidden
                    style={{
                      color: "var(--border)",
                      fontFamily: "var(--font-geist-mono), monospace",
                      marginRight: 4,
                    }}
                  >
                    “
                  </span>
                  {c.before}
                  <span
                    aria-hidden
                    style={{
                      color: "var(--border)",
                      fontFamily: "var(--font-geist-mono), monospace",
                      marginLeft: 4,
                    }}
                  >
                    ”
                  </span>
                </p>
              </div>

              {/* Flecha separadora */}
              <div
                aria-hidden
                className="flex items-center gap-3"
                style={{ color: "var(--accent)" }}
              >
                <span
                  style={{
                    display: "inline-block",
                    height: 1,
                    flex: 1,
                    background: "var(--border)",
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 11,
                    letterSpacing: "0.15em",
                  }}
                >
                  →
                </span>
                <span
                  style={{
                    display: "inline-block",
                    height: 1,
                    flex: 1,
                    background: "var(--accent)",
                    opacity: 0.6,
                  }}
                />
              </div>

              {/* AHORA */}
              <div className="flex flex-col gap-2">
                <p
                  className="text-[10px] font-medium uppercase tracking-widest"
                  style={{ color: "var(--accent)" }}
                >
                  Ahora
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--fg)" }}
                >
                  <span
                    aria-hidden
                    style={{
                      color: "var(--accent)",
                      fontFamily: "var(--font-geist-mono), monospace",
                      marginRight: 4,
                      opacity: 0.7,
                    }}
                  >
                    “
                  </span>
                  {c.after}
                  <span
                    aria-hidden
                    style={{
                      color: "var(--accent)",
                      fontFamily: "var(--font-geist-mono), monospace",
                      marginLeft: 4,
                      opacity: 0.7,
                    }}
                  >
                    ”
                  </span>
                </p>
              </div>
            </article>
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}
