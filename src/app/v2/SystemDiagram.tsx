"use client";

import { useI18n } from "@/i18n/LocaleContext";
import { seg, easeOut } from "./scrollProgress";

const GROTESK = "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif";
const JMONO = "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, monospace";

const BLUE = "#0d6ef2";
const GREEN = "#16a34a";

/** Iconos de los nodos (trazo, heredan color del chip). */
const ICONS: Record<string, React.ReactNode> = {
  copy: (
    <>
      <rect x="9" y="9" width="10" height="10" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </>
  ),
  table: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18M9 10v10" />
    </>
  ),
  doc: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.2 2.2M16.9 16.9l2.2 2.2M19.1 4.9l-2.2 2.2M7.1 16.9l-2.2 2.2" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.6 2.6L16 9.5" />
    </>
  ),
};

function NodeIcon({ name, color, bg }: { name: string; color: string; bg: string }) {
  return (
    <span
      aria-hidden
      className="flex items-center justify-center shrink-0"
      style={{ width: 32, height: 32, borderRadius: 8, background: bg, color }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {ICONS[name]}
      </svg>
    </span>
  );
}

/** Nodo del canvas de flujo. */
function Node({
  title,
  sub,
  badge,
  badgeTone = "manual",
  icon,
  iconColor,
  iconBg,
  tone = "plain",
}: {
  title: string;
  sub: string;
  badge: string;
  badgeTone?: "manual" | "auto";
  icon: string;
  iconColor: string;
  iconBg: string;
  tone?: "plain" | "system" | "save";
}) {
  const border =
    tone === "plain" ? "1px solid var(--border)" : `1.5px solid ${tone === "save" ? GREEN : BLUE}`;
  const badgeBg = badgeTone === "auto" ? "#dcfce7" : "#fef3c7";
  const badgeFg = badgeTone === "auto" ? GREEN : "#b45309";
  return (
    <div className="relative">
      {tone === "system" && <span className="v3-pulse" aria-hidden />}
      <span
        style={{
          position: "absolute",
          top: -13,
          right: 10,
          border: `1px solid ${badgeTone === "auto" ? "#bbf7d0" : "#fde68a"}`,
          background: badgeBg,
          color: badgeFg,
          fontFamily: JMONO,
          fontSize: "0.66rem",
          fontWeight: 700,
          borderRadius: 6,
          padding: "0.15rem 0.45rem",
          whiteSpace: "nowrap",
        }}
      >
        {badge}
      </span>
      <div
        className="flex items-center gap-3"
        style={{
          background: "var(--surface)",
          border,
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(16, 20, 24, 0.07)",
          padding: "0.7rem 0.85rem",
          height: 76,
        }}
      >
        <NodeIcon name={icon} color={iconColor} bg={iconBg} />
        <span className="min-w-0">
          <span
            className="block"
            style={{ fontFamily: GROTESK, fontSize: "0.92rem", fontWeight: 600, color: "var(--fg)", lineHeight: 1.25 }}
          >
            {title}
          </span>
          <span className="block" style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
            {sub}
          </span>
        </span>
      </div>
    </div>
  );
}

/** Etiqueta de grupo (eyebrow) sobre cada tramo del diagrama. */
function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: JMONO,
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase" as const,
        color: "var(--muted)",
        marginBottom: "0.6rem",
      }}
    >
      {children}
    </div>
  );
}

/* Geometría del canvas: 3 nodos de 76px con 22px de hueco. */
const NODE_H = 76;
const NODE_GAP = 22;
const COL_H = NODE_H * 3 + NODE_GAP * 2;
const Y_TOP = NODE_H / 2;
const Y_MID = COL_H / 2;
const Y_BOT = COL_H - NODE_H / 2;

/** Conectores que unen los 3 procesos en el sistema (solo escritorio). */
function MergeConnector({ draw }: { draw: number }) {
  const w = 76;
  return (
    <svg width="100%" height={COL_H} viewBox={`0 0 ${w} ${COL_H}`} fill="none" aria-hidden style={{ overflow: "visible" }}>
      {[
        `M2 ${Y_TOP} H${w / 2 - 12} Q${w / 2} ${Y_TOP} ${w / 2} ${Y_TOP + 12} V${Y_MID - 12} Q${w / 2} ${Y_MID} ${w / 2 + 12} ${Y_MID} H${w - 2}`,
        `M2 ${Y_MID} H${w - 2}`,
        `M2 ${Y_BOT} H${w / 2 - 12} Q${w / 2} ${Y_BOT} ${w / 2} ${Y_BOT - 12} V${Y_MID + 12} Q${w / 2} ${Y_MID} ${w / 2 + 12} ${Y_MID} H${w - 2}`,
      ].map((d, i) => (
        <path
          key={i}
          d={d}
          stroke={BLUE}
          strokeWidth={1.5}
          opacity={0.5}
          pathLength={1}
          strokeDasharray={`${draw} 1`}
        />
      ))}
      {[Y_TOP, Y_MID, Y_BOT].map((cy) => (
        <circle key={cy} cx={2} cy={cy} r={3} fill={BLUE} opacity={draw > 0 ? 1 : 0} />
      ))}
      <circle cx={w - 2} cy={Y_MID} r={3} fill={BLUE} opacity={draw > 0.95 ? 1 : 0} />
    </svg>
  );
}

