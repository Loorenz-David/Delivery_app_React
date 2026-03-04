import { useMemo, useState } from 'react'

import {
  CalendarDayCell,
  CalendarRoot,
  type CalendarRangeValue,
  type CalendarSelectionMode,
  type CalendarValue,
  getCalendarDayKey,
  useCalendarModel,
} from '@/shared/calendar'
import { CustomTimePicker } from '@/shared/inputs/CustomTimePicker'
import type { CostumerOperatingHours } from '@/features/costumer'

import { useOrderFormFormSlice } from '../context/OrderFormForm.context'
import { useOrderFormMetaSlice } from '../context/OrderFormMeta.context'
import {
  buildWindowsFromLocalDates,
  expandCalendarSelectionToLocalDates,
  formatDateInTimeZone,
  isDayClosedByOperatingHours,
  resolveOperatingDayAvailability,
  resolveOrderFormTimeZone,
  toDeliveryWindowDisplayRows,
} from '../flows/orderFormDeliveryWindows.flow'

type ActiveMode = Exclude<CalendarSelectionMode, 'readonly'>

const MODE_OPTIONS: Array<{ label: string; value: ActiveMode }> = [
  { label: 'Date', value: 'single' },
  { label: 'Dates', value: 'multiple' },
  { label: 'Range', value: 'range' },
]

const isDate = (value: unknown): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime())

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

const resolveDefaultTimesForSelection = ({
  localDates,
  operatingHours,
}: {
  localDates: string[]
  operatingHours: CostumerOperatingHours[]
}) => {
  if (!localDates.length) {
    return { startTime: null as string | null, endTime: null as string | null }
  }

  const slots = localDates
    .map((localDate) => resolveOperatingDayAvailability({ localDate, operatingHours }))
    .filter((slot) => slot.selectable)

  if (!slots.length) {
    return { startTime: null, endTime: null }
  }

  const sameBounds = slots.every(
    (slot) => slot.openTime === slots[0]?.openTime && slot.closeTime === slots[0]?.closeTime,
  )
  if (!sameBounds) {
    return { startTime: null, endTime: null }
  }

  return {
    startTime: slots[0]?.openTime ?? null,
    endTime: slots[0]?.closeTime ?? null,
  }
}

