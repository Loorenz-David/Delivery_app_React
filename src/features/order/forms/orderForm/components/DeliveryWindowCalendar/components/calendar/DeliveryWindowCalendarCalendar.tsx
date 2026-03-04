import {
  CalendarRoot,
  type CalendarModel,
} from '@/shared/calendar'
import type { CostumerOperatingHours } from '@/features/costumer'
import type { DeliveryWindowDisplayRow } from '../../../../flows/orderFormDeliveryWindows.flow'
import { formatDateInTimeZone, isDayClosedByOperatingHours } from '../../../../flows/orderFormDeliveryWindows.flow'
import { DeliveryWindowCalendarDayCell } from './DeliveryWindowCalendarDayCell'
import { DeliveryWindowCalendarDayPopover } from './DeliveryWindowCalendarDayPopover'
import type { DeliveryWindowCalendarDayPopoverState } from '../../DeliveryWindowCalendarDayPopover.action'
import { getDeliveryWindowsForLocalDate } from '../../DeliveryWindowCalendarDayWindows.flow'

type DeliveryWindowCalendarCalendarProps = {
  model: CalendarModel
  operatingHours: CostumerOperatingHours[]
  timeZone: string
  windowsByDate: Record<string, DeliveryWindowDisplayRow[]>
  activePopover: DeliveryWindowCalendarDayPopoverState | null
  onOpenWindowsPopover: (dayKey: string) => void
  onOpenClosedWarningPopover: (dayKey: string) => void
  onScheduleClosePopover: () => void
  onKeepPopoverOpen: () => void
  onClosePopoverNow: () => void
  onAddWindowForDate: (localDate: string) => void
  onRemoveWindow: (row: DeliveryWindowDisplayRow) => void
  onEditWindow: (row: DeliveryWindowDisplayRow) => void
  isPopoverBlocked: boolean
  disableAddWindow: boolean
}

export const DeliveryWindowCalendarCalendar = ({
  model,
  operatingHours,
  timeZone,
  windowsByDate,
  activePopover,
  onOpenWindowsPopover,
  onOpenClosedWarningPopover,
  onScheduleClosePopover,
  onKeepPopoverOpen,
  onClosePopoverNow,
  onAddWindowForDate,
  onRemoveWindow,
  onEditWindow,
  isPopoverBlocked,
  disableAddWindow,
}: DeliveryWindowCalendarCalendarProps) => {
  return (
    <div className="overflow-hidden rounded-md border border-[var(--color-border-accent)] bg-[var(--color-page)]">
      <CalendarRoot
        model={model}
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
          const localDate = formatDateInTimeZone(params.date, timeZone)
          const dayKey = localDate
          const rows = getDeliveryWindowsForLocalDate({
            windowsByDate,
            localDate,
          })
          const windowCount = rows.length

          const closedByHours = isDayClosedByOperatingHours({
            date: params.date,
            operatingHours,
            timeZone,
          })

          const isPopoverOpen = activePopover?.dayKey === dayKey

          return (
            <DeliveryWindowCalendarDayPopover
              open={isPopoverOpen}
              onOpenChange={(next) => {
                if (!next) {
                  onClosePopoverNow()
                }
              }}
              localDate={localDate}
              rows={rows}
              kind={isPopoverOpen ? activePopover.kind : 'windows'}
              onMouseEnterContent={onKeepPopoverOpen}
              onMouseLeaveContent={onScheduleClosePopover}
              onRemoveWindow={onRemoveWindow}
              onEditWindow={onEditWindow}
              onAddWindow={onAddWindowForDate}
              disableAdd={disableAddWindow || closedByHours}
              reference={
                <DeliveryWindowCalendarDayCell
                  day={params.day}
                  isSelected={params.isSelected}
                  isInRange={params.isInRange && !closedByHours}
                  tabIndex={params.tabIndex}
                  ariaLabel={params.ariaLabel}
                  isToday={params.isToday}
                  isCurrentMonth={params.isCurrentMonth}
                  isClosed={closedByHours}
                  windowCount={windowCount}
                  onSelect={() => {
                    if (closedByHours) {
                      onOpenClosedWarningPopover(dayKey)
                      return
                    }
                    params.onSelect()
                  }}
                  onMouseEnter={() => {
                    params.onMouseEnter?.()
                    if (closedByHours) {
                      return
                    }
                    if (windowCount > 0 && !isPopoverBlocked) {
                      onOpenWindowsPopover(dayKey)
                    }
                  }}
                  onMouseLeave={() => {
                    params.onMouseLeave?.()
                    onScheduleClosePopover()
                  }}
                />
              }
            />
          )
        }}
      />
    </div>
  )
}
