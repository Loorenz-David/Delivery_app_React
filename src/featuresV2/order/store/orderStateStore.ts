import { useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { createEntityStore } from '@/store/StoreFactory'
import type { EntityTable } from '@/store/StoreFactory'
import { selectAll, selectByClientId, selectByServerId } from '@/store/entitySelectors'

import type { OrderState, OrderStateMap } from '../types/orderState'

export const useOrderStateStore = createEntityStore<OrderState>()

export const selectAllOrderStates = (state: EntityTable<OrderState>) => selectAll<OrderState>()(state)

export const selectOrderStateByClientId = (clientId: string | null | undefined) =>
  (state: EntityTable<OrderState>) => selectByClientId<OrderState>(clientId)(state)

export const selectOrderStateByServerId = (id: number | null | undefined) =>
  (state: EntityTable<OrderState>) => selectByServerId<OrderState>(id)(state)

export const useOrderStates = () => useOrderStateStore(useShallow(selectAllOrderStates))

export const useOrderStateByClientId = (clientId: string | null | undefined) =>
  useOrderStateStore(selectOrderStateByClientId(clientId))

export const useOrderStateByServerId = (id: number | null | undefined) =>
  useOrderStateStore(selectOrderStateByServerId(id))

export const setOrderState = (orderState: OrderState) => useOrderStateStore.getState().insert(orderState)

export const insertOrderStates = (table: OrderStateMap) => useOrderStateStore.getState().insertMany(table)

export const updateOrderStateByClientId = (
  clientId: string,
  updater: (orderState: OrderState) => OrderState,
) => useOrderStateStore.getState().update(clientId, updater)

export const clearOrderStates = () => useOrderStateStore.getState().clear()

export const useSetOrderStateStore = () =>
  useCallback((orderState: OrderState) => {
    setOrderState(orderState)
  }, [])

export const useSetOrderStatesStore = () =>
  useCallback((table: OrderStateMap) => {
    insertOrderStates(table)
  }, [])

export const useUpdateOrderStateStore = () =>
  useCallback(
    (clientId: string, updater: (orderState: OrderState) => OrderState) => {
      updateOrderStateByClientId(clientId, updater)
    },
    [],
  )
