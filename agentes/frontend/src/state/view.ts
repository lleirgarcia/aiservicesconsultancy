/** Estado visible de la demo, derivado únicamente de los eventos reales del agente. */
import type {
  Activity, ActivityStatus, AuditInvoice, AuditResult, CaseDocument, CaseResult, DocStatus, DocSummary, Draft, Incident, KpiLabels, Metrics, QuoteInternal, QuoteLine,
  QuoteResult, QuoteTotals, RenewalPolicy, RenewalResult, ReviewTask, RunEvent,
} from "@/lib/types"

export interface Phase { id: string; label: string; status: ActivityStatus }

export interface ViewState {
  started: boolean
  phases: Phase[]
  activities: Activity[]
  docs: Record<string, { status: DocStatus; summary?: DocSummary }>
  metrics: Metrics
  client: { legal_name: string; tax_id: string; contact_name: string; sector: string } | null
  caseInfo: { case_id: string; period_label: string } | null
  documents: CaseDocument[]
  incidents: Incident[]
  tasks: ReviewTask[]
  draft: Draft | null
  summary: CaseResult | null
  // Agente de presupuestos
  quoteLines: QuoteLine[]
  quoteTotals: QuoteTotals | null
  quoteInternal: QuoteInternal | null
  quote: QuoteResult | null
  // Agente de renovaciones
  renewalPolicies: RenewalPolicy[]
  renewal: RenewalResult | null
  // Agente auditor de facturas
  auditInvoices: AuditInvoice[]
  audit: AuditResult | null
  kpiLabels: KpiLabels | null
  agentId: string
  finished: { status: string; error: string | null; duration_ms: number; ai_cost_eur: number | null } | null
  lastT: number
}

export const emptyMetrics: Metrics = { documents_processed: 0, documents_total: 0, incidents: 0, actions: 0, minutes_saved: 0 }

export const initialView: ViewState = {
  started: false, phases: [], activities: [], docs: {}, metrics: emptyMetrics, client: null, caseInfo: null,
  documents: [], incidents: [], tasks: [], draft: null, summary: null, finished: null, lastT: 0,
  quoteLines: [], quoteTotals: null, quoteInternal: null, quote: null, renewalPolicies: [], renewal: null, auditInvoices: [], audit: null, kpiLabels: null, agentId: "gestion-documental",
}

const rank: Record<ActivityStatus, number> = { pending: 0, done: 1, running: 2, review: 3, error: 4 }

function recomputePhases(phases: Phase[], activities: Activity[], finished: boolean): Phase[] {
  return phases.map((p) => {
    const acts = activities.filter((a) => a.phase === p.id)
    if (!acts.length) return { ...p, status: "pending" }
    if (acts.some((a) => a.status === "running") && !finished) return { ...p, status: "running" }
    const worst = acts.reduce<ActivityStatus>((w, a) => (a.status === "review" && rank.review > rank[w] ? "review" : w), "done")
    return { ...p, status: worst }
  })
}

export function applyEvent(s: ViewState, ev: RunEvent): ViewState {
  const p = ev.payload
  const next: ViewState = { ...s, lastT: ev.t_ms }
  switch (ev.type) {
    case "run_started":
      return {
        ...initialView, started: true, lastT: ev.t_ms, agentId: p.agent_id ?? "gestion-documental", kpiLabels: p.kpi_labels ?? null,
        phases: p.phases.map((x: { id: string; label: string }) => ({ ...x, status: "pending" })),
        metrics: { ...emptyMetrics, documents_total: p.documents_total },
      }
    case "activity_started": {
      const act: Activity = { id: p.id, phase: p.phase, label: p.label, status: "running", t_start: ev.t_ms, attachment_id: p.attachment_id }
      next.activities = [...s.activities, act]
      break
    }
    case "activity_finished": {
      next.activities = s.activities.map((a) =>
        a.id === p.id ? { ...a, status: p.status, label: p.label, detail: p.detail, t_end: ev.t_ms } : a)
      break
    }
    case "document_status": {
      const prev = s.docs[p.attachment_id]
      // Un estado final no retrocede por una comprobación posterior.
      if (prev && ["valid", "duplicate"].includes(prev.status) && ["reading", "checking", "extracting", "read", "extracted"].includes(p.status)) break
      if (prev?.status === "duplicate" && p.status === "extracted") break
      next.docs = { ...s.docs, [p.attachment_id]: { status: p.status, summary: p.summary ?? prev?.summary } }
      break
    }
    case "metrics":
      next.metrics = p
      break
    case "result": {
      const d = p.data
      if (p.kind === "client") next.client = d
      if (p.kind === "case") next.caseInfo = d
      if (p.kind === "document") next.documents = [...s.documents.filter((x) => x.attachment_id !== d.attachment_id), d]
      if (p.kind === "incident") {
        const key = `${d.type}:${d.attachment_id ?? d.title}`
        if (!s.incidents.some((i) => `${i.type}:${i.attachment_id ?? i.title}` === key)) next.incidents = [...s.incidents, d]
      }
      if (p.kind === "task") {
        if (!s.tasks.some((t) => t.task_id === d.task_id)) next.tasks = [...s.tasks, d]
      }
      if (p.kind === "draft") next.draft = d
      if (p.kind === "quote_line") next.quoteLines = [...s.quoteLines.filter((l) => l.service_id !== d.service_id), d]
      if (p.kind === "quote_totals") next.quoteTotals = d
      if (p.kind === "quote_internal") next.quoteInternal = d
      if (p.kind === "renewal_policy") next.renewalPolicies = [...s.renewalPolicies.filter((x) => x.policy_id !== d.policy_id), d]
      if (p.kind === "audit_invoice") next.auditInvoices = [...s.auditInvoices.filter((x) => x.invoice_id !== d.invoice_id), d]
      if (p.kind === "summary") { if (d.audit_id) next.audit = d; else if (d.renewal_id) next.renewal = d; else if (d.quote_id) next.quote = d; else next.summary = d }
      break
    }
    case "run_finished":
      next.finished = { status: p.status, error: p.error, duration_ms: p.duration_ms, ai_cost_eur: p.ai_cost_eur ?? null }
      if (p.case && p.case.audit_id) { if (!s.audit) next.audit = p.case }
      else if (p.case && p.case.renewal_id) { if (!s.renewal) next.renewal = p.case }
      else if (p.case && p.case.quote_id && !s.quote) next.quote = p.case
      else if (p.case && !p.case.quote_id && !s.summary) next.summary = p.case
      next.activities = s.activities.map((a) => (a.status === "running" ? { ...a, status: "error" } : a))
      break
  }
  next.phases = recomputePhases(next.phases, next.activities, !!next.finished)
  return next
}

/** Un evento "visible" marca un paso en la presentación guiada. */
export const isStepBoundary = (ev: RunEvent) => ev.type === "activity_finished" || ev.type === "run_finished"
