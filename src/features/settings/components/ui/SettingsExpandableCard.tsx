import { useState } from 'react'
import type { ReactNode } from 'react'

import { ChevronDownIcon } from '../../../../assets/icons'

import { BasicButton } from '../../../../components/buttons/BasicButton'

interface SettingsExpandableCardProps {
  title: ReactNode
  subtitle?: ReactNode
  prefix?: ReactNode
  meta?: ReactNode
  children?: ReactNode
  onEdit?: () => void
  className?: string
}

export function SettingsExpandableCard({
  title,
  subtitle,
  prefix,
  meta,
  children,
  onEdit,
  className = '',
}: SettingsExpandableCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleToggle = () => {
    setIsExpanded((prev) => !prev)
  }

  return (
    <div className={`rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm ${className}`}>
      <div
        role="button"
        tabIndex={0}
        className="flex w-full items-center gap-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        onClick={handleToggle}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleToggle()
          }
        }}
      >
        {prefix ? <div className="flex items-center">{prefix}</div> : null}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 text-base font-semibold text-[var(--color-text)]">
            {title}
          </div>
          {subtitle ? <p className="text-sm text-[var(--color-muted)]">{subtitle}</p> : null}
        </div>
        {meta ? <div className="flex flex-wrap items-center justify-end gap-2">{meta}</div> : null}
        {onEdit ? (
          <BasicButton
            params={{
              variant: 'secondary',
              className: 'text-xs font-semibold uppercase tracking-[0.2em]',
              onClick: onEdit,
            }}
          >
            Edit
          </BasicButton>
        ) : null}
        <span className={`text-[var(--color-muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true">
          <ChevronDownIcon className="app-icon h-4 w-4" />
        </span>
      </div>
      {isExpanded && children ? (
        <div className="mt-4 border-t border-dashed border-[var(--color-border)] pt-4 text-sm text-[var(--color-text)]">
          {children}
        </div>
      ) : null}
    </div>
  )
}
