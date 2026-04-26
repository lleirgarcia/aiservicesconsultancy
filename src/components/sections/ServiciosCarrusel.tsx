"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";

const SERVICIOS = [
  {
    titulo: "Doble entrada de datos",
    problema: "¿Por qué tenemos que meter esto a mano dos veces?...",
    solucion: "Automatizamos el flujo para que el dato se registre una sola vez y viaje solo al resto de sistemas.",
  },
  {
    titulo: "Facturación lenta",
    problema: "Llevamos tres horas metiendo facturas y aún no hemos terminado...",
    solucion: "Automatizamos la generación y el registro de facturas. Lo que tarda horas pasa a tardar segundos.",
  },
  {
    titulo: "Procesamiento manual de documentos",
    problema: "¿Hay alguna forma de no tener que leer estos PDFs uno a uno?...",
    solucion: "Extraemos los datos clave de tus documentos automáticamente y los volcamos donde toca, sin leer nada a mano.",
  },
  {
    titulo: "Datos contradictorios",
    problema: "Depende de dónde mires, el número es distinto...",
    solucion: "Creamos una fuente única de verdad. Un solo sitio donde el dato es fiable y todas las herramientas lo leen de ahí.",
  },
  {
    titulo: "Excels desactualizados",
    problema: "¿De qué Excel me tengo que fiar?...",
    solucion: "Sustituimos la maraña de excels por un sistema centralizado donde todos trabajan con la misma versión.",
  },
  {
    titulo: "Información dispersa",
    problema: "Eso está en el email de Pedro, o quizás en el WhatsApp...",
    solucion: "Centralizamos la información relevante en un único sistema accesible para el equipo, sin buscar por canales.",
  },
  {
    titulo: "Facturación real desconocida",
    problema: "¿Cuánto hemos facturado este mes, realmente?...",
    solucion: "Dashboard financiero en tiempo real. Sabes cuánto llevas facturado, cobrado y pendiente en cualquier momento.",
  },
  {
    titulo: "Rentabilidad por cliente desconocida",
    problema: "Con este cliente trabajamos mucho, pero no sé si nos sale a cuenta...",
    solucion: "Análisis automático de rentabilidad por cliente. Ves qué clientes te hacen ganar y cuáles te están costando.",
  },
  {
    titulo: "Fugas de costes ocultas",
    problema: "En algún sitio se nos está yendo el dinero y no sé dónde...",
    solucion: "Conectamos y analizamos tus datos de gasto para identificar exactamente dónde se pierden márgenes.",
  },
  {
    titulo: "Facturas impagadas sin seguimiento",
    problema: "Esta factura lleva 90 días y nadie la ha reclamado...",
    solucion: "Sistema automatizado de seguimiento de cobros: alertas, recordatorios y escalados sin que nadie tenga que acordarse.",
  },
  {
    titulo: "Cash flow ajustado",
    problema: "A final de mes siempre vamos justos, aunque estemos vendiendo bien...",
    solucion: "Visibilidad del flujo de caja en tiempo real. Anticipas tensiones de tesorería antes de que lleguen.",
  },
  {
    titulo: "Decisiones de inversión sin datos",
    problema: "No sé si contratar a alguien o comprar una máquina...",
    solucion: "Análisis de ROI y proyecciones basadas en tus propios datos para tomar decisiones con criterio, no con intuición.",
  },
  {
    titulo: "Tareas repetitivas que hace gente cara",
    problema: "Tengo gente cara haciendo cosas que podría hacer una máquina...",
    solucion: "Automatizamos las tareas mecánicas y repetitivas para que tu equipo se dedique a lo que aporta valor real.",
  },
  {
    titulo: "Alta rotación en puestos tediosos",
    problema: "Nadie quiere hacer este trabajo y los que vienen no duran...",
    solucion: "Eliminamos las tareas más tediosas con automatización. El trabajo que nadie quiere hacer, que lo haga la máquina.",
  },
  {
    titulo: "El negocio depende de una sola persona",
    problema: "Si yo no estoy, esto no funciona...",
    solucion: "Documentamos y automatizamos los procesos clave para que el negocio funcione con o sin ti.",
  },
  {
    titulo: "Siempre hay algo más urgente",
    problema: "Sé que hay que cambiarlo, pero nunca hay momento...",
    solucion: "Implementamos de forma incremental, sin parar el negocio. Cambiamos lo que hay que cambiar mientras seguís operando.",
  },
  {
    titulo: "Resistencia interna al cambio",
    problema: "Lo propongo y siempre hay una excusa para no hacerlo...",
    solucion: "Plan de cambio estructurado con resultados medibles desde el primer sprint. Los números convencen mejor que los argumentos.",
  },
  {
    titulo: "Errores que se repiten",
    problema: "Ya es la tercera vez este mes que sale mal lo mismo...",
    solucion: "Flujos de control automáticos que detectan y previenen el error antes de que ocurra, no después.",
  },
  {
    titulo: "Gestión manual de pedidos",
    problema: "¿Alguien ha confirmado el pedido de ayer?...",
    solucion: "Sistema de seguimiento de pedidos con confirmaciones automáticas y visibilidad de estado en tiempo real.",
  },
  {
    titulo: "Respuesta lenta a leads",
    problema: "Nos pidieron presupuesto y, cuando contestamos, ya habían ido a otro...",
    solucion: "Automatizamos la respuesta inicial y la generación de presupuestos. El lead recibe respuesta en minutos, no en días.",
  },
  {
    titulo: "Emails sin responder",
    problema: "Ese email se quedó sin responder y el cliente se mosqueó...",
    solucion: "Sistema de gestión de bandeja de entrada con alertas y asignaciones automáticas para que nada se quede sin responder.",
  },
  {
    titulo: "Atención al cliente lenta",
    problema: "El cliente lleva dos días esperando y nadie le ha dado respuesta...",
    solucion: "Chatbot que responde al instante las consultas más habituales y escala a persona cuando hace falta.",
  },
  {
    titulo: "Oportunidades de venta perdidas",
    problema: "Ese cliente podría haber comprado más y no lo vimos...",
    solucion: "Sistema de alertas de oportunidad basado en el historial del cliente. Ves cuándo alguien está listo para comprar más.",
  },
  {
    titulo: "Historial de clientes disperso",
    problema: "¿Con quién habló María la semana pasada? No tengo ni idea...",
    solucion: "CRM centralizado donde todo el equipo ve el historial completo de cada cliente: llamadas, emails, pedidos y notas.",
  },
  {
    titulo: "Sin visibilidad del mes en curso",
    problema: "No tengo forma de saber cómo va el mes hasta que acaba...",
    solucion: "Dashboard en tiempo real con los KPIs que te importan. Sabes cómo va el mes hoy, no el día 31.",
  },
  {
    titulo: "Productividad del equipo desconocida",
    problema: "Trabajo mucho, pero no sé quién está rindiendo y quién no...",
    solucion: "Métricas de rendimiento individual y por equipo. Datos objetivos para tomar decisiones sobre personas.",
  },
  {
    titulo: "Conocimiento en personas, no en sistemas",
    problema: "Solo Joan sabe cómo se hace esto, y Joan está de vacaciones...",
    solucion: "Documentamos y sistematizamos los procesos críticos para que el conocimiento no se vaya con nadie.",
  },
  {
    titulo: "Sistemas que no se hablan",
    problema: "El programa de almacén y el de ventas no se hablan...",
    solucion: "Integramos tus herramientas actuales para que compartan datos automáticamente. Sin dobles entradas, sin desfases.",
  },
  {
    titulo: "Sin capacidad de crecer",
    problema: "Si crecemos un 20% más, no sé cómo lo vamos a gestionar...",
    solucion: "Procesos automatizados y escalables. Cuando creces, el sistema crece contigo sin necesitar el doble de personas.",
  },
  {
    titulo: "Los problemas llegan tarde",
    problema: "Me entero de los problemas cuando ya es demasiado tarde...",
    solucion: "Alertas proactivas configuradas sobre tus datos. Te avisamos antes de que el problema sea grande.",
  },
  {
    titulo: "Potencial sin explotar",
    problema: "Esto se podría automatizar, pero nadie sabe cómo...",
    solucion: "Diagnóstico de tu operativa y hoja de ruta de automatización. Identificamos qué se puede hacer y cuánto te ahorra.",
  },
  {
    titulo: "Herramientas obsoletas",
    problema: "Seguimos con el Excel de 2015 y nadie se atreve a cambiarlo...",
    solucion: "Migración progresiva a herramientas modernas sin romper lo que funciona. Nadie tiene que aprender todo de golpe.",
  },
  {
    titulo: "Hábito como freno",
    problema: "Siempre lo hemos hecho así y funciona, más o menos...",
    solucion: "Mejoramos sobre lo que ya existe, sin cambiar todo. El equipo adopta lo nuevo porque hace su trabajo más fácil.",
  },
  {
    titulo: "La tecnología parece solo para grandes",
    problema: "Eso de la IA está bien para las grandes, nosotros somos pequeños...",
    solucion: "Soluciones diseñadas para empresas de 10 a 200 personas. Nada de grandes proyectos: resultados desde el primer mes.",
  },
  {
    titulo: "No sé por dónde empezar",
    problema: "He visto demos, pero no tengo ni idea de por dónde empezar...",
    solucion: "Primera reunión de diagnóstico gratuita. Te decimos exactamente qué mejorar, en qué orden y qué resultado esperar.",
  },
];

