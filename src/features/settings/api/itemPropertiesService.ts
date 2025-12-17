import { apiClient } from '../../../lib/api/ApiClient'
import type { ApiResult } from '../../../lib/api/types'
import type {
  ItemCategoryPayload,
  ItemPositionPayload,
  ItemStatePayload,
  ItemTypePayload,
} from '../../home/types/backend'

export interface QueryResponse<TItem> {
  items: TItem[]
  total?: number
}

export interface ItemTypeDetails extends ItemTypePayload {
  item_category_id?: number | null
  item_category?: ItemCategoryPayload | null
  properties?: ItemPropertyPayload[]
  description?: string
}

export interface ItemCategoryDetails extends ItemCategoryPayload {
  item_types?: Array<Pick<ItemTypePayload, 'id' | 'name'>>
  description?: string
}

export interface ItemPropertyPayload {
  id: number
  name: string
  field_type: string
  options?: unknown
  required: boolean
  item_types?: Array<Pick<ItemTypePayload, 'id' | 'name'>>
}

export interface ItemStateDetails extends ItemStatePayload {
  default: boolean
  description: string
  priority?: number | null
}

export interface ItemPositionDetails extends ItemPositionPayload {
  default: boolean
  description: string
}

export interface CreateItemCategoryPayload {
  name: string
  item_types?: number[]
}

export interface CreateItemTypePayload {
  name: string
  description?: string
  item_category_id?: number | null
  properties?: number[]
}

export interface CreateItemPropertyPayload {
  name: string
  field_type: string
  required: boolean
  options?: unknown
  item_types?: number[]
}

export interface CreateItemStatePayload {
  name: string
  color: string
  default: boolean
  priority?: number | null
  description: string
}

export interface CreateItemPositionPayload {
  name: string
  default: boolean
  description: string
}

export type UpdateItemCategoryPayload = {
  id: number
  fields: Partial<CreateItemCategoryPayload>
}

export type UpdateItemTypePayload = {
  id: number
  fields: Partial<CreateItemTypePayload>
}

export type UpdateItemPropertyPayload = {
  id: number
  fields: Partial<CreateItemPropertyPayload>
}

export type UpdateItemStatePayload = {
  id: number
  fields: Partial<CreateItemStatePayload>
}

export type UpdateItemPositionPayload = {
  id: number
  fields: Partial<CreateItemPositionPayload>
}

export type CreatedIdsResponse =
  | {
      instance: {
        id: number
      }
    }
  | {
      items: Array<{
        id: number
      }>
    }

type QueryPayload = Record<string, unknown>

export class ItemPropertiesService {
  private buildPath(endpoint: string) {
    return `/item/${endpoint}`
  }

  private postQuery<T>(endpoint: string, query?: QueryPayload) {
    return apiClient.request<QueryResponse<T>>({
      path: this.buildPath(endpoint),
      method: 'POST',
      data: {
        query: query ?? {},
      },
    })
  }

  async queryItemTypes(query?: QueryPayload): Promise<ApiResult<QueryResponse<ItemTypeDetails>>> {
    return this.postQuery<ItemTypeDetails>('query_item_type', query)
  }

  async queryItemCategories(query?: QueryPayload): Promise<ApiResult<QueryResponse<ItemCategoryDetails>>> {
    return this.postQuery<ItemCategoryDetails>('query_item_category', query)
  }

  async queryItemProperties(query?: QueryPayload): Promise<ApiResult<QueryResponse<ItemPropertyPayload>>> {
    return this.postQuery<ItemPropertyPayload>('query_item_property', query)
  }

  async queryItemStates(query?: QueryPayload): Promise<ApiResult<QueryResponse<ItemStateDetails>>> {
    return this.postQuery<ItemStateDetails>('query_item_state', query)
  }

  async queryItemPositions(query?: QueryPayload): Promise<ApiResult<QueryResponse<ItemPositionDetails>>> {
    return this.postQuery<ItemPositionDetails>('query_item_position', query)
  }

  async createItemCategory(payload: CreateItemCategoryPayload): Promise<ApiResult<CreatedIdsResponse>> {
    return apiClient.request<CreatedIdsResponse>({
      path: this.buildPath('create_item_category'),
      method: 'POST',
      data: payload,
    })
  }

  async createItemType(payload: CreateItemTypePayload): Promise<ApiResult<CreatedIdsResponse>> {
    return apiClient.request<CreatedIdsResponse>({
      path: this.buildPath('create_item_type'),
      method: 'POST',
      data: payload,
    })
  }

  async createItemProperty(payload: CreateItemPropertyPayload): Promise<ApiResult<CreatedIdsResponse>> {
    return apiClient.request<CreatedIdsResponse>({
      path: this.buildPath('create_item_property'),
      method: 'POST',
      data: payload,
    })
  }

  async createItemState(payload: CreateItemStatePayload): Promise<ApiResult<CreatedIdsResponse>> {
    return apiClient.request<CreatedIdsResponse>({
      path: this.buildPath('create_item_state'),
      method: 'POST',
      data: payload,
    })
  }

  async createItemPosition(payload: CreateItemPositionPayload): Promise<ApiResult<CreatedIdsResponse>> {
    return apiClient.request<CreatedIdsResponse>({
      path: this.buildPath('create_item_position'),
      method: 'POST',
      data: payload,
    })
  }

  async updateItemCategory(payload: UpdateItemCategoryPayload): Promise<ApiResult<Record<string, unknown>>> {
    return apiClient.request<Record<string, unknown>>({
      path: this.buildPath('update_item_category'),
      method: 'PUT',
      data: payload,
    })
  }

  async updateItemType(payload: UpdateItemTypePayload): Promise<ApiResult<Record<string, unknown>>> {
    return apiClient.request<Record<string, unknown>>({
      path: this.buildPath('update_item_type'),
      method: 'PUT',
      data: payload,
    })
  }

  async updateItemProperty(payload: UpdateItemPropertyPayload): Promise<ApiResult<Record<string, unknown>>> {
    return apiClient.request<Record<string, unknown>>({
      path: this.buildPath('update_item_property'),
      method: 'PUT',
      data: payload,
    })
  }

  async updateItemState(payload: UpdateItemStatePayload): Promise<ApiResult<Record<string, unknown>>> {
    return apiClient.request<Record<string, unknown>>({
      path: this.buildPath('update_item_state'),
      method: 'PUT',
      data: payload,
    })
  }

  async updateItemPosition(payload: UpdateItemPositionPayload): Promise<ApiResult<Record<string, unknown>>> {
    return apiClient.request<Record<string, unknown>>({
      path: this.buildPath('update_item_position'),
      method: 'PUT',
      data: payload,
    })
  }

  async deleteAllByModel(model: 'ItemType' | 'ItemState' | 'ItemProperty' | 'ItemCategory' | 'ItemPosition') {
    return apiClient.request<{ deleted: number }>({
      path: this.buildPath('delete_all_by_model'),
      method: 'DELETE',
      data: { model },
    })
  }
}
