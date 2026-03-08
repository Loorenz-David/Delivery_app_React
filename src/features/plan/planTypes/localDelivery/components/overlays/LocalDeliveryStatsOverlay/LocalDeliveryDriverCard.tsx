import { useState } from 'react'

import { ChevronDownIcon } from '@/assets/icons'
import { cn } from '@/lib/utils/cn'
import { MemberAvatar } from '@/shared/layout/MemberAvatar'

import type { LocalDeliveryDriverOverlayStats } from './LocalDeliveryStatsOverlay.types'

type LocalDeliveryDriverCardProps = {
  driver: LocalDeliveryDriverOverlayStats
}

export const LocalDeliveryDriverCard = ({ driver }: LocalDeliveryDriverCardProps) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <button
      type="button"
      onClick={() => setExpanded((current) => !current)}
      aria-expanded={expanded}
      className="pointer-events-auto flex min-w-[132px] shrink-0 flex-col items-center rounded-[24px] border border-white/65 bg-white/8 px-4 py-4 text-sm text-white backdrop-blur-md transition-colors hover:bg-white/12"
    >
      <MemberAvatar
        username={driver.initials}
        className="mb-2 h-14 w-14 bg-white/18 p-0 text-xl text-white"
      />
      <span className="text-sm font-semibold leading-none text-white">{driver.name}</span>
      <span className="mt-1 text-sm font-medium text-white/82">{driver.registration}</span>
      <span className="mt-2 flex items-center gap-1 text-xs font-medium uppercase tracking-[0.2em] text-white/65">
        Driver
        <ChevronDownIcon className={cn('h-3.5 w-3.5 transition-transform', expanded ? 'rotate-180' : 'rotate-0')} />
      </span>
      {expanded ? (
        <div className="mt-3 w-full rounded-xl border border-white/12 bg-black/10 px-3 py-2 text-left text-xs text-white/72">
          Driver stats will be added here.
        </div>
      ) : null}
    </button>
  )
}
