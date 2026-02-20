import { useDndContext } from '@dnd-kit/core'

import type { Order } from '@/featuresV2/order/types/order'
import { LocalDeliveryOrderCard } from '@/featuresV2/plan/planTypes/localDelivery/components/LocalDeliveryOrderCard'
import type { RouteSolutionStop } from '@/featuresV2/plan/planTypes/localDelivery/types/routeSolutionStop'

type RouteStopDragOverlayProps = {
  routeStopClientId: string
  order: Order
  stop: RouteSolutionStop
  planStartDate?: string | null
}

export const RouteStopDragOverlay = ({ routeStopClientId, order, stop, planStartDate }: RouteStopDragOverlayProps) => {
  const { active, over } = useDndContext()

  let displayStopOrder: number | null = typeof stop?.stop_order === 'number' ? stop.stop_order : null

  if (
    active?.data.current?.type === 'route_stop' &&
    over?.data.current?.type === 'route_stop' &&
    active.id === routeStopClientId
  ) {
    const overStop = over.data.current?.stop as RouteSolutionStop | undefined
    if (typeof overStop?.stop_order === 'number') {
      displayStopOrder = overStop.stop_order
    }
  }

  return (
    <LocalDeliveryOrderCard
      order={order}
      stop={stop ?? null}
      displayStopOrder={displayStopOrder}
      planStartDate={planStartDate}
    />
  )
}
