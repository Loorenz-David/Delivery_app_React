import type { RouteOptimizationResponse } from '@/featuresV2/plan/planTypes/localDelivery/api/routeOptimization.api'
import type { RouteSolution } from '@/featuresV2/plan/planTypes/localDelivery/types/routeSolution'
import type { RouteSolutionStop } from '@/featuresV2/plan/planTypes/localDelivery/types/routeSolutionStop'

export const normalizeRouteOptimizationSolutions = (
  payload?: RouteOptimizationResponse | null,
): RouteSolution[] => {
  if (!payload?.route_solution) return []
  if ('client_id' in payload.route_solution) {
    return [payload.route_solution as RouteSolution]
  }
  return Object.values(payload.route_solution as Record<string, RouteSolution>)
}

export const normalizeRouteOptimizationStops = (
  raw?: RouteOptimizationResponse['route_solution_stop'],
): RouteSolutionStop[] => {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  return Object.values(raw as Record<string, RouteSolutionStop>)
}
