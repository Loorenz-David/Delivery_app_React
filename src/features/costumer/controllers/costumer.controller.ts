import { useCallback } from 'react'

import { ApiError } from '@/lib/api/ApiClient'
import { useMessageHandler } from '@/shared/message-handler'

import {
  useCreateCostumerApi,
  useDeleteCostumerApi,
  useGetCostumerApi,
  useListCostumersApi,
  useUpdateCostumerApi,
} from '../api/costumerApi'
import type {
  Costumer,
  CostumerCreatePayload,
  CostumerDeletePayload,
  CostumerMap,
  CostumerQueryFilters,
  CostumerUpdateTargetPayload,
} from '../dto/costumer.dto'
import {
  selectCostumerByClientId,
  selectCostumerByServerId,
} from '../store/costumer.selectors'
import {
  setCostumerListError,
  setCostumerListLoading,
  setCostumerListResult,
} from '../store/costumerList.store'
import { useCostumerStore } from '../store/costumer.store'
import {
  removeCostumerByClientId,
  upsertCostumer,
  upsertCostumers,
} from '../store/costumer.upserters'

const buildQueryKey = (query?: CostumerQueryFilters) => JSON.stringify(query ?? {})

const isCostumerMap = (value: unknown): value is CostumerMap =>
  Boolean(
    value &&
      typeof value === 'object' &&
      'byClientId' in value &&
      'allIds' in value,
  )

const isCostumer = (value: unknown): value is Costumer =>
  Boolean(
    value &&
      typeof value === 'object' &&
      'client_id' in value &&
      'first_name' in value &&
      'last_name' in value,
  )

const normalizeCostumerPayload = (payload: CostumerMap | Costumer[] | Costumer): CostumerMap => {
  if (isCostumerMap(payload)) {
    return payload
  }

  if (Array.isArray(payload)) {
    const byClientId = payload.reduce<Record<string, Costumer>>((acc, entry) => {
      if (!isCostumer(entry)) return acc
      acc[entry.client_id] = entry
      return acc
    }, {})
    return { byClientId, allIds: Object.keys(byClientId) }
  }

  if (!isCostumer(payload)) {
    return { byClientId: {}, allIds: [] }
  }

  return {
    byClientId: { [payload.client_id]: payload },
    allIds: [payload.client_id],
  }
}

export const useCostumerController = () => {
  const listCostumersApi = useListCostumersApi()
  const getCostumerApi = useGetCostumerApi()
  const createCostumerApi = useCreateCostumerApi()
  const updateCostumerApi = useUpdateCostumerApi()
  const deleteCostumerApi = useDeleteCostumerApi()
  const { showMessage } = useMessageHandler()

  const listCostumers = useCallback(
    async (query?: CostumerQueryFilters) => {
      const queryKey = buildQueryKey(query)
      setCostumerListLoading(true)

      try {
        const response = await listCostumersApi(query)
        const payload = response.data

        if (!payload?.costumer) {
          setCostumerListError('Missing costumers response.')
          return null
        }

        const normalized = normalizeCostumerPayload(payload.costumer)
        upsertCostumers(normalized)

        setCostumerListResult({
          queryKey,
          query,
          stats: payload.costumer_stats,
          pagination: payload.costumer_pagination,
        })

        return normalized
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Unable to load costumers.'
        const status = error instanceof ApiError ? error.status : 500
        setCostumerListError(message)
        showMessage({ status, message })
        return null
      }
    },
    [listCostumersApi, showMessage],
  )

  const getCostumer = useCallback(
    async (costumerId: number | string) => {
      try {
        const response = await getCostumerApi(costumerId)
        const payload = response.data?.costumer

        if (!payload) {
          showMessage({ status: 404, message: 'Costumer not found.' })
          return null
        }

        const normalized = normalizeCostumerPayload(payload)
        upsertCostumers(normalized)
        return normalized
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Unable to load costumer.'
        const status = error instanceof ApiError ? error.status : 500
        showMessage({ status, message })
        return null
      }
    },
    [getCostumerApi, showMessage],
  )

  const createCostumer = useCallback(
    async (payload: CostumerCreatePayload) => {
      try {
        const response = await createCostumerApi(payload)
        const created = response.data?.created ?? []

        if (!created.length) {
          showMessage({ status: 500, message: 'Create costumer response is missing created items.' })
          return null
        }

        created.forEach((bundle) => {
          if (bundle?.costumer?.client_id) {
            upsertCostumer(bundle.costumer)
          }
        })

        return created
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Unable to create costumer.'
        const status = error instanceof ApiError ? error.status : 500
        showMessage({ status, message })
        return null
      }
    },
    [createCostumerApi, showMessage],
  )

  const updateCostumer = useCallback(
    async (payload: CostumerUpdateTargetPayload | CostumerUpdateTargetPayload[]) => {
      try {
        const response = await updateCostumerApi(payload)
        const updated = response.data?.updated ?? []

        updated.forEach((bundle) => {
          if (bundle?.costumer?.client_id) {
            upsertCostumer(bundle.costumer)
          }
        })

        return updated
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Unable to update costumer.'
        const status = error instanceof ApiError ? error.status : 500
        showMessage({ status, message })
        return null
      }
    },
    [showMessage, updateCostumerApi],
  )

  const deleteCostumer = useCallback(
    async (payload: CostumerDeletePayload) => {
      try {
        const response = await deleteCostumerApi(payload)
        const deletedIds = response.data?.deleted?.costumer_ids ?? []

        const state = useCostumerStore.getState()
        deletedIds.forEach((id) => {
          const clientId = state.idIndex[id]
          if (clientId) {
            removeCostumerByClientId(clientId)
          }
        })

        return deletedIds
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Unable to delete costumer.'
        const status = error instanceof ApiError ? error.status : 500
        showMessage({ status, message })
        return null
      }
    },
    [deleteCostumerApi, showMessage],
  )

  const getCostumerFromStoreByClientId = useCallback((clientId: string) => {
    return selectCostumerByClientId(clientId)(useCostumerStore.getState())
  }, [])

  const getCostumerFromStoreByServerId = useCallback((id: number) => {
    return selectCostumerByServerId(id)(useCostumerStore.getState())
  }, [])

  return {
    listCostumers,
    getCostumer,
    createCostumer,
    updateCostumer,
    deleteCostumer,
    getCostumerFromStoreByClientId,
    getCostumerFromStoreByServerId,
  }
}
