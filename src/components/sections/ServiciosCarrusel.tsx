"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";

const SERVICIOS = [
  {
    titulo: "Doble entrada de datos",
    problema: "El equipo registra el mismo pedido en el sistema de ventas y luego lo vuelve a meter a mano en el de almacén. Si alguien se olvida o se equivoca en uno, los datos no cuadran y nadie sabe cuál es el correcto hasta que el problema ya ha escalado.",
    solucion: "Conectamos los dos sistemas con una integración automática: el dato entra una sola vez y se propaga al resto. En una empresa de distribución, esto eliminó 2 horas diarias de trabajo administrativo y redujo los errores de stock a cero.",
  },
  {
    titulo: "Facturación lenta",
    problema: "Cada semana, una persona dedica toda la mañana a generar facturas manualmente desde un Excel, copiar datos del pedido, ajustar el formato y enviarlas una a una por email. Si hay volumen, se queda hasta tarde. Si está de baja, no se factura.",
    solucion: "Automatizamos la generación de facturas directamente desde los pedidos cerrados: se generan, se envían y se registran solas. El resultado habitual es pasar de 3-4 horas semanales a menos de 10 minutos de revisión.",
  },
  {
    titulo: "Procesamiento manual de documentos",
    problema: "Cada día llegan albaranes, presupuestos de proveedor o partes de trabajo en PDF. Alguien tiene que abrirlos uno a uno, leer los datos y transcribirlos al sistema. Con 30-40 documentos diarios, eso se convierte en el trabajo de media jornada.",
    solucion: "Implementamos extracción automática de datos desde documentos: el sistema lee el PDF, identifica los campos relevantes y los vuelca directamente en la base de datos. Resultado: de 4 horas al día a revisión automática en segundos.",
  },
  {
    titulo: "Datos contradictorios entre departamentos",
    problema: "Contabilidad dice que se facturaron 180.000€ el mes pasado. Ventas dice que fueron 195.000€. Almacén tiene otro número. Cada departamento trabaja con su propia hoja y nadie sabe cuál es la cifra real hasta que se cruzan manualmente al cierre.",
    solucion: "Creamos una capa de integración que unifica todas las fuentes en un único repositorio de datos. Todos los departamentos consultan el mismo número, en tiempo real. Resultado: reuniones de cierre que pasaron de 3 horas a 20 minutos.",
  },
  {
    titulo: "Excels descontrolados",
    problema: "Hay un Excel maestro que nadie toca porque la última vez que alguien lo modificó rompió las fórmulas. Hay otro con los datos del mes pasado que circula por email. Y un tercero que solo entiende la persona que lo creó hace dos años.",
    solucion: "Sustituimos la cadena de excels por una base de datos centralizada con interfaz sencilla. Los datos se introducen una sola vez y todos consultan la misma fuente. La empresa deja de depender de archivos que nadie se atreve a tocar.",
  },
  {
    titulo: "Información crítica en canales personales",
    problema: "Las condiciones acordadas con un cliente están en el WhatsApp del comercial. El estado de un pedido urgente está en el email de alguien que está de viaje. Cuando hay un problema, nadie tiene acceso a la información que necesita sin molestar a otra persona.",
    solucion: "Implementamos un sistema centralizado donde toda la comunicación relevante con clientes queda registrada y accesible para el equipo. Cualquier persona puede retomar una gestión sin depender de quién la inició. El tiempo de resolución de incidencias se reduce a la mitad.",
  },
  {
    titulo: "Sin visibilidad financiera en tiempo real",
    problema: "Para saber cuánto se ha facturado en el mes hay que pedírselo al administrativo, que tarda un día en cruzar datos de varios sitios. Cuando el dato llega, ya tiene dos días de retraso y no incluye los pedidos de hoy.",
    solucion: "Construimos un dashboard financiero conectado a las fuentes de datos reales: facturación, cobros y pendientes actualizados al minuto. El resultado es que el equipo directivo tiene la foto completa en tiempo real sin pedírsela a nadie.",
  },
  {
    titulo: "Rentabilidad por cliente opaca",
    problema: "Se trabaja mucho con ciertos clientes, se les da prioridad, se les hacen descuentos. Pero nadie ha calculado nunca si esa relación es rentable una vez descontado el tiempo de atención, las devoluciones y los plazos de pago que siempre se alargan.",
    solucion: "Cruzamos los datos de ventas, costes, horas y condiciones para generar un ranking de rentabilidad real por cliente. En varios casos hemos encontrado clientes que parecían buenos y generaban pérdidas netas. El output es una tabla que permite renegociar o priorizar con criterio.",
  },
  {
    titulo: "Costes que no cuadran",
    problema: "Los márgenes deberían ser del 28% pero el resultado real es del 19%. Hay 9 puntos que desaparecen en algún sitio pero nadie sabe dónde exactamente. Se sospecha de mermas, de tiempo no facturado o de compras fuera de proceso, pero no hay datos.",
    solucion: "Hacemos un análisis de costes cruzando compras, producción, tiempo y facturación. En la mayoría de casos encontramos 2-3 fugas concretas y cuantificables. El output es un informe con el origen del desvío y el impacto económico de corregirlo.",
  },
  {
    titulo: "Cobros que nadie persigue",
    problema: "Hay facturas vencidas desde hace meses que nadie ha reclamado porque no hay un proceso claro de seguimiento. El responsable de cobros lo lleva en su cabeza, pero cuando hay mucho volumen se le escapa. El resultado es deuda acumulada que a veces ya no se cobra.",
    solucion: "Automatizamos el ciclo completo de cobros: el sistema detecta las facturas vencidas, envía recordatorios escalonados y alerta al responsable cuando una factura supera el umbral definido. Empresas que usaban esto han reducido el DSO (días de cobro pendiente) en 18 días de media.",
  },
  {
    titulo: "Cash flow impredecible",
    problema: "A principios de mes parece que hay liquidez. A finales de mes hay que mover dinero entre cuentas para cubrir la nómina. El problema no es que se venda poco, es que no se sabe cuándo va a entrar el dinero ni cuándo van a salir los pagos grandes.",
    solucion: "Construimos un modelo de cash flow rolling a 13 semanas, alimentado automáticamente con los datos de cobros, pagos y compromisos existentes. El resultado es una proyección de tesorería que permite anticipar tensiones con 4-6 semanas de margen.",
  },
  {
    titulo: "Decisiones tomadas a ciegas",
    problema: "Se está considerando contratar a dos personas más o invertir en una máquina nueva. La decisión se toma en base a sensaciones y a lo que dice el asesor fiscal, que solo ve los números del año pasado. No hay análisis de impacto ni proyección de retorno.",
    solucion: "Construimos un modelo de simulación con los datos reales de la empresa: si contratas, cuándo se amortiza; si compras la máquina, en cuántos meses recuperas la inversión. El output es un análisis comparativo con escenarios para decidir con datos.",
  },
  {
    titulo: "Personal cualificado en tareas de bajo valor",
    problema: "El técnico senior dedica dos horas cada mañana a copiar datos de un sistema a otro, generar informes en Excel y enviarlos por email a los jefes de área. Es la persona más cara del departamento y hace trabajo que podría hacer un becario, o una máquina.",
    solucion: "Automatizamos la generación y distribución de informes: los datos se extraen, se consolidan y se envían solos en el horario configurado. El técnico recupera 8-10 horas semanales para trabajo de análisis real. El coste de la automatización se amortiza en menos de 2 meses.",
  },
  {
    titulo: "Rotación en puestos de entrada de datos",
    problema: "El puesto de operador de datos tiene una rotación anual del 80%. La formación de cada persona nueva tarda 3 semanas. Cuando alguien se va, se lleva el conocimiento y los errores del proceso se disparan. Nadie quiere hacer ese trabajo y se nota.",
    solucion: "Eliminamos el puesto como tal: automatizamos la captura, validación y registro de datos para que no haya que hacerlo manualmente. El personal que quedaba se reasignó a tareas de revisión y atención, con mucho menos abandono. La tasa de error bajó un 94%.",
  },
  {
    titulo: "Dependencia total del dueño",
    problema: "Cuando el propietario se va de vacaciones, el negocio ralentiza. Las decisiones se acumulan, los procesos que solo él conoce se pausan y el equipo trabaja en modo espera. No es un problema de confianza, es que los procesos están en su cabeza, no documentados en ningún sitio.",
    solucion: "Mapeamos, documentamos y automatizamos los procesos críticos que solo dependían del propietario. Cada proceso pasa a tener un flujo claro, un responsable asignado y reglas automáticas para los casos habituales. El negocio funciona igual con o sin él presente.",
  },
  {
    titulo: "Urgencias que bloquean la mejora",
    problema: "Hay cosas que todo el mundo sabe que hay que cambiar: el sistema de pedidos es un desastre, el proceso de onboarding de clientes es manual, la comunicación interna es caótica. Pero siempre hay algo más urgente. Llevan dos años diciéndolo y nada cambia.",
    solucion: "Implementamos en sprints cortos de 2-3 semanas, sin detener la operativa. Cada sprint resuelve un problema concreto y entrega un resultado visible. Esto permite cambiar sin parar, y los primeros resultados generan el impulso para seguir.",
  },
  {
    titulo: "Propuestas que no avanzan internamente",
    problema: "El responsable de operaciones sabe que hay que digitalizar el proceso de producción. Lo ha propuesto tres veces. Siempre hay objeciones: que si es muy caro, que si el equipo no va a aprender, que si no es el momento. El proyecto nunca arranca.",
    solucion: "Hacemos una estimación de coste-beneficio con los datos reales de la empresa: cuánto cuesta el proceso actual en horas y errores, cuánto costaría la solución y en cuánto tiempo se recupera. Con los números encima de la mesa, las objeciones pierden peso.",
  },
  {
    titulo: "Errores que se repiten sin solución",
    problema: "Cada mes hay errores en los albaranes de entrega: artículo equivocado, cantidad mal, dirección incorrecta. Se corrigen, se pide disculpas al cliente, y al mes siguiente vuelve a pasar. No es desidia, es que el proceso tiene un punto de fallo estructural que nadie ha atacado.",
    solucion: "Identificamos el punto exacto donde se introduce el error y añadimos una capa de validación automática que lo detecta antes de que salga el pedido. En empresas de distribución esto ha reducido las incidencias de entrega en más de un 80% en el primer mes.",
  },
  {
    titulo: "Pedidos sin trazabilidad",
    problema: "Un cliente llama para preguntar por su pedido. Nadie sabe exactamente en qué estado está sin llamar al almacén, que llama al transportista, que a veces no coge el teléfono. El cliente lleva esperando 20 minutos para recibir una respuesta que debería ser inmediata.",
    solucion: "Implementamos un sistema de seguimiento de pedidos con estados automáticos en cada etapa: preparado, enviado, en tránsito, entregado. El equipo ve el estado en tiempo real y el cliente puede consultarlo solo. Las llamadas de seguimiento se reducen drásticamente.",
  },
  {
    titulo: "Leads que se enfrían por respuesta lenta",
    problema: "Un potencial cliente pide presupuesto por la web o por email. La respuesta tarda 2-3 días porque hay que recopilar información, calcularlo y redactarlo. Para entonces, el cliente ya ha recibido respuesta de la competencia y ha tomado una decisión.",
    solucion: "Automatizamos la primera respuesta y la generación de presupuestos estándar: el lead recibe una respuesta en minutos con la información relevante y un presupuesto orientativo. La tasa de conversión de leads en reuniones aumentó un 40% en los primeros 60 días.",
  },
  {
    titulo: "Comunicaciones que se pierden",
    problema: "Hay emails de clientes que se quedan sin respuesta porque llegan cuando la bandeja está llena, porque la persona responsable estaba ocupada o porque alguien asumió que otro los había respondido. Cuando el cliente vuelve a escribir, ya está molesto.",
    solucion: "Implementamos un sistema de gestión de bandeja con asignación automática, recordatorios de SLA y alertas de no respuesta. Cada email de cliente tiene un responsable asignado y un plazo visible. Las quejas por falta de respuesta desaparecen prácticamente.",
  },
  {
    titulo: "Clientes sin respuesta durante días",
    problema: "Un cliente envía una consulta técnica el viernes por la tarde. El lunes a mediodía sigue sin respuesta porque el técnico no la vio, o la vio y la dejó para después. El cliente interpreta que no es importante para la empresa y empieza a mirar alternativas.",
    solucion: "Desplegamos un chatbot entrenado con la información del negocio que responde las consultas habituales al instante, 24/7. Las consultas complejas se escalan a persona con contexto completo. El tiempo de primera respuesta pasa de horas a segundos.",
  },
  {
    titulo: "Ventas cruzadas que nadie detecta",
    problema: "Un cliente compra siempre el mismo producto desde hace tres años. Nadie le ha ofrecido nunca los productos complementarios que tiene sentido que compre, porque no hay ningún sistema que identifique esa oportunidad ni que avise al comercial.",
    solucion: "Cruzamos el historial de compras con el catálogo para generar alertas automáticas de oportunidad. El comercial recibe una notificación cuando un cliente tiene perfil de compra de un producto que no ha pedido nunca. El ticket medio aumenta sin necesidad de más clientes.",
  },
  {
    titulo: "Sin historial unificado de clientes",
    problema: "Cuando un cliente llama con una queja, el comercial no sabe qué le vendió ni cuándo. El de soporte no sabe si es un cliente antiguo o nuevo. El de administración no sabe si tiene facturas pendientes. Cada departamento tiene su parte del puzzle y nadie tiene el cuadro completo.",
    solucion: "Implementamos un CRM centralizado donde cada interacción queda registrada: llamadas, emails, pedidos, incidencias y notas. Cualquier persona del equipo puede abrir la ficha del cliente y ver todo de un vistazo. El tiempo de gestión de incidencias se reduce a la mitad.",
  },
  {
    titulo: "Gestión del mes a toro pasado",
    problema: "Para saber si el mes va bien o mal hay que esperar al cierre contable, que llega a mitad del mes siguiente. Para entonces, lo que salió mal ya no tiene remedio. Las decisiones se toman siempre con datos de hace 6 semanas.",
    solucion: "Construimos un dashboard de seguimiento mensual conectado a las fuentes operativas en tiempo real: ventas, márgenes, cobros y gastos del día. El equipo directivo sabe cómo va el mes hoy, puede corregir a tiempo y no se lleva sorpresas en el cierre.",
  },
  {
    titulo: "Rendimiento del equipo sin datos",
    problema: "Hay personas en el equipo que trabajan mucho y otras que trabajan poco. Todos dicen estar ocupados. Sin métricas objetivas, es imposible saber quién está rindiendo, dónde hay cuellos de botella y cómo asignar mejor la carga de trabajo.",
    solucion: "Implementamos un panel de métricas de equipo basado en outputs medibles: tareas completadas, tiempos de respuesta, volumen gestionado. Sin vigilancia, con datos agregados. El resultado es que los managers pueden tomar decisiones sobre recursos con criterio real.",
  },
  {
    titulo: "Procesos que viven en la cabeza de alguien",
    problema: "Hay procesos críticos que solo sabe hacer una persona. Si esa persona falta, el proceso se para. Si se va de la empresa, se lleva el conocimiento. Se ha intentado documentarlo varias veces pero nunca se termina porque no hay tiempo.",
    solucion: "Documentamos los procesos críticos en formatos estructurados y los convertimos en flujos automatizados cuando es posible. El conocimiento deja de vivir en personas y pasa a vivir en el sistema. La empresa no depende de que nadie esté disponible.",
  },
  {
    titulo: "Sistemas que no comparten datos",
    problema: "El ERP de almacén y el CRM de ventas son de fabricantes distintos y nunca han hablado entre sí. Para saber si hay stock de un producto, el comercial tiene que llamar al almacén o acceder a un sistema distinto. Los datos siempre van por detrás de la realidad.",
    solucion: "Construimos una integración entre los dos sistemas que sincroniza stock, pedidos y precios en tiempo real. El comercial ve el stock actualizado desde el CRM sin salir de su herramienta. Las discrepancias entre sistemas desaparecen y el tiempo de gestión de pedidos se reduce.",
  },
  {
    titulo: "Procesos que no escalan",
    problema: "La empresa ha crecido un 30% en dos años y el equipo administrativo ha tenido que crecer proporcionalmente para absorber el volumen. Cada vez que hay más trabajo, la solución es contratar una persona más. Llega un punto en que el modelo no es sostenible.",
    solucion: "Automatizamos los procesos que crecen linealmente con el volumen: facturación, seguimiento de pedidos, comunicaciones estándar con clientes. El resultado es que el negocio puede crecer sin que el coste administrativo crezca al mismo ritmo. Una empresa dobló volumen sin añadir personal.",
  },
  {
    titulo: "Sin alertas tempranas de problemas",
    problema: "Cuando hay un problema con un pedido, con un proveedor o con un cliente, la empresa se entera cuando el cliente llama quejándose, cuando la entrega ya no llega a tiempo o cuando el impago ya tiene semanas. Siempre en modo reactivo.",
    solucion: "Configuramos un sistema de alertas automáticas sobre los indicadores críticos: pedidos parados más de X horas, entregas en riesgo de demora, facturas próximas a vencer, stock bajo mínimos. El equipo recibe la alerta antes de que el problema llegue al cliente.",
  },
  {
    titulo: "Saber que se puede mejorar pero no cómo",
    problema: "Todo el mundo tiene claro que hay procesos mejorables. El responsable de operaciones tiene una lista de 12 cosas que cambiaría si pudiera. Pero no sabe por dónde empezar, cuánto costaría ni qué impacto tendría cada mejora.",
    solucion: "Hacemos un diagnóstico estructurado de la operativa: mapeamos los procesos, medimos el tiempo y coste actual de cada uno, e identificamos los 3-5 puntos de mayor impacto. El output es una hoja de ruta priorizada con estimación de ahorro para cada mejora.",
  },
  {
    titulo: "Herramientas obsoletas que nadie toca",
    problema: "El sistema que gestiona los pedidos tiene 12 años. Funciona, más o menos. Pero no tiene API, no exporta datos fácilmente y cualquier cambio requiere llamar al proveedor y esperar semanas. Nadie lo toca porque da miedo que algo se rompa.",
    solucion: "Construimos una capa de integración alrededor del sistema antiguo sin tocar el núcleo: extrae los datos que necesita, los procesa fuera y los devuelve cuando hace falta. El sistema viejo sigue funcionando igual, pero ahora está conectado con el resto del ecosistema.",
  },
  {
    titulo: "El cambio que siempre se pospone",
    problema: "Se lleva tres años diciendo que hay que cambiar la forma en que se gestionan los proyectos. Todo el mundo está de acuerdo. Pero cada vez que se plantea, la respuesta es que ahora mismo no es buen momento, que hay que acabar esto primero, que ya se verá.",
    solucion: "Implementamos el cambio en paralelo a la operativa actual, sin obligar a nadie a abandonar lo que ya usa hasta que lo nuevo funciona bien. Cuando el equipo ve que es más fácil, el cambio sucede solo. Reducimos la fricción al mínimo para que no haya excusas.",
  },
  {
    titulo: "Tecnología percibida como cosa de grandes",
    problema: "El propietario ha visto casos de digitalización en grandes empresas con millones de inversión. La conclusión es que eso no es para ellos, que son demasiado pequeños, que no tienen departamento de IT ni presupuesto para esas cosas.",
    solucion: "Trabajamos exclusivamente con empresas de 10 a 200 personas. Las soluciones que implementamos están dimensionadas para su tamaño y presupuesto. El primer proyecto suele tener un coste inferior a lo que la empresa pierde en un mes por el problema que resuelve.",
  },
  {
    titulo: "Parálisis por falta de claridad",
    problema: "Se han visto demos, se ha hablado con proveedores, se ha leído sobre automatización. Hay demasiadas opciones y nadie tiene claro qué encaja con la empresa, qué es prioritario ni cuánto debería costar. El resultado es no hacer nada.",
    solucion: "La primera reunión es de diagnóstico, sin coste. En 60 minutos identificamos los 2-3 problemas con mayor impacto económico, proponemos una solución concreta para cada uno y ponemos un número al ahorro estimado. Sales con claridad de qué hacer, en qué orden y por qué.",
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
    <div style={{ borderBottom: "1px solid var(--border)" }}>
    <div className="px-5 sm:px-8 py-10 sm:py-14">

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

    </div>

    {/* Barra de progreso — full width, pegada al borde inferior */}
    <div style={{ height: 3, background: "var(--border)", overflow: "hidden" }}>
      <motion.div
        style={{ height: "100%", background: "var(--accent)" }}
        animate={{ width: `${((current + 1) / SERVICIOS.length) * 100}%` }}
        transition={{ type: "spring", stiffness: 200, damping: 30 }}
      />
    </div>
    </div>
  );
}
