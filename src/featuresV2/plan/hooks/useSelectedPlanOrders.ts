import type { ComponentType } from 'react'

import type { PlanTypeKey } from '@/featuresV2/plan/types/plan'
import { PlanSectionTypesMap } from '@/featuresV2/plan/utils/planSectionTypeMap'

export const useSelectedPlanOrders = (
  planType: PlanTypeKey | null | undefined,
): ComponentType<any> | null => {
  if (!planType) return null
  return PlanSectionTypesMap[planType]
}
