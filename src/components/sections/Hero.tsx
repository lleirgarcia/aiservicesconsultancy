"use client";

import Button from "@/components/ui/Button";

export default function Hero() {
  const handleScroll = () => {
    document.getElementById("simulador")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="px-6 py-16 md:py-20 max-w-4xl mx-auto">
      <p
        className="text-xs font-medium uppercase tracking-widest mb-6"
        style={{ color: "var(--muted)" }}
      >
        Empresas industriales · Distribución · Logística · Osona
      </p>

      <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-5">
        Descubre cuánto<br />te cuestan estos<br />problemas
      </h1>

      <p className="text-base mb-8 max-w-lg" style={{ color: "var(--muted)" }}>
        Mete los datos de tu empresa y en dos minutos tienes el número exacto.
        Sin rodeos.
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <Button onClick={handleScroll}>
          Calcular mi ahorro →
        </Button>
        <span className="text-sm" style={{ color: "var(--muted)" }}>
          Sin registro · 2 minutos
        </span>
      </div>

      <div
        className="mt-10 pt-8 grid grid-cols-3 gap-4 text-sm"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        {[
          { label: "Áreas", value: "5" },
          { label: "Registro", value: "No" },
          { label: "Compromiso", value: "Ninguno" },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>
              {label}
            </p>
            <p className="font-semibold">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
