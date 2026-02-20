import { useEffect } from 'react'
import { StackIcon } from '@/assets/icons'
import { usePopupContext } from '@/shared/popups/MainPopup/PopupContext'

import { usePlanForm } from './PlanForm.context'
import type { PlanFormMode } from './PlanForm.types'

export const usePlanFormPopupConfig = () => {
    const { mode } = usePlanForm()
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
