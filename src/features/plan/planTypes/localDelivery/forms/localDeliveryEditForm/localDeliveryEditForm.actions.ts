import { useCallback } from 'react'
import type { RefObject } from 'react'

import { useMessageHandler } from '@/shared/message-handler'
import { makeInitialFormCopy } from '@/shared/data-validation/initialFormSnapshot'
import { useLocalDeliveryPlanSettingsMutations } from '@/features/plan/planTypes/localDelivery/controllers/localDeliveryPlanSettings.controller'
import { usePlanController } from '@/features/plan/controllers/plan.controller'
import { useBaseControlls, usePopupManager, useSectionManager } from '@/shared/resource-manager/useResourceManager'

import type { LocalDeliveryEditFormState } from './LocalDeliveryEditForm.types'

type Props = {
  formState: LocalDeliveryEditFormState
  validateForm: () => boolean
  initialFormRef: RefObject<LocalDeliveryEditFormState | null>
}

export const useLocalDeliveryEditFormActions = ({
  formState,
  validateForm,
  initialFormRef,
}: Props) => {
  const { showMessage } = useMessageHandler()
  const { updateLocalDeliverySettings } = useLocalDeliveryPlanSettingsMutations()
  const { deletePlan } = usePlanController()
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

    const result = await updateLocalDeliverySettings(formState)

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
