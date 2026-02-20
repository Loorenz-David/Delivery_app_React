import { useLocalDeliveryPlanStore, selectLocalDeliveryPlanByServerId } from '@/featuresV2/plan/planTypes/localDelivery/store/localDelivery.slice'
import { useRouteSolutionStore, selectRouteSolutionByServerId } from '@/featuresV2/plan/planTypes/localDelivery/store/routeSolution.store'
import { usePlanStore, selectPlanByServerId } from '@/featuresV2/plan/store/plan.slice'

const DEFAULT_BLOCK_MESSAGE =
  'This route has already ended and cannot be optimized. Update the delivery plan end date to a future time to re-optimize.'

export const getRouteOptimizationBlockMessage = () => DEFAULT_BLOCK_MESSAGE

export const isEndDateInFuture = (endDate?: string | null) => {
  if (!endDate) return true
  const parsed = new Date(endDate)

  if (Number.isNaN(parsed.getTime())) return true
  return parsed.getTime() > Date.now()
}

export const getPlanEndDateByLocalDeliveryPlanId = (localDeliveryPlanId?: number | null) => {
  if (localDeliveryPlanId == null) return null
  const localPlan = selectLocalDeliveryPlanByServerId(localDeliveryPlanId)(useLocalDeliveryPlanStore.getState())
  if (!localPlan?.delivery_plan_id) return null
  const plan = selectPlanByServerId(localPlan.delivery_plan_id)(usePlanStore.getState())
  return plan?.end_date ?? null
}

export const getPlanEndDateByRouteSolutionId = (routeSolutionId?: number | null) => {
  if (routeSolutionId == null) return null
  const solution = selectRouteSolutionByServerId(routeSolutionId)(useRouteSolutionStore.getState())
  if (!solution?.local_delivery_plan_id) return null
  const plan = selectPlanByServerId(solution.local_delivery_plan_id)(usePlanStore.getState())
  return plan?.end_date ?? null
}
