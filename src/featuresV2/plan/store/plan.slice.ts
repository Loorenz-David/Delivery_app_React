import type { EntityTable } from '@/store/StoreFactory'
import type { DeliveryPlan } from '@/featuresV2/plan/types/plan'
import type { DeliveryPlanState } from '@/featuresV2/plan/types/planState'


import { createEntityStore } from '@/store/StoreFactory'
import { selectAll, selectByClientId, selectByServerId } from '@/store/entitySelectors'
import { useDeliveryPlanStateStore } from '@/featuresV2/plan/store/planState.store'

export const usePlanStore = createEntityStore<DeliveryPlan>()

const selectPlansInternal = selectAll<DeliveryPlan>()
export const selectAllPlans = (state: EntityTable<DeliveryPlan>) => selectPlansInternal(state)

export const selectPlanByClientId = (clientId: string | null | undefined) =>
  (state: EntityTable<DeliveryPlan>) =>
    selectByClientId<DeliveryPlan>(clientId)(state)

export const selectPlanByServerId = (id: number | null | undefined) =>
  (state: EntityTable<DeliveryPlan>) =>
    selectByServerId<DeliveryPlan>(id)(state)

export const selectDeliveryPlanStateById = (stateId: number | null | undefined) =>
  (state: EntityTable<DeliveryPlanState>) =>
    selectByServerId<DeliveryPlanState>(stateId)(state)

export const useDeliveryPlanStateById = (stateId: number | null | undefined) =>
  useDeliveryPlanStateStore(selectDeliveryPlanStateById(stateId))

export const insertPlan = (plan: DeliveryPlan) =>
  usePlanStore.getState().insert(plan)

export const insertPlans = (table: { byClientId: Record<string, DeliveryPlan>; allIds: string[] }) =>
  usePlanStore.getState().insertMany(table)

export const upsertPlan = (plan: DeliveryPlan) => {
  const state = usePlanStore.getState()
  if (state.byClientId[plan.client_id]) {
    state.update(plan.client_id, (existing) => ({ ...existing, ...plan }))
    return
  }
  state.insert(plan)
}

export const upsertPlans = (table: { byClientId: Record<string, DeliveryPlan>; allIds: string[] }) => {
  table.allIds.forEach((clientId) => {
    const plan = table.byClientId[clientId]
    if (plan) {
      upsertPlan(plan)
    }
  })
}

export const updatePlan = (clientId: string, updater: (plan: DeliveryPlan) => DeliveryPlan) =>
  usePlanStore.getState().update(clientId, updater)

export const removePlan = (clientId: string) =>
  usePlanStore.getState().remove(clientId)

export const clearPlans = () =>
  usePlanStore.getState().clear()

export const setDeliveryPlanStateId = (clientId: string, stateId: number | null) =>
  usePlanStore.getState().update(clientId, (plan) => ({
    ...plan,
    state_id: stateId ?? null,
  }))
