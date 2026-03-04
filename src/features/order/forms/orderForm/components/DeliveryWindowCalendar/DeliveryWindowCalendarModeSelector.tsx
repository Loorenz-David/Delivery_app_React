import { DELIVERY_WINDOW_CALENDAR_MODE_OPTIONS, type DeliveryWindowCalendarMode } from './DeliveryWindowCalendar.types'

type DeliveryWindowCalendarModeSelectorProps = {
  mode: DeliveryWindowCalendarMode
  onChangeMode: (mode: DeliveryWindowCalendarMode) => void
}

export const DeliveryWindowCalendarModeSelector = ({
  mode,
  onChangeMode,
}: DeliveryWindowCalendarModeSelectorProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {DELIVERY_WINDOW_CALENDAR_MODE_OPTIONS.map((option) => {
        const isActive = option.value === mode

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChangeMode(option.value)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              isActive
                ? 'border-[var(--color-text)] bg-[var(--color-text)] text-[var(--color-page)]'
                : 'border-[var(--color-border-accent)] bg-transparent text-[var(--color-muted)]'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
