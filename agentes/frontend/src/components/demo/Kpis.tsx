import { animate, motion, useMotionValue, useTransform } from "framer-motion"
import { AlertTriangle, CheckCheck, FileStack, Timer } from "lucide-react"
import { useEffect } from "react"

import { num } from "@/lib/format"
import type { KpiLabels, Metrics } from "@/lib/types"

function Counter({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const mv = useMotionValue(value)
  const text = useTransform(mv, (v) => num(v, decimals))
  useEffect(() => {
    const c = animate(mv, value, { duration: 0.6, ease: [0.22, 1, 0.36, 1] })
    return () => c.stop()
  }, [mv, value])
  return <motion.span>{text}</motion.span>
}

export function Kpis({ metrics, total, labels }: { metrics: Metrics; total: number; labels?: KpiLabels | null }) {
  const docsTotal = metrics.documents_total || total
  const items = [
    { key: "docs", label: labels?.processed ?? "Documentos procesados", icon: FileStack, value: metrics.documents_processed, ...(docsTotal ? { suffix: `/ ${docsTotal}` } : {}), tone: "ink" },
    { key: "inc", label: labels?.incidents ?? "Incidencias detectadas", icon: AlertTriangle, value: metrics.incidents, tone: metrics.incidents ? "warn" : "ink" },
    { key: "act", label: labels?.actions ?? "Acciones realizadas", icon: CheckCheck, value: metrics.actions, tone: "ink" },
    { key: "time", label: labels?.time ?? "Tiempo recuperado", icon: Timer, value: metrics.minutes_saved, decimals: 1, suffix: "min", tone: "ok", note: "Estimación" },
  ] as const
  return (
    <div className="grid grid-cols-4 gap-3" data-tour="kpis">
      {items.map((it) => (
        <div key={it.key} className="panel relative overflow-hidden px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="eyebrow">{it.label}</span>
            <it.icon className={`size-4 ${it.tone === "warn" ? "text-warn" : it.tone === "ok" ? "text-ok" : "text-ink-3"}`} />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className={`num text-[34px] font-semibold leading-none ${it.tone === "warn" ? "text-warn" : "text-ink"}`}>
              <Counter value={it.value} decimals={"decimals" in it ? it.decimals : 0} />
            </span>
            {"suffix" in it && <span className="num text-[14px] text-ink-3">{it.suffix}</span>}
            {"note" in it && <span className="ml-auto rounded-sm bg-ok-soft px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ok">{it.note}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}
