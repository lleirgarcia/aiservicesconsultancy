import { AlertTriangle, Check, Copy, Loader2, ScanLine } from "lucide-react"

import type { DocStatus } from "@/lib/types"

const MAP: Record<DocStatus, { label: string; cls: string; icon?: "spin" | "check" | "warn" | "copy" | "scan" }> = {
  pending: { label: "Sin procesar", cls: "bg-muted text-ink-3" },
  reading: { label: "Leyendo", cls: "bg-signal-soft text-signal", icon: "scan" },
  read: { label: "Leído", cls: "bg-signal-soft text-signal" },
  extracting: { label: "Extrayendo datos", cls: "bg-signal-soft text-signal", icon: "spin" },
  extracted: { label: "Datos extraídos", cls: "bg-signal-soft text-signal", icon: "check" },
  checking: { label: "Comprobando", cls: "bg-signal-soft text-signal", icon: "spin" },
  valid: { label: "Procesado", cls: "bg-ok-soft text-ok", icon: "check" },
  duplicate: { label: "Duplicado", cls: "bg-warn-soft text-warn", icon: "copy" },
  review: { label: "Revisar", cls: "bg-warn-soft text-warn", icon: "warn" },
  error: { label: "Error", cls: "bg-bad-soft text-bad", icon: "warn" },
}

export function StatusChip({ status }: { status: DocStatus }) {
  const s = MAP[status]
  const Icon = { spin: Loader2, check: Check, warn: AlertTriangle, copy: Copy, scan: ScanLine }[s.icon ?? "check"]
  return (
    <span className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider ${s.cls}`}>
      {s.icon && <Icon className={`size-3 ${s.icon === "spin" ? "animate-spin" : ""}`} />}
      {s.label}
    </span>
  )
}
