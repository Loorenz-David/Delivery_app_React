import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

import type { Order } from '@/featuresV2/order/types/order'


import { OrderCard } from './OrderCard'

type DraggableOrderCardProps = {
  order: Order
  onOpen?: (order: Order) => void
}

export const DraggableOrderCard = ({
  order,
  onOpen,
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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <OrderCard
        order={order}
        onOpen={onOpen}
      />
    </div>
  )
}
