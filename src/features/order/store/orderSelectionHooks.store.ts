import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'

import type { Order } from '../types/order'
import { useOrderSelectionStore } from './orderSelection.store'
import { useOrderStore } from './order.store'

export const buildSelectedOrdersSummary = (selectedIds: string[], byClientId: Record<string, Order>) => {
  const orders = selectedIds.reduce<Order[]>((acc, clientId) => {
    const order = byClientId[clientId]
    if (order) {
      acc.push(order)
    }
    return acc
  }, [])

  const totalWeight = orders.reduce((acc, order) => acc + (order.total_weight ?? 0), 0)
  const totalItems = orders.reduce((acc, order) => acc + (order.total_items ?? 0), 0)
  const totalVolume = orders.reduce((acc, order) => acc + (order.total_volume ?? 0), 0)

  return {
    count: orders.length,
    orders,
    totalWeight,
    totalItems,
    totalVolume,
  }
}

export const useOrderSelectionMode = () => useOrderSelectionStore((state) => state.isSelectionMode)

export const useSelectedOrderClientIds = () => useOrderSelectionStore((state) => state.selectedClientIds)

export const useSelectedOrderServerIds = () => useOrderSelectionStore((state) => state.selectedServerIds)

export const useOrderSelectionActions = () =>
  useOrderSelectionStore(
    useShallow((state) => ({
      enableSelectionMode: state.enableSelectionMode,
      disableSelectionMode: state.disableSelectionMode,
      setSelectedOrders: state.setSelectedOrders,
      clearSelection: state.clearSelection,
    })),
  )

export const useSelectedOrdersSummary = () => {
  const selectedClientIds = useSelectedOrderClientIds()
  const byClientId = useOrderStore((state) => state.byClientId)

  return useMemo(
    () => buildSelectedOrdersSummary(selectedClientIds, byClientId),
    [byClientId, selectedClientIds],
  )
}
