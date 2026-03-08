import type { LocalDeliveryDriverOverlayStats, LocalDeliveryRouteSummaryStats } from './LocalDeliveryStatsOverlay.types'
import { InlineRouteMetric } from './InlineRouteMetric'
import { LocalDeliveryDriverCard } from './LocalDeliveryDriverCard'

type LocalDeliveryStatsTopSummaryProps = {
  routeSummary: LocalDeliveryRouteSummaryStats
  driver: LocalDeliveryDriverOverlayStats
}

export const LocalDeliveryStatsTopSummary = ({
  routeSummary,
  driver,
}: LocalDeliveryStatsTopSummaryProps) => (
  <div className="pointer-events-none flex w-full flex-wrap items-start justify-between gap-4">
    <div className="flex min-w-0 flex-1 flex-wrap items-center  gap-6 rounded-[28px] bg-black/34 px-4 py-3">
      <InlineRouteMetric label="km" value={routeSummary.distanceLabel} />
      <InlineRouteMetric label="h:m" value={routeSummary.durationLabel} />
      <InlineRouteMetric label="pickups" value={String(routeSummary.pickupCount)} />
      <InlineRouteMetric label="dropoffs" value={String(routeSummary.dropoffCount)} />
    </div>

    <LocalDeliveryDriverCard driver={driver} />
  </div>
)
