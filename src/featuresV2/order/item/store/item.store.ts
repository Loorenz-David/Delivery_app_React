import { useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { createEntityStore } from '@/store/StoreFactory'
import type { EntityTable } from '@/store/StoreFactory'
import { selectAll, selectByClientId, selectByServerId } from '@/store/entitySelectors'

import type { Item, ItemMap } from '../types'

export const useItemStore = createEntityStore<Item>()

export const selectAllItems = (state: EntityTable<Item>) => selectAll<Item>()(state)

export const selectItemByClientId = (clientId: string | null | undefined) =>
  (state: EntityTable<Item>) => selectByClientId<Item>(clientId)(state)

export const selectItemByServerId = (id: number | null | undefined) =>
  (state: EntityTable<Item>) => selectByServerId<Item>(id)(state)

export const selectItemsByOrderId = (orderId: number | null | undefined) =>
  (state: EntityTable<Item>) => {
    if (orderId == null) return []

    return state.allIds
      .map((clientId) => state.byClientId[clientId])
      .filter((item) => item.order_id === orderId)
  }

export const useItems = () => useItemStore(useShallow(selectAllItems))

export const useItemByClientId = (clientId: string | null | undefined) =>
  useItemStore(selectItemByClientId(clientId))

export const useItemByServerId = (id: number | null | undefined) =>
  useItemStore(selectItemByServerId(id))

export const useItemsByOrderId = (orderId: number | null | undefined) =>
  useItemStore(useShallow(selectItemsByOrderId(orderId)))

export const setItem = (item: Item) => useItemStore.getState().insert(item)

export const setItems = (table: ItemMap) => useItemStore.getState().insertMany(table)

export const updateItemByClientId = (clientId: string, updater: (item: Item) => Item) =>
  useItemStore.getState().update(clientId, updater)

export const removeItemByClientId = (clientId: string) => useItemStore.getState().remove(clientId)

export const clearItems = () => useItemStore.getState().clear()

export const useSetItem = () =>
  useCallback((item: Item) => {
    setItem(item)
  }, [])

export const useSetItems = () =>
  useCallback((table: ItemMap) => {
    setItems(table)
  }, [])

export const useUpdateItem = () =>
  useCallback(
    (clientId: string, updater: (item: Item) => Item) => {
      updateItemByClientId(clientId, updater)
    },
    [],
  )

export const useRemoveItem = () =>
  useCallback((clientId: string) => {
    removeItemByClientId(clientId)
  }, [])
