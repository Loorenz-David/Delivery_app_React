import { createEntityStore } from '@/store/StoreFactory'
import type { EntityTable } from '@/store/StoreFactory'
import { selectAll, selectByClientId, selectByServerId, selectVisible } from '@/store/entitySelectors'

import type { Order, OrderMap } from '../types/order'

export const useOrderStore = createEntityStore<Order>()

export const selectAllOrders = (state: EntityTable<Order>) => selectAll<Order>()(state)

export const selectVisibleOrders = (state: EntityTable<Order>) => selectVisible<Order>()(state)

export const selectOrderByClientId = (clientId: string | null | undefined) =>
  (state: EntityTable<Order>) => selectByClientId<Order>(clientId)(state)

export const selectOrderByServerId = (id: number | null | undefined) =>
  (state: EntityTable<Order>) => selectByServerId<Order>(id)(state)

export const selectOrdersByPlanId = (planId: number | null | undefined) =>
  (state: EntityTable<Order>) => {
    if (planId == null) return []
    return state.allIds.reduce<Order[]>((acc, clientId) => {
      const order = state.byClientId[clientId]
      if (order?.delivery_plan_id === planId) {
        acc.push(order)
      }
      return acc
    }, [])
  }

export const setOrder = (order: Order) => useOrderStore.getState().insert(order)

export const setVisibleOrders = (clientIds: string[] | null) =>
  useOrderStore.getState().setVisibleIds(clientIds)

export const addVisibleOrder = (clientId: string) => {
  const { visibleIds, setVisibleIds } = useOrderStore.getState()
  if (!visibleIds) return
  if (visibleIds.includes(clientId)) return
  setVisibleIds([clientId, ...visibleIds])
}

export const setOrders = (table: OrderMap) => useOrderStore.getState().insertMany(table)

export const updateOrderByClientId = (clientId: string, updater: (order: Order) => Order) =>
  useOrderStore.getState().update(clientId, updater)


export const setOrderPlanId = (clientId: string, planId: number | null) =>
  useOrderStore.getState().update(clientId, (order) => ({
    ...order,
    delivery_plan_id: planId,
  }))

export const clearOrders = () => useOrderStore.getState().clear()
export const removeOrderByClientId = (clientId: string) => useOrderStore.getState().remove(clientId)

export const upsertOrder = (order: Order) => {
  const state = useOrderStore.getState()
  if (state.byClientId[order.client_id]) {
    state.update(order.client_id, (existing) => ({ ...existing, ...order }))
    return
  }
  state.insert(order)
}

export const upsertOrders = (table: OrderMap) => {
  table.allIds.forEach((clientId) => {
    const order = table.byClientId[clientId]
    if (order) {
      upsertOrder(order)
    }
  })
}
