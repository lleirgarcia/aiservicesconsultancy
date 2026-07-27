"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type EmailEntrada } from "./data";
import { ESCENARIO_DEFECTO, type Escenario } from "./escenario";
import {
  clasificarEmail,
  formatoHora,
  tiempoRelativo,
  type PasoRazonamiento,
  type ResultadoClasificacion,
} from "./clasificador";

type EstadoEmail = "pendiente" | "procesando" | "archivado";

interface EmailEnEjecucion {
  email: EmailEntrada;
  estado: EstadoEmail;
  resultado?: ResultadoClasificacion;
  pasosVistos: PasoRazonamiento[];
}

interface DocumentoArchivado {
  emailId: string;
  clienteSlug: string;
  clienteNombre: string;
  tipo: string;
  carpeta: string;
  nombreFinal: string;
  fechaArchivado: string;
  esUrgente: boolean;
  confianza: number;
}

/** Estado de la bandeja que se persiste por escenario. */
interface BandejaGuardada {
  emails: {
    email: EmailEntrada;
    estado: EstadoEmail;
    resultado?: ResultadoClasificacion;
  }[];
  archivados: DocumentoArchivado[];
}

const cardBase: React.CSSProperties = {
  background: "var(--bg-soft)",
  border: "1px solid var(--border)",
};

