import { ArrowLeft, Compass, Play, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Player } from "@/state/useRunPlayer"

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
        <rect x="0.75" y="0.75" width="24.5" height="24.5" rx="3" fill="var(--ink)" />
        <path d="M8 6.5v13M8 13l7.5-6.5M10.6 10.8 17.5 19.5" stroke="#fff" strokeWidth="2.1" strokeLinecap="square" fill="none" />
        <circle cx="19.2" cy="6.8" r="1.7" fill="var(--signal)" />
      </svg>
      <span className="font-heading text-[19px] font-semibold tracking-[-0.03em] text-ink">Kroomix</span>
    </div>
  )
}

interface Props {
  player: Player
  title: string
  subtitle: string
  onBack?: () => void // solo en el espacio de trabajo de un agente
  onStart: () => void
  onReset: () => void
  onGuide: () => void
}

export function Header({ player, title, subtitle, onBack, onStart, onReset, onGuide }: Props) {
  const busy = player.mode === "starting" || player.running
  const hasRun = player.mode !== "idle"
  return (
    <header className="flex items-center justify-between gap-6">
      <div className="flex items-center gap-5">
        <div>
          <h1 className="text-[17px] font-semibold leading-tight text-ink">{title}</h1>
          <p className="text-[13px] text-ink-2">{subtitle}</p>
        </div>
      </div>
      {onBack && (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="lg" onClick={onBack} className="text-ink-2"><ArrowLeft /> Todos los agentes</Button>
          <Button variant="ghost" size="lg" onClick={onGuide} className="text-ink-2" data-tour="guide-button">
            <Compass /> Guía
          </Button>
          <Button variant="outline" size="lg" onClick={onReset} disabled={!hasRun || player.mode === "starting"} className="bg-surface">
            <RotateCcw /> Reiniciar
          </Button>
          <Button size="lg" onClick={onStart} disabled={busy} data-tour="run-button"
            className="h-10 rounded-[10px] bg-ink px-4 text-[14px] text-white shadow-[0_6px_18px_-8px_rgba(10,124,240,.8)] hover:bg-ink/90">
            <Play className="fill-white" />
            {player.mode === "starting" ? "Iniciando…" : player.running ? "Kroomix trabajando…" : "Ejecutar demostración"}
          </Button>
        </div>
      )}
    </header>
  )
}
