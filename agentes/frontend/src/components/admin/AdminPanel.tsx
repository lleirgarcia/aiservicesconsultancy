import { Ban, Check, ChevronDown, ChevronRight, Copy, KeyRound, Loader2, Plus, RefreshCw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { admin, type ActivityDetail, type ActivityRow, type AdminUser, type AuthUser } from "@/lib/api"

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—")
const KIND: Record<string, { label: string; cls: string }> = {
  api: { label: "acción", cls: "bg-signal-soft text-signal" },
  ui: { label: "interfaz", cls: "bg-muted text-ink-2" },
  login: { label: "entrada", cls: "bg-ok-soft text-ok" },
  logout: { label: "salida", cls: "bg-muted text-ink-2" },
  login_failed: { label: "intento fallido", cls: "bg-bad-soft text-bad" },
}

function pretty(raw: string | null) {
  if (!raw) return "—"
  try { return JSON.stringify(JSON.parse(raw), null, 2) } catch { return raw }
}

function RunEvents({ runId }: { runId: string }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof admin.runEvents>> | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { admin.runEvents(runId).then(setData).catch((e) => setError(e.message)) }, [runId])
  if (error) return <div className="text-bad">{error}</div>
  if (!data) return <Loader2 className="size-3.5 animate-spin" />
  return (
    <div className="space-y-1">
      <div className="text-ink-2">Ejecución {runId} · {String(data.run.status ?? "")} · {String(data.run.agent_id ?? "")} · {data.events.length} eventos</div>
      <div className="thin-scroll max-h-56 overflow-y-auto rounded border border-line bg-muted/40 p-2 font-mono text-[11px]">
        {data.events.map((e) => <div key={e.seq} className="truncate"><span className="text-ink-3">{String(e.t_ms).padStart(6)}ms</span> <b>{e.type}</b> {JSON.stringify(e.payload).slice(0, 160)}</div>)}
      </div>
    </div>
  )
}

