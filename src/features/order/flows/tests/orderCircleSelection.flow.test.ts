import type { Order } from '../../types/order'

import { buildOrderSelectionFromClientIds } from '../orderCircleSelection.flow'

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message)
  }
}

export const runOrderCircleSelectionFlowTests = () => {
  const byClientId: Record<string, Order> = {
    syncedA: { client_id: 'syncedA', id: 101 },
    syncedB: { client_id: 'syncedB', id: 102 },
    unsynced: { client_id: 'unsynced' },
  }

  const selection = buildOrderSelectionFromClientIds(
    ['syncedA', 'syncedA', 'unsynced', 'missing', 'syncedB'],
    byClientId,
  )

  assert(selection.clientIds.length === 4, 'should deduplicate client ids while preserving unique values')
  assert(selection.serverIds.length === 2, 'should include only synced order server ids')
  assert(selection.serverIds[0] === 101, 'should map first synced server id')
  assert(selection.serverIds[1] === 102, 'should map second synced server id')
  assert(selection.unsyncedCount === 2, 'should count unsynced and missing selected orders')
}
