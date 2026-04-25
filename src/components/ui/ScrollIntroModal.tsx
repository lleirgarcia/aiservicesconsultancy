"use client";

import { useEffect, useRef, useState } from "react";

// TODO: sustituir por el ID real del vídeo de presentación de 3 minutos.
const YOUTUBE_VIDEO_ID = "dQw4w9WgXcQ";
const STORAGE_KEY = "kroomix:scroll-intro-shown";
const CHAT_TARGET_ID = "contacto";

type View = "choices" | "video";

export default function ScrollIntroModal() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("choices");
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      if (window.sessionStorage.getItem(STORAGE_KEY) === "1") {
        triggeredRef.current = true;
        return;
      }
    } catch {
      // sessionStorage puede fallar en modo privado; lo ignoramos.
    }

    const initialY = window.scrollY;
    const MIN_SCROLL_DELTA = 24;
    const SCROLL_END_DELAY_MS = 180;
    let scrollStarted = false;
    let endTimer: number | null = null;

    const trigger = () => {
      if (triggeredRef.current) return;
      triggeredRef.current = true;
      setOpen(true);
      try {
        window.sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // noop
      }
      cleanup();
    };

    const scheduleTrigger = () => {
      if (endTimer !== null) window.clearTimeout(endTimer);
      endTimer = window.setTimeout(() => {
        endTimer = null;
        trigger();
      }, SCROLL_END_DELAY_MS);
    };

    const onScroll = () => {
      const delta = Math.abs(window.scrollY - initialY);
      if (!scrollStarted) {
        if (delta < MIN_SCROLL_DELTA) return;
        scrollStarted = true;
      }
      scheduleTrigger();
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    function cleanup() {
      window.removeEventListener("scroll", onScroll);
      if (endTimer !== null) {
        window.clearTimeout(endTimer);
        endTimer = null;
      }
    }

    return cleanup;
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    setOpen(false);
    setTimeout(() => setView("choices"), 250);
  }

  function goToAgent() {
    close();
    const target = document.getElementById(CHAT_TARGET_ID);
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="¿Cómo quieres seguir?"
      onClick={close}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 60,
        padding: "24px",
        animation: "scroll-intro-fade 0.2s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: view === "video" ? 860 : 520,
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          overflow: "hidden",
          animation: "scroll-intro-pop 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      >
        {/* Terminal bar */}
        <div className="terminal-bar" style={{ flexShrink: 0 }}>
          <span className="terminal-dot" style={{ background: "var(--border)" }} />
          <span className="terminal-dot" style={{ background: "var(--muted)" }} />
          <span className="terminal-dot" style={{ background: "var(--accent)" }} />
          <span
            className="ml-2 text-xs"
            style={{
              color: "var(--muted)",
              fontFamily: "var(--font-geist-mono), monospace",
            }}
          >
            kroomix — {view === "video" ? "vídeo de 3 min" : "¿cómo seguimos?"}
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar"
            style={{
              marginLeft: "auto",
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              fontSize: "1.2rem",
              lineHeight: 1,
              cursor: "pointer",
              padding: 0,
            }}
          >
            ×
          </button>
        </div>

        {view === "choices" ? (
          <ChoicesView
            onContinue={close}
            onWatchVideo={() => setView("video")}
            onTalkAgent={goToAgent}
          />
        ) : (
          <VideoView videoId={YOUTUBE_VIDEO_ID} onBack={() => setView("choices")} />
        )}
      </div>

      <style>{`
        @keyframes scroll-intro-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scroll-intro-pop {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  );
}

function ChoicesView({
  onContinue,
  onWatchVideo,
  onTalkAgent,
}: {
  onContinue: () => void;
  onWatchVideo: () => void;
  onTalkAgent: () => void;
}) {
  return (
    <div>
      <div
        style={{
          padding: "22px 24px 18px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <p
          className="text-xs font-medium uppercase tracking-widest"
          style={{ color: "var(--accent)", marginBottom: 8 }}
        >
          Antes de seguir
        </p>
        <h3
          className="text-lg sm:text-xl font-semibold leading-tight"
          style={{ color: "var(--fg)" }}
        >
          ¿Cómo prefieres continuar?
        </h3>
        <p
          className="text-sm mt-2"
          style={{ color: "var(--muted)", lineHeight: 1.55 }}
        >
          Puedes seguir leyendo la página, ver una explicación rápida en vídeo o
          hablar ahora mismo con Kromi, nuestro asistente.
        </p>
      </div>

      <ChoiceRow
        onClick={onContinue}
        kicker="Sigo leyendo"
        title="Me doy una vuelta por la página"
        description="Cerrar este aviso y seguir donde estabas."
        icon="read"
      />

      <ChoiceRow
        onClick={onWatchVideo}
        kicker="Vídeo de 3 minutos"
        title="Te lo explico todo en un vídeo"
        description="Qué hacemos, cómo lo hacemos y qué puede cambiar en tu empresa."
        icon="video"
        border
      />

      <ChoiceRow
        onClick={onTalkAgent}
        kicker="Hablar con Kromi"
        title="Prefiero ir al grano y hablar ahora"
        description="Te lleva directo a Kromi para empezar el diagnóstico."
        icon="chat"
        border
        highlight
      />
    </div>
  );
}

function ChoiceRow({
  onClick,
  kicker,
  title,
  description,
  icon,
  border,
  highlight,
}: {
  onClick: () => void;
  kicker: string;
  title: string;
  description: string;
  icon: "read" | "video" | "chat";
  border?: boolean;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        width: "100%",
        textAlign: "left",
        padding: "18px 24px",
        background: "transparent",
        border: "none",
        borderTop: border ? "1px solid var(--border)" : "none",
        cursor: "pointer",
        color: "var(--fg)",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--bg-soft)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <span
        aria-hidden="true"
        style={{
          flexShrink: 0,
          width: 38,
          height: 38,
          borderRadius: 4,
          border: "1px solid var(--border)",
          background: highlight ? "var(--accent)" : "var(--bg-soft)",
          color: highlight ? "var(--bg)" : "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ChoiceIcon kind={icon} />
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        <span
          className="text-xs font-medium uppercase tracking-widest"
          style={{ color: "var(--accent)" }}
        >
          {kicker}
        </span>
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--fg)", lineHeight: 1.4 }}
        >
          {title}
        </span>
        <span
          className="text-xs"
          style={{ color: "var(--muted)", lineHeight: 1.5 }}
        >
          {description}
        </span>
      </span>
      <span
        aria-hidden="true"
        style={{
          color: "var(--muted)",
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 14,
          alignSelf: "center",
        }}
      >
        →
      </span>
    </button>
  );
}

function ChoiceIcon({ kind }: { kind: "read" | "video" | "chat" }) {
  if (kind === "read") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path d="M8 7h8M8 11h6" />
      </svg>
    );
  }
  if (kind === "video") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7L8 5z" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function VideoView({ videoId, onBack }: { videoId: string; onBack: () => void }) {
  return (
    <div>
      <div
        style={{
          position: "relative",
          width: "100%",
          background: "#000",
          aspectRatio: "16 / 9",
        }}
      >
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          title="Vídeo de presentación — Kroomix"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: "none",
          }}
        />
      </div>
      <div
        style={{
          padding: "14px 18px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            background: "transparent",
            color: "var(--muted)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            padding: "7px 12px",
            fontSize: 12,
            fontFamily: "var(--font-geist-mono), monospace",
            cursor: "pointer",
          }}
        >
          ← volver
        </button>
        <span
          className="text-xs"
          style={{ color: "var(--muted)" }}
        >
          3 minutos para entender qué hacemos.
        </span>
      </div>
    </div>
  );
}
