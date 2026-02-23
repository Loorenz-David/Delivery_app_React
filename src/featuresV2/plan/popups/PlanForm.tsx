import { PlanFormFeature } from '@/featuresV2/plan/forms/planForm/PlanForm'
import { usePlanFormPopupConfig } from './planFormPopupConfig.hook'

export const PlanForm = () => {
  usePlanFormPopupConfig()

  return <PlanFormFeature />
}