export const OrderFormDeliveryWindowCalendar = ({ compact = false }: { compact?: boolean }) => {
  const [mode, setMode] = useState<ActiveMode>('range')
  const [selectionValue, setSelectionValue] = useState<CalendarValue>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [startTime, setStartTime] = useState<string | null>(null)
  const [endTime, setEndTime] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const { formState, formSetters } = useOrderFormFormSlice()
  const { meta } = useOrderFormMetaSlice()
  const timeZone = useMemo(() => resolveOrderFormTimeZone(), [])
  const operatingHours = meta.selectedCostumer?.operating_hours ?? []

  const calendarModel = useCalendarModel({
    selectionMode: mode,
    value: selectionValue,
    onChange: (nextValue) => {
      setSelectionValue(nextValue)
      setMessage(null)
      const selectedDates = expandCalendarSelectionToLocalDates({
        mode,
        value: nextValue as Date | Date[] | { start: Date | null; end: Date | null } | null,
        timeZone,
      })
      if (!selectedDates.length) {
        return
      }
      const defaults = resolveDefaultTimesForSelection({
        localDates: selectedDates,
        operatingHours,
      })
      setStartTime(defaults.startTime)
      setEndTime(defaults.endTime)
      setIsEditorOpen(true)
    },
  })

  const selectedLocalDates = useMemo(
    () =>
      expandCalendarSelectionToLocalDates({
        mode,
        value: selectionValue as Date | Date[] | { start: Date | null; end: Date | null } | null,
        timeZone,
      }),
    [mode, selectionValue, timeZone],
  )

  const displayRows = useMemo(
    () => toDeliveryWindowDisplayRows(formState.delivery_windows, timeZone),
    [formState.delivery_windows, timeZone],
  )

  const helperText = useMemo(() => {
    if (mode === 'single') {
      const singleValue = selectionValue && !Array.isArray(selectionValue) && isDate(selectionValue)
        ? selectionValue
        : null
      return singleValue ? `Selected date: ${getCalendarDayKey(singleValue)}` : 'Select one date.'
    }

    if (mode === 'multiple') {
      if (!selectedLocalDates.length) {
        return 'Select one or more dates.'
      }
      return `Selected dates: ${selectedLocalDates.join(', ')}`
    }

    const rangeCandidate =
      selectionValue &&
      typeof selectionValue === 'object' &&
      !Array.isArray(selectionValue) &&
      'start' in selectionValue
        ? (selectionValue as CalendarRangeValue)
        : { start: null, end: null }
    return `Selected range: ${formatRange(rangeCandidate)}`
  }, [mode, selectedLocalDates, selectionValue])

  const applySelection = () => {
    const result = buildWindowsFromLocalDates({
      localDates: selectedLocalDates,
      startTime,
      endTime,
      existingWindows: formState.delivery_windows,
      operatingHours,
      timeZone,
    })
    if (result.error) {
      setMessage(result.error)
      return
    }
    formSetters.handleDeliveryWindows(result.nextWindows)
    setIsEditorOpen(false)
    setSelectionValue(null)
    if (result.skippedClosedDates.length) {
      setMessage(`Skipped closed days: ${result.skippedClosedDates.join(', ')}`)
    } else {
      setMessage(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {MODE_OPTIONS.map((option) => {
          const isActive = option.value === mode
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setMode(option.value)
                setSelectionValue(null)
              }}
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
          model={calendarModel}
          renderHeader={(calendar) => {
            const monthLabel = calendar.visibleMonth.toLocaleDateString(undefined, {
              month: 'long',
              year: 'numeric',
            })

            return (
              <div className="flex items-center justify-between border-b border-[var(--color-border-accent)] bg-[var(--color-page)] px-3 py-2">
                <button
                  type="button"
                  onClick={calendar.prevMonth}
                  aria-label="Previous month"
                  className="rounded-md border border-[var(--color-border-accent)] px-2 py-1 text-xs text-[var(--color-muted)] transition-colors hover:bg-[var(--color-border-accent)]/40 hover:text-[var(--color-text)]"
                >
                  Prev
                </button>

                <div className="text-sm font-semibold text-[var(--color-text)]">{monthLabel}</div>

                <button
                  type="button"
                  onClick={calendar.nextMonth}
                  aria-label="Next month"
                  className="rounded-md border border-[var(--color-border-accent)] px-2 py-1 text-xs text-[var(--color-muted)] transition-colors hover:bg-[var(--color-border-accent)]/40 hover:text-[var(--color-text)]"
                >
                  Next
                </button>
              </div>
            )
          }}
          renderDay={(params) => {
            const closedByHours = isDayClosedByOperatingHours({
              date: params.date,
              operatingHours,
              timeZone,
            })

            return (
              <CalendarDayCell
                day={params.day}
                isSelected={params.isSelected}
                isInRange={params.isInRange}
                onSelect={closedByHours ? () => undefined : params.onSelect}
                tabIndex={params.tabIndex}
                onMouseEnter={params.onMouseEnter}
                onMouseLeave={params.onMouseLeave}
                ariaLabel={params.ariaLabel}
                isToday={params.isToday}
                className={`relative flex h-12 items-center justify-center border-t border-r border-[var(--color-border-accent)] text-xs outline-none transition-colors ${
                  params.isSelected
                    ? 'bg-[var(--color-dark-blue)] text-[var(--color-page)]'
                    : params.isInRange
                      ? 'bg-[var(--color-primary)]/10 text-[var(--color-text)]'
                      : 'bg-transparent text-[var(--color-text)]'
                } ${!params.isCurrentMonth ? 'text-[var(--color-muted)]/50' : ''} ${
                  closedByHours ? 'bg-[var(--color-muted)]/10 text-[var(--color-muted)]' : ''
                }`}
              >
                <span>{params.date.getDate()}</span>
                {closedByHours ? (
                  <span className="absolute bottom-0.5 text-[9px] font-semibold uppercase tracking-wide">
                    Closed
                  </span>
                ) : null}
              </CalendarDayCell>
            )
          }}
        />
      </div>

      {isEditorOpen ? (
        <div className="rounded-xl border border-[var(--color-border-accent)] bg-[var(--color-page)] p-3">
          <div className="mb-2 text-xs font-semibold text-[var(--color-text)]">Set time window</div>
          <div className="mb-2 text-[11px] text-[var(--color-muted)]">
            {selectedLocalDates.length ? selectedLocalDates.join(', ') : 'No dates selected'}
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <CustomTimePicker
              selectedTime={startTime}
              onChange={(value) => setStartTime(value || null)}
            />
            <span className="text-xs text-[var(--color-muted)]">to</span>
            <CustomTimePicker
              selectedTime={endTime}
              onChange={(value) => setEndTime(value || null)}
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditorOpen(false)}
              className="rounded-md border border-[var(--color-border-accent)] px-3 py-1 text-xs text-[var(--color-muted)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={applySelection}
              className="rounded-md bg-[var(--color-dark-blue)] px-3 py-1 text-xs text-[var(--color-page)]"
            >
              Apply
            </button>
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-[var(--color-border-accent)] bg-[var(--color-page)] p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--color-text)]">Delivery windows</span>
          <button
            type="button"
            onClick={() => formSetters.handleDeliveryWindows([])}
            className="text-[10px] text-[var(--color-muted)] underline"
          >
            Clear all
          </button>
        </div>
        {displayRows.length ? (
          <div className="flex flex-col divide-y divide-[var(--color-border-accent)]">
            {displayRows.map((row) => (
              <div key={row.key} className="flex items-center justify-between py-2 text-xs">
                <div className="flex gap-2 text-[var(--color-text)]">
                  <span className="font-semibold">{row.date}</span>
                  <span>{row.start}</span>
                  <span>to</span>
                  <span>{row.end}</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    formSetters.handleDeliveryWindows(
                      formState.delivery_windows.filter((window) => {
                        if (row.clientId && window.client_id && row.clientId !== window.client_id) {
                          return true
                        }
                        return !(
                          window.start_at === row.startAtUtc &&
                          window.end_at === row.endAtUtc &&
                          window.window_type === row.windowType
                        )
                      }),
                    )
                  }
                  className="text-[10px] text-red-500"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-[var(--color-muted)]">No delivery windows selected yet.</div>
        )}
      </div>

      <p className={`text-[var(--color-muted)] ${compact ? 'text-[10px]' : 'text-xs'}`}>
        {message ?? helperText}
      </p>
    </div>
  )
}
