/**
 * Mini-tutorial dinámico. Cada paso apunta a una zona de la pantalla y, cuando depende
 * de la ejecución, espera al evento real correspondiente y avanza solo.
 * Los textos usan los datos reales que va produciendo el agente: nada está precocinado.
 */
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, ArrowRight, Loader2, Play, X } from "lucide-react"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { eur, seconds } from "@/lib/format"
import type { Scenario } from "@/lib/types"
import type { Player } from "@/state/useRunPlayer"

interface Ctx { player: Player; scenario: Scenario | null }

interface Step {
  id: string
  target?: string | ((c: Ctx) => string | undefined)
  title: (c: Ctx) => string
  body: (c: Ctx) => string
  /** Si se define, el paso espera a que se cumpla y avanza solo. */
  waitFor?: (c: Ctx) => boolean
  waitingText?: string
  /** El presentador puede pasar sin esperar. */
  allowNext?: boolean
  skipIf?: (c: Ctx) => boolean
  cta?: "start"
  scroll?: "center" | "nearest"
}

const v = (c: Ctx) => c.player.view
const firstSummary = (c: Ctx) => Object.values(v(c).docs).find((d) => d.summary?.category_label)?.summary

const STEPS: Step[] = [
  {
    id: "welcome",
    title: () => "Así trabaja Kroomix",
    body: () => "En un par de minutos veréis cómo un correo con facturas se convierte en un expediente listo para revisar, sin que nadie lo toque. Os guío punto a punto.",
  },
  {
    id: "inbox", target: "inbox",
    title: () => "1 · Entra trabajo",
    body: (c) => c.scenario
      ? `Un correo de ${c.scenario.email.from_name}: «${c.scenario.email.subject}». Es lo que hoy alguien de vuestro equipo abre, descarga e interpreta a mano.`
      : "El correo que acaba de llegar a la gestoría.",
  },
  {
    id: "attachments", target: "attachments",
    title: () => "Documentos de todo tipo",
    body: (c) => `${c.scenario?.attachments.length ?? 5} adjuntos: PDFs, la foto de un ticket y otra foto sin un nombre que diga qué es. Kroomix no sabe de antemano qué contiene cada uno: tiene que leerlos.`,
  },
  {
    id: "run", target: "run-button", cta: "start",
    title: () => "2 · Kroomix trabaja",
    body: () => "Pulsad «Ejecutar demostración». A partir de aquí, todo lo que aparece en pantalla lo hace el agente en directo.",
    waitFor: (c) => c.player.mode !== "idle",
    skipIf: (c) => c.player.mode !== "idle",
  },
  {
    id: "timeline", target: "work",
    title: () => "Cada línea es una acción real",
    body: () => "Kroomix decide qué consultar y en qué orden: identifica al cliente, abre el expediente y lee cada documento. Verde es hecho; ámbar, algo que necesita a una persona.",
    waitFor: (c) => !!firstSummary(c), allowNext: true,
    waitingText: "Kroomix está identificando al cliente y leyendo los documentos…",
  },
  {
    id: "docs", target: "attachments",
    title: () => "Los documentos cambian de estado",
    body: (c) => {
      const s = firstSummary(c)
      return s
        ? `Aquí se ve qué documento está leyendo y qué ha sacado de cada uno. Por ejemplo: ${s.category_label?.toLowerCase()} de ${s.issuer_name}, ${eur(s.total_amount)}.`
        : "Aquí se ve qué documento está leyendo y qué ha sacado de cada uno."
    },
    allowNext: true,
  },
  {
    id: "kpis", target: "kpis",
    title: () => "Indicadores en directo",
    body: () => "Documentos, incidencias y acciones se actualizan con cada paso del agente. El tiempo recuperado es una estimación comercial, no una medición.",
    allowNext: true,
  },
  {
    id: "incident-1", target: (c) => (v(c).incidents.length ? "incident-0" : "work"),
    title: (c) => (v(c).incidents[0] ? v(c).incidents[0].title : "Buscando errores"),
    body: (c) => v(c).incidents[0]
      ? `${v(c).incidents[0].text.replace(/\.$/, "")}. Nadie le ha dicho que lo buscara: lo ha comprobado contra el histórico y el resto de documentos.`
      : "",
    waitFor: (c) => v(c).incidents.length >= 1,
    waitingText: "Kroomix está comprobando duplicidades y el histórico del cliente…",
    skipIf: (c) => !!v(c).finished && v(c).incidents.length === 0,
  },
  {
    id: "incident-2", target: "incident-1",
    title: (c) => v(c).incidents[1]?.title ?? "",
    body: (c) => (v(c).incidents[1] ? `${v(c).incidents[1].text}` : ""),
    waitFor: (c) => v(c).incidents.length >= 2,
    waitingText: "Kroomix está revisando la documentación recurrente…",
    skipIf: (c) => !!v(c).finished && v(c).incidents.length < 2,
  },
  {
    id: "draft", target: "draft",
    title: () => "El correo ya está escrito",
    body: () => "Kroomix ha redactado el correo para el cliente con lo que necesita. No se envía nada sin vuestra aprobación: podéis aprobarlo, editarlo o rechazarlo.",
    waitFor: (c) => !!v(c).draft,
    waitingText: "Kroomix está preparando el correo para el cliente…",
    skipIf: (c) => !!v(c).finished && !v(c).draft,
  },
  {
    id: "done", target: "total",
    title: () => "3 · Sale trabajo resuelto",
    body: (c) => {
      const s = v(c).summary
      if (!s) return ""
      const dup = s.duplicate_count ? ` La factura duplicada no se ha sumado dos veces.` : ""
      return `Expediente cerrado en ${seconds(c.player.realMs)}: ${s.valid_count} facturas válidas por ${eur(s.totals.total)}.${dup} Vuestro equipo solo tiene que revisar ${v(c).incidents.length} incidencias.`
    },
    waitFor: (c) => !!v(c).finished && !!v(c).summary,
    waitingText: "Kroomix está organizando el expediente…",
  },
  {
    id: "tasks", target: "tasks",
    title: () => "Lo que queda para vuestro equipo",
    body: (c) => `${v(c).tasks.length} tareas de revisión humana. Aquí es donde una persona aporta valor: decidir, no teclear.`,
    skipIf: (c) => v(c).tasks.length === 0,
  },
  {
    id: "impact", target: "impact", scroll: "center",
    title: () => "El impacto",
    body: () => "Lo que antes eran siete tareas manuales se queda en dos: revisar y validar. Fijaos en la diferencia entre el tiempo real del agente y el tiempo humano estimado.",
    skipIf: (c) => !v(c).finished,
  },
  {
    id: "calculator", target: "calculator", scroll: "center",
    title: () => "Con vuestros números",
    body: () => "Cambiad los valores con los de vuestra gestoría: expedientes al día, minutos por expediente y coste por hora. Los resultados se recalculan al momento.",
    skipIf: (c) => !v(c).finished,
  },
  {
    id: "final", target: "final", scroll: "center",
    title: () => "Menos trabajo administrativo",
    body: () => "Más capacidad para hacer crecer vuestro negocio, con la misma plantilla.",
    skipIf: (c) => !v(c).finished,
  },
]