const SPRING: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 28,
  mass: 0.9,
};

export default function ServiciosCarrusel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  function goTo(index: number) {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  }

  function prev() {
    goTo(current === 0 ? SERVICIOS.length - 1 : current - 1);
  }

  function next() {
    goTo(current === SERVICIOS.length - 1 ? 0 : current + 1);
  }

  const servicio = SERVICIOS[current];

  return (
    <div className="px-5 sm:px-8 py-10 sm:py-14" style={{ borderBottom: "1px solid var(--border)" }}>

      {/* Navegación superior */}
      <div className="flex items-center justify-between mb-8">
        <span
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 12,
            color: "var(--muted)",
          }}
        >
          {current + 1} / {SERVICIOS.length}
        </span>
        <div className="flex gap-2">
          <button
            onClick={prev}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 4,
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--muted)",
              fontSize: 16,
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "var(--fg)";
              e.currentTarget.style.color = "var(--fg)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--muted)";
            }}
            aria-label="Anterior"
          >
            ←
          </button>
          <button
            onClick={next}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 4,
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--muted)",
              fontSize: 16,
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "var(--fg)";
              e.currentTarget.style.color = "var(--fg)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--muted)";
            }}
            aria-label="Siguiente"
          >
            →
          </button>
        </div>
      </div>

      {/* Tarjeta con animación spring */}
      <div style={{ overflow: "hidden", position: "relative", minHeight: 280 }}>
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={{
              enter: (d: number) => ({
                x: d > 0 ? "60%" : "-60%",
                opacity: 0,
                scale: 0.96,
              }),
              center: {
                x: 0,
                opacity: 1,
                scale: 1,
              },
              exit: (d: number) => ({
                x: d > 0 ? "-60%" : "60%",
                opacity: 0,
                scale: 0.96,
              }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={SPRING}
            style={{ position: "absolute", width: "100%" }}
          >
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              {/* Título */}
              <div
                style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid var(--border)",
                  background: "var(--bg-section)",
                }}
              >
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {servicio.titulo}
                </h3>
              </div>

              {/* Problema + Solución */}
              <div className="grid sm:grid-cols-2">
                <div
                  style={{
                    padding: "24px",
                    borderBottom: "1px solid var(--border)",
                    borderRight: "1px solid var(--border)",
                  }}
                >
                  <p
                    className="text-xs font-medium uppercase tracking-widest mb-3"
                    style={{ color: "var(--muted)" }}
                  >
                    Problema
                  </p>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ fontStyle: "italic", opacity: 0.85 }}
                  >
                    {servicio.problema}
                  </p>
                </div>
                <div
                  style={{
                    padding: "24px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <p
                    className="text-xs font-medium uppercase tracking-widest mb-3"
                    style={{ color: "var(--accent)" }}
                  >
                    Solución
                  </p>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--muted)" }}
                  >
                    {servicio.solucion}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Barra de progreso */}
      <div
        style={{
          marginTop: 20,
          height: 2,
          background: "var(--border)",
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        <motion.div
          style={{ height: "100%", background: "var(--accent)", borderRadius: 1 }}
          animate={{ width: `${((current + 1) / SERVICIOS.length) * 100}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
        />
      </div>
    </div>
  );
}
