import type { RouteSolutionStopMap } from '@/features/plan/planTypes/localDelivery/types/routeSolutionStop'

import type { OrderStopResponseMap } from '../types/order'

export const normalizeOrderStopResponse = (
  payload: OrderStopResponseMap | null | undefined,
): RouteSolutionStopMap | null => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const byClientId: RouteSolutionStopMap['byClientId'] = {}
  const allIds: string[] = []

  Object.entries(payload).forEach(([, entry]) => {
    if (!entry || typeof entry !== 'object' || !('client_id' in entry)) {
      return
    }

    const clientId = entry.client_id
    if (typeof clientId !== 'string' || !clientId) {
      return
    }

    byClientId[clientId] = entry
    if (!allIds.includes(clientId)) {
      allIds.push(clientId)
    }
  })

  if (!allIds.length) {
    return null
  }

  return { byClientId, allIds }
}
