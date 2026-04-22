"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

interface FormData {
  nombre: string;
  empresa: string;
  tamano: string;
  email: string;
  telefono: string;
  mensaje: string;
}

const EMPTY: FormData = {
  nombre: "",
  empresa: "",
  tamano: "",
  email: "",
  telefono: "",
  mensaje: "",
};

const TAMANO_OPTIONS = [
  "1–10 personas",
  "10–50 personas",
  "50–100 personas",
  "100–200 personas",
  "Más de 200 personas",
];

export default function ContactForm() {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [sent, setSent] = useState(false);

  const set =
    (key: keyof FormData) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: integrar con Resend o similar
    console.log("Contacto:", form);
    setSent(true);
  };

  return (
    <section id="contacto" className="px-6 py-16 max-w-4xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
        Si esto encaja con lo que necesitas, hablamos.
      </h2>
      <p className="mb-10" style={{ color: "var(--muted)" }}>
        Primera conversación sin compromiso. Solo entender tu caso y ver si podemos ayudar.
      </p>

      {sent ? (
        <div className="py-10">
          <p className="font-semibold text-lg mb-2">Mensaje recibido.</p>
          <p style={{ color: "var(--muted)" }}>
            Te escribo en menos de 24 horas. Si prefieres, llámame directamente.
          </p>
          <button
            className="mt-6 text-sm underline underline-offset-4 cursor-pointer"
            style={{ color: "var(--muted)" }}
            onClick={() => setSent(false)}
          >
            Enviar otro mensaje
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>Nombre</label>
              <input type="text" required value={form.nombre} onChange={set("nombre")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>Empresa</label>
              <input type="text" required value={form.empresa} onChange={set("empresa")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>Tamaño empresa</label>
              <select
                required
                value={form.tamano}
                onChange={set("tamano")}
                style={{
                  background: "var(--bg)",
                  color: "var(--fg)",
                  border: "1px solid var(--border)",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.875rem",
                  borderRadius: 0,
                  appearance: "none",
                }}
              >
                <option value="" disabled>
                  Selecciona…
                </option>
                {TAMANO_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>Email</label>
              <input type="email" required value={form.email} onChange={set("email")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>Teléfono</label>
              <input type="tel" value={form.telefono} onChange={set("telefono")} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              ¿Qué proceso te hace perder dinero o tiempo, tiene poco retorno y crees que se
              podría automatizar?
            </label>
            <textarea
              rows={4}
              style={{ resize: "vertical" }}
              value={form.mensaje}
              onChange={set("mensaje")}
            />
          </div>
          <div>
            <Button type="submit">
              Enviar →
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
