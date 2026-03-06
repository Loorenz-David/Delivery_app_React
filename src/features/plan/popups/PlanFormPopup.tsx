import { useMemo, useState } from 'react'

import type { StackComponentProps } from '@/shared/stack-manager/types'
import {
  FeaturePopupBody,
  FeaturePopupClosePrompt,
  FeaturePopupHeader,
  FeaturePopupShell,
  useFeaturePopupCloseController,
} from '@/shared/popups/featurePopup'

import { PlanFormFeature } from '@/features/plan/forms/planForm/PlanForm'
import type { PopupPayload, PlanFormMode } from '@/features/plan/forms/planForm/PlanForm.types'

const resolveHeaderModel = (mode: PlanFormMode) => {
  if (mode === 'create') {
    return {
      title: 'Create a Plan',
      subtitle: 'choose between the plan types.',
    }
  }

  return {
    title: 'Edit plan',
    subtitle: 'update plan.',
  }
}

export const PlanFormPopup = ({ payload, onClose }: StackComponentProps<PopupPayload>) => {
  const mode = payload?.mode ?? 'create'
  const header = useMemo(() => resolveHeaderModel(mode), [mode])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const closeController = useFeaturePopupCloseController({
    hasUnsavedChanges,
    onClose,
  })

  return (
    <>
      <FeaturePopupShell onRequestClose={closeController.requestClose} size="md" variant="center">
        <FeaturePopupHeader
          title={header.title}
          subtitle={header.subtitle}
          onClose={closeController.requestClose}
        />
        <FeaturePopupBody className="px-3 py-5">
          <PlanFormFeature
            payload={payload}
            onSuccessClose={closeController.confirmClose}
            onUnsavedChangesChange={setHasUnsavedChanges}
          />
        </FeaturePopupBody>
      </FeaturePopupShell>
      <FeaturePopupClosePrompt controller={closeController} />
    </>
  )
}
