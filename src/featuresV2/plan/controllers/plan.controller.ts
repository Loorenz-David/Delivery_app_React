import { useCallback } from 'react'

import { buildClientId } from '@/lib/utils/clientId'
import { ApiError } from '@/lib/api/ApiClient'
import { useMessageManager } from '@/message_manager'
import { planApi } from '@/featuresV2/plan/api/plan.api'
import type {
  DeliveryPlan,
  PlanCreatePayload,
  PlanTypeKey,
  PlanTypePayloadKey,
  PlanTypeStoreKey,
  PlanUpdateFields,
} from '@/featuresV2/plan/types/plan'
import {
  PLAN_TYPE_KEY_MAP,
  PLAN_TYPE_KEYS,
  PLAN_TYPE_STORE_KEYS,
  PLAN_TYPE_STORE_KEY_MAP,
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




const normalizePlanTypeKey = (value?: PlanTypePayloadKey | null): PlanTypeKey | null => {
  if (!value) return null
  if (PLAN_TYPE_KEYS.includes(value as PlanTypeKey)) {
    return value as PlanTypeKey
  }
  if ((value as PlanTypeStoreKey) in PLAN_TYPE_KEY_MAP) {
    return PLAN_TYPE_KEY_MAP[value as PlanTypeStoreKey]
  }
  return null
}

const resolvePlanTypeStoreKey = (value?: PlanTypePayloadKey | null): PlanTypeStoreKey | null => {
  if (!value) return null
  if (PLAN_TYPE_STORE_KEYS.includes(value as PlanTypeStoreKey)) {
    return value as PlanTypeStoreKey
  }
  if ((value as PlanTypeKey) in PLAN_TYPE_STORE_KEY_MAP) {
    return PLAN_TYPE_STORE_KEY_MAP[value as PlanTypeKey]
  }
  return null
}

type PlanTypeFields = LocalDeliveryPlanInput | InternationalShippingPlanInput | StorePickupPlanInput

type PlanTypePayload = {
  planTypeKey: PlanTypeKey
  planTypeStoreKey: PlanTypeStoreKey
  planTypeFields: PlanTypeFields
}



const extractPlanTypePayload = (fields: Record<string, unknown>): PlanTypePayload | null => {
  const planTypeKeyRaw = fields.plan_type as PlanTypePayloadKey | undefined
  const planTypeKey = normalizePlanTypeKey(planTypeKeyRaw)
  if (!planTypeKey) {
    return null
  }

  const planTypeStoreKey = resolvePlanTypeStoreKey(planTypeKeyRaw) ?? PLAN_TYPE_STORE_KEY_MAP[planTypeKey]
  const planTypeFields = (fields[planTypeKey] ?? fields[planTypeStoreKey]) as PlanTypeFields | undefined

  if (!planTypeFields || typeof planTypeFields !== 'object') {
    return null
  }

  return {
    planTypeKey,
    planTypeStoreKey,
    planTypeFields,
  }
}

const stripPlanTypeFields = (fields: Record<string, unknown>, planType?: PlanTypePayload | null) => {
  const cleaned = { ...fields }
  delete cleaned.plan_type

  if (planType) {
    delete cleaned[planType.planTypeKey]
    delete cleaned[planType.planTypeStoreKey]
  } else {
    PLAN_TYPE_KEYS.forEach((key) => {
      delete cleaned[key]
    })
    PLAN_TYPE_STORE_KEYS.forEach((key) => {
      delete cleaned[key]
    })
  }

  return cleaned
}

const mapPlanFieldsForApi = (fields: Record<string, unknown>) => {
  const payload = { ...fields }
  if ('orders_ids' in payload && !('orders' in payload)) {
    payload.orders = payload.orders_ids
    delete payload.orders_ids
  }
  return payload
}

const mapPlanTypeFieldsForApi = (planTypeKey: PlanTypeKey, fields: PlanTypeFields) => {
  const payload = { ...fields } as Record<string, unknown>

  if (planTypeKey === 'local_delivery') {
    if ('route_solutions_ids' in payload && !('route_solutions' in payload)) {
      payload.route_solutions = payload.route_solutions_ids
      delete payload.route_solutions_ids
    }
  }

  return payload
}

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


  const createPlan = useCallback(
    async (payload: PlanCreatePayload) => {
      const planTypePayload = extractPlanTypePayload(payload as Record<string, unknown>)
      if (!planTypePayload) {
        showMessage({ status: 400, message: 'Missing or invalid plan type payload.' })
        console.warn('Invalid plan create payload', payload)
        return null
      }

      const planTypeKey = planTypePayload.planTypeKey
      const planTypeFields = planTypePayload.planTypeFields

      const planClientId = payload.client_id || buildClientId('plan')
      const planTypeClientId = (planTypeFields as PlanTypeFields).client_id || buildClientId(planTypeKey)

      const planFields = stripPlanTypeFields(payload as Record<string, unknown>, planTypePayload)
      const normalizedPlanFields: DeliveryPlan = {
        ...( planFields as DeliveryPlan ),
        client_id: planClientId,
        plan_type: planTypeKey,
      }

      const optimisticPlan: DeliveryPlan = {
        client_id: planClientId,
        plan_type: planTypeKey,
        label: normalizedPlanFields.label as string,
        start_date: normalizedPlanFields.start_date as string | null | undefined,
        end_date: normalizedPlanFields.end_date as string | null | undefined,
        orders_ids: normalizedPlanFields.orders_ids as number[] | undefined,
        state_id: normalizedPlanFields.state_id as number | null | undefined,
      }

      insertPlan(optimisticPlan)
      insertPlanType(planTypeKey, {
        ...planTypeFields,
        client_id: planTypeClientId,
      } as PlanTypeFields)

      try {
        const apiFields = mapPlanFieldsForApi(normalizedPlanFields)
        const apiPlanTypeFields = mapPlanTypeFieldsForApi(planTypeKey, {
          ...planTypeFields,
          client_id: planTypeClientId,
        })

        const response = await planApi.createPlan({
          ...(apiFields as PlanCreatePayload),
          plan_type: planTypeKey,
          [planTypeKey]: apiPlanTypeFields,
        })

        const planId = response.data?.delivery_plan?.[planClientId]
        const planTypeId = response.data?.plan_type?.[planTypeClientId]

        if (typeof planId === 'number') {
          updatePlan(planClientId, (plan) => ({
            ...plan,
            id: planId,
          }))
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
    [showMessage],
  )

  const updatePlanInstance = useCallback(
    async (clientId: string, fields: PlanUpdateFields) => {
      const existing = selectPlanByClientId(clientId)(usePlanStore.getState())
      if (!existing) {
        showMessage({ status: 404, message: 'Plan not found for update.' })
        return null
      }
      if (!existing.id) {
        showMessage({ status: 400, message: 'Plan must be synced before update.' })
        return null
      }

      const rawFields = fields as Record<string, unknown>
      const hasPlanTypeKey = 'plan_type' in rawFields
      const planTypePayload = extractPlanTypePayload(rawFields)
      if (hasPlanTypeKey && !planTypePayload) {
        showMessage({ status: 400, message: 'Plan type fields are required for plan_type updates.' })
        return null
      }

      if (!planTypePayload) {
        const containsPlanTypeFields = PLAN_TYPE_KEYS.some((key) => key in (fields as Record<string, unknown>))
          || PLAN_TYPE_STORE_KEYS.some((key) => key in (fields as Record<string, unknown>))

        if (containsPlanTypeFields) {
          showMessage({ status: 400, message: 'Missing plan_type for plan type update.' })
          return null
        }
      }

      const planTypeKey = planTypePayload?.planTypeKey ?? existing.plan_type
      const planTypeFields = planTypePayload?.planTypeFields

      if (planTypePayload && planTypePayload.planTypeKey !== existing.plan_type) {
        showMessage({ status: 400, message: 'Plan type cannot be changed after creation.' })
        return null
      }
      const planFields = stripPlanTypeFields(rawFields, planTypePayload)
      const normalizedPlanFields = {
        ...planFields,
        plan_type: planTypePayload?.planTypeKey ?? undefined,
      }

      if (!Object.keys(planFields).length && !planTypeFields) {
        showMessage({ status: 400, message: 'No plan fields provided for update.' })
        return null
      }

      const previousPlan = { ...existing }
      const planTypeInstance = existing.id
        ? findPlanTypeByPlanId(planTypeKey, existing.id)
        : null
      const previousPlanType = planTypeInstance ? { ...planTypeInstance } : null

      if (Object.keys(planFields).length) {
        updatePlan(clientId, (plan) => ({
          ...plan,
          ...(planFields as Partial<DeliveryPlan>),
        }))
      }

      if (planTypeFields && planTypeInstance) {
        updatePlanType(planTypeKey, planTypeInstance.client_id, (planType) => ({
          ...planType,
          ...(planTypeFields as PlanTypeFields),
        }))
      } else if (planTypeFields && !planTypeInstance) {
        console.warn('Plan type instance not found for update', {
          planId: existing.id,
          planTypeKey,
        })
      }

      try {
        const apiFields = mapPlanFieldsForApi(normalizedPlanFields)
        const payload: Record<string, unknown> = { ...apiFields }

        if (planTypeFields) {
          payload.plan_type = planTypeKey
          payload[planTypeKey] = mapPlanTypeFieldsForApi(planTypeKey, planTypeFields)
        }

        await planApi.updatePlan({
          target_id: existing.id,
          fields: payload as PlanUpdateFields,
        })

        return true
      } catch (error) {
        const resolved = resolveError(error, 'Unable to update delivery plan.')
        console.error('Failed to update plan', error)

        updatePlan(clientId, () => previousPlan)
        if (previousPlanType && planTypeInstance) {
          updatePlanType(planTypeKey, planTypeInstance.client_id, () => previousPlanType)
        }

        showMessage({ status: resolved.status, message: resolved.message })
        return null
      }
    },
    [showMessage],
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
    updatePlan: updatePlanInstance,
    deletePlan: deletePlanInstance,

  }
}
