import { useEffect } from 'react'
import type { RefObject } from 'react'

import { hasFormChanges } from '@/shared/data-validation/compareChanges'

import type { LocalDeliveryEditFormState } from './LocalDeliveryEditForm.types'
import type { LocalDeliveryEditFormWarnings } from './LocalDeliveryEditForm.types'

type Props = {
  registerCloseGuard: (fn: () => boolean) => void
  formWarnings: LocalDeliveryEditFormWarnings
  formState: LocalDeliveryEditFormState
  initialFormRef: RefObject<LocalDeliveryEditFormState | null>
}

export const useLocalDeliveryEditFormValidation = ({
  registerCloseGuard,
  formWarnings,
  formState,
  initialFormRef,
}: Props) => {
  const validateForm = () => {
    const valid = [
      formWarnings.planDateWarning.validate({
        start_date: formState.delivery_plan.start_date,
        end_date: formState.delivery_plan.end_date,
      }),
      formWarnings.routeTimeWarning.validate({
        start_date: formState.delivery_plan.start_date,
        end_date: formState.delivery_plan.end_date,
        start_time: formState.route_solution.set_start_time,
        end_time: formState.route_solution.set_end_time,
      }),
    ]
    return valid.every((entry) => entry === true)
  }

  const allowClose = () => !hasFormChanges(formState, initialFormRef)

  useEffect(() => {
    const unregister = registerCloseGuard(allowClose)
    return unregister
  }, [formState])

  return {
    validateForm,
    hasChanges: allowClose,
  }
}
