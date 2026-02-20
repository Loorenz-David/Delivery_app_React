import type { Order } from '../types/order'
import { DraggableOrderCard } from './DraggableOrderCard'

type OrderListProps = {
  orders: Order[]
  onEditOrder?: (order: Order) => void
  onOpenOrder?: (order: Order) => void
}

export const OrderList = ({ orders,  onOpenOrder }: OrderListProps) => {
  if (orders.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-gray-500">No orders found</p>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col gap-4 overflow-x-hidden px-2 pb-10 pt-4">
      {orders.map((order) => (
        <DraggableOrderCard key={order.client_id} order={order}  onOpen={onOpenOrder} />
      ))}
    </div>
  )
}