function Row({ r }: { r: ActivityRow }) {
  const [open, setOpen] = useState(false)
  const [d, setD] = useState<ActivityDetail | null>(null)
  const toggle = () => { setOpen(!open); if (!open && !d) admin.detail(r.id).then(setD).catch(() => undefined) }
  const k = KIND[r.kind] ?? KIND.api
  return (
    <div className="border-b border-line last:border-0">
      <button onClick={toggle} className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-muted/40">
        {open ? <ChevronDown className="mt-0.5 size-3.5 shrink-0 text-ink-3" /> : <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-ink-3" />}
        <span className="num w-[118px] shrink-0 text-[11.5px] text-ink-3">{when(r.at)}</span>
        <span className="w-[92px] shrink-0 truncate text-[12px] font-medium text-ink">{r.username ?? "—"}</span>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10.5px] font-medium ${k.cls}`}>{k.label}</span>
        <span className="min-w-0 flex-1 text-[12.5px] text-ink">{r.summary}</span>
        {r.status && r.status >= 400 && <span className="shrink-0 text-[11px] font-medium text-bad">{r.status}</span>}
      </button>
      {open && (
        <div className="space-y-2 bg-muted/30 px-9 pb-3 pt-1 text-[11.5px] text-ink-2">
          <div className="num">{r.method} {r.path} · {r.status ?? "—"} · {r.duration_ms ?? "—"} ms · IP {r.ip || "—"}</div>
          {d?.request && <div><div className="eyebrow mb-1">Petición</div><pre className="thin-scroll max-h-40 overflow-auto whitespace-pre-wrap break-words rounded border border-line bg-surface p-2 font-mono text-[11px]">{pretty(d.request)}</pre></div>}
          {d?.response && <div><div className="eyebrow mb-1">Respuesta</div><pre className="thin-scroll max-h-40 overflow-auto whitespace-pre-wrap break-words rounded border border-line bg-surface p-2 font-mono text-[11px]">{pretty(d.response)}</pre></div>}
          {d?.user_agent && <div className="truncate text-ink-3">{d.user_agent}</div>}
          {r.run_id && <RunEvents runId={r.run_id} />}
        </div>
      )}
    </div>
  )
}

function NewUser({ onCreated }: { onCreated: () => void }) {
  const [f, setF] = useState({ username: "", display_name: "", company: "" })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [made, setMade] = useState<{ username: string; password: string } | null>(null)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError(null)
    try {
      const r = await admin.createUser(f)
      setMade({ username: r.user.username, password: r.password }); setF({ username: "", display_name: "", company: "" }); onCreated()
    } catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }
  return (
    <form onSubmit={submit} className="space-y-2 border-t border-line p-3">
      <div className="eyebrow">Nuevo cliente</div>
      <Input placeholder="usuario (ej. acme)" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} className="h-8 bg-surface text-[13px]" />
      <Input placeholder="Nombre de la persona" value={f.display_name} onChange={(e) => setF({ ...f, display_name: e.target.value })} className="h-8 bg-surface text-[13px]" />
      <Input placeholder="Empresa" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} className="h-8 bg-surface text-[13px]" />
      {error && <div className="text-[12px] text-bad">{error}</div>}
      <Button type="submit" size="sm" disabled={busy || !f.username} className="w-full bg-ink text-white hover:bg-ink/90"><Plus /> Crear y generar contraseña</Button>
      {made && <Secret username={made.username} password={made.password} onClose={() => setMade(null)} />}
    </form>
  )
}

function Secret({ username, password, onClose }: { username: string; password: string; onClose: () => void }) {
  return (
    <div className="rounded-md border border-warn/40 bg-warn-soft p-2.5 text-[12px] text-ink">
      <div className="mb-1 font-medium">Credenciales de «{username}» — solo se muestran ahora</div>
      <div className="flex items-center gap-2"><code className="num flex-1 select-all rounded bg-surface px-2 py-1 text-[13px]">{password}</code>
        <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(`Usuario: ${username}\nContraseña: ${password}`)}><Copy /> Copiar</Button></div>
      <button className="mt-1.5 text-[11.5px] text-ink-2 underline" onClick={onClose}>Ya la he copiado</button>
    </div>
  )
}

export function AdminPanel({ me }: { me: AuthUser }) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [sel, setSel] = useState<number | null>(null)
  const [kind, setKind] = useState("")
  const [q, setQ] = useState("")
  const [rows, setRows] = useState<ActivityRow[]>([])
  const [loading, setLoading] = useState(false)
  const [more, setMore] = useState(true)
  const [reset, setReset] = useState<{ username: string; password: string } | null>(null)
  const [auto, setAuto] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadUsers = useCallback(() => { admin.users().then(setUsers).catch((e) => setError(e.message)) }, [])
  const loadRows = useCallback(async () => {
    setLoading(true)
    try { const r = await admin.activity({ userId: sel, kind, q }); setRows(r); setMore(r.length === 100); setError(null) }
    catch (e) { setError((e as Error).message) } finally { setLoading(false) }
  }, [sel, kind, q])
  const loadMore = async () => {
    const r = await admin.activity({ userId: sel, kind, q, beforeId: rows[rows.length - 1]?.id })
    setRows([...rows, ...r]); setMore(r.length === 100)
  }
  useEffect(() => { loadUsers() }, [loadUsers])
  useEffect(() => { const t = setTimeout(loadRows, q ? 300 : 0); return () => clearTimeout(t) }, [loadRows, q])
  useEffect(() => {
    if (!auto) return
    const t = setInterval(() => { loadUsers(); loadRows() }, 10000)
    return () => clearInterval(t)
  }, [auto, loadUsers, loadRows])

  const clients = users.filter((u) => u.role === "client")
  const staff = users.filter((u) => u.role === "admin")
  const UserBtn = ({ u }: { u: AdminUser }) => (
    <div className={`border-b border-line px-3 py-2.5 ${sel === u.id ? "bg-signal-soft" : "hover:bg-muted/40"}`}>
      <button className="w-full text-left" onClick={() => setSel(sel === u.id ? null : u.id)}>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[13px] font-medium text-ink">{u.display_name}{!u.active && <span className="ml-1.5 text-[11px] text-bad">desactivado</span>}</span>
          {u.open_sessions > 0 && <span className="flex items-center gap-1 text-[11px] text-ok"><span className="size-1.5 rounded-full bg-ok" />conectado</span>}
        </div>
        <div className="truncate text-[11.5px] text-ink-3">{u.username}{u.company ? ` · ${u.company}` : ""}</div>
        <div className="num mt-1 flex gap-3 text-[11px] text-ink-2"><span>{u.logins} accesos</span><span>{u.actions} acciones</span><span>{u.runs} ejec.</span><span>{u.chats} chats</span></div>
        <div className="mt-0.5 text-[11px] text-ink-3">Última actividad: {when(u.last_activity)}</div>
      </button>
      {u.id !== me.id && (
        <div className="mt-1.5 flex gap-1.5">
          <Button size="xs" variant="outline" onClick={async () => { setReset({ username: u.username, password: await admin.resetPassword(u.id) }); loadUsers() }}><KeyRound /> Nueva contraseña</Button>
          <Button size="xs" variant="outline" onClick={async () => { await admin.setActive(u.id, !u.active); loadUsers() }}>{u.active ? <><Ban /> Desactivar</> : <><Check /> Activar</>}</Button>
        </div>
      )}
    </div>
  )

  return (
    <div className="mx-auto max-w-[1680px] px-6 pb-16 pt-5">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="eyebrow mb-1">Administración</div>
          <h1 className="text-[20px] font-semibold text-ink">Uso de la demostración por cliente</h1>
          <p className="text-[13px] text-ink-2">Cada acceso, consulta, ejecución de agente y mensaje de chat queda registrado con usuario, hora e IP.</p>
        </div>
        <label className="flex items-center gap-2 text-[12.5px] text-ink-2"><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Actualizar cada 10 s
          <Button size="sm" variant="outline" onClick={() => { loadUsers(); loadRows() }}><RefreshCw /> Ahora</Button></label>
      </div>
      {error && <div className="mb-3 rounded-md border border-bad/30 bg-bad-soft px-4 py-2 text-[13px] text-bad">{error}</div>}
      <div className="grid grid-cols-[340px_1fr] gap-3">
        <aside className="panel self-start">
          <div className="eyebrow border-b border-line px-3 py-2.5">Clientes ({clients.length})</div>
          {reset && <div className="p-3"><Secret username={reset.username} password={reset.password} onClose={() => setReset(null)} /></div>}
          {clients.length === 0 && <div className="px-3 py-4 text-[12.5px] text-ink-3">Aún no hay clientes. Crea el primero abajo.</div>}
          {clients.map((u) => <UserBtn key={u.id} u={u} />)}
          <NewUser onCreated={loadUsers} />
          {staff.length > 0 && <><div className="eyebrow border-y border-line px-3 py-2.5">Administradores</div>{staff.map((u) => <UserBtn key={u.id} u={u} />)}</>}
        </aside>
        <section className="panel min-w-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5">
            <div className="eyebrow mr-2">Actividad{sel ? ` · ${users.find((u) => u.id === sel)?.username}` : " · todos"}</div>
            {sel && <Button size="xs" variant="ghost" onClick={() => setSel(null)}>Ver todos</Button>}
            <select value={kind} onChange={(e) => setKind(e.target.value)} className="h-8 rounded-md border border-input bg-surface px-2 text-[12.5px]">
              <option value="">Todo tipo</option><option value="api">Acciones</option><option value="ui">Interfaz</option><option value="login">Entradas</option><option value="login_failed">Intentos fallidos</option><option value="logout">Salidas</option>
            </select>
            <Input placeholder="Buscar (texto, ruta, usuario)…" value={q} onChange={(e) => setQ(e.target.value)} className="h-8 max-w-[280px] bg-surface text-[12.5px]" />
            {loading && <Loader2 className="size-3.5 animate-spin text-ink-3" />}
          </div>
          {rows.length === 0 && !loading && <div className="px-4 py-8 text-center text-[13px] text-ink-3">Sin actividad registrada con estos filtros.</div>}
          {rows.map((r) => <Row key={r.id} r={r} />)}
          {more && rows.length > 0 && <div className="p-3 text-center"><Button size="sm" variant="outline" onClick={loadMore}>Cargar más</Button></div>}
        </section>
      </div>
    </div>
  )
}
