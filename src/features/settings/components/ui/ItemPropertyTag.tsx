import type { ReactNode } from 'react'

interface ItemPropertyTagProps {
  label: string
  icon?: ReactNode
  onClick?: () => void
  muted?: boolean
}

export function ItemPropertyTag({ label, icon, onClick, muted = false }: ItemPropertyTagProps) {
  const clickable = Boolean(onClick)
  return (
    <span
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!clickable) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick?.()
        }
      }}
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${
        muted ? 'border-transparent bg-[var(--color-page)] text-[var(--color-muted)]' : 'border-[var(--color-border)] text-[var(--color-text)]'
      } ${clickable ? 'cursor-pointer hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]' : ''}`}
    >
      {icon ? <span className="text-[var(--color-muted)]">{icon}</span> : null}
      {label}
    </span>
  )
}
