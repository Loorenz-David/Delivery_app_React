import type { Order } from '../../types/order'
import { DraggableOrderCard } from '../cards/DraggableOrderCard'

type OrderAddressGroupChildrenProps = {
  orders: Order[]
  isSelectionMode: boolean
  isOrderSelected?: (order: Order) => boolean
  onToggleSelection?: (order: Order) => void
  onOpenOrder?: (order: Order) => void
  onArchive?: (order: Order) => void
  onUnarchive?: (order: Order) => void
  hoveredClientId?: string | null
  onOrderMouseEnter?: (order: Order) => void
  onOrderMouseLeave?: () => void
}

export const OrderAddressGroupChildren = ({
  orders,
  isSelectionMode,
  isOrderSelected,
  onToggleSelection,
  onOpenOrder,
  onArchive,
  onUnarchive,
  hoveredClientId,
  onOrderMouseEnter,
  onOrderMouseLeave,
}: OrderAddressGroupChildrenProps) => (
  <div className="relative ml-6 mt-3 pl-6">
    {orders.length > 1 ? (
      <div className="pointer-events-none absolute bottom-2 left-1 top-2 w-px bg-[var(--color-border)]/70" />
    ) : null}

    <div className="flex flex-col gap-3">
      {orders.map((order) => (
        <div key={order.client_id} className="relative">
          {orders.length > 1 ? (
            <div className="pointer-events-none absolute -left-[19px] top-8 h-px w-4 bg-[var(--color-border)]/70" />
          ) : null}
          <DraggableOrderCard
            order={order}
            onOpen={isSelectionMode ? undefined : onOpenOrder}
            onArchive={onArchive}
            onUnarchive={onUnarchive}
            isHovered={hoveredClientId === order.client_id}
            onMouseEnter={onOrderMouseEnter}
            onMouseLeave={onOrderMouseLeave}
            isSelectionMode={isSelectionMode}
            isSelected={isOrderSelected?.(order) ?? false}
            onToggleSelection={onToggleSelection}
          />
        </div>
      ))}
    </div>
  </div>
)
