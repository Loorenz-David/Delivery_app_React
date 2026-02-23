import { useEffect } from 'react'
import { StackIcon } from '@/assets/icons'
import { usePopupContext } from '@/shared/popups/MainPopup/PopupContext'
import type { PlanFormMode } from '@/featuresV2/plan/forms/planForm/PlanForm.types'
import { usePopupManager } from '@/shared/resource-manager/useResourceManager'

export const usePlanFormPopupConfig = () => {
    const popupManager = usePopupManager()
    const entryPayload = popupManager.getEntryPayload('PlanForm') as { mode?: PlanFormMode } | undefined
    const mode = entryPayload?.mode ?? 'create'
    const { setPopupHeader } = usePopupContext()

    useEffect(() => {
        const headerLabels = planHeaderLabels(mode)
        setPopupHeader({
            label: headerLabels.label,
            description: headerLabels.description,
            icon: <StackIcon className={'h-5 w-5 stroke-[var(--color-muted)]'} />,
        })
    }, [mode, setPopupHeader])
}

const planHeaderLabels = (mode: PlanFormMode) => {
    if (mode == 'create') {
        return {
            label: 'Create a Plan',
            description: 'choose between the plan types.',
        }
    }

    return {
        label: undefined,
        description: 'update plan.',
    }
}
