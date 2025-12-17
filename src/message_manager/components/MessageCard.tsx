import { useMemo, useState, type ComponentType, type SVGProps } from 'react'

import { CheckMarkIcon, CloseIcon, InfoIcon, ThunderIcon } from '../../assets/icons'

import type { MessageStatus } from '../MessageManagerContext'

const STATUS_STYLES: Record<
  MessageStatus,
  {
    icon: ComponentType<SVGProps<SVGSVGElement>>
    container: string
  }
> = {
  success: {
    icon: CheckMarkIcon,
    container: 'bg-emerald-600/95 ring-emerald-400/60',
  },
  warning: {
    icon: ThunderIcon,
    container: 'bg-amber-500/95 ring-amber-300/60',
  },
  error: {
    icon: CloseIcon,
    container: 'bg-rose-600/95 ring-rose-400/60',
  },
  info: {
    icon: InfoIcon,
    container: 'bg-sky-600/95 ring-sky-400/60',
  },
}

interface MessageCardProps {
  status: MessageStatus
  message: string
  details?: string
  onDismiss: () => void
}

export function MessageCard({ status, message, details, onDismiss }: MessageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { icon: Icon, container } = STATUS_STYLES[status]
  const hasDetails = Boolean(details)
  const isTruncated = message.length > 150
  const canExpand = hasDetails || isTruncated
  const displayText = useMemo(() => {
    if (isExpanded || message.length <= 150) {
      return message
    }
    return `${message.slice(0, 150)}…`
  }, [isExpanded, message])

  const toggleExpanded = () => {
    if (!canExpand) return
    setIsExpanded((prev) => !prev)
  }

  return (
    <div className="pointer-events-auto">
      <div
        className={`relative w-full rounded-2xl px-4 py-3 text-white shadow-2xl ring-1 transition ${container} ${
          canExpand ? 'cursor-pointer' : ''
        }`}
        onClick={toggleExpanded}
        role={canExpand ? 'button' : undefined}
        tabIndex={canExpand ? 0 : undefined}
        aria-expanded={canExpand ? isExpanded : undefined}
        onKeyDown={(event) => {
          if (!canExpand) return
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            toggleExpanded()
          }
        }}
      >
        <div className="flex items-start gap-3 pr-6">
          <Icon className="app-icon mt-0.5 h-5 w-5 shrink-0 text-white" />
          <div className="flex flex-1 flex-col gap-2">
            <p className="text-sm font-medium leading-snug">{displayText}</p>
            {hasDetails && isExpanded && <p className="text-xs leading-relaxed text-white/90">{details}</p>}
          </div>
        </div>
        <button
          type="button"
          aria-label="Dismiss message"
          className="absolute right-3 top-3 rounded-full p-1 text-white/80 transition hover:bg-white/15 hover:text-white"
          onClick={(event) => {
            event.stopPropagation()
            onDismiss()
          }}
        >
          <CloseIcon className="app-icon h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  )
}
