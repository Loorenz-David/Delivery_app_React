import {
  LOCAL_DELIVERY_DEFAULT_END_TIME,
  LOCAL_DELIVERY_DEFAULT_ROUTE_END_STRATEGY,
  LOCAL_DELIVERY_DEFAULT_START_TIME,
  PLAN_DEFAULT_DRIVER_ID_KEY,
  PLAN_DEFAULT_END_LOCATION_KEY,
  PLAN_DEFAULT_ROUTE_END_STRATEGY_KEY,
  PLAN_DEFAULT_SET_END_TIME_KEY,
  PLAN_DEFAULT_SET_START_TIME_KEY,
  PLAN_DEFAULT_START_LOCATION_KEY,
  PLAN_DEFAULT_STOPS_SERVICE_TIME_KEY,
} from '@/features/plan/constants/planTypeDefaults.constants'
import { loadLocalDeliveryEditFormPreferences } from '@/features/plan/planTypes/localDelivery/forms/localDeliveryEditForm/localDeliveryEditForm.storage'
import type { LocalDeliveryPlanTypeDefaults } from '@/features/plan/types/plan'
import type { PlanTypeDefaultsContext } from '@/features/plan/domain/planTypeDefaults/planTypeDefaults.types'

export const buildLocalDeliveryPlanTypeDefaults = async (
  ctx: PlanTypeDefaultsContext,
): Promise<LocalDeliveryPlanTypeDefaults> => {
  const stored = loadLocalDeliveryEditFormPreferences()

  let startLocation = stored.start_location
  if (!startLocation) {
    try {
      startLocation = await ctx.getCurrentLocationAddress()
    } catch {
      startLocation = null
    }
  }

  const endLocation = stored.end_location ?? startLocation

  return {
    route_solution: {
      [PLAN_DEFAULT_SET_START_TIME_KEY]: stored.set_start_time ?? LOCAL_DELIVERY_DEFAULT_START_TIME,
      [PLAN_DEFAULT_SET_END_TIME_KEY]: stored.set_end_time ?? LOCAL_DELIVERY_DEFAULT_END_TIME,
      [PLAN_DEFAULT_ROUTE_END_STRATEGY_KEY]:
        stored.route_end_strategy ?? LOCAL_DELIVERY_DEFAULT_ROUTE_END_STRATEGY,
      [PLAN_DEFAULT_START_LOCATION_KEY]: startLocation,
      [PLAN_DEFAULT_END_LOCATION_KEY]: endLocation,
      [PLAN_DEFAULT_DRIVER_ID_KEY]: stored.driver_id ?? null,
      [PLAN_DEFAULT_STOPS_SERVICE_TIME_KEY]: stored.stops_service_time ?? null,
    },
  }
}
