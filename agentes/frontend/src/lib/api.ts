import type { Agent, ChatResponse, Draft, InboxState, RunEvent, Scenario, SourceDoc } from "./types"

/** Prefijo bajo el que Next sirve esta app (vite `base`). El backend devuelve rutas absolutas «/api/…». */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "")
export const withBase = (path: string) => (path.startsWith("/") ? BASE + path : path)
const f = (path: string, init?: RequestInit) => fetch(withBase(path), init)

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Error ${res.status}`
    try {
      const body = await res.json()
      message = body?.detail?.message ?? message
    } catch { /* sin cuerpo */ }
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

export const api = {
  scenario: (agentId = "gestion-documental", emailId: string | null = null) =>
    f(`/api/scenario?agent_id=${encodeURIComponent(agentId)}${emailId ? `&email_id=${encodeURIComponent(emailId)}` : ""}`).then((r) => json<Scenario>(r)),
  inbox: () => f("/api/inbox").then((r) => json<InboxState>(r)),
  launchInbox: (emailId: string, agentId: string) =>
    f(`/api/inbox/${encodeURIComponent(emailId)}/launch`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agent_id: agentId }) })
      .then((r) => json<{ run_id: string }>(r)),
  source: (agentId: string, emailId: string, sourceId: string) =>
    f(`/api/sources/${encodeURIComponent(sourceId)}?agent_id=${encodeURIComponent(agentId)}&email_id=${encodeURIComponent(emailId)}`).then((r) => json<SourceDoc>(r)),
  startRun: (agentId = "gestion-documental", emailId: string | null = null) =>
    f("/api/runs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agent_id: agentId, email_id: emailId }) })
      .then((r) => json<{ run_id: string }>(r)),
  recordedEvents: (runId: string) =>
    f(`/api/runs/${runId}/events.json`).then((r) =>
      json<{ run: { started_at: string; duration_ms: number }; events: RunEvent[] }>(r)),
  approveDraft: (id: string) => f(`/api/drafts/${id}/approve`, { method: "POST" }).then((r) => json<Draft>(r)),
  rejectDraft: (id: string) => f(`/api/drafts/${id}/reject`, { method: "POST" }).then((r) => json<Draft>(r)),
  editDraft: (id: string, subject: string, body: string) =>
    f(`/api/drafts/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, body }),
    }).then((r) => json<Draft>(r)),
  agents: () => f("/api/agents").then((r) => json<{ agents: Agent[] }>(r)).then((b) => b.agents),
  chat: (message: string) =>
    f("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) })
      .then((r) => json<ChatResponse>(r)),
  events: (runId: string) => new EventSource(withBase(`/api/runs/${runId}/events`)),
}
