import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { usePopupContext } from '@/shared/popups/MainPopup/PopupContext'
import { makeInitialFormCopy } from '@/shared/data-validation/initialFormSnapshot'

import { LocalDeliveryEditFormContextProvider } from './LocalDeliveryEditForm.context'
import { useLocalDeliveryEditFormContextData } from './LocalDeliveryEditFormContextData'
import { useLocalDeliveryEditFormWarnings } from './LocalDeliveryEditForm.warnings'
import { useLocalDeliveryEditFormSetters } from './localDeliveryEditForm.setters'
import { useLocalDeliveryEditFormValidation } from './LocalDeliveryEditForm.validation'
import { useLocalDeliveryEditFormActions } from './localDeliveryEditForm.actions'
import { buildFormState, initialLocalDeliveryEditForm } from './localDeliveryEditForm.bootstrap'

import type { LocalDeliveryEditFormState } from './LocalDeliveryEditForm.types'

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

  const actions = useLocalDeliveryEditFormActions({
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

  const hasMultipleVariants = (routeSolutions?.length ?? 0) >= 1

  const value = {
    formState,
    formWarnings,
    hasMultipleVariants,
    formSetters,
    actions,
  }

  return (
    <LocalDeliveryEditFormContextProvider value={value}>
      {children}
    </LocalDeliveryEditFormContextProvider>
  )
}
