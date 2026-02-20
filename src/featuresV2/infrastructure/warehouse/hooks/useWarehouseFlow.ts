import { useCallback, useEffect } from 'react'

import { useMessageManager } from '@/message_manager'

import { useGetWarehouses } from '../api/warehouseApi'
import { useWarehouseModel } from '../domain/useWarehouseModel'
import { insertWarehouses } from '../store/warehouseStore'

export const useWarehouseFlow = () => {
  const getWarehouses = useGetWarehouses()
  const { normalizeWarehouses } = useWarehouseModel()
  const { showMessage } = useMessageManager()

  const loadWarehouses = useCallback(async () => {
    try {
      const response = await getWarehouses()
      const payload = response.data
      if (!payload?.warehouses) {
        showMessage({ status: 500, message: 'Missing warehouses response.' })
        return null
      }
      const normalized = normalizeWarehouses(payload.warehouses)
      if (normalized) {
        insertWarehouses(normalized)
      }
      return payload
    } catch (error) {
      console.error('Failed to load warehouses', error)
      showMessage({ status: 500, message: 'Unable to load warehouses.' })
      return null
    }
  }, [getWarehouses, normalizeWarehouses, showMessage])

  useEffect(() => {
    void loadWarehouses()
  }, [loadWarehouses])

  return { loadWarehouses }
}
