import type { RefObject } from 'react'

import { ChevronDownIcon } from '@/assets/icons'

import type { LocalDeliveryOverlayMetric } from './LocalDeliveryStatsOverlay.types'
import { HalfGaugeStat } from './HalfGaugeStat'

type LocalDeliveryStatsMetricsRowProps = {
  metrics: LocalDeliveryOverlayMetric[]
  compact: boolean
  showScrollHint: boolean
  scrollContainerRef: RefObject<HTMLDivElement | null>
}

export const LocalDeliveryStatsMetricsRow = ({
  metrics,
  compact,
  showScrollHint,
  scrollContainerRef,
}: LocalDeliveryStatsMetricsRowProps) => (
  <div className="pointer-events-none relative w-full">
    <div
      ref={scrollContainerRef}
      className={`flex w-full items-stretch gap-4 ${
        compact
          ? 'pointer-events-auto overflow-x-auto scroll-thin pr-8'
          : 'overflow-visible'
      }`}
    >
      {metrics.map((metric) => (
        metric.type === 'gauge'
          ? (
            <HalfGaugeStat
              key={metric.id}
              label={metric.label}
              value={metric.value}
              displayValue={metric.displayValue}
              accentClassName={metric.accentClassName}
            />
            )
          : (
            <div
              key={metric.id}
              className="flex h-full min-w-[180px] shrink-0 flex-col items-center justify-between rounded-2xl px-4 py-5 text-sm text-white"
            >
              <div className="rounded-full border border-white/65 bg-black/34 px-5 py-2 text-sm font-semibold text-white">
                {metric.displayValue}
              </div>
              <span className="text-sm font-semibold text-white/96">{metric.label}</span>
            </div>
            )
      ))}
    </div>

    {compact && showScrollHint ? (
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center pr-1">
        <div className="rounded-full bg-black/35 p-2 text-white shadow-lg">
          <ChevronDownIcon className="-rotate-90 h-4 w-4 text-white/90" />
        </div>
      </div>
    ) : null}
  </div>
)
