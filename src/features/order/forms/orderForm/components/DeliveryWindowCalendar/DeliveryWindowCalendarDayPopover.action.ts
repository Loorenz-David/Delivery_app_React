import { useCallback, useRef } from 'react'

export type DeliveryWindowCalendarDayPopoverState = {
  dayKey: string
  kind: 'windows' | 'closed-warning'
}

export const useDeliveryWindowCalendarDayPopoverActions = ({
  isBlocked,
  setActivePopover,
}: {
  isBlocked: boolean
  setActivePopover: (state: DeliveryWindowCalendarDayPopoverState | null) => void
}) => {
  const closeTimerRef = useRef<number | null>(null)

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const openWindowsPopover = useCallback(
    (dayKey: string) => {
      if (isBlocked) {
        return
      }
      clearCloseTimer()
      setActivePopover({ dayKey, kind: 'windows' })
    },
    [clearCloseTimer, isBlocked, setActivePopover],
  )

  const openClosedWarningPopover = useCallback(
    (dayKey: string) => {
      clearCloseTimer()
      setActivePopover({ dayKey, kind: 'closed-warning' })
    },
    [clearCloseTimer, setActivePopover],
  )

  const scheduleClose = useCallback(() => {
    clearCloseTimer()
    closeTimerRef.current = window.setTimeout(() => {
      setActivePopover(null)
      closeTimerRef.current = null
    }, 120)
  }, [clearCloseTimer, setActivePopover])

  const closePopoverNow = useCallback(() => {
    clearCloseTimer()
    setActivePopover(null)
  }, [clearCloseTimer, setActivePopover])

  return {
    openWindowsPopover,
    openClosedWarningPopover,
    scheduleClose,
    clearCloseTimer,
    closePopoverNow,
  }
}
