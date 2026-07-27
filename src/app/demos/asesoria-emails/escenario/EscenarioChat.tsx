"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import type { Escenario } from "../escenario";

interface Mensaje {
  role: "user" | "assistant";
  content: string;
}

const cardBase: React.CSSProperties = {
  background: "var(--bg-soft)",
  border: "1px solid var(--border)",
};

const MENSAJE_INICIAL: Mensaje = {
  role: "assistant",
  content:
    "Cuéntame a qué empresa le vas a enseñar la demo: cómo se llama y a qué se dedica. Con eso genero su escenario: sus carpetas, sus tipos de documento y 5 emails realistas de su día a día.",
};

export function EscenarioChat() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([MENSAJE_INICIAL]);
  const [input, setInput] = useState("");
  const [pensando, setPensando] = useState(false);
  const [propuesta, setPropuesta] = useState<Escenario | null>(null);
  const [activo, setActivo] = useState<{ nombre: string; porDefecto: boolean } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const finChat = useRef<HTMLDivElement>(null);

  // Texto provisional del dictado, visible en el textarea mientras se habla.
  const [dictado, setDictado] = useState("");

  const {
    supported: micSupported,
    state: micState,
    error: micError,
    toggle: micToggle,
    cancel: micCancel,
  } = useSpeechRecognition(
    (transcript) => {
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setDictado("");
    },
    undefined,
    (interim) => setDictado(interim),
  );

  const textoVisible = dictado ? (input ? `${input} ${dictado}` : dictado) : input;

  const [guardados, setGuardados] = useState<
    { id: string; nombre: string; activo: boolean; updated_at: string }[]
  >([]);

  const cargarActivo = async () => {
    try {
      const res = await fetch("/api/demos/asesoria-emails/escenario");
      if (!res.ok) return;
      const data = await res.json();
      setActivo({ nombre: data.escenario.nombre, porDefecto: data.porDefecto });
    } catch {
      // silencioso
    }
  };

  const cargarGuardados = async () => {
    try {
      const res = await fetch("/api/demos/asesoria-emails/escenarios");
      if (!res.ok) return;
      setGuardados(await res.json());
    } catch {
      // silencioso
    }
  };

  useEffect(() => {
    cargarActivo();
    cargarGuardados();
  }, []);

  const activarGuardado = async (id: string) => {
    setGuardando(true);
    setAviso(null);
    try {
      const res = await fetch(`/api/demos/asesoria-emails/escenarios/${id}`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      setAviso("Escenario activado. Emisor y bandeja ya lo usan.");
      await Promise.all([cargarActivo(), cargarGuardados()]);
    } catch {
      setAviso("No se pudo activar. Reintenta.");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarGuardado = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Eliminar la demo guardada «${nombre}» y su bandeja procesada?`)) return;
    setGuardando(true);
    setAviso(null);
    try {
      const res = await fetch(`/api/demos/asesoria-emails/escenarios/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await Promise.all([cargarActivo(), cargarGuardados()]);
    } catch {
      setAviso("No se pudo eliminar. Reintenta.");
    } finally {
      setGuardando(false);
    }
  };

  useEffect(() => {
    finChat.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, pensando]);

  const enviarMensaje = async () => {
    const texto = textoVisible.trim();
    if (!texto || pensando) return;
    // Si el micro sigue grabando, se corta descartando lo pendiente: el texto
    // ya viaja en `texto` y no debe reaparecer en el campo tras el envío.
    micCancel();
    setDictado("");
    const historial = [...mensajes, { role: "user" as const, content: texto }];
    setMensajes(historial);
    setInput("");
    setPensando(true);
    setAviso(null);
    try {
      const res = await fetch("/api/demos/asesoria-emails/escenario/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // El primer mensaje del asistente es solo UI, no va al modelo.
        body: JSON.stringify({ messages: historial.slice(1) }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMensajes((prev) => [...prev, { role: "assistant", content: data.respuesta }]);
      if (data.escenario) setPropuesta(data.escenario);
    } catch {
      setMensajes((prev) => [
        ...prev,
        { role: "assistant", content: "Ha fallado la generación. Vuelve a intentarlo." },
      ]);
    } finally {
      setPensando(false);
    }
  };

  const activarEscenario = async () => {
    if (!propuesta) return;
    setGuardando(true);
    setAviso(null);
    try {
      const res = await fetch("/api/demos/asesoria-emails/escenario", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(propuesta),
      });
      if (!res.ok) throw new Error();
      setAviso(`Escenario «${propuesta.nombre}» guardado y activado. Emisor y bandeja ya lo usan.`);
      await Promise.all([cargarActivo(), cargarGuardados()]);
    } catch {
      setAviso("No se pudo activar el escenario. Reintenta.");
    } finally {
      setGuardando(false);
    }
  };

  const restaurarDefecto = async () => {
    setGuardando(true);
    setAviso(null);
    try {
      const res = await fetch("/api/demos/asesoria-emails/escenario", { method: "DELETE" });
      if (!res.ok) throw new Error();
      setAviso("Escenario por defecto (asesoría contable) restaurado.");
      await Promise.all([cargarActivo(), cargarGuardados()]);
    } catch {
      setAviso("No se pudo restaurar. Reintenta.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="px-5 sm:px-8 py-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <div className="label-accent mb-3">
          <span className="text-xs font-medium uppercase tracking-widest">
            Demo · Asesoría con IA — Generador de escenarios
          </span>
        </div>
        <h1
          className="font-headline text-2xl sm:text-3xl"
          style={{ color: "var(--fg)", letterSpacing: "-0.02em" }}
        >
          Describe la empresa y la IA monta su demo a medida.
        </h1>
        <p className="text-sm mt-2 max-w-3xl" style={{ color: "var(--muted)" }}>
          Dile al asistente quién es el prospecto y qué hace. Generará sus carpetas, sus tipos de
          documento y 5 emails realistas de su sector. Al activarlo, el{" "}
          <Link href="/demos/asesoria-emails/emisor" style={{ color: "var(--fg)", textDecoration: "underline" }}>
            emisor
          </Link>{" "}
          y la{" "}
          <Link href="/demos/asesoria-emails" style={{ color: "var(--fg)", textDecoration: "underline" }}>
            bandeja
          </Link>{" "}
          pasan a usar ese mundo.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-6 p-4" style={cardBase}>
        <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          Escenario activo
        </span>
        <span style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>
          {activo ? activo.nombre : "…"}
        </span>
        <div style={{ flex: 1 }} />
        {activo && !activo.porDefecto && (
          <button
            onClick={restaurarDefecto}
            disabled={guardando}
            className="text-xs font-medium uppercase tracking-widest px-4 py-2"
            style={{
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--muted-hi)",
              cursor: guardando ? "default" : "pointer",
            }}
          >
            ↺ Volver a la asesoría por defecto
          </button>
        )}
      </div>

      {guardados.length > 0 && (
        <div className="mb-6 p-4" style={cardBase}>
          <div
            className="text-[10px] font-medium uppercase tracking-widest mb-3"
            style={{ color: "var(--muted)" }}
          >
            Demos guardadas
          </div>
          <div className="space-y-2">
            {guardados.map((g) => (
              <div
                key={g.id}
                className="flex flex-wrap items-center gap-3"
                style={{ padding: "8px 10px", background: "var(--bg)", border: "1px solid var(--border)" }}
              >
                <span style={{ fontSize: 13, color: g.activo ? "var(--accent)" : "var(--fg)", fontWeight: 500 }}>
                  {g.activo ? "● " : ""}
                  {g.nombre}
                </span>
                <span className="text-[10px]" style={{ color: "var(--muted)" }}>
                  {new Date(g.updated_at).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <div style={{ flex: 1 }} />
                {!g.activo && (
                  <button
                    onClick={() => activarGuardado(g.id)}
                    disabled={guardando}
                    className="text-[10px] font-medium uppercase tracking-widest px-3 py-1"
                    style={{
                      border: "1px solid var(--accent)",
                      background: "transparent",
                      color: "var(--accent)",
                      cursor: guardando ? "default" : "pointer",
                    }}
                  >
                    Activar
                  </button>
                )}
                <button
                  onClick={() => eliminarGuardado(g.id, g.nombre)}
                  disabled={guardando}
                  className="text-[10px] font-medium uppercase tracking-widest px-3 py-1"
                  style={{
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--muted)",
                    cursor: guardando ? "default" : "pointer",
                  }}
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {aviso && (
        <div className="mb-6 p-3 text-xs" style={{ ...cardBase, color: "var(--muted-hi)" }}>
          {aviso}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chat */}
        <section style={cardBase} className="flex flex-col">
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--fg)" }}>
              Asistente de escenarios
            </span>
          </div>
          <div style={{ padding: 16, flex: 1, overflowY: "auto", maxHeight: 520, display: "flex", flexDirection: "column", gap: 12 }}>
            {mensajes.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  padding: "10px 14px",
                  fontSize: 13,
                  lineHeight: 1.55,
                  background: m.role === "user" ? "var(--accent-dim)" : "var(--bg)",
                  border: m.role === "user" ? "1px solid var(--accent)" : "1px solid var(--border)",
                  color: "var(--fg)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {m.content}
              </div>
            ))}
            {pensando && (
              <div
                style={{
                  alignSelf: "flex-start",
                  padding: "10px 14px",
                  fontSize: 12,
                  color: "var(--accent)",
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  className="blinking-cursor"
                  style={{ background: "var(--accent)", width: 1.5, height: "0.85em", display: "inline-block" }}
                />
                Generando escenario…
              </div>
            )}
            <div ref={finChat} />
          </div>
          <div style={{ padding: 12, borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
            <textarea
              value={textoVisible}
              onChange={(e) => {
                setInput(e.target.value);
                setDictado("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  enviarMensaje();
                }
              }}
              rows={2}
              placeholder="Ej.: Metalúrgica Serra SA, taller de calderería en Vic. Reciben pedidos, albaranes y ofertas de proveedores…"
              style={{
                flex: 1,
                background: "var(--bg)",
                border: "1px solid var(--border)",
                color: "var(--fg)",
                fontSize: 13,
                padding: "8px 10px",
                resize: "none",
                lineHeight: 1.5,
              }}
            />
            {micSupported && (
              <button
                type="button"
                onClick={() => {
                  void micToggle();
                }}
                disabled={pensando || micState === "requesting"}
                title={
                  micError
                    ? micError
                    : micState === "recording"
                      ? "Grabando… pulsa para parar"
                      : micState === "requesting"
                        ? "Pidiendo permiso…"
                        : micState === "error"
                          ? "Error de micrófono"
                          : "Hablar"
                }
                style={{
                  background: micState === "recording" ? "var(--accent)" : "transparent",
                  color:
                    micState === "recording"
                      ? "var(--bg)"
                      : micState === "error"
                        ? "#FF5F57"
                        : micState === "requesting"
                          ? "var(--fg)"
                          : "var(--muted)",
                  border: "1px solid var(--border)",
                  width: 44,
                  alignSelf: "stretch",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  cursor: pensando || micState === "requesting" ? "not-allowed" : "pointer",
                  opacity: pensando ? 0.4 : 1,
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {micState === "recording" ? (
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0 }}>■</span>
                ) : micState === "requesting" ? (
                  <span
                    className="blinking-cursor"
                    style={{ width: 8, height: 8, background: "currentColor" }}
                  />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1 18.93V22h2v-2.07A8.001 8.001 0 0 0 20 12h-2a6 6 0 0 1-12 0H4a8.001 8.001 0 0 0 7 7.93z" />
                  </svg>
                )}
              </button>
            )}
            <button
              onClick={enviarMensaje}
              disabled={pensando || !textoVisible.trim()}
              className="text-xs font-medium uppercase tracking-widest px-4"
              style={{
                border: "1px solid var(--accent)",
                background: pensando ? "var(--bg-elevated)" : "var(--accent-dim)",
                color: pensando ? "var(--muted)" : "var(--accent)",
                cursor: pensando || !textoVisible.trim() ? "default" : "pointer",
              }}
            >
              Enviar
            </button>
          </div>
        </section>

        {/* Vista previa */}
        <section style={cardBase} className="flex flex-col">
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--fg)" }}>
              Escenario propuesto
            </span>
            {propuesta && (
              <button
                onClick={activarEscenario}
                disabled={guardando}
                className="text-xs font-medium uppercase tracking-widest px-4 py-2"
                style={{
                  border: "1px solid var(--accent)",
                  background: guardando ? "var(--bg-elevated)" : "var(--accent-dim)",
                  color: guardando ? "var(--muted)" : "var(--accent)",
                  cursor: guardando ? "default" : "pointer",
                }}
              >
                {guardando ? "Activando…" : "✓ Activar escenario"}
              </button>
            )}
          </div>
          <div style={{ padding: 16, overflowY: "auto", maxHeight: 600 }}>
            {!propuesta ? (
              <div
                style={{
                  minHeight: 280,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  color: "var(--muted)",
                  fontSize: 13,
                  lineHeight: 1.55,
                }}
              >
                <p style={{ maxWidth: 300 }}>
                  Aquí aparecerá el escenario generado: empresa, carpetas, tipos de documento y los
                  5 emails listos para enviar.
                </p>
              </div>
            ) : (
              <VistaEscenario escenario={propuesta} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function VistaEscenario({ escenario }: { escenario: Escenario }) {
  return (
    <div className="space-y-4">
      <div>
        <div style={{ fontSize: 15, color: "var(--fg)", fontWeight: 600 }}>{escenario.nombre}</div>
        <p className="text-xs mt-1" style={{ color: "var(--muted)", lineHeight: 1.55 }}>
          {escenario.contextoNegocio}
        </p>
      </div>

      <div>
        <div className="text-[10px] font-medium uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
          {escenario.carpetasLabel}
        </div>
        <div className="flex flex-wrap gap-2">
          {escenario.clientes.map((c) => (
            <span
              key={c.slug}
              style={{
                fontSize: 11,
                padding: "4px 8px",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--muted-hi)",
              }}
            >
              {c.nombre}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] font-medium uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
          Tipos de documento
        </div>
        <div className="flex flex-wrap gap-2">
          {escenario.tipos.map((t) => (
            <span
              key={t.tipo}
              style={{
                fontSize: 11,
                padding: "4px 8px",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--muted-hi)",
                fontFamily: "var(--font-geist-mono)",
              }}
            >
              {t.tipo} → {t.carpeta}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] font-medium uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
          Emails ({escenario.emails.length})
        </div>
        <div className="space-y-2">
          {escenario.emails.map((e) => (
            <div key={e.id} style={{ padding: 10, background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--muted)", fontWeight: 600 }}>
                {e.etiqueta}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--fg)", fontWeight: 500 }}>{e.asunto}</div>
              <div className="text-[11px] mt-1" style={{ color: "var(--muted)" }}>
                {e.remitenteNombre}
                {e.adjuntos.length > 0 && <> · ◳ {e.adjuntos[0].nombre}</>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
