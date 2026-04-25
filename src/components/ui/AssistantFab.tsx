"use client";

import { useEffect, useState } from "react";

const TARGET_ID = "contacto";

export default function AssistantFab() {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const target = document.getElementById(TARGET_ID);
    if (!target) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: "-80px 0px -80px 0px",
      },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  function scrollToAssistant() {
    const target = document.getElementById(TARGET_ID);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <button
      type="button"
      onClick={scrollToAssistant}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Abrir Kromi, el asistente"
      title="Habla con Kromi"
      style={{
        position: "fixed",
        right: 24,
        bottom: 24,
        width: 68,
        height: 68,
        borderRadius: "50%",
        background: "var(--bg-soft)",
        border: "1px solid var(--border)",
        boxShadow: hovered
          ? "0 10px 30px rgba(0,0,0,0.5), 0 0 0 2px rgba(0,255,136,0.18)"
          : "0 8px 24px rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: 0,
        zIndex: 40,
        opacity: visible ? 1 : 0,
        transform: visible
          ? hovered
            ? "translateY(0) scale(1.05)"
            : "translateY(0) scale(1)"
          : "translateY(12px) scale(0.85)",
        pointerEvents: visible ? "auto" : "none",
        transition:
          "opacity 0.25s ease, transform 0.25s ease, box-shadow 0.2s ease",
      }}
    >
      <RobotIcon />
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 15,
          right: 15,
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: "var(--accent)",
          boxShadow: "0 0 0 2px var(--bg-soft), 0 0 8px rgba(0,255,136,0.6)",
          animation: "assistant-fab-pulse 1.8s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes assistant-fab-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(0.82); }
        }
      `}</style>
    </button>
  );
}

function RobotIcon() {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Antenna */}
      <line
        x1="16"
        y1="3"
        x2="16"
        y2="7"
        stroke="var(--accent)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="16" cy="3" r="1.6" fill="var(--accent)" />

      {/* Head */}
      <rect
        x="5"
        y="8"
        width="22"
        height="16"
        rx="3.5"
        stroke="var(--accent)"
        strokeWidth="1.8"
      />

      {/* Eyes */}
      <circle cx="11.5" cy="15" r="1.8" fill="var(--accent)" />
      <circle cx="20.5" cy="15" r="1.8" fill="var(--accent)" />

      {/* Mouth */}
      <line
        x1="11"
        y1="19.5"
        x2="21"
        y2="19.5"
        stroke="var(--accent)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Side ears */}
      <line
        x1="3"
        y1="13"
        x2="3"
        y2="19"
        stroke="var(--accent)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="29"
        y1="13"
        x2="29"
        y2="19"
        stroke="var(--accent)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
