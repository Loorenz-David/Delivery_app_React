import { PlanFormFeature } from '@/features/plan/forms/planForm/PlanForm'
import { usePlanFormPopupConfig } from './planFormPopupConfig.hook'

export const PlanForm = () => {
  usePlanFormPopupConfig()

  return <PlanFormFeature />
}
