import {
  selectAllInternationalShippingPlans,
  selectInternationalShippingPlanByClientId,
  selectInternationalShippingPlanByPlanId,
  selectInternationalShippingPlanByServerId,
  useInternationalShippingPlanStore,
} from '@/featuresV2/plan/planTypes/internationalShipping/store/internationalShipping.slice'

export const useInternationalShippingPlans = () =>
  useInternationalShippingPlanStore(selectAllInternationalShippingPlans)

export const useInternationalShippingPlanByClientId = (clientId: string | null | undefined) =>
  useInternationalShippingPlanStore(selectInternationalShippingPlanByClientId(clientId))

export const useInternationalShippingPlanByServerId = (id: number | null | undefined) =>
  useInternationalShippingPlanStore(selectInternationalShippingPlanByServerId(id))

export const useInternationalShippingPlanByPlanId = (planId: number | null | undefined) =>
  useInternationalShippingPlanStore(selectInternationalShippingPlanByPlanId(planId))
