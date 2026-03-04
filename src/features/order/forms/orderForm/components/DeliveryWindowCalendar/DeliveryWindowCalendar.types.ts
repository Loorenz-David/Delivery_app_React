import type { CalendarSelectionMode } from '@/shared/calendar'

export type DeliveryWindowCalendarMode = Exclude<CalendarSelectionMode, 'readonly'>

export const DELIVERY_WINDOW_CALENDAR_MODE_OPTIONS: Array<{
  label: string
  value: DeliveryWindowCalendarMode
}> = [
  { label: 'Date', value: 'single' },
  { label: 'Dates', value: 'multiple' },
  { label: 'Range', value: 'range' },
]
