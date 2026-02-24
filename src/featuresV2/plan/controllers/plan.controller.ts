import { useCallback } from 'react'

import { buildClientId } from '@/lib/utils/clientId'
import { ApiError } from '@/lib/api/ApiClient'
import { useMessageManager } from '@/message_manager'
import { planApi } from '@/featuresV2/plan/api/plan.api'
import { useOrderPlanPatchController } from '@/featuresV2/order'
import type {
  DeliveryPlan,
  DeliveryPlanFields,
  PlanTypeKey,
} from '@/featuresV2/plan/types/plan'
import type { InternationalShippingPlanInput } from '@/featuresV2/plan/types/internationalShippingPlan'
import type { LocalDeliveryPlanInput } from '@/featuresV2/plan/planTypes/localDelivery/types/localDeliveryPlan'
import type { StorePickupPlanInput } from '@/featuresV2/plan/types/storePickupPlan'
import {
  insertPlan,
  removePlan,
  selectPlanByClientId,
  selectPlanByServerId,
  updatePlan,
  usePlanStore,
} from '@/featuresV2/plan/store/plan.slice'
import {
  insertInternationalShippingPlan,
  removeInternationalShippingPlan,
  selectInternationalShippingPlanByPlanId,
  updateInternationalShippingPlan,
  useInternationalShippingPlanStore,
} from '@/featuresV2/plan/planTypes/internationalShipping/store/internationalShipping.slice'
import {
  insertLocalDeliveryPlan,
  removeLocalDeliveryPlan,
  selectLocalDeliveryPlanByPlanId,
  updateLocalDeliveryPlan,
  useLocalDeliveryPlanStore,
} from '@/featuresV2/plan/planTypes/localDelivery/store/localDelivery.slice'
import {
  insertStorePickupPlan,
  removeStorePickupPlan,
  selectStorePickupPlanByPlanId,
  updateStorePickupPlan,
  useStorePickupPlanStore,
} from '@/featuresV2/plan/planTypes/storePickup/store/storePickup.slice'



type PlanTypeFields = LocalDeliveryPlanInput | InternationalShippingPlanInput | StorePickupPlanInput




const insertPlanType = (planType: PlanTypeKey, planTypeFields: PlanTypeFields) => {
  switch (planType) {
    case 'local_delivery':
      insertLocalDeliveryPlan(planTypeFields as LocalDeliveryPlanInput)
      break
    case 'international_shipping':
      insertInternationalShippingPlan(planTypeFields as InternationalShippingPlanInput)
      break
    case 'store_pickup':
      insertStorePickupPlan(planTypeFields as StorePickupPlanInput)
      break
    default:
      break
  }
}

const updatePlanType = (
  planType: PlanTypeKey,
  clientId: string,
  updater: (planTypeFields: PlanTypeFields) => PlanTypeFields,
) => {
  switch (planType) {
    case 'local_delivery':
      updateLocalDeliveryPlan(clientId, updater as (plan: LocalDeliveryPlanInput) => LocalDeliveryPlanInput)
      break
    case 'international_shipping':
      updateInternationalShippingPlan(clientId, updater as (plan: InternationalShippingPlanInput) => InternationalShippingPlanInput)
      break
    case 'store_pickup':
      updateStorePickupPlan(clientId, updater as (plan: StorePickupPlanInput) => StorePickupPlanInput)
      break
    default:
      break
  }
}

const removePlanType = (planType: PlanTypeKey, clientId: string) => {
  switch (planType) {
    case 'local_delivery':
      removeLocalDeliveryPlan(clientId)
      break
    case 'international_shipping':
      removeInternationalShippingPlan(clientId)
      break
    case 'store_pickup':
      removeStorePickupPlan(clientId)
      break
    default:
      break
  }
}

const findPlanTypeByPlanId = (planType: PlanTypeKey, planId: number) => {
  switch (planType) {
    case 'local_delivery':
      return selectLocalDeliveryPlanByPlanId(planId)(useLocalDeliveryPlanStore.getState())
    case 'international_shipping':
      return selectInternationalShippingPlanByPlanId(planId)(useInternationalShippingPlanStore.getState())
    case 'store_pickup':
      return selectStorePickupPlanByPlanId(planId)(useStorePickupPlanStore.getState())
    default:
      return null
  }
}

