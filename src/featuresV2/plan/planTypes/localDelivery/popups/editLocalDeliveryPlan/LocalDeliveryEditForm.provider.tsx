import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { address, coordinates } from '@/types/address'

import { usePopupContext } from '@/shared/popups/MainPopup/PopupContext'
import { makeInitialFormCopy } from '@/shared/data-validation/initialFormSnapshot'

import { LocalDeliveryEditFormContextProvider } from './LocalDeliveryEditForm.context'
import { useLocalDeliveryEditFormContextData } from './LocalDeliveryEditFormContextData'
import { useLocalDeliveryEditFormWarnings } from './LocalDeliveryEditForm.warnings'
import { useLocalDeliveryEditFormSetters } from './LocalDeliveryEditFormSetters.hook'
import { useLocalDeliveryEditFormValidation } from './LocalDeliveryEditFormValidation'
import { useLocalDeliveryEditFormSubmitters } from './LocalDeliveryEditFormSubmit.hook'

import type { LocalDeliveryEditFormState } from './LocalDeliveryEditForm.types'
import type { RouteSolution } from '@/featuresV2/plan/planTypes/localDelivery/types/routeSolution'
import type { DeliveryPlan } from '@/featuresV2/plan/types/plan'
import { useLocalDeliveryEditFormPopupConfig } from './LocalDeliveryEditFormPopupConfig.hook'

type ProviderProps = {
  children: ReactNode
}


export const LocalDeliveryEditFormProvider = ({ children }: ProviderProps) => {
  const [formState, setFormState] = useState<LocalDeliveryEditFormState>(initialLocalDeliveryEditForm())
  const initialFormRef = useRef<LocalDeliveryEditFormState | null>(null)
  const { registerCloseGuard } = usePopupContext()

  const {
    localDeliveryPlanId,
    localDeliveryPlan,
    plan,
    selectedRouteSolution,
    routeSolutions,
  } = useLocalDeliveryEditFormContextData()

  const formWarnings = useLocalDeliveryEditFormWarnings()
  const formSetters = useLocalDeliveryEditFormSetters({ setFormState, formWarnings })

  const { validateForm } = useLocalDeliveryEditFormValidation({
    registerCloseGuard,
    formWarnings,
    formState,
    initialFormRef,
  })

  const submitters = useLocalDeliveryEditFormSubmitters({
    formState,
    validateForm,
    initialFormRef,
  })

  

  useEffect(() => {
    if (!localDeliveryPlanId) return
    setFormState((prev) => ({ ...prev, local_delivery_plan_id: localDeliveryPlanId }))
  }, [localDeliveryPlanId])

  useEffect(() => {
    if (!localDeliveryPlanId || !localDeliveryPlan || !plan || !selectedRouteSolution) {
      if (!initialFormRef.current) {
        makeInitialFormCopy(initialFormRef, formState)
      }
      return
    }

    setFormState((prev) => {
      const nextState = buildFormState(
        localDeliveryPlanId,
        plan,
        selectedRouteSolution,
        prev.create_variant_on_save,
      )
      makeInitialFormCopy(initialFormRef, nextState)
      return nextState
    })
  }, [localDeliveryPlanId, localDeliveryPlan, plan, selectedRouteSolution])

  const selectedVariantLabel = useMemo(() => {
    if (formState.route_solution.label) return formState.route_solution.label
    if (formState.route_solution.id) return `Variant ${formState.route_solution.id}`
    return null
  }, [formState.route_solution.id, formState.route_solution.label])

  const optimizationDate = useMemo(() => {
    if (!isOptimized(formState.route_solution.is_optimized)) return null
    return formatOptimizationDate(formState.route_solution.created_at)
  }, [formState.route_solution.created_at, formState.route_solution.is_optimized])

  
  useLocalDeliveryEditFormPopupConfig({selectedVariantLabel, optimizationDate})

  const hasMultipleVariants = (routeSolutions?.length ?? 0) >= 1

  const value = {
    formState,
    formWarnings,
    hasMultipleVariants,
    ...formSetters,
    ...submitters,
  }

  return (
    <LocalDeliveryEditFormContextProvider value={value}>
      {children}
    </LocalDeliveryEditFormContextProvider>
  )
}




const initialLocalDeliveryEditForm = (): LocalDeliveryEditFormState => ({
  local_delivery_plan_id: null,
  delivery_plan: {
    client_id: null,
    label: '',
    start_date: '',
    end_date: '',
  },
  route_solution: {
    client_id: null,
    label: null,
    start_location: null,
    end_location: null,
    set_start_time: null,
    set_end_time: null,
    route_end_strategy: 'round_trip',
    driver_id: null,
    created_at: null,
    is_optimized: null,
  },
  create_variant_on_save: false,
})

const normalizeTimeValue = (value?: string | null) => {
  if (!value) return null
  const match = value.match(/^(\d{2}:\d{2})/)
  return match ? match[1] : value
}

const coerceAddress = (value: Record<string, unknown> | null | undefined): address | null => {
  if (!value || typeof value !== 'object') return null

  if ('street_address' in value && 'coordinates' in value) {
    return value as address
  }

  if ('raw_address' in value && 'coordinates' in value) {
    const coords = value.coordinates as coordinates | undefined
    if (!coords) return null

    return {
      street_address: value.raw_address as string,
      city: value.city as string | undefined,
      country: value.country as string | undefined,
      postal_code: value.postal_code as string | undefined,
      coordinates: coords,
    }
  }

  return null
}

const buildFormState = (
  localDeliveryPlanId: number,
  plan: DeliveryPlan,
  routeSolution: RouteSolution,
  createVariantOnSave: boolean,
): LocalDeliveryEditFormState => ({
  local_delivery_plan_id: localDeliveryPlanId,
  delivery_plan: {
    id: plan.id ?? undefined,
    client_id: plan.client_id ?? null,
    label: plan.label ?? '',
    start_date: plan.start_date ?? '',
    end_date: plan.end_date ?? '',
  },
  route_solution: {
    id: routeSolution.id ?? undefined,
    client_id: routeSolution.client_id ?? null,
    label: routeSolution.label ?? null,
    start_location: coerceAddress(routeSolution.start_location as Record<string, unknown> | null),
    end_location: coerceAddress(routeSolution.end_location as Record<string, unknown> | null),
    set_start_time: normalizeTimeValue(routeSolution.set_start_time),
    set_end_time: normalizeTimeValue(routeSolution.set_end_time),
    route_end_strategy: routeSolution.route_end_strategy ?? 'round_trip',
    driver_id: routeSolution.driver_id ?? null,
    created_at: routeSolution.created_at ?? null,
    is_optimized: routeSolution.is_optimized ?? null,
  },
  create_variant_on_save: createVariantOnSave,
})

const isOptimized = (value?: string | null) =>
  value === 'optimize' || value === 'partial optimize'

const formatOptimizationDate = (value?: string | null) => {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