/** Conector recto del sistema al resultado (solo escritorio). */
function StraightConnector({ draw }: { draw: number }) {
  return (
    <svg width="100%" height={20} viewBox="0 0 76 20" fill="none" aria-hidden style={{ overflow: "visible" }}>
      <path d="M2 10 H74" stroke={GREEN} strokeWidth={1.5} opacity={0.6} pathLength={1} strokeDasharray={`${draw} 1`} />
      <circle cx={2} cy={10} r={3} fill={GREEN} opacity={draw > 0 ? 1 : 0} />
      <circle cx={74} cy={10} r={3} fill={GREEN} opacity={draw > 0.95 ? 1 : 0} />
    </svg>
  );
}

/**
 * Canvas de flujo con fondo de puntos: el mismo diagrama de siempre (3
 * procesos manuales → sistema → ahorro), ahora agrupado bajo tres etiquetas
 * que separan qué había, qué se construyó y qué se gana con ello.
 */
function SystemCanvas({ progress }: { progress: number }) {
  const { t } = useI18n();

  /** Cada pieza entra en su tramo del recorrido. */
  const appear = (a: number, b: number) => {
    const k = easeOut(seg(progress, a, b));
    return { opacity: k, transform: `translateY(${(1 - k) * 14}px)`, willChange: "opacity, transform" };
  };

  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid var(--border)",
        background:
          "radial-gradient(circle, color-mix(in srgb, #c9d6ff calc(var(--ink) * 100%), rgba(16,20,24,0.13)) 1px, transparent 1px) 0 0 / 18px 18px, var(--surface-2)",
        padding: "1.6rem 1.25rem",
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_76px_minmax(0,1fr)_76px_minmax(0,0.85fr)] gap-y-2 md:gap-y-0 items-center">
        {/* fila 1 (solo escritorio): las tres etiquetas de grupo */}
        <div className="hidden md:block"><GroupLabel>{t("v3.demo.sistemaG1")}</GroupLabel></div>
        <div className="hidden md:block" aria-hidden />
        <div className="hidden md:block"><GroupLabel>{t("v3.demo.sistemaG2")}</GroupLabel></div>
        <div className="hidden md:block" aria-hidden />
        <div className="hidden md:block"><GroupLabel>{t("v3.demo.sistemaG3")}</GroupLabel></div>

        {/* fila 2: los nodos y conectores de siempre */}
        <div>
          <div className="md:hidden"><GroupLabel>{t("v3.demo.sistemaG1")}</GroupLabel></div>
          <div className="flex flex-col" style={{ gap: NODE_GAP }}>
            <div style={appear(0, 0.16)}>
            <Node icon="copy" iconColor={BLUE} iconBg="rgba(13,110,242,0.1)" title={t("v3.demo.p1t")} sub={t("v3.demo.p1s")} badge={t("v3.demo.bManual")} />
            </div>
            <div style={appear(0.06, 0.22)}>
            <Node icon="table" iconColor="#b45309" iconBg="rgba(245,158,11,0.14)" title={t("v3.demo.p2t")} sub={t("v3.demo.p2s")} badge={t("v3.demo.bManual")} />
            </div>
            <div style={appear(0.12, 0.28)}>
            <Node icon="doc" iconColor="#64748b" iconBg="rgba(148,163,184,0.18)" title={t("v3.demo.p3t")} sub={t("v3.demo.p3s")} badge={t("v3.demo.bManual")} />
            </div>
          </div>
        </div>

        <div className="hidden md:block"><MergeConnector draw={easeOut(seg(progress, 0.28, 0.58))} /></div>
        <div className="md:hidden text-center" style={{ color: BLUE, fontFamily: JMONO }}>↓</div>

        <div>
          <div className="md:hidden"><GroupLabel>{t("v3.demo.sistemaG2")}</GroupLabel></div>
          <div style={appear(0.54, 0.72)}>
          <Node
            icon="gear"
            iconColor={BLUE}
            iconBg="rgba(13,110,242,0.12)"
            tone="system"
            title={t("v3.demo.sys")}
            sub={t("v3.demo.sysSub")}
            badge={t("v3.demo.bAuto")}
            badgeTone="auto"
          />
          </div>
        </div>

        <div className="hidden md:block"><StraightConnector draw={easeOut(seg(progress, 0.7, 0.86))} /></div>
        <div className="md:hidden text-center" style={{ color: GREEN, fontFamily: JMONO }}>↓</div>

        <div>
          <div className="md:hidden"><GroupLabel>{t("v3.demo.sistemaG3")}</GroupLabel></div>
          <div style={appear(0.82, 1)}>
          <Node
            icon="check"
            iconColor={GREEN}
            iconBg="rgba(22,163,74,0.12)"
            tone="save"
            title={t("v3.demo.save")}
            sub={t("v3.demo.saveSub")}
            badge={t("v3.demo.bResult")}
            badgeTone="auto"
          />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Sección "Sistema": el mismo proceso resuelto, separado en qué había, qué se creó y qué se gana. */
export default function SystemDiagram({ progress }: { progress: number }) {
  const { t } = useI18n();
  return (
    <div>
      <p
        style={{
          fontFamily: GROTESK,
          fontSize: "clamp(1.15rem, 2.2vw, 1.65rem)",
          lineHeight: 1.4,
          margin: "0 0 clamp(1.75rem, 4vh, 2.5rem)",
          maxWidth: "60ch",
        }}
      >
        <span style={{ color: "var(--fg)", fontWeight: 600 }}>{t("v3.demo.sistemaLead1")}</span>{" "}
        <span style={{ color: "var(--muted)" }}>{t("v3.demo.sistemaLead2")}</span>
      </p>
      <SystemCanvas progress={progress} />
    </div>
  );
}
