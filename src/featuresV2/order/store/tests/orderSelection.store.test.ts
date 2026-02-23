import type { Order } from '../../types/order'

import { buildSelectedOrdersSummary } from '../orderSelectionHooks.store'
import { useOrderSelectionStore } from '../orderSelection.store'

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message)
  }
}

export const runOrderSelectionStoreTests = () => {
  useOrderSelectionStore.setState({
    isSelectionMode: false,
    selectedClientIds: [],
    selectedServerIds: [],
    enableSelectionMode: useOrderSelectionStore.getState().enableSelectionMode,
    disableSelectionMode: useOrderSelectionStore.getState().disableSelectionMode,
    setSelectedOrders: useOrderSelectionStore.getState().setSelectedOrders,
    clearSelection: useOrderSelectionStore.getState().clearSelection,
  })

  const actions = useOrderSelectionStore.getState()

  actions.enableSelectionMode()
  assert(useOrderSelectionStore.getState().isSelectionMode, 'enableSelectionMode should set mode true')

  actions.setSelectedOrders({ clientIds: ['a', 'b', 'a'], serverIds: [1, 2, 1] })
  assert(
    useOrderSelectionStore.getState().selectedClientIds.length === 2,
    'setSelectedOrders should deduplicate client ids',
  )
  assert(
    useOrderSelectionStore.getState().selectedServerIds.length === 2,
    'setSelectedOrders should deduplicate server ids',
  )

  actions.clearSelection()
  assert(useOrderSelectionStore.getState().selectedClientIds.length === 0, 'clearSelection should empty client ids')
  assert(useOrderSelectionStore.getState().selectedServerIds.length === 0, 'clearSelection should empty server ids')

  actions.setSelectedOrders({ clientIds: ['x'], serverIds: [10] })
  actions.disableSelectionMode()
  assert(!useOrderSelectionStore.getState().isSelectionMode, 'disableSelectionMode should set mode false')
  assert(
    useOrderSelectionStore.getState().selectedClientIds.length === 0,
    'disableSelectionMode should clear selected client ids',
  )
  assert(
    useOrderSelectionStore.getState().selectedServerIds.length === 0,
    'disableSelectionMode should clear selected server ids',
  )

  const byClientId: Record<string, Order> = {
    a: { client_id: 'a', total_weight: 4, total_items: 2, total_volume: 8 },
    b: { client_id: 'b', total_weight: null, total_items: undefined, total_volume: null },
  }

  const summary = buildSelectedOrdersSummary(['a', 'b', 'missing'], byClientId)
  assert(summary.count === 2, 'summary should count only existing selected orders')
  assert(summary.totalWeight === 4, 'summary totalWeight should fallback null/undefined to zero')
  assert(summary.totalItems === 2, 'summary totalItems should fallback null/undefined to zero')
  assert(summary.totalVolume === 8, 'summary totalVolume should fallback null/undefined to zero')
}
