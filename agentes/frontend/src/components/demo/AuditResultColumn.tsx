import { motion } from "framer-motion"
import { AlertTriangle, Check, ListChecks, MessageSquareQuote, ReceiptText, SearchCheck } from "lucide-react"

import { eur, shortDate } from "@/lib/format"
import type { AuditInvoice } from "@/lib/types"
import type { ViewState } from "@/state/view"

import { Column } from "./Column"
import { appear, Block, DraftCard } from "./ResultColumn"

const KIND: Record<string, string> = {
  duplicada: "Factura duplicada", sin_pedido: "Sin pedido", concepto_no_pedido: "Concepto no pedido", precio_distinto: "Precio superior al pedido",
  cantidad_no_entregada: "Cantidad no entregada", error_aritmetico: "Error de cálculo", dato_faltante: "Dato que falta",
  instruccion_sospechosa: "Instrucción sospechosa", cliente_nuevo: "Posible cliente nuevo", proveedor_desconocido: "Proveedor no identificado",
}
const FROM_INVOICE = ["duplicada", "sin_pedido", "concepto_no_pedido", "precio_distinto", "cantidad_no_entregada", "error_aritmetico"]
const ACTION: Record<string, string> = { pagar: "Pagar", retener_pago: "Retener el pago", reclamar_proveedor: "Reclamar al proveedor" }

function InvoiceCard({ inv }: { inv: AuditInvoice }) {
  const alert = inv.findings.length > 0
  return (
    <motion.li {...appear} className={`rounded-md border px-3 py-2.5 ${alert ? "border-warn/40 bg-warn-soft/40" : "border-ok/30"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="num text-[13px] font-semibold text-ink">{inv.number}</div>
          <div className="num text-[11.5px] text-ink-3">{shortDate(inv.date)} · {eur(inv.base)} + IVA{inv.order_ref ? ` · pedido ${inv.order_ref}` : " · sin pedido"}</div>
        </div>
        <span className={`shrink-0 rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${alert ? "bg-warn-soft text-warn" : "bg-ok-soft text-ok"}`}>
          {ACTION[inv.action]}
        </span>
      </div>
      {alert ? (
        <ul className="mt-2 space-y-1">
          {inv.findings.map((f, i) => (
            <li key={i} className="flex items-start justify-between gap-3 text-[12px] leading-snug">
              <span className="text-ink-2"><span className="font-medium text-warn">{KIND[f.kind]}.</span> {f.detail}</span>
              <span className="num shrink-0 font-semibold text-warn">{eur(f.amount)}</span>
            </li>
          ))}
        </ul>
      ) : <p className="mt-1.5 flex items-center gap-1 text-[12px] text-ok"><Check className="size-3" /> Cuadra con el pedido y el albarán</p>}
      <div className="mt-1.5 flex items-start gap-1 text-[11px] italic leading-snug text-ink-3">
        <MessageSquareQuote className="mt-0.5 size-3 shrink-0" /> {inv.rationale}
      </div>
    </motion.li>
  )
}

/** Columna de resultado del agente auditor: dinero en riesgo, facturas cruzadas, correo y tareas. */
export function AuditResultColumn({ view }: { view: ViewState }) {
  const invoices = view.audit?.invoices ?? [...view.auditInvoices].sort((a, b) => a.date.localeCompare(b.date))
  const totals = view.audit?.totals ?? null
  const empty = !view.caseInfo && !view.client
  const done = !!view.audit
  const others = view.incidents.filter((i) => !FROM_INVOICE.includes(i.type)) // las anomalías de factura ya se ven en su tarjeta

  return (
    <Column index="03" eyebrow="Resultado" title="Auditoría lista para revisar" subtitle="Tu equipo solo decide lo que aporta valor" tour="result">
      {empty ? (
        <div className="grid h-full min-h-[260px] place-items-center text-center">
          <div className="max-w-[260px]">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full border border-dashed border-line-strong"><SearchCheck className="size-4 text-ink-3" /></div>
            <p className="text-[14px] font-medium text-ink">La auditoría aparecerá aquí</p>
            <p className="mt-1 text-[12.5px] text-ink-2">A medida que Kroomix cruce las facturas, verás las anomalías y el dinero afectado.</p>
          </div>
        </div>
      ) : (
        <>
          <motion.div {...appear} className="mb-4 rounded-md border border-line bg-[linear-gradient(135deg,#fff,#f6f9fd)] p-3.5">
            <div className="flex items-center justify-between">
              <span className="eyebrow">Auditoría de facturas</span>
              {done ? <span className="flex items-center gap-1 rounded-sm bg-ok-soft px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ok"><Check className="size-3" /> Listo para revisión</span>
                : <span className="font-mono text-[10px] uppercase tracking-wider text-signal">En preparación</span>}
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span className="num text-[18px] font-semibold text-ink">{view.caseInfo?.case_id ?? "—"}</span>
              <span className="text-[12px] capitalize text-ink-2">{view.caseInfo?.period_label}</span>
            </div>
            <div className="mt-1.5 text-[12.5px] text-ink-2">
              {view.client ? <><span className="font-medium text-ink">{view.client.legal_name}</span> · NIF {view.client.tax_id}</> : <span className="font-medium text-warn">Cliente sin identificar</span>}
              {view.audit?.supplier && <div className="text-ink-3">Proveedor: {view.audit.supplier.name}</div>}
            </div>
          </motion.div>

          {totals && (
            <motion.div {...appear} className="mb-4 rounded-md border border-line p-3.5" data-tour="total">
              <div className="eyebrow">Importe afectado por anomalías (sin IVA)</div>
              <div className={`num mt-1 text-[32px] font-semibold leading-none ${totals.at_risk_base > 0 ? "text-warn" : "text-ok"}`}>{eur(totals.at_risk_base)}</div>
              <dl className="num mt-3 space-y-1 border-t border-line pt-2.5 text-[12px] text-ink-2">
                <div className="flex justify-between"><dt>Facturas auditadas</dt><dd>{totals.invoices} · {eur(totals.invoiced_base)}</dd></div>
                <div className="flex justify-between"><dt>Con anomalías</dt><dd>{totals.with_findings}</dd></div>
                <div className="flex justify-between"><dt>Correctas</dt><dd>{totals.clean}</dd></div>
                {totals.at_risk_base > 0 && <div className="flex justify-between"><dt>Con IVA incluido</dt><dd>{eur(totals.at_risk_total)}</dd></div>}
              </dl>
              <p className="mt-2 text-[11px] text-ink-3">El cruce y los importes los calcula el sistema.</p>
            </motion.div>
          )}

          {invoices.length > 0 && (
            <Block title={`Facturas auditadas (${invoices.length})`} icon={ReceiptText} tour="quote-lines">
              <ul className="space-y-2">{invoices.map((i) => <InvoiceCard key={i.invoice_id} inv={i} />)}</ul>
            </Block>
          )}

          {others.length > 0 && (
            <Block title="Otros pendientes" icon={AlertTriangle} tour="incidents">
              <div className="space-y-2">
                {others.map((i, n) => (
                  <motion.div key={n} {...appear} className="rounded-md border border-warn/35 bg-warn-soft/60 px-3 py-2.5">
                    <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink"><AlertTriangle className="size-3.5 text-warn" />{i.title}</div>
                    <p className="mt-0.5 text-[12px] leading-snug text-ink-2">{i.text}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-3">{KIND[i.type] ?? "Incidencia"} · {i.source}</p>
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
        </>
      )}
    </Column>
  )
}
