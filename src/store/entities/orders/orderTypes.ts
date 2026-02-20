import type { AddressPayload, PhonePayload } from '../../types/complementTypes'
export interface ChatNote {
  id: string
  author: string
  message: string
  created_at: string
  timestamp?: string
  sender?: string | number | null
  seenBy?: unknown[]
}

export type Order = {
    id:number
    route_id:number | null | undefined
    ItemIds: number []
    client_first_name?: string
    client_last_name?: string
    client_email?: string | null
    client_primary_phone?: PhonePayload | null
    client_secondary_phone?: PhonePayload | null
    client_address: AddressPayload
    notes_chat: ChatNote[]
    expected_arrival_time: string | null
    actual_arrival_time: string | null
    marketing_messages: boolean
    delivery_after?: string
    delivery_before?: string
    stop_time?: string
    in_range?: boolean
    delivery_arrangement?: number

    // will be added 
    order_state?: string | null

    // types injected by the front end 
    arrival_time_range?: string | null
}