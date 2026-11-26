import { motion } from "framer-motion"
import { ArrowRight, Calculator, Check, FileText, FolderCheck, Loader2, RefreshCw, Scale, SearchCheck, ShieldAlert } from "lucide-react"
import { useState } from "react"

import type { Agent } from "@/lib/types"

const ICONS: Record<string, typeof FileText> = {
  "folder-check": FolderCheck, calculator: Calculator, scale: Scale, "shield-alert": ShieldAlert,
  "refresh-cw": RefreshCw, "search-check": SearchCheck, "file-text": FileText,
}

type Vertical = "todos" | "gestoria" | "correduria"
const VERTICALS: { id: Vertical; label: string }[] = [
  { id: "todos", label: "Todos" }, { id: "gestoria", label: "Gestorías" }, { id: "correduria", label: "Corredurías de seguros" },
]
const VERTICAL_LABEL: Record<string, string> = { gestoria: "Gestorías", correduria: "Corredurías" }

export type LiveState = { agentId: string; state: "working" | "done" | "failed" } | null

interface Props {
  agents: Agent[]
  live: LiveState
  highlight: string | null // agente elegido por el coordinador
  onOpen: (agent: Agent) => void
}

export function AgentGrid({ agents, live, highlight, onOpen }: Props) {
  const [vertical, setVertical] = useState<Vertical>("todos")
  const shown = agents
    .filter((a) => vertical === "todos" || vertical in a.verticals)
    .sort((a, b) => {
      const rank = (x: Agent) => (x.status === "disponible" ? 0 : 1) + (vertical !== "todos" && x.verticals[vertical] !== "principal" ? 0.5 : 0)
      return rank(a) - rank(b)
    })

  return (
    <section className="mt-5" data-tour="grid">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="eyebrow">Agentes</div>
          <h2 className="text-[22px] font-semibold text-ink">Tu equipo de trabajadores digitales</h2>
        </div>
        <div className="flex gap-1.5 rounded-lg border border-line bg-surface p-1" role="tablist" aria-label="Sector">
          {VERTICALS.map((v) => (
            <button key={v.id} role="tab" aria-selected={vertical === v.id} onClick={() => setVertical(v.id)}
              className={`rounded-md px-3 py-1.5 text-[12.5px] transition ${vertical === v.id ? "bg-ink text-white" : "text-ink-2 hover:text-ink"}`}>{v.label}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {shown.map((a, i) => {
          const Icon = ICONS[a.icon] ?? FileText
          const available = a.status === "disponible"
          const state = live?.agentId === a.id ? live.state : null
          const chosen = highlight === a.id
          return (
            <motion.button key={a.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              disabled={!available} onClick={() => available && onOpen(a)} aria-label={`${a.name}${available ? "" : " (próximamente)"}`}
              className={`panel group relative flex min-h-[240px] flex-col p-5 text-left transition ${available ? "cursor-pointer hover:border-signal hover:shadow-md" : "cursor-default opacity-70"} ${chosen ? "border-signal ring-2 ring-signal/40" : ""}`}>
              <div className="flex items-start justify-between">
                <span className={`grid size-10 place-items-center rounded-lg ${available ? "bg-signal-soft text-signal" : "bg-muted text-ink-3"}`}><Icon className="size-5" /></span>
                {state === "working" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-sm bg-signal-soft px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-signal"><Loader2 className="size-3 animate-spin" /> Trabajando</span>
                ) : state === "done" ? (
                  <span className="inline-flex items-center gap-1 rounded-sm bg-ok-soft px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ok"><Check className="size-3" strokeWidth={3} /> Terminado</span>
                ) : state === "failed" ? (
                  <span className="rounded-sm bg-bad-soft px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-bad">Con error</span>
                ) : available ? (
                  <span className="rounded-sm bg-ok-soft px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ok">Disponible</span>
                ) : (
                  <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-3">Próximamente</span>
                )}
              </div>
              <h3 className="mt-3.5 text-[16.5px] font-semibold text-ink">{a.name}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{a.summary}</p>
              <div className="mt-auto pt-4">
                <dl className="space-y-1 text-[12px] leading-snug text-ink-3">
                  <div className="flex gap-2"><dt className="w-10 shrink-0 font-mono text-[10px] uppercase tracking-wider text-ink-3">Entra</dt><dd className="text-ink-2">{a.input_description}</dd></div>
                  <div className="flex gap-2"><dt className="w-10 shrink-0 font-mono text-[10px] uppercase tracking-wider text-ink-3">Sale</dt><dd className="text-ink-2">{a.output_description}</dd></div>
                </dl>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {Object.entries(a.verticals).map(([v, level]) => (
                    <span key={v} className={`rounded-full border px-2 py-0.5 text-[10.5px] ${level === "principal" ? "border-signal/30 text-signal" : "border-line text-ink-3"}`}>{VERTICAL_LABEL[v] ?? v}</span>
                  ))}
                </div>
              </div>
              {available && <ArrowRight className="absolute bottom-5 right-5 size-4 text-ink-3 transition group-hover:translate-x-0.5 group-hover:text-signal" />}
            </motion.button>
          )
        })}
      </div>
    </section>
  )
}
