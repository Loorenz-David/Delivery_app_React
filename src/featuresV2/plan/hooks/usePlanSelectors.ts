import { usePlanStore, selectAllPlans, selectPlanByClientId, selectPlanByServerId, useDeliveryPlanStateById as useDeliveryPlanStateStoreById } from '@/featuresV2/plan/store/plan.slice'
import { useShallow } from 'zustand/react/shallow'
import { useInternationalShippingPlanByPlanId } from '@/featuresV2/plan/planTypes/internationalShipping/hooks/useInternationalShippingPlan'
import { useLocalDeliveryPlanByServerId } from '@/featuresV2/plan/planTypes/localDelivery/hooks/useLocalDeliveryPlan'
import { useStorePickupPlanByServerId } from '@/featuresV2/plan/planTypes/storePickup/hooks/useStorePickupPlan'


// after the use* plan type hooks have been move to their own sub feature we must coorrect imports
export const usePlans = () => usePlanStore(useShallow(selectAllPlans))

export const usePlanByClientId = (clientId: string | null | undefined) =>
  usePlanStore(selectPlanByClientId(clientId))

export const usePlanByServerId = (id: number | null | undefined) =>
  usePlanStore(selectPlanByServerId(id))

export const useDeliveryPlanStateById = (stateId: number | null | undefined) =>
  useDeliveryPlanStateStoreById(stateId)

export const usePlanType = (clientId: string | null | undefined) => {
  const plan = usePlanByClientId(clientId)

  const local = useLocalDeliveryPlanByServerId(plan?.id)
  const international = useInternationalShippingPlanByPlanId(plan?.id)
  const pickup = useStorePickupPlanByServerId(plan?.id)

  if (!plan) return null

  switch (plan.plan_type) {
    case 'local_delivery':
      return local
    case 'international_shipping':
      return international
    case 'store_pickup':
      return pickup
    default:
      return null
  }
}
