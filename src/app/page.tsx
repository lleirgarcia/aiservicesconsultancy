import PainTyper from "@/components/sections/PainTyper";
import SimulatorClient from "@/components/sections/SimulatorClient";
import Summary from "@/components/sections/Summary";
import Deliverables from "@/components/sections/Deliverables";
import ChatAgent from "@/components/sections/ChatAgent";
import CasosDeUso from "@/components/sections/CasosDeUso";
import Footer from "@/components/sections/Footer";
import WorkflowDiagram from "@/components/sections/WorkflowDiagram";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import ContactTrigger from "@/components/ui/ContactTrigger";
import Logo from "@/components/ui/Logo";
import SectionLabel from "@/components/ui/SectionLabel";
import AssistantFab from "@/components/ui/AssistantFab";
import ScrollIntroModal from "@/components/ui/ScrollIntroModal";

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto" style={{ borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)", minHeight: "100vh" }}>
      {/* Header */}
      <header
        className="px-5 sm:px-6 py-4 flex items-center justify-between gap-3 sm:gap-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <a href="/" aria-label="kroomix.com" className="inline-flex shrink-0">
          <Logo />
        </a>
        <div className="flex items-center gap-4 sm:gap-8 text-center">
          <ContactTrigger />
          <LanguageSwitcher />
        </div>
      </header>

      {/* Título previo a la tabla de pains */}
      <div
        className="px-5 sm:px-8 py-10 sm:py-14 section-accent-left"
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
            tiene problemas que solucionar<br />mejoras que adaptar<br />y dinero que ganar
          </span>
        </h2>
      </div>

      {/* Frases reales del jefe (pains en lenguaje natural) tecleadas en pantalla */}
      <div data-collapsible style={{ ["--collapse-delay" as string]: "0ms" }}>
        <PainTyper />
      </div>

      {/* Título gancho */}
      <div
        className="px-5 sm:px-8 py-10 sm:py-14 section-accent-left"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-section)" }}
      >
        <h2 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight uppercase">
          Si algo de esto resuena contigo
        </h2>
        <p
          className="text-xs font-medium uppercase tracking-widest mt-3"
          style={{ color: "var(--muted)" }}
        >
          Tiene solución
        </p>
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
            className="px-5 sm:px-8 pt-6 pb-8 md:pt-8 md:pb-12"
            style={{ borderRight: "1px solid var(--border)" }}
          >
            <SectionLabel icon="info">De qué va esto</SectionLabel>
          </div>
          <div className="px-5 sm:px-8 pt-2 sm:pt-6 pb-8 md:pt-8 md:pb-12 flex flex-col gap-6 sm:gap-8">
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              La mayoría de empresas de 10 a 200 personas funcionan con procesos que han
              funcionado en el pasado pero ya están <span className="kw">obsoletos</span>,
              siguen utilizando <span className="kw">herramientas desactualizadas</span> o
              bien tienen procesos que funcionan, aunque{" "}
              <span className="kw">no del todo bien como deberían</span>.{" "}
              <span className="kw">Pedidos por WhatsApp</span>.{" "}
              <span className="kw">Facturas a mano</span>. Diferentes{" "}
              <span className="kw">Excels repartidos entre compañeros</span>.{" "}
              <span className="kw">Datos de clientes en diferentes sitios</span>. Un dueño o
              un responsable que sabe dónde está todo porque, si no, nadie lo sabe.
            </p>
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              No es un problema de personas. Es un problema de sistemas. Y tiene un coste
              real que casi nadie mide: horas perdidas, errores que se repiten, decisiones
              tomadas a ciegas.
            </p>
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              Esto va de ayudarte a digitalizar, organizar, automatizar, añadir inteligencia
              a los procesos y clarificar tus problemas con soluciones entendibles.
            </p>
          </div>
        </div>

        {/* Fila 2: por qué lo hacemos */}
        <div className="grid md:grid-cols-[280px_1fr]" style={{ borderBottom: "1px solid var(--border)" }}>
          <div
            className="px-5 sm:px-8 pt-6 pb-8 md:pt-8 md:pb-12"
            style={{ borderRight: "1px solid var(--border)" }}
          >
            <SectionLabel icon="target">Por qué lo hacemos</SectionLabel>
          </div>
          <div className="px-5 sm:px-8 pt-2 sm:pt-6 pb-8 md:pt-8 md:pb-12 flex flex-col gap-5">
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              Todas las empresas pueden tener una actualización que les haga{" "}
              <span className="kw">mejorar x10</span> (reducir costes, reducir
              tiempo, enfocarse en tareas más productivas, etc.).
            </p>
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              Mejor en la gestión de sus datos, mejor en la rapidez de su operativa interna,
              mejor en la resolución de problemas y mejor en la atención al cliente. Así se
              pierde <span className="kw">menos tiempo en tareas que no aportan valor</span>,
              se reducen <span className="kw">gastos innecesarios</span>, se toman{" "}
              <span className="kw">decisiones basadas en datos</span> y el equipo se dedica
              a lo que de verdad importa: el negocio.
            </p>
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              Vivimos en un momento en el que la tecnología permite crear soluciones
              personalizadas y adaptadas a tus problemas, solucionar parte de tus dolores como empresa y
              potenciar el negocio como nunca antes había sido posible.
            </p>
          </div>
        </div>

        {/* Fila 3: cómo lo hacemos */}
        <div className="grid md:grid-cols-[280px_1fr]">
          <div
            className="px-5 sm:px-8 pt-6 pb-8 md:pt-8 md:pb-12"
            style={{ borderRight: "1px solid var(--border)" }}
          >
            <SectionLabel icon="workflow">Cómo lo hacemos</SectionLabel>
          </div>
          <div className="px-5 sm:px-8 pt-2 sm:pt-6 pb-8 md:pt-8 md:pb-12 flex flex-col gap-5">
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              Hablamos contigo, entendemos el negocio, detectamos los dolores y descubrimos
              cosas que quizás no sabías. Sí, muchas veces{" "}
              <span className="kw">«no se sabe lo que aún no se sabe»</span>.
            </p>
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              Identificamos las problemáticas y definimos posibles soluciones. No cambiamos
              todas las herramientas que ya usas: creamos e incorporamos las capas necesarias
              para resolver los problemas{" "}
              <span className="kw">sin romper lo que funciona</span>.
            </p>
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              Formamos al equipo para que funcione{" "}
              <span className="kw">sin depender de nosotros</span>. Y medimos el resultado
              antes y después para que{" "}
              <span className="kw">el ahorro sea visible</span>.
            </p>
          </div>
        </div>

      </div>
      </div>

      {/* EJEMPLOS Y CASOS DE USO */}
      <div style={{ borderBottom: "1px solid var(--border)" }}>

        {/* Título de sección */}
        <div
          className="section-accent-left"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-section)" }}
        >
          <div
            className="px-5 sm:px-8 flex items-center gap-4 sm:gap-8 relative overflow-hidden py-10 sm:py-9"
          >
            <div className="flex flex-col">
              <h2 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight uppercase">
                Ejemplos y casos de uso
              </h2>
              <p
                className="text-xs font-medium uppercase tracking-widest mt-3"
                style={{ color: "var(--muted)" }}
              >
                Descubre tus potenciales problemas
              </p>
            </div>
            {/* Imágenes decorativas (jefe_empleados / mailbox_lleno) ocultas temporalmente */}
          </div>
        </div>

        {/* Carrusel de casos de uso */}
        <div data-collapsible style={{ ["--collapse-delay" as string]: "300ms" }}>
          <div>
            <CasosDeUso />
          </div>
        </div>

      </div>

      {/* LOS SISTEMAS */}
      <div style={{ borderBottom: "1px solid var(--border)" }}>
        <div
          className="px-5 sm:px-8 py-10 sm:py-14 section-accent-left"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-section)" }}
        >
          <h2 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight uppercase">
            Los sistemas
          </h2>
          <p
            className="text-xs font-medium uppercase tracking-widest mt-3"
            style={{ color: "var(--muted)" }}
          >
            El antes y el después de digitalizar tu operativa
          </p>
        </div>

        <WorkflowDiagram />
      </div>

      {/* ¿POR QUÉ TRABAJAR CON NOSOTROS? */}
      <div style={{ borderBottom: "1px solid var(--border)" }}>

        {/* Título de sección */}
        <div
          className="px-5 sm:px-8 py-10 sm:py-14 section-accent-left"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-section)" }}
        >
          <h2 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight uppercase">
            ¿Por qué trabajar con nosotros?
          </h2>
          <p
            className="text-xs font-medium uppercase tracking-widest mt-3"
            style={{ color: "var(--muted)" }}
          >
            Si quieres simplificar tu operativa y adaptarte a una nueva era
          </p>
        </div>

        <div data-collapsible style={{ ["--collapse-delay" as string]: "450ms" }}>
        {/* Fila 1: Quiénes somos */}
        <div
          className="grid md:grid-cols-[280px_1fr]"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div
            className="px-5 sm:px-8 pt-6 pb-8 md:pt-8 md:pb-12"
            style={{ borderRight: "1px solid var(--border)" }}
          >
            <SectionLabel icon="team">Quiénes somos</SectionLabel>
          </div>
          <div className="px-5 sm:px-8 pt-2 sm:pt-6 pb-8 md:pt-8 md:pb-12 flex flex-col gap-5">
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              Somos un equipo de arquitectos de soluciones digitales especializados en nuevas tecnologías,
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
            className="px-5 sm:px-8 pt-6 pb-8 md:pt-8 md:pb-12"
            style={{ borderRight: "1px solid var(--border)" }}
          >
            <SectionLabel icon="gear">Qué hacemos por ti</SectionLabel>
          </div>
          <div className="px-5 sm:px-8 pt-2 sm:pt-6 pb-8 md:pt-8 md:pb-12 flex flex-col gap-5">
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              Entendemos tu negocio, tu día a día, tu problemática, tus procesos y te
              proponemos y construimos soluciones que simplifican lo complejo, automatizan
              lo repetitivo y clarifican esas áreas que todavía no conoces, donde quizás
              pierdes energía, tiempo y dinero.
            </p>
            <p className="text-base leading-relaxed" style={{ color: "var(--muted)" }}>
              Los objetivos son claros: utilizar la tecnología para ahorrarte quebraderos
              de cabeza, tiempos, costes y recursos, y mejorar la productividad real de
              cada persona de tu equipo.
            </p>
          </div>
        </div>

        {/* Fila 3: Mostramos lo que podemos hacer */}
        <div className="grid md:grid-cols-[280px_1fr]">
          <div
            className="px-5 sm:px-8 pt-6 pb-8 md:pt-8 md:pb-12"
            style={{ borderRight: "1px solid var(--border)" }}
          >
            <SectionLabel icon="eye">Mostramos lo que podemos hacer</SectionLabel>
          </div>
          <div className="px-5 sm:px-8 pt-2 sm:pt-6 pb-8 md:pt-8 md:pb-12 flex flex-col gap-5">
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
        {/* <Summary /> — oculto temporalmente, sustituido por <Deliverables /> */}
        {/* <Deliverables /> — oculto temporalmente a petición */}

        {/* Título de sección: CTA al formulario */}
        <div
          className="px-5 sm:px-8 py-10 sm:py-14 section-accent-left"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-section)" }}
        >
          <h2 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight uppercase">
            ¿Quieres saber si podemos solucionarte tus problemas?
          </h2>
        </div>

        <div data-collapsible style={{ ["--collapse-delay" as string]: "600ms" }}>
          <ChatAgent />
        </div>
      </div>

      <Footer />

      <AssistantFab />
      <ScrollIntroModal />
    </div>
  );
}
