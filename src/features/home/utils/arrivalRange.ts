export function computeArrivalRange(expectedArrivalTime?: string | null, deliveryTimeRange?: number | string | null): string | null {
  if (!expectedArrivalTime) {
    return null
  }
  const rangeMinutes = normalizeRangeMinutes(deliveryTimeRange)
  if (rangeMinutes == null) {
    return null
  }
  const base = parseDateTime(expectedArrivalTime)
  if (!base) {
    return null
  }

  const start = new Date(base.getTime() - rangeMinutes * 60_000)
  const end = new Date(base.getTime() + rangeMinutes * 60_000)

  const roundedStart = roundToHalfHour(start, 'floor')
  const roundedEnd = roundToHalfHour(end, 'ceil')

  return `${formatTime(roundedStart)} - ${formatTime(roundedEnd)}`
}

function normalizeRangeMinutes(value?: number | string | null): number | null {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

function roundToHalfHour(date: Date, direction: 'floor' | 'ceil'): Date {
  const result = new Date(date)
  const totalMinutes = result.getHours() * 60 + result.getMinutes()
  const remainder = totalMinutes % 30
  const adjustment =
    remainder === 0
      ? 0
      : direction === 'floor'
        ? -remainder
        : 30 - remainder
  const roundedTotal = totalMinutes + adjustment
  result.setHours(0, 0, 0, 0)
  result.setMinutes(roundedTotal)
  return result
}

function parseDateTime(value: string): Date | null {
  const parsed = Date.parse(value)
  if (!Number.isNaN(parsed)) {
    return new Date(parsed)
  }
  const timeOnly = value.match(/^(\d{1,2}):(\d{2})/)
  if (timeOnly) {
    const hours = Number(timeOnly[1])
    const minutes = Number(timeOnly[2])
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return null
    }
    const now = new Date()
    now.setHours(hours, minutes, 0, 0)
    return now
  }
  return null
}

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}
