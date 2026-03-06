import { useMemo } from 'react'

import type { Order } from '../../types/order'
import { DraggableOrderCard } from '../cards/DraggableOrderCard'
import { buildOrderAddressGroups } from '../../domain/orderAddressGroup.flow'
import { DraggableOrderAddressGroupCard } from '../cards/DraggableOrderAddressGroupCard'
import { useOrderGroupUIActions, useOrderGroupUIStore } from '../../store/orderGroupUI.store'

type OrderListProps = {
  orders: Order[]
  isSelectionMode?: boolean
  isOrderSelected?: (order: Order) => boolean
  onToggleSelection?: (order: Order) => void
  onEditOrder?: (order: Order) => void
  onOpenOrder?: (order: Order) => void
  onArchive?:(order:Order) => void
  onUnarchive?: (order: Order) => void
  hoveredClientId?: string | null
  onOrderMouseEnter?: (order: Order) => void
  onOrderMouseLeave?: () => void
}

export const OrderList = ({
  orders,
  isSelectionMode = false,
  isOrderSelected,
  onToggleSelection,
  onOpenOrder,
  onArchive,
  onUnarchive,
  hoveredClientId,
  onOrderMouseEnter,
  onOrderMouseLeave,
}: OrderListProps) => {
  const groups = useMemo(() => buildOrderAddressGroups(orders), [orders])
  const expandedGroupsByKey = useOrderGroupUIStore((state) => state.expandedGroupsByKey)
  const { toggleGroup } = useOrderGroupUIActions()

  if (orders.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-gray-500">No orders found</p>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col gap-4 overflow-x-hidden px-2 pb-10 pt-4 h-full">
      {groups.map((group) => {
        if (group.orders.length <= 1) {
          const order = group.orders[0]
          if (!order) return null
          return (
            <DraggableOrderCard
              key={order.client_id}
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
          )
        }

        const uiKey = `order:${group.key}`
        const expanded = expandedGroupsByKey[uiKey] ?? false

        return (
          <DraggableOrderAddressGroupCard
            key={group.key}
            group={group}
            expanded={expanded}
            onToggleExpanded={() => toggleGroup(uiKey)}
            isSelectionMode={isSelectionMode}
            isOrderSelected={isOrderSelected}
            onToggleSelection={onToggleSelection}
            onOpenOrder={onOpenOrder}
            onArchive={onArchive}
            onUnarchive={onUnarchive}
            hoveredClientId={hoveredClientId}
            onOrderMouseEnter={onOrderMouseEnter}
            onOrderMouseLeave={onOrderMouseLeave}
          />
        )
      })}
    </div>
  )
}
