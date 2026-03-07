import type { ReactNode } from 'react'

export const LocalDeliveryEditFormSectionGroup = ({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) => (
  <div className="flex flex-col gap-1 rounded-lg shadow-md p-4 border-1 border-[var(--color-border)] bg-[var(--color-page)]">
    <span className="text-[13px] font-semibold text-[var(--color-muted)]">
      {label}
    </span>
    <div className="flex flex-col gap-1">{children}</div>
  </div>
)
