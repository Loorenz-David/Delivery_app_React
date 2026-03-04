import type { ReactNode } from 'react'
import type { DeliveryWindowCalendarDensity } from './DeliveryWindowCalendarDensity.flow'

type DeliveryWindowCalendarDesktopLayoutProps = {
  calendar: ReactNode
  editor: ReactNode
  selectedDatesCard: ReactNode
  selectedWindowsCard: ReactNode
  density: DeliveryWindowCalendarDensity
}

export const DeliveryWindowCalendarDesktopLayout = ({
  calendar,
  editor,
  selectedDatesCard,
  selectedWindowsCard,
  density,
}: DeliveryWindowCalendarDesktopLayoutProps) => {
  const rightColumn = density === 'compact' ? 'minmax(132px,34%)' : 'minmax(150px,36%)'
  const gap = density === 'compact' ? 'gap-2' : 'gap-3'

  return (
    <div className={`grid ${gap}`} style={{ gridTemplateColumns: `minmax(0,1fr) ${rightColumn}` }}>
      <div className="flex min-w-0 flex-col gap-3">
        {calendar}
        {editor}
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        {selectedDatesCard}
        {selectedWindowsCard}
      </div>
    </div>
  )
}
