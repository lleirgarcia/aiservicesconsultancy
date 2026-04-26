"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";

const SERVICIOS = [
  {
    titulo: "Doble entrada de datos",
    problema: "El equipo registra el mismo pedido en el sistema de ventas y luego lo vuelve a meter a mano en el de almacén. Si alguien se olvida o se equivoca en uno, los datos no cuadran y nadie sabe cuál es el correcto hasta que el problema ya ha escalado.",
    solucion: "Construimos una integración directa entre los dos sistemas mediante workflows automatizados: cuando se cierra un pedido en ventas, se crea automáticamente el movimiento de almacén con los mismos datos, sin intervención humana. El equipo deja de tocar nada. Resultado: 2 horas diarias recuperadas y errores de stock eliminados.",
  },
  {
    titulo: "Facturación lenta",
    problema: "Cada semana, una persona dedica toda la mañana a generar facturas manualmente desde un Excel, copiar datos del pedido, ajustar el formato y enviarlas una a una por email. Si hay volumen, se queda hasta tarde. Si está de baja, no se factura.",
    solucion: "Conectamos el sistema de pedidos con una herramienta de facturación del mercado: cuando un pedido se marca como entregado, la factura se genera, se envía al cliente por email y se registra en contabilidad sola. Nadie tiene que hacer nada. Resultado: de 4 horas semanales a 10 minutos de revisión.",
  },
  {
    titulo: "Procesamiento manual de documentos",
    problema: "Cada día llegan albaranes, presupuestos de proveedor o partes de trabajo en PDF. Alguien tiene que abrirlos uno a uno, leer los datos y transcribirlos al sistema. Con 30-40 documentos diarios, eso se convierte en el trabajo de media jornada.",
    solucion: "Implementamos un flujo de extracción automática con OCR inteligente: los documentos llegan a una carpeta o email, el sistema los lee, extrae los campos definidos (proveedor, importe, referencia, fecha) y los vuelca en la base de datos o ERP. El operario solo revisa las excepciones. Resultado: de 4 horas diarias a menos de 20 minutos.",
  },
  {
    titulo: "Datos contradictorios entre departamentos",
    problema: "Contabilidad dice que se facturaron 180.000€ el mes pasado. Ventas dice que fueron 195.000€. Almacén tiene otro número. Cada departamento trabaja con su propia hoja y nadie sabe cuál es la cifra real hasta que se cruzan manualmente al cierre.",
    solucion: "Creamos un pipeline de datos que extrae información de cada fuente (ERP, CRM, Excel, contabilidad) y la consolida en una base de datos central con las reglas de negocio acordadas. Todos los departamentos consultan ese único repositorio. Resultado: reuniones de cierre que pasaron de 3 horas a 20 minutos, sin discusiones sobre el dato correcto.",
  },
  {
    titulo: "Excels descontrolados",
    problema: "Hay un Excel maestro que nadie toca porque la última vez que alguien lo modificó rompió las fórmulas. Hay otro con los datos del mes pasado que circula por email. Y un tercero que solo entiende la persona que lo creó hace dos años.",
    solucion: "Migramos los datos a una base de datos estructurada con una interfaz sencilla para que el equipo introduzca y consulte datos. Las fórmulas críticas se convierten en lógica del sistema, no en celdas frágiles. Nadie vuelve a romper nada por accidente.",
  },
  {
    titulo: "Información crítica en canales personales",
    problema: "Las condiciones acordadas con un cliente están en el WhatsApp del comercial. El estado de un pedido urgente está en el email de alguien que está de viaje. Cuando hay un problema, nadie tiene acceso a la información que necesita sin molestar a otra persona.",
    solucion: "Configuramos un CRM del mercado donde cada interacción con el cliente se registra automáticamente: emails sincronizados, notas de llamada, acuerdos y estados de pedido. Cualquier persona del equipo abre la ficha del cliente y ve todo el historial sin preguntar a nadie.",
  },
  {
    titulo: "Sin visibilidad financiera en tiempo real",
    problema: "Para saber cuánto se ha facturado en el mes hay que pedírselo al administrativo, que tarda un día en cruzar datos de varios sitios. Cuando el dato llega, ya tiene dos días de retraso y no incluye los pedidos de hoy.",
    solucion: "Construimos un dashboard con herramientas de visualización del mercado conectado directamente a las fuentes operativas: ERP, facturación y banco. El panel muestra en tiempo real facturado, cobrado, pendiente de cobro y previsión del mes. Accesible desde el móvil, sin pedírselo a nadie.",
  },
  {
    titulo: "Rentabilidad por cliente opaca",
    problema: "Se trabaja mucho con ciertos clientes, se les da prioridad, se les hacen descuentos. Pero nadie ha calculado nunca si esa relación es rentable una vez descontado el tiempo de atención, las devoluciones y los plazos de pago que siempre se alargan.",
    solucion: "Cruzamos los datos de ventas, costes de producto, horas del equipo registradas y condiciones de pago para calcular el margen real por cliente. Construimos una tabla de rentabilidad actualizable trimestralmente. El output es un ranking que permite renegociar condiciones con datos concretos en la mano.",
  },
  {
    titulo: "Costes que no cuadran",
    problema: "Los márgenes deberían ser del 28% pero el resultado real es del 19%. Hay 9 puntos que desaparecen en algún sitio pero nadie sabe dónde exactamente. Se sospecha de mermas, de tiempo no facturado o de compras fuera de proceso, pero no hay datos.",
    solucion: "Construimos un modelo de análisis de costes que cruza las compras del ERP, las horas del sistema de producción y la facturación real. En la mayoría de casos encontramos 2-3 fugas concretas y cuantificables en menos de dos semanas. El output es un informe con origen del desvío, importe y acción correctora.",
  },
  {
    titulo: "Cobros que nadie persigue",
    problema: "Hay facturas vencidas desde hace meses que nadie ha reclamado porque no hay un proceso claro de seguimiento. El responsable de cobros lo lleva en su cabeza, pero cuando hay mucho volumen se le escapa. El resultado es deuda acumulada que a veces ya no se cobra.",
    solucion: "Automatizamos el ciclo de cobros con workflows automatizados: el sistema detecta facturas vencidas, envía un primer recordatorio automático a los 3 días, un segundo a los 10 y alerta al responsable a los 20. Todo configurable. El responsable solo gestiona los casos que no responden al proceso automático. DSO medio reducido en 18 días.",
  },
  {
    titulo: "Cash flow impredecible",
    problema: "A principios de mes parece que hay liquidez. A finales de mes hay que mover dinero entre cuentas para cubrir la nómina. El problema no es que se venda poco, es que no se sabe cuándo va a entrar el dinero ni cuándo van a salir los pagos grandes.",
    solucion: "Construimos un modelo de cash flow rolling a 13 semanas en una hoja estructurada conectada al banco y al sistema de facturación: entradas previstas por cliente según histórico de pago, salidas comprometidas por proveedor y nómina. Se actualiza solo cada semana. El resultado es ver tensiones de tesorería con 4-6 semanas de antelación.",
  },
  {
    titulo: "Decisiones tomadas a ciegas",
    problema: "Se está considerando contratar a dos personas más o invertir en una máquina nueva. La decisión se toma en base a sensaciones y a lo que dice el asesor fiscal, que solo ve los números del año pasado. No hay análisis de impacto ni proyección de retorno.",
    solucion: "Construimos un modelo de simulación con los datos reales de la empresa: coste actual del proceso, coste de la solución, ahorro estimado por mes y punto de amortización. Se presentan dos o tres escenarios con variables ajustables. El output es una tabla comparativa que permite defender o descartar la inversión con números propios.",
  },
  {
    titulo: "Personal cualificado en tareas de bajo valor",
    problema: "El técnico senior dedica dos horas cada mañana a copiar datos de un sistema a otro, generar informes en Excel y enviarlos por email a los jefes de área. Es la persona más cara del departamento y hace trabajo que podría hacer un becario, o una máquina.",
    solucion: "Automatizamos el flujo completo con workflows automatizados: extracción de datos del sistema origen, transformación y carga en la plantilla de informe, envío por email a los destinatarios configurados. Todo a la hora que se defina, sin que nadie toque nada. El técnico recupera 8-10 horas semanales. El coste se amortiza en menos de 6 semanas.",
  },
  {
    titulo: "Rotación en puestos de entrada de datos",
    problema: "El puesto de operador de datos tiene una rotación anual del 80%. La formación de cada persona nueva tarda 3 semanas. Cuando alguien se va, se lleva el conocimiento y los errores del proceso se disparan. Nadie quiere hacer ese trabajo y se nota.",
    solucion: "Automatizamos la captura y validación de datos con formularios estructurados y reglas de negocio integradas: el sistema acepta solo datos válidos, avisa de errores en tiempo real y registra todo solo. El rol se convierte en revisión de excepciones, no en entrada manual. Tasa de error reducida un 94%, rotación casi eliminada.",
  },
  {
    titulo: "Dependencia total del dueño",
    problema: "Cuando el propietario se va de vacaciones, el negocio ralentiza. Las decisiones se acumulan, los procesos que solo él conoce se pausan y el equipo trabaja en modo espera. No es un problema de confianza, es que los procesos están en su cabeza, no documentados en ningún sitio.",
    solucion: "Hacemos sesiones de mapeo de proceso con el propietario: grabamos, transcribimos y estructuramos cada flujo crítico con árbol de decisiones, responsables y excepciones. Los pasos repetitivos se automatizan con workflows o programas a medida si el proceso es complejo. Cada proceso tiene un dueño asignado y reglas claras. El negocio funciona igual sin él presente.",
  },
  {
    titulo: "Urgencias que bloquean la mejora",
    problema: "Hay cosas que todo el mundo sabe que hay que cambiar: el sistema de pedidos es un desastre, el proceso de onboarding de clientes es manual, la comunicación interna es caótica. Pero siempre hay algo más urgente. Llevan dos años diciéndolo y nada cambia.",
    solucion: "Trabajamos en sprints de 2 semanas con un entregable concreto y funcional al final de cada uno. No hacemos proyectos de 6 meses: el primer sprint ya resuelve algo real y medible. Esto desbloquea la parálisis porque hay resultados visibles desde la primera semana.",
  },
  {
    titulo: "Propuestas que no avanzan internamente",
    problema: "El responsable de operaciones sabe que hay que digitalizar el proceso de producción. Lo ha propuesto tres veces. Siempre hay objeciones: que si es muy caro, que si el equipo no va a aprender, que si no es el momento. El proyecto nunca arranca.",
    solucion: "Construimos un análisis de coste-beneficio con los datos reales de la empresa: cuántas horas se dedican al proceso actual, coste por hora, frecuencia de errores y coste de cada error. Lo comparamos con el coste de la solución y el tiempo de retorno. Con los números encima de la mesa, las objeciones pierden peso.",
  },
  {
    titulo: "Errores que se repiten sin solución",
    problema: "Cada mes hay errores en los albaranes de entrega: artículo equivocado, cantidad mal, dirección incorrecta. Se corrigen, se pide disculpas al cliente, y al mes siguiente vuelve a pasar. No es desidia, es que el proceso tiene un punto de fallo estructural que nadie ha atacado.",
    solucion: "Mapeamos el proceso de preparación de pedidos e identificamos el punto exacto donde se introduce el error. Añadimos una capa de validación automática: el sistema compara el artículo escaneado con el pedido y bloquea el envío si no cuadra. En empresas de distribución esto ha reducido las incidencias de entrega más de un 80% en el primer mes.",
  },
  {
    titulo: "Pedidos sin trazabilidad",
    problema: "Un cliente llama para preguntar por su pedido. Nadie sabe exactamente en qué estado está sin llamar al almacén, que llama al transportista, que a veces no coge el teléfono. El cliente lleva esperando 20 minutos para recibir una respuesta que debería ser inmediata.",
    solucion: "Implementamos un sistema de estados de pedido sincronizado entre almacén, logística y atención al cliente: preparado, enviado, en tránsito, entregado. Cada cambio de estado se actualiza en tiempo real. El comercial ve el estado desde su herramienta sin llamar a nadie, y el cliente recibe una notificación automática en cada paso.",
  },
  {
    titulo: "Leads que se enfrían por respuesta lenta",
    problema: "Un potencial cliente pide presupuesto por la web o por email. La respuesta tarda 2-3 días porque hay que recopilar información, calcularlo y redactarlo. Para entonces, el cliente ya ha recibido respuesta de la competencia y ha tomado una decisión.",
    solucion: "Construimos un flujo automatizado: cuando llega una solicitud, el sistema envía en minutos una respuesta personalizada con la información más relevante y, si el producto o servicio es estándar, un presupuesto orientativo generado automáticamente. El comercial solo interviene para cerrar. Tasa de conversión de leads en reuniones aumentó un 40% en 60 días.",
  },
  {
    titulo: "Comunicaciones que se pierden",
    problema: "Hay emails de clientes que se quedan sin respuesta porque llegan cuando la bandeja está llena, porque la persona responsable estaba ocupada o porque alguien asumió que otro los había respondido. Cuando el cliente vuelve a escribir, ya está molesto.",
    solucion: "Configuramos un sistema de gestión de bandeja con asignación automática por palabras clave o remitente, temporizador de SLA visible para el equipo y alerta automática si un email no recibe respuesta en el plazo definido. Cada mensaje tiene un responsable y un plazo. Las quejas por silencio desaparecen.",
  },
  {
    titulo: "Clientes sin respuesta durante días",
    problema: "Un cliente envía una consulta técnica el viernes por la tarde. El lunes a mediodía sigue sin respuesta porque el técnico no la vio, o la vio y la dejó para después. El cliente interpreta que no es importante para la empresa y empieza a mirar alternativas.",
    solucion: "Desplegamos un chatbot entrenado con el catálogo de productos, preguntas frecuentes y procedimientos de la empresa. Responde al instante las consultas habituales, 24/7. Las preguntas complejas se derivan a persona con el contexto de la conversación ya cargado. Tiempo de primera respuesta: de horas a segundos.",
  },
  {
    titulo: "Ventas cruzadas que nadie detecta",
    problema: "Un cliente compra siempre el mismo producto desde hace tres años. Nadie le ha ofrecido nunca los productos complementarios que tiene sentido que compre, porque no hay ningún sistema que identifique esa oportunidad ni que avise al comercial.",
    solucion: "Cruzamos el historial de compras del cliente con el catálogo completo y definimos reglas de afinidad: quién compra A suele comprar también B. El sistema detecta clientes que cumplen el perfil y aún no han comprado B, y genera una alerta para el comercial con el contexto listo. El ticket medio sube sin necesitar nuevos clientes.",
  },
  {
    titulo: "Sin historial unificado de clientes",
    problema: "Cuando un cliente llama con una queja, el comercial no sabe qué le vendió ni cuándo. El de soporte no sabe si es un cliente antiguo o nuevo. El de administración no sabe si tiene facturas pendientes. Cada departamento tiene su parte del puzzle y nadie tiene el cuadro completo.",
    solucion: "Implementamos un CRM del mercado o desarrollamos uno a medida si los existentes no encajan con el negocio, con sincronización automática de emails, pedidos del ERP e incidencias. Cada vez que alguien abre la ficha de un cliente ve el historial completo: últimas compras, conversaciones, facturas pendientes y notas del equipo. Sin preguntar a nadie.",
  },
  {
    titulo: "Gestión del mes a toro pasado",
    problema: "Para saber si el mes va bien o mal hay que esperar al cierre contable, que llega a mitad del mes siguiente. Para entonces, lo que salió mal ya no tiene remedio. Las decisiones se toman siempre con datos de hace 6 semanas.",
    solucion: "Construimos un dashboard operativo con herramientas de visualización del mercado conectado a las fuentes del negocio en tiempo real: ventas del día, margen acumulado del mes, cobros pendientes y comparativa con el mismo período del año anterior. Accesible desde móvil. El equipo directivo sabe cómo va el mes hoy y puede actuar antes del cierre.",
  },
  {
    titulo: "Rendimiento del equipo sin datos",
    problema: "Hay personas en el equipo que trabajan mucho y otras que trabajan poco. Todos dicen estar ocupados. Sin métricas objetivas, es imposible saber quién está rindiendo, dónde hay cuellos de botella y cómo asignar mejor la carga de trabajo.",
    solucion: "Definimos con el equipo 3-5 métricas de output medibles por rol (pedidos procesados, tiempo de respuesta, incidencias resueltas) y construimos un panel de seguimiento semanal. Sin cámaras ni micrófonos, con datos de sistemas que ya existen. El manager tiene visibilidad real para tomar decisiones sobre carga y recursos.",
  },
  {
    titulo: "Procesos que viven en la cabeza de alguien",
    problema: "Hay procesos críticos que solo sabe hacer una persona. Si esa persona falta, el proceso se para. Si se va de la empresa, se lleva el conocimiento. Se ha intentado documentarlo varias veces pero nunca se termina porque no hay tiempo.",
    solucion: "Hacemos sesiones de grabación con la persona que sabe el proceso: la vemos hacerlo, lo desglosamos paso a paso, documentamos las decisiones y excepciones con formato de árbol de decisión. Los pasos repetitivos se automatizan con workflows o con un programa a medida si la lógica es compleja. El resultado es un manual operativo vivo que cualquier persona puede seguir desde el primer día.",
  },
  {
    titulo: "Sistemas que no comparten datos",
    problema: "El ERP de almacén y el CRM de ventas son de fabricantes distintos y nunca han hablado entre sí. Para saber si hay stock de un producto, el comercial tiene que llamar al almacén o acceder a un sistema distinto. Los datos siempre van por detrás de la realidad.",
    solucion: "Construimos una integración bidireccional entre los dos sistemas usando sus APIs o mediante workflows automatizados si no tienen conexión directa. Si la integración es compleja, desarrollamos un conector a medida: stock actualizado en el CRM en tiempo real, pedidos del CRM reflejados en el ERP sin entrada manual.",
  },
  {
    titulo: "Procesos que no escalan",
    problema: "La empresa ha crecido un 30% en dos años y el equipo administrativo ha tenido que crecer proporcionalmente para absorber el volumen. Cada vez que hay más trabajo, la solución es contratar una persona más. Llega un punto en que el modelo no es sostenible.",
    solucion: "Identificamos los procesos que escalan linealmente con el volumen (facturación, confirmaciones, seguimiento) y los automatizamos: el sistema hace el mismo trabajo para 100 pedidos que para 10. Una empresa del sector distribución dobló su volumen en 18 meses sin añadir ninguna persona al área administrativa.",
  },
  {
    titulo: "Sin alertas tempranas de problemas",
    problema: "Cuando hay un problema con un pedido, con un proveedor o con un cliente, la empresa se entera cuando el cliente llama quejándose, cuando la entrega ya no llega a tiempo o cuando el impago ya tiene semanas. Siempre en modo reactivo.",
    solucion: "Configuramos un sistema de alertas automáticas sobre los indicadores críticos del negocio: pedido sin movimiento más de 4 horas, entrega con retraso respecto a fecha prometida, factura que vence en 72 horas, stock por debajo del mínimo. Las alertas llegan por email o Slack según preferencia. El equipo actúa antes de que el cliente se queje.",
  },
  {
    titulo: "Saber que se puede mejorar pero no cómo",
    problema: "Todo el mundo tiene claro que hay procesos mejorables. El responsable de operaciones tiene una lista de 12 cosas que cambiaría si pudiera. Pero no sabe por dónde empezar, cuánto costaría ni qué impacto tendría cada mejora.",
    solucion: "Hacemos un diagnóstico de operativa de 2-3 sesiones: mapeamos los procesos actuales, medimos el tiempo real que consumen y el coste por error. Priorizamos por impacto económico y facilidad de implementación. El output es una hoja de ruta con los 3-5 proyectos de mayor retorno, su coste estimado y el ahorro esperado para cada uno.",
  },
  {
    titulo: "Herramientas obsoletas que nadie toca",
    problema: "El sistema que gestiona los pedidos tiene 12 años. Funciona, más o menos. Pero no tiene API, no exporta datos fácilmente y cualquier cambio requiere llamar al proveedor y esperar semanas. Nadie lo toca porque da miedo que algo se rompa.",
    solucion: "Construimos una capa de integración alrededor del sistema antiguo sin modificarlo: extraemos los datos que necesitamos mediante scrapers o exportaciones programadas, los procesamos en un sistema intermedio y los enviamos a donde hacen falta. El sistema viejo sigue funcionando igual pero ahora está conectado con el resto del ecosistema.",
  },
  {
    titulo: "El cambio que siempre se pospone",
    problema: "Se lleva tres años diciendo que hay que cambiar la forma en que se gestionan los proyectos. Todo el mundo está de acuerdo. Pero cada vez que se plantea, la respuesta es que ahora mismo no es buen momento, que hay que acabar esto primero, que ya se verá.",
    solucion: "Arrancamos con un piloto de 2 semanas en paralelo a la operativa actual: el equipo prueba el nuevo sistema sin abandonar el viejo. Cuando ven que funciona mejor, el cambio sucede solo. No forzamos nada. Reducimos la fricción al mínimo para que la excusa de 'no es el momento' deje de tener sentido.",
  },
  {
    titulo: "Tecnología percibida como cosa de grandes",
    problema: "El propietario ha visto casos de digitalización en grandes empresas con millones de inversión. La conclusión es que eso no es para ellos, que son demasiado pequeños, que no tienen departamento de IT ni presupuesto para esas cosas.",
    solucion: "Trabajamos exclusivamente con empresas de 10 a 200 personas. Usamos herramientas del mercado y desarrollamos soluciones a medida cuando hace falta, sin infraestructura propia ni equipo técnico interno requerido. El primer proyecto tiene habitualmente un coste menor al gasto mensual que genera el problema que resuelve.",
  },
  {
    titulo: "Parálisis por falta de claridad",
    problema: "Se han visto demos, se ha hablado con proveedores, se ha leído sobre automatización. Hay demasiadas opciones y nadie tiene claro qué encaja con la empresa, qué es prioritario ni cuánto debería costar. El resultado es no hacer nada.",
    solucion: "La primera reunión es de diagnóstico, sin coste y sin compromiso. En 60 minutos analizamos la operativa, identificamos los 2-3 problemas con mayor impacto económico y proponemos una solución concreta para cada uno con su estimación de ahorro. Sales con un documento escrito: qué hacer, en qué orden, cuánto cuesta y qué resultado esperar.",
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
    <div className="px-[15px] sm:px-[27px] py-10 sm:py-14">

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

    </div>
  );
}
