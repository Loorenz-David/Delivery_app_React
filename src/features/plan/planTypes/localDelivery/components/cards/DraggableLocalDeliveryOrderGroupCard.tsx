import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

import type { LocalDeliveryAddressGroup } from '@/features/plan/planTypes/localDelivery/domain/localDeliveryAddressGroup.flow'
import { LocalDeliveryOrderGroupCard } from './LocalDeliveryOrderGroupCard'

type DraggableLocalDeliveryOrderGroupCardProps = {
  group: LocalDeliveryAddressGroup
  expanded: boolean
  onToggleExpanded: () => void
  planStartDate?: string | null
  projectedStopOrderByClientId?: Map<string, number> | null
  allOrderedStopClientIds: string[]
}

export const DraggableLocalDeliveryOrderGroupCard = ({
  group,
  expanded,
  onToggleExpanded,
  planStartDate,
  projectedStopOrderByClientId,
  allOrderedStopClientIds,
}: DraggableLocalDeliveryOrderGroupCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `route_stop_group:${group.key}`,
    data: {
      type: 'route_stop_group',
      groupKey: group.key,
      label: group.label,
      orderIds: group.orderIds,
      orderCount: group.entries.length,
      routeStopIds: group.routeStopIds,
      routeStopClientIds: group.routeStopClientIds,
      routeSolutionId: group.routeSolutionId,
      anchorStopId: group.anchorStopId,
      anchorStopClientId: group.anchorStopClientId,
      allOrderedStopClientIds,
      firstStopOrder: group.firstStopOrder,
      lastStopOrder: group.lastStopOrder,
      minEta: group.minEta,
      maxEta: group.maxEta,
      order: group.entries[0]?.order,
      stop: group.entries[0]?.stop,
      planStartDate,
    },
  })

  const { setNodeRef: setDropRef } = useDroppable({
    id: `route_stop_group_drop:${group.key}`,
    data: {
      type: 'route_stop_group_drop',
      anchorStopClientId: group.anchorStopClientId,
      anchorStopId: group.anchorStopId,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.45 : 1,
    cursor: 'grab',
  }

  return (
    <div
      ref={(node) => {
        setNodeRef(node)
        setDropRef(node)
      }}
      style={style}
    >
      <LocalDeliveryOrderGroupCard
        group={group}
        expanded={expanded}
        onToggleExpanded={onToggleExpanded}
        planStartDate={planStartDate}
        projectedStopOrderByClientId={projectedStopOrderByClientId}
        dragAttributes={attributes}
        dragListeners={listeners}
      />
    </div>
  )
}
