"use client";

import { useState } from "react";

const ANTON = "var(--font-anton), 'Anton', 'Arial Narrow', sans-serif";
const GROTESK = "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif";

const campo: React.CSSProperties = {
  width: "100%",
  background: "var(--surface)",
  color: "var(--fg)",
  border: "1.5px solid var(--border)",
  borderRadius: 12,
  padding: "0.85rem 1rem",
  fontFamily: GROTESK,
  fontSize: "1rem",
  outline: "none",
};

export function LoginForm() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [ver, setVer] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError("");
    try {
      const res = await fetch("/api/demos-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, contrasena }),
      });
      if (!res.ok) {
        setError((await res.json().catch(() => null))?.error ?? "No se ha podido iniciar sesión.");
        setEnviando(false);
        return;
      }
      // Solo rutas internas de /demos, para que no sirva de redirección abierta.
      const destino = new URLSearchParams(window.location.search).get("next") ?? "";
      window.location.assign(destino.startsWith("/demos") && !destino.startsWith("/demos/login") ? destino : "/demos/agentes");
    } catch {
      setError("Sin conexión. Inténtalo de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <div className="px-6 flex items-center justify-center" style={{ minHeight: "calc(100dvh - 4rem)", paddingBottom: "6vh" }}>
      <form
        onSubmit={enviar}
        className="w-full"
        style={{
          maxWidth: 420,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: "2.25rem 2rem",
          boxShadow: "0 24px 60px -28px rgba(16, 20, 24, 0.28)",
        }}
      >
        <div
          aria-hidden
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "var(--accent-dim)",
            display: "grid",
            placeItems: "center",
            marginBottom: "1.25rem",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </div>

        <h1 style={{ fontFamily: ANTON, fontWeight: 400, fontSize: "2rem", lineHeight: 1.1, margin: 0, color: "var(--fg)" }}>
          Acceso a la demo
        </h1>
        <p style={{ margin: "0.5rem 0 1.5rem", color: "var(--muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>
          Es una demostración privada. Introduce las credenciales que te hemos facilitado.
        </p>

        <label className="block" style={{ marginBottom: "0.9rem" }}>
          <span className="block text-xs font-medium uppercase tracking-widest" style={{ color: "var(--muted)", marginBottom: 6 }}>
            Usuario
          </span>
          <input
            style={campo}
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            required
          />
        </label>

        <label className="block" style={{ marginBottom: "1.1rem" }}>
          <span className="block text-xs font-medium uppercase tracking-widest" style={{ color: "var(--muted)", marginBottom: 6 }}>
            Contraseña
          </span>
          <div style={{ position: "relative" }}>
            <input
              style={{ ...campo, paddingRight: "4.5rem" }}
              type={ver ? "text" : "password"}
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
            />
            <button
              type="button"
              onClick={() => setVer((v) => !v)}
              className="text-xs font-medium uppercase tracking-widest"
              style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "var(--accent)", background: "none", border: 0, cursor: "pointer" }}
            >
              {ver ? "Ocultar" : "Ver"}
            </button>
          </div>
        </label>

        <div role="alert" aria-live="polite" style={{ minHeight: "1.4rem", color: "#c0392b", fontSize: "0.9rem", marginBottom: "0.6rem" }}>
          {error}
        </div>

        <button
          type="submit"
          disabled={enviando}
          className="w-full transition-opacity hover:opacity-90"
          style={{
            background: "var(--accent)",
            color: "var(--accent-on)",
            borderRadius: 999,
            padding: "0.9rem 1.5rem",
            fontFamily: GROTESK,
            fontWeight: 700,
            fontSize: "1rem",
            border: 0,
            cursor: enviando ? "wait" : "pointer",
            opacity: enviando ? 0.7 : 1,
          }}
        >
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
