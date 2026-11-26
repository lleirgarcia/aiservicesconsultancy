/**
 * Reproduce los eventos del agente en pantalla.
 *
 * - En directo: los eventos llegan por SSE desde el backend en el momento en que ocurren.
 * - Reproducción: eventos grabados de una ejecución real, programados con sus tiempos originales.
 *
 * El ritmo de visualización (pausa, paso a paso) nunca altera el tiempo real de ejecución,
 * que siempre sale de las marcas de tiempo del backend.
 */
import { useCallback, useEffect, useRef, useState } from "react"

import { api } from "@/lib/api"
import type { RunEvent } from "@/lib/types"

import { applyEvent, initialView, isStepBoundary, type ViewState } from "./view"

export type Mode = "idle" | "starting" | "live" | "replay"

const STEP_GAP_MS = 420 // pausa visual mínima entre acciones mostradas

interface Machine {
  mode: Mode
  events: RunEvent[] // recibidos (en directo) o grabados (reproducción)
  shown: number
  view: ViewState
  paused: boolean
  lastShownAt: number
  // Reloj real
  lastReceivedAt: number
  replayClock: number
  replayTickAt: number
  replayInfo: { started_at: string; duration_ms: number } | null
  source: EventSource | null
  streamEnded: boolean
  error: string | null
}

const fresh = (): Machine => ({
  mode: "idle", events: [], shown: 0, view: initialView, paused: false, lastShownAt: 0,
  lastReceivedAt: 0, replayClock: 0, replayTickAt: 0, replayInfo: null, source: null, streamEnded: false, error: null,
})

export function useRunPlayer() {
  const m = useRef<Machine>(fresh())
  const [, setTick] = useState(0)
  const render = useCallback(() => setTick((x) => x + 1), [])

  const available = () => {
    const s = m.current
    if (s.mode !== "replay") return s.events.length
    let n = 0
    while (n < s.events.length && s.events[n].t_ms <= s.replayClock) n++
    return n
  }

  const showNext = () => {
    const s = m.current
    const ev = s.events[s.shown]
    s.view = applyEvent(s.view, ev)
    s.shown++
    return ev
  }

  useEffect(() => {
    const id = window.setInterval(() => {
      const s = m.current
      if (s.mode === "idle" || s.mode === "starting") return
      const now = performance.now()
      if (s.mode === "replay" && !s.paused) {
        s.replayClock += now - s.replayTickAt
      }
      s.replayTickAt = now
      if (!s.paused) {
        const avail = available()
        while (s.shown < avail && now - s.lastShownAt >= STEP_GAP_MS) {
          const ev = showNext()
          if (isStepBoundary(ev)) {
            s.lastShownAt = now
            break
          }
        }
      }
      render()
    }, 50)
    return () => window.clearInterval(id)
  }, [render])

  const close = () => {
    m.current.source?.close()
    m.current.source = null
  }

  /** Conecta con una ejecución ya iniciada (por el botón o por el chat) y empieza a recibir sus eventos. */
  const attach = useCallback((run_id: string) => {
    close()
    m.current = { ...fresh(), mode: "starting" }
    render()
    try {
      const src = api.events(run_id)
      m.current.source = src
      m.current.mode = "live"
      src.onmessage = (e) => {
        const ev = JSON.parse(e.data) as RunEvent
        const s = m.current
        if (s.events.length && ev.seq <= s.events[s.events.length - 1].seq) return
        s.events.push(ev)
        s.lastReceivedAt = performance.now()
      }
      src.addEventListener("end", () => {
        m.current.streamEnded = true
        close()
      })
      src.onerror = () => {
        // EventSource reconecta solo; si el backend cerró la ejecución, el evento "end" ya llegó.
        if (m.current.streamEnded) close()
      }
    } catch (err) {
      m.current = { ...fresh(), error: err instanceof Error ? err.message : "No se ha podido iniciar." }
    }
    render()
  }, [render])

  const start = useCallback(async (agentId = "gestion-documental", emailId: string | null = null) => {
    close()
    m.current = { ...fresh(), mode: "starting" }
    render()
    try {
      const { run_id } = await api.startRun(agentId, emailId)
      attach(run_id)
    } catch (err) {
      m.current = { ...fresh(), error: err instanceof Error ? err.message : "No se ha podido iniciar." }
      render()
    }
  }, [attach, render])

  const replay = useCallback(async (runId: string) => {
    close()
    m.current = { ...fresh(), mode: "starting" }
    render()
    try {
      const data = await api.recordedEvents(runId)
      const now = performance.now()
      m.current = { ...fresh(), mode: "replay", events: data.events, replayInfo: data.run, replayTickAt: now, streamEnded: true }
    } catch (err) {
      m.current = { ...fresh(), error: err instanceof Error ? err.message : "No se ha podido cargar la grabación." }
    }
    render()
  }, [render])

  const reset = useCallback(() => {
    close()
    m.current = fresh()
    render()
  }, [render])

  const togglePause = useCallback(() => {
    m.current.paused = !m.current.paused
    m.current.replayTickAt = performance.now()
    render()
  }, [render])

  /** Muestra la siguiente acción completa (aunque esté en pausa). */
  const next = useCallback(() => {
    const s = m.current
    if (s.mode === "replay" && s.shown < s.events.length) {
      // En una reproducción, avanzar es saltar al siguiente evento grabado.
      let j = s.shown
      while (j < s.events.length && !isStepBoundary(s.events[j])) j++
      if (j < s.events.length) s.replayClock = Math.max(s.replayClock, s.events[j].t_ms)
    }
    const avail = available()
    while (s.shown < avail) {
      if (isStepBoundary(showNext())) break
    }
    s.lastShownAt = performance.now()
    render()
  }, [render])

  const s = m.current
  const lastEvent = s.events[s.events.length - 1]
  const finishedEvent = s.events.find((e) => e.type === "run_finished")
  let realMs = 0
  if (s.mode === "replay") realMs = Math.min(s.replayClock, s.replayInfo?.duration_ms ?? s.replayClock)
  else if (finishedEvent) realMs = finishedEvent.payload.duration_ms
  // En directo el reloj sigue al agente aunque la visualización esté en pausa.
  else if (lastEvent) realMs = lastEvent.t_ms + (performance.now() - s.lastReceivedAt)

  return {
    mode: s.mode,
    view: s.view,
    paused: s.paused,
    pending: available() - s.shown,
    agentDone: !!finishedEvent,
    realMs,
    replayInfo: s.replayInfo,
    error: s.error,
    running: (s.mode === "live" || s.mode === "replay") && !s.view.finished,
    start, attach, replay, reset, togglePause, next,
  }
}

export type Player = ReturnType<typeof useRunPlayer>
