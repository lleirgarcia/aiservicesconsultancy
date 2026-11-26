import { AnimatePresence, motion } from "framer-motion"
import { Check, Loader2, Send, Sparkles } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import { eur } from "@/lib/format"
import type { Agent } from "@/lib/types"
import type { Player } from "@/state/useRunPlayer"

type Msg = { id: number; role: "user" | "kroomix"; text: string }

/** Chat para pedir trabajo a la plataforma. El coordinador elige el agente y el panel de abajo muestra su trabajo. */
export function ChatDock({ player, agents, onLaunched }: { player: Player; agents: Agent[]; onLaunched: (agentId: string) => void }) {
  const [text, setText] = useState("")
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [thinking, setThinking] = useState(false)
  const [runAgent, setRunAgent] = useState<string | null>(null) // agente lanzado desde el chat, para narrar su progreso
  const endRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(1)

  const add = (role: Msg["role"], t: string) => setMsgs((m) => [...m, { id: nextId.current++, role, text: t }])
  const agentName = agents.find((a) => a.id === runAgent)?.name ?? "Kroomix"
  const suggestions = agents.filter((a) => a.status === "disponible").flatMap((a) => a.example_requests).slice(0, 3)

  const send = async (raw: string) => {
    const message = raw.trim()
    if (!message || thinking || player.mode === "starting") return
    setText("")
    add("user", message)
    setThinking(true)
    try {
      const r = await api.chat(message)
      add("kroomix", r.reply)
      if (r.action === "launched" && r.run_id) {
        setRunAgent(r.agent_id)
        player.attach(r.run_id)
        if (r.agent_id) onLaunched(r.agent_id)
      }
    } catch (e) {
      add("kroomix", e instanceof Error ? e.message : "No he podido procesar tu petición.")
    } finally {
      setThinking(false)
    }
  }

  // Progreso del agente lanzado desde el chat, narrado desde los eventos reales (no desde el modelo).
  const v = player.view
  const current = [...v.activities].reverse().find((a) => a.status === "running")
  const done = v.finished?.status === "completada"
  const failed = !!v.finished && !done
  const progress = runAgent && player.mode !== "idle"
    ? failed ? { tone: "bad", text: `No ha podido terminar. ${v.finished?.error ?? ""}` }
      : done ? { tone: "ok", text: v.quote
        ? `Ha terminado: ${v.quote.totals ? `presupuesto de ${eur(v.quote.totals.total)} con ${v.quote.lines.length} servicios` : "falta información del cliente para presupuestar"}, ${v.metrics.incidents} pendientes de revisión y el correo preparado para tu aprobación.`
        : `Ha terminado: ${v.summary?.valid_count ?? 0} documentos válidos, ${v.metrics.incidents} incidencias y el correo preparado para tu aprobación.` }
        : { tone: "run", text: current?.label ?? "Empezando a trabajar…" }
    : null

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }) }, [msgs.length, progress?.text, thinking])

  return (
    <section className="panel mt-4 p-3.5" data-tour="chat">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 shrink-0 text-signal" />
        <form className="flex flex-1 items-center gap-2" onSubmit={(e) => { e.preventDefault(); void send(text) }}>
          <Input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000}
            placeholder="Cuéntale a Kroomix qué necesitas, por ejemplo: «Procesa el correo de Construccions Martínez»"
            className="h-10 flex-1 border-line-strong bg-surface text-[14px]" aria-label="Qué necesitas" />
          <Button type="submit" size="lg" disabled={!text.trim() || thinking || player.mode === "starting"} className="h-10 rounded-[10px] bg-ink px-4 text-white hover:bg-ink/90">
            {thinking ? <Loader2 className="animate-spin" /> : <Send />} Pedir
          </Button>
        </form>
      </div>

      {msgs.length === 0 && suggestions.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 pl-6">
          <span className="eyebrow">Prueba con</span>
          {suggestions.map((s) => (
            <button key={s} onClick={() => void send(s)} disabled={thinking}
              className="rounded-full border border-line bg-surface px-3 py-1 text-[12.5px] text-ink-2 transition hover:border-signal hover:text-ink disabled:opacity-50">{s}</button>
          ))}
        </div>
      )}

      <AnimatePresence initial={false}>
        {(msgs.length > 0 || thinking) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
            <div className="mt-3 max-h-[210px] space-y-2 overflow-y-auto border-t border-line pt-3 pl-6 pr-1" aria-live="polite">
              {msgs.map((m) => (
                <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div className={`max-w-[78%] whitespace-pre-line rounded-lg px-3 py-2 text-[13.5px] leading-relaxed ${m.role === "user" ? "bg-ink text-white" : "bg-muted/80 text-ink"}`}>{m.text}</div>
                </div>
              ))}
              {thinking && (
                <div className="flex items-center gap-2 text-[12.5px] text-ink-3"><Loader2 className="size-3.5 animate-spin" /> Entendiendo tu petición…</div>
              )}
              {progress && (
                <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] ${progress.tone === "ok" ? "border-ok/30 bg-ok-soft text-ink" : progress.tone === "bad" ? "border-bad/30 bg-bad-soft text-bad" : "border-signal/30 bg-signal-soft/50 text-ink"}`}>
                  {progress.tone === "run" ? <Loader2 className="size-3.5 shrink-0 animate-spin text-signal" /> : progress.tone === "ok" ? <Check className="size-3.5 shrink-0 text-ok" strokeWidth={3} /> : null}
                  <span><span className="font-medium">{agentName}:</span> {progress.text}</span>
                </div>
              )}
              <div ref={endRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
