import { AnimatePresence, motion } from "framer-motion"
import { AlertTriangle, Check, CircleDashed, Loader2, Pause, Play, SkipForward, X } from "lucide-react"
import { useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import { clock, dateTime, num, seconds } from "@/lib/format"
import type { Activity, ActivityStatus } from "@/lib/types"
import type { Player } from "@/state/useRunPlayer"
import type { Phase } from "@/state/view"

import { Column } from "./Column"

const DEFAULT_PHASES: Phase[] = [
  { id: "recepcion", label: "Recepción", status: "pending" }, { id: "cliente", label: "Cliente", status: "pending" },
  { id: "lectura", label: "Lectura", status: "pending" }, { id: "validacion", label: "Control", status: "pending" },
  { id: "comunicacion", label: "Correo", status: "pending" }, { id: "expediente", label: "Expediente", status: "pending" },
]

const TONE: Record<ActivityStatus, { dot: string; text: string; label: string }> = {
  pending: { dot: "border-line-strong bg-surface text-ink-3", text: "text-ink-3", label: "Pendiente" },
  running: { dot: "border-signal bg-signal text-white", text: "text-signal", label: "En ejecución" },
  done: { dot: "border-ok bg-ok text-white", text: "text-ok", label: "Completada" },
  review: { dot: "border-warn bg-warn text-white", text: "text-warn", label: "Requiere revisión" },
  error: { dot: "border-bad bg-bad text-white", text: "text-bad", label: "Error" },
}

function StatusIcon({ status, className = "size-3" }: { status: ActivityStatus; className?: string }) {
  if (status === "running") return <Loader2 className={`${className} animate-spin`} />
  if (status === "done") return <Check className={className} strokeWidth={3} />
  if (status === "review") return <AlertTriangle className={className} strokeWidth={2.5} />
  if (status === "error") return <X className={className} strokeWidth={3} />
  return <CircleDashed className={className} />
}

function PhaseStepper({ phases }: { phases: Phase[] }) {
  return (
    <div className="grid grid-cols-6 gap-1.5" data-tour="phases">
      {phases.map((p, i) => (
        <div key={p.id} className="min-w-0">
          <div className={`h-[3px] rounded-full transition-colors duration-500 ${
            p.status === "done" ? "bg-ok" : p.status === "review" ? "bg-warn" : p.status === "running" ? "bg-signal" : "bg-line"}`}>
            {p.status === "running" && <div className="h-full w-1/2 animate-pulse rounded-full bg-signal/60" />}
          </div>
          <div className={`mt-1.5 flex items-center gap-1 truncate font-mono text-[10px] uppercase tracking-wider ${TONE[p.status].text}`}>
            <span className="text-ink-3">{String(i + 1).padStart(2, "0")}</span> {p.label}
          </div>
        </div>
      ))}
    </div>
  )
}

function TimelineItem({ a, last }: { a: Activity; last: boolean }) {
  const t = TONE[a.status]
  const running = a.status === "running"
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10, filter: "blur(3px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex gap-3 pb-3"
    >
      {!last && <span className="absolute left-[10px] top-6 h-[calc(100%-18px)] w-px bg-line" />}
      <span className={`relative z-10 mt-0.5 grid size-[21px] shrink-0 place-items-center rounded-full border-[1.5px] ${t.dot}`}>
        <StatusIcon status={a.status} />
        {running && <span className="absolute inset-0 animate-ping rounded-full bg-signal/30" />}
      </span>
      <div className={`min-w-0 flex-1 rounded-md border px-3 py-2 transition-colors ${
        running ? "brackets border-signal/40 bg-signal-soft" : a.status === "review" ? "border-warn/35 bg-warn-soft/60" :
          a.status === "error" ? "border-bad/30 bg-bad-soft" : "border-transparent"}`}>
        <div className="flex items-start justify-between gap-3">
          <span className={`text-[13.5px] leading-snug ${running ? "font-medium text-ink" : "text-ink"}`}>{a.label}</span>
          <span className="num shrink-0 pt-0.5 text-[10.5px] text-ink-3">+{num(a.t_start / 1000, 1)} s</span>
        </div>
        <AnimatePresence>
          {a.detail && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-0.5 text-[12px] leading-snug text-ink-2">
              {a.detail}
            </motion.p>
          )}
        </AnimatePresence>
        {a.status !== "done" && (
          <span className={`mt-1 inline-block font-mono text-[9.5px] uppercase tracking-wider ${t.text}`}>{t.label}</span>
        )}
      </div>
    </motion.li>
  )
}

