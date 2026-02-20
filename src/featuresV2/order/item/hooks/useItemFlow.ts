import { useCallback, useState } from 'react'

import { ApiError } from '@/lib/api/ApiClient'
import { useMessageManager } from '@/message_manager'

import { useGetOrderItems } from '../api/item.api'
import { useItemModel } from '../domain/useItemModel'
import { useItemByClientId, useItemsByOrderId, useSetItems } from '../store/item.store'

export const useItemFlow = ({
  orderId,
  itemId,
}: {
  orderId?: number | null
  itemId?: string | null
} = {}) => {
  const getOrderItems = useGetOrderItems()
  const { normalizeItemsForOrder } = useItemModel()
  const setItems = useSetItems()
  const { showMessage } = useMessageManager()
  const items = useItemsByOrderId(orderId ?? null)
  const item = useItemByClientId(itemId ?? null)

  const [isLoadingItems, setIsLoadingItems] = useState(false)

  const loadItemsByOrderId = useCallback(
    async (orderId: number) => {
      if (!Number.isFinite(orderId) || orderId <= 0) {
        showMessage({ status: 400, message: 'Order id is required to load items.' })
        return null
      }

      setIsLoadingItems(true)

      try {
        const response = await getOrderItems(orderId)
        const payload = response.data

        if (!payload?.items) {
          showMessage({ status: 400, message: 'Missing items response.' })
          return null
        }

        const normalized = normalizeItemsForOrder(payload.items, orderId)
        setItems(normalized)

        return normalized
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Unable to load items.'
        const status = error instanceof ApiError ? error.status : 500
        showMessage({ status, message })
        return null
      } finally {
        setIsLoadingItems(false)
      }
    },
    [],
  )

  return {
    items,
    item,
    isLoadingItems,
    loadItemsByOrderId,
  }
}
