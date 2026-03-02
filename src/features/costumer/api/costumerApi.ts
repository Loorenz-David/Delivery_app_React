import { useCallback } from 'react'

import { apiClient } from '@/lib/api/ApiClient'
import type { ApiResult } from '@/lib/api/types'

import type {
  CostumerCreatePayload,
  CostumerCreateResponse,
  CostumerDeletePayload,
  CostumerDeleteResponse,
  CostumerDetailResponse,
  CostumerListResponse,
  CostumerQueryFilters,
  CostumerUpdateResponse,
  CostumerUpdateTargetPayload,
} from '../dto/costumer.dto'

export const costumerApi = {
  list: (query?: CostumerQueryFilters): Promise<ApiResult<CostumerListResponse>> =>
    apiClient.request<CostumerListResponse>({
      path: '/costumers/',
      method: 'GET',
      query,
    }),

  getById: (costumerId: number | string): Promise<ApiResult<CostumerDetailResponse>> =>
    apiClient.request<CostumerDetailResponse>({
      path: `/costumers/${costumerId}`,
      method: 'GET',
    }),

  create: (payload: CostumerCreatePayload): Promise<ApiResult<CostumerCreateResponse>> =>
    apiClient.request<CostumerCreateResponse>({
      path: '/costumers/',
      method: 'POST',
      data: { fields: payload },
    }),

  update: (
    payload: CostumerUpdateTargetPayload | CostumerUpdateTargetPayload[],
  ): Promise<ApiResult<CostumerUpdateResponse>> =>
    apiClient.request<CostumerUpdateResponse>({
      path: '/costumers/',
      method: 'PUT',
      data: { target: payload },
    }),

  remove: (payload: CostumerDeletePayload): Promise<ApiResult<CostumerDeleteResponse>> =>
    apiClient.request<CostumerDeleteResponse>({
      path: '/costumers/',
      method: 'DELETE',
      data: payload,
    }),
}

export const useListCostumersApi = () => useCallback((query?: CostumerQueryFilters) => costumerApi.list(query), [])

export const useGetCostumerApi = () =>
  useCallback((costumerId: number | string) => costumerApi.getById(costumerId), [])

export const useCreateCostumerApi = () =>
  useCallback((payload: CostumerCreatePayload) => costumerApi.create(payload), [])

export const useUpdateCostumerApi = () =>
  useCallback(
    (payload: CostumerUpdateTargetPayload | CostumerUpdateTargetPayload[]) => costumerApi.update(payload),
    [],
  )

export const useDeleteCostumerApi = () =>
  useCallback((payload: CostumerDeletePayload) => costumerApi.remove(payload), [])