const resolveError = (error: unknown, fallback: string) => ({
  message: error instanceof ApiError ? error.message : fallback,
  status: error instanceof ApiError ? error.status : 500,
})

export function usePlanController() {
  const { showMessage } = useMessageManager()
  const { patchOrdersPlanByServerIds } = useOrderPlanPatchController()


  const createPlan = useCallback(
    async (payload: DeliveryPlanFields, options?: { newOrderLinks?: number[] }) => {
    
      const planTypeKey = payload.plan_type
      const sanitizedNewOrderLinks = Array.isArray(options?.newOrderLinks)
        ? options.newOrderLinks.filter((id) => Number.isFinite(id))
        : []

      const planClientId = payload.client_id || buildClientId('delivery_plan')
      const planTypeClientId =  buildClientId( planTypeKey )

      const normalizedPlanFields: DeliveryPlan = {
        ...payload,
        client_id: planClientId,
      }

      insertPlan(normalizedPlanFields)

      insertPlanType(planTypeKey, {
        client_id: planTypeClientId,
      })

      try {

        const planPayloadApi = {
          ...normalizedPlanFields,
          [planTypeKey]: {client_id:planTypeClientId},
          ...(sanitizedNewOrderLinks.length > 0
            ? { order_ids: sanitizedNewOrderLinks }
            : {}),
        }

        const response = await planApi.createPlan( planPayloadApi )

        const planId = response.data?.delivery_plan?.[planClientId]
        const planTypeId = response.data?.plan_type?.[planTypeClientId]

        if (typeof planId === 'number') {
          updatePlan(planClientId, (plan) => ({
            ...plan,
            id: planId,
          }))

          if (sanitizedNewOrderLinks.length > 0) {
            patchOrdersPlanByServerIds({
              orderServerIds: sanitizedNewOrderLinks,
              planId,
              planType: planTypeKey,
            })
          }
        }

        if (typeof planTypeId === 'number') {
          updatePlanType(planTypeKey, planTypeClientId, (planType) => ({
            ...planType,
            id: planTypeId,
            delivery_plan_id: typeof planId === 'number' ? planId : planType.delivery_plan_id,
          }))
        }
        return response.data

      } catch (error) {
        const resolved = resolveError(error, 'Unable to create delivery plan.')
        console.error('Failed to create plan', error)
        removePlan(planClientId)
        removePlanType(planTypeKey, planTypeClientId)
        showMessage({ status: resolved.status, message: resolved.message })
        return null
      }
    },
    [patchOrdersPlanByServerIds, showMessage],
  )

  const deletePlanInstance = useCallback(
    async (idOrClientId: number | string) => {
      const plan = typeof idOrClientId === 'number'
        ? selectPlanByServerId(idOrClientId)(usePlanStore.getState())
        : selectPlanByClientId(idOrClientId)(usePlanStore.getState())

      if (!plan) {
        showMessage({ status: 404, message: 'Plan not found for deletion.' })
        return null
      }

      if (!plan.id) {
        showMessage({ status: 400, message: 'Plan must be synced before deletion.' })
        return null
      }

      const planTypeInstance = findPlanTypeByPlanId(plan.plan_type, plan.id)
      const previousPlan = { ...plan }
      const previousPlanType = planTypeInstance ? { ...planTypeInstance } : null

      removePlan(plan.client_id)
      if (planTypeInstance) {
        removePlanType(plan.plan_type, planTypeInstance.client_id)
      }

      try {
        await planApi.deletePlan({ target_id: plan.id })
        return true
      } catch (error) {
        const resolved = resolveError(error, 'Unable to delete delivery plan.')
        console.error('Failed to delete plan', error)
        insertPlan(previousPlan)
        if (previousPlanType) {
          insertPlanType(plan.plan_type, previousPlanType)
        }
        showMessage({ status: resolved.status, message: resolved.message })
        return null
      }
    },
    [showMessage],
  )



  return {
    createPlan,
    deletePlan: deletePlanInstance,

  }
}