export function BandejaInteligente() {
  const [emails, setEmails] = useState<EmailEnEjecucion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [archivados, setArchivados] = useState<DocumentoArchivado[]>([]);
  const [emailEnFoco, setEmailEnFoco] = useState<string | null>(null);
  const [auto, setAuto] = useState(false);
  const [velocidad, setVelocidad] = useState<"normal" | "rapido">("normal");
  const [filtroCliente, setFiltroCliente] = useState<string>("");
  const [comprobando, setComprobando] = useState(false);
  const [escenario, setEscenario] = useState<Escenario>(ESCENARIO_DEFECTO);
  const [escenarioId, setEscenarioId] = useState<string | null>(null);
  const [listaEscenarios, setListaEscenarios] = useState<
    { id: string; nombre: string; activo: boolean }[]
  >([]);
  const procesandoRef = useRef<Set<string>>(new Set());
  /** Evita autoguardar mientras se restaura el estado inicial. */
  const listoRef = useRef(false);
  const emailsRef = useRef<EmailEnEjecucion[]>([]);

  useEffect(() => {
    emailsRef.current = emails;
  }, [emails]);

  const factor = velocidad === "rapido" ? 0.35 : 1;

  const cargarLista = useCallback(async () => {
    try {
      const res = await fetch("/api/demos/asesoria-emails/escenarios");
      if (!res.ok) return;
      setListaEscenarios(await res.json());
    } catch {
      // silencioso
    }
  }, []);

  // Carga escenario activo + bandeja guardada, y mezcla con el correo vivo de
  // Gmail: lo restaurado conserva su estado; lo nuevo entra como pendiente.
  const cargarTodo = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    setAuto(false);
    setEmailEnFoco(null);
    procesandoRef.current.clear();
    listoRef.current = false;

    let guardada: BandejaGuardada | null = null;
    try {
      const res = await fetch("/api/demos/asesoria-emails/escenario");
      if (res.ok) {
        const data = await res.json();
        setEscenario(data.escenario);
        setEscenarioId(data.id ?? null);
        guardada = data.bandeja ?? null;
      }
    } catch {
      // Se queda el escenario por defecto.
    }

    let gmail: EmailEntrada[] = [];
    let gmailOk = true;
    try {
      const res = await fetch("/api/demos/asesoria-emails/bandeja");
      if (!res.ok) throw new Error();
      gmail = await res.json();
    } catch {
      gmailOk = false;
    }

    const restaurados: EmailEnEjecucion[] = (guardada?.emails ?? []).map((s) => ({
      email: s.email,
      estado: s.estado === "procesando" ? "pendiente" : s.estado,
      resultado: s.resultado,
      pasosVistos: s.estado === "archivado" && s.resultado ? s.resultado.pasos : [],
    }));
    const conocidos = new Set(restaurados.map((e) => e.email.id));
    const nuevos: EmailEnEjecucion[] = gmail
      .filter((e) => !conocidos.has(e.id))
      .map((e) => ({ email: e, estado: "pendiente", pasosVistos: [] }));

    setEmails([...nuevos, ...restaurados]);
    setArchivados(guardada?.archivados ?? []);
    if (!gmailOk && !guardada) {
      setErrorCarga("No se pudo conectar a Gmail. Revisa las credenciales en .env.local.");
    }
    setCargando(false);
    listoRef.current = true;
  }, []);

  useEffect(() => {
    cargarTodo();
    cargarLista();
  }, [cargarTodo, cargarLista]);

  // Autoguardado: cada vez que cambia lo archivado, persiste la bandeja del
  // escenario activo (emails con su estado y resultado + documentos).
  useEffect(() => {
    if (!listoRef.current) return;
    const bandeja: BandejaGuardada = {
      emails: emailsRef.current.map(({ email, estado, resultado }) => ({
        email,
        estado,
        resultado,
      })),
      archivados,
    };
    fetch("/api/demos/asesoria-emails/bandeja-estado", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bandeja }),
    }).catch(() => {
      // Autoguardado silencioso: si falla, la demo sigue en memoria.
    });
  }, [archivados]);

  const cambiarEscenario = async (valor: string) => {
    if (valor === "__nuevo__") {
      window.location.href = "/demos/asesoria-emails/escenario";
      return;
    }
    setCargando(true);
    try {
      if (valor === "__defecto__") {
        await fetch("/api/demos/asesoria-emails/escenario", { method: "DELETE" });
      } else {
        await fetch(`/api/demos/asesoria-emails/escenarios/${valor}`, { method: "PATCH" });
      }
    } catch {
      // cargarTodo reflejará el estado real.
    }
    await cargarLista();
    await cargarTodo();
  };

  // Trae los emails nuevos de Gmail sin tocar el estado de los ya procesados.
  const comprobarCorreo = async () => {
    setComprobando(true);
    try {
      const res = await fetch("/api/demos/asesoria-emails/bandeja");
      if (!res.ok) throw new Error();
      const data: EmailEntrada[] = await res.json();
      setEmails((prev) => {
        const conocidos = new Set(prev.map((e) => e.email.id));
        const nuevos = data
          .filter((e) => !conocidos.has(e.id))
          .map((e) => ({ email: e, estado: "pendiente" as EstadoEmail, pasosVistos: [] }));
        return [...nuevos, ...prev];
      });
    } catch {
      // Silencioso: la bandeja actual sigue siendo válida.
    } finally {
      setComprobando(false);
    }
  };

  const procesarEmail = async (id: string) => {
    if (procesandoRef.current.has(id)) return;
    procesandoRef.current.add(id);
    const target = emails.find((e) => e.email.id === id);
    if (!target || target.estado !== "pendiente") {
      procesandoRef.current.delete(id);
      return;
    }

    setEmailEnFoco(id);
    setEmails((prev) =>
      prev.map((e) =>
        e.email.id === id
          ? { ...e, estado: "procesando", resultado: undefined, pasosVistos: [] }
          : e,
      ),
    );

    let resultado: ResultadoClasificacion;
    try {
      resultado = await clasificarEmail(target.email);
    } catch {
      procesandoRef.current.delete(id);
      setEmails((prev) =>
        prev.map((e) => (e.email.id === id ? { ...e, estado: "pendiente" } : e)),
      );
      return;
    }

    setEmails((prev) =>
      prev.map((e) => (e.email.id === id ? { ...e, resultado } : e)),
    );

    for (const paso of resultado.pasos) {
      await new Promise((r) => setTimeout(r, paso.duracionMs * factor));
      setEmails((prev) =>
        prev.map((e) =>
          e.email.id === id
            ? { ...e, pasosVistos: [...e.pasosVistos, paso] }
            : e,
        ),
      );
    }

    await new Promise((r) => setTimeout(r, 280 * factor));

    setEmails((prev) =>
      prev.map((e) =>
        e.email.id === id ? { ...e, estado: "archivado" } : e,
      ),
    );
    setArchivados((prev) => [
      {
        emailId: id,
        clienteSlug: resultado.clienteSlug,
        clienteNombre: resultado.clienteNombre,
        tipo: resultado.tipo,
        carpeta: resultado.destino,
        nombreFinal: resultado.nombreFinal,
        fechaArchivado: new Date().toISOString(),
        esUrgente: resultado.esUrgente,
        confianza: resultado.confianza,
      },
      ...prev,
    ]);
    procesandoRef.current.delete(id);
  };

  // Auto-run secuencial
  useEffect(() => {
    if (!auto) return;
    let cancelado = false;
    (async () => {
      for (const e of emails) {
        if (cancelado) return;
        if (e.estado === "pendiente") {
          await procesarEmail(e.email.id);
          if (cancelado) return;
          await new Promise((r) => setTimeout(r, 280 * factor));
        }
      }
    })();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  // Borra el estado procesado guardado del escenario activo y recarga.
  const reiniciar = async () => {
    procesandoRef.current.clear();
    setAuto(false);
    listoRef.current = false;
    try {
      await fetch("/api/demos/asesoria-emails/bandeja-estado", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bandeja: null }),
      });
    } catch {
      // Si falla, cargarTodo restaurará lo que haya guardado.
    }
    await cargarTodo();
  };

  const procesarTodo = () => setAuto(true);

  const enFoco = useMemo(
    () => emails.find((e) => e.email.id === emailEnFoco) ?? null,
    [emails, emailEnFoco],
  );

  const stats = useMemo(() => {
    const total = emails.length;
    const pendientes = emails.filter((e) => e.estado === "pendiente").length;
    const archivadosCount = emails.filter((e) => e.estado === "archivado").length;
    const horasAhorradas = (archivadosCount * 1.8).toFixed(1);
    const dineroAhorrado = Math.round(archivadosCount * 1.8 * 28);
    return { total, pendientes, archivados: archivadosCount, horasAhorradas, dineroAhorrado };
  }, [emails]);

  const archivadosFiltrados = filtroCliente
    ? archivados.filter((a) => a.clienteSlug === filtroCliente)
    : archivados;

  const carpetasPorCliente = useMemo(() => {
    const grupos = new Map<string, DocumentoArchivado[]>();
    for (const cliente of escenario.clientes) {
      grupos.set(cliente.slug, []);
    }
    for (const doc of archivados) {
      if (!grupos.has(doc.clienteSlug)) grupos.set(doc.clienteSlug, []);
      grupos.get(doc.clienteSlug)?.push(doc);
    }
    return grupos;
  }, [archivados, escenario]);

  if (cargando) {
    return (
      <div className="px-5 sm:px-8 py-8 max-w-7xl mx-auto flex items-center justify-center min-h-96">
        <div style={{ textAlign: "center", color: "var(--muted)" }}>
          <div
            className="blinking-cursor"
            style={{ background: "var(--accent)", width: 2, height: 32, display: "inline-block", marginBottom: 16 }}
          />
          <p className="text-sm uppercase tracking-widest">Conectando con Gmail…</p>
        </div>
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="px-5 sm:px-8 py-8 max-w-7xl mx-auto flex items-center justify-center min-h-96">
        <div
          style={{
            padding: 24,
            border: "1px solid var(--accent)",
            background: "var(--bg-soft)",
            maxWidth: 480,
            textAlign: "center",
          }}
        >
          <p className="text-sm mb-4" style={{ color: "var(--fg)" }}>{errorCarga}</p>
          <button
            onClick={cargarTodo}
            className="text-xs font-medium uppercase tracking-widest px-4 py-2"
            style={{ border: "1px solid var(--accent)", color: "var(--accent)", background: "transparent", cursor: "pointer" }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 sm:px-8 py-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <div className="label-accent mb-3">
          <span className="text-xs font-medium uppercase tracking-widest">
            Demo · Asesoría con IA
          </span>
        </div>
        <h1
          className="font-headline text-2xl sm:text-3xl"
          style={{ color: "var(--fg)", letterSpacing: "-0.02em" }}
        >
          {escenario.titular}
        </h1>
        <p className="text-sm mt-2 max-w-3xl" style={{ color: "var(--muted)" }}>
          {escenario.subtitulo} ¿Quieres simular la llegada de correos en vivo? Usa el{" "}
          <Link
            href="/demos/asesoria-emails/emisor"
            style={{ color: "var(--fg)", textDecoration: "underline" }}
          >
            emisor de emails
          </Link>
          .
        </p>
      </header>

      <div
        className="flex flex-wrap items-center gap-3 mb-6 p-4"
        style={{ ...cardBase }}
      >
        <label className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
          Demo
          <select
            value={escenarioId ?? "__defecto__"}
            onChange={(e) => cambiarEscenario(e.target.value)}
            style={{
              background: "var(--bg)",
              border: "1px solid var(--accent)",
              color: "var(--fg)",
              fontSize: 12,
              padding: "4px 8px",
              maxWidth: 220,
            }}
          >
            {(escenarioId === null ||
              !listaEscenarios.some((l) => l.nombre === ESCENARIO_DEFECTO.nombre)) && (
              <option value="__defecto__">{ESCENARIO_DEFECTO.nombre}</option>
            )}
            {listaEscenarios.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre}
              </option>
            ))}
            <option value="__nuevo__">＋ Crear nueva con IA…</option>
          </select>
        </label>
        <div style={{ width: 1, height: 24, background: "var(--border)" }} />
        <button
          onClick={procesarTodo}
          disabled={auto || stats.pendientes === 0}
          className="text-xs font-medium uppercase tracking-widest px-4 py-2"
          style={{
            border: "1px solid var(--accent)",
            background: auto ? "var(--bg-elevated)" : "var(--accent-dim)",
            color: auto ? "var(--muted)" : "var(--accent)",
            cursor: auto || stats.pendientes === 0 ? "default" : "pointer",
          }}
        >
          {auto ? "Procesando…" : "▶ Procesar todo"}
        </button>
        <button
          onClick={comprobarCorreo}
          disabled={comprobando}
          className="text-xs font-medium uppercase tracking-widest px-4 py-2"
          style={{
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--muted-hi)",
            cursor: comprobando ? "default" : "pointer",
          }}
        >
          {comprobando ? "Comprobando…" : "✉ Comprobar correo"}
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
        <Stat label="Archivados" valor={String(stats.archivados)} acento />
        <Stat label="Horas ahorradas" valor={`${stats.horasAhorradas} h`} />
        <Stat label="Coste evitado" valor={`${stats.dineroAhorrado} €`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)_minmax(0,360px)] gap-4">
        {/* Bandeja */}
        <section style={cardBase} className="flex flex-col min-h-0">
          <Encabezado titulo="Bandeja de entrada" sub={`${stats.pendientes} pendientes`} />
          <div
            style={{
              maxHeight: 640,
              overflowY: "auto",
              padding: "4px 0",
            }}
          >
            {emails.map((e) => (
              <EmailRow
                key={e.email.id}
                email={e}
                seleccionado={emailEnFoco === e.email.id}
                onClick={() => {
                  setEmailEnFoco(e.email.id);
                  if (e.estado === "pendiente") procesarEmail(e.email.id);
                }}
              />
            ))}
          </div>
        </section>

        {/* Razonamiento */}
        <section style={cardBase} className="flex flex-col min-h-0">
          <Encabezado
            titulo="Asistente IA"
            sub={enFoco ? "Razonamiento en vivo" : "Selecciona un email para ver el proceso"}
          />
          <div style={{ padding: 20, flex: 1, minHeight: 320 }}>
            {!enFoco ? (
              <EstadoVacio />
            ) : (
              <RazonamientoVivo email={enFoco} />
            )}
          </div>
        </section>

        {/* Carpetas */}
        <section style={cardBase} className="flex flex-col min-h-0">
          <Encabezado
            titulo={escenario.carpetasLabel}
            sub={`${archivados.length} documentos archivados`}
          />
          <div style={{ padding: "12px 16px" }}>
            <select
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              style={{
                width: "100%",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                color: "var(--fg)",
                fontSize: 12,
                padding: "6px 8px",
              }}
            >
              <option value="">Todos</option>
              {escenario.clientes.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div style={{ padding: "0 16px 16px", maxHeight: 600, overflowY: "auto" }}>
            {filtroCliente ? (
              <CarpetasCliente
                clienteSlug={filtroCliente}
                clientes={escenario.clientes}
                docs={archivadosFiltrados}
              />
            ) : (
              <div className="space-y-3">
                {escenario.clientes.map((c) => {
                  const docs = carpetasPorCliente.get(c.slug) ?? [];
                  return (
                    <ResumenCliente
                      key={c.slug}
                      cliente={c}
                      cuenta={docs.length}
                      ultimo={docs[0]}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      <CTAKroomix />
    </div>
  );
}

function Stat({
  label,
  valor,
  acento,
}: {
  label: string;
  valor: string;
  acento?: boolean;
}) {
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

function EmailRow({
  email,
  seleccionado,
  onClick,
}: {
  email: EmailEnEjecucion;
  seleccionado: boolean;
  onClick: () => void;
}) {
  const { email: e, estado } = email;
  const esArchivado = estado === "archivado";
  const esProcesando = estado === "procesando";

  const colorEstado =
    estado === "archivado"
      ? "var(--accent)"
      : estado === "procesando"
        ? "var(--fg)"
        : "var(--muted)";
  const labelEstado =
    estado === "archivado" ? "✓ Archivado" : estado === "procesando" ? "● Procesando" : "○ Pendiente";

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
        opacity: esArchivado ? 0.55 : 1,
        transition: "background 0.15s, opacity 0.3s",
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-[10px] uppercase tracking-widest"
          style={{ color: colorEstado, fontWeight: 600 }}
        >
          {labelEstado}
          {esProcesando && (
            <span
              className="blinking-cursor"
              style={{
                marginLeft: 4,
                background: "var(--fg)",
                width: 1.5,
                height: "0.85em",
                display: "inline-block",
              }}
            />
          )}
        </span>
        <span className="text-[10px]" style={{ color: "var(--muted)" }}>
          {tiempoRelativo(e.fechaRecibido)}
        </span>
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--fg)",
          fontWeight: 500,
          marginBottom: 2,
          lineHeight: 1.35,
          textDecoration: esArchivado ? "line-through" : "none",
        }}
      >
        {e.asunto}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px]" style={{ color: "var(--muted)" }}>
          {e.remitenteNombre}
        </span>
        {e.adjuntos.length > 0 && (
          <span
            className="text-[10px] flex items-center gap-1"
            style={{ color: "var(--muted)" }}
          >
            ◳ {e.adjuntos.length}
          </span>
        )}
      </div>
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
          fontSize: 24,
          color: "var(--accent)",
        }}
      >
        ✦
      </div>
      <p className="text-sm" style={{ maxWidth: 280, lineHeight: 1.55 }}>
        Pulsa un email o «Procesar todo» para ver cómo la IA decide qué hacer con cada documento.
      </p>
    </div>
  );
}

