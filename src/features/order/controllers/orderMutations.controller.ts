import { useCallback } from 'react'

import { ApiError } from '@/lib/api/ApiClient'
import { useMessageHandler } from '@/shared/message-handler'
import {
  removeRouteSolutionStopsByOrderId,
  selectRouteSolutionStopsByOrderId,
  useRouteSolutionStopStore,
  upsertRouteSolutionStops,
} from '@/features/plan/planTypes/localDelivery/store/routeSolutionStop.store'
import { upsertRouteSolution } from '@/features/plan/planTypes/localDelivery/store/routeSolution.store'

import { useUpdateOrderDeliveryPlan as useUpdateOrderDeliveryPlanApi } from '../api/orderApi'
import { normalizeOrderStopResponse } from '../domain/orderStopResponse'
import {
  setOrder,
  selectOrderByClientId,
  selectOrderByServerId,
  setOrderPlanId,
  useOrderStore,
} from '../store/order.store'

export const useOrderMutations = () => {
  const updateOrderDeliveryPlanApi = useUpdateOrderDeliveryPlanApi()
  const { showMessage } = useMessageHandler()

  const updateOrderDeliveryPlan = useCallback(
    async (orderId: number | string, planId: number | string | null) => {
      if (planId == null) {
        showMessage({ status: 400, message: 'Missing delivery plan id.' })
        return null
      }
      
      const order = typeof orderId === 'string'
        ? selectOrderByClientId(orderId)(useOrderStore.getState())
        : selectOrderByServerId(orderId)(useOrderStore.getState())

        
      if (!order) {
        showMessage({ status: 404, message: 'Order not found for plan update.' })
        return null
      }

      if (!order.id) {
        showMessage({ status: 400, message: 'Order must be synced before plan update.' })
        return null
      }

      const parsedPlanId = typeof planId === 'number' ? planId : Number(planId)
      if (Number.isNaN(parsedPlanId)) {
        showMessage({ status: 400, message: 'Invalid delivery plan id.' })
        return null
      }

      const previousPlanId = order.delivery_plan_id ?? null
      const previousStops = selectRouteSolutionStopsByOrderId(order.id)(
        useRouteSolutionStopStore.getState(),
      )
      setOrderPlanId(order.client_id, parsedPlanId)
      removeRouteSolutionStopsByOrderId(order.id)

      try {
        const response = await updateOrderDeliveryPlanApi(order.id, parsedPlanId)
        const updatedBundles = response.data?.updated ?? []
        updatedBundles.forEach((bundle) => {
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

        return response.data
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Unable to update order plan.'
        const status = error instanceof ApiError ? error.status : 500
        setOrderPlanId(order.client_id, previousPlanId)
        if (previousStops.length) {
          const rollbackStops = {
            byClientId: Object.fromEntries(
              previousStops
                .filter((stop) => !!stop?.client_id)
                .map((stop) => [stop.client_id, stop]),
            ),
            allIds: previousStops
              .map((stop) => stop.client_id)
              .filter((clientId): clientId is string => !!clientId),
          }
          if (rollbackStops.allIds.length) {
            upsertRouteSolutionStops(rollbackStops)
          }
        }
        showMessage({ status, message })
        return null
      }
    },
    [showMessage, updateOrderDeliveryPlanApi],
  )

  return {
    updateOrderDeliveryPlan,
  }
}
