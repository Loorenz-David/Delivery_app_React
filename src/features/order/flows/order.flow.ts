import { useCallback } from 'react'

import { ApiError } from '@/lib/api/ApiClient'
import { useMessageHandler } from '@/shared/message-handler'

import { useGetOrders } from '../api/orderApi'
import { useOrderModel } from '../domain/useOrderModel'

import { setOrderListError, setOrderListLoading, setOrderListResult } from '../store/orderList.store'
import { useUpsertOrdersStore } from '../store/orderHooks.store'
import { setVisibleOrders } from '../store/order.store'
import type {  OrderQueryStoreFilters } from '../types/orderMeta'
import { normalizeQuery } from '../../../shared/utils/queryNormalization'
import { orderStringFilters } from '../domain/orderFilterConfig'


const buildQueryKey = (query?:  OrderQueryStoreFilters) => JSON.stringify(query ?? {})

export const useOrderFlow = () => {
  const getOrders = useGetOrders()
  const { normalizeOrderPayload } = useOrderModel()
  const upsertOrdersStore = useUpsertOrdersStore()
  const { showMessage } = useMessageHandler()
  

  const loadOrders = useCallback(
    async (query?: OrderQueryStoreFilters, firstLoad?: boolean) => {
    

      const queryKey = buildQueryKey(query)
      setOrderListLoading(true)
      const normalizedQuery = normalizeQuery(query ?? {}, orderStringFilters)
     
      try {
        const response = await getOrders(normalizedQuery)

        const payload = response.data
        console.log('Debugging: ', 'payload' )
        console.log(payload)
        console.log('end')
        if (!payload?.order) {
          setOrderListError('Missing orders response.')
          return null
        }

        const normalized = normalizeOrderPayload(payload.order)

        upsertOrdersStore(normalized)
        setVisibleOrders(normalized.allIds)

        setOrderListResult({
          queryKey,
          query,
          stats: payload.order_stats,
          pagination: payload.order_pagination,
        })

        return normalized
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Unable to load orders.'
        const status = error instanceof ApiError ? error.status : 500
        setOrderListError(message)
        showMessage({ status, message })
        return null
      }
    },
    [],
  )

  return {
    loadOrders,
  }
}
