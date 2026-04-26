/** Rotulador: franja verde detrás de la parte baja del texto (cada línea con box-decoration-break). */
const em =
  "font-semibold text-inherit px-0.5 rounded-sm [box-decoration-break:clone] [-webkit-box-decoration-break:clone] [background-image:linear-gradient(180deg,transparent_58%,rgba(52,211,153,0.42)_58%)] dark:[background-image:linear-gradient(180deg,transparent_58%,rgba(52,211,153,0.28)_58%)]";

export default function QuienesSomos() {
  return (
    <>
      <div
        className="px-5 sm:px-8 py-10 sm:py-14 section-accent-left"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-section)" }}
      >
        <h2 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight uppercase">
          Quiénes somos
        </h2>
        <p
          className="text-xs font-medium uppercase tracking-widest mt-3"
          style={{ color: "var(--muted)" }}
        >
          Tu socio para modernizar la operativa sin perderte en el camino
        </p>
      </div>

      <div style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="min-w-0 max-w-full px-5 sm:px-8 py-12 sm:py-16">
          <div
            className="mx-auto max-w-2xl text-center text-base sm:text-lg leading-relaxed"
            style={{ color: "var(--fg)" }}
          >
            <p className="mb-6">
              Queremos ser tu socio al{" "}
              <span className={em}>actualizar tus procesos digitales</span>: que respondas a lo que ya
              exigen tus usuarios y clientes, y que aproveches con criterio las tecnologías que hay hoy
              en el mercado — sin humo, sin promesas vacías.
            </p>
            <p className="mb-6" style={{ color: "var(--muted)" }}>
              Todo va en la misma dirección: dar más fuerza a tu marca, a tu empresa y a tu día a día
              operativo. Recuperar horas que ahora se van en tareas repetitivas, recortar costes donde
              haya margen y, al cerrar el mes, <span className={em}>dejar más dinero sobre la mesa</span>.
            </p>
            <p style={{ color: "var(--muted)" }}>
              Si eso te suena bien, también es nuestro objetivo que tengas{" "}
              <span className={em}>
                menos quebraderos de cabeza y más claridad para decidir con tranquilidad
              </span>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
