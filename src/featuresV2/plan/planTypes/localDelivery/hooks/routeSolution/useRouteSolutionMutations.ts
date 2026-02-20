import { useCallback } from 'react'

import { ApiError } from '@/lib/api/ApiClient'
import { useMessageManager } from '@/message_manager'

import { routeSolutionApi } from '@/featuresV2/plan/planTypes/localDelivery/api/routeSolution.api'
import type {
  RouteSolutionAddressPayload,
  RouteSolutionGetResponse,
  RouteSolutionTimesPayload,
  RouteSolutionUpdateResponse,
} from '@/featuresV2/plan/planTypes/localDelivery/api/routeSolution.api'
import {
  selectRouteSolutionByServerId,
  selectRouteSolutionsByLocalDeliveryPlanId,
  setSelectedRouteSolution,
  upsertRouteSolution,
  upsertRouteSolutions,
  useRouteSolutionStore,
} from '@/featuresV2/plan/planTypes/localDelivery/store/routeSolution.store'
import {
  upsertRouteSolutionStop,
  upsertRouteSolutionStops,
} from '@/featuresV2/plan/planTypes/localDelivery/store/routeSolutionStop.store'
import type { RouteSolution } from '@/featuresV2/plan/planTypes/localDelivery/types/routeSolution'
import type { RouteSolutionStop } from '@/featuresV2/plan/planTypes/localDelivery/types/routeSolutionStop'
import { useOrderStateBatch } from '@/featuresV2/order/hooks/orderStates/useOrderStateBatch'
import { usePlanStateChanges } from '@/featuresV2/plan/hooks/planStates/usePlanStateChanges'

const resolveError = (error: unknown, fallback: string) => ({
  message: error instanceof ApiError ? error.message : fallback,
  status: error instanceof ApiError ? error.status : 500,
})

const applyUpdatePayload = (payload?: RouteSolutionUpdateResponse | null) => {
  if (!payload) return
  const solutions = normalizeSolutions(payload.route_solution)

  solutions.forEach((solution) => {
    if (solution?.client_id) {
      upsertRouteSolution(solution)
    }
  })

  const stops = normalizeStops(payload.route_solution_stops)
  stops.forEach((stop) => {
    if (stop?.client_id) {
      upsertRouteSolutionStop(stop)
    }
  })
}

const applyGetPayload = (payload?: RouteSolutionGetResponse | null) => {
  if (!payload?.route_solution) return
  const entry = payload.route_solution
  if ('byClientId' in entry && 'allIds' in entry) {
    upsertRouteSolutions(entry)
  } else {
    const solution = entry as RouteSolution
    if (solution?.client_id) {
      upsertRouteSolution(solution)
    }
  }
  if (payload.route_solution_stop) {
    if (Array.isArray(payload.route_solution_stop)) {
      payload.route_solution_stop.forEach((stop) => {
        if (stop?.client_id) {
          upsertRouteSolutionStop(stop)
        }
      })
    } else {
      upsertRouteSolutionStops(payload.route_solution_stop)
    }
  }
}

const normalizeSolutions = (
  entry?: RouteSolutionUpdateResponse['route_solution'],
): RouteSolution[] => {
  if (!entry) return []
  if ('byClientId' in entry && 'allIds' in entry) {
    return entry.allIds.map((clientId) => entry.byClientId[clientId]).filter(Boolean)
  }
  return Array.isArray(entry) ? entry : [entry]
}

const normalizeStops = (
  entry?: RouteSolutionUpdateResponse['route_solution_stops'],
): RouteSolutionStop[] => {
  if (!entry) return []
  if (Array.isArray(entry)) return entry
  if ('byClientId' in entry && 'allIds' in entry) {
    return entry.allIds.map((clientId) => entry.byClientId[clientId]).filter(Boolean)
  }
  return []
}

export function useRouteSolutionMutations() {
  const { showMessage } = useMessageManager()
  const { rollbackOrderStates, changeOrderStateBatch } = useOrderStateBatch()
  const { changePlanState } = usePlanStateChanges()

  const updateRouteSolutionAddress = useCallback(
    async (payload: RouteSolutionAddressPayload) => {
      try {
        const response = await routeSolutionApi.updateAddress(payload)
        applyUpdatePayload(response.data)
        return response.data
      } catch (error) {
        const resolved = resolveError(error, 'Unable to update route solution address.')
        console.error('Failed to update route solution address', error)
        showMessage({ status: resolved.status, message: resolved.message })
        return null
      }
    },
    [showMessage],
  )

  const updateRouteSolutionTimes = useCallback(
    async (payload: RouteSolutionTimesPayload) => {
      try {
        const response = await routeSolutionApi.updateTimes(payload)
        applyUpdatePayload(response.data)
        return response.data
      } catch (error) {
        const resolved = resolveError(error, 'Unable to update route solution times.')
        console.error('Failed to update route solution times', error)
        showMessage({ status: resolved.status, message: resolved.message })
        return null
      }
    },
    [showMessage],
  )

  const selectRouteSolution = useCallback(
    async (routeSolutionId: number, localDeliveryPlanId: number | null | undefined) => {
      if (localDeliveryPlanId == null) {
        showMessage({ status: 400, message: 'Local delivery plan is required.' })
        return null
      }
      const state = useRouteSolutionStore.getState()
      const previous = selectRouteSolutionsByLocalDeliveryPlanId(localDeliveryPlanId)(state).map((solution) => ({
        client_id: solution.client_id,
        is_selected: solution.is_selected ?? false,
      }))

      setSelectedRouteSolution(routeSolutionId, localDeliveryPlanId)

      try {
        const response = await routeSolutionApi.selectRouteSolution(routeSolutionId)
        applyUpdatePayload(response.data)
        const selected = selectRouteSolutionByServerId(routeSolutionId)(useRouteSolutionStore.getState())
        if (selected && selected._representation !== 'full') {
          const getResponse = await routeSolutionApi.getRouteSolution(routeSolutionId, true)
          applyGetPayload(getResponse.data)
        }
        return response.data
      } catch (error) {
        const resolved = resolveError(error, 'Unable to select route solution.')
        console.error('Failed to select route solution', error)
        previous.forEach((entry) => {
          useRouteSolutionStore.getState().update(entry.client_id, (solution) => ({
            ...solution,
            is_selected: entry.is_selected,
          }))
        })
        showMessage({ status: resolved.status, message: resolved.message })
        return null
      }
    },
    [showMessage],
  )

  const routeReadyForDelivery = useCallback(
    async (deliveryPlanId:number) =>{

      const currentOrderStatesMap = changeOrderStateBatch(
        {type:'deliveryPlanId', deliveryPlanId}, 
        'Ready'
      )
      const curerntPlanStateMap = changePlanState(deliveryPlanId, 'Ready')

      try{
        
        const response = await routeSolutionApi.routeReadyForDelivery(deliveryPlanId)

        const failed_order_state_updates = response.data?.failed_order_state_updates ?? {}

        if(Object.keys(failed_order_state_updates).length){
          
          
        }

        return true
      }catch(error){
        const resolved = resolveError(error, 'Unable to mark route solution as ready for delivery.')
        console.error('Failed to update route solution as ready for delivery', error)


        rollbackOrderStates(currentOrderStatesMap)
        changePlanState(
          curerntPlanStateMap[0],
          curerntPlanStateMap[1] as number 
        )
        showMessage({ status: resolved.status, message: resolved.message })
        return false
      }
    },
    []
  )

  return {
    updateRouteSolutionAddress,
    updateRouteSolutionTimes,
    selectRouteSolution,
    routeReadyForDelivery
  }
}
