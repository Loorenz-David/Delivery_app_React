import { useMemo } from 'react'

import { buildClientId } from '@/lib/utils/clientId'

import type { DeliveryPlan, PlanTypeKey } from '../../types/plan'

import { usePlanStateRegistryFlow } from '../../flows/planStateRegistry.flow'



const createInitialPlanForm = (planStateId: number | null | undefined): DeliveryPlan => {
  const nowIso = new Date().toISOString()
  return {
    client_id: buildClientId('delivery_plan'),
    label: 'Plan',
    plan_type: 'local_delivery',
    start_date: nowIso,
    end_date: nowIso,
    state_id: planStateId ?? null,
  }
}

export const usePlanFormBootstrapFlow = () => {
  const stateRegistry = usePlanStateRegistryFlow()

  return useMemo(() => {
    const openPlanStateId = stateRegistry.getByName('Open')?.id ?? null
    const initialPlanForm = createInitialPlanForm(openPlanStateId)

    return {
      initialPlanForm,
    }
  }, [stateRegistry])

 
}
