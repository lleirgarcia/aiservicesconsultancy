import { AnimatePresence, motion } from "framer-motion"
import { BookOpen, Download, FileImage, FileText, Mail, Paperclip, X } from "lucide-react"
import { useEffect, useState } from "react"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { api, withBase } from "@/lib/api"
import { dateTime, eur, kb } from "@/lib/format"
import type { Attachment, DocStatus, DocSummary, Scenario, SourceDoc, SourceInfo } from "@/lib/types"

import { Column } from "./Column"
import { StatusChip } from "./StatusChip"

const ACTIVE: DocStatus[] = ["reading", "extracting", "checking"]

function AttachmentRow({ att, status, summary, onOpen }: { att: Attachment; status: DocStatus; summary?: DocSummary; onOpen: () => void }) {
  const active = ACTIVE.includes(status)
  const done = status === "valid"
  const flagged = status === "duplicate" || status === "review"
  const isPdf = att.mime_type === "application/pdf"
  return (
    <motion.button
      layout
      onClick={onOpen}
      className={`group relative flex w-full items-center gap-3 rounded-md border bg-surface p-2 text-left transition-colors ${
        active ? "brackets border-signal/50 bg-signal-soft/40" : flagged ? "border-warn/40" : done ? "border-ok/30" : "border-line hover:border-line-strong"}`}
    >
      <div className="relative h-[58px] w-[46px] shrink-0 overflow-hidden rounded-[3px] border border-line bg-muted">
        <img src={withBase(att.preview_url)} alt="" className={`h-full w-full object-cover object-top transition ${done ? "" : flagged ? "" : ""}`} />
        {active && <div className="scan-beam" />}
        {done && <div className="absolute inset-0 bg-ok/10" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {isPdf ? <FileText className="size-3.5 shrink-0 text-ink-3" /> : <FileImage className="size-3.5 shrink-0 text-ink-3" />}
          <span className="truncate text-[13px] font-medium text-ink">{att.filename}</span>
        </div>
        <AnimatePresence mode="wait">
          {summary?.category_label ? (
            <motion.div key="sum" initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} className="mt-0.5 truncate text-[12px] text-ink-2">
              {summary.category_label} · <span className="num text-ink">{eur(summary.total_amount)}</span>
            </motion.div>
          ) : (
            <motion.div key="meta" className="mt-0.5 font-mono text-[11px] text-ink-3">
              {isPdf ? "PDF" : "JPG"} · {kb(att.size_bytes)}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="mt-1"><StatusChip status={status} /></div>
      </div>
    </motion.button>
  )
}

/** Visor de un documento de apoyo: tablas y fichas legibles, con descarga en PDF. */
function SourceViewer({ scenario, source, onClose }: { scenario: Scenario; source: SourceInfo | null; onClose: () => void }) {
  const [doc, setDoc] = useState<SourceDoc | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    setDoc(null); setError(false)
    if (source) api.source(scenario.agent_id, scenario.email.id, source.id).then(setDoc).catch(() => setError(true))
  }, [source, scenario.agent_id, scenario.email.id])
  const pdf = source ? withBase(`/api/sources/${encodeURIComponent(source.id)}/pdf?agent_id=${encodeURIComponent(scenario.agent_id)}&email_id=${encodeURIComponent(scenario.email.id)}`) : "#"
  return (
    <Dialog open={!!source} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-[860px] overflow-hidden p-0 sm:max-w-[860px]" showCloseButton={false}>
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
          <div className="min-w-0">
            <DialogTitle className="truncate text-[15px] font-semibold">{source?.title}</DialogTitle>
            <p className="truncate text-[12px] text-ink-3">{source?.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <a href={pdf} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[12px] font-medium text-signal hover:underline"><Download className="size-3.5" /> PDF</a>
            <button onClick={onClose} className="text-ink-3 hover:text-ink" aria-label="Cerrar"><X className="size-4" /></button>
          </div>
        </div>
        <div className="thin-scroll max-h-[78vh] space-y-5 overflow-auto bg-muted/50 p-5">
          {error && <p className="text-[13px] text-bad">No se ha podido cargar el documento.</p>}
          {!doc && !error && <div className="h-24 animate-pulse rounded-md bg-muted" />}
          {doc?.sections.map((s, i) => (
            <div key={i} className="rounded-md border border-line bg-surface p-4">
              {s.heading && <div className="eyebrow mb-2">{s.heading}</div>}
              {s.fields && (
                <dl className="divide-y divide-line text-[13px]">
                  {s.fields.map(([k, v]) => <div key={k} className="grid grid-cols-[170px_1fr] gap-3 py-1.5"><dt className="text-ink-3">{k}</dt><dd className="text-ink">{v}</dd></div>)}
                </dl>
              )}
              {s.table && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[12.5px]">
                    <thead><tr className="border-b border-line-strong text-left">{s.table.columns.map((c, j) => <th key={j} className={`px-2 py-1.5 font-medium text-ink-3 ${s.table?.align?.[j] === "r" ? "text-right" : ""}`}>{c}</th>)}</tr></thead>
                    <tbody>{s.table.rows.map((r, k) => <tr key={k} className="border-b border-line align-top">{r.map((v, j) => <td key={j} className={`num px-2 py-1.5 text-ink ${s.table?.align?.[j] === "r" ? "text-right" : ""}`}>{v}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              )}
              {s.note && <p className="mt-2 text-[12px] italic text-ink-2">{s.note}</p>}
            </div>
          ))}
          <p className="text-center text-[11px] text-ink-3">Documento ficticio de demostración.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Información que el agente consulta además de la petición, agrupada y consultable. */
function SourcesPanel({ scenario, onOpen }: { scenario: Scenario; onOpen: (s: SourceInfo) => void }) {
  const groups = scenario.sources.reduce<Record<string, SourceInfo[]>>((acc, s) => ({ ...acc, [s.group]: [...(acc[s.group] ?? []), s] }), {})
  return (
    <div className="mt-5" data-tour="sources">
      <div className="mb-2 flex items-center justify-between">
        <span className="eyebrow flex items-center gap-1.5"><BookOpen className="size-3" /> Información que consulta Kroomix</span>
      </div>
      <p className="mb-2 text-[11.5px] leading-snug text-ink-3">Además de la petición, el agente trabaja con estos documentos. Púlsalos para verlos.</p>
      <div className="space-y-3">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            <div className="mb-1 text-[11px] font-medium text-ink-2">{group}</div>
            <ul className="divide-y divide-line overflow-hidden rounded-md border border-line bg-surface">
              {items.map((s) => (
                <li key={s.id}>
                  <button onClick={() => onOpen(s)} className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-muted/60">
                    <FileText className="size-3.5 shrink-0 text-ink-3" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium text-ink">{s.title}</span>
                      <span className="block truncate text-[11px] text-ink-3">{s.subtitle}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

export function InboxColumn({ scenario, docs }: { scenario: Scenario | null; docs: Record<string, { status: DocStatus; summary?: DocSummary }> }) {
  const [open, setOpen] = useState<Attachment | null>(null)
  const [source, setSource] = useState<SourceInfo | null>(null)
  return (
    <Column index="01" eyebrow="Entrada" title="El trabajo que recibís" subtitle={scenario && scenario.attachments.length === 0 ? "Solicitudes que llegan de vuestros clientes" : "Documentación enviada por vuestros clientes"} tour="inbox">
      {!scenario ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-md bg-muted" />)}</div>
      ) : (
        <>
          <article className="rounded-md border border-line bg-surface">
            <div className="flex items-center gap-3 border-b border-line px-3.5 py-3">
              <div className="grid size-9 place-items-center rounded-full bg-ink text-[13px] font-semibold text-white">
                {scenario.email.from_name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-semibold text-ink">{scenario.email.from_name}</div>
                <div className="truncate font-mono text-[11px] text-ink-3">{scenario.email.from_address}</div>
              </div>
              <Mail className="size-4 text-ink-3" />
            </div>
            <div className="space-y-2 px-3.5 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="eyebrow">Asunto</span>
                <span className="font-mono text-[10.5px] text-ink-3">{dateTime(scenario.email.received_at)}</span>
              </div>
              <div className="text-[14px] font-semibold text-ink">{scenario.email.subject}</div>
              <p className="whitespace-pre-line text-[13px] leading-relaxed text-ink-2">{scenario.email.body}</p>
            </div>
          </article>

          {scenario.attachments.length > 0 && (
            <>
              <div className="mb-2 mt-5 flex items-center justify-between">
                <span className="eyebrow flex items-center gap-1.5"><Paperclip className="size-3" /> {scenario.attachments.length} adjuntos</span>
              </div>
              <div className="space-y-2" data-tour="attachments">
                {scenario.attachments.map((a) => (
                  <AttachmentRow key={a.id} att={a} status={docs[a.id]?.status ?? "pending"} summary={docs[a.id]?.summary} onOpen={() => setOpen(a)} />
                ))}
              </div>
            </>
          )}

          {scenario.sources?.length > 0 && <SourcesPanel scenario={scenario} onOpen={setSource} />}
        </>
      )}
      {scenario && <SourceViewer scenario={scenario} source={source} onClose={() => setSource(null)} />}
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[92vh] max-w-[760px] overflow-hidden p-0 sm:max-w-[760px]" showCloseButton={false}>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <DialogTitle className="text-[14px] font-medium">{open?.filename}</DialogTitle>
            <button onClick={() => setOpen(null)} className="text-ink-3 hover:text-ink" aria-label="Cerrar"><X className="size-4" /></button>
          </div>
          <div className="thin-scroll max-h-[80vh] overflow-auto bg-muted p-4">
            {open && <img src={withBase(open.preview_url)} alt={open.filename} className="mx-auto w-full rounded-sm shadow-sm" />}
          </div>
        </DialogContent>
      </Dialog>
    </Column>
  )
}
