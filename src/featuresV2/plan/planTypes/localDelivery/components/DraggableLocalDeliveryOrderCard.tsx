import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import type { Order } from '@/featuresV2/order/types/order'
import type { RouteSolutionStop } from '@/featuresV2/plan/planTypes/localDelivery/types/routeSolutionStop'

import { LocalDeliveryOrderCard } from './LocalDeliveryOrderCard'

type DraggableLocalDeliveryOrderCardProps = {
  order: Order
  stop: RouteSolutionStop
  displayStopOrder?: number | null
  planStartDate?: string | null
}


export const DraggableLocalDeliveryOrderCard = ({
  order,
  stop,
  displayStopOrder,
  planStartDate,
}: DraggableLocalDeliveryOrderCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: stop.client_id,
    data: {
      type: 'route_stop',
      id:stop.client_id,
      order,
      stop,
      planStartDate,
      routeStopId: stop.id,
      routeStopClientId: stop.client_id,
      routeSolutionId: stop.route_solution_id,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: 'grab',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LocalDeliveryOrderCard
        order={order}
        stop={stop}
        displayStopOrder={displayStopOrder}
        planStartDate={planStartDate}
      />
    </div>
  )
}
