import { AnimatePresence, motion } from "framer-motion"
import { AlertTriangle, Check, Copy, FolderOpen, ListChecks, Mail, Pencil, ShieldCheck, X } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"
import { eur, shortDate } from "@/lib/format"
import type { Draft } from "@/lib/types"
import type { ViewState } from "@/state/view"

import { Column } from "./Column"

export const appear = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } }

export function Block({ title, icon: Icon, children, tour, aside }: { title: string; icon: typeof Check; children: React.ReactNode; tour?: string; aside?: React.ReactNode }) {
  return (
    <motion.section {...appear} className="mb-4" data-tour={tour}>
      <div className="mb-2 flex items-center justify-between">
        <span className="eyebrow flex items-center gap-1.5"><Icon className="size-3" /> {title}</span>
        {aside}
      </div>
      {children}
    </motion.section>
  )
}

export function ResultColumn({ view }: { view: ViewState }) {
  const valid = view.documents.filter((d) => d.status === "valid")
  const total = view.summary?.totals.total ?? valid.reduce((s, d) => s + (d.total_amount ?? 0), 0)
  const finalTotal = !!view.summary
  const empty = !view.caseInfo && !view.client

  return (
    <Column index="03" eyebrow="Resultado" title="Trabajo listo para revisar" subtitle="Tu equipo solo interviene donde aporta valor" tour="result">
      {empty ? (
        <div className="grid h-full min-h-[260px] place-items-center text-center">
          <div className="max-w-[260px]">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full border border-dashed border-line-strong">
              <FolderOpen className="size-4 text-ink-3" />
            </div>
            <p className="text-[14px] font-medium text-ink">El expediente aparecerá aquí</p>
            <p className="mt-1 text-[12.5px] text-ink-2">A medida que Kroomix trabaje, verás los resultados parciales.</p>
          </div>
        </div>
      ) : (
        <>
          <motion.div {...appear} className="mb-4 rounded-md border border-line bg-[linear-gradient(135deg,#fff,#f6f9fd)] p-3.5">
            <div className="flex items-center justify-between">
              <span className="eyebrow">Expediente</span>
              {view.summary ? (
                <span className="flex items-center gap-1 rounded-sm bg-ok-soft px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ok"><Check className="size-3" /> Listo para revisión</span>
              ) : (
                <span className="font-mono text-[10px] uppercase tracking-wider text-signal">En preparación</span>
              )}
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span className="num text-[18px] font-semibold text-ink">{view.caseInfo?.case_id ?? "—"}</span>
              <span className="text-[12px] capitalize text-ink-2">{view.caseInfo?.period_label}</span>
            </div>
            {view.client && (
              <div className="mt-1.5 text-[12.5px] text-ink-2">
                <span className="font-medium text-ink">{view.client.legal_name}</span> · NIF {view.client.tax_id}
              </div>
            )}
          </motion.div>

          {(valid.length > 0 || finalTotal) && (
            <motion.div {...appear} className="mb-4 grid grid-cols-[1fr_auto] items-end gap-2 rounded-md border border-line p-3.5" data-tour="total">
              <div>
                <div className="eyebrow">Importe de facturas válidas</div>
                <div className="num mt-1 text-[30px] font-semibold leading-none text-ink">{eur(total)}</div>
                {view.summary && (
                  <div className="num mt-1.5 text-[11.5px] text-ink-2">
                    Base {eur(view.summary.totals.base)} · IVA {eur(view.summary.totals.vat)}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="num text-[22px] font-semibold leading-none text-ok">{valid.length}</div>
                <div className="text-[11px] text-ink-2">válidas</div>
              </div>
            </motion.div>
          )}

          {view.incidents.length > 0 && (
            <Block title="Incidencias detectadas" icon={AlertTriangle} tour="incidents">
              <div className="space-y-2">
                {view.incidents.map((i, n) => (
                  <motion.div key={n} {...appear} className="rounded-md border border-warn/35 bg-warn-soft/60 px-3 py-2.5" data-tour={`incident-${n}`}>
                    <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                      {i.type === "duplicado" ? <Copy className="size-3.5 text-warn" /> : <AlertTriangle className="size-3.5 text-warn" />}
                      {i.title}
                    </div>
                    <p className="mt-0.5 text-[12px] leading-snug text-ink-2">{i.text}</p>
                    {i.source && <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-3">Fuente: {i.source}</p>}
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
          {view.documents.length > 0 && (
            <Block title="Documentación organizada" icon={FolderOpen}>
              <ul className="divide-y divide-line rounded-md border border-line">
                <AnimatePresence initial={false}>
                  {view.documents.map((d) => (
                    <motion.li key={d.attachment_id} {...appear} title={`${d.folder} · origen «${d.filename}»`}
                      className="flex items-center gap-2 px-3 py-1.5">
                      {d.status === "valid" ? <Check className="size-3.5 shrink-0 text-ok" /> : d.status === "duplicate" ? <Copy className="size-3.5 shrink-0 text-warn" /> : <AlertTriangle className="size-3.5 shrink-0 text-warn" />}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12.5px] text-ink">
                          <span className="font-medium">{d.category_label}</span>
                          <span className="text-ink-2"> · {d.issuer_name}</span>
                        </div>
                        <div className="truncate font-mono text-[10.5px] text-ink-3">
                          {d.invoice_number} · {shortDate(d.issue_date)} · {d.status === "duplicate" ? "Duplicados" : d.status === "valid" ? d.folder.split("/").pop() : "Pendiente de revisión"}
                        </div>
                      </div>
                      <span className={`num shrink-0 text-[12.5px] ${d.status === "valid" ? "text-ink" : "text-ink-3 line-through"}`}>{eur(d.total_amount)}</span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </Block>
          )}
        </>
      )}
    </Column>
  )
}

export function DraftCard({ draft }: { draft: Draft }) {
  const [d, setD] = useState(draft)
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState(draft.body)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => { setD(draft); setBody(draft.body) }, [draft])

  const act = async (fn: () => Promise<Draft>) => {
    setBusy(true); setErr(null)
    try { setD(await fn()); setEditing(false) } catch (e) { setErr(e instanceof Error ? e.message : "Error") } finally { setBusy(false) }
  }
  const closed = d.status === "aprobado" || d.status === "rechazado"

  return (
    <Block title="Correo preparado" icon={Mail} tour="draft"
      aside={<span className="font-mono text-[10px] uppercase tracking-wider text-ink-3">No se envía sin aprobación</span>}>
      <div className={`rounded-md border p-3.5 ${d.status === "aprobado" ? "border-ok/40 bg-ok-soft/50" : d.status === "rechazado" ? "border-line bg-muted/50" : "brackets border-signal/35 bg-surface shadow-[0_10px_30px_-20px_rgba(10,124,240,.6)]"}`}>
        <div className="mb-2 space-y-0.5 text-[12px] text-ink-2">
          <div><span className="text-ink-3">Para:</span> {d.to_address}</div>
          <div><span className="text-ink-3">Asunto:</span> <span className="font-medium text-ink">{d.subject}</span></div>
        </div>
        {editing ? (
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[180px] text-[13px] leading-relaxed" />
        ) : (
          <p className="whitespace-pre-line text-[13px] leading-relaxed text-ink">{d.body}</p>
        )}
        <div className="mt-3 flex items-center gap-2">
          {closed ? (
            <span className={`flex items-center gap-1.5 text-[12.5px] font-medium ${d.status === "aprobado" ? "text-ok" : "text-ink-2"}`}>
              {d.status === "aprobado" ? <ShieldCheck className="size-4" /> : <X className="size-4" />}
              {d.status === "aprobado" ? "Aprobado y registrado. En esta demo no se envía ningún correo." : "Rechazado y registrado."}
            </span>
          ) : editing ? (
            <>
              <Button size="sm" disabled={busy} onClick={() => act(() => api.editDraft(d.id, d.subject, body))}>Guardar cambios</Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setBody(d.body) }}>Cancelar</Button>
            </>
          ) : (
            <>
              <Button size="sm" disabled={busy} onClick={() => act(() => api.approveDraft(d.id))} className="bg-ok text-white hover:bg-ok/90">
                <Check /> Aprobar
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => setEditing(true)}><Pencil /> Editar</Button>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => act(() => api.rejectDraft(d.id))} className="text-ink-2"><X /> Rechazar</Button>
              {d.status === "editado" && <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-ink-3">Editado</span>}
            </>
          )}
        </div>
        {err && <p className="mt-2 text-[12px] text-bad">{err}</p>}
      </div>
    </Block>
  )
}
