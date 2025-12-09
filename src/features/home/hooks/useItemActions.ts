import { useCallback, useMemo } from 'react'

import { ApiError } from '../../../lib/api/ApiClient'
import { useMessageManager } from '../../../message_manager/MessageManagerContext'
import { useResourceManager } from '../../../resources_manager/resourcesManagerContext'
import { useDataManager } from '../../../resources_manager/managers/DataManager'
import { UpdateItemService } from '../api/deliveryService'
import { deriveOrderStateFromItems } from '../utils/orderState'
import type { ItemPayload, OrderPayload, RoutePayload } from '../types/backend'

interface UseItemActionsArgs {
  route?: RoutePayload | null
  routeId?: number | null
}

type ItemActionHandler = (order: OrderPayload | null, action: string, itemId: number, data?: unknown) => void

export function useItemActions({ route, routeId }: UseItemActionsArgs): { handleItemAction: ItemActionHandler } {
  const routesDataManager = useResourceManager('routesDataManager')
  const optionDataManager = useResourceManager('optionDataManager')
  const popupManager = useResourceManager('popupManager')
  const optionSnapshot = useDataManager(optionDataManager)
  const { showMessage } = useMessageManager()
  const updateItemService = useMemo(() => new UpdateItemService(), [])
  const resolvedRouteId = route?.id ?? routeId ?? null

  const applyItemUpdate = useCallback(
    (order: OrderPayload, itemId: number, pendingFields: Partial<ItemPayload>, updatedItem?: ItemPayload | null) => {
      const targetRouteId = route?.id ?? routeId ?? order.route_id ?? null
      if (!order || targetRouteId == null) {
        return
      }
      const baseRoute =
        route ??
        routesDataManager.find<RoutePayload>(targetRouteId, {
          collectionKey: 'routes',
          targetKey: 'id',
        }) ??
        null
      if (!baseRoute) {
        return
      }

      const updatedItems = (order.delivery_items ?? []).map((item) =>
        item.id === itemId ? { ...item, ...pendingFields, ...(updatedItem ?? {}) } : item,
      )
      const derivedOrderState = deriveOrderStateFromItems(updatedItems, optionSnapshot.dataset?.item_states_map ?? {})
      const derivedOrderStateName = derivedOrderState?.name ?? null
      const nextOrder: OrderPayload = {
        ...order,
        order_state: derivedOrderStateName ?? order.order_state ?? null,
        delivery_items: updatedItems,
      }
      const nextOrders = (baseRoute.delivery_orders ?? []).map((entry) =>
        entry.id === nextOrder.id ? nextOrder : entry,
      )

      routesDataManager.updateDataset((dataset) => {
        if (!dataset) {
          return dataset
        }
        const nextRoutes = dataset.routes.map((entry) =>
          entry.id === targetRouteId
            ? {
                ...entry,
                delivery_orders: nextOrders,
              }
            : entry,
        )
        return {
          ...dataset,
          routes: nextRoutes,
        }
      })

      routesDataManager.setActiveSelection('SelectedRoute', {
        id: targetRouteId,
        data: {
          ...baseRoute,
          delivery_orders: nextOrders,
        },
      })

      routesDataManager.setActiveSelection('SelectedOrder', {
        id: nextOrder.id,
        data: nextOrder,
        meta: { routeId: targetRouteId },
      })
    },
    [optionSnapshot.dataset?.item_states_map, route, routeId, routesDataManager],
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
        showMessage({
          status: response.status ?? 200,
          message: response.message ?? 'Item updated successfully.',
        })
      } catch (error) {
        const status = error instanceof ApiError ? error.status : 500
        const message = error instanceof ApiError && error.message ? error.message : 'Failed to update item.'
        showMessage({ status, message })
      }
    },
    [applyItemUpdate, showMessage, updateItemService],
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
