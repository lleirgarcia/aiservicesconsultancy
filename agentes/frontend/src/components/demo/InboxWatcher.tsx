import { AnimatePresence, motion } from "framer-motion"
import { AtSign, Loader2, Paperclip } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import type { Agent, InboxItem, InboxState } from "@/lib/types"

const STATE: Record<InboxItem["status"], string> = {
  pendiente: "Esperando turno", lanzado: "En marcha", respondido: "Necesita tu decisión", ignorado: "Ignorado", error: "No se ha podido procesar",
}

/**
 * Bandeja de correo externo. Cuando llega un correo y el coordinador lanza un agente, abre su espacio de trabajo
 * con ese correo como entrada. Si no sabe qué agente usar, lo deja aquí para que lo elijas.
 */
export function InboxWatcher({ agents, onLaunched, onArrived }: {
  agents: Agent[]
  onLaunched: (item: Pick<InboxItem, "email_id" | "agent_id" | "run_id">) => void // lanzado por el usuario desde el panel: se abre directamente
  onArrived: (item: InboxItem) => void // llega un correo y el coordinador lanza un agente: se avisa con una ventana
}) {
  const [state, setState] = useState<InboxState | null>(null)
  const known = useRef<Map<string, string> | null>(null) // estado conocido de cada correo; null hasta la primera lectura
  const handled = useRef<Set<string>>(new Set()) // ejecuciones ya abiertas en pantalla
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let stop = false
    const tick = async () => {
      try {
        const s = await api.inbox()
        if (stop) return
        setState(s)
        if (known.current) {
          for (const it of s.items) {
            if (it.status === "lanzado" && known.current.get(it.email_id) !== "lanzado" && it.run_id && !handled.current.has(it.run_id)) {
              handled.current.add(it.run_id)
              onArrived(it)
            }
          }
        }
        known.current = new Map(s.items.map((i) => [i.email_id, i.status]))
        if (!s.enabled) return // sin credenciales no hay nada que vigilar
      } catch { /* servidor no disponible: se reintenta */ }
      if (!stop) timer = window.setTimeout(tick, 3000)
    }
    let timer = window.setTimeout(tick, 0)
    return () => { stop = true; window.clearTimeout(timer) }
  }, [onArrived])

  if (!state?.enabled) return null
  const recent = state.items.slice(0, 3)
  const available = agents.filter((a) => a.status === "disponible")

  const launch = async (it: InboxItem, agentId: string) => {
    setBusy(it.email_id); setError(null)
    try {
      const { run_id } = await api.launchInbox(it.email_id, agentId)
      handled.current.add(run_id)
      onLaunched({ email_id: it.email_id, agent_id: agentId, run_id })
    } catch (e) { setError(e instanceof Error ? e.message : "No se ha podido lanzar.") } finally { setBusy(null) }
  }

  return (
    <div className="mt-3 rounded-md border border-line bg-surface px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="eyebrow flex items-center gap-1.5"><AtSign className="size-3" /> Bandeja de entrada</span>
        <span className="text-[12.5px] text-ink-2">Escuchando correos enviados a <span className="font-medium text-ink">{state.alias}</span></span>
        <span className="relative ml-auto flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60" /><span className="relative inline-flex size-2 rounded-full bg-ok" /></span>
      </div>
      {recent.length === 0 ? (
        <p className="mt-2 text-[12.5px] text-ink-3">Todavía no ha llegado ningún correo. Cuando llegue, el agente adecuado se pondrá a trabajar.</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          <AnimatePresence initial={false}>
            {recent.map((it) => (
              <motion.li key={it.email_id} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-medium text-ink">{it.from_name}</span>
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-2">«{it.subject}»</span>
                  {it.attachments > 0 && <span className="flex items-center gap-0.5 text-[11.5px] text-ink-3"><Paperclip className="size-3" />{it.attachments}</span>}
                  <span className={`flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider ${it.status === "lanzado" ? "text-ok" : it.status === "respondido" ? "text-warn" : "text-ink-3"}`}>
                    {it.status === "pendiente" && <Loader2 className="size-3 animate-spin" />}{STATE[it.status]}
                  </span>
                </div>
                {it.note && <p className="mt-1 text-[12px] leading-snug text-ink-2">{it.note}</p>}
                {it.status === "respondido" && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {available.map((a) => <Button key={a.id} size="sm" variant="outline" disabled={busy === it.email_id} onClick={() => launch(it, a.id)}>Procesar con {a.name}</Button>)}
                  </div>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
      {error && <p className="mt-2 text-[12px] text-bad">{error}</p>}
    </div>
  )
}
