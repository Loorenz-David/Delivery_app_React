import { useCallback, useMemo } from 'react'

import { UpdateItemService } from '../api/deliveryService'
import { deriveOrderStateFromItems } from '../utils/orderState'
import type { ItemPayload, OrderPayload, RoutePayload } from '../types/backend'
import { useHomeStore } from '../../../store/home/useHomeStore'
import { useResourceManager } from '../../../resources_manager/resourcesManagerContext'

interface UseItemActionsArgs {
  route?: RoutePayload | null
  routeId?: number | null
}

type ItemActionHandler = (order: OrderPayload | null, action: string, itemId: number, data?: unknown) => void

export function useItemActions({ route, routeId }: UseItemActionsArgs): { handleItemAction: ItemActionHandler } {
  const popupManager = useResourceManager('popupManager')
  const updateItemService = useMemo(() => new UpdateItemService(), [])
  const resolvedRouteId = route?.id ?? routeId ?? null
  const { updateOrderInRoute, selectOrder, findRouteById, mapItemStates } = useHomeStore.getState()

  const applyItemUpdate = useCallback(
    (order: OrderPayload, itemId: number, pendingFields: Partial<ItemPayload>, updatedItem?: ItemPayload | null) => {
      const targetRouteId = route?.id ?? routeId ?? order.route_id ?? null
      if (!order || targetRouteId == null) {
        return
      }
      const baseRoute = route ?? findRouteById(targetRouteId)
      if (!baseRoute) {
        return
      }

      const updatedItems = (order.delivery_items ?? []).map((item) =>
        item.id === itemId ? { ...item, ...pendingFields, ...(updatedItem ?? {}) } : item,
      )
      const derivedOrderState = deriveOrderStateFromItems(updatedItems, mapItemStates())
      const derivedOrderStateName = derivedOrderState?.name ?? null
      const nextOrder: OrderPayload = {
        ...order,
        order_state: derivedOrderStateName ?? order.order_state ?? null,
        delivery_items: updatedItems,
      }
      updateOrderInRoute(targetRouteId, nextOrder.id, () => nextOrder)
      selectOrder(nextOrder.id, { routeId: targetRouteId })
    },
    [findRouteById, mapItemStates, route, routeId, selectOrder, updateOrderInRoute],
  )

  const updateItemInline = useCallback(
    async (order: OrderPayload, itemId: number, fields: Partial<ItemPayload>) => {
      if (!order) {
        return
      }
      try {
        const response = await updateItemService.updateItem({
          id: itemId,
          fields,
        })
        const payload = response.data
        const resolvedItem =
          payload && typeof payload === 'object' && 'instance' in (payload as Record<string, unknown>)
            ? ((payload as { instance: ItemPayload }).instance ?? null)
            : (payload as ItemPayload | null | undefined)
        applyItemUpdate(order, itemId, fields, resolvedItem)
      } catch (error) {
        console.error('Failed to update item inline', error)
      }
    },
    [applyItemUpdate, updateItemService],
  )

  const handleItemAction = useCallback<ItemActionHandler>(
    (order, action, itemId, data) => {
      if (!order) {
        return
      }
      const targetRouteId = resolvedRouteId ?? order.route_id ?? null
      if (action === 'edit') {
        popupManager?.open({
          key: 'FillOrder',
          payload: { mode: 'edit', orderId: order.id, itemId, routeId: targetRouteId ?? undefined },
        })
        return
      }

      if (action === 'change_state' || action === 'change_position') {
        if (!data || typeof data !== 'object') {
          return
        }
        const fields = data as Partial<ItemPayload>
        updateItemInline(order, itemId, fields)
      }
    },
    [popupManager, resolvedRouteId, updateItemInline],
  )

  return { handleItemAction }
}
