import { AnimatePresence, motion } from "framer-motion"
import { History, Loader2, Mail, Paperclip } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { AgentGrid, type LiveState } from "@/components/demo/AgentGrid"
import { ChatDock } from "@/components/demo/ChatDock"
import { InboxWatcher } from "@/components/demo/InboxWatcher"
import { Header } from "@/components/demo/Header"
import { Calculator, FinalMessage, ImpactSection } from "@/components/demo/Impact"
import { InboxColumn } from "@/components/demo/InboxColumn"
import { Kpis } from "@/components/demo/Kpis"
import { AuditResultColumn } from "@/components/demo/AuditResultColumn"
import { QuoteResultColumn } from "@/components/demo/QuoteResultColumn"
import { RenewalResultColumn } from "@/components/demo/RenewalResultColumn"
import { ResultColumn } from "@/components/demo/ResultColumn"
import { Tour } from "@/components/demo/Tour"
import { WorkColumn } from "@/components/demo/WorkColumn"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { api, track } from "@/lib/api"
import { dateTime } from "@/lib/format"
import type { Agent, InboxItem, Scenario } from "@/lib/types"
import { useRunPlayer } from "@/state/useRunPlayer"

export default function App() {
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tourOpen, setTourOpen] = useState(false)
  const [screen, setScreen] = useState<"home" | "agent">("home")
  const [agentId, setAgentId] = useState<string>("gestion-documental") // agente abierto en el espacio de trabajo
  const [runAgentId, setRunAgentId] = useState<string | null>(null) // agente de la ejecución en curso o la última
  const [emailId, setEmailId] = useState<string | null>(null) // correo concreto que se muestra como entrada (p. ej. uno recibido de fuera)
  const [arrived, setArrived] = useState<InboxItem | null>(null) // correo recibido que ha puesto a trabajar a un agente (ventana de aviso)
  const [highlight, setHighlight] = useState<string | null>(null) // agente elegido por el coordinador
  const runAgentRef = useRef<string | null>(null) // agente de la ejecución en curso (ref: lo leen temporizadores)
  const timers = useRef<number[]>([])
  const player = useRunPlayer()
  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  const openAgent = (id: string, withTour = false) => {
    if (runAgentRef.current && runAgentRef.current !== id) { player.reset(); runAgentRef.current = null; setRunAgentId(null) } // otro agente empieza en blanco
    if (id !== agentId) setEmailId(null)
    setAgentId(id)
    setScreen("agent")
    track("open_agent", `Abrió el agente «${id}»`, { agent_id: id })
    window.scrollTo({ top: 0 })
    if (withTour && id === "gestion-documental") setTourOpen(true) // la guía solo cuenta el agente documental
  }
  // El coordinador ha lanzado un agente: se resalta su tarjeta un instante y se abre su espacio de trabajo.
  const onLaunched = (id: string) => {
    runAgentRef.current = id
    setRunAgentId(id)
    setHighlight(id)
    timers.current.push(window.setTimeout(() => { setHighlight(null); openAgent(id) }, 1400))
  }
  const startFromButton = () => { runAgentRef.current = agentId; setRunAgentId(agentId); void player.start(agentId, emailId) }
  // Ha llegado un correo de fuera y se ha lanzado un agente con él: se abre su espacio de trabajo siguiendo la ejecución.
  const onInboxLaunched = useCallback((it: Pick<InboxItem, "email_id" | "agent_id" | "run_id">) => {
    if (!it.agent_id || !it.run_id) return
    runAgentRef.current = it.agent_id
    setRunAgentId(it.agent_id)
    setEmailId(it.email_id)
    setAgentId(it.agent_id)
    setScreen("agent")
    window.scrollTo({ top: 0 })
    player.attach(it.run_id)
  }, [player])

  const load = useCallback(() => {
    api.scenario(agentId, emailId).then(setScenario).catch((e) => setLoadError(e.message))
  }, [agentId, emailId])
  useEffect(() => { setScenario(null); load() }, [load])
  useEffect(() => { api.agents().then(setAgents).catch(() => setAgents([])) }, [])

  const finished = player.view.finished
  useEffect(() => { if (finished) load() }, [finished, load])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea")) return
      if (e.code === "Space" && player.running) { e.preventDefault(); player.togglePause() }
      if (e.code === "ArrowRight" && player.running) { e.preventDefault(); player.next() }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [player])

  const reset = () => {
    track("reset", "Reinició la demostración")
    player.reset()
    runAgentRef.current = null
    setRunAgentId(null)
    setEmailId(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const recorded = scenario?.latest_recorded_run
  const failed = finished && finished.status !== "completada"
  const ok = finished && finished.status === "completada"
  const assumptions = scenario?.assumptions ?? { manual_minutes: 15, review_minutes: 2 }
  const current = agents.find((a) => a.id === agentId)
  const live: LiveState = runAgentId && player.mode !== "idle"
    ? { agentId: runAgentId, state: failed ? "failed" : ok ? "done" : "working" }
    : null

  return (
    <div className="mx-auto max-w-[1680px] px-6 pb-16 pt-5">
      <Header player={player}
        title={screen === "home" ? "Plataforma de agentes" : `Agente de ${(current?.name ?? "gestión documental").toLowerCase()}`}
        subtitle={screen === "home" ? "Pide lo que necesitas y el agente adecuado se pone a trabajar" : (current ? `${current.input_description.replace(/\.$/, "")} → ${current.output_description.replace(/\.$/, "").toLowerCase()}` : "")}
        onBack={screen === "agent" ? () => { track("back_home", "Volvió a la lista de agentes"); setScreen("home") } : undefined}
        onStart={startFromButton} onReset={reset} onGuide={() => { track("open_guide", "Abrió la guía"); setTourOpen(true) }} />

      {loadError && (
        <div className="mt-4 rounded-md border border-bad/30 bg-bad-soft px-4 py-3 text-[13px] text-bad">
          No se ha podido conectar con el servidor de la demo ({loadError}). Comprueba que está arrancado.
        </div>
      )}

      <ChatDock player={player} agents={agents} onLaunched={onLaunched} />
      <InboxWatcher agents={agents} onLaunched={onInboxLaunched} onArrived={setArrived} />
      <Dialog open={!!arrived} onOpenChange={(o) => !o && setArrived(null)}>
        <DialogContent className="max-w-[460px] gap-0 p-0 sm:max-w-[460px]" showCloseButton={false}>
          <div className="px-6 pb-5 pt-6 text-center">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-signal-soft"><Loader2 className="size-5 animate-spin text-signal" /></div>
            <div className="eyebrow mb-1">Correo recibido</div>
            <DialogTitle className="text-[18px] font-semibold leading-tight text-ink">
              Agente {agents.find((a) => a.id === arrived?.agent_id)?.name ?? ""} procesando
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-[13px] text-ink-2">Ha llegado un correo y el agente ya está trabajando con él.</DialogDescription>
            <div className="mt-4 rounded-md border border-line bg-muted/40 px-3.5 py-3 text-left">
              <div className="flex items-center gap-2 text-[13px] font-medium text-ink"><Mail className="size-3.5 text-ink-3" /><span className="truncate">{arrived?.from_name}</span></div>
              <div className="mt-0.5 truncate text-[12.5px] text-ink-2">«{arrived?.subject}»</div>
              {!!arrived?.attachments && <div className="mt-1 flex items-center gap-1 text-[11.5px] text-ink-3"><Paperclip className="size-3" />{arrived.attachments} adjunto{arrived.attachments > 1 ? "s" : ""}</div>}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-3">
            <Button variant="ghost" onClick={() => setArrived(null)}>Más tarde</Button>
            <Button className="bg-ink text-white hover:bg-ink/90" onClick={() => { if (arrived) onInboxLaunched(arrived); setArrived(null) }}>Abrir para ver progreso</Button>
          </div>
        </DialogContent>
      </Dialog>

      {screen === "home" && (
        <AgentGrid agents={agents} live={live} highlight={highlight} onOpen={(a) => openAgent(a.id, true)} />
      )}

      {screen === "agent" && (
        <>
      <div className="mt-4">
        <Kpis metrics={player.view.metrics} labels={player.view.kpiLabels ?? (current?.impact ? { processed: current.impact.kpi_processed, incidents: "Incidencias detectadas", actions: "Acciones realizadas", time: "Tiempo recuperado" } : null)} total={scenario?.attachments.length ?? 0} />
      </div>

      <div className="mt-3 grid h-[calc(100vh-188px)] min-h-[600px] grid-cols-[minmax(300px,0.92fr)_minmax(400px,1.15fr)_minmax(380px,1.08fr)] gap-3">
        <InboxColumn scenario={scenario} docs={player.view.docs} />
        <WorkColumn player={player} />
        {agentId === "presupuestos" ? <QuoteResultColumn view={player.view} /> : agentId === "renovaciones" ? <RenewalResultColumn view={player.view} /> : agentId === "auditor-facturas" ? <AuditResultColumn view={player.view} /> : <ResultColumn view={player.view} />}
      </div>

      {(player.mode === "idle" || failed) && recorded && (
        <div className="mt-3 flex items-center justify-between rounded-md border border-line bg-surface px-4 py-2.5">
          <span className="text-[12.5px] text-ink-2">
            {failed ? "¿Sin conexión? " : "Sin conexión a internet, "}
            podéis reproducir la última ejecución real grabada ({dateTime(recorded.started_at)}). Se indicará en pantalla que es una reproducción.
          </span>
          <Button variant="outline" size="sm" onClick={() => player.replay(recorded.id)}><History /> Reproducir grabación</Button>
        </div>
      )}

      <AnimatePresence>
        {ok && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="mt-6 space-y-4">
            <ImpactSection agent={current} agentMs={finished.duration_ms} aiCostEur={finished.ai_cost_eur} manual={assumptions.manual_minutes} review={assumptions.review_minutes} />
            <Calculator agent={current} aiCostEur={finished.ai_cost_eur} manual={assumptions.manual_minutes} review={assumptions.review_minutes} />
            <FinalMessage />
          </motion.div>
        )}
      </AnimatePresence>

        </>
      )}

      <Tour open={tourOpen} onClose={() => setTourOpen(false)} player={player} scenario={scenario} onStart={() => void player.start("gestion-documental")} />
    </div>
  )
}
