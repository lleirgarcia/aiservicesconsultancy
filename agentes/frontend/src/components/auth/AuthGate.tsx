import { Loader2, LogOut, ShieldCheck } from "lucide-react"
import { useCallback, useEffect, useState, type ReactNode } from "react"

import { AdminPanel } from "@/components/admin/AdminPanel"
import { Logo } from "@/components/demo/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { auth, type AuthUser } from "@/lib/api"

/** Dentro de la web (iframe bajo /agentes-app/) el acceso lo gestiona la página /demos/login; esta pantalla solo se usa en solitario. */
const EMBEDDED = import.meta.env.BASE_URL !== "/"
const goTop = (url: string) => (window.top ?? window).location.assign(url)

function Login({ onDone }: { onDone: (u: AuthUser) => void }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError(null)
    try { onDone(await auth.login(username, password)) }
    catch (err) { setError((err as Error).message); setPassword("") }
    finally { setBusy(false) }
  }
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <form onSubmit={submit} className="panel w-full max-w-[380px] space-y-4 p-7">
        <Logo />
        <div>
          <h1 className="text-[18px] font-semibold text-ink">Acceso a la demostración</h1>
          <p className="mt-1 text-[13px] text-ink-2">Introduce el usuario y la contraseña que te hemos facilitado.</p>
        </div>
        <label className="block space-y-1.5 text-[12.5px] font-medium text-ink-2">
          Usuario
          <Input autoFocus autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-10 bg-surface" />
        </label>
        <label className="block space-y-1.5 text-[12.5px] font-medium text-ink-2">
          Contraseña
          <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 bg-surface" />
        </label>
        {error && <div className="rounded-md border border-bad/30 bg-bad-soft px-3 py-2 text-[12.5px] text-bad" role="alert">{error}</div>}
        <Button type="submit" disabled={busy || !username || !password} className="h-10 w-full bg-ink text-white hover:bg-ink/90">
          {busy ? <Loader2 className="animate-spin" /> : "Entrar"}
        </Button>
        <p className="text-[11.5px] leading-snug text-ink-3">Para poder mejorar el servicio y atenderte mejor, registramos la actividad de cada usuario durante la demostración.</p>
      </form>
    </div>
  )
}

/** Pide sesión antes de mostrar la demo. El administrador ve además el panel de uso de los clientes. */
export function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined) // undefined = comprobando
  const [view, setView] = useState<"demo" | "admin">("demo")
  useEffect(() => { auth.me().then(setUser).catch(() => setUser(null)) }, [])
  useEffect(() => {
    const out = () => { setUser(null); setView("demo") }
    window.addEventListener("kroomix:unauthenticated", out)
    return () => window.removeEventListener("kroomix:unauthenticated", out)
  }, [])
  useEffect(() => { if (user === null && EMBEDDED) goTop("/demos/login?next=/demos/agentes") }, [user])
  const logout = useCallback(async () => {
    await auth.logout().catch(() => undefined)
    if (EMBEDDED) { goTop("/demos/logout"); return } // la ruta borra también la cookie de la web
    setUser(null); setView("demo")
  }, [])

  if (user === undefined) return <div className="grid min-h-screen place-items-center"><Loader2 className="size-5 animate-spin text-ink-3" /></div>
  if (!user) return EMBEDDED ? <div className="grid min-h-screen place-items-center"><Loader2 className="size-5 animate-spin text-ink-3" /></div> : <Login onDone={setUser} />
  return (
    <>
      <div className="flex items-center justify-end gap-2 border-b border-line bg-surface px-6 py-1.5 text-[12.5px] text-ink-2">
        <span className="mr-1">{user.display_name}{user.company ? ` · ${user.company}` : ""}</span>
        {user.role === "admin" && (
          <Button variant={view === "admin" ? "default" : "outline"} size="sm" onClick={() => setView(view === "admin" ? "demo" : "admin")}>
            <ShieldCheck /> {view === "admin" ? "Volver a la demo" : "Uso de clientes"}
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={logout}><LogOut /> Salir</Button>
      </div>
      <div className={view === "admin" ? "hidden" : ""}>{children}</div>
      {view === "admin" && <AdminPanel me={user} />}
    </>
  )
}
