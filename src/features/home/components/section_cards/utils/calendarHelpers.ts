import type { RoutePayload } from '../../../types/backend'

export type CalendarCell = {
  dateKey: string
  label: number | null
  inCurrentMonth: boolean
  routes: RoutePayload[]
}

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

export function getDayLabels() {
  return DAY_LABELS
}

export function normalizeDateKey(value: string | null | undefined) {
  if (!value) return 'Unknown'
  return value.split('T')[0] ?? value
}

export function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDate(value: string) {
  const parts = value.split('-').map((v) => Number(v))
  if (parts.length === 3) {
    const [year, month, day] = parts
    return new Date(year, month - 1, day)
  }
  return new Date(value)
}

export function buildCalendarMatrix(reference: Date, routes: RoutePayload[]): CalendarCell[][] {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1)
  const startDay = (start.getDay() + 6) % 7 // Monday first
  const firstCellDate = new Date(start)
  firstCellDate.setDate(start.getDate() - startDay)

  const routesByDate = routes.reduce<Record<string, RoutePayload[]>>((acc, route) => {
    const key = normalizeDateKey(route.delivery_date)
    if (!acc[key]) acc[key] = []
    acc[key].push(route)
    return acc
  }, {})

  const matrix: CalendarCell[][] = []
  for (let week = 0; week < 6; week++) {
    const row: CalendarCell[] = []
    for (let day = 0; day < 7; day++) {
      const cellDate = new Date(firstCellDate)
      cellDate.setDate(firstCellDate.getDate() + week * 7 + day)
      const dateKey = formatDateKey(cellDate)
      const inCurrentMonth = cellDate.getMonth() === reference.getMonth()
      row.push({
        dateKey,
        label: cellDate.getMonth() === reference.getMonth() ? cellDate.getDate() : null,
        inCurrentMonth,
        routes: routesByDate[dateKey] ?? [],
      })
    }
    matrix.push(row)
  }
  return matrix
}

export function formatMonthLabel(date: Date) {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}
