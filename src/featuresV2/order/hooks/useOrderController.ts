import { useCallback } from 'react'

import { useMessageManager } from '@/message_manager'
import { upsertRouteSolutionStops } from '@/featuresV2/plan/planTypes/localDelivery/store/routeSolutionStop.store'

import { useCreateOrder, useDeleteOrder, useUpdateOrder as useUpdateOrderApi } from '../api/orderApi'
import { normalizeOrderStopResponse } from '../domain/orderStopResponse'

import {
  removeOrderByClientId,
  setOrder,
  selectOrderByClientId,
  updateOrderByClientId,
  useOrderStore,
} from '../store/orderStore'
import type { Order, OrderUpdateFields } from '../types/order'

export type SaveOrderParams = {
  mode: 'create' | 'edit'
  action?:boolean
  clientId?: string
  fields: OrderUpdateFields
}

export const useOrderController = () => {
  const createOrder = useCreateOrder()
  const deleteOrderApi = useDeleteOrder()
  const updateOrderApi = useUpdateOrderApi()
  
  const { showMessage } = useMessageManager()

  const saveOrder = useCallback(
    async ({ mode, clientId, fields }: SaveOrderParams) => {
      

      try {
        if (mode === 'create') {
          const baseOrder = fields as Order
          if (!baseOrder.client_id) {
            showMessage({ status: 400, message: 'Order client id is missing.' })
            return false
          }

          const response = await createOrder(baseOrder)
          const created = response.data?.order?.[baseOrder.client_id]
          const normalizedStops = normalizeOrderStopResponse(response.data?.order_stop)

          if (normalizedStops) {
            upsertRouteSolutionStops(normalizedStops)
          }

          setOrder({
            ...baseOrder,
            ...created,
          })
          return true
        }

        if (!clientId) {
          showMessage({ status: 400, message: 'Order client id is missing.' })
          return false
        }

        const existing = selectOrderByClientId(clientId)(useOrderStore.getState())
        if (!existing || !existing.id) {
          showMessage({ status: 404, message: 'Order not found for update.' })
          return false
        }

        await updateOrderApi({ target_id: existing.id, fields })
        updateOrderByClientId(clientId, (order) => ({ ...order, ...fields }))
        return true
      } catch (error) {
        console.error('Failed to save order', error)
        showMessage({ status: 500, message: 'Unable to save order.' })
        return false
      }
    },
    [createOrder, showMessage, updateOrderApi],
  )

  const deleteOrderByServerId = useCallback(
    async (serverId: number, clientId: string) => {
      if (!serverId) {
        showMessage({ status: 400, message: 'Order server id is missing.' })
        return false
      }

      try {
        await deleteOrderApi({ target_id: serverId })
        removeOrderByClientId(clientId)
        showMessage({ status: 200, message: 'Order deleted successfully.' })
        return true
      } catch (error) {
        console.error('Failed to delete order', error)
        showMessage({ status: 500, message: 'Unable to delete order.' })
        return false
      }
    },
    [deleteOrderApi, showMessage],
  )

  return {
    saveOrder,
    deleteOrderByServerId,
  }
}
