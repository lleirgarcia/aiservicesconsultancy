import type { ReactNode } from "react"

export function Column({ index, eyebrow, title, subtitle, right, children, tour, className = "" }: {
  index: string; eyebrow: string; title: string; subtitle: string; right?: ReactNode; children: ReactNode; tour?: string; className?: string
}) {
  return (
    <section className={`panel flex min-h-0 flex-col ${className}`} data-tour={tour}>
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 pb-3.5 pt-4">
        <div>
          <div className="eyebrow mb-1.5 flex items-center gap-2">
            <span className="text-signal">{index}</span>
            <span className="h-px w-4 bg-line-strong" />
            {eyebrow}
          </div>
          <h2 className="text-[17px] font-semibold leading-tight text-ink">{title}</h2>
          <p className="mt-0.5 text-[12.5px] text-ink-2">{subtitle}</p>
        </div>
        {right}
      </div>
      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
    </section>
  )
}
