"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EMAILS_PREDEFINIDOS, type EmailPredefinido } from "./data";

type EstadoEnvio = "idle" | "enviando" | "enviado" | "error";

const cardBase: React.CSSProperties = {
  background: "var(--bg-soft)",
  border: "1px solid var(--border)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg)",
  border: "1px solid var(--border)",
  color: "var(--fg)",
  fontSize: 13,
  padding: "8px 10px",
  lineHeight: 1.5,
};

export function Emisor() {
  const [emails, setEmails] = useState<EmailPredefinido[]>(EMAILS_PREDEFINIDOS);
  const [estados, setEstados] = useState<Record<string, EstadoEnvio>>({});
  const [abierto, setAbierto] = useState<string | null>(null);
  const [enviandoTodos, setEnviandoTodos] = useState(false);
  const [limpiando, setLimpiando] = useState(false);
  const [mensajeLimpieza, setMensajeLimpieza] = useState<string | null>(null);
  const [escenarioNombre, setEscenarioNombre] = useState<string | null>(null);

  // Carga los emails del escenario activo (generado por chat o el de defecto).
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/demos/asesoria-emails/escenario");
        if (!res.ok) return;
        const data = await res.json();
        setEmails(data.escenario.emails);
        setEscenarioNombre(data.escenario.nombre);
      } catch {
        // Se queda el escenario por defecto embebido.
      }
    })();
  }, []);

  const setEstado = (id: string, estado: EstadoEnvio) =>
    setEstados((prev) => ({ ...prev, [id]: estado }));

  const actualizar = (id: string, campo: keyof EmailPredefinido, valor: string) => {
    setEmails((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        if (campo === "adjuntos") return { ...e, adjuntos: valor ? [{ nombre: valor }] : [] };
        return { ...e, [campo]: valor };
      }),
    );
    if (estados[id] === "enviado" || estados[id] === "error") setEstado(id, "idle");
  };

  const enviar = async (id: string): Promise<boolean> => {
    const email = emails.find((e) => e.id === id);
    if (!email) return false;
    setEstado(id, "enviando");
    try {
      const res = await fetch("/api/demos/asesoria-emails/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remitenteNombre: email.remitenteNombre,
          remitenteAlias: email.remitenteAlias,
          asunto: email.asunto,
          cuerpo: email.cuerpo,
          adjuntos: email.adjuntos,
        }),
      });
      if (!res.ok) throw new Error();
      setEstado(id, "enviado");
      return true;
    } catch {
      setEstado(id, "error");
      return false;
    }
  };

  const enviarTodos = async () => {
    setEnviandoTodos(true);
    for (const e of emails) {
      if (estados[e.id] === "enviado") continue;
      await enviar(e.id);
      await new Promise((r) => setTimeout(r, 600));
    }
    setEnviandoTodos(false);
  };

  const limpiarBandeja = async () => {
    setLimpiando(true);
    setMensajeLimpieza(null);
    try {
      const res = await fetch("/api/demos/asesoria-emails/limpiar", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMensajeLimpieza(`${data.eliminados} emails de demo eliminados de la bandeja.`);
      setEstados({});
    } catch {
      setMensajeLimpieza("No se pudo limpiar la bandeja. Reintenta.");
    } finally {
      setLimpiando(false);
    }
  };

  const enviados = emails.filter((e) => estados[e.id] === "enviado").length;

  return (
    <div className="px-5 sm:px-8 py-8 max-w-3xl mx-auto">
      <header className="mb-8">
        <div className="label-accent mb-3">
          <span className="text-xs font-medium uppercase tracking-widest">
            Demo · Asesoría con IA — Emisor
          </span>
        </div>
        <h1
          className="font-headline text-2xl sm:text-3xl"
          style={{ color: "var(--fg)", letterSpacing: "-0.02em" }}
        >
          Envía los emails del cliente ficticio.
        </h1>
        <p className="text-sm mt-2 max-w-2xl" style={{ color: "var(--muted)" }}>
          Cada email llega de verdad a la bandeja de Gmail de la demo. Puedes abrirlos y
          retocar remitente, asunto o cuerpo antes de enviarlos. Después, en la{" "}
          <Link href="/demos/asesoria-emails" style={{ color: "var(--fg)", textDecoration: "underline" }}>
            bandeja inteligente
          </Link>{" "}
          verás cómo la IA los procesa en directo.
        </p>
        {escenarioNombre && (
          <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
            Escenario activo: <span style={{ color: "var(--accent)", fontWeight: 600 }}>{escenarioNombre}</span>
            {" · "}
            <Link href="/demos/asesoria-emails/escenario" style={{ color: "var(--fg)", textDecoration: "underline" }}>
              cambiar con IA
            </Link>
          </p>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-6 p-4" style={cardBase}>
        <button
          onClick={enviarTodos}
          disabled={enviandoTodos || enviados === emails.length}
          className="text-xs font-medium uppercase tracking-widest px-4 py-2"
          style={{
            border: "1px solid var(--accent)",
            background: enviandoTodos ? "var(--bg-elevated)" : "var(--accent-dim)",
            color: enviandoTodos ? "var(--muted)" : "var(--accent)",
            cursor: enviandoTodos || enviados === emails.length ? "default" : "pointer",
          }}
        >
          {enviandoTodos ? "Enviando…" : "✉ Enviar los 5"}
        </button>
        <button
          onClick={limpiarBandeja}
          disabled={limpiando}
          className="text-xs font-medium uppercase tracking-widest px-4 py-2"
          style={{
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--muted-hi)",
            cursor: limpiando ? "default" : "pointer",
          }}
        >
          {limpiando ? "Limpiando…" : "🗑 Vaciar bandeja demo"}
        </button>
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 13,
            fontWeight: 700,
            color: enviados > 0 ? "var(--accent)" : "var(--muted)",
          }}
        >
          {enviados}/{emails.length} enviados
        </span>
      </div>

      {mensajeLimpieza && (
        <div
          className="mb-6 p-3 text-xs"
          style={{ ...cardBase, color: "var(--muted-hi)" }}
        >
          {mensajeLimpieza}
        </div>
      )}

      <div className="space-y-3">
        {emails.map((email) => (
          <TarjetaEmail
            key={email.id}
            email={email}
            estado={estados[email.id] ?? "idle"}
            abierto={abierto === email.id}
            onToggle={() => setAbierto(abierto === email.id ? null : email.id)}
            onCambio={(campo, valor) => actualizar(email.id, campo, valor)}
            onEnviar={() => enviar(email.id)}
          />
        ))}
      </div>

      <div className="mt-8 p-5" style={{ ...cardBase, border: "1px solid var(--accent)" }}>
        <div
          className="text-[10px] font-medium uppercase tracking-widest mb-2"
          style={{ color: "var(--accent)" }}
        >
          Guion de la demo
        </div>
        <ol
          className="text-sm space-y-1"
          style={{ color: "var(--muted-hi)", lineHeight: 1.6, paddingLeft: 18 }}
        >
          <li>1. Vacía la bandeja demo para empezar de cero.</li>
          <li>2. Envía los 5 emails (o hazlo uno a uno mientras lo narras).</li>
          <li>
            3. Abre la{" "}
            <Link href="/demos/asesoria-emails" style={{ color: "var(--fg)", textDecoration: "underline" }}>
              bandeja inteligente
            </Link>{" "}
            y pulsa «Comprobar correo»: los emails aparecen tal cual llegaron a Gmail.
          </li>
          <li>4. Pulsa «Procesar todo» y deja que la IA archive delante del cliente.</li>
        </ol>
      </div>
    </div>
  );
}

