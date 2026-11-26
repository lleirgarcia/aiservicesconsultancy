import { motion } from "framer-motion"
import { AlertTriangle, Check, EyeOff, ListChecks, MessageSquareQuote, RefreshCw, ShieldAlert } from "lucide-react"

import { eur, num, shortDate } from "@/lib/format"
import type { RenewalPolicy } from "@/lib/types"
import type { ViewState } from "@/state/view"

import { Column } from "./Column"
import { appear, Block, DraftCard } from "./ResultColumn"

const FLAG: Record<string, string> = {
  subida_prima: "Subida de prima", cobertura_reducida: "Cobertura reducida", siniestralidad: "Siniestralidad alta", sin_oferta: "Sin oferta de renovación",
  dato_faltante: "Dato que falta", instruccion_sospechosa: "Instrucción sospechosa", cliente_nuevo: "Posible cliente nuevo", condicion_solicitada: "Condición que no consta en la oferta",
}
const RECO: Record<string, string> = { renovar: "Renovar", renegociar: "Renegociar", buscar_alternativas: "Buscar alternativas" }

function PolicyCard({ p }: { p: RenewalPolicy }) {
  const alert = p.flags.length > 0
  const date = shortDate(p.renewal_date)
  return (
    <motion.li {...appear} className={`rounded-md border px-3 py-2.5 ${alert ? "border-warn/40 bg-warn-soft/40" : "border-ok/30"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-ink">{p.product}</div>
          <div className="text-[11.5px] text-ink-3">{p.insurer} · {p.policy_number}</div>
        </div>
        <span className={`shrink-0 rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${alert ? "bg-warn-soft text-warn" : "bg-ok-soft text-ok"}`}>
          {RECO[p.recommendation]}
        </span>
      </div>
      <div className="num mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-ink-2">
        <span className={p.urgent ? "font-semibold text-warn" : ""}>Vence el {date} · {p.days_left} días{p.urgent ? " · urgente" : ""}</span>
        <span>
          {eur(p.current_premium)}
          {p.renewal_premium != null
            ? <> → <span className="font-medium text-ink">{eur(p.renewal_premium)}</span>{p.change_pct != null && <span className={p.change_pct > 10 ? " text-warn" : " text-ink-3"}> ({p.change_pct > 0 ? "+" : ""}{num(p.change_pct, 1)}%)</span>}</>
            : <span className="text-warn"> · sin oferta todavía</span>}
        </span>
      </div>
      {p.flags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {p.flags.map((f) => <span key={f} className="rounded-sm border border-warn/35 px-1.5 py-0.5 text-[10.5px] text-warn">{FLAG[f] ?? f}</span>)}
        </div>
      )}
      <div className="mt-1.5 flex items-start gap-1 text-[11px] italic leading-snug text-ink-3">
        <MessageSquareQuote className="mt-0.5 size-3 shrink-0" /> {p.rationale}
      </div>
    </motion.li>
  )
}

/** Columna de resultado del agente de renovaciones: pólizas revisadas, dinero en riesgo, alertas, correo y tareas. */
export function RenewalResultColumn({ view }: { view: ViewState }) {
  const policies = view.renewal?.policies ?? [...view.renewalPolicies].sort((a, b) => a.days_left - b.days_left)
  const totals = view.renewal?.totals ?? null
  const internal = view.renewal?.internal ?? null
  const empty = !view.caseInfo && !view.client
  const done = !!view.renewal
  const none = done && view.renewal?.status === "sin_vencimientos"

  return (
    <Column index="03" eyebrow="Resultado" title="Renovaciones listas para revisar" subtitle="Tu equipo solo decide lo que aporta valor" tour="result">
      {empty ? (
        <div className="grid h-full min-h-[260px] place-items-center text-center">
          <div className="max-w-[260px]">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full border border-dashed border-line-strong"><RefreshCw className="size-4 text-ink-3" /></div>
            <p className="text-[14px] font-medium text-ink">Las renovaciones aparecerán aquí</p>
            <p className="mt-1 text-[12.5px] text-ink-2">A medida que Kroomix trabaje, verás cada póliza y lo que hay en riesgo.</p>
          </div>
        </div>
      ) : (
        <>
          <motion.div {...appear} className="mb-4 rounded-md border border-line bg-[linear-gradient(135deg,#fff,#f6f9fd)] p-3.5">
            <div className="flex items-center justify-between">
              <span className="eyebrow">Revisión de renovaciones</span>
              {done ? (
                <span className="flex items-center gap-1 rounded-sm bg-ok-soft px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ok"><Check className="size-3" /> {none ? "Sin vencimientos" : "Listo para revisión"}</span>
              ) : <span className="font-mono text-[10px] uppercase tracking-wider text-signal">En preparación</span>}
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span className="num text-[18px] font-semibold text-ink">{view.caseInfo?.case_id ?? "—"}</span>
              <span className="text-[12px] capitalize text-ink-2">{view.caseInfo?.period_label}</span>
            </div>
            <div className="mt-1.5 text-[12.5px] text-ink-2">
              {view.client
                ? <><span className="font-medium text-ink">{view.client.legal_name}</span> · NIF {view.client.tax_id}</>
                : <span className="font-medium text-warn">Cliente sin identificar</span>}
            </div>
          </motion.div>

          {totals && (
            <motion.div {...appear} className="mb-4 rounded-md border border-line p-3.5" data-tour="total">
              <div className="eyebrow">Primas que vencen en los próximos 60 días</div>
              <div className="num mt-1 text-[32px] font-semibold leading-none text-ink">{eur(totals.premium_in_window)}</div>
              <dl className="num mt-3 space-y-1 border-t border-line pt-2.5 text-[12px] text-ink-2">
                <div className="flex justify-between"><dt>Pólizas revisadas</dt><dd>{totals.policies}</dd></div>
                <div className={`flex justify-between ${totals.at_risk_count ? "text-warn" : ""}`}><dt>Con alertas ({totals.at_risk_count})</dt><dd>{eur(totals.premium_at_risk)}</dd></div>
                <div className="flex justify-between"><dt>Urgentes (15 días o menos)</dt><dd>{totals.urgent_count}</dd></div>
              </dl>
              <p className="mt-2 text-[11px] text-ink-3">Importes de la cartera. Las alertas las calcula el sistema.</p>
            </motion.div>
          )}

          {none && (
            <div className="mb-4 rounded-md border border-line bg-muted/40 px-3 py-3 text-[12.5px] text-ink-2">
              Ninguna póliza de este cliente vence en los próximos 60 días. No hay nada que gestionar ahora.
            </div>
          )}

          {policies.length > 0 && (
            <Block title={`Pólizas revisadas (${policies.length})`} icon={ShieldAlert} tour="quote-lines">
              <ul className="space-y-2">{policies.map((p) => <PolicyCard key={p.policy_id} p={p} />)}</ul>
            </Block>
          )}

          {view.incidents.length > 0 && (
            <Block title="Alertas y pendientes" icon={AlertTriangle} tour="incidents">
              <div className="space-y-2">
                {view.incidents.map((i, n) => (
                  <motion.div key={n} {...appear} className="rounded-md border border-warn/35 bg-warn-soft/60 px-3 py-2.5">
                    <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink"><AlertTriangle className="size-3.5 text-warn" />{i.title}</div>
                    <p className="mt-0.5 text-[12px] leading-snug text-ink-2">{i.text}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-3">{FLAG[i.type] ?? "Incidencia"} · {i.source}</p>
                  </motion.div>
                ))}
              </div>
            </Block>
          )}

          {view.draft && <DraftCard draft={view.draft} />}

          {view.tasks.length > 0 && (
            <Block title="Pendiente de validación humana" icon={ListChecks} tour="tasks">
              <ul className="space-y-1.5">
                {view.tasks.map((t) => (
                  <motion.li key={t.task_id} {...appear} className="flex items-start gap-2 rounded-md border border-line px-3 py-2">
                    <span className="mt-0.5 size-3.5 shrink-0 rounded-[3px] border-[1.5px] border-line-strong" />
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-medium text-ink">{t.title}</div>
                      <div className="text-[11.5px] leading-snug text-ink-2">{t.reason}</div>
                    </div>
                    <span className={`ml-auto shrink-0 font-mono text-[9.5px] uppercase tracking-wider ${t.priority === "alta" ? "text-warn" : "text-ink-3"}`}>{t.priority}</span>
                  </motion.li>
                ))}
              </ul>
            </Block>
          )}

          {internal && (
            <Block title="Solo para la correduría" icon={EyeOff} aside={<span className="font-mono text-[10px] uppercase tracking-wider text-ink-3">No aparece en el correo</span>}>
              <div className="rounded-md border border-dashed border-line-strong bg-muted/40 p-3 text-center">
                <div className="num text-[16px] font-semibold text-ink">{eur(internal.commission)}</div>
                <div className="text-[10.5px] text-ink-3">comisión estimada de estas renovaciones</div>
              </div>
            </Block>
          )}
        </>
      )}
    </Column>
  )
}
