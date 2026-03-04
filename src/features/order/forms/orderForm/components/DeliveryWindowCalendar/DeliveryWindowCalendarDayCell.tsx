import { CalendarDayCell } from '@/shared/calendar'
import type { CalendarDay } from '@/shared/calendar'

type DeliveryWindowCalendarDayCellProps = {
  day: CalendarDay
  isSelected: boolean
  isInRange: boolean
  tabIndex: number
  ariaLabel: string
  isToday: boolean
  isCurrentMonth: boolean
  isClosed: boolean
  windowCount: number
  onSelect: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const DeliveryWindowCalendarDayCell = ({
  day,
  isSelected,
  isInRange,
  tabIndex,
  ariaLabel,
  isToday,
  isCurrentMonth,
  isClosed,
  windowCount,
  onSelect,
  onMouseEnter,
  onMouseLeave,
}: DeliveryWindowCalendarDayCellProps) => {
  const toneClass = !isCurrentMonth
    ? 'bg-[var(--color-muted)]/10 text-[var(--color-muted)]/60'
    : isClosed
      ? 'bg-[var(--color-muted)]/10 text-[var(--color-muted)]'
      : isSelected
        ? 'bg-[var(--color-dark-blue)] text-[var(--color-page)]'
        : isInRange
          ? 'bg-[var(--color-primary)]/10 text-[var(--color-text)]'
          : 'bg-transparent text-[var(--color-text)]'

  return (
    <CalendarDayCell
      day={day}
      isSelected={isSelected}
      isInRange={isInRange}
      onSelect={onSelect}
      tabIndex={tabIndex}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      ariaLabel={ariaLabel}
      isToday={isToday}
      className={`relative flex h-14 flex-col items-start border-t border-r border-[var(--color-border-accent)] p-1 text-xs outline-none transition-colors ${toneClass}`}
    >
      <span className="text-[11px] font-semibold">{day.date.getDate()}</span>

      <div className="flex w-full flex-1 items-center justify-center">
        {windowCount > 0 ? (
          <span className="rounded-full bg-[var(--color-dark-blue)]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[var(--color-dark-blue)]">
            {windowCount}
          </span>
        ) : null}
      </div>

      {isClosed ? (
        <span className="self-end text-[9px] font-semibold uppercase tracking-wide">Closed</span>
      ) : null}
    </CalendarDayCell>
  )
}