function TarjetaEmail({
  email,
  estado,
  abierto,
  onToggle,
  onCambio,
  onEnviar,
}: {
  email: EmailPredefinido;
  estado: EstadoEnvio;
  abierto: boolean;
  onToggle: () => void;
  onCambio: (campo: keyof EmailPredefinido, valor: string) => void;
  onEnviar: () => void;
}) {
  const colorEstado =
    estado === "enviado"
      ? "var(--accent)"
      : estado === "error"
        ? "#e5484d"
        : estado === "enviando"
          ? "var(--fg)"
          : "var(--muted)";
  const labelEstado =
    estado === "enviado"
      ? "✓ Enviado"
      : estado === "error"
        ? "✕ Error"
        : estado === "enviando"
          ? "● Enviando"
          : "○ Sin enviar";

  return (
    <div style={cardBase}>
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "14px 16px",
          background: "transparent",
          border: "none",
          borderLeft: abierto ? "2px solid var(--accent)" : "2px solid transparent",
          cursor: "pointer",
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-[10px] uppercase tracking-widest"
            style={{ color: "var(--muted)", fontWeight: 600 }}
          >
            {email.etiqueta}
          </span>
          <span
            className="text-[10px] uppercase tracking-widest"
            style={{ color: colorEstado, fontWeight: 600 }}
          >
            {labelEstado}
          </span>
        </div>
        <div style={{ fontSize: 13, color: "var(--fg)", fontWeight: 500, lineHeight: 1.35 }}>
          {email.asunto}
        </div>
        <div className="text-[11px] mt-1" style={{ color: "var(--muted)" }}>
          {email.remitenteNombre}
          {email.adjuntos.length > 0 && <> · ◳ {email.adjuntos[0].nombre}</>}
        </div>
      </button>

      {abierto && (
        <div
          style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}
        >
          <Campo label="Remitente">
            <input
              value={email.remitenteNombre}
              onChange={(e) => onCambio("remitenteNombre", e.target.value)}
              style={inputStyle}
            />
          </Campo>
          <Campo label="Asunto">
            <input
              value={email.asunto}
              onChange={(e) => onCambio("asunto", e.target.value)}
              style={inputStyle}
            />
          </Campo>
          <Campo label="Cuerpo">
            <textarea
              value={email.cuerpo}
              onChange={(e) => onCambio("cuerpo", e.target.value)}
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Campo>
          <Campo label="Adjunto (PDF de relleno)">
            <input
              value={email.adjuntos[0]?.nombre ?? ""}
              onChange={(e) => onCambio("adjuntos", e.target.value)}
              placeholder="Vacío = sin adjunto"
              style={inputStyle}
            />
          </Campo>
          <div>
            <button
              onClick={onEnviar}
              disabled={estado === "enviando"}
              className="text-xs font-medium uppercase tracking-widest px-4 py-2"
              style={{
                border: "1px solid var(--accent)",
                background: estado === "enviando" ? "var(--bg-elevated)" : "var(--accent-dim)",
                color: estado === "enviando" ? "var(--muted)" : "var(--accent)",
                cursor: estado === "enviando" ? "default" : "pointer",
              }}
            >
              {estado === "enviando"
                ? "Enviando…"
                : estado === "enviado"
                  ? "↻ Reenviar"
                  : "✉ Enviar este email"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span
        className="text-[9.5px] font-medium uppercase tracking-widest"
        style={{ color: "var(--muted)", display: "block", marginBottom: 4 }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
