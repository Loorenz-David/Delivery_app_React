import { useCallback } from 'react'

import { ApiError } from '@/lib/api/ApiClient'
import { useMessageHandler } from '@/shared/message-handler'

import {
  removeRouteSolutionStopsByOrderId,
  upsertRouteSolutionStops,
} from '@/features/plan/planTypes/localDelivery/store/routeSolutionStop.store'
import { upsertRouteSolution } from '@/features/plan/planTypes/localDelivery/store/routeSolution.store'

import { useUpdateOrdersDeliveryPlanBatch } from '../api/orderApi'
import { normalizeOrderStopResponse } from '../domain/orderStopResponse'
import { useOrderSelectionStore } from '../store/orderSelection.store'
import { setOrder } from '../store/order.store'
import { createOrderOptimisticSnapshot, restoreOrderOptimisticSnapshot } from '../utils/orderOptimisticSnapshot'
import type { OrderBatchSelectionPayload } from '../types/orderBatchSelection'
import { useOrderPlanPatchController } from './orderPlanPatch.controller'

type UpdateOrdersDeliveryPlanBatchParams = {
  planId: number
  planType: string
  selection: OrderBatchSelectionPayload
}

export const useOrderBatchDeliveryPlanController = () => {
  const updateOrdersDeliveryPlanBatchApi = useUpdateOrdersDeliveryPlanBatch()
  const { patchOrdersPlanByServerIds } = useOrderPlanPatchController()
  const { showMessage } = useMessageHandler()

  const updateOrdersDeliveryPlanBatch = useCallback(
    async ({ planId, planType, selection }: UpdateOrdersDeliveryPlanBatchParams) => {
      const state = useOrderSelectionStore.getState()
      const loadedSelectionIds = state.loadedSelectionIds
      const snapshot = createOrderOptimisticSnapshot()

      patchOrdersPlanByServerIds({
        orderServerIds: loadedSelectionIds,
        planId,
        planType,
      })

      try {
        const response = await updateOrdersDeliveryPlanBatchApi(planId, selection)
        const payload = response.data
        const bundles = payload?.updated_bundles ?? []

        bundles.forEach((bundle) => {
          const updatedOrder = bundle?.order
          if (!updatedOrder?.id) return

          setOrder(updatedOrder)
          removeRouteSolutionStopsByOrderId(updatedOrder.id)

          const normalizedStops = normalizeOrderStopResponse(bundle.order_stops)
          if (normalizedStops) {
            upsertRouteSolutionStops(normalizedStops)
          }

          const changedSolutions = bundle.route_solution ?? []
          changedSolutions.forEach((solution) => {
            if (solution?.client_id) {
              upsertRouteSolution(solution)
            }
          })
        })

        const resolvedCount = payload?.resolved_count ?? 0
        const updatedCount = payload?.updated_count ?? 0
        if (resolvedCount > 0 && updatedCount < resolvedCount) {
          showMessage({
            status: 'warning',
            message: 'Some orders were skipped because they changed during the operation.',
          })
        }

        useOrderSelectionStore.getState().disableSelectionMode()
        return payload ?? null
      } catch (error) {
        restoreOrderOptimisticSnapshot(snapshot)
        const message = error instanceof ApiError ? error.message : 'Unable to move selected orders.'
        const status = error instanceof ApiError ? error.status : 500
        showMessage({ status, message })
        return null
      }
    },
    [patchOrdersPlanByServerIds, showMessage, updateOrdersDeliveryPlanBatchApi],
  )

  return {
    updateOrdersDeliveryPlanBatch,
  }
}
