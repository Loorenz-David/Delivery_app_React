import type { Order } from '../types/order'
import { DraggableOrderCard } from './DraggableOrderCard'

type OrderListProps = {
  orders: Order[]
  onEditOrder?: (order: Order) => void
  onOpenOrder?: (order: Order) => void
  onArchive?:(order:Order) => void
  onUnarchive?: (order: Order) => void
}

export const OrderList = ({ orders, onOpenOrder, onArchive, onUnarchive }: OrderListProps) => {
  if (orders.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-gray-500">No orders found</p>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col gap-4 overflow-x-hidden px-2 pb-10 pt-4 h-full">
      {orders.map((order) => (
        <DraggableOrderCard
          key={order.client_id}
          order={order}
          onOpen={onOpenOrder}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
        />
      ))}
    </div>
  )
}