export function WorkColumn({ player }: { player: Player }) {
  const { view } = player
  const listRef = useRef<HTMLDivElement>(null)
  const phases = view.phases.length ? view.phases : DEFAULT_PHASES
  const acts = view.activities

  useEffect(() => {
    const el = listRef.current?.closest(".thin-scroll")
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [acts.length, acts[acts.length - 1]?.status])

  const live = player.mode === "live" && !player.agentDone
  const right = (
    <div className="flex flex-col items-end gap-1">
      {player.mode === "replay" ? (
        <span className="rounded-sm border border-line-strong px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-2">Reproducción grabada</span>
      ) : live ? (
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-signal"><span className="live-dot" /> En directo</span>
      ) : null}
    </div>
  )

  return (
    <Column index="02" eyebrow="Proceso" title="Kroomix trabaja por vosotros" subtitle="Procesamiento autónomo del expediente" right={right} tour="work">
      <div className="sticky top-[-16px] z-20 -mx-5 -mt-4 mb-3 border-b border-line bg-surface/95 px-5 pb-3 pt-4 backdrop-blur">
        <PhaseStepper phases={phases} />
      </div>
      {!view.started ? (
        <div className="grid h-[calc(100%-60px)] min-h-[260px] place-items-center text-center">
          <div>
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full border border-dashed border-line-strong">
              <Play className="size-4 text-ink-3" />
            </div>
            <p className="text-[14px] font-medium text-ink">Kroomix está esperando trabajo</p>
            <p className="mt-1 text-[12.5px] text-ink-2">Pulsa «Ejecutar demostración» para que procese el correo.</p>
            {player.error && <p className="mt-3 text-[12.5px] text-bad">{player.error}</p>}
          </div>
        </div>
      ) : (
        <div ref={listRef}>
          {player.mode === "replay" && player.replayInfo && (
            <div className="mb-3 rounded-md border border-line bg-muted/60 px-3 py-2 text-[12px] text-ink-2">
              Reproducción de una ejecución real del {dateTime(player.replayInfo.started_at)} con sus tiempos originales
              ({seconds(player.replayInfo.duration_ms)}).
            </div>
          )}
          <ul>
            {acts.map((a, i) => <TimelineItem key={a.id} a={a} last={i === acts.length - 1} />)}
          </ul>
          {view.finished && view.finished.status !== "completada" && (
            <div className="mt-2 rounded-md border border-bad/30 bg-bad-soft px-3 py-2.5 text-[12.5px] text-bad">
              <div className="font-medium">La ejecución no se ha completado</div>
              <div className="mt-0.5 text-ink-2">{view.finished.error}</div>
            </div>
          )}
        </div>
      )}
      <PlaybackBar player={player} />
    </Column>
  )
}

function PlaybackBar({ player }: { player: Player }) {
  if (player.mode === "idle" || player.mode === "starting") return null
  const done = !!player.view.finished
  return (
    <div className="sticky bottom-[-16px] z-20 -mx-5 -mb-4 mt-2 flex items-center justify-between gap-3 border-t border-line bg-surface/95 px-5 py-2.5 backdrop-blur" data-tour="playback">
      <div>
        <div className="eyebrow">{player.agentDone ? "Tiempo real del agente" : "Kroomix lleva trabajando"}</div>
        <div className="num text-[20px] font-semibold leading-tight text-ink">{clock(player.realMs)}</div>
      </div>
      {!done && (
        <div className="flex items-center gap-1.5">
          {player.pending > 0 && (
            <span className="mr-1 font-mono text-[10.5px] text-ink-3">{player.pending} por mostrar</span>
          )}
          <Button variant="outline" size="sm" onClick={player.togglePause} title="Espacio">
            {player.paused ? <><Play /> Continuar</> : <><Pause /> Pausar</>}
          </Button>
          <Button variant="outline" size="sm" onClick={player.next} disabled={player.pending === 0} title="Flecha derecha">
            <SkipForward /> Siguiente
          </Button>
        </div>
      )}
      {done && <span className="max-w-[210px] text-right text-[11.5px] leading-snug text-ink-3">Medido de principio a fin. No incluye el tiempo de revisión humana.</span>}
    </div>
  )
}
