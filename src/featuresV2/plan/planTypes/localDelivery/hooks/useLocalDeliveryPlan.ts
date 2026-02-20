import {
  selectAllLocalDeliveryPlans,
  selectLocalDeliveryPlanByClientId,
  selectLocalDeliveryPlanByPlanId,
  selectLocalDeliveryPlanByServerId,
  useLocalDeliveryPlanStore,
} from '@/featuresV2/plan/planTypes/localDelivery/store/localDelivery.slice'

export const useLocalDeliveryPlans = () =>
  useLocalDeliveryPlanStore(selectAllLocalDeliveryPlans)

export const useLocalDeliveryPlanByClientId = (clientId: string | null | undefined) =>
  useLocalDeliveryPlanStore(selectLocalDeliveryPlanByClientId(clientId))

export const useLocalDeliveryPlanByServerId = (id: number | null | undefined) =>
  useLocalDeliveryPlanStore(selectLocalDeliveryPlanByServerId(id))

export const useLocalDeliveryPlanByPlanId = (planId: number | null | undefined) =>
  useLocalDeliveryPlanStore(selectLocalDeliveryPlanByPlanId(planId))
