import { useState } from 'react'
import type { KeyboardEvent } from 'react'

import { ChevronDownIcon, MailIcon, MessageIcon } from '../../../../assets/icons'

import type { SettingsMessageTemplate } from '../../types'
import { BasicButton } from '../../../../components/buttons/BasicButton'

interface MessageCardProps {
  template: SettingsMessageTemplate
  onEdit?: (template: SettingsMessageTemplate) => void
  selectable?: boolean
  isSelected?: boolean
  onSelect?: (template: SettingsMessageTemplate) => void
  disableExpand?: boolean
}

export function MessageCard({
  template,
  onEdit,
  selectable = false,
  isSelected = false,
  onSelect,
  disableExpand = false,
}: MessageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const Icon = template.channel === 'sms' ? MessageIcon : MailIcon
  const preview = template.content.length > 80 ? `${template.content.slice(0, 80)}…` : template.content

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setIsExpanded((prev) => !prev)
    }
  }

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm transition ${
        isSelected ? 'border-[var(--color-primary)] bg-[var(--color-page)] shadow-md' : 'border-[var(--color-border)] bg-white'
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        className="flex w-full items-center gap-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        onClick={() => !disableExpand && setIsExpanded((prev) => !prev)}
        onKeyDown={(event) => {
          if (!disableExpand) {
            handleKeyDown(event)
          }
        }}
      >
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full ${
            isSelected ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-page)] text-[var(--color-text)]'
          }`}
        >
          <Icon className="app-icon h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-base font-semibold text-[var(--color-text)]">{template.name}</p>
            <span className="rounded-full bg-[var(--color-page)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              {template.channel}
            </span>
          </div>
          <p className="truncate text-sm text-[var(--color-muted)]">{preview}</p>
        </div>
        {selectable ? (
          <button
            type="button"
            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] ${
              isSelected ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-page)] text-[var(--color-text)]'
            }`}
            onClick={(event) => {
              event.stopPropagation()
              onSelect?.(template)
            }}
          >
            {isSelected ? 'Selected' : 'Choose'}
          </button>
        ) : onEdit ? (
          <BasicButton
            params={{
              variant: 'ghost',
              className: 'text-xs font-semibold uppercase tracking-[0.2em]',
              onClick: () => {
                onEdit(template)
              },
            }}
          >
            Edit
          </BasicButton>
        ) : null}
        {!disableExpand ? (
          <ChevronDownIcon
            className={`app-icon h-4 w-4 text-[var(--color-muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        ) : null}
      </div>
      {isExpanded ? (
        <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-[var(--color-page)] p-4 text-sm text-[var(--color-text)]">
          {template.content}
        </div>
      ) : null}
    </div>
  )
}
