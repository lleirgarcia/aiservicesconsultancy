"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CONTACTOS_INICIALES,
  RESPONSABLES,
  type Canal,
  type ContactoEntrante,
} from "./data";

type Estado = "entrante" | "respondiendo" | "respondido" | "escalado";

interface ContactoEjecucion {
  contacto: ContactoEntrante;
  estado: Estado;
  respuestaTextoVisible: string;
  respondidoEn?: string;
  escaladoEn?: string;
}

const cardBase: React.CSSProperties = {
  background: "var(--bg-soft)",
  border: "1px solid var(--border)",
};

const ICONOS_CANAL: Record<Canal, string> = {
  email: "✉",
  whatsapp: "◉",
  llamada: "☏",
  web: "◐",
};

const NOMBRE_CANAL: Record<Canal, string> = {
  email: "Email",
  whatsapp: "WhatsApp",
  llamada: "Llamada",
  web: "Formulario web",
};

export function RespuestaInstantanea() {
  const [contactos, setContactos] = useState<ContactoEjecucion[]>(() =>
    CONTACTOS_INICIALES.map((c) => ({
      contacto: c,
      estado: "entrante",
      respuestaTextoVisible: "",
    })),
  );
  const [enFoco, setEnFoco] = useState<string | null>(null);
  const [auto, setAuto] = useState(false);
  const [velocidad, setVelocidad] = useState<"normal" | "rapido">("rapido");
  const procesandoRef = useRef<Set<string>>(new Set());

  const factor = velocidad === "rapido" ? 0.4 : 1;

  const responder = async (id: string) => {
    if (procesandoRef.current.has(id)) return;
    procesandoRef.current.add(id);
    const target = contactos.find((c) => c.contacto.id === id);
    if (!target || target.estado !== "entrante") {
      procesandoRef.current.delete(id);
      return;
    }
    setEnFoco(id);
    setContactos((prev) =>
      prev.map((c) =>
        c.contacto.id === id
          ? { ...c, estado: "respondiendo", respuestaTextoVisible: "" }
          : c,
      ),
    );

    const respuesta = target.contacto.pista.respuestaIA;
    const palabras = respuesta.split(/(\s+)/);
    let acumulado = "";
    for (const trozo of palabras) {
      acumulado += trozo;
      setContactos((prev) =>
        prev.map((c) =>
          c.contacto.id === id ? { ...c, respuestaTextoVisible: acumulado } : c,
        ),
      );
      await new Promise((r) => setTimeout(r, 24 * factor));
    }

    await new Promise((r) => setTimeout(r, 320 * factor));
    setContactos((prev) =>
      prev.map((c) =>
        c.contacto.id === id
          ? { ...c, estado: "respondido", respondidoEn: new Date().toISOString() }
          : c,
      ),
    );

    if (target.contacto.pista.urgencia === "alta") {
      await new Promise((r) => setTimeout(r, 600 * factor));
      setContactos((prev) =>
        prev.map((c) =>
          c.contacto.id === id
            ? { ...c, estado: "escalado", escaladoEn: new Date().toISOString() }
            : c,
        ),
      );
    }
    procesandoRef.current.delete(id);
  };

  useEffect(() => {
    if (!auto) return;
    let cancelado = false;
    (async () => {
      for (const c of contactos) {
        if (cancelado) return;
        if (c.estado === "entrante") {
          await responder(c.contacto.id);
          if (cancelado) return;
          await new Promise((r) => setTimeout(r, 320 * factor));
        }
      }
    })();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  const reiniciar = () => {
    procesandoRef.current.clear();
    setAuto(false);
    setEnFoco(null);
    setContactos(
      CONTACTOS_INICIALES.map((c) => ({
        contacto: c,
        estado: "entrante",
        respuestaTextoVisible: "",
      })),
    );
  };

  const enFocoDato = useMemo(
    () => contactos.find((c) => c.contacto.id === enFoco) ?? null,
    [contactos, enFoco],
  );

  const stats = useMemo(() => {
    const respondidos = contactos.filter((c) => c.estado !== "entrante").length;
    const escalados = contactos.filter((c) => c.estado === "escalado").length;
    const tiempoMedioMs = 8000;
    return {
      pendientes: contactos.filter((c) => c.estado === "entrante").length,
      respondidos,
      escalados,
      tiempoRespuesta: tiempoMedioMs,
    };
  }, [contactos]);

  return (
    <div className="px-5 sm:px-8 py-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <div className="label-accent mb-3">
          <span className="text-xs font-medium uppercase tracking-widest">
            Demo · Respuesta multicanal con IA
          </span>
        </div>
        <h1
          className="font-headline text-2xl sm:text-3xl"
          style={{ color: "var(--fg)", letterSpacing: "-0.02em" }}
        >
          Cada contacto recibe respuesta en menos de 30 segundos.
        </h1>
        <p className="text-sm mt-2 max-w-3xl" style={{ color: "var(--muted)" }}>
          Email, WhatsApp, llamada perdida o formulario web: la IA analiza la intención, redacta una
          respuesta personalizada y la envía al instante. Si es urgente, escala al responsable
          adecuado y abre seguimiento.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-6 p-4" style={cardBase}>
        <button
          onClick={() => setAuto(true)}
          disabled={auto || stats.pendientes === 0}
          className="text-xs font-medium uppercase tracking-widest px-4 py-2"
          style={{
            border: "1px solid var(--accent)",
            background: auto ? "var(--bg-elevated)" : "var(--accent-dim)",
            color: auto ? "var(--muted)" : "var(--accent)",
            cursor: auto || stats.pendientes === 0 ? "default" : "pointer",
          }}
        >
          {auto ? "Respondiendo…" : "▶ Responder a todos"}
        </button>
        <button
          onClick={reiniciar}
          className="text-xs font-medium uppercase tracking-widest px-4 py-2"
          style={{
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--muted-hi)",
            cursor: "pointer",
          }}
        >
          ↺ Reiniciar
        </button>
        <div style={{ width: 1, height: 24, background: "var(--border)" }} />
        <label className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
          Velocidad
          <select
            value={velocidad}
            onChange={(e) => setVelocidad(e.target.value as "normal" | "rapido")}
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--fg)",
              fontSize: 12,
              padding: "4px 8px",
            }}
          >
            <option value="normal">Normal</option>
            <option value="rapido">Rápido</option>
          </select>
        </label>
        <div style={{ flex: 1 }} />
        <Stat label="Pendientes" valor={String(stats.pendientes)} />
        <Stat label="Respondidos" valor={String(stats.respondidos)} acento />
        <Stat label="Escalados" valor={String(stats.escalados)} />
        <Stat label="T. respuesta" valor={`${(stats.tiempoRespuesta / 1000).toFixed(0)} s`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] gap-4">
        <section style={cardBase} className="flex flex-col min-h-0">
          <Encabezado titulo="Contactos entrantes" sub={`${contactos.length} hoy`} />
          <div style={{ maxHeight: 640, overflowY: "auto" }}>
            {contactos.map((c) => (
              <FilaContacto
                key={c.contacto.id}
                ejecucion={c}
                seleccionado={enFoco === c.contacto.id}
                onClick={() => {
                  setEnFoco(c.contacto.id);
                  if (c.estado === "entrante") responder(c.contacto.id);
                }}
              />
            ))}
          </div>
        </section>

        <section style={cardBase} className="flex flex-col min-h-0">
          <Encabezado
            titulo="Conversación"
            sub={enFocoDato ? NOMBRE_CANAL[enFocoDato.contacto.canal] : "Selecciona un contacto"}
          />
          <div style={{ padding: 20, flex: 1, minHeight: 480 }}>
            {!enFocoDato ? <EstadoVacio /> : <DetalleContacto ejecucion={enFocoDato} />}
          </div>
        </section>
      </div>

      <CTAKroomix />
    </div>
  );
}

