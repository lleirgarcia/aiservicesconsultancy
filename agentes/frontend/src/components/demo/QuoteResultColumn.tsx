import { motion } from "framer-motion"
import { AlertTriangle, Calculator, Check, Download, EyeOff, FileText, ListChecks, MessageSquareQuote } from "lucide-react"

import { Button } from "@/components/ui/button"
import { withBase } from "@/lib/api"
import { eur, num, shortDate } from "@/lib/format"
import type { ViewState } from "@/state/view"

import { Column } from "./Column"
import { appear, Block, DraftCard } from "./ResultColumn"

const PLURAL: Record<string, string> = { mes: "meses", trimestre: "trimestres", año: "años", nómina: "nóminas", servicio: "servicios", declaración: "declaraciones" }
const unit = (u: string, q: number) => (q === 1 ? u : PLURAL[u] ?? u)
const ISSUE: Record<string, string> = {
  servicio_no_tarifado: "Servicio fuera del tarifario", dato_faltante: "Dato que falta", instruccion_sospechosa: "Instrucción sospechosa",
  cliente_nuevo: "Posible cliente nuevo", descuento_solicitado: "Descuento solicitado", margen_bajo: "Margen bajo",
}

/** Columna de resultado del agente de presupuestos: líneas, totales, documento, pendientes y correo. */
export function QuoteResultColumn({ view }: { view: ViewState }) {
  const lines = view.quote?.lines ?? view.quoteLines
  const totals = view.quote?.totals ?? view.quoteTotals
  const internal = view.quote?.internal ?? view.quoteInternal
  const empty = !view.caseInfo && !view.client
  const done = !!view.quote

  return (
    <Column index="03" eyebrow="Resultado" title="Presupuesto listo para revisar" subtitle="Tu equipo solo decide lo que aporta valor" tour="result">
      {empty ? (
        <div className="grid h-full min-h-[260px] place-items-center text-center">
          <div className="max-w-[260px]">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full border border-dashed border-line-strong"><Calculator className="size-4 text-ink-3" /></div>
            <p className="text-[14px] font-medium text-ink">El presupuesto aparecerá aquí</p>
            <p className="mt-1 text-[12.5px] text-ink-2">A medida que Kroomix trabaje, verás las líneas y los importes.</p>
          </div>
        </div>
      ) : (
        <>
          <motion.div {...appear} className="mb-4 rounded-md border border-line bg-[linear-gradient(135deg,#fff,#f6f9fd)] p-3.5">
            <div className="flex items-center justify-between">
              <span className="eyebrow">Presupuesto</span>
              {done ? (
                view.quote?.status === "listo_para_revision"
                  ? <span className="flex items-center gap-1 rounded-sm bg-ok-soft px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ok"><Check className="size-3" /> Listo para revisión</span>
                  : <span className="rounded-sm bg-warn-soft px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-warn">Falta información</span>
              ) : <span className="font-mono text-[10px] uppercase tracking-wider text-signal">En preparación</span>}
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span className="num text-[18px] font-semibold text-ink">{view.caseInfo?.case_id ?? "—"}</span>
              <span className="text-[12px] capitalize text-ink-2">{view.caseInfo?.period_label}</span>
            </div>
            <div className="mt-1.5 text-[12.5px] text-ink-2">
              {view.client
                ? <><span className="font-medium text-ink">{view.client.legal_name}</span> · NIF {view.client.tax_id}</>
                : <span className="font-medium text-warn">Posible cliente nuevo: sin identificar</span>}
            </div>
          </motion.div>

          {totals && (
            <motion.div {...appear} className="mb-4 rounded-md border border-line p-3.5" data-tour="total">
              <div className="flex items-end justify-between gap-2">
                <div>
                  <div className="eyebrow">Total del presupuesto (IVA incluido)</div>
                  <div className="num mt-1 text-[32px] font-semibold leading-none text-ink">{eur(totals.total)}</div>
                </div>
                {view.quote?.pdf_url && (
                  <a href={withBase(view.quote.pdf_url)} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline"><Download /> Ver PDF</Button>
                  </a>
                )}
              </div>
              <dl className="num mt-3 space-y-1 border-t border-line pt-2.5 text-[12px] text-ink-2">
                <div className="flex justify-between"><dt>Subtotal</dt><dd>{eur(totals.subtotal)}</dd></div>
                {totals.discount > 0 && <div className="flex justify-between text-ok"><dt>Descuento por volumen ({num(totals.discount_pct, 0)}%)</dt><dd>−{eur(totals.discount)}</dd></div>}
                <div className="flex justify-between"><dt>Base imponible</dt><dd>{eur(totals.base)}</dd></div>
                <div className="flex justify-between"><dt>IVA ({num(totals.vat_rate, 0)}%)</dt><dd>{eur(totals.vat)}</dd></div>
              </dl>
              {view.quote?.valid_until && <p className="mt-2 text-[11px] text-ink-3">Válido hasta el {shortDate(view.quote.valid_until)}</p>}
            </motion.div>
          )}

          {lines.length > 0 && (
            <Block title={`Servicios presupuestados (${lines.length})`} icon={FileText} tour="quote-lines">
              <ul className="divide-y divide-line rounded-md border border-line">
                {lines.map((l) => (
                  <motion.li key={l.service_id} {...appear} className="px-3 py-2" title={`Según la solicitud: «${l.source_text}»`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-medium text-ink">{l.name}</div>
                        <div className="num text-[11px] text-ink-3">{num(l.quantity, 0)} {unit(l.unit, l.quantity)} × {eur(l.unit_price)}</div>
                      </div>
                      <span className="num shrink-0 text-[13px] font-semibold text-ink">{eur(l.subtotal)}</span>
                    </div>
                    <div className="mt-1 flex items-start gap-1 text-[11px] italic leading-snug text-ink-3">
                      <MessageSquareQuote className="mt-0.5 size-3 shrink-0" /> «{l.source_text}»
                    </div>
                  </motion.li>
                ))}
              </ul>
            </Block>
          )}

          {view.incidents.length > 0 && (
            <Block title="Pendiente de decidir o completar" icon={AlertTriangle} tour="incidents">
              <div className="space-y-2">
                {view.incidents.map((i, n) => (
                  <motion.div key={n} {...appear} className="rounded-md border border-warn/35 bg-warn-soft/60 px-3 py-2.5">
                    <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink"><AlertTriangle className="size-3.5 text-warn" />{i.title}</div>
                    <p className="mt-0.5 text-[12px] leading-snug text-ink-2">{i.text}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-3">{ISSUE[i.type] ?? "Incidencia"} · {i.source}</p>
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
            <Block title="Solo para la gestoría" icon={EyeOff} aside={<span className="font-mono text-[10px] uppercase tracking-wider text-ink-3">No aparece en el correo ni en el PDF</span>}>
              <div className="grid grid-cols-3 gap-2 rounded-md border border-dashed border-line-strong bg-muted/40 p-3 text-center">
                <div><div className="num text-[16px] font-semibold text-ink">{num(internal.hours, 0)} h</div><div className="text-[10.5px] text-ink-3">trabajo estimado</div></div>
                <div><div className="num text-[16px] font-semibold text-ink">{eur(internal.cost)}</div><div className="text-[10.5px] text-ink-3">coste interno</div></div>
                <div><div className={`num text-[16px] font-semibold ${internal.below_min ? "text-warn" : "text-ok"}`}>{num(internal.margin_pct, 1)}%</div><div className="text-[10.5px] text-ink-3">margen (mín. {num(internal.min_margin_pct, 0)}%)</div></div>
              </div>
            </Block>
          )}
        </>
      )}
    </Column>
  )
}
