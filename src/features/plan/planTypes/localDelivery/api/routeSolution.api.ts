import { apiClient } from '@/lib/api/ApiClient'
import type { ApiResult } from '@/lib/api/types'

import type { RouteSolution, RouteSolutionMap } from '@/features/plan/planTypes/localDelivery/types/routeSolution'
import type {
  RouteSolutionStop,
  RouteSolutionStopMap,
} from '@/features/plan/planTypes/localDelivery/types/routeSolutionStop'

export type RouteSolutionUpdateResponse = {
  route_solution?: RouteSolution | RouteSolutionMap
  route_solution_stops?: RouteSolutionStop[] | RouteSolutionStopMap
}

export type RouteSolutionGetResponse = {
  route_solution?: RouteSolution | { byClientId: Record<string, RouteSolution>; allIds: string[] }
  route_solution_stop?: RouteSolutionStop[] | { byClientId: Record<string, RouteSolutionStop>; allIds: string[] }
}

export type RouteSolutionAddressPayload = {
  route_solution_id: number
  start_location?: Record<string, unknown> | null
  end_location?: Record<string, unknown> | null
}

export type RouteSolutionTimesPayload = {
  route_solution_id: number
  set_start_time?: string | null
  set_end_time?: string | null
}



export type RouteSolutionReadyResponse = {
  failed_order_state_updates:Record<number,string>
}

export const routeSolutionApi = {
  updateStopPosition: (
    routeStopId: number,
    position: number,
  ): Promise<ApiResult<RouteSolutionUpdateResponse>> =>
    apiClient.request<RouteSolutionUpdateResponse>({
      path: `/route_solutions/stops/${routeStopId}/position/${position}`,
      method: 'PATCH',
    }),

  selectRouteSolution: (
    routeSolutionId: number,
  ): Promise<ApiResult<RouteSolutionUpdateResponse>> =>
    apiClient.request<RouteSolutionUpdateResponse>({
      path: `/route_solutions/${routeSolutionId}/select`,
      method: 'PATCH',
    }),

  updateAddress: (
    payload: RouteSolutionAddressPayload,
  ): Promise<ApiResult<RouteSolutionUpdateResponse>> =>
    apiClient.request<RouteSolutionUpdateResponse>({
      path: '/route_solutions/address',
      method: 'PATCH',
      data: payload,
    }),

  updateTimes: (
    payload: RouteSolutionTimesPayload,
  ): Promise<ApiResult<RouteSolutionUpdateResponse>> =>
    apiClient.request<RouteSolutionUpdateResponse>({
      path: '/route_solutions/times',
      method: 'PATCH',
      data: payload,
    }),

  getRouteSolution: (
    routeSolutionId: number,
    returnStops: boolean = false,
  ): Promise<ApiResult<RouteSolutionGetResponse>> =>
    apiClient.request<RouteSolutionGetResponse>({
      path: `/route_solutions/${routeSolutionId}`,
      method: 'GET',
      query: { return_stops: returnStops ? 'true' : 'false' },
    }),

  routeReadyForDelivery: (
    deliveryPlanId: number,
  ): Promise<ApiResult<RouteSolutionReadyResponse>> =>
    apiClient.request<RouteSolutionReadyResponse>({
      path: `/plans/${deliveryPlanId}/plan-is-ready`,
      method: 'PATCH',
    }),
}
