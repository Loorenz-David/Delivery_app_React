export type OrderStats = {
  orders: {
    total: number
    by_state: Record<number, number>
  }
  items: {
    total: number
  }
}

export type OrderPagination = {
  has_more: boolean
  next_cursor: {
    after_date: string
    after_id: number
  } | null
  prev_cursor: {
    before_date: string
    before_id: number
  } | null
}

export type OrderQueryStringQueries = 
 |'reference_number'
  |'external_source'
  |'tracking_number'
  |'client_name'
  |'client_first_name/client_last_name'
  |'client_email'
  |'client_address'
  |'client_phone'
  |'plan_label'
  |'plan_type'
  |'article_number'
  |'item_type'


export type OrderQueryFilters = {
  q?: string
  s?: OrderQueryStringQueries[]

  order_state_id?: number | number[] | null
  
  schedule_order?: boolean
  after_date?: string
  after_id?: number
  before_date?: string
  before_id?: number
  limit?: number
  sort?: 'date_asc' | 'date_desc'
}


export type OrderQueryStoreFilters = {
  q: string
  filters: Omit<OrderQueryFilters, 'q' >
}
