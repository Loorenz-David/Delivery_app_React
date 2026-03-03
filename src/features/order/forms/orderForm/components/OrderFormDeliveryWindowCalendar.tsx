import { useMemo, useState } from 'react'

import {
  CalendarDayCell,
  CalendarRoot,
  getCalendarDayKey,
  type CalendarRangeValue,
  type CalendarSelectionMode,
  type CalendarValue,
  useCalendarModel,
} from '@/shared/calendar'

import { useOrderFormFormSlice } from '../context/OrderFormForm.context'

type ActiveMode = Exclude<CalendarSelectionMode, 'readonly'>

const MODE_OPTIONS: Array<{ label: string; value: ActiveMode }> = [
  { label: 'Date', value: 'single' },
  { label: 'Dates', value: 'multiple' },
  { label: 'Range', value: 'range' },
]

const isDate = (value: unknown): value is Date => value instanceof Date && !Number.isNaN(value.getTime())

const toDate = (value: string | null) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const toDateInputValue = (value: Date | null) => {
  if (!value) return null
  const year = value.getUTCFullYear()
  const month = String(value.getUTCMonth() + 1).padStart(2, '0')
  const day = String(value.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const resolveCalendarSelectionToBoundaryValues = ({
  mode,
  nextValue,
}: {
  mode: ActiveMode
  nextValue: CalendarValue
}) => {
  if (mode === 'single') {
    const date = isDate(nextValue) ? nextValue : null
    const nextBoundary = toDateInputValue(date)
    return { earliest: nextBoundary, latest: nextBoundary }
  }

  if (mode === 'multiple') {
    const dates = Array.isArray(nextValue) ? nextValue.filter(isDate) : []
    const sorted = dates.sort((a, b) => a.getTime() - b.getTime())
    return {
      earliest: toDateInputValue(sorted[0] ?? null),
      latest: toDateInputValue(sorted.at(-1) ?? null),
    }
  }

  const rangeCandidate =
    nextValue && typeof nextValue === 'object' && !Array.isArray(nextValue) && 'start' in nextValue
      ? (nextValue as CalendarRangeValue)
      : { start: null, end: null }

  return {
    earliest: toDateInputValue(rangeCandidate.start),
    latest: toDateInputValue(rangeCandidate.end),
  }
}

const formatRange = (range: CalendarRangeValue) => {
  const startLabel = range.start ? getCalendarDayKey(range.start) : 'not set'
  const endLabel = range.end ? getCalendarDayKey(range.end) : 'not set'

  return `${startLabel} -> ${endLabel}`
}

export const OrderFormDeliveryWindowCalendar = ({ compact = false }: { compact?: boolean }) => {
  const [mode, setMode] = useState<ActiveMode>('range')
  const { formState, formSetters } = useOrderFormFormSlice()

  const earliestDate = useMemo(() => toDate(formState.earliest_delivery_date), [formState.earliest_delivery_date])
  const latestDate = useMemo(() => toDate(formState.latest_delivery_date), [formState.latest_delivery_date])

  const calendarValue = useMemo<CalendarValue>(() => {
    if (mode === 'single') {
      return earliestDate
    }

    if (mode === 'multiple') {
      return [earliestDate, latestDate].filter((entry): entry is Date => entry instanceof Date)
    }

    return {
      start: earliestDate,
      end: latestDate,
    }
  }, [earliestDate, latestDate, mode])

  const model = useCalendarModel({
    selectionMode: mode,
    value: calendarValue,
    onChange: (nextValue) => {
      const boundaries = resolveCalendarSelectionToBoundaryValues({
        mode,
        nextValue,
      })

      formSetters.handleEarliestDate(boundaries.earliest)
      formSetters.handleLatestDate(boundaries.latest)
    },
  })

  const helperText = useMemo(() => {
    if (mode === 'single') {
      return earliestDate ? `Selected date: ${getCalendarDayKey(earliestDate)}` : 'Select one date.'
    }

    if (mode === 'multiple') {
      if (!earliestDate && !latestDate) {
        return 'Select one or more dates.'
      }

      const labels = [earliestDate, latestDate]
        .filter((entry): entry is Date => Boolean(entry))
        .map((entry) => getCalendarDayKey(entry))

      return `Selected dates: ${labels.join(', ')}`
    }

    return `Selected range: ${formatRange({ start: earliestDate, end: latestDate })}`
  }, [earliestDate, latestDate, mode])

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

      <div className="overflow-hidden rounded-md border border-[var(--color-border-accent)] bg-[var(--color-page)]">
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
