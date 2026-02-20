import type { OrderCaseState } from './orderCase'

export type OrderCaseQueryStringQueries = 
  |"created_by_user"
  |"user_in_conversation"
  |"order_reference"
  |"chat"

export type OrderCaseQueryFilters = {
  q?: string
  s?: OrderCaseQueryStringQueries[]

  order_id?: number | number[] | null
  state?: OrderCaseState | OrderCaseState[] | null
  creation_date_from?: string
  creation_date_to?: string
  limit?: number
  sort?: 'date_asc' | 'date_desc'
}

export type OrderCaseQueryStoreFilters = {
  q: string
  filters: Omit<OrderCaseQueryFilters, 'q'>
}
