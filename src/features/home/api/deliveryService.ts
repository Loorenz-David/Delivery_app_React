import { apiClient } from '../../../lib/api/ApiClient'
import type { AddressPayload, OrderPayload, RoutePayload, ItemPayload } from '../types/backend'

import {mockDeliveryDataset} from '../testData/mockDeliveryData'


export interface QueryResponse<T> {
  items: T[]
  total?: number
}

export interface RouteCreatePayload {
  route_label: string
  delivery_date: string
  arrival_time_range?: number | null
  driver_id: number | null
  start_location: AddressPayload | null
  end_location: AddressPayload | null
  set_start_time: string | null
  set_end_time: string | null
  state_id: number | null
}

export interface RouteUpdatePayload {
  id: number
  fields: Partial<RouteCreatePayload>
}

export interface OrderItemCreatePayload {
  article_number: string
  item_category: string
  item_type: string
  item_state_id?: number | null
  item_position_id?: number | null
  item_valuation?: number | null
  page_link?: string
  weight?: number | null
  properties?: Record<string, string | number | boolean>
  dimensions?: {
    length_cm?: number | null
    width_cm?: number | null
    height_cm?: number | null
  }
  client_reference?: number
}

export interface OrderCreatePayload {
  route_id: number
  delivery_arrangement: number
  client_first_name: string
  client_last_name: string
  client_email: string
  client_primary_phone: OrderPayload['client_primary_phone']
  client_secondary_phone?: OrderPayload['client_secondary_phone'] | null
  client_address: AddressPayload
  client_language?: string
  delivery_after?: string
  delivery_before?: string
  delivery_items: OrderItemCreatePayload[]
  message_template?: Partial<Record<'email' | 'sms', number>>
}

// const ROUTE_REQUESTED_FIELDS = [
//   'id',
//   'route_label',
//   'delivery_date',
//   'driver_id',
//   'set_start_time',
//   'set_end_time',
//   'expected_start_time',
//   'expected_end_time',
//   'actual_start_time',
//   'actual_end_time',
//   'start_location',
//   'end_location',
//   'using_optimization_indx',
//   'saved_optimizations',
//   'state_id',
//   'is_optimized',
//   { route_state: ['id', 'name'] },
  
//   {
//     delivery_orders: [
//       'id',
//       'client_name',
//       'client_phones',
//       'client_address',
//       'client_language',
//       'notes_chat',
//       'expected_arrival_time',
//       'actual_arrival_time',
//       'marketing_messages',
//       'delivery_after',
//       'delivery_before',
//       'stop_time',
//       'in_range',
//       'delivery_arrangement',
//       'route_id',
//       {
//         delivery_items: [
//           'id',
//           'article_number',
//           'item_type_id',
//           'item_category_id',
//           'item_state_id',
//           'item_position_id',
//           'order_id',
//           'properties',
//           'weight',
//           'dimensions',
//           'item_state_record',
//           'item_position_record',
//           { item_type: ['id', 'name'] },
//           { item_category: ['id', 'name'] },
//           { item_state: ['id', 'name', 'color'] },
//           { item_position: ['id', 'name'] },
//         ],
//       },
//     ],
//   },
//   { team: ['id', 'name'] },
// ]

export class DeliveryService {
  async fetchRoutes(filters: Record<string, any> = {}): Promise<QueryResponse<RoutePayload>> {
    const useDummyData = import.meta.env.VITE_API_URL
    if (useDummyData){
      return mockDeliveryDataset
    }
    const response = await apiClient.request<QueryResponse<RoutePayload>>({
      path: '/route/query_route',
      method: 'POST',
      data: {
        query: filters,
        order_by: { column: 'delivery_date', direction: 'asc' },
      },
    })

    const routes = response.data ?? {}
    return routes
  }
  async fetchRouteById(routeId: number): Promise<RoutePayload | null> {
    const response = await this.fetchRoutes({
      id: { operation: '==', value: routeId },
    })
    return response.items?.[0] ?? null
  }
}

export class CreateRouteService {
  async createRoute(payload: RouteCreatePayload) {
    return apiClient.request<RoutePayload | { instance: RoutePayload }>({
      path: '/route/create_route',
      method: 'POST',
      data: payload,
    })
  }
}

export class UpdateRouteService {
  async updateRoute(payload: RouteUpdatePayload) {
    return apiClient.request<RoutePayload | { instance: RoutePayload }>({
      path: '/route/update_route',
      method: 'PUT',
      data: payload,
    })
  }
}

export class DeleteRouteService {
  async deleteRoute(payload: { id: number }) {
    return apiClient.request<Record<string, unknown>>({
      path: '/route/delete_route',
      method: 'DELETE',
      data: payload,
    })
  }
}

export class CreateOrderService {
  async createOrder(payload: OrderCreatePayload) {
    return apiClient.request<OrderPayload | { instance: Partial<OrderPayload> }>({
      path: '/order/create_order',
      method: 'POST',
      data: payload,
    })
  }
}

export interface OrderUpdatePayload {
  id: number
  fields: Record<string, unknown>
}

export class UpdateOrderService {
  async updateOrder(payload: OrderUpdatePayload) {
    return apiClient.request<Record<string, unknown>>({
      path: '/order/update_order',
      method: 'PUT',
      data: payload,
    })
  }
}

export class DeleteOrderService {
  async deleteOrder(payload: { id: number }) {
    return apiClient.request<Record<string, unknown>>({
      path: '/order/delete_order',
      method: 'DELETE',
      data: payload,
    })
  }
}

export interface ItemUpdatePayload {
  id: number
  fields: Partial<Pick<ItemPayload, 'item_state_id' | 'item_position_id'>>
}

export class UpdateItemService {
  async updateItem(payload: ItemUpdatePayload) {
    return apiClient.request<ItemPayload | { instance: ItemPayload }>({
      path: '/item/update_item',
      method: 'PUT',
      data: payload,
    })
  }
}

export class DeleteItemService {
  async deleteItem(payload: { id: number }) {
    return apiClient.request<Record<string, unknown>>({
      path: '/item/delete_item',
      method: 'DELETE',
      data: payload,
    })
  }
}

export interface OptimizeRoutePayload {
  route_id: number
  consider_traffic?: boolean
  side_of_road?: boolean
  route_modifiers?: {
    avoid_tolls: boolean
    avoid_highways: boolean
    avoid_ferries: boolean
    avoid_indoor: boolean
  }
  objectives?: Array<{type:Record<string, boolean>}>
}

export interface OptimizeRouteResponse {
  route: RoutePayload
}

export class OptimizeRouteService {
  async optimizeRoute(payload: OptimizeRoutePayload) {
    return apiClient.request<OptimizeRouteResponse>({
      path: '/route/optimize_route',
      method: 'POST',
      data: payload,
    })
  }
}

export interface ChangeOptimizationPayload {
  route_id: number
  using_optimization_indx: number
}

export class ChangeOptimizationService {
  async changeOptimization(payload: ChangeOptimizationPayload) {
    return apiClient.request<{ route: RoutePayload }>({
      path: '/route/change_optimization_indx',
      method: 'POST',
      data: payload,
    })
  }
}
