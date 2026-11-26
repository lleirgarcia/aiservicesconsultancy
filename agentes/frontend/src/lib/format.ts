const eurFmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", useGrouping: "always" } as Intl.NumberFormatOptions)
const eur0Fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0, useGrouping: "always" } as Intl.NumberFormatOptions)
const numFmt = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 })

export const eur = (x: number | null | undefined) => (x == null ? "—" : eurFmt.format(x))
export const eur0 = (x: number) => eur0Fmt.format(x)
export const num = (x: number, digits = 1) =>
  new Intl.NumberFormat("es-ES", { maximumFractionDigits: digits, useGrouping: "always" } as Intl.NumberFormatOptions).format(x)
export const num1 = (x: number) => numFmt.format(x)

export function seconds(ms: number) {
  const s = ms / 1000
  if (s < 60) return `${num(s, 1)} s`
  const m = Math.floor(s / 60)
  return `${m} min ${Math.round(s - m * 60)} s`
}

export function clock(ms: number) {
  const total = Math.max(0, ms) / 1000
  const m = Math.floor(total / 60)
  const s = total - m * 60
  return `${String(m).padStart(2, "0")}:${s.toFixed(1).padStart(4, "0")}`
}

export function dateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString("es-ES", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
}

export function shortDate(iso?: string | null) {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

export function kb(bytes: number) {
  return bytes > 1024 * 1024 ? `${num(bytes / 1024 / 1024, 1)} MB` : `${Math.round(bytes / 1024)} KB`
}
