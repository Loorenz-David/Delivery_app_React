import type { CostumerOperatingHours } from '@/features/costumer'
import {
  getCalendarDayKey,
  type CalendarRangeValue,
  type CalendarValue,
} from '@/shared/calendar'

import {
  resolveOperatingDayAvailability,
} from '../../flows/orderFormDeliveryWindows.flow'
import type { DeliveryWindowCalendarMode } from './DeliveryWindowCalendar.types'

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
  mode: DeliveryWindowCalendarMode
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

export const formatSelectionRange = (range: CalendarRangeValue) => {
  const startLabel = range.start ? getCalendarDayKey(range.start) : 'not set'
  const endLabel = range.end ? getCalendarDayKey(range.end) : 'not set'
  return `${startLabel} -> ${endLabel}`
}

export const resolveDefaultTimesForSelection = ({
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

export const isDeliveryWindowSelectionInProgress = ({
  mode,
  selectionValue,
  isEditorOpen,
}: {
  mode: DeliveryWindowCalendarMode
  selectionValue: CalendarValue
  isEditorOpen: boolean
}) => {
  if (isEditorOpen) {
    return false
  }

  if (mode === 'range') {
    const candidate =
      selectionValue &&
      typeof selectionValue === 'object' &&
      !Array.isArray(selectionValue) &&
      'start' in selectionValue
        ? (selectionValue as CalendarRangeValue)
        : null
    return Boolean(candidate?.start && !candidate?.end)
  }

  if (mode === 'multiple') {
    return false
  }

  return false
}
