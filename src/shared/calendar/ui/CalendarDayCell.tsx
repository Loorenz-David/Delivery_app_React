import { forwardRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'

import { getCalendarDayKey } from '../domain/dayKey.utils'
import type { CalendarDay } from '../domain/monthMatrix.builder'

export type CalendarDayCellProps = {
  day: CalendarDay
  isSelected: boolean
  isInRange: boolean
  onSelect: () => void
  tabIndex: number
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  ariaLabel: string
  isToday: boolean
  children?: ReactNode
  className?: string
}

export const isSelectionActivationKey = (key: string): 'enter' | 'space' | null => {
  if (key === 'Enter') {
    return 'enter'
  }

  if (key === ' ') {
    return 'space'
  }

  return null
}

export const buildDayCellKeyDownHandler = ({
  onSelect,
  onKeyDown,
}: {
  onSelect: () => void
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void
}) => {
  return (event: KeyboardEvent<HTMLElement>) => {
    const activation = isSelectionActivationKey(event.key)

    if (activation === 'enter') {
      onSelect()
    }

    if (activation === 'space') {
      event.preventDefault()
      onSelect()
    }

    onKeyDown?.(event)
  }
}

export const CalendarDayCell = forwardRef<HTMLDivElement, CalendarDayCellProps>(
  (
    {
      day,
      isSelected,
      isInRange,
      onSelect,
      tabIndex,
      onKeyDown,
      onMouseEnter,
      onMouseLeave,
      ariaLabel,
      isToday,
      children,
      className,
    },
    ref,
  ) => {
    const handleKeyDown = buildDayCellKeyDownHandler({ onSelect, onKeyDown })

    const dayKey = getCalendarDayKey(day.date)

    return (
      <div
        ref={ref}
        role='gridcell'
        tabIndex={tabIndex}
        aria-selected={isSelected}
        aria-current={isToday ? 'date' : undefined}
        aria-label={ariaLabel}
        data-day-key={dayKey}
        data-outside-month={day.isCurrentMonth ? undefined : 'true'}
        data-selected={isSelected ? 'true' : undefined}
        data-in-range={isInRange ? 'true' : undefined}
        onClick={onSelect}
        onKeyDown={handleKeyDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={className}
      >
        {children}
      </div>
    )
  },
)

CalendarDayCell.displayName = 'CalendarDayCell'
