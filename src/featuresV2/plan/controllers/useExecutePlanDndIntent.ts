import { useOrderMutations } from '@/featuresV2/order'
import { useRouteSolutionStopMutations } from '@/featuresV2/plan/planTypes/localDelivery/controllers/routeSolutionStop.controller'
import { selectPlanByClientId, usePlanStore } from '@/featuresV2/plan/store/plan.slice'
import type { PlanDndIntent } from '@/featuresV2/plan/domain/planDndIntent'

export const useExecutePlanDndIntent = () => {
  const { updateOrderDeliveryPlan } = useOrderMutations()
  const { updateRouteStopPositionOptimistic } = useRouteSolutionStopMutations()

  const execute = async (intent: PlanDndIntent) => {
    if (!intent) {
      return { droppedPlanClientId: null as string | null }
    }

    if (intent.kind === 'MOVE_ROUTE_STOP') {
      await updateRouteStopPositionOptimistic(intent.fromStopClientId, intent.toStopClientId)
      return { droppedPlanClientId: null as string | null }
    }
    else if( intent.kind === 'ASSIGN_ORDER_TO_PLAN'){
      const deliveryPlan = selectPlanByClientId(intent.planClientId)(usePlanStore.getState())
      if (!deliveryPlan?.id) {
        return { droppedPlanClientId: null as string | null }
      }
  
      await updateOrderDeliveryPlan(intent.orderClientId, deliveryPlan.id)
      return { droppedPlanClientId: intent.planClientId }
    }
    
  }

  return { execute }
}