function Stat({ label, valor, acento }: { label: string; valor: string; acento?: boolean }) {
  return (
    <div className="flex flex-col items-end">
      <span
        className="text-[9.5px] font-medium uppercase tracking-widest"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-geist-mono)",
          fontSize: 14,
          fontWeight: 700,
          color: acento ? "var(--accent)" : "var(--fg)",
        }}
      >
        {valor}
      </span>
    </div>
  );
}

function Encabezado({ titulo, sub }: { titulo: string; sub?: string }) {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span
        className="text-xs font-medium uppercase tracking-widest"
        style={{ color: "var(--fg)" }}
      >
        {titulo}
      </span>
      {sub && (
        <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          {sub}
        </span>
      )}
    </div>
  );
}

function FilaContacto({
  ejecucion,
  seleccionado,
  onClick,
}: {
  ejecucion: ContactoEjecucion;
  seleccionado: boolean;
  onClick: () => void;
}) {
  const { contacto, estado } = ejecucion;
  const colorEstado =
    estado === "entrante"
      ? "var(--muted)"
      : estado === "respondiendo"
        ? "var(--fg)"
        : "var(--accent)";
  const labelEstado =
    estado === "entrante"
      ? "○ Sin contestar"
      : estado === "respondiendo"
        ? "● Respondiendo"
        : estado === "escalado"
          ? "✓ Escalado"
          : "✓ Respondido";

  const colorUrgencia =
    contacto.pista.urgencia === "alta"
      ? "var(--accent)"
      : contacto.pista.urgencia === "media"
        ? "var(--muted-hi)"
        : "var(--muted)";

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "12px 16px",
        background: seleccionado ? "var(--bg-elevated)" : "transparent",
        border: "none",
        borderLeft: seleccionado ? "2px solid var(--accent)" : "2px solid transparent",
        borderBottom: "1px solid var(--border)",
        cursor: "pointer",
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-[10px] uppercase tracking-widest flex items-center gap-1.5"
          style={{ color: "var(--muted-hi)", fontWeight: 600 }}
        >
          <span style={{ color: "var(--accent)" }}>{ICONOS_CANAL[contacto.canal]}</span>
          {NOMBRE_CANAL[contacto.canal]}
        </span>
        <span className="text-[10px]" style={{ color: colorUrgencia, fontWeight: 600 }}>
          {contacto.pista.urgencia === "alta" ? "ALTA" : contacto.pista.urgencia === "media" ? "MED" : "BAJA"}
        </span>
      </div>
      <div
        style={{
          fontSize: 12.5,
          color: "var(--fg)",
          fontWeight: 500,
          marginBottom: 2,
          lineHeight: 1.35,
        }}
      >
        {contacto.asunto}
      </div>
      <div className="text-[11px] mb-2" style={{ color: "var(--muted)" }}>
        {contacto.remitenteNombre} ·{" "}
        <span style={{ fontFamily: "var(--font-geist-mono)" }}>{contacto.remitenteContacto}</span>
      </div>
      <span
        className="text-[10px] uppercase tracking-widest"
        style={{ color: colorEstado, fontWeight: 600 }}
      >
        {labelEstado}
      </span>
    </button>
  );
}

