import type { address, coordinates } from '@/types/address'
import type { RouteSolution } from '@/featuresV2/plan/planTypes/localDelivery/types/routeSolution'
import type { DeliveryPlan } from '@/featuresV2/plan/types/plan'

import type { LocalDeliveryEditFormState } from './LocalDeliveryEditForm.types'

export const initialLocalDeliveryEditForm = (): LocalDeliveryEditFormState => ({
  local_delivery_plan_id: null,
  delivery_plan: {
    client_id: null,
    label: '',
    start_date: '',
    end_date: '',
  },
  route_solution: {
    client_id: null,
    label: null,
    start_location: null,
    end_location: null,
    set_start_time: null,
    set_end_time: null,
    route_end_strategy: 'round_trip',
    driver_id: null,
    created_at: null,
    is_optimized: null,
  },
  create_variant_on_save: false,
})

const normalizeTimeValue = (value?: string | null) => {
  if (!value) return null
  const match = value.match(/^(\d{2}:\d{2})/)
  return match ? match[1] : value
}

const coerceAddress = (value: Record<string, unknown> | null | undefined): address | null => {
  if (!value || typeof value !== 'object') return null

  if ('street_address' in value && 'coordinates' in value) {
    return value as address
  }

  if ('raw_address' in value && 'coordinates' in value) {
    const coords = value.coordinates as coordinates | undefined
    if (!coords) return null

    return {
      street_address: value.raw_address as string,
      city: value.city as string | undefined,
      country: value.country as string | undefined,
      postal_code: value.postal_code as string | undefined,
      coordinates: coords,
    }
  }

  return null
}

export const buildFormState = (
  localDeliveryPlanId: number,
  plan: DeliveryPlan,
  routeSolution: RouteSolution,
  createVariantOnSave: boolean,
): LocalDeliveryEditFormState => ({
  local_delivery_plan_id: localDeliveryPlanId,
  delivery_plan: {
    id: plan.id ?? undefined,
    client_id: plan.client_id ?? null,
    label: plan.label ?? '',
    start_date: plan.start_date ?? '',
    end_date: plan.end_date ?? '',
  },
  route_solution: {
    id: routeSolution.id ?? undefined,
    client_id: routeSolution.client_id ?? null,
    label: routeSolution.label ?? null,
    start_location: coerceAddress(routeSolution.start_location as Record<string, unknown> | null),
    end_location: coerceAddress(routeSolution.end_location as Record<string, unknown> | null),
    set_start_time: normalizeTimeValue(routeSolution.set_start_time),
    set_end_time: normalizeTimeValue(routeSolution.set_end_time),
    route_end_strategy: routeSolution.route_end_strategy ?? 'round_trip',
    driver_id: routeSolution.driver_id ?? null,
    created_at: routeSolution.created_at ?? null,
    is_optimized: routeSolution.is_optimized ?? null,
  },
  create_variant_on_save: createVariantOnSave,
})
