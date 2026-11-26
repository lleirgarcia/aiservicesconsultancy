import { motion } from "framer-motion"
import { ArrowRight, Check, Minus } from "lucide-react"
import { useState } from "react"

import { Input } from "@/components/ui/input"
import { eur, eur0, num, seconds } from "@/lib/format"
import type { Agent } from "@/lib/types"

const DEFAULT_UNITS = { unit_singular: "expediente", unit_plural: "expedientes" }
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const DEFAULT_HOURLY_COST = 24 // €/h: mismo valor inicial que la calculadora

function EstimateTag() {
  return <span className="rounded-sm bg-warn-soft px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-warn">Estimación</span>
}

function Bar({ label, value, max, tone, caption }: { label: string; value: number; max: number; tone: "ink" | "signal" | "ok"; caption: string }) {
  const color = { ink: "bg-ink/80", signal: "bg-signal", ok: "bg-ok" }[tone]
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[12.5px] text-ink-2">{label}</span>
        <span className="num text-[14px] font-semibold text-ink">{caption}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <motion.div className={`h-full rounded-full ${color}`} initial={{ width: 0 }} whileInView={{ width: `${Math.max(1.5, (value / max) * 100)}%` }}
          viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
      </div>
    </div>
  )
}

export function ImpactSection({ agent, agentMs, aiCostEur, manual, review }: { agent?: Agent; agentMs: number; aiCostEur: number | null; manual: number; review: number }) {
  const BEFORE = agent?.impact?.manual_steps ?? []
  const AFTER = agent?.impact?.agent_steps ?? []
  const unit = agent?.impact?.unit_singular ?? DEFAULT_UNITS.unit_singular
  const saved = manual - review
  const pct = Math.round((saved / manual) * 100)
  return (
    <section className="panel p-6" data-tour="impact">
      <div className="eyebrow mb-1.5 flex items-center gap-2"><span className="text-signal">04</span><span className="h-px w-4 bg-line-strong" />Impacto</div>
      <h2 className="text-[24px] font-semibold text-ink">El impacto en vuestra empresa</h2>

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr_1.25fr] items-stretch gap-5">
        <div className="rounded-md border border-line p-4">
          <div className="eyebrow mb-2">Antes de Kroomix</div>
          <ul className="space-y-1.5">
            {BEFORE.map((b) => (
              <li key={b} className="flex items-center gap-2 text-[13.5px] text-ink-2"><Minus className="size-3.5 text-ink-3" /> {b}</li>
            ))}
          </ul>
        </div>
        <div className="grid place-items-center"><ArrowRight className="size-5 text-ink-3" /></div>
        <div className="brackets rounded-md border border-signal/30 bg-signal-soft/50 p-4">
          <div className="eyebrow mb-2 text-signal">Con Kroomix</div>
          <ul className="space-y-1.5">
            {AFTER.map((b) => (
              <li key={b} className="flex items-center gap-2 text-[14px] font-medium text-ink"><Check className="size-3.5 text-ok" strokeWidth={3} /> {b}</li>
            ))}
          </ul>
          <p className="mt-4 text-[12.5px] leading-relaxed text-ink-2">El resto lo hace Kroomix{agent ? `: ${agent.workflow.charAt(0).toLowerCase()}${agent.workflow.slice(1)}` : "."}</p>
        </div>
        <div className="rounded-md border border-line p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="eyebrow">Tiempo humano por {unit}</span>
            <EstimateTag />
          </div>
          <div className="space-y-3.5">
            <Bar label="Procesamiento manual" value={manual} max={manual} tone="ink" caption={`${num(manual)} min`} />
            <Bar label="Revisión humana con Kroomix" value={review} max={manual} tone="ok" caption={`${num(review)} min`} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3">
            <div>
              <div className="num text-[26px] font-semibold leading-none text-ink">{num(saved)} min</div>
              <div className="mt-1 text-[11.5px] text-ink-2">recuperados por {unit}</div>
            </div>
            <div>
              <div className="num text-[26px] font-semibold leading-none text-ok">−{pct}%</div>
              <div className="mt-1 text-[11.5px] text-ink-2">de trabajo manual</div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-md bg-muted/70 px-3 py-2">
            <div>
              <div className="text-[12px] font-medium text-ink">Tiempo real de ejecución del agente</div>
              <div className="text-[11px] text-ink-3">Medido en esta demostración · no es tiempo humano</div>
            </div>
            <span className="num text-[18px] font-semibold text-signal">{seconds(agentMs)}</span>
          </div>
          {aiCostEur != null && (
            <div className="mt-2 rounded-md bg-muted/70 px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="text-[12px] font-medium text-ink">Coste de Kroomix por {unit}</div>
                <span className="flex items-center gap-2"><EstimateTag /><span className="num text-[18px] font-semibold text-signal">≈ {eur(aiCostEur)}</span></span>
              </div>
              <div className="mt-1 text-[11px] text-ink-3">
                Frente a ≈ {eur((manual / 60) * DEFAULT_HOURLY_COST)} de trabajo manual ({num(manual)} min a {num(DEFAULT_HOURLY_COST, 0)} €/h). Coste de la IA en esta ejecución, sin contar revisión humana.
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="mt-3 text-[11.5px] text-ink-3">
        Los minutos por {unit} son hipótesis comerciales iniciales ({num(manual)} min manual, {num(review)} min de revisión), no resultados demostrados.
      </p>
    </section>
  )
}

const FIELDS = [
  { key: "cases", label: "Expedientes al día", unit: "uds.", step: 1 },
  { key: "manual", label: "Minutos manuales por expediente", unit: "min", step: 1 },
  { key: "review", label: "Minutos de revisión con Kroomix", unit: "min", step: 0.5 },
  { key: "cost", label: "Coste laboral por hora", unit: "€/h", step: 1 },
  { key: "days", label: "Días laborables al año", unit: "días", step: 1 },
] as const
type Key = (typeof FIELDS)[number]["key"]
const FTE_HOURS = 1760

export function Calculator({ agent, aiCostEur, manual, review }: { agent?: Agent; aiCostEur: number | null; manual: number; review: number }) {
  const units = agent?.impact ?? DEFAULT_UNITS
  const [v, setV] = useState<Record<Key, number>>({ cases: 25, manual, review, cost: 24, days: 220 })
  const set = (k: Key, x: string) => setV((s) => ({ ...s, [k]: Math.max(0, Number(x.replace(",", ".")) || 0) }))
  const savedMin = Math.max(0, v.manual - v.review)
  const hDay = (v.cases * savedMin) / 60
  const hYear = hDay * v.days
  const hMonth = hYear / 12
  const value = hYear * v.cost
  const fte = hYear / FTE_HOURS
  const aiYear = aiCostEur != null ? aiCostEur * v.cases * v.days : null
  const manualYear = (v.cases * v.manual * v.days) / 60
  const withYear = (v.cases * v.review * v.days) / 60

  return (
    <section className="panel p-6" data-tour="calculator">
      <div className="eyebrow mb-1.5 flex items-center gap-2"><span className="text-signal">05</span><span className="h-px w-4 bg-line-strong" />Calculadora</div>
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-[24px] font-semibold text-ink">¿Cuánto supondría en vuestra gestoría?</h2>
        <EstimateTag />
      </div>
      <div className="mt-5 grid grid-cols-[320px_1fr] gap-6">
        <div className="space-y-2.5">
          {FIELDS.map((f) => (
            <label key={f.key} className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2 focus-within:border-signal">
              <span className="text-[12.5px] text-ink-2">{f.key === "cases" ? `${cap(units.unit_plural)} al día` : f.key === "manual" ? `Minutos manuales por ${units.unit_singular}` : f.label}</span>
              <span className="flex items-center gap-1.5">
                <Input type="number" min={0} step={f.step} value={v[f.key]} onChange={(e) => set(f.key, e.target.value)}
                  className="num h-8 w-[84px] border-line-strong text-right text-[15px] font-semibold" />
                <span className="w-8 font-mono text-[10.5px] text-ink-3">{f.unit}</span>
              </span>
            </label>
          ))}
        </div>
        <div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { l: "Horas recuperadas al día", x: `${num(hDay)} h` },
              { l: "Horas recuperadas al mes", x: `${num(hMonth, 0)} h` },
              { l: "Horas recuperadas al año", x: `${num(hYear, 0)} h` },
            ].map((k) => (
              <div key={k.l} className="rounded-md border border-line p-3">
                <div className="eyebrow">{k.l}</div>
                <div className="num mt-1 text-[26px] font-semibold leading-none text-ink">{k.x}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="brackets rounded-md border border-signal/30 bg-signal-soft/50 p-4">
              <div className="eyebrow text-signal">Capacidad equivalente</div>
              <div className="num mt-1 text-[38px] font-semibold leading-none text-ink">{num(fte, 1)} <span className="text-[16px] text-ink-2">personas</span></div>
              <div className="mt-1.5 text-[12px] text-ink-2">a jornada completa ({num(FTE_HOURS, 0)} h/año) que quedan libres para atender más clientes.</div>
            </div>
            <div className="rounded-md border border-line p-4">
              <div className="eyebrow">Valor anual de la capacidad recuperada</div>
              <div className="num mt-1 text-[38px] font-semibold leading-none text-ink">{eur0(value)}</div>
              <div className="mt-1.5 text-[12px] text-ink-2">Horas recuperadas × coste laboral por hora.</div>
              {aiYear != null && (
                <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-[12px] text-ink-2">
                  <span>Coste estimado de Kroomix al año</span>
                  <span className="flex items-center gap-2"><EstimateTag /><span className="num text-[14px] font-semibold text-ink">≈ {eur0(aiYear)}</span></span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 space-y-3 rounded-md border border-line p-4">
            <div className="eyebrow">Horas de trabajo al año</div>
            <Bar label="Sin Kroomix" value={manualYear} max={Math.max(manualYear, 1)} tone="ink" caption={`${num(manualYear, 0)} h`} />
            <Bar label="Con Kroomix" value={withYear} max={Math.max(manualYear, 1)} tone="ok" caption={`${num(withYear, 0)} h`} />
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-ink-3">
            Capacidad recuperada no es lo mismo que ahorro efectivo: el ahorro solo se materializa si esas horas se dedican a nuevos clientes,
            a trabajo de más valor o evitan una contratación. El coste de Kroomix es el de esta ejecución (convertido a euros con un tipo fijo) multiplicado
            por el volumen indicado; es una estimación y no incluye implantación, licencias ni revisión humana.
          </p>
        </div>
      </div>
    </section>
  )
}

export function FinalMessage() {
  return (
    <section className="relative overflow-hidden rounded-md bg-ink px-8 py-10 text-white" data-tour="final">
      <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "22px 22px" }} />
      <div className="absolute -right-20 -top-24 size-72 rounded-full bg-signal/30 blur-3xl" />
      <div className="relative">
        <div className="eyebrow text-white/50">Kroomix</div>
        <p className="mt-2 max-w-[880px] font-heading text-[34px] font-semibold leading-[1.1] tracking-[-0.025em]">
          Menos trabajo administrativo. <span className="text-[#7cc4ff]">Más capacidad para hacer crecer vuestro negocio.</span>
        </p>
      </div>
    </section>
  )
}
