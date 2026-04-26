const PAIN_GROUPS = [
  {
    label: "Datos y admin",
    pains: [
      "Copiar datos manualmente entre sistemas",
      "Introducir facturas a mano",
      "Procesar PDFs manualmente",
      "Tener datos duplicados o inconsistentes",
      "No saber qué datos son correctos",
      "Información dispersa en múltiples sitios",
    ],
  },
  {
    label: "Finanzas",
    pains: [
      "No tener visibilidad de ingresos reales",
      "No saber qué clientes son rentables",
      "No detectar pérdidas de dinero",
      "Cobrar tarde a clientes",
      "Tener problemas de flujo de caja",
      "No saber dónde invertir para crecer",
    ],
  },
  {
    label: "Personas y equipo",
    pains: [
      "Pagar empleados por tareas repetitivas",
      "No encontrar trabajadores cualificados",
      "Sobrecarga del dueño (hace de todo)",
      "Falta de tiempo para mejorar procesos",
      "Resistencia al cambio interno",
      "Errores humanos frecuentes",
    ],
  },
  {
    label: "Comercial y clientes",
    pains: [
      "Gestionar pedidos por WhatsApp sin control",
      "Tener página web pero no recibir pedidos online",
      "Perder leads por no responder rápido",
      "Mala gestión de emails",
      "Atención al cliente lenta",
      "Perder oportunidades de venta",
      "No tener CRM o sistema de leads",
    ],
  },
  {
    label: "Operaciones",
    pains: [
      "Falta de reporting claro",
      "No medir productividad del equipo",
      "Procesos no documentados",
      "Falta de integración entre herramientas",
      "Dificultad para escalar operaciones",
      "Falta de control sobre operaciones",
    ],
  },
  {
    label: "Tecnología",
    pains: [
      "No usar automatización en procesos",
      "No tener sistemas digitales básicos",
      "Dependencia de procesos antiguos",
      "Miedo a implementar IA",
      "Pensar que la IA es cara o compleja",
    ],
  },
];

const MAX_ROWS = Math.max(...PAIN_GROUPS.map((g) => g.pains.length));

export default function PainSidebar() {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: "repeat(6, 1fr)",
        gridTemplateRows: `auto repeat(${MAX_ROWS}, 1fr)`,
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Fila de encabezados */}
      {PAIN_GROUPS.map((group) => (
        <div
          key={group.label}
          className="px-2 py-1"
          style={{
            borderRight: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <p
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: "var(--foreground)" }}
          >
            {group.label}
          </p>
        </div>
      ))}

      {/* Filas de pains */}
      {Array.from({ length: MAX_ROWS }, (_, rowIndex) =>
        PAIN_GROUPS.map((group) => (
          <div
            key={`${group.label}-${rowIndex}`}
            className="px-2 py-1"
            style={{
              borderRight: "1px solid var(--border)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {group.pains[rowIndex] && (
              <span className="text-xs leading-snug" style={{ color: "var(--muted)" }}>
                {group.pains[rowIndex]}
              </span>
            )}
          </div>
        ))
      )}
    </div>
  );
}
