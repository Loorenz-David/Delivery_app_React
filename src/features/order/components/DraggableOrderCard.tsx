import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

import type { Order } from '@/features/order/types/order'


import { OrderCard } from './OrderCard'

type DraggableOrderCardProps = {
  order: Order
  onOpen?: (order: Order) => void
  onArchive?:(order: Order)=> void
  onUnarchive?: (order: Order) => void
  isHovered?: boolean
  onMouseEnter?: (order: Order) => void
  onMouseLeave?: () => void
}

export const DraggableOrderCard = ({
  order,
  onOpen,
  onArchive,
  onUnarchive,
  isHovered = false,
  onMouseEnter,
  onMouseLeave,
}: DraggableOrderCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: order.client_id,
    data: {
      type: 'order',
      id: order.client_id,
      order,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    cursor: 'grab',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onMouseEnter={() => onMouseEnter?.(order)}
      onMouseLeave={() => onMouseLeave?.()}
      {...attributes}
      {...listeners}
    >
      <OrderCard
        order={order}
        onOpen={onOpen}
        onArchive={onArchive}
        onUnarchive={onUnarchive}
        isHovered={isHovered}
      />
    </div>
  )
}
