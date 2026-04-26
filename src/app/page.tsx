import PainTyper from "@/components/sections/PainTyper";
import ServiciosCarrusel from "@/components/sections/ServiciosCarrusel";
import ChatAgent from "@/components/sections/ChatAgent";
import Footer from "@/components/sections/Footer";
import Logo from "@/components/ui/Logo";
import ContactTrigger from "@/components/ui/ContactTrigger";

export default function Home() {
  return (
    <div
      className="max-w-5xl mx-auto"
      style={{
        borderLeft: "1px solid var(--border)",
        borderRight: "1px solid var(--border)",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <header
        className="px-5 sm:px-6 py-4 flex items-center justify-between gap-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <a href="/" aria-label="kroomix.com" className="inline-flex shrink-0">
          <Logo />
        </a>
        <ContactTrigger />
      </header>

      {/* Hero */}
      <div
        className="px-5 sm:px-8 py-14 sm:py-20 section-accent-left"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-section)" }}
      >
        <p
          className="text-xs font-medium uppercase tracking-widest mb-4"
          style={{ color: "var(--accent)" }}
        >
          Kroomix — Osona
        </p>
        <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight uppercase">
          Quien tiene un negocio,
          <span
            className="block font-medium mt-3 md:mt-5"
            style={{
              fontSize: "0.5em",
              color: "var(--muted)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            tiene problemas que solucionar<br />
            mejoras que adaptar<br />
            y dinero que ganar
          </span>
        </h1>
      </div>

      {/* Frases reales de empresarios */}
      <PainTyper />

      {/* Puente */}
      <div
        className="px-5 sm:px-8 py-10 sm:py-14 section-accent-left"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-section)" }}
      >
        <h2 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight uppercase">
          Tiene solución
        </h2>
        <p
          className="text-xs font-medium uppercase tracking-widest mt-3"
          style={{ color: "var(--muted)" }}
        >
          Estos son los problemas que resolvemos
        </p>
      </div>

      {/* Carrusel de servicios */}
      <ServiciosCarrusel />

      {/* CTA al chat */}
      <div
        className="px-5 sm:px-8 py-10 sm:py-14 section-accent-left"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-section)" }}
      >
        <h2 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight uppercase">
          ¿Cuál de estos es tu caso?
        </h2>
        <p
          className="text-xs font-medium uppercase tracking-widest mt-3"
          style={{ color: "var(--muted)" }}
        >
          Cuéntanoslo. En dos minutos te decimos si podemos ayudarte.
        </p>
      </div>

      <ChatAgent />

      <Footer />
    </div>
  );
}
