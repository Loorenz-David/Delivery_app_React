import { useCallback } from 'react'

import { ApiError } from '@/lib/api/ApiClient'
import { useMessageManager } from '@/message_manager'

import {
  localDeliveryPlanSettingsApi,
} from '@/featuresV2/plan/planTypes/localDelivery/api/localDeliveryPlanSettings.api'
import { normalizeLocalDeliveryEditFormToSettingsPayload } from '@/featuresV2/plan/planTypes/localDelivery/api/mappers/localDeliveryPlanSettings.mapper'
import { normalizeByClientIdArray } from '@/featuresV2/plan/planTypes/localDelivery/api/mappers/routeSolutionPayload.mapper'
import type { DeliveryPlan } from '@/featuresV2/plan/types/plan'
import type { LocalDeliveryPlan } from '@/featuresV2/plan/planTypes/localDelivery/types/localDeliveryPlan'
import type { RouteSolution } from '@/featuresV2/plan/planTypes/localDelivery/types/routeSolution'
import type { LocalDeliveryEditFormState } from '@/featuresV2/plan/planTypes/localDelivery/forms/localDeliveryEditForm/LocalDeliveryEditForm.types'

import {
  selectPlanByServerId,
  updatePlan,
  usePlanStore,
} from '@/featuresV2/plan/store/plan.slice'
import {
  selectLocalDeliveryPlanByServerId,
  updateLocalDeliveryPlan,
  useLocalDeliveryPlanStore,
} from '@/featuresV2/plan/planTypes/localDelivery/store/localDelivery.slice'
import {
  selectRouteSolutionByServerId,
  setSelectedRouteSolution,
  updateRouteSolution,
  upsertRouteSolution,
  useRouteSolutionStore,
} from '@/featuresV2/plan/planTypes/localDelivery/store/routeSolution.store'
import {
  upsertRouteSolutionStop,
} from '@/featuresV2/plan/planTypes/localDelivery/store/routeSolutionStop.store'

const resolveError = (error: unknown, fallback: string) => ({
  message: error instanceof ApiError ? error.message : fallback,
  status: error instanceof ApiError ? error.status : 500,
})

const applyResponsePayload = (
  payload?: Awaited<ReturnType<typeof localDeliveryPlanSettingsApi.updateLocalDeliverySettings>>['data'] | null,
) => {
  if (!payload) return

  const solutions = normalizeByClientIdArray(payload.route_solution)
  solutions.forEach((solution) => {
    if (solution?.client_id) {
      upsertRouteSolution(solution)
    }
  })

  const selected = solutions.find((solution) => solution.is_selected && solution.id)
  if (selected?.id) {
    setSelectedRouteSolution(selected.id, selected.local_delivery_plan_id ?? null)
  }

  const stops = normalizeByClientIdArray(payload.route_solution_stops)
  stops.forEach((stop) => {
    if (stop?.client_id) {
      upsertRouteSolutionStop(stop)
    }
  })
}

export function useLocalDeliveryPlanSettingsMutations() {
  const { showMessage } = useMessageManager()

  const updateLocalDeliverySettings = useCallback(
    async (formState: LocalDeliveryEditFormState) => {
      const payload = normalizeLocalDeliveryEditFormToSettingsPayload(formState)
      
      const snapshots: {
        plan: DeliveryPlan | null
        local: LocalDeliveryPlan | null
        route: RouteSolution | null
      } = {
        plan: null,
        local: null,
        route: null,
      }

      if (payload.delivery_plan?.id) {
        const plan = selectPlanByServerId(payload.delivery_plan.id)(usePlanStore.getState())
        if (plan) {
          snapshots.plan = { ...plan }
          updatePlan(plan.client_id, (prev) => ({
            ...prev,
            ...payload.delivery_plan,
          }))
        }
      }

      if (payload.local_delivery_plan_id) {
        const localPlan = selectLocalDeliveryPlanByServerId(payload.local_delivery_plan_id)(
          useLocalDeliveryPlanStore.getState(),
        )
        if (localPlan && payload.local_delivery_plan) {
          snapshots.local = { ...localPlan }
          updateLocalDeliveryPlan(localPlan.client_id, (prev) => ({
            ...prev,
            ...payload.local_delivery_plan,
          }))
        }
      }

      const routeSolutionId =
        payload.route_solution?.id ?? payload.route_solution?.route_solution_id
      if (!payload.create_variant_on_save && routeSolutionId) {
        const solution = selectRouteSolutionByServerId(routeSolutionId)(
          useRouteSolutionStore.getState(),
        )
        if (solution) {
          snapshots.route = { ...solution }
          updateRouteSolution(solution.client_id, (prev) => ({
            ...prev,
            ...payload.route_solution,
          }))
        }
      }

      try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
        payload['time_zone'] = timeZone
        const response = await localDeliveryPlanSettingsApi.updateLocalDeliverySettings(payload)

        if(response?.data){
            applyResponsePayload(response.data)
            return response.data
        }
        return {}
      } catch (error) {
        const resolved = resolveError(error, 'Unable to update local delivery settings.')
        console.error('Failed to update local delivery settings', error)

        if (snapshots.plan?.client_id) {
          updatePlan(snapshots.plan.client_id, () => snapshots.plan as DeliveryPlan)
        }
        if (snapshots.local?.client_id) {
          updateLocalDeliveryPlan(snapshots.local.client_id, () => snapshots.local as LocalDeliveryPlan)
        }
        if (snapshots.route?.client_id) {
          updateRouteSolution(snapshots.route.client_id, () => snapshots.route as RouteSolution)
        }

        showMessage({ status: resolved.status, message: resolved.message })
        return null
      }
    },
    [showMessage],
  )

  return {
    updateLocalDeliverySettings,
  }
}
