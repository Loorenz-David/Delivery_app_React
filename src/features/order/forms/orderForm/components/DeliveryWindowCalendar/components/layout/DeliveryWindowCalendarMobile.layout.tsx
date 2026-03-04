import type { ReactNode } from 'react'

type DeliveryWindowCalendarMobileLayoutProps = {
  calendar: ReactNode
  selectedDatesCard: ReactNode
  selectedWindowsCard: ReactNode
  editor: ReactNode
}

export const DeliveryWindowCalendarMobileLayout = ({
  calendar,
  selectedDatesCard,
  selectedWindowsCard,
  editor,
}: DeliveryWindowCalendarMobileLayoutProps) => {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      {calendar}
      {selectedDatesCard}
      {selectedWindowsCard}
      {editor}
    </div>
  )
}
