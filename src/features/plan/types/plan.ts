import type { InternationalShippingPlanInput } from '@/features/plan/types/internationalShippingPlan'
import type { LocalDeliveryPlanInput } from '@/features/plan/planTypes/localDelivery/types/localDeliveryPlan'
import type { StorePickupPlanInput } from '@/features/plan/types/storePickupPlan'

export const PLAN_TYPE_KEYS = [
  'local_delivery',
  'international_shipping',
  'store_pickup',
] as const

export type PlanTypeKey = typeof PLAN_TYPE_KEYS[number]

export const PLAN_TYPE_STORE_KEYS = [
  'local_delivery_plan',
  'international_shipping_plan',
  'store_pickup_plan',
] as const

export type PlanTypeStoreKey = typeof PLAN_TYPE_STORE_KEYS[number]

export type PlanTypePayloadKey = PlanTypeKey 

export const PLAN_TYPE_KEY_MAP: Record<PlanTypeStoreKey, PlanTypeKey> = {
  local_delivery_plan: 'local_delivery',
  international_shipping_plan: 'international_shipping',
  store_pickup_plan: 'store_pickup',
}

export const PLAN_TYPE_STORE_KEY_MAP: Record<PlanTypeKey, PlanTypeStoreKey> = {
  local_delivery: 'local_delivery_plan',
  international_shipping: 'international_shipping_plan',
  store_pickup: 'store_pickup_plan',
}

export type DeliveryPlan = {
  id?: number
  client_id: string
  label: string
  plan_type: PlanTypeKey
  start_date?: string | null
  end_date?: string | null
  created_at?: string | null
  orders_ids?: number[]
  state_id?: number | null
  total_orders?: number | null
  total_items?: number | null
  total_volume?: number | null
  total_weight?: number | null
}

export type DeliveryPlanMap = {
  byClientId: Record<string, DeliveryPlan>
  allIds: string[]
}

export type DeliveryPlanFields = {
  client_id: string
  label: string
  plan_type: PlanTypePayloadKey
  start_date?: string | null
  end_date?: string | null
  state_id?: number | null
  total_orders?: number | null
  total_items?: number | null
  total_volume?: number | null
  total_weight?: number | null
}

export type PlanTypeFields = {
  local_delivery?: LocalDeliveryPlanInput
  international_shipping?: InternationalShippingPlanInput
  store_pickup?: StorePickupPlanInput
}



export type PlanTypeStoreFields = {
  local_delivery_plan?: LocalDeliveryPlanInput
  international_shipping_plan?: InternationalShippingPlanInput
  store_pickup_plan?: StorePickupPlanInput
}

export type PlanCreatePayload = DeliveryPlanFields &
  Partial<PlanTypeFields & PlanTypeStoreFields> & {
    order_ids?: number[]
  }

export type PlanUpdateFields = Partial<PlanCreatePayload>

export type ClientIdMap = Record<string, number> & {
  ids_without_match?: number[]
}

export type PlanCreateResponse = {
  delivery_plan: ClientIdMap
  plan_type: ClientIdMap
}
