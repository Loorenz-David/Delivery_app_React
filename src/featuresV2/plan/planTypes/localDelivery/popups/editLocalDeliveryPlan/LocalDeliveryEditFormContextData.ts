import { usePopupManager } from '@/shared/resource-manager/useResourceManager'
import { useLocalDeliveryPlanByServerId } from '@/featuresV2/plan/planTypes/localDelivery/store/useLocalDeliveryPlan.selector'
import { usePlanByServerId } from '@/featuresV2/plan/store/usePlan.selector'
import {
  useRouteSolutionsByLocalDeliveryPlanId,
  useSelectedRouteSolutionByLocalDeliveryPlanId,
} from '@/featuresV2/plan/planTypes/localDelivery/store/useRouteSolution.selector'

import type { PopupPayload } from './LocalDeliveryEditForm.types'

export const useLocalDeliveryEditFormContextData = () => {
  const popupManager = usePopupManager()
  const entryPayload = popupManager.getEntryPayload('LocalDeliveryEditForm') as PopupPayload

  const rawLocalDeliveryPlanId =
    entryPayload?.localDeliveryPlanId ?? entryPayload?.local_delivery_plan_id ?? null
  const parsedLocalDeliveryPlanId =
    typeof rawLocalDeliveryPlanId === 'string'
      ? Number(rawLocalDeliveryPlanId)
      : rawLocalDeliveryPlanId
  const localDeliveryPlanId =
    typeof parsedLocalDeliveryPlanId === 'number' && Number.isNaN(parsedLocalDeliveryPlanId)
      ? null
      : parsedLocalDeliveryPlanId

  const localDeliveryPlan = useLocalDeliveryPlanByServerId(localDeliveryPlanId)
  const plan = usePlanByServerId(localDeliveryPlan?.delivery_plan_id)
  const selectedRouteSolution = useSelectedRouteSolutionByLocalDeliveryPlanId(localDeliveryPlanId)
  const routeSolutions = useRouteSolutionsByLocalDeliveryPlanId(localDeliveryPlanId)

  return {
    localDeliveryPlanId,
    localDeliveryPlan,
    plan,
    selectedRouteSolution,
    routeSolutions,
  }
}
