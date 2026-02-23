import { useCallback } from 'react'

import { ApiError } from '@/lib/api/ApiClient'
import { useMessageManager } from '@/message_manager'
import {
  removeRouteSolutionStopsByOrderId,
  upsertRouteSolutionStops,
} from '@/featuresV2/plan/planTypes/localDelivery/store/routeSolutionStop.store'

import { useUpdateOrderDeliveryPlan as useUpdateOrderDeliveryPlanApi } from '../api/orderApi'
import { normalizeOrderStopResponse } from '../domain/orderStopResponse'
import {
  selectOrderByClientId,
  selectOrderByServerId,
  setOrderPlanId,
  useOrderStore,
} from '../store/order.store'

export const useOrderMutations = () => {
  const updateOrderDeliveryPlanApi = useUpdateOrderDeliveryPlanApi()
  const { showMessage } = useMessageManager()

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
      setOrderPlanId(order.client_id, parsedPlanId)

      try {
        const response = await updateOrderDeliveryPlanApi(order.id, parsedPlanId)
        removeRouteSolutionStopsByOrderId(order.id)
        const normalizedStops = normalizeOrderStopResponse(response.data?.order_stop)

        if (normalizedStops) {
          upsertRouteSolutionStops(normalizedStops)
        }

        return response.data
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Unable to update order plan.'
        const status = error instanceof ApiError ? error.status : 500
        setOrderPlanId(order.client_id, previousPlanId)
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
