export function formatTimeLabel(value?: string | null): string | null {
  if (!value) {
    return null
  }
  const parsed = Date.parse(value)
  if (!Number.isNaN(parsed)) {
    const date = new Date(parsed)
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`
  }
  const timeOnly = value.match(/^(\d{1,2}):(\d{2})/)
  if (timeOnly) {
    const hours = Number(timeOnly[1])
    const minutes = Number(timeOnly[2])
    if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
      return `${pad(hours)}:${pad(minutes)}`
    }
  }
  return value
}

function pad(value: number) {
  return value.toString().padStart(2, '0')
}

export function normalizeDateKey(value?: string | null): string {
  if (!value) {
    return 'Unknown'
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown'
  }
  return parsed.toISOString().split('T')[0]
}

export function normalizeWeekKey(value: string | null | undefined) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) {
    return { key: 'week-unknown', weekNumber: null as number | null, year: null as number | null }
  }
  const { weekNumber, year } = getISOWeek(date)
  return {
    key: `week-${year}-${weekNumber}`,
    weekNumber,
    year,
  }
}

function getISOWeek(date: Date) {
  const target = new Date(date.valueOf())
  const dayNr = (date.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = new Date(target.getFullYear(), 0, 4)
  const diff = (target.valueOf() - firstThursday.valueOf()) / 86400000
  const weekNumber = 1 + Math.floor(diff / 7)
  const year = target.getFullYear()
  return { weekNumber, year }
}
