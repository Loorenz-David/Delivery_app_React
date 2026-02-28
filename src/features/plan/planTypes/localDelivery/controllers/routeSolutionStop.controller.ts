import { useCallback } from 'react'
import { arrayMove } from '@dnd-kit/sortable'

import { ApiError } from '@/lib/api/ApiClient'
import { useMessageHandler } from '@/shared/message-handler'

import { routeSolutionApi } from '@/features/plan/planTypes/localDelivery/api/routeSolution.api'
import type { RouteSolutionUpdateResponse } from '@/features/plan/planTypes/localDelivery/api/routeSolution.api'
import { normalizeByClientIdArray } from '@/features/plan/planTypes/localDelivery/api/mappers/routeSolutionPayload.mapper'
import {
  selectRouteSolutionByServerId,
  setSelectedRouteSolution,
  upsertRouteSolution,
  useRouteSolutionStore,
} from '@/features/plan/planTypes/localDelivery/store/routeSolution.store'
import {
  selectRouteSolutionStopByClientId,
  selectRouteSolutionStopsBySolutionId,
  upsertRouteSolutionStop,
  useRouteSolutionStopStore,
} from '@/features/plan/planTypes/localDelivery/store/routeSolutionStop.store'
import {
  getRouteOptimizationBlockMessage,
  isEndDateInFuture,
} from '@/features/plan/planTypes/localDelivery/utils/routeOptimizationGuard'
import { getPlanEndDateByRouteSolutionId } from '@/features/plan/planTypes/localDelivery/store/routeSolution.store'

const resolveError = (error: unknown, fallback: string) => ({
  message: error instanceof ApiError ? error.message : fallback,
  status: error instanceof ApiError ? error.status : 500,
})

const applyUpdatePayload = (payload?: RouteSolutionUpdateResponse | null) => {
  if (!payload) return
  const solutions = normalizeByClientIdArray(payload.route_solution)

  solutions.forEach((solution) => {
    if (solution?.client_id) {
      upsertRouteSolution(solution)
    }
    if (solution?.is_selected && solution?.id) {
      setSelectedRouteSolution(solution.id, solution.local_delivery_plan_id ?? null)
    }
  })

  const stops = normalizeByClientIdArray(payload.route_solution_stops)
  if (stops.length) {
    stops.forEach((stop) => {
      if (stop?.client_id) {
        upsertRouteSolutionStop(stop)
      }
    })
  }

  if (!solutions.length && stops.length) {
    const routeSolutionIds = Array.from(
      new Set(stops.map((stop) => stop.route_solution_id).filter(Boolean)),
    )
    if (routeSolutionIds.length === 1) {
      const solutionId = routeSolutionIds[0] as number
      const stored = selectRouteSolutionByServerId(solutionId)(useRouteSolutionStore.getState())
      if (stored?.id) {
        setSelectedRouteSolution(stored.id, stored.local_delivery_plan_id ?? null)
      }
    }
  }
}

export function useRouteSolutionStopMutations() {
  const { showMessage } = useMessageHandler()

  const updateRouteStopPosition = useCallback(
    async (routeStopId: number, position: number) => {
      try {
        const response = await routeSolutionApi.updateStopPosition(routeStopId, position)
        applyUpdatePayload(response.data)
        return response.data
      } catch (error) {
        const resolved = resolveError(error, 'Unable to update route stop position.')
        console.error('Failed to update route stop position', error)
        showMessage({ status: resolved.status, message: resolved.message })
        return null
      }
    },
    [showMessage],
  )

  const updateRouteStopPositionOptimistic = useCallback(
    async (activeStopClientId: string, overStopClientId: string) => {
      if (activeStopClientId === overStopClientId) return null
      const state = useRouteSolutionStopStore.getState()
      const activeStop = selectRouteSolutionStopByClientId(activeStopClientId)(state)
      const overStop = selectRouteSolutionStopByClientId(overStopClientId)(state)

      if (!activeStop || !overStop) {
        showMessage({ status: 404, message: 'Route stop not found for reorder.' })
        return null
      }
      if (!activeStop.id) {
        showMessage({ status: 400, message: 'Route stop must be synced before reorder.' })
        return null
      }
      if (!activeStop.route_solution_id) {
        showMessage({ status: 400, message: 'Route stop is missing route solution.' })
        return null
      }

      const endDate = getPlanEndDateByRouteSolutionId(activeStop.route_solution_id)
      if (!isEndDateInFuture(endDate)) {
        showMessage({ status: 400, message: getRouteOptimizationBlockMessage() })
        return null
      }

      const stops = selectRouteSolutionStopsBySolutionId(activeStop.route_solution_id)(state).sort(
        (a, b) => (a.stop_order ?? Number.POSITIVE_INFINITY) - (b.stop_order ?? Number.POSITIVE_INFINITY),
      )
      const fromIndex = stops.findIndex((stop) => stop.client_id === activeStopClientId)
      const toIndex = stops.findIndex((stop) => stop.client_id === overStopClientId)
      if (fromIndex < 0 || toIndex < 0) return null
      if (fromIndex === toIndex) return null

      const previous = stops.map((stop) => ({
        client_id: stop.client_id,
        stop_order: stop.stop_order ?? null,
        expected_arrival_time: stop.expected_arrival_time ?? null,
        eta_status: stop.eta_status ?? null,
      }))

      const reordered = arrayMove(stops, fromIndex, toIndex)
      useRouteSolutionStopStore.setState((currentState) => {
        const nextByClientId = { ...currentState.byClientId }

        reordered.forEach((stop, index) => {
          const existing = nextByClientId[stop.client_id]
          if (!existing) return

          const shouldInvalidate = index >= toIndex
          nextByClientId[stop.client_id] = {
            ...existing,
            stop_order: index + 1,
            eta_status: shouldInvalidate ? 'estimated' : existing.eta_status,
            expected_arrival_time: shouldInvalidate ? 'loading' : existing.expected_arrival_time,
          }
        })

        return {
          ...currentState,
          byClientId: nextByClientId,
        }
      })

      try {
        const response = await routeSolutionApi.updateStopPosition(activeStop.id, toIndex + 1)
        applyUpdatePayload(response.data)

        return response.data
      } catch (error) {
        const resolved = resolveError(error, 'Unable to update route stop position.')
        console.error('Failed to update route stop position', error)

        useRouteSolutionStopStore.setState((currentState) => {
          const nextByClientId = { ...currentState.byClientId }

          previous.forEach((snapshot) => {
            const existing = nextByClientId[snapshot.client_id]
            if (!existing) return

            nextByClientId[snapshot.client_id] = {
              ...existing,
              stop_order: snapshot.stop_order ?? existing.stop_order,
              expected_arrival_time: snapshot.expected_arrival_time ?? existing.expected_arrival_time,
              eta_status: snapshot.eta_status ?? existing.eta_status,
            }
          })

          return {
            ...currentState,
            byClientId: nextByClientId,
          }
        })

        showMessage({ status: resolved.status, message: resolved.message })
        return null
      }
    },
    [showMessage],
  )

  return {
    updateRouteStopPosition,
    updateRouteStopPositionOptimistic,
  }
}
