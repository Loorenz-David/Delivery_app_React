
export interface ItemPropertyRecord {
  state: string
  time: string
}

export type Item = {
    id: number 
    article_number: string
    item_type: string | { id: number; name: string }
    item_category: string | { id: number; name: string }
    item_state_id: number
    item_position_id: number
    properties: Record<string, string | number | boolean>
    weight: number
    dimensions: {
        length_cm: number
        width_cm: number
        height_cm: number
    }
    item_state_record: ItemPropertyRecord[]
    item_position_record: ItemPropertyRecord[]
    item_valuation?: number | null
    page_link?: string

    order_id: number | null | undefined
}