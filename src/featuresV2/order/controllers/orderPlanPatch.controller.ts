import { useCallback } from 'react'

import { useOrderStore } from '../store/order.store'

type PatchOrdersPlanParams = {
  orderServerIds: number[]
  planId: number
  planType: string
}

export const useOrderPlanPatchController = () => {
  const patchOrdersPlanByServerIds = useCallback(
    ({ orderServerIds, planId, planType }: PatchOrdersPlanParams) => {
      if (!Array.isArray(orderServerIds) || orderServerIds.length === 0) {
        return {
          patchedClientIds: [],
          skippedServerIds: [],
        }
      }

      if (!Number.isFinite(planId)) {
        return {
          patchedClientIds: [],
          skippedServerIds: Array.from(new Set(orderServerIds.filter((id) => Number.isFinite(id)))),
        }
      }

      const state = useOrderStore.getState()
      const uniqueServerIds = Array.from(new Set(orderServerIds.filter((id) => Number.isFinite(id))))
      const patchedClientIds: string[] = []
      const skippedServerIds: number[] = []

      uniqueServerIds.forEach((serverId) => {
        const clientId = state.idIndex[serverId]
        if (!clientId || !state.byClientId[clientId]) {
          skippedServerIds.push(serverId)
          return
        }
        patchedClientIds.push(clientId)
      })

      if (patchedClientIds.length > 0) {
        state.patchMany(patchedClientIds, {
          delivery_plan_id: planId,
          order_plan_objective: planType,
        })
      }

      return {
        patchedClientIds,
        skippedServerIds,
      }
    },
    [],
  )

  return {
    patchOrdersPlanByServerIds,
  }
}

