"use client";

import Button from "@/components/ui/Button";

const AREAS = [
  {
    label: "Ventas / Pedidos",
    descripcion:
      "Los pedidos entran por email, WhatsApp y teléfono a la vez. Nadie sabe qué está confirmado sin mirar tres sitios distintos. Los errores se descubren cuando el cliente ya ha llamado.",
    coste: "800 – 2.000 €/mes",
  },
  {
    label: "Stock",
    descripcion:
      "El inventario en Excel siempre va por detrás de la realidad. Roturas que no se ven venir, excesos que nadie detecta. Cada recuento físico inmoviliza a dos o tres personas medio día.",
    coste: "1.000 – 3.500 €/mes",
  },
  {
    label: "Administración",
    descripcion:
      "Facturas y albaranes introducidos a mano dos veces. El cierre de mes son tres días buscando documentos y cuadrando números. Un error puede retrasar el cobro semanas.",
    coste: "600 – 1.800 €/mes",
  },
  {
    label: "Logística",
    descripcion:
      "Cada incidencia de entrega activa una cadena de llamadas y emails. Sin visibilidad de qué está en ruta. Las devoluciones y reclamaciones se gestionan siempre a mano.",
    coste: "700 – 2.200 €/mes",
  },
  {
    label: "Comercial",
    descripcion:
      "El seguimiento de clientes vive en la cabeza del comercial o en una libreta. Oportunidades que se enfrían porque nadie las siguió a tiempo. Sin pipeline claro, las decisiones se toman a ojo.",
    coste: "2.000 – 8.000 €/mes",
  },
];

export default function PainPoints() {
  const handleScroll = () => {
    document.getElementById("simulador")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="px-6 py-16 max-w-4xl mx-auto">
      <hr className="section-rule mb-16" />

      <p className="text-xs font-medium uppercase tracking-widest mb-6" style={{ color: "var(--muted)" }}>
        Diagnóstico
      </p>
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
        ¿Te suena alguna de estas situaciones?
      </h2>
      <p className="mb-12" style={{ color: "var(--muted)" }}>
        Son problemas normales en empresas de 10 a 80 personas. Nadie los ve como un coste
        porque siempre han funcionado así. Pero tienen un precio real.
      </p>

      {/* Lista de áreas */}
      <div className="flex flex-col">
        {AREAS.map((area, i) => (
          <div
            key={area.label}
            className="py-6 grid md:grid-cols-[1fr_auto] gap-4 md:gap-8 items-start"
            style={{ borderTop: i === 0 ? "1px solid var(--border)" : undefined, borderBottom: "1px solid var(--border)" }}
          >
            <div>
              <p className="font-semibold mb-2">{area.label}</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                {area.descripcion}
              </p>
            </div>
            <div className="shrink-0 md:text-right">
              <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>
                Coste oculto est.
              </p>
              <p
                className="font-bold text-sm"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                {area.coste}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Total y CTA */}
      <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>
            Total estimado (3+ áreas)
          </p>
          <p
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            5.000 – 17.500 €/mes
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            Para empresas de 10 a 80 personas con procesos manuales
          </p>
        </div>
        <Button onClick={handleScroll}>
          Calcular el mío →
        </Button>
      </div>
    </section>
  );
}
