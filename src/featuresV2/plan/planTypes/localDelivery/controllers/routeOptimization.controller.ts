import { useCallback } from 'react'

import { ApiError } from '@/lib/api/ApiClient'
import { useMessageManager } from '@/message_manager'

import { routeOptimizationApi } from '@/featuresV2/plan/planTypes/localDelivery/api/routeOptimization.api'
import type {
  RouteOptimizationPayload,
  RouteOptimizationResponse,
} from '@/featuresV2/plan/planTypes/localDelivery/api/routeOptimization.api'
import {
  normalizeRouteOptimizationSolutions,
  normalizeRouteOptimizationStops,
} from '@/featuresV2/plan/planTypes/localDelivery/api/mappers/routeOptimization.mapper'
import { upsertRouteSolution } from '@/featuresV2/plan/planTypes/localDelivery/store/routeSolution.store'
import { upsertRouteSolutionStop } from '@/featuresV2/plan/planTypes/localDelivery/store/routeSolutionStop.store'
import type { RouteSolution } from '@/featuresV2/plan/planTypes/localDelivery/types/routeSolution'
import {
  getRouteOptimizationBlockMessage,
  isEndDateInFuture,
} from '@/featuresV2/plan/planTypes/localDelivery/utils/routeOptimizationGuard'
import { getPlanEndDateByLocalDeliveryPlanId } from '@/featuresV2/plan/planTypes/localDelivery/store/localDelivery.slice'
import { usePlanByServerId } from '@/featuresV2/plan/store/usePlan.selector'
import { toDateOnly } from '@/shared/data-validation/timeValidation'

const resolveError = (error: unknown, fallback: string) => ({
  message: error instanceof ApiError ? error.message : fallback,
  status: error instanceof ApiError ? error.status : 500,
})

const applyOptimizationPayload = (payload?: RouteOptimizationResponse | null) => {
  if (!payload) return
  normalizeRouteOptimizationSolutions(payload).forEach((solution) => {
    if (solution?.client_id) {
      upsertRouteSolution(solution)
    }
  })

  const stops = [
    ...normalizeRouteOptimizationStops(payload.route_solution_stop),
    ...normalizeRouteOptimizationStops(payload.route_solution_stop_skipped),
  ]
  stops.forEach((stop) => {
    if (stop?.client_id) {
      upsertRouteSolutionStop(stop)
    }
  })
}

type BuildOptimizationPayloadParams = {
  planId?: number | null
  localDeliveryPlanId?: number | null
  selectedSolution?: RouteSolution | null
}

export const useRouteOptimizationPayload = ({
  planId,
  localDeliveryPlanId,
  selectedSolution,
}: BuildOptimizationPayloadParams) => {
  const plan = usePlanByServerId(planId)

  return useCallback((): RouteOptimizationPayload | null => {
    if (!localDeliveryPlanId) return null

    const startDate = toDateOnly(plan?.start_date ?? null)
    const endDate = toDateOnly(plan?.end_date ?? null)
    if (!startDate || !endDate) return null

    const startTime = selectedSolution?.set_start_time ?? null
    const endTime = selectedSolution?.set_end_time ?? null

    const globalStartTime =
      buildUtcDateTime(startDate, startTime) ??
      buildUtcDateTime(startDate, getCurrentTimeString())

    const globalEndTime =
      buildUtcDateTime(endDate, endTime) ?? buildUtcDateTime(endDate, '23:59:59')

    return {
      local_delivery_plan_id: localDeliveryPlanId,
      global_start_time: globalStartTime ?? undefined,
      global_end_time: globalEndTime ?? undefined,
    }
  }, [localDeliveryPlanId, plan?.end_date, plan?.start_date, selectedSolution?.set_end_time, selectedSolution?.set_start_time])
}

export function useRouteOptimizationMutations() {
  const { showMessage } = useMessageManager()

  const createOptimization = useCallback(
    async (payload: RouteOptimizationPayload) => {
      const endDate = getPlanEndDateByLocalDeliveryPlanId(payload.local_delivery_plan_id)

      if (!isEndDateInFuture(endDate)) {
        showMessage({ status: 400, message: getRouteOptimizationBlockMessage() })
        return null
      }
      try {
        const response = await routeOptimizationApi.createOptimization(payload)
        applyOptimizationPayload(response.data)
        return response.data
      } catch (error) {
        const resolved = resolveError(error, 'Unable to create route optimization.')
        console.error('Failed to create route optimization', error)
        showMessage({ status: resolved.status, message: resolved.message })
        return null
      }
    },
    [showMessage],
  )

  const updateOptimization = useCallback(
    async (payload: RouteOptimizationPayload) => {
      const endDate = getPlanEndDateByLocalDeliveryPlanId(payload.local_delivery_plan_id)
      if (!isEndDateInFuture(endDate)) {
        showMessage({ status: 400, message: getRouteOptimizationBlockMessage() })
        return null
      }
      try {
        const response = await routeOptimizationApi.updateOptimization(payload)
        applyOptimizationPayload(response.data)
        return response.data
      } catch (error) {
        const resolved = resolveError(error, 'Unable to update route optimization.')
        console.error('Failed to update route optimization', error)
        showMessage({ status: resolved.status, message: resolved.message })
        return null
      }
    },
    [showMessage],
  )

  return {
    createOptimization,
    updateOptimization,
  }
}

const buildUtcDateTime = (dateValue: string, timeValue: string | null) => {
  const normalized = normalizeTimeInput(timeValue)
  if (!normalized) return null
  const parsed = new Date(`${dateValue}T${normalized}Z`)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

const normalizeTimeInput = (value: string | null) => {
  if (!value) return null
  const parts = value.split(':').map((segment) => segment.trim())
  if (!parts.length) return null
  const [hours = '00', minutes = '00', seconds = '00'] = parts
  return `${padTime(hours)}:${padTime(minutes)}:${padTime(seconds)}`
}

const padTime = (value: string) => value.padStart(2, '0')

const getCurrentTimeString = () => {
  const now = new Date()
  return `${padTime(String(now.getHours()))}:${padTime(String(now.getMinutes()))}:${padTime(
    String(now.getSeconds()),
  )}`
}
