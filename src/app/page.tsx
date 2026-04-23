import Image from "next/image";
import PainTyper from "@/components/sections/PainTyper";
import SimulatorClient from "@/components/sections/SimulatorClient";
import Summary from "@/components/sections/Summary";
import ContactForm from "@/components/sections/ContactForm";
import Footer from "@/components/sections/Footer";
import WorkflowDiagram from "@/components/sections/WorkflowDiagram";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import ContactTrigger from "@/components/ui/ContactTrigger";
import Logo from "@/components/ui/Logo";
import SectionLabel from "@/components/ui/SectionLabel";
import CollapseIntro from "@/components/ui/CollapseIntro";

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto" style={{ borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)", minHeight: "100vh" }}>
      {/* Intro: todas las secciones arrancan plegadas y se despliegan a los 2s */}
      <CollapseIntro delay={2000} />

      {/* Header */}
      <header
        className="px-6 py-4 flex items-center justify-between gap-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <a href="/" aria-label="fixtheops.com" className="inline-flex">
          <Logo size={22} />
        </a>
        <div className="flex items-center gap-8 text-center">
          <ContactTrigger />
          <LanguageSwitcher />
        </div>
      </header>

      {/* Título previo a la tabla de pains */}
      <div
        className="px-8 py-14 section-accent-left"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-section)" }}
      >
        <h2 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight uppercase">
          Quien tiene un negocio,
          <span
            className="block font-medium mt-3 md:mt-4"
            style={{
              fontSize: "0.5em",
              color: "var(--muted)",
              letterSpacing: "0.08em",
            }}
          >
            tiene problemas que debe solucionar<br />o mejoras que adaptar a todos los niveles
          </span>
        </h2>
      </div>

      {/* Frases reales del jefe (pains en lenguaje natural) tecleadas en pantalla */}
      <div data-collapsible style={{ ["--collapse-delay" as string]: "0ms" }}>
        <PainTyper />
      </div>

      {/* Título gancho */}
      <div
        className="px-8 py-14 flex items-center gap-6 section-accent-left"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-section)" }}
      >
        <span className="text-lg animate-bounce flex-shrink-0" style={{ color: "var(--accent)" }}>↓</span>
        <h2 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight uppercase text-center flex-1">
          Resuena contigo, sigue leyendo
        </h2>
        <span className="text-lg animate-bounce flex-shrink-0" style={{ color: "var(--accent)" }}>↓</span>
      </div>

      {/* Sección de contexto */}
      <div data-collapsible style={{ ["--collapse-delay" as string]: "150ms" }}>
      <div style={{ borderBottom: "1px solid var(--border)" }}>

        {/* Fila 1: contexto */}
        <div
          className="grid md:grid-cols-[280px_1fr]"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div
            className="px-8 pt-6 pb-10 md:pt-8 md:pb-12"
            style={{ borderRight: "1px solid var(--border)" }}
          >
            <SectionLabel icon="info">De qué va esto</SectionLabel>
          </div>
          <div className="px-8 pt-6 pb-10 md:pt-8 md:pb-12 flex flex-col gap-8">
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              La mayoría de empresas de 10 a 200 personas funcionan con procesos que nadie ha
              cuestionado nunca. Pedidos por WhatsApp. Facturas a mano. Un Excel que siempre va
              por detrás. Datos repartidos en diferentes sitios. Un dueño o un responsable que
              sabe dónde está todo porque si no, nadie lo sabe.
            </p>
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              No es un problema de personas. Es un problema de sistemas. Y tiene un coste
              real que casi nadie mide: horas perdidas, errores que se repiten, decisiones
              tomadas a ciegas.
            </p>
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              Nosotros te ayudamos a digitalizar, automatizar y clarificar tus problemas con
              soluciones.
            </p>
          </div>
        </div>

        {/* Fila 2: por qué lo hacemos */}
        <div className="grid md:grid-cols-[280px_1fr]" style={{ borderBottom: "1px solid var(--border)" }}>
          <div
            className="px-8 pt-6 pb-10 md:pt-8 md:pb-12"
            style={{ borderRight: "1px solid var(--border)" }}
          >
            <SectionLabel icon="target">Por qué lo hacemos</SectionLabel>
          </div>
          <div className="px-8 pt-6 pb-10 md:pt-8 md:pb-12 flex flex-col gap-5">
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              Todas las empresas pueden tener una actualización que les haga mejorar x10.
            </p>
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              Mejor en la gestión de sus datos, mejor en la rapidez de su operativa interna,
              mejor en la resolución de problemas y mejor en la atención al cliente. Así se
              pierde menos tiempo en tareas que no aportan valor, se reducen gastos
              innecesarios, se toman mejores decisiones basadas en datos y el equipo se
              dedica a lo que de verdad importa: el negocio.
            </p>
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              Vivimos en un momento en el que la tecnología permite crear soluciones
              personalizadas y adaptadas a tus problemas, conectar tus dolores como empresa y
              potenciar el negocio como nunca antes había sido posible.
            </p>
          </div>
        </div>

        {/* Fila 3: cómo lo hacemos */}
        <div className="grid md:grid-cols-[280px_1fr]">
          <div
            className="px-8 pt-6 pb-10 md:pt-8 md:pb-12"
            style={{ borderRight: "1px solid var(--border)" }}
          >
            <SectionLabel icon="workflow">Cómo lo hacemos</SectionLabel>
          </div>
          <div className="px-8 pt-6 pb-10 md:pt-8 md:pb-12 flex flex-col gap-5">
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              Hablamos contigo, entendemos el negocio, detectamos los dolores y descubrimos
              cosas que quizás no sabías. Sí, muchas veces «no se sabe lo que aún no se
              sabe».
            </p>
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              Identificamos las problemáticas y definimos posibles soluciones. No cambiamos
              todas las herramientas que ya usas: creamos e incorporamos las capas necesarias
              para resolver los problemas sin romper lo que funciona.
            </p>
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              Formamos al equipo para que funcione sin depender de nosotros. Y medimos el
              resultado antes y después para que el ahorro sea visible.
            </p>
          </div>
        </div>

      </div>
      </div>

      {/* EJEMPLOS Y CASOS DE USO */}
      <div style={{ borderBottom: "1px solid var(--border)" }}>

        {/* Título de sección */}
        <div
          className="px-8 flex items-center gap-8 relative overflow-hidden section-accent-left"
          style={{ paddingTop: 36, paddingBottom: 36, borderBottom: "1px solid var(--border)", background: "var(--bg-section)" }}
        >
          <h2 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight uppercase">
            Ejemplos y casos de uso
          </h2>
          <div
            className="hidden md:block shrink-0 relative"
            style={{ width: 220, height: 95, overflow: "hidden", transform: "translate(-65px, 42px)" }}
            aria-hidden="true"
          >
            <Image
              src="/jefe_empleados.png"
              alt=""
              width={1536}
              height={1024}
              style={{ width: 220, height: "auto", display: "block" }}
            />
          </div>
          <div
            className="hidden md:block shrink-0 relative ml-auto"
            style={{ width: 158, height: 110, overflow: "hidden", transform: "translate(20px, 52px)" }}
            aria-hidden="true"
          >
            <Image
              src="/mailbox_lleno_v2.png"
              alt=""
              width={1536}
              height={1024}
              style={{ width: 158, height: "auto", display: "block" }}
            />
          </div>
        </div>

        {/* Grid de casos */}
        <div data-collapsible style={{ ["--collapse-delay" as string]: "300ms" }}>
        <div className="grid grid-cols-1 md:grid-cols-3">

          {/* Caso 1 */}
          <div
            className="px-8 pt-6 md:pt-8 row-span-2 grid [grid-template-rows:subgrid]"
            style={{ borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex flex-col gap-3 pb-6">
              <p className="text-xs font-semibold uppercase tracking-wide">Control del trabajo del equipo</p>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--muted)" }}>Problema</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                Llega un cliente preguntando por su pedido y nadie sabe quién lo está
                gestionando. Las tareas viven en post-its, WhatsApp y en la cabeza de cada
                uno: unas se olvidan, otras se hacen dos veces y casi ninguna se mide.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-5 pb-10 md:pb-12" style={{}}>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--muted)" }}>Solución</p>
              <ol className="flex flex-col gap-1 text-sm list-decimal list-inside" style={{ color: "var(--muted)" }}>
                <li>Cada tarea queda registrada con responsable, plazo y tiempos reales</li>
                <li>Ves qué procesos consumen más horas y dónde se atasca el equipo</li>
                <li>En cualquier momento sabes qué está pasando sin tener que preguntarlo</li>
              </ol>
            </div>
          </div>

          {/* Caso 2 */}
          <div
            className="px-8 pt-6 md:pt-8 row-span-2 grid [grid-template-rows:subgrid]"
            style={{ borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex flex-col gap-3 pb-6">
              <p className="text-xs font-semibold uppercase tracking-wide">Dependencia del dueño</p>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--muted)" }}>Problema</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                Si el dueño se va de viaje o se pone enfermo, todo se ralentiza. El equipo le
                llama para decisiones que solo él sabe responder porque el conocimiento
                importante vive en su cabeza, no en la empresa.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-5 pb-10 md:pb-12" style={{}}>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--muted)" }}>Solución</p>
              <ol className="flex flex-col gap-1 text-sm list-decimal list-inside" style={{ color: "var(--muted)" }}>
                <li>Sacamos de su cabeza los procesos clave y los documentamos</li>
                <li>Los convertimos en flujos automatizados e inteligentes que siguen a rajatabla</li>
                <li>La operativa del día a día deja de depender de una sola persona</li>
              </ol>
            </div>
          </div>

          {/* Caso 3 */}
          <div
            className="px-8 pt-6 md:pt-8 row-span-2 grid [grid-template-rows:subgrid]"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex flex-col gap-3 pb-6">
              <p className="text-xs font-semibold uppercase tracking-wide">Emails que se acumulan</p>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--muted)" }}>Problema</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                Cada mañana la bandeja empieza llena y acaba más llena. Horas respondiendo
                siempre lo mismo, correos importantes que se pierden entre avisos y newsletters,
                y clientes esperando dos días por una respuesta sencilla.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-5 pb-10 md:pb-12" style={{}}>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--muted)" }}>Solución</p>
              <ol className="flex flex-col gap-1 text-sm list-decimal list-inside" style={{ color: "var(--muted)" }}>
                <li>Cada email se lee, se clasifica por tipo y se prioriza automáticamente</li>
                <li>Respuestas inteligentes para los casos repetidos (presupuestos, estado de pedido, documentación)</li>
                <li>Solo llega al responsable cuando hace falta una decisión humana</li>
              </ol>
            </div>
          </div>

          {/* Caso 4 */}
          <div
            className="px-8 pt-6 md:pt-8 row-span-2 grid [grid-template-rows:subgrid]"
            style={{ borderRight: "1px solid var(--border)" }}
          >
            <div className="flex flex-col gap-3 pb-6">
              <p className="text-xs font-semibold uppercase tracking-wide">Datos sin utilidad</p>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--muted)" }}>Problema</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                Hay años de historial en el CRM, el ERP y varios Excels. Pero si alguien
                pregunta «¿qué cliente nos deja más margen?», nadie sabe responder sin montar
                un Excel a mano durante dos días. Los datos están, pero no sirven.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-5 pb-10 md:pb-12" style={{}}>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--muted)" }}>Solución</p>
              <ol className="flex flex-col gap-1 text-sm list-decimal list-inside" style={{ color: "var(--muted)" }}>
                <li>Dashboard que cruza ventas, pedidos, márgenes y costes</li>
                <li>Detecta patrones: quién compra más, quién se está enfriando, qué producto cuesta dinero</li>
                <li>Ves de un vistazo qué clientes, productos y canales ganan dinero de verdad</li>
              </ol>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                Resultado: decisiones basadas en datos, foco en los clientes clave y mejora
                directa de márgenes.
              </p>
            </div>
          </div>

          {/* Caso 5 */}
          <div
            className="px-8 pt-6 md:pt-8 row-span-2 grid [grid-template-rows:subgrid]"
            style={{ borderRight: "1px solid var(--border)" }}
          >
            <div className="flex flex-col gap-3 pb-6">
              <p className="text-xs font-semibold uppercase tracking-wide">Clientes potenciales perdidos</p>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--muted)" }}>Problema</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                Un cliente pide presupuesto un viernes por la tarde. El lunes nadie lo ve, el
                martes alguien se acuerda, y cuando por fin se responde, ya ha contratado a
                otro. No se pierde por precio: se pierde por tiempo de reacción.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-5 pb-10 md:pb-12" style={{}}>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--muted)" }}>Solución</p>
              <ol className="flex flex-col gap-1 text-sm list-decimal list-inside" style={{ color: "var(--muted)" }}>
                <li>Capturamos automáticamente cada consulta desde email, web, formulario o WhatsApp</li>
                <li>Se asigna al responsable adecuado con un plazo claro de respuesta</li>
                <li>Si pasa el tiempo y nadie contesta, el sistema avisa antes de perder al cliente</li>
              </ol>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                Resultado: recuperar entre el 10 y el 20 % de las oportunidades que hoy se
                escapan sin que nadie lo note.
              </p>
            </div>
          </div>

          {/* Caso 6 */}
          <div
            className="px-8 pt-6 md:pt-8 row-span-2 grid [grid-template-rows:subgrid]"
          >
            <div className="flex flex-col gap-3 pb-6">
              <p className="text-xs font-semibold uppercase tracking-wide">Facturas manuales</p>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--muted)" }}>Problema</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                Cada mes llegan más de 200 facturas de proveedores en PDF. Dos personas
                dedicadas casi en exclusiva a abrirlas, leerlas y teclearlas a mano en el
                Excel o el ERP. Errores de dedo, duplicados y cierre de mes siempre a
                contrarreloj.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-5 pb-10 md:pb-12" style={{}}>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--muted)" }}>Solución</p>
              <ol className="flex flex-col gap-1 text-sm list-decimal list-inside" style={{ color: "var(--muted)" }}>
                <li>Cada PDF que entra se lee automáticamente en cuanto llega</li>
                <li>Se extraen los datos clave: proveedor, importes, conceptos, fechas e IVA</li>
                <li>Quedan registrados directamente en el ERP o la contabilidad, sin teclear</li>
              </ol>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                Resultado: −70 % de tiempo administrativo, menos errores y el equipo liberado
                para tareas que sí aportan valor.
              </p>
            </div>
          </div>

        </div>
        </div>

      </div>

      {/* Workflow diagram */}
      <WorkflowDiagram />

      {/* ¿POR QUÉ TRABAJAR CON NOSOTROS? */}
      <div style={{ borderBottom: "1px solid var(--border)" }}>

        {/* Título de sección */}
        <div
          className="px-8 py-14 section-accent-left"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-section)" }}
        >
          <h2 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight uppercase">
            ¿Por qué trabajar con nosotros?
          </h2>
        </div>

        <div data-collapsible style={{ ["--collapse-delay" as string]: "450ms" }}>
        {/* Fila 1: Quiénes somos */}
        <div
          className="grid md:grid-cols-[280px_1fr]"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div
            className="px-8 pt-6 pb-10 md:pt-8 md:pb-12"
            style={{ borderRight: "1px solid var(--border)" }}
          >
            <SectionLabel icon="team">Quiénes somos</SectionLabel>
          </div>
          <div className="px-8 pt-6 pb-10 md:pt-8 md:pb-12 flex flex-col gap-5">
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              Somos un equipo de ingenieros de software especializados en nuevas tecnologías,
              automatización, inteligencia artificial y resolución de problemas complejos.
            </p>
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              Hemos trabajado en sectores e industrias muy distintos, así que no venimos con
              una plantilla: venimos a entender tu caso concreto y proponerte las mejores
              soluciones.
            </p>
          </div>
        </div>

        {/* Fila 2: Qué hacemos por ti */}
        <div
          className="grid md:grid-cols-[280px_1fr]"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div
            className="px-8 pt-6 pb-10 md:pt-8 md:pb-12"
            style={{ borderRight: "1px solid var(--border)" }}
          >
            <SectionLabel icon="gear">Qué hacemos por ti</SectionLabel>
          </div>
          <div className="px-8 pt-6 pb-10 md:pt-8 md:pb-12 flex flex-col gap-5">
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              Entendemos tu problemática, abstraemos tus procesos y construimos soluciones
              que simplifican lo complejo y se integran con lo que ya usas.
            </p>
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              El objetivo es claro: ahorrarte quebraderos de cabeza, tiempo, costes y
              recursos, y mejorar la productividad real de cada persona de tu equipo.
            </p>
          </div>
        </div>

        {/* Fila 3: Mostramos lo que podemos hacer */}
        <div className="grid md:grid-cols-[280px_1fr]">
          <div
            className="px-8 pt-6 pb-10 md:pt-8 md:pb-12"
            style={{ borderRight: "1px solid var(--border)" }}
          >
            <SectionLabel icon="eye">Mostramos lo que podemos hacer</SectionLabel>
          </div>
          <div className="px-8 pt-6 pb-10 md:pt-8 md:pb-12 flex flex-col gap-5">
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              Verás ejemplos concretos de procesos que se pueden simplificar y automatizar;
              esta es la mejor manera de entender qué hacemos y qué podríamos llegar a hacer
              en tu empresa. El conocimiento de ambas partes detecta los problemas y define
              las soluciones finales.
            </p>
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              Es por eso que te enseñamos potenciales soluciones a problemas.
            </p>
          </div>
        </div>
        </div>

      </div>

      {/* Hero / CTA — oculto temporalmente */}
      {/*
      <div style={{ borderBottom: "1px solid var(--border)" }}>
        <Hero />
      </div>
      <div
        className="px-6 py-10 text-center"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          —&nbsp;&nbsp;Esto tiene solución&nbsp;&nbsp;—
        </p>
      </div>
      */}

      {/* Resto de la página */}
      <div>
        {/* <PainPoints /> — oculto temporalmente */}
        {/* <SimulatorClient /> — oculto temporalmente */}
        <Summary />

        {/* Título de sección: CTA al formulario */}
        <div
          className="px-8 py-14 section-accent-left"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-section)" }}
        >
          <h2 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight uppercase">
            Deja tus datos y nuestro agente te contactará
          </h2>
        </div>

        <div data-collapsible style={{ ["--collapse-delay" as string]: "600ms" }}>
          <ContactForm />
        </div>
      </div>

      <Footer />
    </div>
  );
}
