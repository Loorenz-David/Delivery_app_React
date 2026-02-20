import { apiClient } from '@/lib/api/ApiClient'
import type { ApiResult } from '@/lib/api/types'

import type {
  Order,
  OrderCreatePayload,
  OrderCreateResponse,
  OrderMap,
  OrderPlanUpdateResponse,
  OrderUpdateFields,
} from '../types/order'
import type { OrderPagination, OrderQueryFilters, OrderStats } from '../types/orderMeta'

export type OrderListResponse = {
  order: OrderMap
  order_stats: OrderStats
  order_pagination: OrderPagination
}

export type OrderDetailResponse = {
  order: OrderMap | Order
}

export type OrderUpdatePayload = {
  target_id: number | string
  fields: OrderUpdateFields
}

export type OrderDeletePayload = {
  target_id?: number | string
  target_ids?: Array<number | string>
}

export const listOrders = (query?: OrderQueryFilters): Promise<ApiResult<OrderListResponse>> =>
  apiClient.request<OrderListResponse>({
    path: '/orders/',
    method: 'GET',
    query,
  })

export const getOrder = (orderId: number | string): Promise<ApiResult<OrderDetailResponse>> =>
  apiClient.request<OrderDetailResponse>({
    path: `/orders/${orderId}`,
    method: 'GET',
  })

export const createOrder = (
  payload: OrderCreatePayload,
): Promise<ApiResult<OrderCreateResponse>> =>
  apiClient.request<OrderCreateResponse>({
    path: '/orders/',
    method: 'PUT',
    data: { fields: payload },
  })

export const updateOrder = (
  payload: OrderUpdatePayload | OrderUpdatePayload[],
): Promise<ApiResult<Record<string, never>>> =>
  apiClient.request<Record<string, never>>({
    path: '/orders/',
    method: 'PATCH',
    data: { target: payload },
  })

export const deleteOrder = (
  payload: OrderDeletePayload,
): Promise<ApiResult<Record<string, never>>> =>
  apiClient.request<Record<string, never>>({
    path: '/orders/',
    method: 'DELETE',
    data: payload,
  })

export const updateOrderDeliveryPlan = (
  orderId: number | string,
  planId: number | string,
): Promise<ApiResult<OrderPlanUpdateResponse>> =>
  apiClient.request<OrderPlanUpdateResponse>({
    path: `/orders/${orderId}/plan/${planId}`,
    method: 'PATCH',
  })

export const useGetOrders = () => listOrders
export const useGetOrder = () => getOrder
export const useCreateOrder = () => createOrder
export const useUpdateOrder = () => updateOrder
export const useDeleteOrder = () => deleteOrder
export const useUpdateOrderDeliveryPlan = () => updateOrderDeliveryPlan