interface Rect { top: number; left: number; width: number; height: number }

function useTargetRect(selector: string | undefined, key: string): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null)
  useLayoutEffect(() => {
    let raf = 0
    const loop = () => {
      const el = selector ? document.querySelector(`[data-tour="${selector}"]`) : null
      if (el) {
        const r = el.getBoundingClientRect()
        setRect((prev) =>
          prev && Math.abs(prev.top - r.top) < 0.5 && Math.abs(prev.left - r.left) < 0.5 && Math.abs(prev.width - r.width) < 0.5 && Math.abs(prev.height - r.height) < 0.5
            ? prev : { top: r.top, left: r.left, width: r.width, height: r.height })
      } else setRect(null)
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [selector, key])
  return rect
}

const CARD_W = 340

function placeCard(rect: Rect | null, cardH: number) {
  const vw = window.innerWidth, vh = window.innerHeight, gap = 16
  if (!rect) return { top: vh / 2 - cardH / 2, left: vw / 2 - CARD_W / 2 }
  const clampTop = (t: number) => Math.min(Math.max(12, t), vh - cardH - 12)
  const clampLeft = (l: number) => Math.min(Math.max(12, l), vw - CARD_W - 12)
  if (rect.left + rect.width + gap + CARD_W < vw) return { top: clampTop(rect.top), left: rect.left + rect.width + gap }
  if (rect.left - gap - CARD_W > 0) return { top: clampTop(rect.top), left: rect.left - gap - CARD_W }
  if (rect.top + rect.height + gap + cardH < vh) return { top: rect.top + rect.height + gap, left: clampLeft(rect.left + rect.width / 2 - CARD_W / 2) }
  return { top: clampTop(rect.top - gap - cardH), left: clampLeft(rect.left + rect.width / 2 - CARD_W / 2) }
}

export function Tour({ open, onClose, player, scenario, onStart }: {
  open: boolean; onClose: () => void; player: Player; scenario: Scenario | null; onStart: () => void
}) {
  const [index, setIndex] = useState(0)
  const ctx: Ctx = { player, scenario }
  const ctxRef = useRef(ctx)
  ctxRef.current = ctx
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const cardRef = useRef<HTMLDivElement>(null)
  const [cardH, setCardH] = useState(180)

  // Al abrir, empieza por el primer paso que tenga sentido.
  useEffect(() => { if (open) setIndex(0) }, [open])

  const visible = (i: number) => !STEPS[i].skipIf?.(ctx)
  const go = useCallback((dir: 1 | -1) => {
    setIndex((i) => {
      let j = i + dir
      while (j >= 0 && j < STEPS.length && STEPS[j].skipIf?.(ctxRef.current)) j += dir
      if (j >= STEPS.length) { setTimeout(() => closeRef.current(), 0); return i }
      return Math.max(0, j)
    })
  }, [])

  const step = STEPS[index]
  const waiting = !!step.waitFor && !step.waitFor(ctx)

  // Cuando llega el evento que el paso espera, el paso muestra su contenido real y espera al presentador.
  // Solo el paso «pulsa ejecutar» avanza solo, porque su única función es esa acción.
  const satisfied = !!step.waitFor && step.waitFor(ctx)
  useEffect(() => {
    if (!open || !satisfied || step.id !== "run") return
    const t = setTimeout(() => go(1), 300)
    return () => clearTimeout(t)
  }, [open, satisfied, step.id, go])

  // Si el paso actual deja de tener sentido (p. ej. ya se pulsó ejecutar), saltarlo.
  const skipNow = open && !!step.skipIf?.(ctx) && !step.waitFor?.(ctx)
  useEffect(() => { if (skipNow) go(1) }, [skipNow, go])

  const target = typeof step.target === "function" ? step.target(ctx) : step.target
  useEffect(() => {
    if (!open || !target) return
    const el = document.querySelector(`[data-tour="${target}"]`)
    el?.scrollIntoView({ behavior: "smooth", block: step.scroll ?? "nearest" })
  }, [open, target, step.scroll])

  const rect = useTargetRect(open ? target : undefined, step.id)
  useLayoutEffect(() => { if (cardRef.current) setCardH(cardRef.current.offsetHeight) })
  const pos = useMemo(() => placeCard(rect, cardH), [rect, cardH])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const total = STEPS.filter((_, i) => visible(i)).length
  const position = STEPS.slice(0, index + 1).filter((_, i) => visible(i)).length
  const body = step.body(ctx)
  const title = step.title(ctx)
  const pad = 6

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="spot"
            className="pointer-events-none fixed z-[60] rounded-lg"
            initial={false}
            animate={rect
              ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, opacity: 1 }
              : { top: window.innerHeight / 2, left: window.innerWidth / 2, width: 0, height: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
            style={{ boxShadow: "0 0 0 9999px rgba(11,16,22,0.42)", outline: rect ? "1.5px solid var(--signal)" : "none" }}
          />
          <motion.div
            key="card"
            ref={cardRef}
            role="dialog"
            aria-label="Guía de la demostración"
            className="fixed z-[61] w-[340px] rounded-lg border border-line bg-surface p-4 shadow-[0_24px_60px_-20px_rgba(11,16,22,.55)]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, top: pos.top, left: pos.left }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          >
            <div className="flex items-center justify-between">
              <span className="eyebrow flex items-center gap-2">
                <span className="text-signal">Guía</span>
                <span className="num">{String(position).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
              </span>
              <button onClick={onClose} className="text-ink-3 hover:text-ink" aria-label="Cerrar guía"><X className="size-4" /></button>
            </div>
            <div className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-muted">
              <motion.div className="h-full bg-signal" animate={{ width: `${(position / total) * 100}%` }} />
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={step.id + (waiting ? "-w" : "")} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {waiting && step.waitingText && !(step.id === "run") ? (
                  <div className="mt-3 flex items-start gap-2.5">
                    <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-signal" />
                    <div>
                      <p className="text-[14px] font-semibold text-ink">{step.id.startsWith("incident") ? "Comprobando…" : title}</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{step.waitingText}</p>
                      {player.paused && <p className="mt-1.5 text-[12px] text-warn">La visualización está en pausa.</p>}
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="mt-3 text-[16px] font-semibold leading-snug text-ink">{title}</h3>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{body}</p>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-4 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => go(-1)} disabled={index === 0} className="text-ink-3">
                <ArrowLeft /> Atrás
              </Button>
              {step.cta === "start" && waiting ? (
                <Button size="sm" onClick={onStart} className="bg-ink text-white hover:bg-ink/90"><Play className="fill-white" /> Ejecutar ahora</Button>
              ) : waiting && !step.allowNext ? (
                <Button variant="ghost" size="sm" onClick={() => go(1)} className="text-ink-3">Saltar</Button>
              ) : (
                <Button size="sm" onClick={() => go(1)} className="bg-signal text-white hover:bg-signal/90">
                  {index === 0 ? "Empezar" : step.id === "final" ? "Terminar" : "Siguiente"} <ArrowRight />
                </Button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