function EstadoVacio() {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: "var(--muted)",
        gap: 12,
        minHeight: 280,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          color: "var(--accent)",
        }}
      >
        ⟁
      </div>
      <p className="text-sm" style={{ maxWidth: 280, lineHeight: 1.55 }}>
        Pulsa un contacto entrante para ver cómo la IA responde y escala según urgencia.
      </p>
    </div>
  );
}

function DetalleContacto({ ejecucion }: { ejecucion: ContactoEjecucion }) {
  const { contacto, estado, respuestaTextoVisible, respondidoEn, escaladoEn } = ejecucion;
  const responsable = RESPONSABLES.find((r) => r.id === contacto.pista.responsableAsignado);

  return (
    <div className="flex flex-col gap-4">
      <div
        style={{
          padding: 14,
          background: "var(--bg)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="text-[10px] font-medium uppercase tracking-widest mb-2"
          style={{ color: "var(--muted)" }}
        >
          Mensaje del cliente · {NOMBRE_CANAL[contacto.canal]}
        </div>
        <div style={{ fontSize: 13, color: "var(--fg)", marginBottom: 4, fontWeight: 500 }}>
          {contacto.remitenteNombre}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: "var(--muted-hi)",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}
        >
          {contacto.texto}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <Dato label="Intención detectada" valor={contacto.pista.intencion} />
        <Dato label="Urgencia" valor={contacto.pista.urgencia.toUpperCase()} />
        <Dato
          label="Plantilla aplicada"
          valor={contacto.pista.plantilla}
          mono
        />
        <Dato
          label="Responsable asignado"
          valor={`${responsable?.nombre} (${responsable?.rol})`}
        />
      </div>

      <div
        style={{
          padding: 14,
          background: "var(--bg)",
          border: estado === "entrante" ? "1px dashed var(--border)" : "1px solid var(--accent)",
          minHeight: 140,
        }}
      >
        <div
          className="text-[10px] font-medium uppercase tracking-widest mb-2"
          style={{ color: "var(--accent)" }}
        >
          Respuesta automática enviada por IA
        </div>
        {estado === "entrante" ? (
          <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
            Sin enviar todavía. Pulsa el contacto en la columna izquierda.
          </div>
        ) : (
          <div style={{ fontSize: 12.5, color: "var(--muted-hi)", lineHeight: 1.6 }}>
            {respuestaTextoVisible}
            {estado === "respondiendo" && (
              <span
                className="blinking-cursor"
                style={{
                  background: "var(--accent)",
                  width: 1.5,
                  height: "1em",
                  display: "inline-block",
                  marginLeft: 2,
                  verticalAlign: "-0.15em",
                }}
              />
            )}
          </div>
        )}
        {respondidoEn && (
          <div
            style={{
              fontSize: 10,
              color: "var(--muted)",
              marginTop: 10,
              paddingTop: 8,
              borderTop: "1px solid var(--border)",
              fontFamily: "var(--font-geist-mono)",
            }}
          >
            Enviado a {contacto.remitenteContacto} · {new Date(respondidoEn).toLocaleTimeString("es-ES")}
          </div>
        )}
      </div>

      {estado === "escalado" && escaladoEn && (
        <div
          style={{
            padding: 12,
            background: "var(--accent-dim)",
            border: "1px solid var(--accent)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 18, color: "var(--accent)" }}>⚡</span>
          <div>
            <div
              className="text-[10px] font-medium uppercase tracking-widest"
              style={{ color: "var(--accent)" }}
            >
              Escalado a responsable
            </div>
            <div style={{ fontSize: 12, color: "var(--muted-hi)" }}>
              {responsable?.nombre} ha recibido aviso interno. SLA: 1 hora para retomar el hilo.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Dato({
  label,
  valor,
  mono,
}: {
  label: string;
  valor: string;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        padding: 10,
        background: "var(--bg)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        className="text-[9.5px] font-medium uppercase tracking-widest"
        style={{ color: "var(--muted)", marginBottom: 4 }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--fg)",
          fontWeight: 500,
          fontFamily: mono ? "var(--font-geist-mono)" : "inherit",
          textTransform: mono ? undefined : "capitalize",
        }}
      >
        {valor}
      </div>
    </div>
  );
}

function CTAKroomix() {
  return (
    <div
      className="mt-8 p-6"
      style={{
        background: "var(--bg-soft)",
        border: "1px solid var(--accent)",
      }}
    >
      <div
        className="text-[10px] font-medium uppercase tracking-widest mb-2"
        style={{ color: "var(--accent)" }}
      >
        ¿Quieres responder al instante en todos los canales?
      </div>
      <p
        className="text-sm mb-4"
        style={{ color: "var(--muted-hi)", lineHeight: 1.6, maxWidth: 720 }}
      >
        Kroomix unifica WhatsApp Business, email, formularios web y llamadas perdidas en un único
        agente IA con el tono de tu empresa. Ningún contacto se enfría: respuesta inmediata,
        escalado al responsable correcto y registro completo en CRM.
      </p>
      <a
        href="/?seccion=contacto"
        className="text-xs font-medium uppercase tracking-widest"
        style={{ color: "var(--fg)", textDecoration: "underline" }}
      >
        Hablar con Kroomix →
      </a>
    </div>
  );
}
