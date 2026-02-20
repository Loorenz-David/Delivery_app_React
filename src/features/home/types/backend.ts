import type { address } from '@/types/address'

export type AddressPayload = {
  raw_address?: string | null
  street_address?: string | null
  country?: string | null
  city?: string | null
  postal_code?: string | null
  coordinates: {
    lat: number
    lng: number
  }
}

export type OrderPayload = {
  id: number
  delivery_items?: Array<Record<string, unknown>>
} & Record<string, unknown>

export type RoutePayload = {
  id: number
  route_label?: string | null
  delivery_date?: string | null
  start_location?: address | null
  end_location?: address | null
  delivery_orders?: OrderPayload[]
} & Record<string, unknown>
