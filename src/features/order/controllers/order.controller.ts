import { useCallback } from 'react'

import { useMessageHandler } from '@/shared/message-handler'
import { upsertRouteSolutionStops } from '@/features/plan/planTypes/localDelivery/store/routeSolutionStop.store'

import {
  useCreateOrder,
  useDeleteOrder,
  useUpdateOrder as useUpdateOrderApi,
  useArchiveOrder as useArchiveOrderApi,
  useUnarchiveOrder as useUnarchiveOrderApi,
} from '../api/orderApi'
import { normalizeOrderStopResponse } from '../domain/orderStopResponse'

import {
  addVisibleOrder,
  removeOrderByClientId,
  setOrder,
  selectOrderByClientId,
  updateOrderByClientId,
  useOrderStore,
} from '../store/order.store'
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
  const archiveOrderApi = useArchiveOrderApi()
  const unarchiveOrderApi = useUnarchiveOrderApi()
  
  const { showMessage } = useMessageHandler()

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
          addVisibleOrder(baseOrder.client_id)
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

  const archiveOrder = useCallback(
    async (clientId:string, orderId?:number)=>{
      if(!orderId){
        showMessage({status:"warning", message:"Order can't be archive yet"})
      }
      try{
        const response = await archiveOrderApi({target_id: orderId})
        const archiveResponse = response?.data as
          | { archive_at?: string | null; order?: { archive_at?: string | null } }
          | undefined
        const archiveAt =
          archiveResponse?.archive_at ??
          archiveResponse?.order?.archive_at ??
          new Date().toISOString()
        
        updateOrderByClientId(clientId, (order) => ({ ...order, archive_at: archiveAt }))
        showMessage({ status: 200, message: 'Order archived successfully.' })
      }catch(error){
        console.error('Failed to archive order', error)
        showMessage({ status: 500, message: 'Unable to archive order.' })
        return false
      }
    },
    []
  )

  const unarchiveOrder = useCallback(
    async (clientId: string, orderId?: number) => {
      if (!orderId) {
        showMessage({ status: 'warning', message: "Order can't be unarchived yet" })
        return false
      }

      try {
        await unarchiveOrderApi({ target_id: orderId })

        updateOrderByClientId(clientId, (order) => ({
          ...order,
          archive_at: null,
        }))

        showMessage({ status: 200, message: 'Order unarchived successfully.' })
        return true
      } catch (error) {
        console.error('Failed to unarchive order', error)
        showMessage({ status: 500, message: 'Unable to unarchive order.' })
        return false
      }
    },
    [unarchiveOrderApi, showMessage],
  )

  return {
    archiveOrder,
    unarchiveOrder,
    saveOrder,
    deleteOrderByServerId,
  }
}
