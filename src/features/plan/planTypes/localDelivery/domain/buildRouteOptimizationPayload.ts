import type { RouteOptimizationPayload } from '@/features/plan/planTypes/localDelivery/api/routeOptimization.api'
import type { LocalDeliveryPlan } from '@/features/plan/planTypes/localDelivery/types/localDeliveryPlan'
import type { RouteSolution } from '@/features/plan/planTypes/localDelivery/types/routeSolution'
import type { DeliveryPlan } from '@/features/plan/types/plan'
import { toDateOnly } from '@/shared/data-validation/timeValidation'

type Params = {
  plan: DeliveryPlan | null | undefined
  localDeliveryPlan: LocalDeliveryPlan | null | undefined
  selectedRouteSolution: RouteSolution | null
}

export function buildRouteOptimizationPayload({
  plan,
  localDeliveryPlan,
  selectedRouteSolution,
}: Params): RouteOptimizationPayload | null {
  const localDeliveryPlanId = localDeliveryPlan?.id
  if (!localDeliveryPlanId) return null

  const startDate = toDateOnly(plan?.start_date ?? null)
  const endDate = toDateOnly(plan?.end_date ?? null)
  if (!startDate || !endDate) return null

  const startTime = selectedRouteSolution?.set_start_time ?? null
  const endTime = selectedRouteSolution?.set_end_time ?? null

  const globalStartTime =
    buildUtcDateTime(startDate, startTime) ?? buildUtcDateTime(startDate, getCurrentTimeString())

  const globalEndTime =
    buildUtcDateTime(endDate, endTime) ?? buildUtcDateTime(endDate, '23:59:59')

  return {
    local_delivery_plan_id: localDeliveryPlanId,
    global_start_time: globalStartTime ?? undefined,
    global_end_time: globalEndTime ?? undefined,
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
