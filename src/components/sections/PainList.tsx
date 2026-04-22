const PAINS = [
  "Copiar datos manualmente entre sistemas",
  "Introducir facturas a mano",
  "Procesar PDFs manualmente",
  "Gestionar pedidos por WhatsApp sin control",
  "Tener datos duplicados o inconsistentes",
  "No saber qué datos son correctos",
  "No tener visibilidad de ingresos reales",
  "No saber qué clientes son rentables",
  "No detectar pérdidas de dinero",
  "Cobrar tarde a clientes",
  "Tener problemas de flujo de caja",
  "Pagar empleados por tareas repetitivas",
  "No encontrar trabajadores cualificados",
  "Sobrecarga del dueño (hace de todo)",
  "Falta de tiempo para mejorar procesos",
  "Perder leads por no responder rápido",
  "Mala gestión de emails",
  "Atención al cliente lenta",
  "Perder oportunidades de venta",
  "No tener CRM o sistema de leads",
  "No usar automatización en procesos",
  "Miedo a implementar IA",
  "Pensar que la IA es cara o compleja",
  "No tener sistemas digitales básicos",
  "Dependencia de procesos antiguos",
  "Resistencia al cambio interno",
  "Falta de reporting claro",
  "No medir productividad del equipo",
  "Procesos no documentados",
  "Errores humanos frecuentes",
  "Falta de integración entre herramientas",
  "Dificultad para escalar operaciones",
  "Información dispersa en múltiples sitios",
  "Falta de control sobre operaciones",
  "No saber dónde invertir para crecer",
];

export default function PainList() {
  return (
    <section className="px-6 pb-16 max-w-4xl mx-auto">
      <hr className="section-rule mb-10" />

      <p
        className="text-xs font-medium uppercase tracking-widest mb-8"
        style={{ color: "var(--muted)" }}
      >
        ¿Reconoces alguno de estos problemas?
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8">
        {PAINS.map((pain, i) => (
          <div
            key={i}
            className="flex items-baseline gap-2 py-2"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <span className="text-xs shrink-0" style={{ color: "var(--border)" }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-sm leading-snug" style={{ color: "var(--muted)" }}>
              {pain}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
