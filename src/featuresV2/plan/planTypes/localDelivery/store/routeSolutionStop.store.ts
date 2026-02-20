import type { EntityTable } from '@/store/StoreFactory'
import type { RouteSolutionStop } from '@/featuresV2/plan/planTypes/localDelivery/types/routeSolutionStop'

import { createEntityStore } from '@/store/StoreFactory'
import { selectAll, selectByClientId, selectByServerId } from '@/store/entitySelectors'

export const useRouteSolutionStopStore = createEntityStore<RouteSolutionStop>()

export const selectAllRouteSolutionStops = (state: EntityTable<RouteSolutionStop>) =>
  selectAll<RouteSolutionStop>()(state)

export const selectRouteSolutionStopByClientId = (clientId: string | null | undefined) =>
  (state: EntityTable<RouteSolutionStop>) =>
    selectByClientId<RouteSolutionStop>(clientId)(state)

export const selectRouteSolutionStopByServerId = (id: number | null | undefined) =>
  (state: EntityTable<RouteSolutionStop>) =>
    selectByServerId<RouteSolutionStop>(id)(state)

export const selectRouteSolutionStopsBySolutionId = (solutionId: number | null | undefined) =>
  (state: EntityTable<RouteSolutionStop>) => {
    if (solutionId == null) return []
    return state.allIds.reduce<RouteSolutionStop[]>((acc, clientId) => {
      const stop = state.byClientId[clientId]
      if (stop?.route_solution_id === solutionId) {
        acc.push(stop)
      }
      return acc
    }, [])
  }

export const selectRouteSolutionStopByOrderAndSolution = (
  orderId: number | null | undefined,
  solutionId: number | null | undefined,
) =>
  (state: EntityTable<RouteSolutionStop>) => {
    if (orderId == null || solutionId == null) return null
    return state.allIds
      .map((clientId) => state.byClientId[clientId])
      .find((stop) => stop.order_id === orderId && stop.route_solution_id === solutionId) ?? null
  }

export const selectRouteSolutionStopsByOrderId = (orderId: number | null | undefined) =>
  (state: EntityTable<RouteSolutionStop>) => {
    if (orderId == null) return []
    return state.allIds.reduce<RouteSolutionStop[]>((acc, clientId) => {
      const stop = state.byClientId[clientId]
      if (stop?.order_id === orderId) {
        acc.push(stop)
      }
      return acc
    }, [])
  }

export const insertRouteSolutionStop = (stop: RouteSolutionStop) =>
  useRouteSolutionStopStore.getState().insert(stop)

export const insertRouteSolutionStops = (table: { byClientId: Record<string, RouteSolutionStop>; allIds: string[] }) =>
  useRouteSolutionStopStore.getState().insertMany(table)

export const upsertRouteSolutionStop = (stop: RouteSolutionStop) => {
  const state = useRouteSolutionStopStore.getState()
  if (state.byClientId[stop.client_id]) {
    state.update(stop.client_id, (existing) => ({ ...existing, ...stop }))
    return
  }
  state.insert(stop)
}

export const upsertRouteSolutionStops = (table: { byClientId: Record<string, RouteSolutionStop>; allIds: string[] }) => {
  table.allIds.forEach((clientId) => {
    const stop = table.byClientId[clientId]
    if (stop) {
      upsertRouteSolutionStop(stop)
    }
  })
}

export const updateRouteSolutionStop = (
  clientId: string,
  updater: (stop: RouteSolutionStop) => RouteSolutionStop,
) => useRouteSolutionStopStore.getState().update(clientId, updater)

export const removeRouteSolutionStop = (clientId: string) =>
  useRouteSolutionStopStore.getState().remove(clientId)

export const removeRouteSolutionStopsByOrderId = (orderId: number | null | undefined) => {
  if (orderId == null) return
  const state = useRouteSolutionStopStore.getState()
  state.allIds.forEach((clientId) => {
    const stop = state.byClientId[clientId]
    if (stop?.order_id === orderId) {
      state.remove(clientId)
    }
  })
}

export const clearRouteSolutionStops = () =>
  useRouteSolutionStopStore.getState().clear()
