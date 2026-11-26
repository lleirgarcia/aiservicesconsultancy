import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demo · Plataforma de agentes — Kroomix",
  description: "Agentes de IA que gestionan documentos, presupuestos, renovaciones y facturas.",
  robots: { index: false, follow: false },
};

/* La plataforma vive en agentes/ (FastAPI + Vite). Next la sirve por rewrite en /agentes-app.
   Se usa /index.html porque Next quita la barra final y rompería la base de los assets. */
export default function Page() {
  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 4rem)" }}>
      <div
        role="note"
        className="px-6 py-2.5 text-center text-[13px] sm:text-sm"
        style={{
          background: "var(--accent-dim)",
          borderBottom: "1px solid var(--border)",
          color: "var(--muted-hi)",
        }}
      >
        <strong style={{ color: "var(--accent)" }}>Esto es una demo.</strong> Toda la funcionalidad es
        real y utiliza modelos de IA, pero los datos que ves son ficticios.
      </div>
      <iframe
        src="/agentes-app/index.html"
        title="Plataforma de agentes Kroomix"
        className="block w-full flex-1 border-0"
        style={{ background: "#fff" }}
        allow="clipboard-write"
      />
    </div>
  );
}
