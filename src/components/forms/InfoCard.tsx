import type { ReactNode } from 'react'

interface InfoCardProps {
  title: string
  description?: string
  className?: string
  children?: ReactNode
}

export function InfoCard({ title, description, className = '', children }: InfoCardProps) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-page)] px-4 py-3 ${className}`}
    >
      <div className="space-y-1">
        <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
        {description ? <p className="text-xs text-[var(--color-muted)]">{description}</p> : null}
      </div>
      <div className="flex flex-1 items-center gap-3">{children}</div>
    </div>
  )
}

export default InfoCard
