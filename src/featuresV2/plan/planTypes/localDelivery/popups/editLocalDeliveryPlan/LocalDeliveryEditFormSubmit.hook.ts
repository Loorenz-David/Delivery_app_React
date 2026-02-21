import { useCallback } from 'react'
import type { RefObject } from 'react'

import { useMessageManager } from '@/message_manager'
import { makeInitialFormCopy } from '@/shared/data-validation/initialFormSnapshot'
import { useLocalDeliveryPlanSettingsMutations } from '@/featuresV2/plan/planTypes/localDelivery/hooks/settings/useLocalDeliveryPlanSettingsMutations'
import { usePlanMutations } from '@/featuresV2/plan/hooks/usePlanMutations'
import { useBaseControlls, usePopupManager, useSectionManager } from '@/shared/resource-manager/useResourceManager'

import type { LocalDeliveryEditFormState } from './LocalDeliveryEditForm.types'

type Props = {
  formState: LocalDeliveryEditFormState
  validateForm: () => boolean
  initialFormRef: RefObject<LocalDeliveryEditFormState | null>
}

export const useLocalDeliveryEditFormSubmitters = ({
  formState,
  validateForm,
  initialFormRef,
}: Props) => {
  const { showMessage } = useMessageManager()
  const { updateLocalDeliverySettings } = useLocalDeliveryPlanSettingsMutations()
  const { deletePlan } = usePlanMutations()
  const popupManager = usePopupManager()
  const sectionManager = useSectionManager()
  const  baseControlls = useBaseControlls()
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      showMessage({ message: 'Invalid form, check required fields.', status: 'warning' })
      return
    }
    if (!formState.local_delivery_plan_id) {
      showMessage({ message: 'Local delivery plan id is missing.', status: 'warning' })
      return
    }
    if (!formState.route_solution.id) {
      showMessage({ message: 'Route solution id is missing.', status: 'warning' })
      return
    }

    const payload = {
      local_delivery_plan_id: formState.local_delivery_plan_id,
      delivery_plan: {
        id: formState.delivery_plan.id,
        label: formState.delivery_plan.label,
        start_date: formState.delivery_plan.start_date,
        end_date: formState.delivery_plan.end_date,
      },
      local_delivery_plan: {
        driver_id: formState.route_solution.driver_id,
      },
      route_solution: {
        id: formState.route_solution.id,
        set_start_time: formState.route_solution.set_start_time,
        set_end_time: formState.route_solution.set_end_time,
        start_location: formState.route_solution.start_location,
        end_location: formState.route_solution.end_location,
        route_end_strategy: formState.route_solution.route_end_strategy,
        driver_id: formState.route_solution.driver_id,
      },
      create_variant_on_save: formState.create_variant_on_save,
    }


    const result = await updateLocalDeliverySettings(payload)

    if (result) {
      makeInitialFormCopy(initialFormRef, formState)
      popupManager.closeByKey('LocalDeliveryEditForm')
    }
  }, [formState, validateForm, showMessage, initialFormRef, updateLocalDeliverySettings, popupManager])

  const handleDelete = useCallback(async () => {
    if (!formState.delivery_plan.id) {
      showMessage({ message: 'Delivery plan id is missing.', status: 'warning' })
      return
    }

    const result = await deletePlan(formState.delivery_plan.id)

    if (result) {
      popupManager.closeByKey('LocalDeliveryEditForm')
      sectionManager.closeByKey('LocalDeliveryPage')
      baseControlls.closeBase()

    }
  }, [deletePlan, formState, showMessage, popupManager])

  return {
    handleSave,
    handleDelete,
  }
}
