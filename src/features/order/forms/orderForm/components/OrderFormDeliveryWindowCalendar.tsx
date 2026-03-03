import { useMemo, useState } from 'react'

import {
  CalendarDayCell,
  CalendarRoot,
  getCalendarDayKey,
  type CalendarRangeValue,
  type CalendarValue,
  type CalendarSelectionMode,
  useCalendarModel,
} from '@/shared/calendar'

type ActiveMode = Exclude<CalendarSelectionMode, 'readonly'>

const MODE_OPTIONS: Array<{ label: string; value: ActiveMode }> = [
  { label: 'Date', value: 'single' },
  { label: 'Dates', value: 'multiple' },
  { label: 'Range', value: 'range' },
]

const isDate = (value: unknown): value is Date => value instanceof Date && !Number.isNaN(value.getTime())

const isRange = (value: CalendarValue): value is CalendarRangeValue => {
  return !!value && typeof value === 'object' && !Array.isArray(value) && 'start' in value && 'end' in value
}

const formatRange = (range: CalendarRangeValue) => {
  const startLabel = range.start ? getCalendarDayKey(range.start) : 'not set'
  const endLabel = range.end ? getCalendarDayKey(range.end) : 'not set'

  return `${startLabel} -> ${endLabel}`
}

export const OrderFormDeliveryWindowCalendar = ({ compact = false }: { compact?: boolean }) => {
  const [mode, setMode] = useState<ActiveMode>('single')
  const [singleValue, setSingleValue] = useState<Date | null>(null)
  const [multipleValue, setMultipleValue] = useState<Date[]>([])
  const [rangeValue, setRangeValue] = useState<CalendarRangeValue>({ start: null, end: null })

  const calendarValue = useMemo<CalendarValue>(() => {
    if (mode === 'single') {
      return singleValue
    }

    if (mode === 'multiple') {
      return multipleValue
    }

    return rangeValue
  }, [mode, singleValue, multipleValue, rangeValue])

  const model = useCalendarModel({
    selectionMode: mode,
    value: calendarValue,
    onChange: (nextValue) => {
      if (mode === 'single') {
        setSingleValue(isDate(nextValue) ? nextValue : null)
        return
      }

      if (mode === 'multiple') {
        setMultipleValue(Array.isArray(nextValue) ? nextValue.filter(isDate) : [])
        return
      }

      setRangeValue(isRange(nextValue) ? nextValue : { start: null, end: null })
    },
  })

  const helperText = useMemo(() => {
    if (mode === 'single') {
      return singleValue ? `Selected date: ${getCalendarDayKey(singleValue)}` : 'Select one date.'
    }

    if (mode === 'multiple') {
      return multipleValue.length > 0
        ? `Selected dates: ${multipleValue.map((date) => getCalendarDayKey(date)).join(', ')}`
        : 'Select one or more dates.'
    }

    return `Selected range: ${formatRange(rangeValue)}`
  }, [mode, singleValue, multipleValue, rangeValue])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {MODE_OPTIONS.map((option) => {
          const isActive = option.value === mode

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setMode(option.value)}
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

      <div className="overflow-hidden rounded-xl border border-[var(--color-border-accent)] bg-[var(--color-page)]">
        <CalendarRoot
          model={model}
          renderHeader={(calendarModel) => {
            const monthLabel = calendarModel.visibleMonth.toLocaleDateString(undefined, {
              month: 'long',
              year: 'numeric',
            })

            return (
              <div className="flex items-center justify-between border-b border-[var(--color-border-accent)] bg-[var(--color-page)] px-3 py-2">
                <button
                  type="button"
                  onClick={calendarModel.prevMonth}
                  aria-label="Previous month"
                  className="rounded-md border border-[var(--color-border-accent)] px-2 py-1 text-xs text-[var(--color-muted)] transition-colors hover:bg-[var(--color-border-accent)]/40 hover:text-[var(--color-text)]"
                >
                  Prev
                </button>

                <div className="text-sm font-semibold text-[var(--color-text)]">{monthLabel}</div>

                <button
                  type="button"
                  onClick={calendarModel.nextMonth}
                  aria-label="Next month"
                  className="rounded-md border border-[var(--color-border-accent)] px-2 py-1 text-xs text-[var(--color-muted)] transition-colors hover:bg-[var(--color-border-accent)]/40 hover:text-[var(--color-text)]"
                >
                  Next
                </button>
              </div>
            )
          }}
          renderDay={(params) => {
            return (
              <CalendarDayCell
                day={params.day}
                isSelected={params.isSelected}
                isInRange={params.isInRange}
                onSelect={params.onSelect}
                tabIndex={params.tabIndex}
                onMouseEnter={params.onMouseEnter}
                onMouseLeave={params.onMouseLeave}
                ariaLabel={params.ariaLabel}
                isToday={params.isToday}
                className={`flex h-10 items-center justify-center border-t border-r border-[var(--color-border-accent)] text-xs outline-none transition-colors ${
                  params.isSelected
                    ? 'bg-[var(--color-dark-blue)] text-[var(--color-page)]'
                    : params.isInRange
                      ? 'bg-[var(--color-primary)]/10 text-[var(--color-text)]'
                      : 'bg-transparent text-[var(--color-text)]'
                } ${!params.isCurrentMonth ? 'text-[var(--color-muted)]/50' : ''}`}
              >
                {params.date.getDate()}
              </CalendarDayCell>
            )
          }}
        />
      </div>

      <p className={`text-[var(--color-muted)] ${compact ? 'text-[10px]' : 'text-xs'}`}>{helperText}</p>
    </div>
  )
}
