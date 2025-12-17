import { apiClient } from '../../../lib/api/ApiClient'
import type{ AddressPayload } from '../types/backend'
import type { QueryResponse } from './deliveryService'

export interface RouteStateOption {
  id: number
  name: string
  color: string
  default: boolean
}

export interface DriverOption {
  id: number
  username: string
  profile_picture?: string | null
  phone_number?: string | null
  avatar_url?: string | null
  email?: string | null
}

export interface ItemStateOption {
  id: number
  name: string
  color: string
  default: boolean
  description?: string | null
  priority?: number | null
}
export interface ItemStatePosition {
  id: number
  name: string
  default: boolean
  description?: string | null
}



export interface WarehouseOption {
  id: number
  name: string
  location: AddressPayload
}

export interface RouteDependencies {
  route_states: RouteStateOption[]
  drivers: DriverOption[]
  item_states: ItemStateOption[]
  item_positions: ItemStatePosition[]
  default_warehouses: WarehouseOption[]
  route_states_map?: Record<number, RouteStateOption>
  drivers_map?: Record<number, DriverOption>
  item_states_map?: Record<number, ItemStateOption>
  item_positions_map?: Record<number, ItemStatePosition>
  item_options?: ItemCategoryOption[]
}

export interface ItemPropertyOption {
  id: number
  name: string
  field_type: string
  options?: Array<
    | string
    | {
        value: string
        display?: string
        label?: string
      }
  >
  required: boolean
}

export interface ItemTypeOption {
  id: number
  name: string
  item_category_id: number
  properties: ItemPropertyOption[]
}

export interface ItemCategoryOption {
  id: number
  name: string
  item_types: ItemTypeOption[]
}

export interface ItemOptionsPayload {
  categories: ItemCategoryOption[]
}


export class OptionService {
  async fetchMainDependencies(): Promise<RouteDependencies> {

    const useDummyData = import.meta.env.VITE_API_URL
    if (useDummyData){
      return {
      route_states: [],
      drivers: [],
      item_states: [],
      item_positions: [],
      default_warehouses: [],
      item_options: [],
    }
    }
    const response = await apiClient.request<RouteDependencies>({
      path: '/route/main_dependencies',
      method: 'GET',
    })

    return response.data ?? {
      route_states: [],
      drivers: [],
      item_states: [],
      item_positions: [],
      default_warehouses: [],
      item_options: [],
    }
  }

  async fetchItemOptions(): Promise<ItemCategoryOption[]> {
    const response = await apiClient.request<QueryResponse<ItemCategoryOption>>({
      path: '/item/query_item_options',
      method: 'POST',
      data: {},
    })
    return response.data?.items ?? []
  }
}
