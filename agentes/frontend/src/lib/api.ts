import type { Agent, ChatResponse, Draft, InboxState, RunEvent, Scenario, SourceDoc } from "./types"

/** Prefijo bajo el que Next sirve esta app (vite `base`). El backend devuelve rutas absolutas «/api/…». */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "")
export const withBase = (path: string) => (path.startsWith("/") ? BASE + path : path)
const f = (path: string, init?: RequestInit) => fetch(withBase(path), init)

export interface AuthUser { id: number; username: string; display_name: string; company: string; role: "admin" | "client"; active: number; created_at: string; last_login_at: string | null }
export interface AdminUser extends AuthUser { open_sessions: number; logins: number; actions: number; runs: number; chats: number; last_activity: string | null }
export interface ActivityRow { id: number; at: string; user_id: number | null; username: string | null; session_id: number | null; kind: "api" | "ui" | "login" | "login_failed" | "logout"; method: string; path: string; status: number | null; duration_ms: number | null; ip: string; summary: string; run_id: string | null }
export interface ActivityDetail extends ActivityRow { user_agent: string; request: string | null; response: string | null }

async function json<T>(res: Response): Promise<T> {
  if (res.status === 401 && !res.url.includes("/api/auth/")) window.dispatchEvent(new Event("kroomix:unauthenticated"))
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

const send = (method: string, url: string, body?: unknown) =>
  f(url, { method, headers: body === undefined ? undefined : { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) })

export const auth = {
  me: () => f("/api/auth/me").then((r) => (r.ok ? (r.json() as Promise<{ user: AuthUser }>).then((b) => b.user) : null)),
  login: (username: string, password: string) => send("POST", "/api/auth/login", { username, password }).then((r) => json<{ user: AuthUser }>(r)).then((b) => b.user),
  logout: () => send("POST", "/api/auth/logout").then(() => undefined),
}

/** Acciones de interfaz que el servidor no ve como petición propia. Nunca debe romper la app. */
export const track = (event: string, label: string, detail: Record<string, unknown> = {}) => {
  void send("POST", "/api/track", { event, detail: { label, ...detail } }).catch(() => undefined)
}

export const admin = {
  users: () => f("/api/admin/users").then((r) => json<{ users: AdminUser[] }>(r)).then((b) => b.users),
  createUser: (u: { username: string; display_name: string; company: string }) =>
    send("POST", "/api/admin/users", u).then((r) => json<{ user: AuthUser; password: string }>(r)),
  setActive: (id: number, active: boolean) => send("PATCH", `/api/admin/users/${id}`, { active }).then((r) => json<{ user: AuthUser }>(r)),
  resetPassword: (id: number) => send("POST", `/api/admin/users/${id}/reset-password`).then((r) => json<{ password: string }>(r)).then((b) => b.password),
  activity: (p: { userId?: number | null; kind?: string; q?: string; beforeId?: number; limit?: number }) => {
    const qs = new URLSearchParams()
    if (p.userId) qs.set("user_id", String(p.userId))
    if (p.kind) qs.set("kind", p.kind)
    if (p.q) qs.set("q", p.q)
    if (p.beforeId) qs.set("before_id", String(p.beforeId))
    qs.set("limit", String(p.limit ?? 100))
    return f(`/api/admin/activity?${qs}`).then((r) => json<{ items: ActivityRow[] }>(r)).then((b) => b.items)
  },
  detail: (id: number) => f(`/api/admin/activity/${id}`).then((r) => json<ActivityDetail>(r)),
  runEvents: (runId: string) => f(`/api/runs/${encodeURIComponent(runId)}/events.json`).then((r) => json<{ run: Record<string, unknown>; events: { seq: number; t_ms: number; type: string; payload: Record<string, unknown> }[] }>(r)),
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