function RazonamientoVivo({ email }: { email: EmailEnEjecucion }) {
  const { email: e, estado, resultado, pasosVistos } = email;
  const completo = estado === "archivado" && resultado;
  const esperandoIA = estado === "procesando" && !resultado;

  return (
    <div className="flex flex-col gap-5">
      {esperandoIA && (
        <div
          style={{
            padding: "10px 14px",
            background: "var(--accent-dim)",
            border: "1px solid var(--accent)",
            fontSize: 11,
            color: "var(--accent)",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            className="blinking-cursor"
            style={{ background: "var(--accent)", width: 1.5, height: "0.85em", display: "inline-block" }}
          />
          Claude analizando…
        </div>
      )}
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
          Email en análisis
        </div>
        <div style={{ fontSize: 13, color: "var(--fg)", fontWeight: 500, marginBottom: 4 }}>
          {e.asunto}
        </div>
        <div className="text-[11px]" style={{ color: "var(--muted)" }}>
          {e.remitenteNombre} ·{" "}
          <span style={{ fontFamily: "var(--font-geist-mono)" }}>{e.remitenteEmail}</span> ·{" "}
          {formatoHora(e.fechaRecibido)}
        </div>
      </div>

      <div>
        <div
          className="text-[10px] font-medium uppercase tracking-widest mb-3"
          style={{ color: "var(--muted)" }}
        >
          Cadena de razonamiento
        </div>
        <ol style={{ display: "flex", flexDirection: "column", gap: 10, listStyle: "none", padding: 0 }}>
          {(resultado?.pasos ?? []).map((paso, idx) => {
            const visto = pasosVistos.includes(paso);
            return (
              <li
                key={paso.etiqueta}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: 12,
                  opacity: visto ? 1 : 0.25,
                  transition: "opacity 0.4s ease",
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    border: visto ? "1px solid var(--accent)" : "1px solid var(--border)",
                    background: visto ? "var(--accent-dim)" : "transparent",
                    color: visto ? "var(--accent)" : "var(--muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontFamily: "var(--font-geist-mono)",
                    flexShrink: 0,
                  }}
                >
                  {visto ? "✓" : idx + 1}
                </div>
                <div>
                  <div
                    className="text-[10px] font-medium uppercase tracking-widest"
                    style={{ color: "var(--muted)" }}
                  >
                    {paso.etiqueta}
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--muted-hi)", lineHeight: 1.5 }}>
                    {paso.texto}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {completo && resultado && (
        <div
          style={{
            padding: 16,
            background: "var(--bg)",
            border: "1px solid var(--accent)",
          }}
        >
          <div
            className="text-[10px] font-medium uppercase tracking-widest mb-3"
            style={{ color: "var(--accent)" }}
          >
            Decisión final · Confianza {Math.round(resultado.confianza * 100)}%
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs" style={{ color: "var(--muted-hi)" }}>
            <Dato label="Tipo" valor={resultado.tipo} />
            <Dato label="Cliente" valor={resultado.clienteNombre} />
            {resultado.fechaDocumento && (
              <Dato label="Fecha doc." valor={resultado.fechaDocumento} mono />
            )}
            <Dato label="Carpeta" valor={resultado.destino} mono pequeno />
            <Dato label="Archivo" valor={resultado.nombreFinal} mono pequeno />
          </div>
          {resultado.esUrgente && (
            <div
              style={{
                marginTop: 10,
                padding: "6px 10px",
                background: "var(--accent-dim)",
                color: "var(--accent)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              ⚠ Marcado como urgente — notificación al responsable
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Dato({
  label,
  valor,
  mono,
  pequeno,
}: {
  label: string;
  valor: string;
  mono?: boolean;
  pequeno?: boolean;
}) {
  return (
    <div>
      <div
        className="text-[9.5px] font-medium uppercase tracking-widest"
        style={{ color: "var(--muted)", marginBottom: 2 }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: pequeno ? 11 : 12.5,
          color: "var(--fg)",
          fontWeight: 500,
          fontFamily: mono ? "var(--font-geist-mono)" : "inherit",
          wordBreak: "break-word",
          lineHeight: 1.4,
        }}
      >
        {valor}
      </div>
    </div>
  );
}

function ResumenCliente({
  cliente,
  cuenta,
  ultimo,
}: {
  cliente: { slug: string; nombre: string };
  cuenta: number;
  ultimo?: DocumentoArchivado;
}) {
  return (
    <div
      style={{
        padding: 12,
        background: "var(--bg)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span style={{ fontSize: 12.5, color: "var(--fg)", fontWeight: 500 }}>
          {cliente.nombre}
        </span>
        <span
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 12,
            color: cuenta > 0 ? "var(--accent)" : "var(--muted)",
            fontWeight: 600,
          }}
        >
          {cuenta}
        </span>
      </div>
      <div className="text-[10px]" style={{ color: "var(--muted)" }}>
        {ultimo
          ? `Último: ${ultimo.tipo} · ${ultimo.nombreFinal.length > 30 ? ultimo.nombreFinal.slice(0, 30) + "…" : ultimo.nombreFinal}`
          : "Sin documentos archivados todavía"}
      </div>
    </div>
  );
}

function CarpetasCliente({
  clienteSlug,
  clientes,
  docs,
}: {
  clienteSlug: string;
  clientes: { slug: string; nombre: string }[];
  docs: DocumentoArchivado[];
}) {
  const cliente = clientes.find((c) => c.slug === clienteSlug);
  const porTipo = new Map<string, DocumentoArchivado[]>();
  for (const d of docs) {
    if (!porTipo.has(d.tipo)) porTipo.set(d.tipo, []);
    porTipo.get(d.tipo)!.push(d);
  }
  return (
    <div className="space-y-3">
      <div
        style={{
          fontSize: 13,
          color: "var(--fg)",
          fontWeight: 600,
        }}
      >
        {cliente?.nombre}
      </div>
      {porTipo.size === 0 && (
        <div
          style={{
            fontSize: 11,
            color: "var(--muted)",
            padding: 12,
            border: "1px dashed var(--border)",
            background: "var(--bg)",
          }}
        >
          Sin documentos archivados todavía.
        </div>
      )}
      {Array.from(porTipo.entries()).map(([tipo, lista]) => (
        <div
          key={tipo}
          style={{
            padding: 10,
            background: "var(--bg)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="text-[10px] font-medium uppercase tracking-widest mb-2"
            style={{ color: "var(--muted)" }}
          >
            {tipo} · {lista.length}
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            {lista.map((d) => (
              <li
                key={d.emailId}
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-geist-mono)",
                  color: "var(--muted-hi)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span style={{ color: d.esUrgente ? "var(--accent)" : "var(--muted)" }}>
                  {d.esUrgente ? "⚠" : "▸"}
                </span>
                <span style={{ wordBreak: "break-word", flex: 1 }}>{d.nombreFinal}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
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
        ¿Quieres esto en tu asesoría?
      </div>
      <p className="text-sm mb-4" style={{ color: "var(--muted-hi)", lineHeight: 1.6, maxWidth: 720 }}>
        Kroomix conecta tu bandeja real (Google Workspace, Outlook, IMAP) con un modelo de
        clasificación que entiende tus clientes y tus carpetas. Procesa entre 30 y 50 emails al día
        sin que nadie los toque, y notifica al responsable cuando algo es urgente.
      </p>
      <Link
        href="/?seccion=contacto"
        className="text-xs font-medium uppercase tracking-widest"
        style={{ color: "var(--fg)", textDecoration: "underline" }}
      >
        Hablar con Kroomix →
      </Link>
    </div>
  );
}
