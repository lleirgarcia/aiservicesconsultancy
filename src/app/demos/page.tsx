import Link from "next/link";

interface DemoCard {
  slug: string;
  titulo: string;
  pain: string;
  tag: "IA" | "Automatización" | "Datos";
}

const DEMOS: DemoCard[] = [
  {
    slug: "asesoria-emails",
    titulo: "Asesoría — IA que clasifica y archiva emails",
    pain: "Abren cada email, descargan el adjunto, lo renombran y lo mueven a la carpeta del cliente. 30–50 veces al día.",
    tag: "IA",
  },
  {
    slug: "pedidos-whatsapp",
    titulo: "Pedidos por WhatsApp → ERP",
    pain: "Los pedidos se pierden entre mensajes. Los comerciales copian los datos a mano en el sistema de gestión.",
    tag: "IA",
  },
  {
    slug: "respuesta-instantanea",
    titulo: "Respuesta instantánea multicanal",
    pain: "Llegan llamadas, emails y WhatsApps. Cuando contestamos, el cliente ya se ha ido a la competencia.",
    tag: "IA",
  },
  {
    slug: "presupuestos-constructora",
    titulo: "Presupuestos para constructora",
    pain: "Cada presupuesto se hace desde cero copiando el anterior, ajustando precios a mano y calculando márgenes.",
    tag: "Automatización",
  },
  {
    slug: "facturacion-automatica",
    titulo: "Facturación automática a fin de mes",
    pain: "Alguien revisa los trabajos del mes, calcula qué facturar a cada cliente y genera las facturas una a una.",
    tag: "Automatización",
  },
  {
    slug: "crm-leads",
    titulo: "CRM con asignación automática",
    pain: "Los contactos llegan por web, email y teléfono y nadie sabe de quién es la responsabilidad.",
    tag: "Automatización",
  },
  {
    slug: "stock-omnicanal",
    titulo: "Stock omnicanal sincronizado",
    pain: "Clientes que compran en línea algo ya agotado en tienda. Recuentos manuales cada semana.",
    tag: "Automatización",
  },
  {
    slug: "albaranes-firma",
    titulo: "Albaranes con firma móvil",
    pain: "Albaranes en papel que se pierden, llegan ilegibles y se introducen a mano al final del día.",
    tag: "Automatización",
  },
  {
    slug: "panel-financiero",
    titulo: "Panel financiero en tiempo real",
    pain: "Para saber si el mes va bien hay que llamar al contable y mirar tres hojas de cálculo distintas.",
    tag: "Datos",
  },
];

const TAG_COLORES: Record<DemoCard["tag"], string> = {
  IA: "var(--accent)",
  Automatización: "var(--muted-hi)",
  Datos: "var(--muted-hi)",
};

export default function DemosIndexPage() {
  return (
    <div className="px-5 sm:px-8 py-12 sm:py-20 max-w-5xl mx-auto">
      <div className="label-accent mb-6">
        <span className="text-xs font-medium uppercase tracking-widest">Demos en vivo</span>
      </div>
      <h1
        className="font-headline text-3xl sm:text-5xl mb-6"
        style={{ color: "var(--fg)", letterSpacing: "-0.02em" }}
      >
        Mira cómo se ve la solución antes de contratarla.
      </h1>
      <p className="text-base sm:text-lg mb-12" style={{ color: "var(--muted-hi)" }}>
        Cada demo aplica una solución de Kroomix a un problema real que vemos en empresas como la
        tuya. Datos de ejemplo, sin compromiso, totalmente interactivo.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEMOS.map((demo) => (
          <Link
            key={demo.slug}
            href={`/demos/${demo.slug}`}
            className="group block p-6 transition"
            style={{
              background: "var(--bg-soft)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[10px] uppercase tracking-widest px-2 py-0.5"
                style={{
                  border: `1px solid ${TAG_COLORES[demo.tag]}`,
                  color: TAG_COLORES[demo.tag],
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                }}
              >
                {demo.tag}
              </span>
              <span className="text-xs" style={{ color: "var(--accent)" }}>
                Abrir →
              </span>
            </div>
            <h2
              className="font-headline text-xl mb-2"
              style={{ color: "var(--fg)", letterSpacing: "-0.01em" }}
            >
              {demo.titulo}
            </h2>
            <p className="text-sm" style={{ color: "var(--muted)", lineHeight: 1.55 }}>
              {demo.pain}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
