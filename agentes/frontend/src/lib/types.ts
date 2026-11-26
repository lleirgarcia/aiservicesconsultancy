export type ActivityStatus = "pending" | "running" | "done" | "review" | "error"

export type DocStatus =
  | "pending" | "reading" | "read" | "extracting" | "extracted" | "checking"
  | "valid" | "duplicate" | "review" | "error"

export interface Attachment {
  id: string
  position: number
  filename: string
  mime_type: string
  size_bytes: number
  pages: number
  preview_url: string
  original_url: string
}

export interface SourceInfo { id: string; title: string; subtitle: string; group: string }
export interface SourceSection {
  heading?: string
  fields?: [string, string][]
  table?: { columns: string[]; rows: string[][]; align?: ("l" | "r")[] }
  note?: string
}
export interface SourceDoc extends SourceInfo { sections: SourceSection[] }

export interface Scenario {
  agent_id: string
  firm: { name: string; city: string }
  email: {
    id: string; from_name: string; from_address: string; to_address: string
    subject: string; body: string; received_at: string; period: string
  }
  attachments: Attachment[]
  sources: SourceInfo[]
  assumptions: { manual_minutes: number; review_minutes: number }
  latest_recorded_run: { id: string; started_at: string; duration_ms: number; model: string } | null
}

export interface RunEvent {
  seq: number
  t_ms: number
  type: string
  payload: any // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface Activity {
  id: string
  phase: string
  label: string
  detail?: string | null
  status: ActivityStatus
  t_start: number
  t_end?: number
  attachment_id?: string | null
}

export interface DocSummary {
  category_label?: string | null
  issuer_name?: string | null
  invoice_number?: string | null
  issue_date?: string | null
  total_amount?: number | null
  valid?: boolean
}

export interface CaseDocument {
  attachment_id: string
  filename: string
  status: "valid" | "duplicate" | "needs_review"
  category_label?: string | null
  folder: string
  issuer_name?: string | null
  issuer_tax_id?: string | null
  invoice_number?: string | null
  issue_date?: string | null
  base_amount?: number | null
  vat_amount?: number | null
  total_amount?: number | null
}

export interface Incident {
  type: string // duplicado | pendiente | revision | servicio_no_tarifado | dato_faltante | instruccion_sospechosa | cliente_nuevo | descuento_solicitado | margen_bajo
  title: string
  text: string
  source?: string
  attachment_id?: string
}

export interface ReviewTask {
  task_id: string
  title: string
  reason: string
  priority: "alta" | "media" | "baja"
  attachment_id?: string | null
}

export interface Draft {
  id: string
  to_address: string
  subject: string
  body: string
  status: "borrador" | "editado" | "aprobado" | "rechazado"
}

export interface CaseResult {
  case_id: string
  period: string
  client: { legal_name: string; tax_id: string } | null
  documents: Array<CaseDocument & { status: string }>
  received_count: number
  valid_count: number
  duplicate_count: number
  review_count: number
  totals: { base: number; vat: number; withholding: number; total: number }
  incidents: unknown[]
  review_tasks: unknown[]
  email_draft: Draft | null
  summary: string | null
}

export interface KpiLabels { processed: string; incidents: string; actions: string; time: string }

export interface Metrics {
  documents_processed: number
  documents_total: number
  incidents: number
  actions: number
  minutes_saved: number
}

export interface Agent {
  id: string
  name: string
  summary: string
  pain: string
  input_description: string
  workflow: string
  output_description: string
  example_requests: string[]
  verticals: Record<string, "principal" | "secundario">
  status: "disponible" | "proximamente"
  icon: string
  default_scenario: string | null
  impact: AgentImpact | null
}

export interface AgentImpact {
  unit_singular: string
  unit_plural: string
  manual_steps: string[]
  agent_steps: string[]
  kpi_processed: string
}

export interface QuoteLine {
  service_id: string
  name: string
  kind: "recurrente" | "puntual"
  unit: string
  quantity: number
  unit_price: number
  subtotal: number
  source_text: string
}

export interface QuoteTotals {
  recurring_subtotal: number; one_off_subtotal: number; subtotal: number
  discount: number; discount_pct: number; base: number; vat_rate: number; vat: number; total: number
}

export interface QuoteInternal { hours: number; cost: number; margin: number; margin_pct: number; min_margin_pct: number; below_min: boolean }

export interface QuoteResult {
  quote_id: string
  period: string
  client: { legal_name: string; tax_id: string } | null
  requester: { name: string; email: string }
  lines: QuoteLine[]
  totals: QuoteTotals | null
  internal: QuoteInternal | null
  valid_until: string
  incidents: unknown[]
  review_tasks: unknown[]
  email_draft: Draft | null
  pdf_url: string | null
  summary: string | null
  status: "listo_para_revision" | "pendiente_de_informacion"
}

export interface RenewalPolicy {
  policy_id: string
  insurer: string
  product: string
  policy_number: string
  renewal_date: string
  days_left: number
  urgent: boolean
  current_premium: number
  renewal_premium: number | null
  change_pct: number | null
  flags: string[]
  recommendation: "renovar" | "renegociar" | "buscar_alternativas"
  rationale: string
  renewal_notes: string | null
}

export interface RenewalTotals {
  policies: number; premium_in_window: number; premium_at_risk: number; at_risk_count: number; urgent_count: number; renewal_premium_total: number
}

export interface RenewalResult {
  renewal_id: string
  period: string
  today: string
  client: { legal_name: string; tax_id: string; contact_name: string } | null
  policies: RenewalPolicy[]
  totals: RenewalTotals | null
  internal: { commission: number } | null
  incidents: unknown[]
  review_tasks: unknown[]
  email_draft: Draft | null
  summary: string | null
  status: "listo_para_revision" | "sin_vencimientos"
}

export interface AuditFinding { kind: string; item_code: string; description: string; amount: number; detail: string }

export interface AuditInvoice {
  invoice_id: string
  number: string
  date: string
  base: number
  total: number
  order_ref: string | null
  findings: AuditFinding[]
  action: "pagar" | "retener_pago" | "reclamar_proveedor"
  rationale: string
}

export interface AuditTotals {
  invoices: number; invoiced_base: number; with_findings: number; clean: number
  at_risk_base: number; at_risk_vat: number; at_risk_total: number; by_kind: Record<string, number>
}

export interface AuditResult {
  audit_id: string
  period: string
  client: { legal_name: string; tax_id: string; contact_name: string } | null
  supplier: { name: string; tax_id: string } | null
  invoices: AuditInvoice[]
  totals: AuditTotals | null
  incidents: unknown[]
  review_tasks: unknown[]
  email_draft: Draft | null
  summary: string | null
  status: "listo_para_revision" | "sin_facturas"
}

export interface InboxItem {
  email_id: string
  status: "pendiente" | "lanzado" | "respondido" | "ignorado" | "error"
  agent_id: string | null
  run_id: string | null
  note: string | null
  from_name: string
  from_address: string
  subject: string
  received_at: string
  attachments: number
}
export interface InboxState { enabled: boolean; alias: string | null; items: InboxItem[] }

export interface ChatResponse {
  action: "launched" | "answered"
  reply: string
  agent_id: string | null
  run_id: string | null
  events_url: string | null
}
