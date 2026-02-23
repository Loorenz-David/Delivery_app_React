import { useMemo } from 'react'

import { useDeliveryPlanState } from '@/featuresV2/plan/store/planState.store'
import { createPlanStateRegistry } from '@/featuresV2/plan/domain/createPlanStateRegistry'

export const usePlanStateRegistryFlow = () => {
  const states = useDeliveryPlanState()

  return useMemo(() => createPlanStateRegistry(states), [states])
}
